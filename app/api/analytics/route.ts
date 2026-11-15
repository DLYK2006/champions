// GET /api/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD (or ?date=YYYY-MM-DD, or nothing for all dates)
// -> { source: "databricks" | "supabase", days: [{ date, calories, protein_g, carbs_g, fat_g }] }
// Daily totals from the Databricks SQL warehouse. If Databricks doesn't answer within 3 s (Free Edition cold
// start is ~7 s) or is down, falls back to Supabase daily_progress (Daren's choice) and says so in `source`.
// Owner: @DLYK2006
import { createClient } from "@supabase/supabase-js";
import { MEALS_TABLE, anonId, runSql } from "@/lib/analytics/databricks";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const num = (v: unknown) => Math.round(Number(v ?? 0) * 10) / 10;

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return Response.json({ error: "Sign in first." }, { status: 401 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: auth } = await supabase.auth.getUser(token);
  if (!auth.user) return Response.json({ error: "Sign in first." }, { status: 401 });

  const q = new URL(request.url).searchParams;
  const from = q.get("date") ?? q.get("from") ?? "1900-01-01";
  const to = q.get("date") ?? q.get("to") ?? "2999-12-31";
  if (!DAY.test(from) || !DAY.test(to) || from > to) return Response.json({ error: "Bad date range." }, { status: 400 });

  try {
    const rows = await runSql(
      `SELECT CAST(date AS STRING), SUM(calories), SUM(protein_g), SUM(carbs_g), SUM(fat_g)
       FROM ${MEALS_TABLE} WHERE anon_id = :anon_id AND date BETWEEN CAST(:from AS DATE) AND CAST(:to AS DATE)
       GROUP BY date ORDER BY date`,
      [{ name: "anon_id", value: anonId(auth.user.id) }, { name: "from", value: from }, { name: "to", value: to }],
      3000,
    );
    const days = rows.map(([date, calories, protein_g, carbs_g, fat_g]) => ({
      date, calories: num(calories), protein_g: num(protein_g), carbs_g: num(carbs_g), fat_g: num(fat_g),
    }));
    return Response.json({ source: "databricks", days });
  } catch (e) {
    console.warn("analytics: databricks read failed, using supabase", e instanceof Error ? e.message : e);
  }

  const { data, error } = await supabase
    .from("daily_progress")
    .select("date, total_calories, total_protein_g, total_carbs_g, total_fat_g")
    .gte("date", from).lte("date", to).order("date");
  if (error) return Response.json({ error: "Couldn't load your analytics." }, { status: 500 });
  const days = data
    .filter((d) => Number(d.total_calories) > 0)
    .map((d) => ({ date: d.date, calories: num(d.total_calories), protein_g: num(d.total_protein_g), carbs_g: num(d.total_carbs_g), fat_g: num(d.total_fat_g) }));
  return Response.json({ source: "supabase", days });
}
