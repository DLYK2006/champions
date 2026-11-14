"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  DailyProgress,
  GroupDailyProgress,
  GroupMemberStatus,
  Profile,
} from "@/types";

// Frontend demo fixtures only. Replace route-level consumers with owner-provided data.
export const demoProfile: Profile = {
  id: "demo-alex",
  username: "Alex",
  goal_type: "bulk",
  height_cm: 175,
  weight_kg: 70,
  age: 24,
  target_weight_kg: 75,
  calorie_target: 2500,
  protein_target_g: 150,
  carbs_target_g: null,
  fat_target_g: null,
  avatar: {
    skinColor: "#DCA16E",
    top: "curly",
    hairColor: "#643D29",
    eyes: "happy",
    mouth: "smile",
    clothing: "hoodie",
  },
  equipped: ["hoodie"],
  coin_balance: 240,
  streak: 3,
};
export const demoProgress: DailyProgress = {
  date: "2026-11-14",
  meals_logged: 2,
  total_calories: 1800,
  total_protein_g: 110,
  total_carbs_g: 200,
  total_fat_g: 65,
  calorie_goal_completed: false,
  protein_goal_completed: false,
  personal_goal_completed: false,
};
export const demoGroup: GroupDailyProgress = {
  group_id: "demo-garden",
  date: "2026-11-14",
  eligible_member_count: 4,
  completed_member_count: 3,
  completion_percentage: 75,
  bonus_tier: 10,
};
export const demoMembers: GroupMemberStatus[] = [
  "Alex",
  "Jamie",
  "Sam",
  "Riley",
].map((username, i) => ({
  user_id: `demo-${i}`,
  username,
  avatar: {
    ...demoProfile.avatar,
    skinColor: ["#DCA16E", "#F0C29D", "#AB7252", "#EAC399"][i],
    hairColor: ["#643D29", "#352F2B", "#92512D", "#573C32"][i],
  },
  equipped: i === 1 ? ["crown"] : [],
  personal_goal_completed: i > 0,
}));

interface DemoContextValue {
  balance: number;
  owned: string[];
  equipped: string[];
  buy: (id: string, price: number) => Promise<void>;
  equip: (id: string) => Promise<void>;
}
const DemoContext = createContext<DemoContextValue | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(demoProfile.coin_balance);
  const [owned, setOwned] = useState(["hoodie"]);
  const [equipped, setEquipped] = useState(demoProfile.equipped);
  async function buy(id: string, price: number) {
    if (owned.includes(id)) throw new Error("You already own this item.");
    if (balance < price)
      throw new Error("A few more quests will get you there.");
    setBalance((value) => value - price);
    setOwned((items) => [...items, id]);
  }
  async function equip(id: string) {
    if (!owned.includes(id))
      throw new Error("Purchase this item before equipping it.");
    setEquipped((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  }
  return (
    <DemoContext.Provider value={{ balance, owned, equipped, buy, equip }}>
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider is required for demo routes.");
  return value;
}
