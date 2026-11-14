import Image from 'next/image';
import type { AvatarConfig, Mood } from '@/types';

function color(value: string | undefined, fallback: string) { return value && /^#?[0-9a-f]{6}$/i.test(value) ? `#${value.replace('#', '')}` : fallback; }

export function PixelAvatar({ config, equipped = [], size = 48, name = '', variant = 0 }: { config?: AvatarConfig; equipped?: string[]; size?: number; name?: string; variant?: number }) {
  const skin = color(config?.skinColor, ['#DCA16E', '#F0C29D', '#AB7252', '#EAC399'][variant % 4]);
  const hair = color(config?.hairColor, ['#643D29', '#352F2B', '#92512D', '#573C32'][variant % 4]);
  const outfit = equipped.includes('hoodie') || config?.clothing === 'hoodie' ? '#496B43' : config?.clothing === 'overall' ? '#8B9B9C' : config?.clothing === 'graphicShirt' ? '#C5A04E' : ['#52704A', '#C18768', '#C2A14D', '#687C92'][variant % 4];
  return <svg width={size} height={size} viewBox="0 0 32 32" role={name ? 'img' : undefined} aria-label={name || undefined} aria-hidden={!name} shapeRendering="crispEdges" className="pixel-avatar">
    <path fill="#E5E9CD" d="M0 0h32v32H0z" />
    <path fill={outfit} d="M7 25h18v7H7zM11 23h10v4H11z" />
    <path fill="#302B22" d="M7 8h18v15H7zM10 5h12v3H10z" />
    <path fill={skin} d="M9 10h14v12H9zM7 14h2v5H7zM23 14h2v5h-2zM12 22h8v4h-8z" />
    <path fill={hair} d="M7 8h18v5h-5V9h-3v5h-5v-3H9v5H7zM10 5h12v4H10zM6 12h3v10H6zM23 11h3v11h-3z" />
    {config?.top === 'longHairStraight' && <path fill={hair} d="M4 12h3v15H4zM25 12h3v15h-3z" />}
    {config?.top === 'curly' && <path fill={hair} d="M5 6h5v5H5zM11 3h5v5h-5zM19 4h5v6h-5zM24 8h4v6h-4z" />}
    {config?.top === 'bun' && <path fill={hair} d="M12 1h8v5h-8z" />}
    {config?.top === 'hat' && <path fill="#8A9D65" d="M8 4h16v6H8zM5 9h23v3H5z" />}
    <path fill="#32251C" d={config?.eyes === 'happy' ? 'M10 16h2v-2h2v2h-2v1h-2zM18 16h2v-2h2v2h-2v1h-2z' : config?.eyes === 'wink' ? 'M11 15h2v3h-2zM18 16h4v1h-4z' : config?.eyes === 'side' ? 'M12 15h2v3h-2zM20 15h2v3h-2z' : 'M11 15h2v3h-2zM19 15h2v3h-2z'} />
    <path fill="#8B503B" d={config?.mouth === 'twinkle' ? 'M13 20h6v2h-6zM14 22h4v1h-4z' : config?.mouth === 'serious' ? 'M14 21h4v1h-4z' : config?.mouth === 'default' ? 'M15 20h2v2h-2z' : 'M13 20h1v1h4v-1h1v2h-6z'} />
    <path fill="#CD7E64" d="M10 19h3v1h-3zM20 19h3v1h-3z" />
    {equipped.includes('sunglasses') && <path fill="#232F2B" d="M9 14h6v5H9zM17 14h6v5h-6zM15 15h2v1h-2z" />}
    {equipped.includes('crown') && <path fill="#E7B74D" stroke="#735025" strokeWidth=".6" d="M8 3l4 3 4-5 4 5 4-3-1 6H9z" />}
  </svg>;
}

export function RoomCharacter({ equipped = [], mood = 'progressing' }: { equipped?: string[]; mood?: Mood }) {
  return <div className={`room-character mood-${mood}`} aria-label="Your adventurer, feeling encouraged" role="img">
    <Image src="/dig-in/adventurer.png" alt="" width={185} height={270} className="adventurer-art" priority />
    {equipped.includes('crown') && <svg className="character-crown" viewBox="0 0 60 30" aria-hidden="true" shapeRendering="crispEdges"><path fill="#E9B64F" stroke="#644327" strokeWidth="3" d="M4 5l13 9L30 2l13 12L56 5l-5 22H9z" /><path stroke="#FFF0A8" strokeWidth="3" d="M13 21h33" /></svg>}
    {equipped.includes('sunglasses') && <svg className="character-glasses" viewBox="0 0 64 24" aria-hidden="true"><path fill="#273A2E" stroke="#BC9E5F" strokeWidth="2" d="M3 3h23v17H3zM38 3h23v17H38z" /><path stroke="#273A2E" strokeWidth="5" d="M26 8h12" /></svg>}
  </div>;
}
