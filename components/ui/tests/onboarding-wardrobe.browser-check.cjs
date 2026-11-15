/* eslint-disable @typescript-eslint/no-require-imports -- External Playwright runner; intercepted test backend only. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { default: AxeBuilder } = require("@axe-core/playwright");

(async () => {
  const browser = await chromium.launch();
  try {
    for (const mode of ["solo", "create", "join"]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      });
      const uid = "10000000-0000-4000-8000-000000000042";
      const user = {
        id: uid,
        aud: "authenticated",
        role: "authenticated",
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      };
      const now = Math.floor(Date.now() / 1000);
      const token = [
        "eyJhbGciOiJIUzI1NiJ9",
        Buffer.from(
          JSON.stringify({
            sub: uid,
            aud: "authenticated",
            role: "authenticated",
            iat: now,
            exp: now + 3600,
          }),
        ).toString("base64url"),
        "test-only-signature",
      ].join(".");
      let profile = null,
        inserts = 0;
      const calls = [];
      await context.route("https://**.supabase.co/**", async (route) => {
        const req = route.request(),
          url = new URL(req.url());
        assert.equal(
          url.hostname,
          "digin-ui-test.supabase.co",
          "Only the dummy UI backend may be intercepted",
        );
        let body = null;
        const headers = { "content-type": "application/json" };
        if (url.pathname === "/auth/v1/user") body = user;
        else if (url.pathname === "/auth/v1/signup")
          body = {
            access_token: token,
            refresh_token: "ui-test",
            expires_at: now + 3600,
            expires_in: 3600,
            token_type: "bearer",
            user,
          };
        else if (url.pathname === "/rest/v1/profiles") {
          if (req.method() === "POST") {
            inserts++;
            profile = {
              ...req.postDataJSON(),
              equipped: [],
              coin_balance: 0,
              streak: 0,
              last_meal_date: null,
            };
          } else if (req.method() === "PATCH") {
            profile.avatar = req.postDataJSON().avatar;
            body = { avatar: profile.avatar };
          } else body = profile ? [profile] : [];
        } else if (
          url.pathname === "/rest/v1/shop_items" ||
          url.pathname === "/rest/v1/inventory" ||
          url.pathname === "/rest/v1/daily_progress"
        )
          body = [];
        else if (url.pathname.startsWith("/rest/v1/rpc/")) {
          const rpc = url.pathname.split("/").at(-1);
          calls.push({ rpc, args: req.postDataJSON() });
          body =
            rpc === "get_group_status"
              ? null
              : {
                  id: "group-ui",
                  name: "Sprouts",
                  badge: "leaf",
                  invite_code: "ABC123",
                  creator_id: uid,
                  created_at: new Date().toISOString(),
                };
        } else
          throw Error(
            `Unexpected test backend call: ${req.method()} ${url.pathname}`,
          );
        await route.fulfill({
          status: 200,
          headers,
          body: JSON.stringify(body),
        });
      });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const url = process.env.UI_CHECK_URL || "http://localhost:3000";
      await page.goto(url + "/onboarding");
      await page.getByRole("button", { name: "Start your adventure" }).click();
      await page.getByLabel("Username", { exact: true }).fill("wardrobe_test");
      await page.getByLabel("Height (cm)", { exact: true }).fill("175");
      await page.getByLabel("Weight (kg)", { exact: true }).fill("70");
      await page.getByLabel("Age", { exact: true }).fill("17");
      assert.equal(
        await page
          .getByRole("button", { name: "Next", exact: true })
          .isDisabled(),
        true,
      );
      await page.getByLabel("Age", { exact: true }).fill("24");
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await page
        .getByRole("button", { name: "Maintain Find your rhythm" })
        .click();
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await page
        .getByRole("group", { name: "Preset targets" })
        .getByRole("button")
        .first()
        .click();
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await page
        .getByRole("button", { name: "Skin tone: Deep brown", exact: true })
        .click();
      await page.getByRole("button", { name: "Outfit", exact: true }).click();
      for (const name of [
        "Moss beanie",
        "Linen shirt",
        "Indigo trousers",
        "Canvas sneakers",
      ])
        await page.getByRole("button", { name, exact: true }).click();
      await page.waitForFunction(() => {
        const c = document.querySelector(".customizer-preview canvas");
        return (
          c &&
          c
            .getContext("2d")
            .getImageData(0, 0, c.width, c.height)
            .data.some((v, i) => i % 4 === 3 && v > 0)
        );
      });
      const fingerprint = async (selector) =>
        page.locator(selector).evaluate((c) => {
          let hash = 2166136261;
          for (const value of c
            .getContext("2d")
            .getImageData(0, 0, c.width, c.height).data)
            hash = Math.imul(hash ^ value, 16777619);
          return hash >>> 0;
        });
      const preview = await fingerprint(".customizer-preview canvas");
      if (mode === "solo") {
        for (const width of [320,390,1440]) {
          await page.setViewportSize({width,height:844});
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),`Outfit customizer must fit width ${width}`);
        }
        await page.setViewportSize({width:390,height:844});
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          axe.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.html),
          })),
          [],
          "Customizer accessibility",
        );
      }
      await page.getByRole("button", { name: "Next", exact: true }).click();
      if (mode === "solo")
        await page
          .getByRole("button", { name: "Continue solo", exact: true })
          .click();
      else if (mode === "create") {
        await page
          .getByRole("button", { name: "Create a group", exact: true })
          .click();
        await page.getByLabel("Group name", { exact: true }).fill("Sprouts");
        await page
          .getByRole("button", { name: "Create group", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .click();
      } else {
        await page
          .getByRole("button", { name: "Join a group", exact: true })
          .click();
        await page.getByLabel("Invite code", { exact: true }).fill("ABC123");
        await page.getByRole("button", { name: "Join", exact: true }).click();
      }
      await page.waitForURL(url + "/");
      await page
        .locator('.room-character canvas[data-sprite-ready="true"]')
        .waitFor();
      assert.equal(inserts, 1, "Profile saved exactly once");
      assert.deepEqual(
        [
          profile.avatar.hat,
          profile.avatar.clothing,
          profile.avatar.pants,
          profile.avatar.shoes,
        ],
        ["moss-beanie", "linen-shirt", "indigo-trousers", "canvas-sneakers"],
      );
      assert.equal(
        await fingerprint(".room-character canvas"),
        preview,
        "Onboarding and real Home controller render identical saved appearance",
      );
      if (mode !== "solo")
        assert.ok(
          calls.some(
            (c) =>
              c.rpc === (mode === "create" ? "create_group" : "join_group"),
          ),
          "Original group handler invoked",
        );
      await page.reload();
      await page
        .locator('.room-character canvas[data-sprite-ready="true"]')
        .waitFor();
      assert.equal(
        await fingerprint(".room-character canvas"),
        preview,
        "Saved appearance survives reload",
      );
      if (mode === "solo") {
        await page.goto(url + "/shop");
        await page
          .getByRole("button", { name: "Starter wardrobe", exact: true })
          .click();
        assert.equal(
          await page
            .getByRole("button", { name: "Moss beanie", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        await page
          .getByRole("button", { name: "Straw sunhat", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Save outfit", exact: true })
          .click();
        await page
          .getByRole("status")
          .filter({ hasText: "Outfit saved." })
          .waitFor();
        assert.equal(
          profile.avatar.hat,
          "straw-sunhat",
          "Real ShopController uses owner saveAvatar PATCH",
        );
        await page.reload();
        await page
          .getByRole("button", { name: "Starter wardrobe", exact: true })
          .click();
        assert.equal(
          await page
            .getByRole("button", { name: "Straw sunhat", exact: true })
            .getAttribute("aria-pressed"),
          "true",
          "Saved Shop choice survives reload",
        );
        assert.equal(
          profile.coin_balance,
          0,
          "Starter clothes do not spend coins",
        );
        assert.ok(
          !calls.some((c) => c.rpc === "buy_item" || c.rpc === "equip_item"),
          "Starter choices never invoke paid inventory RPCs",
        );
      }
      assert.deepEqual(errors, [], `${mode} browser errors`);
      console.log(
        `PASS: ${mode} onboarding, age guard, saved wardrobe -> real Home controller -> reload, intercepted backend only.`,
      );
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
