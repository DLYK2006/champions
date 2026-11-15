import test from "node:test";
import assert from "node:assert/strict";
import { wardrobeSelection } from "./wardrobe.ts";

const avatar = {
  skinColor: "edb98a",
  top: "curly",
  hairColor: "2c1b18",
  eyes: "default",
  mouth: "smile",
  clothing: "hoodie",
};
test("starter selection never labels legacy clothes as a different worn item", () => {
  assert.equal(wardrobeSelection(avatar, "clothing"), "forest-jacket");
  assert.equal(
    wardrobeSelection({ ...avatar, clothing: "shirtCrewNeck" }, "clothing"),
    "linen-shirt",
  );
  for (const clothing of ["overall", "graphicShirt"])
    assert.equal(
      wardrobeSelection({ ...avatar, clothing }, "clothing"),
      clothing,
    );
});
test("implicit legacy cap and explicit No hat are distinct selections", () => {
  assert.equal(
    wardrobeSelection({ ...avatar, top: "hat" }, "hat"),
    "legacy-cap",
  );
  assert.equal(
    wardrobeSelection({ ...avatar, top: "hat", hat: "none" }, "hat"),
    "none",
  );
  assert.equal(
    wardrobeSelection({ ...avatar, hat: "moss-beanie" }, "hat"),
    "moss-beanie",
  );
});
