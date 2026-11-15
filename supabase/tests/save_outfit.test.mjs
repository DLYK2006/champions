// 0008: save_outfit saves avatar + owned equipped items atomically. Same PGlite harness as the other tests.
// Run:  npm i --no-save @electric-sql/pglite  &&  node supabase/tests/save_outfit.test.mjs
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const dir = fileURLToPath(new URL("../migrations/", import.meta.url));
const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create publication supabase_realtime;
  grant usage on schema public, auth to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);
for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) await db.exec(readFileSync(dir + f, "utf8"));

const A = "00000000-0000-0000-0000-0000000000a1";
const B = "00000000-0000-0000-0000-0000000000b1";
await db.exec(`
  insert into shop_items (id, name, category, cost, asset_ref) values
    ('sunglasses', 'Sunglasses', 'accessory', 20, 's'), ('hoodie', 'Hoodie', 'outfit', 40, 'h'), ('crown', 'Crown', 'hat', 60, 'c')
    on conflict do nothing;
  insert into auth.users values ('${A}'), ('${B}');
  insert into profiles (id, username, goal_type, height_cm, weight_kg, age, target_weight_kg, calorie_target, protein_target_g)
  values ('${A}', 'alex', 'maintain', 175, 70, 25, null, 2500, 120), ('${B}', 'bo', 'maintain', 175, 70, 25, null, 2500, 120);
  update profiles set coin_balance = 100;
  insert into inventory (user_id, item_id, equipped) values ('${A}', 'sunglasses', true), ('${A}', 'hoodie', false);
  update profiles set equipped = '{sunglasses}' where id = '${A}';
`);

const look = { skinColor: "edb98a", top: "shortFlat", hairColor: "2c1b18", eyes: "default", mouth: "smile", clothing: "hoodie", hat: "beanie" };

async function as(user, sql, params = []) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${user ?? ""}', false); set role ${user ? "authenticated" : "anon"};`);
  try {
    return (await db.query(sql, params)).rows;
  } finally {
    await db.exec(`reset role;`);
  }
}
const save = (user, avatar, equipped) =>
  as(user, `select save_outfit($1::jsonb, $2::text[]) r`, [JSON.stringify(avatar), equipped]).then((rows) => rows[0].r);
const state = async (user) => {
  const p = (await db.query(`select avatar, equipped, coin_balance from profiles where id = $1`, [user])).rows[0];
  const inv = (await db.query(`select item_id from inventory where user_id = $1 and equipped order by item_id`, [user])).rows.map((r) => r.item_id);
  return { ...p, inv };
};

// Swap sunglasses for hoodie and change the free look in one call.
let r = await save(A, look, ["hoodie", "hoodie"]);
assert.deepEqual(r, { avatar: look, equipped: ["hoodie"] });
let s = await state(A);
assert.deepEqual(s.avatar, look);
assert.deepEqual(s.equipped, ["hoodie"]);
assert.deepEqual(s.inv, ["hoodie"]);
assert.equal(s.coin_balance, 100);
console.log("ok - saves avatar + equipped, syncs inventory, dedupes, coins untouched");

// Wearing everything owned, then nothing.
r = await save(A, look, ["sunglasses", "hoodie"]);
assert.deepEqual(r.equipped, ["hoodie", "sunglasses"]);
r = await save(A, look, []);
assert.deepEqual(r.equipped, []);
assert.deepEqual((await state(A)).inv, []);
console.log("ok - equip all / unequip all");

// Not owned (crown) or unknown ids are rejected, and nothing changes (atomic).
const before = await state(A);
await assert.rejects(save(A, { ...look, clothing: "tee" }, ["sunglasses", "crown"]), /not owned/);
await assert.rejects(save(A, look, ["dragon"]), /not owned/);
await assert.rejects(save(B, look, ["sunglasses"]), /not owned/); // someone else's item
assert.deepEqual(await state(A), before);
console.log("ok - rejects unowned / unknown items without a partial save");

// Bad input and callers.
await assert.rejects(save(A, ["not", "an", "object"], []), /invalid avatar/);
await assert.rejects(save(null, look, []), /permission denied|not signed in/);
console.log("ok - rejects a non-object avatar and anonymous callers");

console.log("save_outfit: all checks pass");
