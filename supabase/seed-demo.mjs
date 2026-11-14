// Demo-day setup (docs/BUILD_PLAN.md "Seed"). Owner: @DLYK2006.
// 1. On each demo phone, finish onboarding with the usernames below.
// 2. Run on the demo morning, on a machine in the demo timezone:
//      node --env-file=.env.local supabase/seed-demo.mjs mia_demo leo_demo
// It puts both users in one group and logs one meal each at 80% of their calorie and protein
// targets (just short of the 90% goal), all through the real RPCs, so one scan each completes the
// goal on stage. Safe to re-run the same day: the meal event ids are fixed per user and date.
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

const [a, b] = process.argv.slice(2);
if (!a || !b) throw new Error("usage: node --env-file=.env.local supabase/seed-demo.mjs <usernameA> <usernameB>");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const today = new Date().toLocaleDateString("en-CA"); // same local date the phones send
const eventId = (userId) => {
  const h = createHash("sha1").update(`demo-seed:${userId}:${today}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const must = ({ data, error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
};

// Sign in as an onboarded (anonymous) user: attach a throwaway email + one-run password, keep the same user id.
async function signInAs(username) {
  const profile = must(await admin.from("profiles").select("*").eq("username", username).maybeSingle(), `profile ${username}`);
  if (!profile) throw new Error(`no profile with username ${username}: finish onboarding on the phone first`);
  const email = `${username}@digin.test`;
  const password = randomBytes(18).toString("base64url");
  must(await admin.auth.admin.updateUserById(profile.id, { email, password, email_confirm: true }), `set login for ${username}`);
  const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  must(await client.auth.signInWithPassword({ email, password }), `sign in ${username}`);
  return { username, profile, client };
}

const A = await signInAs(a);
const B = await signInAs(b);

const statusA = must(await A.client.rpc("get_group_status", { p_date: today }), "group status A");
const statusB = must(await B.client.rpc("get_group_status", { p_date: today }), "group status B");
if (!statusA && !statusB) {
  const group = must(await A.client.rpc("create_group", { p_name: "Demo Crew", p_badge: "star" }), "create group");
  must(await B.client.rpc("join_group", { p_code: group.invite_code }), "join group");
  console.log(`group "Demo Crew" created, code ${group.invite_code}`);
} else if (!statusA || !statusB || statusA.group.id !== statusB.group.id) {
  throw new Error("the two users are in different groups (or only one is in a group): sort that out in the app first");
} else {
  console.log(`already in group "${statusA.group.name}"`);
}

for (const u of [A, B]) {
  const cal = Math.round(u.profile.calorie_target * 0.8);
  const pro = Math.round(u.profile.protein_target_g * 0.8);
  const items = [{ name: "Demo breakfast", portion: "1 plate", grams: 400, calories: cal, protein_g: pro, carbs_g: 0, fat_g: 0, confidence: "high" }];
  const r = must(await u.client.rpc("log_meal", { p_event_id: eventId(u.profile.id), p_date: today, p_meal_type: "breakfast", p_items: items }), `log_meal ${u.username}`);
  const p = r.progress;
  console.log(`${u.username}: ${p.total_calories}/${u.profile.calorie_target} kcal, ${p.total_protein_g}/${u.profile.protein_target_g} g protein, goal done: ${p.personal_goal_completed}, coins ${r.coin_balance}`);
  if (p.personal_goal_completed) console.warn(`  warning: ${u.username} already met today's goal (they logged other meals), so the on-stage scan won't complete it`);
}
console.log(`ready for ${today}: one scan of ~10-20% of each target completes each goal; the second completes the group (2/2 = tier 30).`);
