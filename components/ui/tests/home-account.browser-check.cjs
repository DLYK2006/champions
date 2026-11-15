/* eslint-disable @typescript-eslint/no-require-imports -- Dummy backend UI regression. */
const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  harness = require("./profile-harness.cjs");
(async () => {
  const browser = await chromium.launch();
  try {
    const { context, page, base, errors } = await harness(browser);
    let failed = true,
      logoutCalls = 0;
    await page.route(
      "https://digin-ui-test.supabase.co/auth/v1/logout*",
      async (route) => {
        logoutCalls++;
        await new Promise((r) => setTimeout(r, 180));
        await route.fulfill({
          status: failed ? 503 : 200,
          contentType: "application/json",
          body: failed
            ? JSON.stringify({ message: "Test sign out failure" })
            : "{}",
        });
      },
    );
    await page.goto(base + "/");
    await page.getByRole("link", { name: "Customize", exact: true }).waitFor();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const actions = [
        page.getByRole("button", { name: "Sign out", exact: true }),
        page.getByRole("button", { name: "Open sharing", exact: true }),
        page.getByRole("link", { name: /coins\. Open shop/ }),
      ];
      const boxes = await Promise.all(actions.map((el) => el.boundingBox()));
      assert.ok(boxes.every(Boolean));
      assert.ok(boxes[0].x < boxes[1].x && boxes[1].x < boxes[2].x);
      assert.ok(
        boxes.every((b) => b.x >= 0 && b.x + b.width <= width),
        `Actions fit ${width}`,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
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
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page
      .getByText("Couldn't sign out. Try again.", { exact: true })
      .waitFor();
    assert.ok(page.url().endsWith("/"));
    assert.equal(logoutCalls, 1);
    failed = false;
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL(/onboarding/);
    assert.equal(logoutCalls, 2);
    assert.deepEqual(errors, []);
    await context.close();
    const second = await harness(browser);
    await second.page.goto(second.base + "/profile");
    await second.page
      .getByRole("button", { name: "Settings", exact: true })
      .waitFor();
    assert.equal(
      await second.page
        .getByRole("button", { name: "Sign out", exact: true })
        .count(),
      0,
    );
    await second.context.close();
    console.log(
      "PASS: Sign out/Share/Coins order, responsive header, sign-out error/retry and Profile removal.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
