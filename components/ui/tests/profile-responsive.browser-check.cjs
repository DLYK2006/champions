/* eslint-disable @typescript-eslint/no-require-imports -- External Playwright runner; dummy backend only. */
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const assert = require("node:assert/strict");
const harness = require("./profile-harness.cjs");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch();
  try {
    const { context, page, base, model, errors } = await harness(browser);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/profile?section=wardrobe");
      await page
        .locator(".profile-avatar canvas[data-sprite-ready=true]")
        .waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `No page overflow at ${width}`,
      );
      const nav = page.getByRole("navigation", { name: "Main navigation" });
      const boxes = await nav.getByRole("link").evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, right: r.right, bottom: r.bottom, width: r.width };
        }),
      );
      assert.equal(boxes.length, 5);
      assert.ok(
        boxes.every(
          (b, i) =>
            b.width >= 44 &&
            b.x >= 0 &&
            b.right <= width &&
            b.bottom <= 900 &&
            (i === 0 || b.x >= boxes[i - 1].right),
        ),
        `All tabs fit ${width}`,
      );
      const stage = await page.locator(".profile-avatar").boundingBox(),
        character = await page
          .locator(".profile-avatar .room-character")
          .boundingBox();
      assert.ok(
        character.y >= stage.y &&
          character.y + character.height < stage.y + stage.height,
        `Whole sprite fits ${width}`,
      );
      if (width === 1440) {
        const side = await page.locator(".profile-sidebar").boundingBox();
        assert.ok(stage.width > side.width * 1.7);
        assert.ok(character.height > 350);
      }
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
      if (process.env.UI_CHECK_OUTPUT) {
        fs.mkdirSync(process.env.UI_CHECK_OUTPUT, { recursive: true });
        await page.screenshot({
          path: process.env.UI_CHECK_OUTPUT + `/profile-${width}.png`,
        });
      }
    }
    await page.goto(base + "/profile");
    await page.getByLabel("Height (cm)", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Imperial", exact: true }).click();
    await page.getByRole("button", { name: "Metric", exact: true }).click();
    assert.equal(
      await page.getByLabel("Height (cm)", { exact: true }).inputValue(),
      "175",
    );
    assert.equal(
      await page.getByLabel("Weight (kg)", { exact: true }).inputValue(),
      "70",
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Save Changes", exact: true })
        .isDisabled(),
      true,
      "Unit round trip preserves exact metric values",
    );
    await page.getByLabel("Height (cm)", { exact: true }).fill("180");
    await page.getByRole("button", { name: "Wardrobe", exact: true }).click();
    await page
      .getByRole("button", { name: "Moss beanie", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save Outfit", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Outfit saved." })
      .waitFor();
    assert.equal(
      model.profile.height_cm,
      175,
      "Saving outfit does not commit settings",
    );
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page
      .locator("#profile-settings-toggle[aria-expanded=true]")
      .waitFor();
    assert.equal(
      await page.getByLabel("Height (cm)", { exact: true }).inputValue(),
      "180",
      "Settings draft survives wardrobe save",
    );
    await page
      .getByRole("button", { name: "Reset Changes", exact: true })
      .click();
    assert.equal(
      await page.getByLabel("Height (cm)", { exact: true }).inputValue(),
      "175",
    );
    await page.getByRole("button", { name: "Imperial", exact: true }).click();
    await page.getByLabel("Weight (lb)", { exact: true }).fill("165");
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Settings saved." })
      .waitFor();
    assert.ok(Math.abs(model.profile.weight_kg - 74.84274105) < 1e-7);
    await page.getByRole("button", { name: "Wardrobe", exact: true }).click();
    await page
      .getByRole("button", { name: "Linen shirt", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Reset Changes", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Woodland Hoodie", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.deepEqual(errors, []);
    await context.close();
    for (const options of [{ session: false }, { complete: false }]) {
      const h = await harness(browser, options);
      await h.page.goto(h.base + "/profile");
      await h.page.waitForURL(/onboarding/);
      assert.ok(!h.model.calls.some((c) => c.path.includes("shop_items")));
      await h.context.close();
    }
    const failed = await harness(browser);
    failed.model.failLoad = true;
    await failed.page.goto(failed.base + "/profile");
    await failed.page
      .getByRole("button", { name: "Try again", exact: true })
      .waitFor();
    failed.model.failLoad = false;
    await failed.page
      .getByRole("button", { name: "Try again", exact: true })
      .click();
    await failed.page
      .getByRole("button", { name: "Wardrobe", exact: true })
      .waitFor();
    await failed.context.close();
    console.log(
      "PASS: 320/390/768/1440 layouts, full-body avatar, five accessible tabs, axe, units, independent drafts, resets, auth/onboarding guards and retry.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
