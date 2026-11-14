'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './icons';
import { RoomCharacter } from '@/components/avatar/pixel-avatar';

export interface Achievement { id: string; title: string; description: string; coins: number; group?: boolean; preview?: boolean; }
export function AchievementDialog({ achievement, onClose }: { achievement: Achievement | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!achievement) return;
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, [achievement]);
  if (!achievement) return null;
  return <dialog ref={dialog} className={`achievement-dialog ${achievement.group ? 'is-group' : ''}`} aria-labelledby="achievement-title" aria-describedby="achievement-copy" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button className="icon-button dialog-close" onClick={onClose} aria-label="Close celebration"><Icon name="close" /></button>
    <p className="eyebrow">{achievement.preview ? 'Celebration preview' : achievement.group ? 'Better, together' : 'A moment for you'}</p>
    <div className="achievement-art"><div className="celebration-rays" /><RoomCharacter mood={achievement.group ? 'group_success' : 'goal_complete'} equipped={['hoodie', 'crown']} /><span className="floating-star star-one">✦</span><span className="floating-star star-two">✧</span><span className="floating-star star-three">✦</span></div>
    <h2 id="achievement-title">{achievement.title}</h2><p id="achievement-copy">{achievement.description}</p>
    <div className="reward-pill"><Icon name="coin" size={25} /><strong>+{achievement.coins}</strong><span>{achievement.preview ? 'example coins' : 'coins earned'}</span></div>
    {achievement.preview && <p className="fine-print">Just a little preview. Your balance hasn’t changed.</p>}
    <button className="button button-primary" onClick={onClose}>Keep growing <Icon name="arrow" size={19} /></button>
  </dialog>;
}
