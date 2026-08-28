#!/usr/bin/env node
/** Capture landing page screenshots for GitHub README */

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function main() {
  const outDir = path.join(__dirname, "..", "assets", "screenshots");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const url = process.env.SCREENSHOT_URL || "https://www.agentflowengine.com";
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.screenshot({ path: path.join(outDir, "landing-hero.png"), fullPage: false });

  await page.evaluate(() => document.querySelector("#benchmark")?.scrollIntoView());
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "landing-benchmark.png"), fullPage: false });

  await browser.close();
  console.log("Saved assets/screenshots/landing-hero.png");
  console.log("Saved assets/screenshots/landing-benchmark.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
