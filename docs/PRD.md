DIG IN — Health Tracker App PRD v3.1
Date: November 14, 2026
Theme: Let's Dig In
Platform: Mobile-first web app (PWA)
Product: AI-powered gamified nutrition tracker
Hackathon Goal: Build a functional, visually impressive MVP within 24 hours.

1. Product Overview
1.1 Concept
DIG IN is an AI-powered nutrition tracking app that transforms achieving personal health goals into a fun, rewarding, and social experience.

Users photograph their meals, receive AI-generated calorie and macronutrient estimates, and track their progress toward personalized nutrition goals.

By accomplishing their daily goals, users earn coins that can be spent customizing a virtual avatar.

Users can also optionally join groups with friends. When members accomplish their respective personal goals, the entire group earns additional bonus rewards.

The core idea: Achieve your own goals, earn rewards, and earn even more when your friends succeed too.
1.2 Core Features
1. AI-powered food scanning and nutrition estimation.
2. Personalized goals for bulking, cutting, or maintaining weight.
3. Customizable avatars that react to daily progress.
4. Coins earned from personal achievements.
5. Optional groups that unlock additional community rewards.
6. A shared virtual world that evolves through group achievements.
7. An avatar customization shop.
1.3 Product Philosophy
Individual progress comes first. Community participation is optional.

Users should receive the complete core experience without joining any group.

Groups enhance the experience by providing social motivation, collaborative challenges, and additional rewards.

Users should never feel forced to join groups or punished for another member's inactivity.
1.4 Hackathon Pitch
"What if staying consistent with your nutrition goals felt like playing a game?

DIG IN uses AI to analyze your meals, track your personal nutrition goals, and reward your progress with coins to customize your own avatar.

And when you join your friends, everyone can earn even more by achieving their individual goals together.

Your food fuels your progress. Your progress powers your world."

2. Target Audience
Primary Users
Students and young adults who:
- Want to bulk, cut, or maintain weight.
- Find calorie tracking boring or repetitive.
- Enjoy character customization and mobile games.
- Want motivation to consistently track nutrition.
- Enjoy achieving goals with friends.
Problem
Traditional nutrition apps focus primarily on numbers, logs, and charts.

This can make tracking food feel like another responsibility.

Additionally, many social fitness experiences emphasize competition rather than cooperative encouragement.
Solution
DIG IN combines personal nutrition tracking with immediate virtual rewards and optional cooperative gameplay.

Each meal contributes toward personal progress.

Each completed personal goal earns coins.

When friends achieve their goals together, they unlock additional rewards and shared-world progression.

3. Core Gameplay Loop
Individual Experience
1. User photographs their meal.
2. AI identifies the food and estimates nutrition.
3. User confirms the estimated nutrition.
4. Daily calorie and macro bars update.
5. Avatar reacts to progress.
6. User accomplishes their personal goals.
7. Coins are awarded.
8. User spends coins on avatar customization.
9. User returns tomorrow to continue.
Optional Community Experience
1. User joins or creates a group.
2. Each member works toward their own personal goals.
3. Group progress increases as members complete goals.
4. Group milestones unlock bonus coins.
5. Completing a group challenge transforms the shared virtual environment.
6. Members celebrate achievements together.
Important: Group membership is not required for personal coins, streaks, avatar progression, or shop access.

4. Onboarding
4.1 Onboarding Flow
Users complete four screens before accessing the Home screen.
Screen	Inputs
1. Body Stats	Height, weight, age, unit preference
2. Personal Goal	Bulk, Cut, Maintain, optional target weight
3. Nutrition Targets	Daily calories, protein, optional carbs and fat
4. Avatar	Character, skin tone, hair, face, outfit

Each screen has validation before the user can continue.
4.2 Personal Goal Selection
Bulk
- User wants to gain weight.
- Target weight must exceed current weight.
- Nutrition targets can support a calorie surplus.
Cut
- User wants to lose weight.
- Target weight must be below current weight.
- Nutrition targets can support a moderate calorie deficit.
Maintain
- User wants to maintain current weight.
- Target weight defaults to current weight.
- Nutrition targets support maintenance.
For the hackathon MVP, the app should allow users to select a demonstration preset or enter their own reasonable targets. The app must not prescribe aggressive calorie deficits.
4.3 Nutrition Targets
The app tracks:
- Calories (kcal)
- Protein (g)
- Carbohydrates (g)
- Fat (g)
Calorie and protein goals are the primary achievement targets.

Carbohydrates and fats are tracked for nutritional awareness, with customizable targets available as a future enhancement.
4.4 Calorie Recommendations
The long-term product may use the Mifflin–St Jeor equation with appropriate inputs to estimate energy needs.

For the hackathon:
- Provide clearly labeled illustrative presets.
- Allow custom target entry.
- Avoid presenting estimates as medical prescriptions.
- Warn against unusually restrictive targets.
- Never automatically recommend unsafe calorie goals.
4.5 Optional Group Setup
At the end of onboarding, users may choose:
- Join a group
- Create a group
- Continue solo
Continue Solo must be equally prominent.

Users can join a group later.

5. Home Screen
5.1 Layout
The Home screen is the central personal dashboard.

Top:
- Username
- Coin balance
- Daily streak
- Profile/settings icon (opens the Profile tab, see 14.1)
Upper middle:
- Large personalized avatar
- Avatar expression
- Progress encouragement
Lower middle:
- Daily calories
- Protein
- Carbohydrates
- Fat
Bottom:
- Personal goal achievement status
- Optional group progress card
- Food scanning shortcut
5.2 Daily Nutrition Bars
Each bar shows:

Current consumption / Daily target

Example:
Nutrient	Consumed	Target
Calories	1,800 kcal	2,500 kcal
Protein	110 g	150 g
Carbs	200 g	300 g
Fat	65 g	85 g

Bars update immediately after a meal is confirmed.

Bars reset at local midnight.

Exceeding targets should be represented neutrally rather than using punitive warnings or animations.
5.3 Avatar Mood
The avatar responds to positive participation and progress.
State	Condition	Expression
Ready	Beginning of day	Curious
Progressing	First meal logged	Smiling
Active	Continued progress	Energized
Goal Complete	Personal daily achievement completed	Celebrating
Group Success	Group milestone completed	Special celebration

The avatar wears purchased accessories and outfits.

Avatar reactions must never shame users for eating, missing meals, or exceeding nutrition targets.

6. AI Food Scanner
6.1 Core Function
Users photograph a meal and receive an AI-generated nutritional estimate.
6.2 User Flow
1. Tap the central Scan button.
2. Camera opens.
3. Capture or upload a meal photograph.
4. Image is sent to a vision-capable AI model.
5. AI identifies visible food items and estimates portions.
6. AI estimates calories, protein, carbohydrates, and fat.
7. User reviews results.
8. User adjusts incorrect portions or food items.
9. User selects meal type.
10. User confirms the meal.
11. Nutrition dashboard and personal progress update.
6.3 Example AI Result
Detected: Chicken Rice
Item	Calories	Protein
Chicken	220 kcal	35 g
Rice	260 kcal	5 g
Sauce/oil	90 kcal	0 g
Total	570 kcal	40 g

Values are estimates and subject to user correction.
6.4 AI Meal Coach
After analyzing a meal, AI offers one optional suggestion.

Example:

"Your meal contains a good source of protein. Consider adding vegetables for more fiber and variety."

Suggestions should be personalized to the user's selected goal without promoting restrictive eating.
6.5 Requirements
- Target AI results within 8 seconds.
- Show loading feedback.
- Allow manual corrections.
- Provide manual logging fallback.
- Make confidence and uncertainty understandable.
- Never save AI estimates without confirmation.
- Prevent duplicate reward claims for the same logged meal.

7. Personal Goals and Achievements
This is the main progression system.

Every user has their own goals, regardless of group membership.
7.1 Daily Personal Goals
Users work toward:
- Their daily calorie target.
- Their daily protein target.
- Consistent food logging.
Nutrition achievements should use flexible, goal-appropriate ranges rather than requiring exact numerical matches.

For the MVP, milestones can be based on the user's chosen targets while avoiding rewards for simply minimizing calorie consumption.
7.2 Personal Coin Rewards
Achievement	Reward
First qualifying meal logged	+10 coins
Second qualifying meal logged	+10 coins
Third qualifying meal logged	+10 coins
Daily calorie goal achieved	+20 coins
Daily protein goal achieved	+10 coins
Both primary nutrition goals achieved	+10 bonus coins

Maximum proposed daily personal reward: 70 coins.

Each achievement can be awarded only once per day.
7.3 Streak System
Users build streaks for consistent daily participation.

For the MVP, a streak is maintained by logging at least one qualifying meal each day, rather than requiring perfect nutrition targets.

Future streak bonuses:
Achievement	Bonus
3-day streak	+20
7-day streak	+75
30-day streak	+300

Missed days do not deduct previously earned coins.

8. Groups and Community
8.1 Philosophy
Groups are optional community features, not a requirement for using the app.

Users can achieve every personal goal and purchase shop items independently.

Groups create additional opportunities to earn bonus rewards and celebrate progress.
8.2 Creating and Joining Groups
Users can:
- Create a group.
- Choose a group name.
- Select a group badge.
- Invite friends using a code or link.
- Join an existing group.
- View members and contributions.
- Leave a group whenever they wish.
For the hackathon MVP, group size is 2–4 members.

Future versions can support up to 20 members and multiple groups.
8.3 Individualized Goals Within Groups
Every group member works toward their own personal goal.

Example:
Member	Personal Goal	Daily Status
Alex	Bulk	Completed
Sarah	Cut	Completed
John	Maintain	Completed
Emily	Bulk	In progress

Members do not need identical calorie or protein targets.

Group progress depends on whether each member accomplishes their own goals, not on achieving the same numbers.

Groups see achievement statuses rather than exact calorie targets, weight, or food intake unless users explicitly choose to share more.

9. Group Bonus Coin System
9.1 Core Mechanic
Completing personal goals earns individual coins.

Joining a group allows users to earn additional bonus coins when other members also achieve their personal goals.

Personal rewards are independent from group results.
9.2 Group Completion Tiers
Group Completion	Bonus Coins
Below 60%	0
60–79%	+10
80–99%	+20
100%	+30

Group bonus coins are awarded to members who complete their own qualifying personal goal.

This prevents inactive users from repeatedly receiving rewards without participating.
9.3 Example
A group has five members.

Each member can earn 40 coins from completing the primary daily nutrition goals, including the combined-goal bonus.

Scenario A: All five complete their personal goals
- Each qualifying user earns 40 personal-goal coins.
- The group achieves 100% completion.
- Each receives an additional 30 group coins.
- Total: 70 coins per member, excluding meal-logging rewards.
Scenario B: Four out of five complete their goals
- Group completion is 80%.
- The four successful members each receive 20 bonus coins.
- The fifth member keeps any individual rewards already earned.
Scenario C: User plays solo
- The user earns personal coins normally.
- No group bonus is available.
- No restriction is placed on avatar customization or shop access.
9.4 Group Reward Rules
- Personal rewards cannot be lost because of group performance.
- Members earn group bonuses only if their own qualifying achievement is completed.
- Group completion is calculated from eligible members' achievement statuses.
- Bonuses are awarded once per reward period.
- All transactions are validated server-side.
- Users can opt out of group participation at any time.
For MVP simplicity, group rewards are determined once daily.
9.5 Group Fairness
The system should avoid encouraging unhealthy competition or pressuring members to eat less or hit exact macros.

Therefore:
- No penalties for missing goals.
- No negative group scores.
- No public display of calorie overages or body weights.
- No coin deductions.
- No public ranking based on weight loss.
- Avoid notifications blaming members for incomplete quests.

10. Shared Virtual World
10.1 Purpose
Groups unlock a shared virtual environment that visually represents cooperative progress.

This makes teamwork visible and provides a memorable hackathon demonstration.
10.2 World Design
Each group owns a small shared world containing:
- A central mascot or creature.
- Plants, trees, or environmental decorations.
- Group member avatars.
- A shared progress indicator.
10.3 World Progression
The world evolves as more members complete their personal goals.
Group Progress	World State
0–24%	Starter world
25–59%	Creature awakens and plants grow
60–79%	More decorations appear
80–99%	Environment becomes vibrant
100%	Final transformation and celebration

10.4 Real-Time Synchronization
When one member completes their personal goal:
1. Their completion status updates.
2. Group completion percentage recalculates.
3. The shared world progresses.
4. Connected teammates see the update.
5. Once the group reward period is finalized, bonuses are issued.
The world serves as an optional social reward experience.

Solo users retain their own avatar and personal progression.

11. Communities and Friends
11.1 Communities Tab
The Groups tab becomes the Communities tab, with a toggle between two views:
- Group: the existing group view (invite through group links or codes, group members, daily achievement completion, group progress, shared-world updates).
- Friends: the user's friends and friend requests.
11.2 Adding Friends
- Search for a user by username and send a friend request.
- Friendship is mutual: the other user must accept. Pending requests appear in the Friends view with Accept and Decline.
- Either user can remove the friendship at any time.
11.3 What Friends See
Tapping a friend opens their progress:
- Current streak.
- Calendar of past days marked goal met, logged, or nothing.
Friends never see calories, macros, meals, body weight, targets, avatar, or group membership. Missed days are shown neutrally.
11.4 Sharing
Users can share a progress card to other apps, similar to Strava activity cards.
- The app draws an image card and opens the phone's native share sheet (Instagram Stories, WhatsApp, etc.), or downloads the image if sharing isn't available.
- Card contents: the group's garden and completion (or the user's avatar when solo), current streak, and today's status (meals logged, goal met). No calorie, macro, or weight numbers.
- Nothing is posted automatically, and there are no public profile pages.
Future Features
- Progress feed.
- Reactions.
- Encouragement nudges.
- Shared meal posts.
- Weekly accomplishments.
- Custom group challenges.
- Group achievements and badges.
Body weight and personal nutrition numbers remain private by default.

12. Coin Economy
12.1 Currency
Coins are earned through individual achievements and optional group bonuses.

Coins cannot be bought, transferred, or redeemed for real money.
12.2 Coin Sources
Individual:
- Meal logging.
- Daily nutrition achievements.
- Streak milestones.
Community:
- Group completion bonuses.
- Future collaborative challenges.
12.3 Economy Principles
- Solo users must earn enough coins to access shop items at a reasonable pace.
- Groups accelerate progression but do not gate essential features.
- No pay-to-win mechanics.
- No negative coin balances.
- Reward payouts are server-controlled.
- Duplicate event rewards are prevented.

13. Avatar Shop
13.1 Purpose
Users spend earned coins customizing their personal avatars.

All items are cosmetic.
13.2 Categories
Category	Examples	Price Range
Outfits	Hoodies, jerseys, gym clothes	100–400
Hair/Hats	Hairstyles, caps, beanies	80–250
Accessories	Sunglasses, headphones	50–200
Expressions	Special animations	300
Backgrounds	Gym, kitchen, beach	150–500

13.3 Hackathon MVP
Implement three purchasable items:
- Sunglasses — 20 coins
- Hoodie — 40 coins
- Crown — 60 coins
Users can:
1. Preview items.
2. Purchase with coins.
3. Equip purchased cosmetics.
4. See the updated avatar on Home.
All purchases must be validated server-side.

14. Navigation
The application uses five bottom navigation tabs.
Tab	Function
Home	Personal avatar and nutrition dashboard
Log Food	AI camera scanner
Communities	Group view (challenges and shared world) and Friends view, switched by a toggle
Shop	Avatar cosmetics
Profile	Personal settings, avatar and account

The camera button is centered and visually emphasized.

14.1 Profile and Settings
The Profile tab is a settings page. It does not show progress or statistics (streaks and past logs stay on Home and History).

Sections:
1. Personal settings. The user can edit everything they entered at first sign-up:
- Username, height, weight, age, unit preference.
- Goal (Bulk, Cut, Maintain) and optional target weight.
- Daily calorie and protein targets, and optional carbohydrate and fat targets.
- The same validation and safety rules as onboarding apply: goal and target weight must agree, unusually restrictive calorie targets are warned against or blocked, and users must be adults.
- Changing a target applies from the day it is saved. Previous days keep the targets they were completed against.
2. Avatar. The user edits their avatar through their inventory: equip and unequip owned items, and change the base look chosen in onboarding (character, skin tone, hair, face, outfit). Items that are not owned stay in the Shop. Changes show on Home immediately.
3. Privacy controls.
- A plain-language summary of what is private by default: food images, body stats, and exact calories and macros are never shown to other users.
- A toggle to hide the user's daily goal status from group members. The user still counts toward group completion; their row simply shows no status to teammates.
- A link to leave the current group (see 8.2).
4. Notification preferences.
- Toggles for meal reminders and group achievement alerts, saved per user.
- For the MVP these are stored settings only. Delivering push notifications is post-hackathon (P2).
- Notifications never blame or shame members (see 9.5).
5. Account.
- Sign out: ends the session and returns to the welcome screen.
- Delete my account and data: permanently removes the profile, meals, daily progress, coin transactions, inventory and group memberships. Requires a clear confirmation step (type the username). Cannot be undone. Deletion runs on the server.

Rules:
- A user can only read and change their own profile; all saves are validated server-side.
- Coins are never changed by editing settings. Existing coins and purchases are kept.
- Settings work the same for solo users and group members.

15. Technical Architecture
Recommended Stack
Component	Technology
Frontend	Next.js + TypeScript
Styling	Tailwind CSS
Database	Supabase PostgreSQL
Authentication	Supabase Auth
Real-time	Supabase Realtime
Image Storage	Supabase Storage
AI	Vision-capable model API
Hosting	Vercel
Platform	Responsive PWA

Core Data Models
Users
- user_id
- username
- email
- goal_type
- calorie_target
- protein_target
- avatar_configuration
- coin_balance
- unit_preference
- hide_status_from_group
- notify_meal_reminders
- notify_group_alerts
Meals
- meal_id
- user_id
- timestamp
- food_items
- calories
- protein
- carbs
- fat
- image_reference
DailyProgress
- user_id
- date
- total_calories
- total_protein
- total_carbs
- total_fat
- calorie_goal_completed
- protein_goal_completed
- personal_goal_completed
Groups
- group_id
- group_name
- invite_code
- creator_id
GroupMembers
- group_id
- user_id
- joined_at
GroupDailyProgress
- group_id
- date
- eligible_member_count
- completed_member_count
- completion_percentage
- bonus_tier
- reward_status
CoinTransactions
- transaction_id
- user_id
- amount
- reason
- reward_event_id
- timestamp
ShopItems
- item_id
- name
- category
- cost
- asset_reference
Inventory
- user_id
- item_id
- equipped_status

16. Non-Functional Requirements
Area	Requirement
Platform	Mobile-first web application
Performance	Home loads quickly on normal mobile connections
AI	Target response within 8 seconds
Privacy	Food images and body stats private by default
Security	Server validates all coins and achievements
Real-time	Group progress synchronizes across devices
Accuracy	Nutritional estimates are editable and labeled approximate
Accessibility	Readable text and touch-friendly interfaces
Reliability	Prevent duplicate reward claims
Notifications	Optional reminders and group achievement alerts (preferences stored in Profile settings, see 14.1)
Health safety	No punitive or restrictive eating incentives

The prototype targets adult users. Supporting minors would require additional protections and nutrition-goal review.

17. Hackathon MVP Priorities
P0 — Critical
These must work during the demo:
1. User onboarding with personal goal selection.
2. Basic avatar customization.
3. AI camera food scanning.
4. Editable nutrition results.
5. Personal nutrition dashboard.
6. Personal achievement tracking.
7. Individual coin rewards.
8. Group creation and joining.
9. Group completion calculation.
10. Bonus coin rewards.
11. Real-time group progress updates.
P1 — Important
Build after core functionality works:
- Avatar mood animations.
- Shared evolving world.
- Three-item shop.
- Group achievement celebration.
- AI meal suggestions.
- Profile and Settings tab (14.1).
- Friends in the Communities tab (username search, mutual requests, friend streak and calendar).
- Share progress card to other apps.
P2 — Post-Hackathon
- Full friends feed.
- More complex group challenges.
- Multiple groups.
- Advanced nutrition recommendations.
- Weight history.
- Wearable integration.
- Push notifications.
- More avatar cosmetics.
- Native mobile applications.

18. Hackathon Demo Plan
Scene 1 — Personalization
Show a new user selecting:
- Goal: Bulk
- Personal nutrition targets
- Custom avatar
Explain that everyone has their own goals.
Scene 2 — AI Food Scanning
Take a photograph of food.

Show AI identifying the meal, calories, and protein.

Confirm the meal and update progress.
Scene 3 — Personal Achievement
Complete a demonstration personal goal.

The avatar celebrates.

Coins appear in the user's balance.

Emphasize: This works without a group.
Scene 4 — Community Bonus
Open a group on two devices.

Show members completing their individual goals.

The group progress increases in real time.

When every member achieves their goal, the group reaches 100%.

A bonus coin reward appears.
Scene 5 — Shared World
The shared world transforms.

Group avatars celebrate together.
Scene 6 — Shop
Use earned coins to purchase an accessory.

Equip it on the personal avatar.
Closing Pitch
"DIG IN makes nutrition tracking more than counting calories. Every meal brings you closer to your personal goals, and every achievement becomes more rewarding when you succeed together."

19. Success Criteria
Hackathon Success
A successful demonstration must show:
- A real AI food scan.
- User confirmation of nutrition estimates.
- Personal progress updating.
- Individual achievement and coin rewards.
- Solo use without group membership.
- Two users participating in the same group.
- Group progress updating in real time.
- A completion bonus awarded correctly.
- Avatar customization through earned coins.
Long-Term Product Targets
Metric	Target
Onboarding completion	80%
Day-7 retention	35%
Daily meal logging	2+ meals per active user
Group adoption	50% of active users join a group
Group participation	60% of group members complete a daily achievement
Scan accuracy	Evaluate against verified reference meals

These are proposed targets, not validated performance claims.

20. Final Product Vision
DIG IN is not just a calorie counter.

It is a personal nutrition companion that transforms everyday progress into a rewarding game.

Users set their own goals, track meals using AI, earn coins, customize avatars, and build consistency.

For those who want more motivation, friends and groups provide additional rewards through shared success.

The individual experience remains complete. The community makes it more rewarding.
Final Tagline
"Dig into your goals. Grow together. Earn together."

PRD Version: 3.0
Status: Ready for hackathon implementation planning
Core Priority: Personal nutrition progression first, optional community rewards second.