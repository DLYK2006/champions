/* eslint-disable @typescript-eslint/no-require-imports -- Local visual fixture. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const harness = require('./profile-harness.cjs');
(async () => {
  const dir = path.resolve('app/digin-ui-share-art-fixture');
  assert.ok(!fs.existsSync(dir));
  const browser = await chromium.launch();
  try {
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'page.tsx'), 'export {default} from "@/components/ui/tests/share-art-fixture";');
    const page = await browser.newPage({ viewport: { width: 600, height: 720 } });
    const base = process.env.UI_CHECK_URL || 'http://localhost:3000';
    await page.goto(base + '/digin-ui-share-art-fixture');
    await page.waitForFunction(() => document.querySelector('canvas')?.dataset.ready === 'true');
    const canvas = page.getByLabel('Downloaded progress artwork');
    assert.equal(await canvas.getAttribute('width'), '1080');
    if (process.env.UI_CHECK_OUTPUT) await canvas.screenshot({ path: path.join(process.env.UI_CHECK_OUTPUT, 'share-art.png') });
    const live = await harness(browser);
    await live.page.goto(live.base + '/');
    await live.page.getByRole('button', { name: 'Open sharing', exact: true }).click();
    await live.page.getByRole('button', { name: 'Share my progress', exact: true }).click();
    await live.page.locator('img[src^="blob:"]').waitFor();
    const dimensions = await live.page.locator('img[src^="blob:"]').evaluate(img => ({ width: img.naturalWidth, height: img.naturalHeight }));
    assert.deepEqual(dimensions, { width: 1080, height: 1350 });
    const downloaded = live.page.waitForEvent('download');
    await live.page.getByRole('button', { name: 'Download', exact: true }).click();
    const download = await downloaded;
    assert.equal(download.suggestedFilename(), 'dig-in-progress.png');
    assert.equal(await download.failure(), null);
    assert.deepEqual(live.errors, []);
    await live.context.close();
    console.log('PASS: new progress artwork renders at full export dimensions.');
  } finally {
    await browser.close();
    fs.unlinkSync(path.join(dir, 'page.tsx'));
    fs.rmdirSync(dir);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
