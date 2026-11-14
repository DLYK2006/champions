import Image from 'next/image';
import type { GroupMemberStatus } from '@/types';
import { PixelAvatar } from '@/components/avatar/pixel-avatar';
import { Icon } from '@/components/ui/icons';

export function Garden({ progress, members = [] }: { progress: number; members?: GroupMemberStatus[] }) {
  const stage = progress >= 100 ? 4 : progress >= 80 ? 3 : progress >= 60 ? 2 : progress >= 25 ? 1 : 0;
  const label = ['A little seed of something', 'A new friend awakens', 'Growing, together', 'A flourishing little world', 'Your garden is in full bloom'][stage];
  return <div className={`garden-scene stage-${stage}`}><Image src="/dig-in/garden.png" alt="A pixel woodland garden with four vegetable beds, flowers and a friendly sprout creature" fill sizes="(max-width: 760px) 100vw, 700px" priority /><span className="garden-label"><Icon name="leaf" size={15} /> The Little Sprouts</span><span className="garden-stage">{label}</span>{members.slice(0, 4).map((member, i) => <span className="garden-member" key={member.user_id} style={{ left: `${18 + i * 18}%` }}><PixelAvatar config={member.avatar} equipped={member.equipped} variant={i} size={39} name={member.username} /></span>)}</div>;
}
