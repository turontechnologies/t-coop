"use client";

import { useEffect, useRef } from "react";
import { AnimatedLogo } from "@/components/brand/animated-logo";

interface RouteTransitionProps {
  messages?: string[];
  duration?: number;
  onComplete: () => void;
}

export function RouteTransition({
  messages,
  duration = 1300,
  onComplete,
}: RouteTransitionProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => onCompleteRef.current(), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background bg-[radial-gradient(60%_50%_at_50%_45%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent)]">
      <AnimatedLogo messages={messages} />
    </div>
  );
}
