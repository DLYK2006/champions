"use client";
import Image from "next/image";
import Link from "next/link";
import type { DailyProgress, GroupDailyProgress, Profile } from "@/types";
import { Icon } from "./icons";
import { NutritionBar, SectionHeading } from "./primitives";
import { RoomCharacter } from "@/components/avatar/pixel-avatar";
import { demoGroup, demoProfile, demoProgress, useDemo } from "./demo-context";

export function HomeScreen({
  profile,
  progress,
  group,
}: {
  profile: Profile;
  progress: DailyProgress;
  group: GroupDailyProgress | null;
}) {
  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="DIG IN Home">
            <span className="brand-sprout">
              <Icon name="leaf" size={20} />
            </span>
            DIG IN<span className="brand-period">.</span>
          </Link>
          <div className="header-actions">
            <Link
              href="/shop"
              className="coin-wallet"
              aria-label={`${profile.coin_balance} coins. Open shop.`}
            >
              <Icon name="coin" size={21} />
              <span aria-label="Coin balance">{profile.coin_balance}</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="home-page">
        <h1 className="sr-only">Home</h1>
        <section className="room-panel" aria-label="Your room">
          <Image
            src="/dig-in/room.png"
            alt="A sunlit woodland room"
            fill
            sizes="(max-width: 760px) 100vw, 800px"
            priority
            className="room-background"
          />
          <div className="room-topline">
            <span className="room-name">Hi, {profile.username}</span>
            <Link
              href="/history"
              className="room-weather"
              aria-label={`${profile.streak}-day streak. View meal history.`}
            >
              <Icon name="flame" size={17} />
              {profile.streak}-day streak
            </Link>
          </div>
          {progress.personal_goal_completed && (
            <div className="room-bubble">
              Goal complete! <Icon name="check" size={15} />
            </div>
          )}
          <RoomCharacter
            room
            config={profile.avatar}
            equipped={profile.equipped}
            mood={
              group?.bonus_tier === 30
                ? "group_success"
                : progress.personal_goal_completed
                  ? "goal_complete"
                  : progress.meals_logged > 1
                    ? "active"
                    : progress.meals_logged === 1
                      ? "progressing"
                      : "ready"
            }
          />
          <Link href="/shop" className="room-customize">
            <Icon name="shirt" size={17} />
            Customize
          </Link>
        </section>
        <section className="panel nutrition-panel">
          <SectionHeading
            icon="bowl"
            aside={<span className="goal-badge">{profile.goal_type}</span>}
          >
            Today&apos;s quest
          </SectionHeading>
          <NutritionBar
            label="Calories"
            value={progress.total_calories}
            target={profile.calorie_target}
            unit="kcal"
            kind="calories"
            icon="bowl"
          />
          <NutritionBar
            label="Protein"
            value={progress.total_protein_g}
            target={profile.protein_target_g}
            unit="g"
            kind="protein"
            icon="leaf"
          />
          <div className="macro-pair">
            <div>
              <Icon name="wheat" size={21} />
              <span>Carbs</span>
              <strong>
                {progress.total_carbs_g} <small>g</small>
              </strong>
            </div>
            <div>
              <Icon name="drop" size={20} />
              <span>Fat</span>
              <strong>
                {progress.total_fat_g} <small>g</small>
              </strong>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
export function DemoHome() {
  const { balance, equipped } = useDemo();
  return (
    <HomeScreen
      profile={{ ...demoProfile, coin_balance: balance, equipped }}
      progress={demoProgress}
      group={demoGroup}
    />
  );
}
