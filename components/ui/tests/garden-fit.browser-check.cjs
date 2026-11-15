/* eslint-disable @typescript-eslint/no-require-imports -- Intercepted test backend only. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const harness = require('./profile-harness.cjs');
(async () => {
  const browser = await chromium.launch();
  try {
    const { context, page, base, model, errors } = await harness(browser);
    await context.route('https://digin-ui-test.supabase.co/rest/v1/rpc/get_group_status', route => route.fulfill({
      contentType: 'application/json', body: JSON.stringify({
        group: { id: 'garden-test', name: 'Little Sprouts', invite_code: 'ABC123', badge: 'sprout' },
        progress: { group_id: 'garden-test', completion_percentage: 50, eligible_member_count: 2, completed_member_count: 1, bonus_tier: 0 },
        members: [{ user_id: model.profile.id, username: 'jay', avatar: model.profile.avatar, equipped: [], personal_goal_completed: false }],
      }),
    }));
    await page.goto(base + '/groups');
    await page.locator('.garden-canvas').waitFor();
    for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1440, 900], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(200);
      const result = await page.evaluate(() => {
        const scene = document.querySelector('.garden-scene');
        const image = scene.querySelector('img');
        const main = document.querySelector('.app-main');
        const rect = scene.getBoundingClientRect();
        return { fit: getComputedStyle(image).objectFit, pageFits: document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight,
          contentFits: main.scrollHeight <= main.clientHeight + 1, height: rect.height,
          bottom: document.querySelector('.group-progress-panel').getBoundingClientRect().bottom,
          navTop: document.querySelector('.bottom-nav').getBoundingClientRect().top };
      });
      assert.equal(result.fit, 'contain');
      assert.ok(result.pageFits && result.contentFits, JSON.stringify({ width, height, ...result }));
      assert.ok(result.height > 30 && result.bottom <= result.navTop + 1, JSON.stringify(result));
      if (process.env.UI_CHECK_OUTPUT) await page.screenshot({ path: `${process.env.UI_CHECK_OUTPUT}/garden-${width}.png` });
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS: full garden and progress fit phones, landscape and desktops without page scroll.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
