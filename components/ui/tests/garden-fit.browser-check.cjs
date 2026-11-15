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
    for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1000, 501], [1024, 600], [1000, 700], [1280, 720], [1366, 768], [1440, 900], [1787, 907], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(200);
      const result = await page.evaluate(() => {
        const scene = document.querySelector('.garden-scene');
        const image = scene.querySelector('img');
        const main = document.querySelector('.app-main');
        const rect = scene.getBoundingClientRect();
        return { fit: getComputedStyle(image).objectFit, pageFits: document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight,
          contentFits: main.scrollHeight <= main.clientHeight + 1, height: rect.height, width: rect.width, right: rect.right,
          progressLeft: document.querySelector('.group-progress-panel').getBoundingClientRect().left,
          progressTop: document.querySelector('.group-progress-panel').getBoundingClientRect().top,
          titleBottom: document.querySelector('.screen-title-row').getBoundingClientRect().bottom,
          bottom: document.querySelector('.group-progress-panel').getBoundingClientRect().bottom,
          navTop: document.querySelector('.bottom-nav').getBoundingClientRect().top };
      });
      assert.equal(result.fit, 'contain');
      assert.ok(result.pageFits && result.contentFits, JSON.stringify({ width, height, ...result }));
      assert.ok(result.height > 30 && result.bottom <= result.navTop + 1, JSON.stringify(result));
      assert.ok(result.progressTop >= result.titleBottom, 'Progress must not overlap the heading on short desktops');
      if (width >= 1400) {
        assert.ok(result.width >= (width >= 1900 ? 1100 : 880), `Desktop garden must fill available space: ${JSON.stringify(result)}`);
        assert.ok(result.progressLeft >= result.right, 'Desktop progress sits beside the garden');
      }
      if (width === 1440) {
        const { default: AxeBuilder } = require('@axe-core/playwright');
        const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        assert.deepEqual(report.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
      }
      if (process.env.UI_CHECK_OUTPUT) await page.screenshot({ path: `${process.env.UI_CHECK_OUTPUT}/garden-${width}.png` });
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS: full garden and progress fit phones, landscape and desktops without page scroll.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
