/* eslint-disable @typescript-eslint/no-require-imports -- Dummy backend catalog/wardrobe regression. */
const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  harness = require("./profile-harness.cjs");
(async () => {
  const browser = await chromium.launch();
  try {
    const { context, page, base, model, errors } = await harness(browser);
    await page.goto(base + "/shop");
    await page
      .getByRole("heading", { name: "Sage Sweater", exact: true })
      .waitFor();
    assert.equal(await page.locator(".shop-card").count(), 6);
    assert.equal(
      await page.getByRole("heading", { name: "Crown", exact: true }).count(),
      0,
    );
    for (const category of ["Shirts", "Pants", "Hats"]) {
      await page.getByRole("button", { name: category, exact: true }).click();
      assert.equal(await page.locator(".shop-card").count(), 2);
      const expected = {
        Shirts: ["Sage Sweater", "Rust Flannel"],
        Pants: ["Meadow Trousers", "Slate Cargos"],
        Hats: ["Acorn Cap", "Fisher Bucket"],
      };
      assert.deepEqual(
        await page.locator(".shop-item-name").allTextContents(),
        expected[category],
      );
    }
    await page.getByRole("button", { name: "All", exact: true }).click();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Shop fits ${width}`,
      );
      if (width > 760) {
        await page.waitForFunction(() => {
          const panel = document.querySelector('.wardrobe-panel').getBoundingClientRect();
          const card = document.querySelector('.shop-card').getBoundingClientRect();
          return Math.abs(panel.bottom - card.bottom) < 2;
        }, null, { timeout: 3000 });
      }
      if (width === 320 || width === 1440) {
        const { default: AxeBuilder } = require("@axe-core/playwright");
        const report = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          report.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
          [],
        );
      }
    }
    await page
      .getByRole("button", { name: "Preview Rust Flannel", exact: true })
      .click();
    assert.deepEqual(model.owned, ["hoodie"]);
    for (const [name, cost] of [
      ["Sage Sweater", 40],
      ["Meadow Trousers", 30],
      ["Acorn Cap", 25],
    ]) {
      await page
        .getByRole("button", {
          name: `Buy ${name} for ${cost} coins`,
          exact: true,
        })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: `${name} is now in your Wardrobe.` })
        .waitFor();
    }
    assert.equal(model.profile.coin_balance, 25);
    assert.equal(model.buyCount, 3);
    await page.getByRole("link", { name: "Profile", exact: true }).click();
    await page.getByRole("button", { name: "Wardrobe", exact: true }).click();
    for (const name of ["Sage Sweater", "Meadow Trousers", "Acorn Cap"])
      await page.getByRole("button", { name, exact: true }).click();
    assert.deepEqual(
      model.profile.equipped,
      ["hoodie"],
      "Try-on remains local",
    );
    await page
      .getByRole("button", { name: "Save Outfit", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Outfit saved." })
      .waitFor();
    assert.deepEqual(
      new Set(model.profile.equipped),
      new Set(["sage-sweater", "meadow-trousers", "acorn-cap"]),
    );
    assert.equal(model.profile.coin_balance, 25);
    await page.reload();
    await page
      .getByRole("button", { name: "Meadow Trousers", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Meadow Trousers", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page
      .getByRole("button", { name: "Indigo trousers", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save Outfit", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Outfit saved." })
      .waitFor();
    assert.deepEqual(
      new Set(model.profile.equipped),
      new Set(["sage-sweater", "acorn-cap"]),
      "Free pants replace only paid pants",
    );
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      "PASS: six real catalog rows, two per category, retired Crown, paid ownership/purchase/save/reload and slot isolation.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
