/* eslint-disable @typescript-eslint/no-require-imports -- Browser check uses an external temporary Playwright installation via NODE_PATH. */
// Run against the dev server with Playwright available through NODE_PATH.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const url = process.env.UI_CHECK_URL || "http://localhost:3000";
  const output = process.env.UI_CHECK_OUTPUT;
  try {
    await page.goto(`${url}/scan`);
    await page.getByRole("button", { name: "Manual", exact: true }).click();
    await page.getByRole("heading", { name: "Review meal" }).waitFor();
    const confirm = page.getByRole("button", {
      name: "Confirm log",
      exact: true,
    });
    assert.equal(await confirm.isDisabled(), true);
    await page.getByRole("button", { name: "Edit new food" }).click();
    await page.getByLabel("Food name", { exact: true }).fill("Rice bowl");
    await page.getByLabel("Calories (kcal)", { exact: true }).fill("-1");
    assert.equal(await confirm.isDisabled(), true);
    await page.getByLabel("Calories (kcal)", { exact: true }).fill("225");
    assert.equal(await confirm.isEnabled(), true);
    assert.equal(
      await page.locator(".result-macros strong").first().innerText(),
      "225kcal",
    );
    for (let i = 0; i < 5; i++)
      await page.getByRole("button", { name: "Add food", exact: true }).click();
    assert.equal(await page.locator(".food-card").count(), 6);
    for (const viewport of [
      { width: 360, height: 640 },
      { width: 390, height: 844 },
      { width: 1280, height: 800 },
      { width: 667, height: 375 },
      { width: 640, height: 400 },
    ]) {
      await page.setViewportSize(viewport);
      const geometry = await page.evaluate(() => {
        const main = document.querySelector(".app-main");
        const foods =
          innerHeight <= 500
            ? document.querySelector(".results-layout > section")
            : document.querySelector(".food-list");
        const confirm = document
          .querySelector(".confirm-log-bar")
          .getBoundingClientRect();
        return {
          content: main.scrollHeight,
          height: main.clientHeight,
          foodContent: foods.scrollHeight,
          foodHeight: foods.clientHeight,
          confirmBottom: confirm.bottom,
          navTop: document.querySelector(".bottom-nav").getBoundingClientRect()
            .top,
        };
      });
      assert.ok(
        geometry.content <= geometry.height + 2,
        JSON.stringify(geometry),
      );
      assert.ok(
        geometry.foodContent > geometry.foodHeight,
        "Variable foods and editors scroll inside their list",
      );
      assert.ok(
        geometry.confirmBottom <= geometry.navTop,
        "Confirm stays above navigation",
      );
      if (output && viewport.width === 390) {
        fs.mkdirSync(output, { recursive: true });
        await page.screenshot({ path: `${output}/results-mobile.png` });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    // No real log_meal/purchase/auth submission in a UI-only check.
    await page.goto(`${url}/onboarding`);
    if (output)
      await page.screenshot({
        path: `${output}/welcome-mobile.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Start your adventure" }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "Next", exact: true })
        .isDisabled(),
      true,
    );
    await page.getByLabel("Username", { exact: true }).fill("alex_test");
    await page.getByLabel("Height (cm)", { exact: true }).fill("175");
    await page.getByLabel("Weight (kg)", { exact: true }).fill("70");
    await page.getByLabel("Age", { exact: true }).fill("17");
    assert.equal(
      await page
        .getByRole("button", { name: "Next", exact: true })
        .isDisabled(),
      true,
    );
    await page.getByLabel("Age", { exact: true }).fill("24");
    if (output)
      await page.screenshot({
        path: `${output}/onboarding-stats-mobile.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page
      .getByRole("button", { name: "Maintain Find your rhythm" })
      .click();
    assert.equal(
      await page.getByLabel("Target weight (kg)", { exact: true }).isDisabled(),
      true,
    );
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page
      .getByRole("group", { name: "Preset targets" })
      .getByRole("button")
      .first()
      .click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page
      .getByRole("button", { name: "Skin tone: Deep brown", exact: true })
      .click();
    assert.equal(
      (await page
        .getByRole("img", { name: "Your customized pixel avatar" })
        .locator('path[fill="#614335"]')
        .count()) > 0,
      true,
    );
    if (output)
      await page.screenshot({
        path: `${output}/onboarding-avatar-mobile.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page
      .getByRole("button", { name: "Continue solo", exact: true })
      .waitFor();
    // Do not invoke the owner's authentication/profile submission in this UI-only check.

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(url);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    if (output)
      await page.screenshot({
        path: `${output}/home-desktop.png`,
        fullPage: true,
      });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: manual meal editing, invalid-input guard, internal results scrolling, pinned confirm, onboarding validation/presets/avatar/optional group, responsive geometry and no browser errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
