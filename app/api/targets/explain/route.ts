// POST /api/targets/explain -> { explanation }: a short, friendly explanation of the formula's targets.
// The numbers come from lib/targets/recommend.ts (Mifflin-St Jeor); the AI only explains them, never changes them.
// No sign-in needed (it runs during onboarding, before a session exists), so inputs are validated and the
// answer is short. Owner: @DLYK2006
import { ACTIVITY_LEVELS, recommendTargets, type ActivityLevel } from "@/lib/targets/recommend";
import type { GoalType } from "@/types";

const GOALS: GoalType[] = ["bulk", "cut", "maintain"];
const inRange = (v: unknown, lo: number, hi: number) => typeof v === "number" && v >= lo && v <= hi;

const PROMPT = `You explain personal nutrition targets in a cozy, encouraging fitness app.
In 2 short sentences (max 45 words): say what the daily calories and protein are based on (their stats and how often they exercise) and what the goal adjustment means.
Rules: these are estimates, not medical advice; never suggest eating less than the given numbers; no shame; don't invent other numbers.`;

export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  if (
    !b || !inRange(b.weight_kg, 30, 300) || !inRange(b.height_cm, 120, 230) || !inRange(b.age, 18, 100) ||
    !GOALS.includes(b.goal) || !ACTIVITY_LEVELS.some((a) => a.id === b.activity)
  ) return Response.json({ error: "Bad input." }, { status: 400 });

  // Recompute on the server so the explanation always matches the real formula.
  const r = recommendTargets({ weight_kg: b.weight_kg, height_cm: b.height_cm, age: b.age, goal: b.goal, activity: b.activity as ActivityLevel });
  const activity = ACTIVITY_LEVELS.find((a) => a.id === b.activity)!.label;
  const facts = `Goal: ${b.goal}. Age ${b.age}, ${b.height_cm} cm, ${b.weight_kg} kg, exercises ${activity.toLowerCase()}.
Maintenance energy about ${r.tdee} kcal; target ${r.calorie_target} kcal (${b.goal === "bulk" ? "+10%" : b.goal === "cut" ? "-15%, never below 1500" : "maintenance"}); protein ${r.protein_target_g} g.`;

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.6-luna", input: [{ role: "system", content: PROMPT }, { role: "user", content: facts }] }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return Response.json({ error: "No explanation right now." }, { status: 504 });
  }
  if (!res.ok) {
    console.error("targets explain failed", res.status, await res.text());
    return Response.json({ error: "No explanation right now." }, { status: 502 });
  }
  const out = await res.json();
  const text: string | undefined = out.output
    ?.flatMap((o: { type: string; content?: { type: string; text?: string }[] }) => (o.type === "message" ? o.content ?? [] : []))
    .find((c: { type: string }) => c.type === "output_text")?.text;
  if (!text) return Response.json({ error: "No explanation right now." }, { status: 502 });
  return Response.json({ explanation: text.trim().slice(0, 400), ...r });
}
