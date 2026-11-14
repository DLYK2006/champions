/* eslint-disable @typescript-eslint/no-require-imports -- External browser runner via NODE_PATH. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const directory = path.resolve("app/digin-ui-visual-fixture");
  if (fs.existsSync(directory))
    throw new Error("Refusing to overwrite an existing test route.");
  const browser = await chromium.launch({ headless: true });
  try {
    fs.mkdirSync(directory);
    fs.writeFileSync(
      path.join(directory, "page.tsx"),
      'export { default } from "@/components/ui/tests/presentation-fixture";\n',
    );
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const url = process.env.UI_CHECK_URL || "http://localhost:3000";
    const output = process.env.UI_CHECK_OUTPUT;
    await page.goto(`${url}/groups`);
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    const selected = nav.locator('[aria-current="page"]');
    assert.equal(await selected.count(), 1);
    const activeBackground = await selected
      .locator(".nav-icon")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const scanBackground = await nav
      .getByRole("link", { name: "Scan", exact: true })
      .locator(".nav-icon")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.notEqual(
      activeBackground,
      scanBackground,
      "Inactive Scan must not keep the active background",
    );
    assert.equal(await page.locator(".nav-dot").count(), 0);
    assert.equal(await page.locator(".app-header").count(), 0);
    // Visual fixtures isolate presentation from teammates' live auth/group/shop data.
    await page.goto(`${url}/digin-ui-visual-fixture`);
    // Next's dev indicator overlaps the fixture's bottom-left preview control.
    await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
    await page
      .getByRole("button", { name: "Preview Community", exact: true })
      .click();
    await page.locator(".garden-walker").first().waitFor();
    assert.equal(await page.locator(".walker-name").count(), 4);
    assert.equal(await page.locator(".voxel-rig").count(), 4);
    const walker = page.locator(".garden-walker").first();
    const before = await walker.boundingBox();
    await page.waitForTimeout(1100);
    const after = await walker.boundingBox();
    assert.ok(
      Math.abs(before.x - after.x) + Math.abs(before.y - after.y) > 1,
      "Garden characters should walk",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await walker.evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    for (const viewport of [
      { width: 360, height: 844 },
      { width: 390, height: 844 },
      { width: 1280, height: 800 },
      { width: 667, height: 375 },
      { width: 640, height: 400 },
    ]) {
      const { width, height } = viewport;
      await page.setViewportSize(viewport);
      for (const route of ["/", "/scan", "/groups", "/shop"]) {
        const screen = {
          "/": "Home",
          "/scan": "Scan",
          "/groups": "Community",
          "/shop": "Shop",
        }[route];
        await page
          .getByRole("button", { name: `Preview ${screen}`, exact: true })
          .click();
        await page.locator("main").filter({ visible: true }).first().waitFor();
        assert.equal(
          await page.locator(".app-header").count(),
          route === "/" ? 1 : 0,
        );
        const geometry = await page.evaluate(() => {
          const main = document.querySelector(".app-main");
          return {
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight,
            viewportWidth: innerWidth,
            viewportHeight: innerHeight,
            contentHeight: main.scrollHeight,
            availableHeight: main.clientHeight,
          };
        });
        assert.ok(
          geometry.width <= geometry.viewportWidth + 1,
          `${route} horizontal overflow at ${width}`,
        );
        assert.ok(
          geometry.height <= geometry.viewportHeight + 1,
          `${route} page overflow at ${width}`,
        );
        if (route !== "/shop" && height > 500)
          assert.ok(
            geometry.contentHeight <= geometry.availableHeight + 2,
            `${route} must fit one screen at ${width}: ${JSON.stringify(geometry)}`,
          );
        if (route === "/") {
          assert.equal(await page.locator(".home-sidebar").count(), 0);
          assert.equal(
            await page.getByRole("heading", { name: "Small wins" }).count(),
            0,
          );
        }
        if (route === "/scan") {
          assert.equal(await page.locator(".scan-guide").count(), 0);
          assert.equal(
            await page
              .getByRole("button", { name: "Take a food photo" })
              .isVisible(),
            true,
          );
        }
        if (route === "/" && height < 500) {
          assert.ok(
            (await page.locator(".room-panel").boundingBox()).height >= 180,
          );
          await page
            .getByRole("link", { name: "Customize", exact: true })
            .scrollIntoViewIfNeeded();
        }
        if (route === "/groups") {
          const garden = await page.locator(".garden-scene").boundingBox();
          for (const character of await page
            .locator(".voxel-character")
            .all()) {
            const box = await character.boundingBox();
            assert.ok(
              box.y + box.height <= garden.y + garden.height + 1,
              "Garden characters stay inside the scene",
            );
          }
        }
        if (output && width === 390) {
          fs.mkdirSync(output, { recursive: true });
          await page.screenshot({
            path: `${output}/compact-${route === "/" ? "home" : route.slice(1)}.png`,
          });
        }
      }
    }
    for (const route of ["/scan", "/groups", "/shop"]) {
      await page.goto(`${url}${route}`);
      assert.equal(await nav.locator('[aria-current="page"]').count(), 1);
      const greenTabs = await nav
        .locator(".nav-icon")
        .evaluateAll(
          (es) =>
            es.filter(
              (el) =>
                getComputedStyle(el).backgroundColor === "rgb(73, 108, 64)",
            ).length,
        );
      assert.equal(greenTabs, 1, `Exactly one green tab on ${route}`);
    }
    console.log(
      "PASS: compact phone/desktop screens, Home-only header, active-only green tabs, named walking 3D characters, reduced motion and no viewport overflow.",
    );
  } finally {
    await browser.close();
    fs.unlinkSync(path.join(directory, "page.tsx"));
    fs.rmdirSync(directory);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
