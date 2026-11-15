/* eslint-disable @typescript-eslint/no-require-imports -- Dummy backend visual/contrast checks. */
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');
const harness = require('./profile-harness.cjs');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch();
  try {
    const { context, page, base, model } = await harness(browser);
    await context.route('**/api/analytics*', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ source: 'databricks', days: [{ date: '2026-11-15', calories: 2200, protein_g: 120, carbs_g: 250, fat_g: 70 }] }) }));
    await context.route('https://digin-ui-test.supabase.co/rest/v1/rpc/get_group_status', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({
      group: { id: 'garden-test', name: 'Little Sprouts', invite_code: 'ABC123', badge: 'sprout' },
      progress: { group_id: 'garden-test', completion_percentage: 50, eligible_member_count: 2, completed_member_count: 1, bonus_tier: 0 },
      members: [{ user_id: model.profile.id, username: 'jay', avatar: model.profile.avatar, equipped: [], personal_goal_completed: false }],
    }) }));
    if (process.env.UI_CHECK_OUTPUT) fs.mkdirSync(process.env.UI_CHECK_OUTPUT, { recursive: true });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const route of ['/', '/profile', '/profile?section=settings', '/profile?section=wardrobe', '/profile?section=calendar', '/groups', '/shop', '/scan']) {
        await page.goto(base + route);
        await page.locator('main').waitFor();
        await page.waitForTimeout(300);
        for (const state of route === '/scan' ? ['capture', 'results'] : route.includes('calendar') ? ['default', 'chart'] : ['default']) {
          if (state === 'results') {
            await page.getByRole('button', { name: 'Manual', exact: true }).click();
            await page.getByRole('button', { name: 'Edit new food' }).click();
          }
          if (state === 'chart') {
            await page.getByRole('button', { name: 'Macros chart', exact: true }).click();
            await page.locator('.macro-chart h3').waitFor();
          }
          const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
          assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, failure: n.failureSummary })) })), [], `${route} ${width} ${state}`);
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          if (process.env.UI_CHECK_OUTPUT) await page.screenshot({ path: `${process.env.UI_CHECK_OUTPUT}/${route.replace(/[^a-z]/g, '-') || 'home'}-${width}-${state}.png` });
          console.log(`PASS: ${route} ${width} ${state} contrast`);
        }
      }
    }
    const guest = await harness(browser, { session: false });
    await guest.page.goto(guest.base + '/onboarding');
    await guest.page.locator('.welcome-page').waitFor();
    const welcome = await new AxeBuilder({ page: guest.page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(welcome.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
    if (process.env.UI_CHECK_OUTPUT) await guest.page.screenshot({ path: `${process.env.UI_CHECK_OUTPUT}/welcome.png` });
    await guest.page.getByRole('button', { name: /Start your adventure/ }).click();
    await guest.page.locator('[data-onboarding]').waitFor();
    const form = await new AxeBuilder({ page: guest.page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(form.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
    await guest.context.close();
    await context.close();
    console.log('PASS: evening palette, contrast and responsive pages across Home/Profile/Community/Shop/Scan/results/welcome.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
