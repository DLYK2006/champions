/* eslint-disable @typescript-eslint/no-require-imports -- Dummy backend browser regression. */
const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  harness = require("./profile-harness.cjs");
(async () => {
  const browser = await chromium.launch();
  try {
    const { context, page, base, model, errors } = await harness(browser);
    await page.goto(base + "/profile");
    const toggle = (name) => page.getByRole("button", { name, exact: true });
    await page.getByLabel("Username", { exact: true }).fill("draft_jay");
    await toggle("Settings").click();
    await page
      .locator("#profile-settings-toggle[aria-expanded=false]")
      .waitFor();
    assert.equal(await page.locator(".profile-section.is-open").count(), 0);
    await toggle("Settings").click();
    await page
      .locator("#profile-settings-toggle[aria-expanded=true]")
      .waitFor();
    assert.equal(
      await page.getByLabel("Username", { exact: true }).inputValue(),
      "draft_jay",
    );
    for (const name of ["Wardrobe", "Calendar"]) {
      await toggle(name).click();
      await page
        .locator(`#profile-${name.toLowerCase()}-toggle[aria-expanded=true]`)
        .waitFor();
      await toggle(name).click();
      await page
        .locator(`#profile-${name.toLowerCase()}-toggle[aria-expanded=false]`)
        .waitFor();
    }
    await toggle("Calendar").click();
    await page.getByLabel("From date", { exact: true }).waitFor();
    assert.equal(await page.getByText(/Dark green: goal met/).count(), 0);
    assert.equal(
      await page
        .getByRole("region", { name: "Nutrition analysis", exact: true })
        .getAttribute("data-selection"),
      "all",
    );
    assert.ok(
      !model.calls.some((c) => c.path === "/rest/v1/meals"),
      "All-date analysis does not fetch a misleading default day",
    );
    await page.getByLabel("From date", { exact: true }).fill("2026-11-01");
    await page.getByLabel("To date", { exact: true }).fill("2026-11-10");
    await toggle("View analysis").click();
    await page.waitForURL(/from=2026-11-01.*to=2026-11-10/);
    assert.equal(
      await page
        .getByRole("region", { name: "Nutrition analysis", exact: true })
        .getAttribute("data-selection"),
      "range",
    );
    await page
      .getByRole("button", { name: "2026-11-10: nothing logged", exact: true })
      .click();
    await page.getByRole("heading", { name: /November 10/ }).waitFor();
    assert.ok(model.calls.some((c) => c.path === "/rest/v1/meals"));
    await toggle("Back to analysis").click();
    await page
      .getByRole("region", { name: "Nutrition analysis", exact: true })
      .waitFor();
    await toggle("All dates").click();
    await page.waitForFunction(
      () => !new URLSearchParams(location.search).has("from"),
    );
    assert.equal(
      await page.getByLabel("From date", { exact: true }).inputValue(),
      "",
    );
    await page.getByLabel("From date", { exact: true }).fill("2026-11-10");
    await page.getByLabel("To date", { exact: true }).fill("2026-11-01");
    await toggle("View analysis").click();
    await page.locator(".history-filter-error").waitFor();
    assert.equal(
      await page
        .getByRole("region", { name: "Nutrition analysis", exact: true })
        .getAttribute("data-selection"),
      "all",
    );
    const { default: AxeBuilder } = require("@axe-core/playwright");
    for (const width of [320,390,768,1440]) {
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `Calendar fits ${width}`);
      const result = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
      assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],`Calendar accessibility at ${width}`);
      if(process.env.UI_CHECK_OUTPUT) await page.screenshot({path:process.env.UI_CHECK_OUTPUT+`/calendar-filter-${width}.png`});
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      "PASS: all Profile sections collapse, drafts survive, default/ranged analysis selection, day details, reset and invalid range.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
