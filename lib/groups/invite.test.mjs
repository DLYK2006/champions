// Run: node lib/groups/invite.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as i from "./invite.ts";

test("inviteLink builds a /groups?code= link", () => {
  assert.equal(i.inviteLink("https://dig.app", "abc123"), "https://dig.app/groups?code=ABC123");
  assert.equal(i.inviteLink("https://dig.app/", " V7DPV3 "), "https://dig.app/groups?code=V7DPV3");
});

test("codeFromSearch reads and normalises the code", () => {
  assert.equal(i.codeFromSearch("?code=abc123"), "ABC123");
  assert.equal(i.codeFromSearch("?x=1&code=V7DPV3"), "V7DPV3");
});

test("codeFromSearch rejects missing or malformed codes", () => {
  assert.equal(i.codeFromSearch(""), null);
  assert.equal(i.codeFromSearch("?code="), null);
  assert.equal(i.codeFromSearch("?code=ABC12"), null);
  assert.equal(i.codeFromSearch("?code=ABC12!"), null);
  assert.equal(i.codeFromSearch("?code=ABCDEFG"), null);
});

test("the default badge is one of the choices", () => {
  assert.ok(i.GROUP_BADGES.includes(i.DEFAULT_BADGE));
  assert.equal(new Set(i.GROUP_BADGES).size, i.GROUP_BADGES.length);
});

test("inviteCodeFromInput accepts a plain code, with any case or spacing", () => {
  assert.equal(i.inviteCodeFromInput("abc123"), "ABC123");
  assert.equal(i.inviteCodeFromInput("  V7DPV3 "), "V7DPV3");
});

test("inviteCodeFromInput pulls the code out of a pasted invite link", () => {
  assert.equal(i.inviteCodeFromInput("https://dig.app/groups?code=abc123"), "ABC123");
  assert.equal(i.inviteCodeFromInput("  http://localhost:3000/groups?code=V7DPV3  "), "V7DPV3");
  assert.equal(i.inviteCodeFromInput("dig.app/groups?x=1&code=ABC123"), "ABC123");
});

test("inviteCodeFromInput returns null for anything that is not a code or invite link", () => {
  assert.equal(i.inviteCodeFromInput(""), null);
  assert.equal(i.inviteCodeFromInput("https://dig.app/groups"), null);
  assert.equal(i.inviteCodeFromInput("https://dig.app/groups?code=ABC12"), null);
  assert.equal(i.inviteCodeFromInput("ABC12"), null);
  assert.equal(i.inviteCodeFromInput("ABCDEFG"), null);
});
