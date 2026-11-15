// Run: node lib/friends/friends.test.mjs   (Node 22.18+ strips TypeScript types natively)
import test from "node:test";
import assert from "node:assert/strict";
import * as f from "./friends.ts";

test("searchTerm needs 3 characters after trimming", () => {
  assert.equal(f.searchTerm(""), null);
  assert.equal(f.searchTerm("  al "), null);
  assert.equal(f.searchTerm("  ale "), "ale");
});

test("friendlyFriendsError capitalises the SQL message and hides permission errors", () => {
  assert.equal(f.friendlyFriendsError("request already sent"), "Request already sent.");
  assert.equal(f.friendlyFriendsError("you can't add yourself"), "You can't add yourself.");
  assert.equal(f.friendlyFriendsError("Done!"), "Done!");
  assert.equal(f.friendlyFriendsError("permission denied for function list_friends"), "Sign in to use friends");
  assert.equal(f.friendlyFriendsError(" "), "Something went wrong. Try again.");
});

test("monthRange covers the whole month, including leap February", () => {
  assert.deepEqual(f.monthRange(2026, 10), { from: "2026-11-01", to: "2026-11-30" });
  assert.deepEqual(f.monthRange(2028, 1), { from: "2028-02-01", to: "2028-02-29" });
  assert.deepEqual(f.monthRange(2026, 11), { from: "2026-12-01", to: "2026-12-31" });
});

test("statusByDate marks listed days and leaves the rest as none", () => {
  const status = f.statusByDate({ days: [{ date: "2026-11-13", status: "logged" }, { date: "2026-11-14", status: "goal" }] });
  assert.equal(status("2026-11-14"), "goal");
  assert.equal(status("2026-11-13"), "logged");
  assert.equal(status("2026-11-12"), "none");
});
