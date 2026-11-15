"use client";

import { useState } from "react";
import type { AvatarConfig } from "@/types";
import {
  AVATAR_OPTIONS,
  AVATAR_LABELS,
} from "@/components/onboarding/avatarOptions";
import { avatarOptionLabel } from "./option-labels";
import { PixelAvatar } from "./pixel-avatar";
import { FacingControl, WardrobePicker } from "./wardrobe-picker";
import type { WardrobeAvatar } from "./wardrobe";
import type { Facing } from "../world/wander";

export function AvatarCustomizer({
  value,
  onChange,
}: {
  value: WardrobeAvatar;
  onChange: (avatar: WardrobeAvatar) => void;
}) {
  const [tab, setTab] = useState<"appearance" | "outfit">("appearance");
  const [facing, setFacing] = useState<Facing>("down");
  return (
    <div className="avatar-customizer">
      <div className="customizer-preview">
        <PixelAvatar
          config={value}
          size={190}
          name="Your customized pixel avatar"
          transparent
          facing={facing}
        />
        <FacingControl value={facing} onChange={setFacing} />
      </div>
      <div className="customizer-controls">
        <div
          className="wardrobe-mode"
          role="group"
          aria-label="Customize character"
        >
          <button
            type="button"
            aria-pressed={tab === "appearance"}
            onClick={() => setTab("appearance")}
          >
            Appearance
          </button>
          <button
            type="button"
            aria-pressed={tab === "outfit"}
            onClick={() => setTab("outfit")}
          >
            Outfit
          </button>
        </div>
        {tab === "outfit" ? (
          <WardrobePicker avatar={value} onChange={onChange} />
        ) : (
          (
            [
              "skinColor",
              "hairColor",
              "top",
              "eyes",
              "mouth",
            ] as (keyof AvatarConfig)[]
          ).map((key) => (
            <fieldset
              className={`appearance-options ${key === "skinColor" || key === "hairColor" ? "is-color" : ""}`}
              key={key}
            >
              <legend>{AVATAR_LABELS[key]}</legend>
              <div>
                {AVATAR_OPTIONS[key].map((option) => (
                  <button
                    type="button"
                    key={option}
                    aria-label={`${AVATAR_LABELS[key]}: ${avatarOptionLabel(key, option)}`}
                    aria-pressed={value[key] === option}
                    style={
                      key === "skinColor" || key === "hairColor"
                        ? { backgroundColor: `#${option}` }
                        : undefined
                    }
                    onClick={() => onChange({ ...value, [key]: option })}
                  >
                    {key === "skinColor" || key === "hairColor"
                      ? value[key] === option
                        ? "\u2713"
                        : ""
                      : avatarOptionLabel(key, option)}
                  </button>
                ))}
              </div>
            </fieldset>
          ))
        )}
      </div>
    </div>
  );
}
