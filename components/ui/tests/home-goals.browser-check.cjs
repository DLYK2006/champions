/* eslint-disable @typescript-eslint/no-require-imports -- Dummy backend browser regression. */
const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  harness = require("./profile-harness.cjs");
(async () => {
  const browser = await chromium.launch();
  try {
    const { page, context, base, model, errors } = await harness(browser);
    Object.assign(model.profile, {
      goal_type: "bulk",
      calorie_target: 2700,
      protein_target_g: 150,
    });
    Object.assign(model.days[0], {
      total_calories: 4000,
      total_protein_g: 140,
      calorie_goal_completed: true,
      protein_goal_completed: true,
      personal_goal_completed: true,
    });
    await page.goto(base + "/");
    await page.getByText("Aim for 2,430+ kcal", { exact: true }).waitFor();
    assert.equal(
      await page.getByText("Aim for 135+ g", { exact: true }).count(),
      1,
    );
    assert.equal(
      await page.locator('.nutrition-row [aria-label="Goal met"]').count(),
      2,
    );
    assert.equal(
      await page.getByText("A little over today", { exact: true }).count(),
      0,
    );
    Object.assign(model.profile, { goal_type: "cut" });
    Object.assign(model.days[0], {
      calorie_goal_completed: false,
      protein_goal_completed: false,
      personal_goal_completed: false,
    });
    await page.reload();
    await page.getByText("Aim for 2,430–2,970 kcal", { exact: true }).waitFor();
    assert.equal(
      await page.getByText("A little over today", { exact: true }).count(),
      1,
    );
    assert.equal(
      await page.locator('.nutrition-row [aria-label="Goal met"]').count(),
      0,
      "The UI must honor server flags even when amounts look complete",
    );
    await page
      .getByRole("button", { name: "Open sharing", exact: true })
      .click();
    assert.equal(await page.getByRole("dialog").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      "PASS: goal-specific ranges, authoritative completion flags, neutral over-target wording and Home share dialog.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
