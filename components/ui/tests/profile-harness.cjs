/* eslint-disable @typescript-eslint/no-require-imports -- Intercepted browser-test backend, never production. */
const assert = require("node:assert/strict");
module.exports = async function profileHarness(
  browser,
  {
    session = true,
    complete = true,
    viewport = { width: 1280, height: 900 },
  } = {},
) {
  const base = process.env.UI_CHECK_URL || "http://localhost:3000";
  assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):/);
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
    timezoneId: "America/Chicago",
  });
  const id = "10000000-0000-4000-8000-000000000065",
    now = Math.floor(Date.now() / 1000);
  const user = {
    id,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const token = [
    "eyJhbGciOiJIUzI1NiJ9",
    Buffer.from(
      JSON.stringify({
        sub: id,
        aud: "authenticated",
        role: "authenticated",
        iat: now,
        exp: now + 3600,
      }),
    ).toString("base64url"),
    "test-only-signature",
  ].join(".");
  if (session)
    await context.addCookies([
      {
        name: "sb-digin-ui-test-auth-token",
        value:
          "base64-" +
          Buffer.from(
            JSON.stringify({
              access_token: token,
              refresh_token: "ui-test",
              expires_at: now + 3600,
              expires_in: 3600,
              token_type: "bearer",
              user,
            }),
          ).toString("base64url"),
        url: base,
        sameSite: "Lax",
      },
    ]);
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
  });
  const model = {
    profile: {
      id,
      username: "jay_test",
      height_cm: 175,
      weight_kg: 70,
      age: 24,
      goal_type: "maintain",
      target_weight_kg: 70,
      calorie_target: 2200,
      protein_target_g: 120,
      carbs_target_g: 250,
      fat_target_g: 70,
      unit_preference: "metric",
      hide_status_from_group: false,
      notify_meal_reminders: false,
      notify_group_alerts: false,
      avatar: {
        skinColor: "edb98a",
        top: "curly",
        hairColor: "724133",
        eyes: "default",
        mouth: "smile",
        clothing: "forest-jacket",
        hat: "none",
        pants: "cocoa-trousers",
        shoes: "hiking-boots",
      },
      equipped: ["hoodie"],
      coin_balance: 120,
      streak: 3,
      last_meal_date: "2020-01-01",
    },
    owned: ["hoodie"],
    calls: [],
    failSettings: false,
    failOutfit: false,
    failLoad: false,
    buyCount: 0,
    days: [
      {
        date: today,
        meals_logged: 1,
        total_calories: 1400,
        total_protein_g: 90,
        total_carbs_g: 160,
        total_fat_g: 40,
        personal_goal_completed: false,
      },
    ],
    items: [
      ...[
        ["sage-sweater", "Sage Sweater", "shirt", 40],
        ["rust-flannel", "Rust Flannel", "shirt", 50],
        ["meadow-trousers", "Meadow Trousers", "pants", 30],
        ["slate-cargos", "Slate Cargos", "pants", 45],
        ["acorn-cap", "Acorn Cap", "hat", 25],
        ["fisher-bucket", "Fisher Bucket", "hat", 35],
      ].map(([id, name, category, cost]) => ({
        id,
        name,
        category,
        cost,
        asset_ref: id,
      })),
      {
        id: "hoodie",
        name: "Woodland Hoodie",
        category: "clothing",
        cost: 40,
        asset_ref: "hoodie",
      },
      {
        id: "crown",
        name: "Crown",
        category: "headwear",
        cost: 60,
        asset_ref: "crown",
      },
      {
        id: "sunglasses",
        name: "Sunglasses",
        category: "accessory",
        cost: 20,
        asset_ref: "sunglasses",
      },
    ],
  };
  await context.route("https://**.supabase.co/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    assert.equal(
      url.hostname,
      "digin-ui-test.supabase.co",
      "Tests may only call the dummy backend",
    );
    let body = null,
      status = 200;
    const args = req.postData() ? req.postDataJSON() : null;
    model.calls.push({ path: url.pathname, method: req.method(), args });
    if (url.pathname === "/auth/v1/user") body = user;
    else if (url.pathname === "/rest/v1/profiles") {
      if (model.failLoad) {
        status = 503;
        body = { message: "Test load outage" };
      } else if (req.method() === "PATCH") {
        if (model.failSettings) {
          status = 503;
          body = { message: "Test save outage" };
        } else {
          assert.ok(
            !("coin_balance" in args || "equipped" in args || "streak" in args),
          );
          Object.assign(model.profile, args);
          body = [model.profile];
        }
      } else body = complete ? [model.profile] : [];
    } else if (url.pathname === "/rest/v1/shop_items") body = model.items;
    else if (url.pathname === "/rest/v1/inventory")
      body = model.owned.map((item_id) => ({
        item_id,
        equipped: model.profile.equipped.includes(item_id),
      }));
    else if (url.pathname === "/rest/v1/daily_progress") body = model.days;
    else if (url.pathname === "/rest/v1/meals")
      body = [
        {
          id: "meal-one",
          meal_type: "lunch",
          items: [{ name: "Garden bowl" }],
          calories: 1400,
          protein_g: 90,
          carbs_g: 160,
          fat_g: 40,
          created_at: today + "T12:00:00",
        },
      ];
    else if (url.pathname.endsWith("/get_group_status")) body = null;
    else if (url.pathname.endsWith("/buy_item")) {
      model.buyCount++;
      await new Promise((r) => setTimeout(r, 200));
      const item = model.items.find((i) => i.id === args.p_item_id);
      if (
        !item ||
        model.owned.includes(item.id) ||
        model.profile.coin_balance < item.cost
      ) {
        status = 400;
        body = { message: "already owned or not enough coins" };
      } else {
        model.profile.coin_balance -= item.cost;
        model.owned.push(item.id);
        body = { coin_balance: model.profile.coin_balance };
      }
    } else if (url.pathname.endsWith("/save_outfit")) {
      await new Promise((r) => setTimeout(r, 200));
      if (model.failOutfit) {
        status = 503;
        body = { message: "Outfit save failed" };
      } else {
        model.profile.avatar = args.p_avatar;
        model.profile.equipped = args.p_equipped;
        body = {
          avatar: model.profile.avatar,
          equipped: model.profile.equipped,
        };
      }
    } else throw Error("Unexpected intercepted endpoint: " + url.pathname);
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return { context, page, base, model, errors };
};
