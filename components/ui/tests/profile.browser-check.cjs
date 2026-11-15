/* eslint-disable @typescript-eslint/no-require-imports -- External Playwright runner. */
const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  harness = require("./profile-harness.cjs");
(async () => {
  const browser = await chromium.launch();
  try {
    const { context, page, base, model, errors } = await harness(browser);
    await page.goto(base + "/profile?section=wardrobe");
    await page.getByRole("button", { name: "Wardrobe", exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Wardrobe", exact: true })
        .getAttribute("aria-expanded"),
      "true",
    );
    for (const name of [
      "Moss beanie",
      "Straw sunhat",
      "Linen shirt",
      "Forest jacket",
      "Indigo trousers",
      "Cocoa trousers",
      "Canvas sneakers",
      "Hiking boots",
    ])
      assert.equal(
        await page.getByRole("button", { name, exact: true }).count(),
        1,
      );
    assert.equal(
      await page
        .getByRole("button", { name: "Sunglasses", exact: true })
        .count(),
      0,
      "Unowned item stays out of wardrobe",
    );
    assert.equal(await page.locator(".profile-avatar canvas").count(), 1);
    await page.getByRole("link", { name: "Shop", exact: true }).click();
    await page
      .getByRole("button", { name: "Preview Crown", exact: true })
      .click();
    assert.deepEqual(model.owned, ["hoodie"], "Try-on grants nothing");
    const buy = page.getByRole("button", {
      name: "Buy Crown for 60 coins",
      exact: true,
    });
    await buy.evaluate((b) => {
      b.click();
      b.click();
    });
    await page
      .getByRole("status")
      .filter({ hasText: /Crown.*Wardrobe/ })
      .waitFor();
    assert.equal(model.buyCount, 1);
    assert.equal(model.profile.coin_balance, 60);
    const crown = page
      .locator(".shop-card")
      .filter({
        has: page.getByRole("heading", { name: "Crown", exact: true }),
      });
    assert.equal(await crown.locator(".item-tag").innerText(), "OWNED");
    await crown
      .getByRole("link", { name: "View in Wardrobe", exact: true })
      .click();
    await page.getByRole("button", { name: "Crown", exact: true }).click();
    await page
      .getByRole("button", { name: "Linen shirt", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Indigo trousers", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Canvas sneakers", exact: true })
      .click();
    assert.equal(
      model.profile.avatar.pants,
      "cocoa-trousers",
      "Try-on stays local",
    );
    model.failOutfit = true;
    await page
      .getByRole("button", { name: "Save Outfit", exact: true })
      .click();
    await page.locator(".profile-notice[role=alert]").waitFor();
    assert.equal(model.profile.avatar.pants, "cocoa-trousers");
    model.failOutfit = false;
    await page
      .getByRole("button", { name: "Save Outfit", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Outfit saved." })
      .waitFor();
    assert.equal(model.profile.avatar.pants, "indigo-trousers");
    assert.deepEqual(model.profile.equipped, ["crown"]);
    assert.equal(model.profile.coin_balance, 60);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByLabel("Height (cm)", { exact: true }).fill("180");
    await page.getByLabel("Weight (kg)", { exact: true }).fill("75");
    await page.getByRole("button", { name: "Cut", exact: true }).click();
    assert.equal(
      await page.getByLabel("Calories (kcal)", { exact: true }).inputValue(),
      "2200",
      "Goal switch never replaces custom targets",
    );
    await page.getByLabel("Target weight (kg)", { exact: true }).fill("65");
    await page.getByLabel("Age", { exact: true }).fill("17");
    assert.equal(
      await page
        .getByRole("button", { name: "Save Changes", exact: true })
        .isDisabled(),
      true,
    );
    await page.getByLabel("Age", { exact: true }).fill("25");
    await page
      .getByRole("button", { name: "Skin tone: Deep brown", exact: true })
      .click();
    model.failSettings = true;
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await page.locator(".profile-notice[role=alert]").waitFor();
    assert.equal(model.profile.height_cm, 175);
    assert.equal(
      await page.getByLabel("Height (cm)", { exact: true }).inputValue(),
      "180",
    );
    model.failSettings = false;
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Settings saved." })
      .waitFor();
    assert.equal(model.profile.height_cm, 180);
    assert.equal(model.profile.weight_kg, 75);
    assert.equal(model.profile.avatar.skinColor, "614335");
    assert.equal(model.profile.coin_balance, 60);
    await page.reload();
    await page.getByLabel("Height (cm)", { exact: true }).waitFor();
    assert.equal(
      await page.getByLabel("Height (cm)", { exact: true }).inputValue(),
      "180",
    );
    await page.getByRole("link", { name: "Home", exact: true }).click();
    await page.getByRole("link", { name: /streak.*meal history/ }).click();
    await page.waitForURL(/profile\?section=calendar/);
    await page
      .getByRole("button", { name: "Previous month", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Next month", exact: true })
        .isEnabled(),
      true,
    );
    await page.goto(base + "/history");
    await page.waitForURL(/profile\?section=calendar/);
    assert.equal(
      await page
        .getByRole("button", { name: "Calendar", exact: true })
        .getAttribute("aria-expanded"),
      "true",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: real production Profile/Shop/Calendar controllers, owned/free outfit saves, protected state, validation, reload and shared navigation (dummy intercepted backend).",
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
