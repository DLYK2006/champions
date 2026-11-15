"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { DemoProvider } from "./demo-context";

const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/profile", label: "Profile", icon: "profile" },
  { href: "/scan", label: "Scan", icon: "scan" },
  { href: "/groups", label: "Community", icon: "users" },
  { href: "/shop", label: "Shop", icon: "shop" },
];
// Index of the nav tab under a screen point, or null when the point is off the tabs.
function tabIndexAt(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-tab-index]");
  return el ? Number(el.dataset.tabIndex) : null;
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Tab currently "pressed" (finger/mouse down on it, or dragged over it).
  const [pressed, setPressed] = useState<number | null>(null);
  const startIndex = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const index = tabIndexAt(e.clientX, e.clientY);
    startIndex.current = index;
    suppressClick.current = false;
    setPressed(index);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (startIndex.current === null) return;
    setPressed(tabIndexAt(e.clientX, e.clientY));
  };
  const endPress = (e: PointerEvent, commit: boolean) => {
    const start = startIndex.current;
    if (start === null) return;
    const end = commit ? tabIndexAt(e.clientX, e.clientY) : null;
    startIndex.current = null;
    setPressed(null);
    // Released on a different tab than we started on: open it instead of the tab we pressed.
    suppressClick.current = commit && end !== start;
    if (commit && end !== null && end !== start) router.push(tabs[end].href);
  };
  const route =
    pathname === "/"
      ? "home"
      : pathname.startsWith("/scan")
        ? "scan"
        : pathname.startsWith("/groups")
          ? "community"
          : pathname.startsWith("/shop")
            ? "shop"
            : pathname.startsWith("/profile")
              ? "profile"
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
        <div
          className="nav-inner"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endPress(e, true)}
          onPointerCancel={(e) => endPress(e, false)}
          onClickCapture={(e) => {
            // The drag already navigated (or was dropped off the bar); skip the original tab's link click.
            if (suppressClick.current) {
              suppressClick.current = false;
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          {tabs.map((tab, i) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                data-tab-index={i}
                draggable={false}
                className={`nav-tab ${active ? "is-active" : ""} ${pressed === i ? "is-pressed" : ""}`}
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
