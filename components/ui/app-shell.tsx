'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';
import { PixelAvatar } from '@/components/avatar/pixel-avatar';
import { DemoProvider, useDemo } from './demo-context';

const tabs: { href: string; label: string; icon: IconName }[] = [{ href: '/', label: 'Home', icon: 'home' }, { href: '/scan', label: 'Scan', icon: 'scan' }, { href: '/groups', label: 'Community', icon: 'users' }, { href: '/shop', label: 'Shop', icon: 'shop' }];
function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { balance, equipped } = useDemo();
  return <div className="dig-app">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="app-header"><div className="header-inner">
      <Link href="/" className="brand" aria-label="DIG IN Home"><span className="brand-sprout"><Icon name="leaf" size={20} /></span>DIG IN<span className="brand-period">.</span></Link>
      <span className="header-caption">a little nourishment. a little adventure.</span>
      <div className="header-actions"><span className="demo-tag"><span /> Demo mode</span><Link href="/shop" className="coin-wallet" aria-label={`Shop, ${balance} coins`}><Icon name="coin" size={21} /><span aria-label="Coin balance">{balance}</span></Link><Link href="/shop" className="profile-link" aria-label="Customize your avatar"><PixelAvatar equipped={equipped} size={38} /></Link></div>
    </div></header>
    <div id="main-content" className="app-main" tabIndex={-1}>{children}</div>
    <nav className="bottom-nav" aria-label="Main navigation"><div className="nav-inner">{tabs.map(tab => {
      const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
      return <Link key={tab.href} href={tab.href} aria-current={active ? 'page' : undefined} className={`nav-tab ${active ? 'is-active' : ''} ${tab.icon === 'scan' ? 'nav-scan' : ''}`}><span className="nav-icon"><Icon name={tab.icon} size={24} /></span><span>{tab.label}</span>{active && <span className="nav-dot" />}</Link>;
    })}</div></nav>
  </div>;
}
export function AppShell({ children }: { children: ReactNode }) { return <DemoProvider><Shell>{children}</Shell></DemoProvider>; }
