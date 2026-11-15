"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireProfile } from "@/components/auth";
import {
  loadSettings,
  saveSettings,
  onProfileUpdated,
  type SettingsProfile,
} from "@/lib/settings";
import { loadShop, saveOutfit, type ShopState } from "@/lib/shop";
import { demoShopItems } from "@/components/ui/shop-screen";
import { RoomCharacter } from "@/components/avatar/pixel-avatar";
import { FacingControl } from "@/components/avatar/wardrobe-picker";
import { HistoryController } from "@/components/history/HistoryController";
import { Icon, type IconName } from "@/components/ui/icons";
import type { Avatar } from "@/types";
import type { Facing } from "@/components/world/wander";
import { SettingsForm } from "./settings-form";
import { OwnedWardrobe } from "./owned-wardrobe";
import { MacroChart } from "@/components/analytics/MacroChart";

const sections = ["settings", "wardrobe", "calendar"] as const;
type Section = (typeof sections)[number];
const sectionIcon: Record<Section, IconName> = {
  settings: "settings",
  wardrobe: "shirt",
  calendar: "calendar",
};
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
// Appearance and clothing have independent drafts: saving one never commits the other's unsaved edits.
function baseLook(look: Avatar, clothing: Avatar): Avatar {
  return {
    ...clothing,
    skinColor: look.skinColor,
    hairColor: look.hairColor,
    top: look.top,
    eyes: look.eyes,
    mouth: look.mouth,
  };
}
export function ProfileController() {
  return (
    <RequireProfile>
      <ProfileView />
    </RequireProfile>
  );
}
function ProfileView() {
  const params = useSearchParams(),
    router = useRouter();
  const requested = params.get("section");
  const section: Section | null =
    requested === "none"
      ? null
      : sections.includes(requested as Section)
        ? (requested as Section)
        : null;
  const [saved, setSaved] = useState<SettingsProfile | null>(null),
    [shop, setShop] = useState<ShopState | null>(null);
  const [draft, setDraft] = useState<SettingsProfile | null>(null);
  const [outfit, setOutfit] = useState<{
    avatar: Avatar;
    equipped: string[];
  } | null>(null);
  const [facing, setFacing] = useState<Facing>("down");
  // Character vs macros chart lives in the URL (?panel=chart), so calendar selections can open the chart.
  const panel = params.get("panel") === "chart" ? "chart" : "character";
  const setPanel = (next: "character" | "chart") => {
    const query = new URLSearchParams(params.toString());
    if (next === "chart") query.set("panel", "chart");
    else query.delete("panel");
    router.replace(`/profile?${query}`, { scroll: false });
  };
  const [pending, setPending] = useState<Section | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0),
    [retry, setRetry] = useState(0);
  const busy = useRef(false);
  const settingsDirty = !!saved && !!draft && !same(saved, draft);
  const outfitDirty =
    !!saved &&
    !!shop &&
    !!outfit &&
    (!same(saved.avatar, outfit.avatar) ||
      !same(shop.equipped, outfit.equipped));
  const canRefresh = useRef(true);
  useEffect(() => {
    canRefresh.current = !settingsDirty && !outfitDirty && !pending;
  }, [settingsDirty, outfitDirty, pending]);
  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        const [profile, inventory] = await Promise.all([
          loadSettings(),
          loadShop(demoShopItems),
        ]);
        if (disposed || !canRefresh.current || busy.current) return;
        setSaved(profile);
        setDraft(profile);
        setShop(inventory);
        setOutfit({ avatar: profile.avatar, equipped: inventory.equipped });
        setError("");
        setRevision((r) => r + 1);
      } catch (e) {
        if (!disposed)
          setError(
            e instanceof Error
              ? e.message
              : "Couldn't open Profile. Try again.",
          );
      }
    };
    void load();
    const unsubscribe = onProfileUpdated(() => {
      if (canRefresh.current && !busy.current) void load();
    });
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [retry]);
  if (!saved || !shop || !draft || !outfit)
    return (
      <main className="profile-loading panel">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button
              className="button button-soft"
              onClick={() => setRetry((r) => r + 1)}
            >
              Try again
            </button>
          </>
        ) : (
          <p role="status">Opening Profile...</p>
        )}
      </main>
    );
  const initial = saved;
  async function save(section: "settings" | "wardrobe") {
    if (busy.current || !draft || !outfit || !shop) return;
    busy.current = true;
    setPending(section);
    setError("");
    setMessage("");
    try {
      if (section === "settings") {
        const profile = await saveSettings({
          ...draft,
          avatar: baseLook(draft.avatar, initial.avatar),
        });
        setSaved(profile);
        setDraft(profile);
        setRevision((r) => r + 1);
        setOutfit((o) =>
          o ? { ...o, avatar: baseLook(profile.avatar, o.avatar) } : o,
        );
        setMessage("Settings saved.");
      } else {
        const result = await saveOutfit(
          baseLook(initial.avatar, outfit.avatar),
          outfit.equipped,
        );
        setSaved((s) => (s ? { ...s, avatar: result.avatar } : s));
        setDraft((d) =>
          d ? { ...d, avatar: baseLook(d.avatar, result.avatar) } : d,
        );
        setShop((s) => (s ? { ...s, ...result } : s));
        setOutfit(result);
        setMessage("Outfit saved.");
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't save. Your changes are still here.",
      );
    } finally {
      busy.current = false;
      setPending(null);
    }
  }
  const preview =
    section === "settings"
      ? draft.avatar
      : section === "wardrobe"
        ? outfit.avatar
        : saved.avatar;
  return (
    <main className="profile-page">
      <div className="screen-title-row">
        <h1 className="screen-title">Profile</h1>
        {(settingsDirty || outfitDirty) && (
          <span className="profile-unsaved">Unsaved changes</span>
        )}
      </div>
      <div className="profile-layout">
        <aside
          className="profile-sidebar panel"
          aria-label="Profile management"
        >
          {sections.map((id) => (
            <div
              className={`profile-section ${section === id ? "is-open" : ""}`}
              key={id}
            >
              <h2>
                <button
                  id={`profile-${id}-toggle`}
                  type="button"
                  aria-expanded={section === id}
                  aria-controls={`profile-${id}`}
                  onClick={() => {
                    setError("");
                    setMessage("");
                    const query = new URLSearchParams(params.toString());
                    query.set("section", section === id ? "none" : id);
                    router.push(`/profile?${query}`, { scroll: false });
                  }}
                >
                  <Icon name={sectionIcon[id]} size={19} />
                  <span>{id[0].toUpperCase() + id.slice(1)}</span>
                  <span className="profile-chevron" aria-hidden="true">
                    {section === id ? "\u2212" : "+"}
                  </span>
                </button>
              </h2>
              <div
                id={`profile-${id}`}
                role="region"
                aria-labelledby={`profile-${id}-toggle`}
                hidden={section !== id}
                className="profile-section-content"
              >
                {id === "settings" && (
                  <SettingsForm
                    key={revision}
                    value={draft}
                    pending={pending !== null}
                    dirty={settingsDirty}
                    onChange={(d) => {
                      setDraft(d);
                      setMessage("");
                    }}
                    onSave={() => void save("settings")}
                    onReset={() => {
                      setDraft(saved);
                      setRevision((r) => r + 1);
                      setError("");
                      setMessage("");
                    }}
                  />
                )}
                {id === "wardrobe" && (
                  <OwnedWardrobe
                    avatar={outfit.avatar}
                    equipped={outfit.equipped}
                    owned={shop.owned}
                    items={shop.items}
                    pending={pending !== null}
                    dirty={outfitDirty}
                    onChange={(avatar, equipped) => {
                      setOutfit({ avatar, equipped });
                      setMessage("");
                    }}
                    onSave={() => void save("wardrobe")}
                    onReset={() => {
                      setOutfit({
                        avatar: saved.avatar,
                        equipped: shop.equipped,
                      });
                      setError("");
                      setMessage("");
                    }}
                  />
                )}
                {id === "calendar" && section === "calendar" && (
                  <HistoryController />
                )}
              </div>
            </div>
          ))}
          {error && (
            <p className="profile-notice field-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="profile-notice" role="status">
              {message}
            </p>
          )}
        </aside>
        <section className="profile-avatar panel" aria-label="Your character">
          <div className="profile-identity">
            <h2>{section === "settings" ? draft.username : saved.username}</h2>
            <span>{saved.goal_type}</span>
          </div>
          {section === "calendar" && (
            <div className="profile-panel-toggle flex justify-center gap-4" role="group" aria-label="Show">
              <button type="button" className={`text-button ${panel === "character" ? "font-semibold underline underline-offset-4" : "opacity-70"}`} aria-pressed={panel === "character"} onClick={() => setPanel("character")}>Character</button>
              <button type="button" className={`text-button ${panel === "chart" ? "font-semibold underline underline-offset-4" : "opacity-70"}`} aria-pressed={panel === "chart"} onClick={() => setPanel("chart")}>Macros chart</button>
            </div>
          )}
          {section === "calendar" && panel === "chart" ? (
            <MacroChart
              date={params.get("date")}
              from={params.get("from")}
              to={params.get("to")}
              calorieTarget={saved.calorie_target}
              goalType={saved.goal_type}
            />
          ) : (
            <>
              <div className="profile-stage">
                <RoomCharacter
                  config={preview}
                  equipped={
                    section === "wardrobe" ? outfit.equipped : shop.equipped
                  }
                  facing={facing}
                  animate={false}
                  name={`${saved.username}'s character, ${facing === "down" ? "front" : facing === "up" ? "back" : facing} view`}
                />
              </div>
              <FacingControl value={facing} onChange={setFacing} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
