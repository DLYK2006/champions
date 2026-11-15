/* eslint-disable @typescript-eslint/no-require-imports -- Intercepted UI backend only. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const harness = require('./profile-harness.cjs');
(async () => {
  const browser = await chromium.launch();
  try {
    const { context, page, base, model } = await harness(browser);
    await page.goto(base + '/');
    await page.locator('.nutrition-panel').waitFor();
    assert.equal(await page.getByRole('progressbar').count(), 4);
    for (const label of ['Carbs', 'Fat']) assert.ok(await page.getByRole('progressbar', { name: label, exact: true }).getAttribute('aria-valuetext')); 
    for (const [width, height] of [[900, 700], [1440, 900], [1820, 913]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(100);
      const room = await page.locator('.room-panel').boundingBox();
      const quest = await page.locator('.nutrition-panel').boundingBox();
      assert.ok(Math.abs(room.y - quest.y) < 1 && Math.abs(room.height - quest.height) < 1, `Desktop Home frames align at ${width}`);
      for (const row of await page.locator('.nutrition-row').all()) {
        const track = await row.locator('.nutrition-track').boundingBox();
        const percent = await row.locator('.progress-percent').boundingBox();
        assert.ok(Math.abs(track.y + track.height / 2 - percent.y - percent.height / 2) < 30, 'Percent badge stays beside its progress bar');
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth));
      if (process.env.UI_CHECK_OUTPUT) await page.screenshot({ path: `${process.env.UI_CHECK_OUTPUT}/home-aligned-${width}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const room = await page.locator('.room-panel').boundingBox();
    const quest = await page.locator('.nutrition-panel').boundingBox();
    assert.ok(quest.y >= room.y + room.height, 'Mobile keeps its stacked layout');
    assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), 'Four rows fit on mobile');
    model.profile.carbs_target_g = null;
    model.profile.fat_target_g = null;
    await page.reload();
    await page.getByRole('progressbar', { name: 'Fat', exact: true }).waitFor();
    for (const label of ['Carbs', 'Fat']) {
      const bar = page.getByRole('progressbar', { name: label, exact: true });
      assert.match(await bar.getAttribute('aria-valuetext'), /no target set/);
      assert.equal(await bar.getAttribute('aria-valuenow'), null);
    }
    await context.close();
    console.log('PASS: desktop Home room/quest frame heights match; mobile remains stacked.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
