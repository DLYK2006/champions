/* eslint-disable @typescript-eslint/no-require-imports -- Local intercepted backend only. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const harness = require('./profile-harness.cjs');
(async () => {
  const browser = await chromium.launch();
  try {
    const { context, page, base } = await harness(browser);
    for (const [width, height] of [[1440, 700], [1782, 750], [900, 700]]) {
      await page.setViewportSize({ width, height });
      await page.goto(base + '/shop');
      await page.getByRole('heading', { name: 'Sage Sweater', exact: true }).waitFor();
      const panel = page.getByRole('complementary', { name: 'Character preview' });
      const before = await panel.boundingBox();
      const titleBefore = await page.getByRole('heading', { name: 'Shop', exact: true }).boundingBox();
      const catalog = page.locator('.shop-catalog');
      await catalog.hover();
      await page.mouse.wheel(0, 450);
      await page.waitForTimeout(200);
      assert.ok(await catalog.evaluate(el => el.scrollTop > 0), `The catalog scrolls independently at ${width}`);
      assert.deepEqual(await panel.boundingBox(), before, 'Avatar position and dimensions stay fixed');
      assert.deepEqual(await page.getByRole('heading', { name: 'Shop', exact: true }).boundingBox(), titleBefore);
      assert.equal(await page.locator('.app-main').evaluate(el => el.scrollTop), 0);
      await page.getByRole('button', { name: 'Hats', exact: true }).click();
      await page.getByRole('button', { name: 'All', exact: true }).click();
      assert.deepEqual(await panel.boundingBox(), before, 'Filtering after scroll preserves preview size');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/shop');
    await page.locator('.wardrobe-panel').waitFor();
    assert.equal(await page.locator('.app-main').evaluate(el => getComputedStyle(el).overflowY), 'auto', 'Mobile retains normal page scrolling');
    assert.equal(Math.round((await page.locator('.wardrobe-panel').boundingBox()).height), 300);
    await context.close();
    console.log('PASS: desktop catalog scrolls while preview/title stay fixed; mobile scrolling and preview size preserved.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
