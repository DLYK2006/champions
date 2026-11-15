"use client";
import { useState } from "react";
import { analysisRange, type AnalysisRange } from "./analysis-selection";

export function DateRangeFilter({
  range,
  today,
  onApply,
}: {
  range: AnalysisRange;
  today: string;
  onApply: (range: AnalysisRange) => void;
}) {
  const [from, setFrom] = useState(range.kind === "range" ? range.from : "");
  const [to, setTo] = useState(range.kind === "range" ? range.to : "");
  const [error, setError] = useState("");
  return (
    <form
      className="history-filter"
      noValidate
      aria-label="Analysis dates"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          const selection = analysisRange(from, to, today);
          setError("");
          onApply(selection);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Check your dates.");
        }
      }}
    >
      <div className="history-date-inputs">
        <label>
          From
          <input
            type="date"
            aria-label="From date"
            value={from}
            max={today}
            onChange={(e) => {
              setFrom(e.target.value);
              setError("");
            }}
            aria-describedby={error ? "history-range-error" : undefined}
          />
        </label>
        <label>
          To
          <input
            type="date"
            aria-label="To date"
            value={to}
            max={today}
            onChange={(e) => {
              setTo(e.target.value);
              setError("");
            }}
            aria-describedby={error ? "history-range-error" : undefined}
          />
        </label>
      </div>
      {error && (
        <p
          className="history-filter-error field-error"
          id="history-range-error"
          role="alert"
        >
          {error}
        </p>
      )}
      <div className="history-filter-actions">
        <button type="submit" className="button button-primary">
          View analysis
        </button>
        <button
          type="button"
          className="button button-soft"
          onClick={() => {
            setFrom("");
            setTo("");
            setError("");
            onApply({ kind: "all" });
          }}
        >
          All dates
        </button>
      </div>
    </form>
  );
}
