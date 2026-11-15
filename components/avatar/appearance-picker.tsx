"use client";
import type { AvatarConfig, Avatar } from "@/types";
import {
  AVATAR_OPTIONS,
  AVATAR_LABELS,
} from "@/components/onboarding/avatarOptions";
import { avatarOptionLabel } from "./option-labels";
export function AppearancePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: Avatar;
  onChange: (avatar: Avatar) => void;
  disabled?: boolean;
}) {
  return (
    <div className="appearance-picker">
      {(
        [
          "skinColor",
          "hairColor",
          "top",
          "eyes",
          "mouth",
        ] as (keyof AvatarConfig)[]
      ).map((key) => (
        <fieldset
          disabled={disabled}
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
      ))}
    </div>
  );
}
