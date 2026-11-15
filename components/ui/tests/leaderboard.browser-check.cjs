/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const harness = require('./profile-harness.cjs');
(async () => {
 const browser = await chromium.launch();
 for (const width of [1440,390]) {
  const {context,page,base,errors} = await harness(browser,{viewport:{width,height:900}});
  let visible=true, fail=false, rows=Array.from({length:11},(_,i)=>({rank:i+1,group_name:i===10?'Your very long garden name here':'Garden '+(i+1),consistency_7d:i===0?100:0,full_bloom_streak:i===0?4:0,is_mine:i===10}));
  await context.route('**/api/leaderboard*', r=>r.fulfill({status:fail?503:200,contentType:'application/json',body:JSON.stringify(fail?{error:'Test outage'}:{source:'supabase',rows})}));
  await context.route('**/rest/v1/groups?*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({leaderboard_visible:visible})}));
  await context.route('**/rest/v1/rpc/set_group_leaderboard_visible',async r=>{visible=r.request().postDataJSON().p_visible;await r.fulfill({contentType:'application/json',body:'null'});});
  await page.goto(base+'/groups'); await page.getByRole('button',{name:'Leaderboard',exact:true}).click();
  await page.getByRole('heading',{name:'Garden league'}).waitFor();
  assert.equal(await page.locator('.league-row').count(),11);
  assert.equal(await page.locator('.league-fire').count(),1);
  const summary=page.locator('.league-row summary').first(); await summary.focus(); await page.keyboard.press('Enter'); assert(await page.locator('details').first().getAttribute('open')!==null);
  const check=page.getByRole('checkbox',{name:'Show my group on the leaderboard'}); await check.click(); await page.waitForFunction(()=>!document.querySelector('.league-visibility input').disabled); assert.equal(visible,false);
  const bounds=await page.locator('.garden-league').boundingBox(); assert(bounds.x>=0&&bounds.x+bounds.width<=width+1); assert(bounds.y+bounds.height<=900);
  const AxeBuilder=require('@axe-core/playwright').default; const axe=await new AxeBuilder({page}).include('.garden-league').withTags(['wcag2a','wcag2aa']).analyze(); assert.deepEqual(axe.violations.map(v=>v.id),[]);
  if(process.env.UI_CHECK_OUTPUT) await page.screenshot({path:process.env.UI_CHECK_OUTPUT+'/leaderboard-'+width+'.png'});
  rows=[];await page.getByRole('button',{name:'Group',exact:true}).click();await page.getByRole('button',{name:'Leaderboard',exact:true}).click();await page.getByRole('heading',{name:'Room to grow'}).waitFor();
  fail=true;await page.getByRole('button',{name:'Group',exact:true}).click();await page.getByRole('button',{name:'Leaderboard',exact:true}).click();await page.getByRole('button',{name:'Try again'}).waitFor();fail=false;await page.getByRole('button',{name:'Try again'}).click();await page.getByRole('heading',{name:'Room to grow'}).waitFor();
  assert.deepEqual(errors,[]);await context.close();
 }
 await browser.close(); console.log('Leaderboard desktop/mobile, keyboard, privacy, empty/retry and axe checks passed.');
})().catch(e=>{console.error(e);process.exit(1)});


