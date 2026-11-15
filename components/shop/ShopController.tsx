"use client";
// Connects Jay's ShopScreen to real data. Replaces <DemoShop /> on the Shop route once Jay and Daren agree.
// Balance, inventory and equipped items come from the server; buy/equip await it and never award or spend
// coins locally. Owner: @joshuatsou123 (pending board confirmation).
import { useCallback, useEffect, useState } from "react";
import { ShopScreen, demoShopItems } from "../ui/shop-screen";
import { buyItem, loadShop, type ShopState } from "../../lib/shop";
import { RequireProfile } from "../auth";
import { onProfileUpdated } from "../../lib/settings";

// Signed-out or not-yet-onboarded visitors are sent to /onboarding before any shop data is requested.
export default function ShopController() {
  return (
    <RequireProfile>
      <ShopView />
    </RequireProfile>
  );
}

function ShopView() {
  const [state, setState] = useState<ShopState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      loadShop(demoShopItems)
        .then((s) => { setState(s); setError(null); })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Couldn't open the shop. Try again.")),
    [],
  );
  useEffect(() => { void load(); }, [load]);
  useEffect(() => onProfileUpdated(() => { void load(); }), [load]);

  if (!state) {
    return (
      <main>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button type="button" onClick={() => void load()}>Try again</button>
          </>
        ) : (
          <p role="status">Opening the shop…</p>
        )}
      </main>
    );
  }

  return (
    <ShopScreen
      avatar={state.avatar}
      balance={state.balance}
      owned={state.owned}
      equipped={state.equipped}
      items={state.items}
      // The price argument is display-only: the server charges its own price.
      onBuy={async (id) => {
        const balance = await buyItem(id);
        setState((s) => (s ? { ...s, balance, owned: s.owned.includes(id) ? s.owned : [...s.owned, id] } : s));
      }}

    />
  );
}
