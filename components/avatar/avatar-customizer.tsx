"use client";

import { useState } from "react";
import { AppearancePicker } from "./appearance-picker";
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
          <AppearancePicker value={value} onChange={onChange} />
        )}
      </div>
    </div>
  );
}
