// POST /api/scan -> ScanResult (docs/BUILD_PLAN.md). Owner: @DLYK2006
// Estimates only; nothing is saved. Requires a signed-in Supabase user so the public URL can't spend our OpenAI credits.
import { createClient } from "@supabase/supabase-js";
import type { Confidence, ScanItem, ScanResult } from "@/types";
import { sumMacros } from "@/lib/scan";

const TIMEOUT_MS = 8000;
const MAX_IMAGE_B64 = 4_000_000; // ~3 MB image; resized photos are far smaller
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const PROMPT = `You estimate nutrition from a meal photo or description for a supportive fitness app.
List each visible food item with a short portion description, estimated grams, calories, protein, carbs and fat for that portion.
Use confidence "low" when the food or portion is unclear. If there is no food, return an empty items list.
coach_tip: one short, encouraging sentence about the meal (e.g. a protein or veggie pairing idea). Never shame, never suggest skipping meals or eating less. Use null if nothing useful to say.`;

const num = { type: "number" };
const confidence = { type: "string", enum: ["high", "medium", "low"] };
const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, portion: { type: "string" }, grams: num, calories: num, protein_g: num, carbs_g: num, fat_g: num, confidence },
        required: ["name", "portion", "grams", "calories", "protein_g", "carbs_g", "fat_g", "confidence"],
        additionalProperties: false,
      },
    },
    overall_confidence: confidence,
    coach_tip: { type: ["string", "null"] },
  },
  required: ["items", "overall_confidence", "coach_tip"],
  additionalProperties: false,
};

const fail = (status: number, error: string) => Response.json({ error }, { status });
const clean = (n: number) => (Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0);

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return fail(401, "Sign in to scan meals.");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: auth } = await supabase.auth.getUser(token);
  if (!auth.user) return fail(401, "Sign in to scan meals.");

  const body = await request.json().catch(() => null);
  let content: object[];
  if (typeof body?.image_base64 === "string" && IMAGE_TYPES.includes(body.mime_type)) {
    if (body.image_base64.length > MAX_IMAGE_B64) return fail(413, "That photo is too large.");
    content = [
      { type: "input_text", text: "Estimate the nutrition of this meal." },
      { type: "input_image", image_url: `data:${body.mime_type};base64,${body.image_base64}`, detail: "auto" },
    ];
  } else if (typeof body?.text === "string" && body.text.trim() && body.text.length <= 500) {
    content = [{ type: "input_text", text: `Estimate the nutrition of this meal: ${body.text.trim()}` }];
  } else {
    return fail(400, "Send { image_base64, mime_type } or { text }.");
  }

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        input: [{ role: "system", content: PROMPT }, { role: "user", content }],
        text: { format: { type: "json_schema", name: "scan_result", strict: true, schema: SCHEMA } },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") return fail(504, "The scan took too long. Try again or enter it manually.");
    throw e;
  }
  if (!res.ok) {
    console.error("openai scan failed", res.status, await res.text());
    return fail(502, "Couldn't estimate this meal. Try again or enter it manually.");
  }

  const out = await res.json();
  const text: string | undefined = out.output
    ?.flatMap((o: { type: string; content?: { type: string; text?: string }[] }) => (o.type === "message" ? o.content ?? [] : []))
    .find((c: { type: string }) => c.type === "output_text")?.text;
  if (!text) {
    console.error("openai scan: no output_text", JSON.stringify(out).slice(0, 500));
    return fail(502, "Couldn't estimate this meal. Try again or enter it manually.");
  }

  const raw = JSON.parse(text) as { items: ScanItem[]; overall_confidence: Confidence; coach_tip: string | null };
  const items = raw.items
    .filter((i) => i.name.trim())
    .map((i) => ({ ...i, grams: clean(i.grams), calories: clean(i.calories), protein_g: clean(i.protein_g), carbs_g: clean(i.carbs_g), fat_g: clean(i.fat_g) }));
  if (!items.length) return fail(422, "No food found in that photo. Try another angle or enter it manually.");

  const result: ScanResult = { items, total: sumMacros(items), overall_confidence: raw.overall_confidence, coach_tip: raw.coach_tip };
  return Response.json(result);
}
