"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatedLogo } from "@/components/brand/animated-logo";
import { hasAppIntroShown, markAppIntroShown } from "@/lib/app-intro";

const INTRO_DURATION = 2600;

export function AppLaunchGate({ children }: { children: ReactNode }) {
  const [showIntro, setShowIntro] = useState(() => !hasAppIntroShown());

  useEffect(() => {
    if (!showIntro) return;
    const timer = setTimeout(() => {
      markAppIntroShown();
      setShowIntro(false);
    }, INTRO_DURATION);
    return () => clearTimeout(timer);
  }, [showIntro]);

  if (showIntro) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <AnimatedLogo
          messages={["Welcome to T-Cooperative", "Preparing your experience"]}
        />
      </div>
    );
  }

  return <>{children}</>;
}
