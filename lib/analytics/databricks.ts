// Server only: Databricks SQL Statement Execution API (POST /api/2.0/sql/statements). Owner: @DLYK2006
// Env: DATABRICKS_HOST (workspace hostname), DATABRICKS_TOKEN (PAT, sql scope), DATABRICKS_WAREHOUSE_ID.
// Free Edition: one 2X-Small serverless warehouse; cold start measured ~7 s, warm ~1 s.
import { createHash } from "node:crypto";

export const MEALS_TABLE = "workspace.digin.meals";

// Meals are stored under an anonymous id, never the username or Supabase user id itself.
export const anonId = (userId: string) => createHash("sha256").update(`digin:${userId}`).digest("hex");

type Param = { name: string; value: string | null; type?: string };

export async function runSql(statement: string, parameters: Param[] = [], timeoutMs = 50_000): Promise<string[][]> {
  const host = process.env.DATABRICKS_HOST!.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const res = await fetch(`https://${host}/api/2.0/sql/statements/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.DATABRICKS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      warehouse_id: process.env.DATABRICKS_WAREHOUSE_ID,
      statement,
      parameters,
      wait_timeout: `${Math.min(50, Math.max(5, Math.ceil(timeoutMs / 1000)))}s`,
      on_wait_timeout: "CANCEL",
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = await res.json();
  if (!res.ok || body.status?.state !== "SUCCEEDED") {
    throw new Error(`Databricks ${res.status} ${body.status?.state ?? body.error_code}: ${body.status?.error?.message ?? body.message ?? ""}`);
  }
  return body.result?.data_array ?? [];
}

export const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS ${MEALS_TABLE} (
    event_id STRING, anon_id STRING, date DATE, meal_type STRING,
    calories DOUBLE, protein_g DOUBLE, carbs_g DOUBLE, fat_g DOUBLE, logged_at TIMESTAMP
  )`;

export interface MealRow {
  event_id: string; user_id: string; date: string; meal_type: string;
  calories: number; protein_g: number; carbs_g: number; fat_g: number; created_at: string;
}

// Idempotent on event_id, like log_meal: re-sending a meal never double counts.
export const upsertMeal = (m: MealRow) =>
  runSql(
    `MERGE INTO ${MEALS_TABLE} t
     USING (SELECT :event_id AS event_id, :anon_id AS anon_id, CAST(:date AS DATE) AS date, :meal_type AS meal_type,
                   CAST(:calories AS DOUBLE) AS calories, CAST(:protein_g AS DOUBLE) AS protein_g,
                   CAST(:carbs_g AS DOUBLE) AS carbs_g, CAST(:fat_g AS DOUBLE) AS fat_g,
                   CAST(:logged_at AS TIMESTAMP) AS logged_at) s
     ON t.event_id = s.event_id
     WHEN NOT MATCHED THEN INSERT *`,
    [
      { name: "event_id", value: m.event_id },
      { name: "anon_id", value: anonId(m.user_id) },
      { name: "date", value: m.date },
      { name: "meal_type", value: m.meal_type },
      { name: "calories", value: String(m.calories) },
      { name: "protein_g", value: String(m.protein_g) },
      { name: "carbs_g", value: String(m.carbs_g) },
      { name: "fat_g", value: String(m.fat_g) },
      { name: "logged_at", value: m.created_at },
    ],
  );
