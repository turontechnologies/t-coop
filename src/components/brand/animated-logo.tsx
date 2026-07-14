"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  className?: string;
  messages?: string[];
}

const PATHS = [
  "M21.0465 42.0457L0.495117 21.0676L21.0595 0.496094L41.9122 21.2513L21.0465 42.0457Z",
  "M21.0989 44.6016L0.495117 24.0039L21.0465 3.07812L41.7026 23.794L21.0989 44.6016Z",
  "M21.152 47.082L0.600586 26.3925L21.152 5.4668L41.4981 26.5007L21.152 47.082Z",
];

const DEFAULT_MESSAGES = [
  "Preparing your workspace",
  "Syncing your co-operative",
  "Securing your session",
];

export function AnimatedLogo({
  className,
  messages = DEFAULT_MESSAGES,
}: AnimatedLogoProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setMessageIndex((index) => (index + 1) % messages.length);
    }, 1900);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div
      role="status"
      aria-label={messages[messageIndex]}
      className={cn("flex flex-col items-center gap-5", className)}
    >
      <div className="relative flex size-24 items-center justify-center">
        <motion.span
          className="absolute size-24 rounded-full bg-primary/20 blur-2xl"
          animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.85, 1.05, 0.85] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />

        <svg
          viewBox="0 0 42 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative size-14 text-primary"
          aria-hidden="true"
        >
          {PATHS.map((d, index) => (
            <motion.path
              key={d}
              d={d}
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.22,
                times: [0, 0.45, 0.75, 1],
              }}
            />
          ))}
        </svg>

        <motion.span
          className="absolute inset-x-3 h-8 rounded-full bg-gradient-to-b from-transparent via-primary/40 to-transparent"
          initial={{ y: -28, opacity: 0 }}
          animate={{ y: [-28, 28], opacity: [0, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      </div>

      <div className="relative h-5 w-56 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={messages[messageIndex]}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-x-0 text-sm font-medium tracking-wide text-muted-foreground"
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <span className="h-0.5 w-24 overflow-hidden rounded-full bg-muted">
        <motion.span
          className="block h-full w-1/3 rounded-full bg-primary"
          animate={{ x: ["-100%", "220%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </span>
    </div>
  );
}
