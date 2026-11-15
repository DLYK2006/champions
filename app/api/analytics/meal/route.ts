// POST /api/analytics/meal { event_id }: copy one just-logged meal to Databricks. Owner: @DLYK2006
// Called right after log_meal succeeds; the meal is already saved in Supabase, so a failure here only
// means Databricks is behind (GET /api/analytics falls back to Supabase, and the backfill script catches up).
import { createClient } from "@supabase/supabase-js";
import { upsertMeal } from "@/lib/analytics/databricks";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return Response.json({ error: "Sign in first." }, { status: 401 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }, // capitalized: see app/api/scan/route.ts
    auth: { persistSession: false },
  });
  const { data: auth } = await supabase.auth.getUser(token);
  if (!auth.user) return Response.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.event_id !== "string") return Response.json({ error: "Send { event_id }." }, { status: 400 });
  // RLS: users can only read their own meals, so nobody can copy someone else's.
  const { data: meal, error } = await supabase
    .from("meals")
    .select("event_id, user_id, date, meal_type, calories, protein_g, carbs_g, fat_g, created_at")
    .eq("event_id", body.event_id)
    .maybeSingle();
  if (error || !meal) return Response.json({ error: "Meal not found." }, { status: 404 });

  try {
    await upsertMeal(meal);
  } catch (e) {
    console.error("analytics: databricks write failed", e instanceof Error ? e.message : e);
    return Response.json({ error: "Analytics copy failed; the meal itself is saved." }, { status: 502 });
  }
  return new Response(null, { status: 204 });
}
