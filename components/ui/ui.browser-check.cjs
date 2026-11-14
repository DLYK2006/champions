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
    await page.goto(url);
    await page
      .getByRole("heading", { name: "A little progress. A little magic." })
      .waitFor({ timeout: 12000 });
    await page.getByText("Demo mode", { exact: false }).first().waitFor();
    assert.equal(
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link")
        .count(),
      4,
    );
    await page.getByRole("button", { name: "Preview celebration" }).click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(
      await page
        .getByRole("button", { name: "Preview celebration" })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "Home must not overflow a phone",
    );
    if (output) {
      fs.mkdirSync(output, { recursive: true });
      await page.getByRole("heading").first().click();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `${output}/home-mobile.png`,
        fullPage: true,
      });
    }

    await page.getByRole("link", { name: "Shop", exact: true }).click();
    await page.getByRole("heading", { name: "A little more you." }).waitFor();
    await page.getByRole("button", { name: "Preview Crown" }).click();
    await page.getByRole("button", { name: "Buy Crown for 60 coins" }).click();
    await page.getByRole("button", { name: "Equip Crown" }).waitFor();
    await page.getByRole("button", { name: "Equip Crown" }).click();
    await page.getByText("Crown equipped.", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("Coin balance").innerText(), "180");
    if (output)
      await page.screenshot({
        path: `${output}/shop-mobile.png`,
        fullPage: true,
      });

    await page.getByRole("link", { name: "Community", exact: true }).click();
    await page
      .getByRole("heading", { name: "Good things grow together." })
      .waitFor();
    assert.equal(await page.getByText("75%", { exact: true }).count(), 1);
    assert.equal(
      (
        await page.locator("main").filter({ visible: true }).innerText()
      ).includes("110 / 150"),
      false,
      "Other member intake must stay private",
    );
    await page.getByRole("button", { name: "Explore solo" }).click();
    await page.getByRole("button", { name: "Create a group" }).waitFor();
    await page.getByRole("button", { name: "Join with a code" }).click();
    await page.getByLabel("Invite code").fill("ab");
    await page.getByRole("button", { name: "Join garden" }).click();
    await page
      .getByText("Enter a 6-character invite code.", { exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Preview group demo" }).click();
    if (output)
      await page.screenshot({
        path: `${output}/community-mobile.png`,
        fullPage: true,
      });

    await page.getByRole("link", { name: "Scan", exact: true }).click();
    await page.getByRole("button", { name: "Explore a sample meal" }).click();
    await page.getByRole("button", { name: "Edit Grilled chicken" }).click();
    await page.getByLabel("Calories (kcal)", { exact: true }).fill("-1");
    assert.equal(
      await page
        .getByRole("button", { name: "Confirm log", exact: true })
        .isDisabled(),
      true,
    );
    await page.getByLabel("Calories (kcal)", { exact: true }).fill("225");
    assert.equal(
      await page
        .getByRole("button", { name: "Confirm log", exact: true })
        .isDisabled(),
      false,
    );
    assert.equal(
      await page.locator(".result-macros strong").first().innerText(),
      "447kcal",
    );
    await page.getByRole("button", { name: "Edit Grilled chicken" }).click();
    if (output) {
      await page.getByRole("heading").first().click();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `${output}/results-mobile.png`,
        fullPage: true,
      });
    }
    await page
      .getByRole("button", { name: "Confirm log", exact: true })
      .click();
    await page.getByRole("dialog").waitFor();
    assert.equal(
      await page.getByLabel("Coin balance").innerText(),
      "180",
      "A UI preview must not award coins",
    );
    if (output)
      await page.screenshot({ path: `${output}/achievement-mobile.png` });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Back to your plate" }).click();
    await page.getByRole("button", { name: "Loading", exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "Take a food photo" })
        .isDisabled(),
      true,
    );
    await page.getByRole("button", { name: "End loading preview" }).click();
    await page.getByRole("button", { name: "Error", exact: true }).click();
    await page.locator('.scan-error[role="alert"]').waitFor();
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    assert.equal(await page.locator('.scan-error[role="alert"]').count(), 0);
    if (output)
      await page.screenshot({
        path: `${output}/scanner-mobile.png`,
        fullPage: true,
      });

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
      "PASS: navigation, reward-dialog keyboard/focus, demo purchase/equip, coin persistence, group privacy/solo/validation, editable results/invalid-input guard, preview leaves coins unchanged, scanner loading/error/retry, onboarding validation/presets/avatar/optional group, mobile/desktop overflow, no browser errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
