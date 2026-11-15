/* eslint-disable @typescript-eslint/no-require-imports -- External Playwright runner. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path");
(async () => {
  const browser = await chromium.launch();
  const dir = path.resolve("app/digin-ui-catalog-fixture");
  if (fs.existsSync(dir)) throw Error("Refusing to overwrite fixture");
  try {
    const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
      }),
      base = process.env.UI_CHECK_URL || "http://localhost:3000";
    fs.mkdirSync(dir);
    fs.writeFileSync(
      path.join(dir, "page.tsx"),
      'export {default} from "@/components/ui/tests/presentation-fixture";\n',
    );
    await page.goto(base + "/scan");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    assert.deepEqual(await nav.getByRole("link").allTextContents(), [
      "Home",
      "Profile",
      "Scan",
      "Community",
      "Shop",
    ]);
    await page.goto(base + "/digin-ui-catalog-fixture");
    await page.addStyleTag({ content: "nextjs-portal{display:none}" });
    await page
      .getByRole("button", { name: "Preview Home", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("link", { name: "Customize", exact: true })
        .getAttribute("href"),
      "/profile?section=wardrobe",
    );
    assert.equal(
      await page.locator(".room-weather").getAttribute("href"),
      "/profile?section=calendar",
    );
    await page
      .getByRole("button", { name: "Preview Shop", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Starter wardrobe", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Coin shop", exact: true })
        .count(),
      0,
    );
    const hoodie = page
      .locator(".shop-card")
      .filter({
        has: page.getByRole("heading", {
          name: "Woodland Hoodie",
          exact: true,
        }),
      });
    assert.equal(await hoodie.locator(".item-tag").innerText(), "OWNED");
    assert.equal(
      await hoodie.getByRole("button", { name: /Buy|Equip|Unequip/ }).count(),
      0,
    );
    assert.equal(
      await hoodie.getByRole("link", { name: /Wardrobe/ }).getAttribute("href"),
      "/profile?section=wardrobe",
    );
    console.log(
      "PASS: five ordered tabs, Home deep links and purchase-only catalog with owned items retained.",
    );
  } finally {
    await browser.close();
    if (fs.existsSync(dir)) {
      fs.unlinkSync(path.join(dir, "page.tsx"));
      fs.rmdirSync(dir);
    }
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
