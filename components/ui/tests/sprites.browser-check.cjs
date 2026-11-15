/* eslint-disable @typescript-eslint/no-require-imports -- External Playwright runner. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

(async () => {
  const { createNavigation, sceneView } = await import(
    pathToFileURL(path.resolve("components/world/wander.ts"))
  );
  const directory = path.resolve("app/digin-ui-sprites-fixture");
  if (fs.existsSync(directory))
    throw new Error("Refusing to overwrite test route");
  let browser;
  try {
    fs.mkdirSync(directory);
    fs.writeFileSync(
      path.join(directory, "page.tsx"),
      'export { default } from "@/components/ui/tests/presentation-fixture";\n',
    );
    browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1100, height: 800 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      `${process.env.UI_CHECK_URL || "http://localhost:3000"}/digin-ui-sprites-fixture`,
    );
    await page.addStyleTag({ content: "nextjs-portal {display:none}" });
    await page
      .getByRole("button", { name: "Preview Community", exact: true })
      .click();
    await page
      .locator('.garden-canvas[data-sprite-ready="true"]')
      .waitFor({ timeout: 10000 });
    assert.equal(await page.locator(".voxel-rig").count(), 0);
    assert.equal(await page.locator(".garden-member").count(), 4);
    const samples = [],
      states = new Set(),
      frames = new Set(),
      facings = new Set();
    for (let i = 0; i < 24; i++) {
      const data = await page.locator(".garden-member").evaluateAll((es) =>
        es.map((e) => ({
          x: Number(e.dataset.worldX),
          y: Number(e.dataset.worldY),
          state: e.dataset.state,
          frame: e.dataset.frame,
          facing: e.dataset.facing,
        })),
      );
      const box = await page
        .locator(".garden-scene")
        .evaluate((el) => ({ width: el.clientWidth, height: el.clientHeight }));
      const nav = createNavigation(sceneView(box.width, box.height));
      for (const actor of data) {
        assert.ok(
          nav.contains(actor),
          `Grass-only feet: ${JSON.stringify(actor)}`,
        );
        states.add(actor.state);
        frames.add(actor.frame);
        facings.add(actor.facing);
      }
      samples.push(data);
      await page.waitForTimeout(400);
    }
    assert.ok(
      samples.some(
        (s) =>
          Math.hypot(s[0].x - samples[0][0].x, s[0].y - samples[0][0].y) > 20,
      ),
      "Autonomous movement",
    );
    assert.ok(
      states.has("walk") && states.has("idle"),
      "Walking and real idle pauses",
    );
    assert.ok(frames.size >= 4, "Actual animated frames");
    assert.ok(facings.size >= 2, "Directional facing");
    assert.ok(
      await page.locator(".garden-canvas").evaluate((c) => {
        const a = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        return a.some((v, i) => i % 4 === 3 && v > 0);
      }),
      "Visible sprite pixels",
    );
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 667, height: 375 },
      { width: 320, height: 568 },
      { width: 320, height: 932 },
      { width: 390, height: 1100 },
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(400);
      const bounds = await page.locator(".garden-scene").boundingBox();
      const box = await page
        .locator(".garden-scene")
        .evaluate((el) => ({ width: el.clientWidth, height: el.clientHeight }));
      const nav = createNavigation(sceneView(box.width, box.height));
      for (const member of await page.locator(".garden-member").all()) {
        const p = await member.evaluate((e) => ({
          x: Number(e.dataset.worldX),
          y: Number(e.dataset.worldY),
        }));
        assert.ok(nav.contains(p));
        const name = await member.locator(".garden-name").boundingBox();
        assert.ok(
          name.x >= bounds.x &&
            name.x + name.width <= bounds.x + bounds.width + 1,
          `Names fit responsive crop: ${JSON.stringify({ viewport, name, bounds, p })}`,
        );
      }
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(100);
    assert.equal(
      await page.locator(".garden-canvas").getAttribute("data-running"),
      "false",
    );
    const still = await page
      .locator(".garden-member")
      .first()
      .getAttribute("style");
    await page.waitForTimeout(600);
    assert.equal(
      await page.locator(".garden-member").first().getAttribute("style"),
      still,
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    assert.equal(
      await page.locator(".garden-canvas").getAttribute("data-running"),
      "false",
    );
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page
      .getByRole("button", { name: "Preview Home", exact: true })
      .click();
    await page
      .locator('.room-character canvas[data-sprite-ready="true"]')
      .waitFor();
    for (const viewport of [
      { width: 1440, height: 375 },
      { width: 667, height: 375 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(100);
      const foot = await page.locator(".room-character").evaluate((actor) => {
        const room = actor.parentElement,
          c = actor.querySelector("canvas"),
          rect = c.getBoundingClientRect(),
          box = room.getBoundingClientRect();
        const pixels = c
          .getContext("2d")
          .getImageData(0, 0, c.width, c.height).data;
        let first = c.height;
        for (let y = 0; y < c.height; y++)
          for (let x = 0; x < c.width; x++)
            if (pixels[(y * c.width + x) * 4 + 3] > 100)
              first = Math.min(first, y);
        return {
          feet: Number(actor.dataset.feetY),
          height: room.clientHeight,
          head: rect.y + (first / c.height) * rect.height - box.y,
          renderedFoot:
            rect.y + (148 / 160) * rect.height - box.y - room.clientTop,
        };
      });
      assert.ok(
        foot.feet > 0 && foot.feet < foot.height,
        `Rug feet in wide/short room: ${JSON.stringify(foot)}`,
      );
      assert.ok(foot.head >= 0, `Head stays in room: ${JSON.stringify(foot)}`);
      assert.ok(
        Math.abs(foot.feet - foot.renderedFoot) < 1,
        `Feet registered on rug: ${JSON.stringify(foot)}`,
      );
    }
    assert.equal(
      await page.locator(".room-character img,.room-character svg").count(),
      0,
    );
    if (process.env.UI_CHECK_OUTPUT) {
      fs.mkdirSync(process.env.UI_CHECK_OUTPUT, { recursive: true });
      await page.screenshot({
        path: `${process.env.UI_CHECK_OUTPUT}/sprite-home.png`,
      });
      await page
        .getByRole("button", { name: "Preview Community", exact: true })
        .click();
      await page.locator('.garden-canvas[data-sprite-ready="true"]').waitFor();
      await page.screenshot({
        path: `${process.env.UI_CHECK_OUTPUT}/sprite-garden.png`,
      });
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: original directional sprites, autonomous grass-only movement/pauses, responsive collision, Home sprite, reduced motion/visibility cleanup and no browser errors.",
    );
  } finally {
    await browser?.close();
    fs.unlinkSync(path.join(directory, "page.tsx"));
    fs.rmdirSync(directory);
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
