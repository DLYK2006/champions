'use client';

import { useState } from 'react';
import type { MealType, ScanItem, ScanResult } from '@/types';
import { ScanView } from './scan-view';
import { ResultsView } from './results-view';
import { AchievementDialog, type Achievement } from '@/components/ui/achievement';

// UI preview only: no file reading, camera processing, AI calls, meal persistence or rewards.
const sampleItems: ScanItem[] = [
  { name: 'Grilled chicken', portion: '1 palm-sized portion', grams: 120, calories: 198, protein_g: 37, carbs_g: 0, fat_g: 4, confidence: 'high' },
  { name: 'Steamed broccoli', portion: '1 cup', grams: 150, calories: 52, protein_g: 4, carbs_g: 10, fat_g: 1, confidence: 'high' },
  { name: 'Brown rice', portion: '¾ cup, cooked', grams: 150, calories: 170, protein_g: 4, carbs_g: 35, fat_g: 1, confidence: 'medium' },
];
export function DemoScan() {
  const [view, setView] = useState<'ready' | 'scanning' | 'results' | 'error'>('ready');
  const [items, setItems] = useState<ScanItem[]>(sampleItems);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const result: ScanResult = { items, total: items.reduce((sum, item) => ({ calories: sum.calories + item.calories, protein_g: sum.protein_g + item.protein_g, carbs_g: sum.carbs_g + item.carbs_g, fat_g: sum.fat_g + item.fat_g }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }), overall_confidence: 'medium', coach_tip: 'A satisfying mix of protein, grains, and greens. Make the portions work for you.' };
  function update(index: number, patch: Partial<ScanItem>) { setItems(current => current.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  return <><div className="scan-demo-notice">UI demo · Sample estimates only. Photos are not processed and meals are not saved.</div>{view === 'results' ? <ResultsView result={result} mealType={mealType} onMealType={setMealType} onUpdate={update} onAdd={() => setItems(current => [...current, { name: 'New food', portion: '1 serving', grams: 0, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, confidence: 'low' }])} onRemove={index => setItems(current => current.filter((_, i) => i !== index))} onBack={() => setView('ready')} onConfirm={async () => setAchievement({ id: 'sample-meal', title: 'A nourishing little moment.', description: 'This is how a successful meal log will feel. This preview hasn’t saved a meal or changed your coins.', coins: 10, preview: true })} /> : <><ScanView status={view} error="This frontend demo doesn’t process photos yet. Explore a sample meal or enter a food manually." onFile={() => setView('error')} onManual={() => { setItems([{ name: '', portion: '1 serving', grams: 0, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, confidence: 'low' }]); setView('results'); }} onRetry={() => setView('ready')} onDemo={() => { setItems(sampleItems); setView('results'); }} /><div className="scan-state-previews"><span>Preview states</span><button className="text-button" onClick={() => setView(view === 'scanning' ? 'ready' : 'scanning')}>{view === 'scanning' ? 'End loading preview' : 'Loading'}</button><button className="text-button" onClick={() => setView('error')}>Error</button></div></>}<AchievementDialog achievement={achievement} onClose={() => setAchievement(null)} /></>;
}
