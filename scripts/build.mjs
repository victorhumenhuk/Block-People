import { cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceDir = path.join(root, "Chrome");
const distDir = path.join(root, "dist", "chrome");

const requiredIconSizes = ["16", "32", "48", "128"];
const disallowedSourcePatterns = [
  /unsafe-eval/,
  /unsafe-inline/,
  /fetch\(/,
  /XMLHttpRequest/,
  /navigator\.sendBeacon/,
  /new WebSocket/,
  /new EventSource/,
  /APP[_]STORE[_]URL/,
];

function rel(file) {
  return path.relative(root, file);
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function assertExists(file, label = file) {
  if (!existsSync(file)) {
    throw new Error(`Missing ${label}: ${rel(file)}`);
  }
}

async function assertManifestPath(value, label) {
  if (!value) {
    throw new Error(`Missing manifest path for ${label}.`);
  }
  await assertExists(path.join(sourceDir, value), label);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.name === ".DS_Store") continue;
    if (entry.isDirectory()) {
      files.push(...(await walk(file)));
    } else {
      files.push(file);
    }
  }

  return files;
}

async function validateManifest(manifest) {
  if (manifest.manifest_version !== 3) {
    throw new Error("manifest_version must be 3.");
  }

  for (const size of requiredIconSizes) {
    await assertManifestPath(manifest.icons?.[size], `icon ${size}`);
    await assertManifestPath(manifest.action?.default_icon?.[size], `action icon ${size}`);
  }

  await assertManifestPath(manifest.action?.default_popup, "popup");
  await assertManifestPath(manifest.options_page, "options_page");

  for (const script of manifest.content_scripts || []) {
    for (const css of script.css || []) {
      await assertExists(path.join(sourceDir, css), `content css ${css}`);
    }
    for (const js of script.js || []) {
      await assertExists(path.join(sourceDir, js), `content script ${js}`);
    }
  }
}

async function auditSource(files) {
  for (const file of files) {
    if (!/\.(js|html|json)$/u.test(file)) continue;
    const text = await readFile(file, "utf8");
    for (const pattern of disallowedSourcePatterns) {
      if (pattern.test(text)) {
        throw new Error(`Disallowed pattern ${pattern} in ${rel(file)}`);
      }
    }
  }
}

async function directorySize(dir) {
  const files = await walk(dir);
  let total = 0;
  const rows = [];

  for (const file of files) {
    const size = (await stat(file)).size;
    total += size;
    rows.push({ file: rel(file), size });
  }

  rows.sort((a, b) => b.size - a.size);
  return { total, rows };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

await rm(path.join(root, "dist"), { recursive: true, force: true });
await mkdir(path.dirname(distDir), { recursive: true });
await cp(sourceDir, distDir, {
  recursive: true,
  filter: (source) => path.basename(source) !== ".DS_Store",
});

const manifest = await readJson(path.join(sourceDir, "manifest.json"));
await validateManifest(manifest);
await auditSource(await walk(sourceDir));

const sourceSize = await directorySize(sourceDir);
const distSize = await directorySize(distDir);

console.log("Bundle size report");
console.log(`Source: ${formatBytes(sourceSize.total)} (${sourceSize.rows.length} files)`);
console.log(`Package: ${formatBytes(distSize.total)} (${distSize.rows.length} files)`);
console.log("Largest files:");
for (const row of distSize.rows.slice(0, 8)) {
  console.log(`- ${row.file}: ${formatBytes(row.size)}`);
}

if (distSize.total > 200 * 1024) {
  console.warn("Package exceeds 200 KB unzipped target.");
}
