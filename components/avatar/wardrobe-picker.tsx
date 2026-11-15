"use client";

import {
  STARTER_WARDROBE,
  wardrobeSelection,
  type WardrobeAvatar,
} from "./wardrobe";
import { PixelAvatar } from "./pixel-avatar";
import type { Facing } from "../world/wander";

export function FacingControl({
  value,
  onChange,
}: {
  value: Facing;
  onChange: (facing: Facing) => void;
}) {
  return (
    <div className="facing-control" role="group" aria-label="Preview direction">
      {(
        [
          ["down", "Front"],
          ["left", "Left"],
          ["up", "Back"],
          ["right", "Right"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function WardrobePicker({
  avatar,
  onChange,
  disabled = false,
}: {
  avatar: WardrobeAvatar;
  onChange: (avatar: WardrobeAvatar) => void;
  disabled?: boolean;
}) {
  return (
    <div className="starter-wardrobe">
      {STARTER_WARDROBE.map(({ slot, label, options }) => (
        <fieldset key={slot} disabled={disabled} className="wardrobe-slot">
          <legend>{label}</legend>
          <div className="wardrobe-options">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={wardrobeSelection(avatar, slot) === option.id}
                onClick={() => onChange({ ...avatar, [slot]: option.id })}
              >
                <PixelAvatar
                  config={{ ...avatar, [slot]: option.id }}
                  size={54}
                  transparent
                />
                <span>{option.name}</span>
                <span className="wardrobe-check" aria-hidden="true">
                  {wardrobeSelection(avatar, slot) === option.id
                    ? "\u2713"
                    : "+"}
                </span>
              </button>
            ))}
          </div>
          {slot === "hat" && (
            <button
              type="button"
              className="wardrobe-no-hat"
              aria-pressed={wardrobeSelection(avatar, slot) === "none"}
              onClick={() => onChange({ ...avatar, hat: "none" })}
            >
              No hat
            </button>
          )}
        </fieldset>
      ))}
    </div>
  );
}
