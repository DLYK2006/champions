import type { CSSProperties } from "react";

export type IconName =
  | "home"
  | "profile"
  | "scan"
  | "users"
  | "shop"
  | "coin"
  | "flame"
  | "leaf"
  | "spark"
  | "share"
  | "arrow"
  | "check"
  | "close"
  | "plus"
  | "shirt"
  | "crown"
  | "glasses"
  | "wheat"
  | "drop"
  | "bowl"
  | "settings"
  | "sun"
  | "calendar"
  | "back"
  | "meat"
  | "carrot";
const paths: Record<IconName, string> = {
  home: "M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10",
  profile: "M8 3h8v8H8ZM5 16l4-3h6l4 3v6H5Z",
  scan: "M4 8h4l2-3h5l2 3h3v12H4ZM9 13h6v4H9Z",
  users: "M8 4h4v5H8ZM16 6h4v4h-4ZM3 13l3-2h8l3 2v7H3ZM17 13h3l2 3v4h-3",
  shop: "M4 10v11h16V10M3 10l2-7h14l2 7ZM9 21v-7h6v7M3 10l3 2 3-2 3 2 3-2 3 2 3-2",
  coin: "M8 2h8l6 6v8l-6 6H8l-6-6V8ZM14 7h-4v5h4v5h-4M12 5v14",
  flame: "M13 2v7l4-3 4 8-2 6-7 2-7-3-2-6 5-7v6Z",
  leaf: "M20 3H10L4 9v7l4 4h7l6-6V3ZM4 21 16 9M9 16V9M9 16h7",
  spark: "M12 2v5l5 5-5 5v5M2 12h5l5-5 5 5h5M19 2v4M17 4h4",
  share: "M5 14v7h14v-7M12 3v13M7 8l5-5 5 5",
  arrow: "M4 12h15M13 6l6 6-6 6",
  check: "M4 12l5 5L20 6",
  close: "M6 6l12 12M18 6 6 18",
  plus: "M12 4v16M4 12h16",
  shirt: "M7 3 2 7l4 5 2-2v12h8V10l2 2 4-5-5-4-3 3h-4Z",
  crown: "M3 6l5 5 4-8 4 8 5-5-2 14H5ZM5 16h14",
  glasses: "M2 9h8v7H2ZM14 9h8v7h-8ZM10 11h4M2 9V6M22 9V6",
  wheat:
    "M5 22 18 3M8 17l-5-4v-3l6 3M11 12 6 8V5l6 4M14 8l-3-5V1l5 3M10 16l6 1 4-4-7-1",
  drop: "M12 2 4 13v5l4 4h8l4-4v-5ZM8 15v3l3 1",
  bowl: "M2 11h20l-3 9H5ZM4 8h16M7 6V4h4V2h4v3h3v2",
  settings:
    "M9 2h6v4l4 2 3-1v6l-3 1-2 4v4h-6l-1-4-4-2-4 1v-6l4-1 2-4ZM10 10h4v4h-4Z",
  sun: "M8 8h8v8H8ZM12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2",
  calendar: "M4 5h16v17H4ZM4 10h16M8 2v5M16 2v5M8 14h2M14 14h2M8 18h2",
  back: "M20 12H5M11 6l-6 6 6 6",
  meat: "M8 13 7 9l2-4 4-2h5l3 3v5l-2 4-4 2h-4ZM9.5 14.5 6 18M6 18l-1-3H3v2ZM6 18l3 1v2H7ZM16 6l2 2",
  carrot: "M14 6l4 4L5 22l-2-2ZM8 15l2 2M11 12l2 2M15 6l1-4M17 8l5-1M16 7l4-4",
};

export function Icon({
  name,
  size = 24,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="miter"
      strokeLinecap="square"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
