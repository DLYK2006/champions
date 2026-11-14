"use client";
import { useRef, type ChangeEvent } from "react";
import { Icon } from "@/components/ui/icons";
export interface ScanViewProps {
  status: "ready" | "scanning" | "error";
  error?: string;
  previewUrl?: string;
  onFile: (file: File) => void;
  onManual: () => void;
  onRetry: () => void;
  onDemo?: () => void;
}
export function ScanView({
  status,
  error,
  previewUrl,
  onFile,
  onManual,
  onRetry,
  onDemo,
}: ScanViewProps) {
  const upload = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const scanning = status === "scanning";
  function selected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = "";
  }
  return (
    <main className="scan-page">
      <h1 className="screen-title">Scan</h1>
      <section
        className={`viewfinder-panel ${scanning ? "is-scanning" : ""}`}
        aria-label="Food photo capture"
      >
        <div
          className="viewfinder"
          style={
            previewUrl
              ? { backgroundImage: `url(${JSON.stringify(previewUrl)})` }
              : undefined
          }
        >
          <div className="viewfinder-grid" />
          <span className="viewfinder-corner corner-tl" />
          <span className="viewfinder-corner corner-tr" />
          <span className="viewfinder-corner corner-bl" />
          <span className="viewfinder-corner corner-br" />
          {(!previewUrl || scanning) && (
            <div className="viewfinder-center">
              <Icon name={scanning ? "spark" : "scan"} size={54} />
              <p role={scanning ? "status" : undefined}>
                {scanning ? "Scanning…" : "Add a meal photo"}
              </p>
            </div>
          )}
          {scanning && <div className="scan-sweep" />}
        </div>
        <div className="capture-controls">
          <button
            className="capture-secondary"
            disabled={scanning}
            onClick={() => upload.current?.click()}
          >
            <Icon name="plus" size={22} />
            <span>Upload</span>
          </button>
          <button
            className="shutter-button"
            disabled={scanning}
            onClick={() => camera.current?.click()}
            aria-label="Take a food photo"
          >
            <Icon name="scan" size={30} />
          </button>
          <button
            className="capture-secondary"
            disabled={scanning}
            onClick={onManual}
          >
            <Icon name="bowl" size={22} />
            <span>Manual</span>
          </button>
        </div>
        <input
          className="sr-only"
          ref={upload}
          type="file"
          accept="image/*"
          aria-label="Food photo"
          disabled={scanning}
          onChange={selected}
        />
        <input
          className="sr-only"
          ref={camera}
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Camera food photo"
          disabled={scanning}
          onChange={selected}
        />
      </section>
      {status === "error" && (
        <section className="panel scan-error" role="alert">
          <p>{error || "Could not scan this meal."}</p>
          <div className="form-actions">
            <button className="button" onClick={onRetry}>
              Try again
            </button>
            <button className="button button-primary" onClick={onManual}>
              Enter manually
            </button>
          </div>
        </section>
      )}
      {onDemo && (
        <button
          className="text-button scan-demo-button"
          onClick={onDemo}
          disabled={scanning}
        >
          Sample meal
        </button>
      )}
    </main>
  );
}
