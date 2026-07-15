import { useEffect, useState } from "react";

export function useMinimumDuration(ready: boolean, minMs = 1600): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), minMs);
    return () => clearTimeout(timer);
  }, [minMs]);

  return ready && elapsed;
}
