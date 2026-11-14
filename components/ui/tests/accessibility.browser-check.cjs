/* eslint-disable @typescript-eslint/no-require-imports -- External test runner via NODE_PATH. */
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const assert = require("node:assert/strict");

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    for (const route of ["/", "/groups", "/shop", "/scan", "/onboarding"]) {
      await page.goto(
        `${process.env.UI_CHECK_URL || "http://localhost:3000"}${route}`,
      );
      for (const state of route === "/scan"
        ? ["capture", "results"]
        : ["default"]) {
        if (state === "results") {
          await page
            .getByRole("button", { name: "Manual", exact: true })
            .click();
          await page.getByRole("button", { name: "Edit new food" }).click();
        }
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          result.violations.map((violation) => ({
            id: violation.id,
            nodes: violation.nodes.map((node) => node.html),
          })),
          [],
          `${route} ${state} accessibility violations`,
        );
        console.log(`PASS: ${route} ${state} automated WCAG A/AA check`);
      }
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
