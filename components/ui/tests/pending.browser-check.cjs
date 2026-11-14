/* eslint-disable @typescript-eslint/no-require-imports -- External test runner via NODE_PATH. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const fixtureDirectory = path.resolve("app/(app)/digin-ui-check-fixture");
  if (fs.existsSync(fixtureDirectory))
    throw new Error("Refusing to overwrite an existing test route.");
  let browser;
  try {
    fs.mkdirSync(fixtureDirectory);
    fs.writeFileSync(
      path.join(fixtureDirectory, "page.tsx"),
      'export { default } from "@/components/ui/tests/interaction-fixture";\n',
    );
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await page.goto(
      `${process.env.UI_CHECK_URL || "http://localhost:3000"}/digin-ui-check-fixture`,
    );
    const celebration = page.getByRole("button", {
      name: "Celebration fixture",
      exact: true,
    });
    await celebration.click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(
      await celebration.evaluate((el) => el === document.activeElement),
      true,
    );
    await page
      .getByRole("button", { name: "Create a group", exact: true })
      .click();
    await page.getByLabel("Garden name", { exact: true }).fill("Quiet Garden");
    await page
      .getByRole("button", { name: "Create garden", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Join a garden", exact: true })
        .isDisabled(),
      true,
      "Pending request must prevent form changes",
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Cancel", exact: true })
        .isDisabled(),
      true,
    );
    assert.equal(
      await page.getByLabel("Request count", { exact: true }).innerText(),
      "1",
    );
    await page
      .getByRole("button", { name: "Reject pending request", exact: true })
      .click();
    await page
      .getByText("The request failed. Please retry.", { exact: true })
      .waitFor();
    assert.equal(
      await page.getByLabel("Garden name", { exact: true }).inputValue(),
      "Quiet Garden",
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Create garden", exact: true })
        .isEnabled(),
      true,
    );
    await page
      .getByRole("button", { name: "Results fixture", exact: true })
      .click();
    await page.getByRole("button", { name: "Edit Test meal" }).click();
    await page
      .getByLabel("Portion", { exact: true })
      .fill("2 generous servings");
    await page
      .getByRole("button", { name: "Confirm log", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Saving…", exact: true })
        .isDisabled(),
      true,
    );
    assert.equal(
      await page.getByLabel("Portion", { exact: true }).isDisabled(),
      true,
    );
    assert.equal(
      await page.getByLabel("Request count", { exact: true }).innerText(),
      "2",
    );
    await page
      .getByRole("button", { name: "Reject pending request", exact: true })
      .click();
    await page
      .getByText("The request failed. Please retry.", { exact: true })
      .waitFor();
    assert.equal(
      await page.getByLabel("Portion", { exact: true }).inputValue(),
      "2 generous servings",
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Confirm log", exact: true })
        .isEnabled(),
      true,
    );
    assert.equal(
      await page.getByRole("dialog").count(),
      0,
      "Rejected save must not celebrate",
    );
    await page
      .getByRole("button", { name: "Shop fixture", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Buy Crown for 60 coins", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Buy Crown for 60 coins", exact: true })
        .isDisabled(),
      true,
    );
    assert.equal(
      await page.getByLabel("Request count", { exact: true }).innerText(),
      "3",
    );
    await page
      .getByRole("button", { name: "Reject pending request", exact: true })
      .click();
    await page
      .getByText("The request failed. Please retry.", { exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Buy Crown for 60 coins", exact: true })
        .isEnabled(),
      true,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Equip Crown", exact: true })
        .count(),
      0,
    );
    assert.equal(await page.getByLabel("Shop coin balance").innerText(), "240");
    console.log(
      "PASS: group/result/shop pending actions are guarded; rejected actions preserve details, balance and ownership without false rewards.",
    );
  } finally {
    await browser?.close();
    fs.unlinkSync(path.join(fixtureDirectory, "page.tsx"));
    fs.rmdirSync(fixtureDirectory);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
