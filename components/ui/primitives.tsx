import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export function PageIntro({
  eyebrow,
  title,
  description,
  trailing,
}: {
  eyebrow: string;
  title: string;
  description: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">
          <span className="tiny-spark">✦</span> {eyebrow}
        </p>
        <h1>{title}</h1>
        <p className="intro-copy">{description}</p>
      </div>
      {trailing}
    </div>
  );
}
export function SectionHeading({
  icon,
  children,
  aside,
}: {
  icon: IconName;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>
        <span className="section-icon">
          <Icon name={icon} size={21} />
        </span>
        {children}
      </h2>
      {aside}
    </div>
  );
}
export function NutritionBar({
  label,
  value,
  target,
  unit,
  kind,
  icon,
  hint,
  completed,
  overTarget,
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  kind: string;
  icon: IconName;
  hint?: string;
  completed?: boolean;
  overTarget?: boolean;
}) {
  const percent =
    target !== null && target > 0 ? Math.max(0, Math.round((value / target) * 100)) : 0;
  const hasTarget = target !== null && target > 0;
  return (
    <div className={`nutrition-row ${kind}`}>
      <span className="nutrient-icon">
        <Icon name={icon} size={25} />
      </span>
      <div className="nutrition-detail">
        <div className="nutrition-label">
          <strong>{label}</strong>
          <span>
            <b>{value.toLocaleString("en-US")}</b>{hasTarget && <> / {target.toLocaleString("en-US")}</>} <small>{unit}</small>
          </span>
        </div>
        <div
          className="nutrition-track"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={hasTarget ? Math.min(percent, 100) : undefined}
          aria-valuetext={hasTarget ? `${value} of ${target} ${unit}` : `${value} ${unit} logged; no target set`}
        >
          <span style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
        {hint && (
          <div className="nutrition-guidance">
            <span>{hint}</span>
            {completed ? (
              <span className="nutrition-met" aria-label="Goal met">
                <Icon name="check" size={12} />
                Goal met
              </span>
            ) : overTarget ? (
              <span>A little over today</span>
            ) : null}
          </div>
        )}
      </div>
      <span className="progress-percent">
        {hasTarget ? `${percent}%` : "—"}
      </span>
    </div>
  );
}
