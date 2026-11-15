"use client";
// "Share my progress" (PRD 11.4): step 1 draws a preview, step 2 opens the share sheet (or downloads).
// Two steps because navigator.share must run straight from a tap, not after async drawing.
// Owner: @DLYK2006. Plain markup; Jay styles it.
import { useRef, useState } from "react";
import { PixelAvatar } from "@/components/avatar";
import { loadShareData, type ShareData } from "@/lib/share/data";
import { CARD_H, CARD_W, drawCard, loadImage, svgToImage } from "@/lib/share/card";

export function ShareButton() {
  const avatarRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ShareData | null>(null);
  const [card, setCard] = useState<{ file: File; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function build() {
    setBusy(true);
    setError(null);
    try {
      const d = await loadShareData();
      setData(d); // renders the hidden avatar below with the user's own look
      await new Promise((r) => requestAnimationFrame(r));
      const svg = avatarRef.current?.querySelector("svg");
      if (!svg) throw new Error("Couldn't draw your avatar.");
      const [scene, avatar] = await Promise.all([
        Promise.all(d.group ? ["/dig-in/garden-starter.png", "/dig-in/garden.png"].map(loadImage) : [loadImage("/dig-in/room.png")]),
        svgToImage(svg),
      ]);
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      canvas.width = CARD_W;
      canvas.height = CARD_H;
      drawCard(canvas.getContext("2d")!, d, scene, avatar, getComputedStyle(document.body).fontFamily);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!blob) throw new Error("Couldn't make the image.");
      if (card) URL.revokeObjectURL(card.url);
      setCard({ file: new File([blob], "dig-in-progress.png", { type: "image/png" }), url: URL.createObjectURL(blob) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't make your card. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!card) return;
    if (navigator.canShare?.({ files: [card.file] })) {
      try {
        await navigator.share({ files: [card.file], title: "My DIG IN progress" });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // the user closed the share sheet
        setError("Sharing didn't work. Use Download instead.");
      }
      return;
    }
    download();
  }

  function download() {
    if (!card) return;
    const a = document.createElement("a");
    a.href = card.url;
    a.download = card.file.name;
    a.click();
  }

  function close() {
    if (card) URL.revokeObjectURL(card.url);
    setCard(null);
  }

  return (
    <section aria-label="Share your progress" className="space-y-2">
      <button type="button" onClick={build} disabled={busy}>
        {busy ? "Making your card…" : "Share my progress"}
      </button>
      {error && <p role="alert">{error}</p>}
      {card && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={card.url} alt="Your progress card: streak, today's meals and goal, garden" className="w-full max-w-xs rounded" />
          <p className="text-xs">Only your streak, meal count, goal status and group progress are shown. No calories or weight.</p>
          <div className="flex gap-2">
            <button type="button" onClick={share}>Share</button>
            <button type="button" onClick={download}>Download</button>
            <button type="button" onClick={close}>Close</button>
          </div>
        </div>
      )}
      {data && (
        <div ref={avatarRef} aria-hidden hidden>
          <PixelAvatar config={data.avatar} equipped={data.equipped} size={240} transparent />
        </div>
      )}
    </section>
  );
}
