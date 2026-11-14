// Owner: @DLYK2006
import type { Macros } from "@/types";

const round1 = (n: number) => Math.round(n * 10) / 10;

// Totals are always summed in code, never taken from the model.
export function sumMacros(items: Macros[]): Macros {
  const t = items.reduce(
    (s, i) => ({
      calories: s.calories + i.calories,
      protein_g: s.protein_g + i.protein_g,
      carbs_g: s.carbs_g + i.carbs_g,
      fat_g: s.fat_g + i.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
  return { calories: round1(t.calories), protein_g: round1(t.protein_g), carbs_g: round1(t.carbs_g), fat_g: round1(t.fat_g) };
}
