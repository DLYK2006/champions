/** Inclusive filters passed to the future Databricks analysis view; no dates means all history. */
export type AnalysisRange =
  | { kind: "all" }
  | { kind: "range"; from: string; to: string };
export function validHistoryDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function analysisRange(
  from: string,
  to: string,
  today: string,
): AnalysisRange {
  if (!from && !to) return { kind: "all" };
  if (!validHistoryDate(from) || !validHistoryDate(to))
    throw new Error("Choose both a start and end date.");
  if (from > to) throw new Error("End date must be on or after start date.");
  if (to > today) throw new Error("Choose dates up to today.");
  return { kind: "range", from, to };
}
