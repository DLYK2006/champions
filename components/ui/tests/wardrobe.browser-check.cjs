/* eslint-disable @typescript-eslint/no-require-imports -- External Playwright runner. */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
(async () => {
  const directory = path.resolve("app/digin-ui-wardrobe-fixture");
  if (fs.existsSync(directory))
    throw Error("Refusing to overwrite fixture route");
  const browser = await chromium.launch();
  try {
    fs.mkdirSync(directory);
    fs.writeFileSync(
      path.join(directory, "page.tsx"),
      'export {default} from "@/components/ui/tests/wardrobe-fixture";\n',
    );
    const page = await browser.newPage({
      viewport: { width: 900, height: 800 },
      reducedMotion: "reduce",
    });
    await page.goto(`${process.env.UI_CHECK_URL || "http://localhost:3000"}/scan`);
    await page.goto(
      `${process.env.UI_CHECK_URL || "http://localhost:3000"}/digin-ui-wardrobe-fixture`,
    );
    await page.addStyleTag({ content: "nextjs-portal {display:none}" });
    await page.getByRole("button", { name: "Inspect rear hair" }).click();
    await page.waitForFunction(
      () => document.querySelector("output")?.textContent,
    );
    const report = JSON.parse(
      await page.getByLabel("Hair frame report").textContent(),
    );
    for (const top of ["shortFlat", "curly"])
      assert.equal(
        new Set(report[top]).size,
        1,
        `${top}: rear hair must stay registered across every walk frame`,
      );
    assert.notEqual(
      report._legacy[0],
      report._legacy[1],
      "Explicit No hat must remove legacy cap",
    );
    assert.equal(
      report._legacy[2],
      report._legacy[3],
      "Crown must replace legacy cap",
    );
    assert.equal(
      await page
        .getByRole("img", { name: "Unified avatar preview" })
        .locator("canvas")
        .count(),
      1,
      "Portrait must use shared sprite canvas",
    );
    assert.equal(
      await page.locator("svg.pixel-avatar").count(),
      0,
      "No legacy avatar renderer",
    );
    await page.setViewportSize({ width: 1280, height: 800 });
    await page
      .getByRole("button", { name: "All", exact: true })
      .scrollIntoViewIfNeeded();
    const frame = await page.locator(".wardrobe-panel").boundingBox(),
      catalog = await page.locator(".shop-catalog").boundingBox();
    assert.ok(
      Math.abs(frame.y - catalog.y) < 1 &&
        Math.abs(frame.height - catalog.height) < 2,
      "Avatar frame must match the complete item frame height",
    );
    if (process.env.UI_CHECK_OUTPUT) {
      fs.mkdirSync(process.env.UI_CHECK_OUTPUT, { recursive: true });
      await page.locator(".shop-page").screenshot({
        path: process.env.UI_CHECK_OUTPUT + "/shop-matched-frame.png",
      });
    }
    await page.getByRole("button", { name: "Render wardrobe sheet" }).click();
    await page.waitForFunction(
      () => document.querySelector("#sheet-report")?.textContent,
    );
    const hashes = JSON.parse(
      await page.getByLabel("Wardrobe pixel report").textContent(),
    );
    for (const [slot, values] of Object.entries(hashes))
      if (!slot.startsWith("_"))
        assert.equal(
          new Set(values).size,
          2,
          `${slot}: two distinct rendered designs`,
        );
    assert.equal(
      new Set(hashes._combinations).size,
      16,
      "Every complete outfit combination renders distinctly",
    );
    assert.equal(
      new Set(hashes._bodyMasks).size,
      1,
      "All combinations preserve the real body/foot silhouettes across all 24 cells",
    );
    if (process.env.UI_CHECK_OUTPUT) {
      fs.mkdirSync(process.env.UI_CHECK_OUTPUT, { recursive: true });
      await page.locator("#contact-sheet").screenshot({
        path: process.env.UI_CHECK_OUTPUT + "/wardrobe-contact-sheet.png",
      });
    }
    console.log(
      "PASS: stable rear hair, unified sprite portrait, eight wearable options and matched Shop frame height.",
    );
  } finally {
    await browser.close();
    fs.unlinkSync(path.join(directory, "page.tsx"));
    fs.rmdirSync(directory);
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
