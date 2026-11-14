"use client";

import { useState } from "react";
import { DemoProvider } from "../demo-context";
import { DemoHome } from "../home-screen";
import { DemoCommunity } from "../community-screen";
import { DemoShop } from "../shop-screen";
import { ScanView } from "@/components/scan/scan-view";

// Test-only presentation data; the browser runner creates and removes its route.
export default function PresentationFixture() {
  const [screen, setScreen] = useState("Home");
  const route = screen === "Community" ? "community" : screen.toLowerCase();
  return (
    <DemoProvider>
      <div className={`dig-app compact-app route-${route}`}>
        <div className="app-main">
          {screen === "Home" ? (
            <DemoHome />
          ) : screen === "Community" ? (
            <DemoCommunity />
          ) : screen === "Shop" ? (
            <DemoShop />
          ) : (
            <ScanView
              status="ready"
              onFile={() => {}}
              onManual={() => {}}
              onRetry={() => {}}
            />
          )}
        </div>
        <div className="bottom-nav">
          <div className="nav-inner">
            {["Home", "Scan", "Community", "Shop"].map((name) => (
              <button
                key={name}
                className="nav-tab"
                onClick={() => setScreen(name)}
              >
                Preview {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DemoProvider>
  );
}
