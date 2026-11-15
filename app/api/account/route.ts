// DELETE /api/account: permanently delete the signed-in user's account and data (PRD 14.1). Owner: @DLYK2006
// Body { confirm_username } must match the profile, as a server-side check on the UI's "type your username" step.
// Deleting the auth user cascades to profiles -> meals, daily_progress, coin_transactions, inventory,
// group_members. It would also cascade to groups the user created, so the user leaves their group first:
// leave_group hands the group to the oldest remaining member, or deletes it if they were the last one.
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function DELETE(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return fail(401, "Sign in first.");
  const user = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }, // must be capitalized (see app/api/scan/route.ts)
    auth: { persistSession: false },
  });
  const { data: auth } = await user.auth.getUser(token);
  if (!auth.user) return fail(401, "Sign in first.");

  const body = await request.json().catch(() => null);
  const { data: profile, error: pe } = await user.from("profiles").select("username").eq("id", auth.user.id).maybeSingle();
  if (pe) return fail(500, "Couldn't check your account. Try again.");
  if (profile && body?.confirm_username !== profile.username) return fail(400, "Type your username exactly to confirm.");

  const { error: le } = await user.rpc("leave_group");
  if (le && !/not in a group/.test(le.message)) {
    console.error("delete account: leave_group failed", le.message);
    return fail(500, "Couldn't leave your group, so nothing was deleted. Try again.");
  }

  const { error: de } = await createAdminClient().auth.admin.deleteUser(auth.user.id);
  if (de) {
    console.error("delete account: deleteUser failed", de.message);
    return fail(500, "Couldn't delete your account. Try again.");
  }
  return new Response(null, { status: 204 });
}
