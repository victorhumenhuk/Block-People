import { chromium, expect, test, type Browser, type BrowserContext } from "@playwright/test";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sourceExtensionPath = path.resolve(process.cwd(), "dist/chrome");
const screenshotDir = path.resolve(process.cwd(), "tests/screenshots");
const sites = [
  ["google", "https://www.google.com"],
  ["youtube", "https://www.youtube.com"],
  ["x", "https://x.com"],
  ["reddit", "https://www.reddit.com"],
  ["news-ycombinator", "https://news.ycombinator.com"],
  ["bbc", "https://www.bbc.co.uk"],
  ["theguardian", "https://www.theguardian.com"],
] as const;

const componentExtensionIds = new Set([
  "ahfgeienlihckogmohjhadlkjgocpleb",
  "mhjfbmdgcfjbbpaeojofohoefgiehjai",
  "nkeimhogjdpnpccoofpliimaahmaaome",
  "fignfifoniblkonapihmkfakmlgkbkcf",
]);

let browser: Browser;
let context: BrowserContext;
let chromeProcess: ChildProcessWithoutNullStreams;
let tmpRoot = "";
let extensionId = "";
let browserLog = "";

test.describe.configure({ mode: "serial" });

function extensionError(text: string) {
  return text.includes("chrome-extension://");
}

async function waitForFile(filePath: string) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (fs.existsSync(filePath)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timed out waiting for ${filePath}`);
}

async function waitForExtensionId() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ids = Array.from(browserLog.matchAll(/extension id:\s+([a-p]{32})/g), (match) => match[1]);
    const id = ids.find((candidate) => !componentExtensionIds.has(candidate));
    if (id) return id;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Could not resolve loaded extension id from Chrome extension logs.");
}

test.beforeAll(async () => {
  fs.mkdirSync(screenshotDir, { recursive: true });

  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "block-people-smoke-"));
  const extensionPath = path.join(tmpRoot, "extension");
  const userDataDir = path.join(tmpRoot, "profile");
  fs.cpSync(sourceExtensionPath, extensionPath, { recursive: true });
  fs.mkdirSync(userDataDir);

  chromeProcess = spawn(chromium.executablePath(), [
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    "--headless=new",
    "--remote-debugging-port=0",
    "--enable-logging=stderr",
    "--v=1",
    "about:blank",
  ]);

  chromeProcess.stderr.on("data", (chunk) => {
    browserLog += chunk.toString();
  });

  const activePortPath = path.join(userDataDir, "DevToolsActivePort");
  await waitForFile(activePortPath);
  const [port] = fs.readFileSync(activePortPath, "utf8").trim().split("\n");
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  context = browser.contexts()[0];

  const page = context.pages()[0] || (await context.newPage());
  await page.goto("https://example.com", { waitUntil: "domcontentloaded", timeout: 45_000 });
  extensionId = await waitForExtensionId();
  await page.close();
});

test.afterAll(async () => {
  await browser?.close().catch(() => {});
  chromeProcess?.kill();
  if (tmpRoot) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  }
});

for (const [name, url] of sites) {
  test(`site smoke: ${name}`, async () => {
    const page = await context.newPage();
    const extensionErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const location = message.location();
      const text = `${location.url || ""} ${message.text()}`;
      if (extensionError(text)) extensionErrors.push(text);
    });

    page.on("pageerror", (error) => {
      const text = error.stack || error.message;
      if (extensionError(text)) extensionErrors.push(text);
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(2_000);
    await page.close();

    expect(extensionErrors).toEqual([]);
  });
}

test("popup screenshots: light and dark", async () => {
  const page = await context.newPage();
  const widths = [320, 375, 768, 1024];
  const colorSchemes = ["light", "dark"] as const;

  for (const colorScheme of colorSchemes) {
    await page.emulateMedia({ colorScheme });

    for (const width of widths) {
      await page.setViewportSize({ width, height: 640 });
      await page.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: "domcontentloaded" });
      await page.screenshot({
        path: path.join(screenshotDir, `popup-${colorScheme}-${width}.png`),
        fullPage: true,
      });
    }
  }

  await page.close();
});
