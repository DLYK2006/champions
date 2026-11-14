"use client";

import { useRef, useState } from "react";
import type { MealType, ScanItem, ScanResult } from "@/types";
import { Icon } from "@/components/ui/icons";

export interface ResultsViewProps {
  result: ScanResult;
  mealType: MealType;
  previewUrl?: string;
  error?: string;
  pending?: boolean;
  onMealType: (meal: MealType) => void;
  onUpdate: (index: number, patch: Partial<ScanItem>) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  onBack: () => void;
  onConfirm: () => Promise<void>;
}
export function ResultsView({
  result,
  mealType,
  previewUrl,
  error,
  pending = false,
  onMealType,
  onUpdate,
  onRemove,
  onAdd,
  onBack,
  onConfirm,
}: ResultsViewProps) {
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const inFlight = useRef(false);
  const invalid =
    !result.items.length ||
    result.items.some(
      (item) =>
        !item.name.trim() ||
        [
          item.grams,
          item.calories,
          item.protein_g,
          item.carbs_g,
          item.fat_g,
        ].some((value) => !Number.isFinite(value) || value < 0),
    );
  const busy = pending || saving;
  async function confirm() {
    if (inFlight.current || invalid || pending) return;
    inFlight.current = true;
    setSaving(true);
    setSaveError("");
    try {
      await onConfirm();
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Meal not saved. Your edits are kept; try again.",
      );
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }
  return (
    <main className="results-page">
      <div className="screen-title-row">
        <h1 className="screen-title">Review meal</h1>
        <button className="text-button" onClick={onBack} disabled={busy}>
          <Icon name="back" size={17} /> Back
        </button>
      </div>
      <div className="results-layout">
        <section>
          <div className="meal-summary panel">
            <div className="meal-summary-heading">
              {previewUrl && (
                // Preview comes from the owner's local camera/file controller.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="results-thumbnail"
                  src={previewUrl}
                  alt="Your meal"
                />
              )}
              <span className="estimate-label">Nutrition estimate</span>
            </div>
            <div className="result-macros">
              {[
                {
                  label: "Calories",
                  value: result.total.calories,
                  unit: "kcal",
                  icon: "bowl" as const,
                },
                {
                  label: "Protein",
                  value: result.total.protein_g,
                  unit: "g",
                  icon: "leaf" as const,
                },
                {
                  label: "Carbs",
                  value: result.total.carbs_g,
                  unit: "g",
                  icon: "wheat" as const,
                },
                {
                  label: "Fat",
                  value: result.total.fat_g,
                  unit: "g",
                  icon: "drop" as const,
                },
              ].map((macro) => (
                <div key={macro.label}>
                  <Icon name={macro.icon} size={20} />
                  <strong>
                    {Number.isFinite(macro.value)
                      ? Math.round(macro.value)
                      : "?"}
                    <small>{macro.unit}</small>
                  </strong>
                  <span>{macro.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="meal-type-buttons"
            role="group"
            aria-label="Meal type"
          >
            {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map(
              (meal) => (
                <button
                  key={meal}
                  className={`button ${mealType === meal ? "button-primary" : "button-soft"}`}
                  aria-pressed={mealType === meal}
                  onClick={() => onMealType(meal)}
                  disabled={busy}
                >
                  {meal[0].toUpperCase() + meal.slice(1)}
                </button>
              ),
            )}
          </div>
          <div className="food-list-heading">
            <h2>Foods</h2>
            <span>
              {result.items.length}{" "}
              {result.items.length === 1 ? "food" : "foods"}
            </span>
          </div>
          <div className="food-list">
            {result.items.map((item, index) => (
              <article className="panel food-card" key={index}>
                <div className="food-card-top">
                  <span className={`food-sprite food-${index % 3}`}>
                    <Icon
                      name={
                        index % 3 === 0
                          ? "bowl"
                          : index % 3 === 1
                            ? "leaf"
                            : "wheat"
                      }
                      size={29}
                    />
                  </span>
                  <div className="food-card-name">
                    <h3>{item.name || "New food"}</h3>
                    <p>
                      {item.portion || "Set a portion"} ·{" "}
                      {Number.isFinite(item.grams) ? item.grams : "?"} g
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setEditing(editing === index ? null : index)}
                    disabled={busy}
                    aria-expanded={editing === index}
                    aria-label={`Edit ${item.name || "new food"}`}
                  >
                    {editing === index ? "Done" : "Edit"}
                  </button>
                </div>
                <div className="food-card-bottom">
                  <span>
                    {Number.isFinite(item.calories)
                      ? Math.round(item.calories)
                      : "?"}{" "}
                    kcal <i>·</i>{" "}
                    {Number.isFinite(item.protein_g)
                      ? Math.round(item.protein_g)
                      : "?"}{" "}
                    g protein
                  </span>
                  <span className={`confidence confidence-${item.confidence}`}>
                    <span />
                    {item.confidence === "low"
                      ? "Check portion"
                      : item.confidence === "medium"
                        ? "Check estimate"
                        : "Good estimate"}
                  </span>
                </div>
                {editing === index && (
                  <div className="food-edit-grid">
                    <label className="field-label edit-name">
                      Food name
                      <input
                        className="text-input"
                        value={item.name}
                        disabled={busy}
                        onChange={(event) =>
                          onUpdate(index, { name: event.target.value })
                        }
                      />
                    </label>
                    <label className="field-label edit-name">
                      Portion
                      <input
                        className="text-input"
                        value={item.portion}
                        disabled={busy}
                        onChange={(event) =>
                          onUpdate(index, { portion: event.target.value })
                        }
                      />
                    </label>
                    {[
                      { key: "grams", label: "Weight (g)" },
                      { key: "calories", label: "Calories (kcal)" },
                      { key: "protein_g", label: "Protein (g)" },
                      { key: "carbs_g", label: "Carbs (g)" },
                      { key: "fat_g", label: "Fat (g)" },
                    ].map((field) => (
                      <label key={field.key} className="field-label">
                        {field.label}
                        <input
                          className="text-input"
                          type="number"
                          min="0"
                          step="any"
                          disabled={busy}
                          value={
                            Number.isFinite(item[field.key as keyof ScanItem])
                              ? item[field.key as keyof ScanItem]
                              : ""
                          }
                          onChange={(event) =>
                            onUpdate(index, {
                              [field.key]:
                                event.target.value === ""
                                  ? NaN
                                  : Number(event.target.value),
                            })
                          }
                        />
                      </label>
                    ))}
                    <button
                      className="text-button remove-food"
                      onClick={() => {
                        onRemove(index);
                        setEditing(null);
                      }}
                      disabled={busy}
                    >
                      <Icon name="close" size={15} />
                      Remove food
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
          {!result.items.length && (
            <p className="fine-print">Add a food to continue.</p>
          )}
          <button
            className="add-food"
            onClick={() => {
              onAdd();
              setEditing(result.items.length);
            }}
            disabled={busy}
          >
            <Icon name="plus" size={18} /> Add food
          </button>
        </section>
      </div>
      <div className="confirm-log-bar">
        <button
          className="button button-primary"
          onClick={confirm}
          disabled={busy || invalid}
        >
          {busy ? "Saving…" : "Confirm log"}
          <Icon name="check" size={19} />
        </button>
      </div>
      {(saveError || error) && (
        <p className="field-error confirm-error" role="alert">
          {saveError || error}
        </p>
      )}
      {invalid && (
        <p className="fine-print">
          Add a named food and use non-negative numbers before confirming.
        </p>
      )}
    </main>
  );
}
