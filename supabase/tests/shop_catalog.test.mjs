// 0009 shop catalog v2: six new paid items, old rows and ownership untouched. Same PGlite harness.
// Run:  npm i --no-save @electric-sql/pglite  &&  node supabase/tests/shop_catalog.test.mjs
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const dir = fileURLToPath(new URL("../migrations/", import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
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
for (const f of files.filter((f) => f < "0009")) await db.exec(readFileSync(dir + f, "utf8"));
await db.exec(readFileSync(new URL("../seed.sql", import.meta.url), "utf8").split("-- Catalog v2")[0]); // original 3 items
const U = "00000000-0000-0000-0000-0000000000d1";
await db.exec(`insert into auth.users values ('${U}');
  insert into profiles (id, username, goal_type, height_cm, weight_kg, age, calorie_target, protein_target_g) values ('${U}', 'shopper', 'maintain', 175, 70, 25, 2000, 100);
  update profiles set coin_balance = 200 where id = '${U}';
  insert into inventory (user_id, item_id, equipped) values ('${U}', 'crown', true);
  update profiles set equipped = '{crown}' where id = '${U}';`);

const migration = readFileSync(dir + files.find((f) => f.startsWith("0009")), "utf8");
await db.exec(migration);
await db.exec(migration); // re-running is harmless
const ids = (await db.query(`select id, category, cost from shop_items order by id`)).rows;
assert.equal(ids.length, 9);
assert.deepEqual(ids.filter((r) => ["acorn-cap", "slate-cargos", "rust-flannel"].includes(r.id)).map((r) => `${r.id}:${r.category}:${r.cost}`),
  ["acorn-cap:hat:25", "rust-flannel:outfit:50", "slate-cargos:pants:45"]);

async function as(sql) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${U}', false); set role authenticated;`);
  try { return (await db.query(sql)).rows[0]?.r; } finally { await db.exec(`reset role;`); }
}
assert.equal((await as(`select buy_item('acorn-cap') r`)).coin_balance, 175);
assert.equal((await as(`select buy_item('slate-cargos') r`)).coin_balance, 130);
const worn = await as(`select save_outfit('{"skinColor":"x"}'::jsonb, array['acorn-cap','slate-cargos','crown']) r`);
assert.deepEqual(worn.equipped, ["acorn-cap", "crown", "slate-cargos"]); // old crown still wearable
assert.equal((await db.query(`select count(*)::int n from inventory where user_id = '${U}'`)).rows[0].n, 3);
console.log("shop catalog v2: all checks pass");
