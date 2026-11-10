"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  className?: string;
  messages?: string[];
}

const MARK =
  "M21.0465 42.0457L0.495117 21.0676L21.0595 0.496094L41.9122 21.2513L21.0465 42.0457Z";

const DEFAULT_MESSAGES = [
  "Preparing your workspace",
  "Syncing your co-operative",
  "Securing your session",
];

const EASE = [0.16, 1, 0.3, 1] as const;

/** The branded loading moment: the logo mark in a glass tile, a progress ring sweeping around
 * it, and short status lines that cross-fade. Used by the launch intro and route transitions. */
export function AnimatedLogo({
  className,
  messages = DEFAULT_MESSAGES,
}: AnimatedLogoProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setMessageIndex((index) => (index + 1) % messages.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <motion.div
      role="status"
      aria-label={messages[messageIndex]}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn("flex flex-col items-center gap-7", className)}
    >
      <div className="relative flex size-28 items-center justify-center">
        {/* soft breathing glow */}
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/25 blur-3xl"
          animate={{ opacity: [0.45, 0.9, 0.45], scale: [0.9, 1.08, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />

        {/* progress ring */}
        <svg
          viewBox="0 0 112 112"
          className="absolute inset-0 size-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="56"
            cy="56"
            r="52"
            fill="none"
            strokeWidth="2.5"
            className="stroke-primary/10"
          />
          <motion.circle
            cx="56"
            cy="56"
            r="52"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="stroke-primary dark:stroke-emerald-400"
            initial={{ pathLength: 0.05 }}
            animate={{ pathLength: [0.05, 0.75, 0.05], rotate: [0, 360] }}
            style={{ transformOrigin: "56px 56px" }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>

        {/* glass tile with the mark */}
        <div className="relative flex size-18 items-center justify-center rounded-3xl bg-card/80 shadow-raised ring-1 ring-border/70 backdrop-blur">
          <svg
            viewBox="0 0 42 43"
            fill="none"
            className="size-9 text-primary dark:text-emerald-400"
            aria-hidden="true"
          >
            <motion.path
              d={MARK}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 1], fillOpacity: [0, 0, 0.15] }}
              fill="currentColor"
              transition={{
                duration: 1.6,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          </svg>
        </div>
      </div>

      <div className="relative h-5 w-64 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={messages[messageIndex]}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: EASE }}
            className="absolute inset-x-0 text-sm font-medium text-muted-foreground"
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
