# Health Tracker App PRD

Nov 14, 2026 · Joshua

A mobile health tracker that turns daily nutrition goals into a game: you log food with your camera, your avatar reacts to your progress, and hitting goals alone or with your group earns coins to spend on your avatar. It borrows the social feel of a fitness feed, the playfulness of a camera-first messaging app, and the team loyalty of a mobile game clan.

## App map

_[Diagram not exported: app map · 4 setup screens, 5 tabs, 1 currency. See the source doc: https://claude.ai/artifact/4vH7Nx9sdQkUrcnBJXRnX4]_

Onboarding runs once and lands on Home. After that, logging food fills the goal bars, and goals met alone or in a group pay coins that are spent in the Shop.

## Goals and scope

v1 ships onboarding, the avatar home screen, camera food logging, friends, groups, coins and a shop. The goal is daily logging that people keep doing because it is fun and social, not because they feel guilty.

**Target users:** students and young adults who are bulking, cutting or maintaining weight and already use social and game apps daily.

**In scope for v1**

- One-time onboarding: body stats, goal, calorie target, avatar
- Home screen with an avatar whose mood follows daily progress
- Camera food scan that estimates calories and macros
- Friends list with progress visibility
- Groups with shared goals
- Coins earned from individual and group goals
- Shop for avatar items

**Out of scope for v1:** workout tracking, wearable sync, barcode scanning, chat inside groups, paid coin purchases.

**Success metrics**

| Metric | Target |
| --- | --- |
| Onboarding completion | 80% of installs finish all four screens |
| Daily logging | Median active user logs 2+ meals per day |
| Day-7 retention | 35% |
| Social adoption | 50% of active users have 1+ friend within 7 days |
| Scan accuracy | Calorie estimate within ±20% of reference for common meals |

## Onboarding

New users pass four screens in a fixed order before reaching Home. Each screen's Next button stays disabled until its inputs are valid.

| # | Screen | Inputs | Next enabled when |
| --- | --- | --- | --- |
| 1 | Body stats | Height, weight, age, stacked top to bottom | All three hold valid numbers. Next appears below the fields once they are filled |
| 2 | Goal | Dropdown: Bulk, Cut or Maintain. Target weight box below it | Maintain is picked, or Bulk/Cut is picked with a valid target weight |
| 3 | Daily calories | Target calories box, suggested daily calories shown under it | A number is entered (or the suggestion is accepted) |
| 4 | Avatar | Pick from available options: skin tone, hair, face, outfit | Always enabled; defaults are pre-picked |

**Goal screen rules**

- Bulk: target weight must be greater than current weight.
- Cut: target weight must be less than current weight.
- Maintain: the target weight box is shown greyed out and cannot be tapped; target weight is set to current weight.
- Switching from Bulk/Cut to Maintain clears any entered target weight.

**Suggested calories**

The suggestion uses the Mifflin-St Jeor resting energy estimate, scaled by a default "lightly active" factor of 1.375, then adjusted by goal.

```latex
\text{BMR} = 10 \cdot \text{weight}_{kg} + 6.25 \cdot \text{height}_{cm} - 5 \cdot \text{age} + s
```

- Maintain: BMR × 1.375
- Cut: BMR × 1.375 − 500 kcal (about 0.5 kg loss per week)
- Bulk: BMR × 1.375 + 300 kcal
- Never suggest below 1,200 kcal.
- Protein target defaults to 1.6 g per kg of body weight.

The constant s is +5 for male and −161 for female; without a sex input, v1 uses −78 (the midpoint). See Open questions.

**Units:** metric and imperial both supported, with a toggle on screen 1. Values are stored in metric.

**Editing later:** every onboarding value can be changed from a Profile settings screen; changing body stats or goal recalculates the suggestion but does not overwrite a custom calorie target without asking.

## Home

Home splits the screen in two: the avatar on the top half, daily goal bars on the bottom half. Both update right after a food log.

**Daily goal bars**

- Calories, protein, carbs and fat, each as a horizontal bar showing logged / target (for example 1,240 / 2,300 kcal).
- Bars fill as food is logged; they reset at local midnight.
- Going over a target turns the bar amber. For Cut, going 10% over calories turns it red.
- Tapping a bar opens today's log for that nutrient, where entries can be edited or deleted.

**Avatar mood**

The avatar's expression follows overall daily progress: the average of each goal's completion, each capped at 100%.

| Overall progress | Expression | Example line |
| --- | --- | --- |
| No food logged yet | Sleepy | "Feed me?" |
| 1–39% | Hungry / sad | "Running on empty..." |
| 40–79% | Neutral / determined | "Getting there." |
| 80–99% | Happy | "Almost done!" |
| 100% of all goals | Celebrating, with confetti | "Goal crushed!" |
| Calories over 110% on Cut | Stuffed | "Too much!" |

- The avatar wears the items the user has equipped from the Shop.
- A streak counter (consecutive days with all goals met) and the coin balance sit at the top of the screen.

**Bottom navigation:** five tabs — Home, Log food (camera, centre and largest), Friends, Groups, Shop.

## Log food

The Log food tab opens straight to the camera. The user photographs a real meal and the app estimates its nutrition, which the user confirms before it counts.

1. Camera opens full screen with a shutter button and a "Type it instead" link.
2. User takes a photo of the food.
3. The image goes to a vision model that identifies each food item and estimates its portion size.
4. A results card lists each item with calories, protein, carbs and fat, plus a total.
5. User can adjust portions, remove wrong items, or add a missed item by search.
6. User picks a meal (breakfast, lunch, dinner, snack) and taps Log.
7. Home bars and avatar mood update; any goal reached triggers a coin reward.

**Requirements**

- Result shown within 5 seconds on a normal mobile connection.
- Each estimate shows a confidence level; low confidence prompts the user to check portions.
- Manual text entry and a food database search are available when the camera fails or is not wanted.
- Recent and favourite meals can be re-logged in one tap.
- Photos can optionally be shared to the Friends feed as a meal post.
- Anti-cheat: coin rewards only count logs made from the camera or search, with a cap of 10 logs per day.

## Friends

The Friends tab lets users add friends and see how each friend is doing today, as a feed of avatars and progress.

**Adding friends**

- Search by username.
- Share an invite link or QR code.
- Friend requests must be accepted before progress is visible.
- Remove or block a friend at any time.

**What friends see**

- Friend list: each friend's avatar with its current mood, streak, and overall daily progress as a percentage.
- Tapping a friend shows their goal bars for today and the last 7 days of progress.
- A feed of activity: goals hit, streak milestones, meal posts the friend chose to share.
- Reactions on feed items (emoji) and a "nudge" to a friend who has not logged today (max one per friend per day).

**Privacy controls:** users choose whether friends see exact numbers (kcal, grams) or only percentages. Body weight is never shown to anyone.

## Groups

Groups are clan-style teams of friends who work toward shared goals and earn coins together.

**Creating and joining**

- Any user can create a group with a name, badge icon and description.
- Groups hold 2 to 20 members.
- The creator is the Leader; the Leader can promote Co-leaders.
- Leaders and Co-leaders invite friends; invitees accept to join.
- A user can be in up to 3 groups.

**Group goals**

Leaders and Co-leaders create goals with a type, target, and time window.

| Goal type | Example | Progress measured as |
| --- | --- | --- |
| Team total | Log 100 meals this week | Sum of all members' contributions |
| Everyone hits it | Every member meets protein goal 5 of 7 days | Members who met it / total members |
| Streak | Group logs every day for 14 days | Consecutive days where 75%+ of members met all goals |

- Each goal has a window of 1 day to 4 weeks.
- Members can see a group progress bar and each member's contribution.
- A group page shows the leaderboard of members by contribution this week.
- At most 3 active goals per group at once.

## Coins

Coins are the only currency, earned from both individual and group goals. A solo user who meets every goal for a week earns about 400 coins; group play roughly doubles that.

**Individual rewards**

| Event | Coins |
| --- | --- |
| Calorie goal met for the day (within ±10% of target) | 20 |
| Protein goal met for the day | 10 |
| All daily goals met | +10 bonus |
| 7-day streak of all goals met | 100 |
| 30-day streak | 500 |
| First log of the day | 2 |

**Group rewards**

When a group goal completes, every member who contributed gets:

```latex
\text{coins} = 10 \cdot \text{days} \cdot d \cdot (1 + 0.05 \cdot (\text{members} - 1))
```

- days = length of the goal window, from 1 to 28.
- d = difficulty: 1.0 for Team total, 1.5 for Everyone hits it, 2.0 for Streak.
- The member bonus is capped at +50% (11+ members).
- Members who contributed nothing that window get 0.
- Example: a 7-day "Everyone hits it" goal in a 5-person group pays each member 10 × 7 × 1.5 × 1.2 = 126 coins.

**Rules**

- Daily goals are judged at local midnight; rewards land then, with a notification.
- Coins cannot be bought, transferred or cashed out in v1.
- Every coin change is written to a ledger so balances can be audited.

## Shop

The Shop tab is where coins are spent on avatar items. Items are cosmetic only and never affect goals or rewards.

| Category | Examples | Price range (coins) |
| --- | --- | --- |
| Outfits | Hoodies, gym wear, jerseys | 100–400 |
| Hair and hats | Hairstyles, caps, beanies | 80–250 |
| Accessories | Glasses, headphones, chains | 50–200 |
| Expressions pack | Extra mood animations | 300 |
| Backgrounds | Gym, beach, kitchen scenes behind the avatar | 150–500 |
| Group badges | Icons and frames for a group (Leader buys) | 200–600 |

- A preview shows the item on the user's own avatar before buying.
- Bought items go to an inventory; the user equips or unequips them any time, free.
- A daily rotating "featured" slot shows 3 items at 20% off.
- Some items are locked behind streak milestones (for example, a gold crown at a 30-day streak) and cannot be bought.
- Purchases need a confirm tap; no refunds in v1.

## Non-functional requirements

| Area | Requirement |
| --- | --- |
| Platforms | iOS and Android phones, portrait only |
| Accounts | Sign up with email or Apple/Google; username unique |
| Age | Users must be 13+; under-18 accounts never get Cut goals below the suggested minimum |
| Health safety | No calorie target under 1,200 kcal; a gentle warning if a target is far from the suggestion; app states it is not medical advice |
| Privacy | Body weight and food photos private by default; account and data deletion in settings |
| Performance | App opens to Home in under 2 s; scan result in under 5 s |
| Offline | Manual logs queue offline and sync later; camera scan needs a connection |
| Notifications | Meal reminders, goal reached, coin rewards, friend nudges, group invites; each can be turned off |
| Fairness | Server computes all goal checks and coin payouts; the client never awards coins |

## Open questions

- [ ] Add sex and activity level to onboarding screen 1? They make the calorie suggestion far more accurate.
- [ ] Which vision model or nutrition API powers the camera scan, and what does it cost per scan?
- [ ] Should macros beyond protein (carbs, fat) be user-set targets or derived from calories?
- [ ] Can users be in groups with people who are not their friends (open or public groups)?
- [ ] Do group goals have a coin entry cost or penalty for failing, or are they reward-only?
- [ ] Should coins ever be purchasable with real money after v1?
- [ ] Is weight logged over time (weekly weigh-ins) so the app can track progress toward the target weight?
