# Build plan (24 h): what we actually build from docs/PRD.md (DIG IN v3.0)

Decided by Daren (lead), Nov 14. The PRD is the product. This file pins the decisions the PRD leaves open: stack details, owners, contracts and milestones. If the two disagree on an implementation detail, this file wins; on product intent, the PRD wins.

## Stack (from PRD section 15)

- **Next.js** (App Router) + TypeScript + Tailwind, mobile-first PWA, deployed on **Vercel**. Demo on phones by opening the Vercel URL.
- **Supabase:** Auth (email/password, plus anonymous for demo users), Postgres, Realtime, Storage.
- **Vision:** Gemini, called **only** from the server route `app/api/scan/route.ts`. Env vars are `GEMINI_API_KEY` and `GEMINI_MODEL` (default `gemini-flash-latest`). The key never reaches the browser.
- **Camera:** `<input type="file" accept="image/*" capture="environment">`. Resize to max 1024 px JPEG (quality about 0.7) in the browser before upload, to stay fast and under Vercel's request size limit.
- **Avatar:** our own pixel-art renderer in `components/avatar/` (Jay), decided Nov 14; it replaces DiceBear `avataaars`. The contract is unchanged: `AvatarConfig` plus the equipped shop item ids `sunglasses`, `hoodie`, `crown`.
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser), `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL` (server only). Set them in `.env.local` and in Vercel.

## Rules the PRD leaves open (decided)

- **Calorie goal met:** daily calories between 90% and 110% of target. Eating less never earns more.
- **Protein goal met:** daily protein at least 90% of target.
- **Personal goal completed:** both of the above.
- **Qualifying meal:** a confirmed meal with at least 1 item and at least 50 kcal. Meal rewards (+10 each) apply to the first 3 qualifying meals of the day.
- **Coins (PRD 7.2):** meal 1/2/3 +10 each, calorie goal +20, protein goal +10, both +10 bonus. Max 70 a day. Each reward is paid once per day.
- **Duplicate prevention:** every confirmed meal carries a client-generated `event_id` (uuid), and `log_meal` ignores repeats. Every coin row has a unique `reward_event_id` (for example `user:2026-11-14:calorie_goal`).
- **Group bonus (PRD 9.2), awarded live for the demo, not at day end:**
  - completion % = members whose personal goal is completed / all members.
  - When the group's tier rises (60% gives 10, 80% gives 20, 100% gives 30), each completed member is paid the difference up to the new tier.
  - A member who completes later in the day is paid the current tier.
  - The total stays capped at 30 per member per day.
- **Streak:** at least one qualifying meal per day. The bonuses for 3/7/30-day streaks are post-MVP.
- **Onboarding input ranges:** height 120 to 230 cm, weight 30 to 300 kg, age 18 to 100. The prototype is adults only (PRD 16), so under-18 shows "DIG IN is for adults (18+) for now" and can't continue. Target weight must be 30 to 300 kg and must respect the Bulk/Cut direction. Calorie target 1,200 to 5,000 (warn below 1,500). Protein target 30 to 300 g.
- **Onboarding targets:** labeled illustrative presets plus a custom entry. Warn below 1,500 kcal, block below 1,200. Never auto-suggest a deficit.
- **Avatar moods (PRD 5.3):** `ready` (nothing logged), `progressing` (1 meal), `active` (2+ meals), `goal_complete` (personal goal done), `group_success` (group at 100%). There are no negative moods, and overages are shown neutrally.
- **Midnight reset** uses the user's local date, which the client sends as `p_date`.

## Who owns what

| Area | Owner | Folders |
|---|---|---|
| App shell, bottom nav, Home dashboard, Shop UI, Groups UI + shared world (P1), avatar | @haojay1126 (Jay) | `app/layout.tsx`, `app/(app)/layout.tsx`, `app/(app)/page.tsx`, `app/(app)/shop/`, `app/(app)/groups/`, `components/ui/`, `components/avatar/`, `components/world/` |
| Onboarding (4 screens + optional group step), target presets | @joshuatsou123 (Joshua) | `app/onboarding/`, `components/onboarding/`, `lib/targets/` |
| Food scan: camera page, results card, Gemini route, meal coach tip | @DLYK2006 (Daren) | `app/(app)/scan/`, `components/scan/`, `lib/scan/`, `app/api/scan/` |
| Backend core: schema, `log_meal` + coins, shop RPCs, seed, shared types, Supabase clients (**tentative**) | @DLYK2006 (Daren) | `supabase/migrations/0001_core.sql`, `supabase/seed.sql`, `lib/supabase/`, `lib/api/`, `types/` |
| **Groups logic: create/join by invite code, completion %, group bonus, realtime hook (P0, UNOWNED: claim it on the board)** | unowned | `supabase/migrations/0002_groups.sql`, `lib/groups/` |

**UI styling (decided Nov 14):** Jay leads the visual design (pixel-RPG) and also styles the scan/results and onboarding screens (`app/(app)/scan/`, `components/scan/`, `app/onboarding/`, `components/onboarding/`), presentation only. Logic stays with the owners: `lib/scan/` and `app/api/scan/` (Daren), `lib/targets/` and form validation (Joshua). Owners build with plain markup first; check on the board before restyling a file someone else is editing.

**Shared files** (`package.json`, `tailwind.config.*`, `types/`): add packages with `npm i <pkg>` and post on the board when you do. Changes to `types/` go through Daren: post the change, then edit.

## Contracts (build against these; don't change them without a board post)

### `types/index.ts`

```ts
export type GoalType = 'bulk' | 'cut' | 'maintain';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Confidence = 'high' | 'medium' | 'low';
export type Mood = 'ready' | 'progressing' | 'active' | 'goal_complete' | 'group_success';

export interface AvatarConfig { skinColor: string; top: string; hairColor: string; eyes: string; mouth: string; clothing: string }

export interface Profile {
  id: string; username: string; goal_type: GoalType;
  height_cm: number; weight_kg: number; age: number; target_weight_kg: number | null;
  calorie_target: number; protein_target_g: number; carbs_target_g: number | null; fat_target_g: number | null;
  avatar: AvatarConfig; equipped: string[];        // shop item ids
  coin_balance: number; streak: number;
}

export interface Macros { calories: number; protein_g: number; carbs_g: number; fat_g: number }
export interface ScanItem extends Macros { name: string; portion: string; grams: number; confidence: Confidence }
export interface ScanResult { items: ScanItem[]; total: Macros; overall_confidence: Confidence; coach_tip: string | null }

export interface DailyProgress {
  date: string; meals_logged: number;
  total_calories: number; total_protein_g: number; total_carbs_g: number; total_fat_g: number;
  calorie_goal_completed: boolean; protein_goal_completed: boolean; personal_goal_completed: boolean;
}

export interface CoinEvent { amount: number; reason: string }

export interface Group { id: string; name: string; badge: string; invite_code: string; creator_id: string }
export interface GroupDailyProgress {
  group_id: string; date: string; eligible_member_count: number; completed_member_count: number;
  completion_percentage: number; bonus_tier: 0 | 10 | 20 | 30;
}
export interface GroupMemberStatus { user_id: string; username: string; avatar: AvatarConfig; equipped: string[]; personal_goal_completed: boolean }

export interface LogMealResponse { progress: DailyProgress; coins_awarded: CoinEvent[]; coin_balance: number; group: GroupDailyProgress | null }
```

### `POST /api/scan` (Daren)

Takes `{ image_base64, mime_type }` or `{ text }` and returns a `ScanResult` within 8 s. On failure it returns `{ error }` with a 4xx or 5xx status, and the UI falls back to manual entry. Nothing is saved; it only estimates.

### Postgres RPCs (call with `supabase.rpc`; all are `security definer`, and coins only change here)

- `log_meal(p_event_id uuid, p_date date, p_meal_type text, p_items jsonb)` returns `LogMealResponse`. **Daren.** It is idempotent on `p_event_id`, updates `daily_progress`, pays personal coins, then calls `evaluate_group_bonus(user, date)`.
- `evaluate_group_bonus(p_user uuid, p_date date)` returns `GroupDailyProgress | null`. **Groups owner.** Until it's claimed, Daren ships a stub that returns null.
- `create_group(p_name text, p_badge text)` returns a `Group` with a 6-character invite code. `join_group(p_code text)` returns a `Group` (2 to 4 members, one group per user for the MVP). `leave_group()`. **Groups owner.**
- `buy_item(p_item_id text)` returns `{ coin_balance }` and `equip_item(p_item_id text, p_equipped boolean)` returns `{ equipped }`. **Daren.**

### Realtime

The Groups page subscribes to `postgres_changes` on `group_daily_progress` (filtered by `group_id`) and on `daily_progress` for the group's members. `lib/groups/useGroupLive.ts` (groups owner) wraps this.

### Tables (PRD 15 data models, snake_case)

`profiles`, `meals`, `daily_progress (user_id, date)`, `coin_transactions (reward_event_id unique)`, `shop_items`, `inventory`, `groups`, `group_members`, `group_daily_progress (group_id, date)`. Row-level security means users read and write only their own rows. Group members can read each other's `daily_progress` completion flags and avatars, but never weights or exact intake.

### Seed

- Shop items: `sunglasses` 20, `hoodie` 40, `crown` 60.
- Two demo accounts in one group. Each starts the day just short of their goals, so one scan completes a personal goal live on stage.

## Milestones (H = hours since kickoff)

| By | Done means |
|---|---|
| H+1 | Scaffold on `main`: Next.js app deployed to Vercel, Supabase linked, `types/` and `0001_core.sql` in. Everyone pulls. |
| H+4 | Each area runs on mock data. `/api/scan` returns real Gemini JSON from a phone photo. |
| H+8 | Solo loop end to end: onboarding, scan, `log_meal`, Home bars, mood, coins. (PRD P0 items 1 to 7) |
| H+12 | Groups end to end on two phones: join by code, live completion %, bonus coins. (P0 items 8 to 11) |
| H+16 | **Feature freeze** after P1 (shop, world, mood animations, coach tip). Only bugs and polish after this. |
| H+20 | The 6-scene demo (PRD 18) rehearsed 3 times on two real phones, backup video recorded, Devpost written. |

## Demo safety

- Keep a known-good meal photo on the demo phone.
- Run on a hotspot, not venue Wi-Fi.
- Have the seeded "just short of goal" demo users ready, so Scenes 3 to 5 happen in one scan each.
