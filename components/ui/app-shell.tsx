"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { DemoProvider } from "./demo-context";

const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/scan", label: "Scan", icon: "scan" },
  { href: "/groups", label: "Community", icon: "users" },
  { href: "/shop", label: "Shop", icon: "shop" },
];
function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const route =
    pathname === "/"
      ? "home"
      : pathname.startsWith("/scan")
        ? "scan"
        : pathname.startsWith("/groups")
          ? "community"
          : pathname.startsWith("/shop")
            ? "shop"
            : "other";
  return (
    <div className={`dig-app compact-app route-${route}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div id="main-content" className="app-main" tabIndex={-1}>
        {children}
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        <div className="nav-inner">
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`nav-tab ${active ? "is-active" : ""}`}
              >
                <span className="nav-icon">
                  <Icon name={tab.icon} size={24} />
                </span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <DemoProvider>
      <Shell>{children}</Shell>
    </DemoProvider>
  );
}
