import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const sourceDir = process.argv[2] || "dist/chrome";
const manifestPath = path.join(sourceDir, "manifest.json");

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS ${message}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (manifest.manifest_version === 3) pass("manifest_version is 3");
else fail("manifest_version must be 3");

if (manifest.action?.default_popup && fs.existsSync(path.join(sourceDir, manifest.action.default_popup))) {
  pass(`default_popup exists: ${manifest.action.default_popup}`);
} else {
  fail("default_popup is missing or points to a missing file");
}

if (manifest.options_page && fs.existsSync(path.join(sourceDir, manifest.options_page))) {
  pass(`options_page exists: ${manifest.options_page}`);
} else {
  fail("options_page is missing or points to a missing file");
}

function imageDimensions(filePath) {
  const output = execFileSync("file", [filePath], { encoding: "utf8" });
  const match = output.match(/(\d+)\s*x\s*(\d+)/i);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

for (const [size, iconPath] of Object.entries(manifest.icons || {})) {
  const filePath = path.join(sourceDir, iconPath);
  if (!fs.existsSync(filePath)) {
    fail(`icon ${size} missing: ${iconPath}`);
    continue;
  }

  const dimensions = imageDimensions(filePath);
  const expected = Number(size);
  if (dimensions?.width === expected && dimensions?.height === expected) {
    pass(`icon ${size} exists and is ${expected}x${expected}: ${iconPath}`);
  } else {
    fail(`icon ${size} has unexpected dimensions: ${iconPath}`);
  }
}

for (const [size, iconPath] of Object.entries(manifest.action?.default_icon || {})) {
  const filePath = path.join(sourceDir, iconPath);
  if (!fs.existsSync(filePath)) {
    fail(`action icon ${size} missing: ${iconPath}`);
    continue;
  }

  const dimensions = imageDimensions(filePath);
  const expected = Number(size);
  if (dimensions?.width === expected && dimensions?.height === expected) {
    pass(`action icon ${size} exists and is ${expected}x${expected}: ${iconPath}`);
  } else {
    fail(`action icon ${size} has unexpected dimensions: ${iconPath}`);
  }
}
