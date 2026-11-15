import { test } from "node:test";
import assert from "node:assert/strict";
import { analysisRange } from "./analysis-selection.ts";
test("empty dates mean all history; both dates are required and inclusive", () => {
  assert.deepEqual(analysisRange("", "", "2026-11-15"), { kind: "all" });
  assert.deepEqual(analysisRange("2026-11-01", "2026-11-10", "2026-11-15"), {
    kind: "range",
    from: "2026-11-01",
    to: "2026-11-10",
  });
  assert.deepEqual(analysisRange("2026-11-10", "2026-11-10", "2026-11-15"), {
    kind: "range",
    from: "2026-11-10",
    to: "2026-11-10",
  });
});
test("reject incomplete, reversed, future and impossible dates", () => {
  for (const [from, to] of [
    ["2026-11-01", ""],
    ["", "2026-11-10"],
    ["2026-11-10", "2026-11-01"],
    ["2026-11-01", "2026-11-16"],
    ["2026-02-30", "2026-11-10"],
    ["junk", "2026-11-10"],
  ])
    assert.throws(() => analysisRange(from, to, "2026-11-15"));
});
