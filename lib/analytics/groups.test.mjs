// Run: node --experimental-strip-types --test lib/analytics/groups.test.mjs   (Node 22.18+ needs no flag)
import test from "node:test";
import assert from "node:assert/strict";
import { GROUP_TABLE, CREATE_GROUP_TABLE, SCORES_TIMEOUT_MS, upsertGroupDayStatement, groupScoresStatement, toScoreRows } from "./groups.ts";

const param = (q, name) => q.parameters.find((p) => p.name === name)?.value;
const day = { group_id: "g1", date: "2026-11-15", eligible_member_count: 3, completed_member_count: 2, completion_percentage: 66.7, bonus_tier: 10 };

test("the table lives next to the meals table and holds only group aggregates", () => {
  assert.equal(GROUP_TABLE, "workspace.digin.group_daily");
  assert.match(CREATE_GROUP_TABLE, /CREATE TABLE IF NOT EXISTS workspace\.digin\.group_daily/);
  for (const col of ["group_id", "date", "eligible", "completed", "completion_pct", "bonus_tier"]) assert.match(CREATE_GROUP_TABLE, new RegExp(col));
  assert.doesNotMatch(CREATE_GROUP_TABLE, /name|user|username|calor/i);
});

test("upsertGroupDayStatement MERGEs on group_id and date and updates a matched row", () => {
  const q = upsertGroupDayStatement(day);
  assert.match(q.statement, /MERGE INTO workspace\.digin\.group_daily/);
  assert.match(q.statement, /ON t\.group_id = s\.group_id AND t\.date = s\.date/);
  assert.match(q.statement, /WHEN MATCHED THEN UPDATE SET \*/);
  assert.match(q.statement, /WHEN NOT MATCHED THEN INSERT \*/);
  assert.deepEqual(
    ["group_id", "date", "eligible", "completed", "completion_pct", "bonus_tier"].map((n) => param(q, n)),
    ["g1", "2026-11-15", "3", "2", "66.7", "10"],
  );
});

test("groupScoresStatement binds today, reads the group table and uses the 3 s read timeout", () => {
  const q = groupScoresStatement("2026-11-15");
  assert.equal(param(q, "today"), "2026-11-15");
  assert.match(q.statement, /workspace\.digin\.group_daily/);
  assert.match(q.statement, /:today/);
  assert.equal(q.timeoutMs, 3000);
  assert.equal(SCORES_TIMEOUT_MS, 3000);
});

test("the scoring SQL keeps the spec's rules: 2+ members, 7-day window, tier 30, no names", () => {
  const { statement } = groupScoresStatement("2026-11-15");
  assert.match(statement, /eligible >= 2/);
  assert.match(statement, /DATE_SUB\(CAST\(:today AS DATE\), 6\)/);
  assert.match(statement, /bonus_tier = 30/);
  assert.doesNotMatch(statement, /name/i);
});

test("toScoreRows maps Databricks string rows to numeric ScoreRow values", () => {
  assert.deepEqual(toScoreRows([["g1", "83.3", "2"], ["g2", "40.0", "0"]]), [
    { group_id: "g1", consistency_7d: 83.3, full_bloom_streak: 2 },
    { group_id: "g2", consistency_7d: 40, full_bloom_streak: 0 },
  ]);
  assert.deepEqual(toScoreRows([]), []);
});
