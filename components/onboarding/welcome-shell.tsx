"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icons";

// Presentation wrapper only. OnboardingFlow owns all fields, validation and persistence.
export function WelcomeShell({ children }: { children: ReactNode }) {
  const [started, setStarted] = useState(false);
  return (
    <div className="onboarding-world">
      <header className="onboarding-header">
        <Link href="/" className="brand" aria-label="DIG IN Home">
          <span className="brand-sprout">
            <Icon name="leaf" size={20} />
          </span>
          DIG IN<span className="brand-period">.</span>
        </Link>
        <span className="onboarding-header-note">
          A little adventure, just for you.
        </span>
      </header>
      {started ? (
        <div className="onboarding-content">
          <aside className="onboarding-scene">
            <Image
              src="/dig-in/garden.png"
              alt="A welcoming woodland garden with a friendly sprout creature"
              fill
              sizes="(max-width: 760px) 100vw, 450px"
              priority
            />
            <div>
              <p className="eyebrow">YOUR STORY STARTS SMALL</p>
              <h2>
                A little care.
                <br />A world of possibility.
              </h2>
              <p>There’s no perfect path. Just a little progress, your way.</p>
            </div>
          </aside>
          <div className="onboarding-form-wrap">{children}</div>
        </div>
      ) : (
        <main className="welcome-page">
          <div className="welcome-art">
            <Image
              src="/dig-in/garden.png"
              alt="A sunlit pixel garden with vegetables, flowers, and a smiling sprout creature"
              fill
              sizes="(max-width: 760px) 100vw, 700px"
              priority
            />
            <span className="welcome-art-tag">
              <Icon name="leaf" size={16} /> YOUR LITTLE WORLD IS WAITING
            </span>
          </div>
          <div className="welcome-copy">
            <p className="eyebrow">WELCOME TO DIG IN</p>
            <h1>
              Small steps.
              <br />A world of progress.
            </h1>
            <p>
              Meet your goals, find your rhythm, and grow a little world along
              the way. Every nourishing moment counts.
            </p>
            <button
              className="button button-primary"
              onClick={() => setStarted(true)}
            >
              Start your adventure <Icon name="arrow" size={20} />
            </button>
            <div className="welcome-promises">
              <span>
                <Icon name="leaf" size={15} />
                Your own pace
              </span>
              <span>
                <Icon name="spark" size={15} />
                Little rewards
              </span>
              <span>
                <Icon name="users" size={15} />
                Optional company
              </span>
            </div>
            <Link href="/" className="text-button">
              Explore the UI demo first <Icon name="arrow" size={15} />
            </Link>
            <p className="fine-print">
              A nutrition companion for adults 18 and over.
            </p>
          </div>
        </main>
      )}
      <footer className="onboarding-footer">
        <Icon name="leaf" size={15} /> GROW INTO YOUR OWN LITTLE ADVENTURE
      </footer>
    </div>
  );
}
