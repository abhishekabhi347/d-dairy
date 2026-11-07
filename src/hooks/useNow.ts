import { useEffect, useState } from 'react';

/**
 * A shared clock for friendly dates and streaks. Initialising through a state
 * initializer keeps render pure while still giving the first paint a real time.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
