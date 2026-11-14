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
