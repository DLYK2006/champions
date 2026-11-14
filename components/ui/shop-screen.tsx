'use client';

import { useRef, useState } from 'react';
import { RoomCharacter } from '@/components/avatar/pixel-avatar';
import { Icon, type IconName } from './icons';
import { PageIntro } from './primitives';
import { useDemo } from './demo-context';

export interface ShopItem { id: string; name: string; price: number; category: 'Outfits' | 'Hats' | 'Accessories'; icon: IconName; description: string; }
export const demoShopItems: ShopItem[] = [{ id: 'hoodie', name: 'Woodland Hoodie', price: 40, category: 'Outfits', icon: 'shirt', description: 'A cozy layer for everyday adventures.' }, { id: 'sunglasses', name: 'Sunglasses', price: 20, category: 'Accessories', icon: 'glasses', description: 'A little sunshine, a little cool.' }, { id: 'crown', name: 'Crown', price: 60, category: 'Hats', icon: 'crown', description: 'For the ruler of little victories.' }];
export interface ShopScreenProps { balance: number; owned: string[]; equipped: string[]; items: ShopItem[]; onBuy: (id: string, price: number) => Promise<void>; onEquip: (id: string) => Promise<void>; }
export function ShopScreen({ balance, owned, equipped, items, onBuy, onEquip }: ShopScreenProps) {
  const [category, setCategory] = useState('All treasures');
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const previewEquipment = preview && !equipped.includes(preview) ? [...equipped, preview] : equipped;
  const visible = items.filter(item => category === 'All treasures' || item.category === category);
  async function act(item: ShopItem) {
    if (inFlight.current) return;
    inFlight.current = true; setPending(item.id); setMessage(''); setError('');
    try {
      if (owned.includes(item.id)) { await onEquip(item.id); setMessage(`${item.name} ${equipped.includes(item.id) ? 'unequipped' : 'equipped'}.`); }
      else { await onBuy(item.id, item.price); setMessage(`${item.name} is now in your collection.`); }
    } catch (err) { setError(err instanceof Error ? err.message : 'That didn’t work. Your coins are safe; try again.'); }
    finally { inFlight.current = false; setPending(null); }
  }
  return <main><PageIntro eyebrow="THE LITTLE TREASURE SHOP" title="A little more you." description="Turn small wins into something you can wear. Every treasure is cosmetic." trailing={<span className="streak-badge"><Icon name="coin" size={24} /><span><b>{balance} coins to spend</b><small>Earned, one little win at a time.</small></span></span>} /><div className="shop-grid"><aside className="panel wardrobe-panel"><h2>Your adventurer</h2><p className="section-copy">A familiar face. A fresh little look.</p><div className="wardrobe-stage"><RoomCharacter equipped={previewEquipment} /></div><p className="preview-label">{preview ? `Trying on: ${items.find(item => item.id === preview)?.name}` : 'Choose a treasure to try it on.'}</p><div className="equipped-chips">{equipped.map(id => <span key={id}><Icon name="check" size={11} /> {id}</span>)}</div>{preview && <button className="text-button" onClick={() => setPreview(null)}>Back to equipped look</button>}<p className="fine-print">Previewing is always free.</p></aside><section><div className="shop-tabs" role="group" aria-label="Filter treasures">{['All treasures', 'Outfits', 'Hats', 'Accessories'].map(tab => <button key={tab} aria-pressed={category === tab} onClick={() => setCategory(tab)}>{tab}</button>)}</div><div className="shop-collection-header"><strong>Small treasures. Big personality.</strong><span>{visible.length} {visible.length === 1 ? 'treasure' : 'treasures'}</span></div><div className="shop-item-grid">{visible.map(item => <article className={`panel shop-card ${preview === item.id ? 'is-selected' : ''}`} key={item.id}><button className={`shop-item-preview item-${item.id}`} aria-label={`Preview ${item.name}`} aria-pressed={preview === item.id} onClick={() => setPreview(item.id)}><Icon name={item.icon} size={65} /><span className="item-tag">{equipped.includes(item.id) ? 'EQUIPPED' : owned.includes(item.id) ? 'IN YOUR BAG' : 'TRY ME ON'}</span></button><h3>{item.name}</h3><p>{item.description}</p><button className={`button ${owned.includes(item.id) ? 'button-soft' : 'button-primary'}`} disabled={pending !== null || (!owned.includes(item.id) && balance < item.price)} aria-label={owned.includes(item.id) ? `${equipped.includes(item.id) ? 'Unequip' : 'Equip'} ${item.name}` : `Buy ${item.name} for ${item.price} coins`} onClick={() => act(item)}>{pending === item.id ? 'One moment…' : owned.includes(item.id) ? <><Icon name={equipped.includes(item.id) ? 'check' : 'shirt'} size={15} />{equipped.includes(item.id) ? 'Equipped · remove' : 'Equip treasure'}</> : <><Icon name="coin" size={17} />{item.price} coins <Icon name="plus" size={15} /></>}</button>{!owned.includes(item.id) && balance < item.price && <p className="fine-print">A few more quests will get you there.</p>}</article>)}</div><div className="shop-status" role="status" aria-live="polite">{message}</div>{error && <p role="alert" className="field-error">{error}</p>}<div className="shop-note"><Icon name="leaf" size={21} /><p>Earn coins through personal quests, with optional garden bonuses.<br />No paid coins. No shortcuts. Just your own little progress.</p></div></section></div><footer className="page-footer"><span><Icon name="spark" size={14} /> LITTLE THINGS THAT FEEL LIKE YOU</span><span>Demo purchases · no real transactions</span></footer></main>;
}
export function DemoShop() { const { balance, owned, equipped, buy, equip } = useDemo(); return <ShopScreen balance={balance} owned={owned} equipped={equipped} items={demoShopItems} onBuy={buy} onEquip={equip} />; }
