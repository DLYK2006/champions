"use client";
import { useRef } from "react";
import { ShareButton } from "@/components/share/ShareButton";
import { Icon } from "./icons";

export function HomeShare() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className="home-share-trigger"
        aria-label="Open sharing"
        onClick={() => dialog.current?.showModal()}
      >
        <Icon name="share" size={17} />
        <span>Share</span>
      </button>
      <dialog
        ref={dialog}
        className="home-share-dialog panel"
        aria-labelledby="share-title"
      >
        <header>
          <h2 id="share-title">Your progress card</h2>
          <button
            type="button"
            aria-label="Close sharing"
            onClick={() => dialog.current?.close()}
          >
            Close
          </button>
        </header>
        <ShareButton />
      </dialog>
    </>
  );
}
