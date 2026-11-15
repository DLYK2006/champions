/* eslint-disable @typescript-eslint/no-require-imports -- External Playwright runner. */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
(async () => {
  const directory = path.resolve("app/digin-ui-side-views-fixture");
  assert.ok(!fs.existsSync(directory), "Refusing to overwrite fixture route");
  const browser = await chromium.launch();
  try {
    fs.mkdirSync(directory);
    fs.writeFileSync(path.join(directory, "page.tsx"),
      'export {default} from "@/components/ui/tests/side-views-fixture";\n');
    const page = await browser.newPage({ viewport: { width: 1050, height: 1100 } });
    page.on("pageerror", (error) => console.error(error.message));
    await page.goto(`${process.env.UI_CHECK_URL || "http://localhost:3000"}/scan`);
    await page.goto(`${process.env.UI_CHECK_URL || "http://localhost:3000"}/digin-ui-side-views-fixture`);
    const canvas = page.getByLabel("Side view contact sheet");
    await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready === "true");
    await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
    if (process.env.UI_CHECK_OUTPUT) {
      fs.mkdirSync(process.env.UI_CHECK_OUTPUT, { recursive: true });
      await canvas.screenshot({ path: path.join(process.env.UI_CHECK_OUTPUT, "side-views.png") });
    }
    assert.equal(await canvas.getAttribute("data-lost-face"), "0", "Short hair must preserve both painted side faces in every frame");
    const paidReport = JSON.parse(await canvas.getAttribute("data-paid-report"));
    for (const item of paidReport) {
      assert.equal(item.changedCells, 24, `${item.id}: visible in every direction and frame`);
      assert.equal(item.bodyMaskChanges, 0, `${item.id}: preserve the painted body silhouette`);
      assert.equal(item.faceChanges, 0, `${item.id}: preserve the face silhouette`);
    }
    assert.equal(paidReport.length, 6, "Six paid wardrobe designs");
    console.log("PASS: short hair preserves both side faces in all six frames.");
    console.log("PASS: six paid wardrobe designs are visible in all 24 cells and preserve body/face silhouettes.");
  } finally {
    await browser.close();
    fs.unlinkSync(path.join(directory, "page.tsx"));
    fs.rmdirSync(directory);
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
