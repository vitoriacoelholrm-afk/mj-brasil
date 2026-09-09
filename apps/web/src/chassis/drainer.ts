// The drainer glue (_chassis.md §1.4): wraps drainOutbox with a Web Locks singleton (no double-drain
// across tabs) and the three triggers — `online`, `visibilitychange`, and a 30s interval. The core
// drain logic + conflict handling live in outbox.ts; this is the thin browser wiring around it.
import { drainOutbox, type OutboxDb, type DrainDeps, type DrainSummary } from './outbox';

export interface DrainerOptions {
  intervalMs?: number; // _chassis.md config drainInterval (default 30s)
  onDrain?: (s: DrainSummary) => void;
}

/** Start the drainer. Returns a stop() that removes listeners + the interval. */
export function startDrainer(db: OutboxDb, deps: DrainDeps, opts: DrainerOptions = {}): () => void {
  const intervalMs = opts.intervalMs ?? 30_000;
  let stopped = false;

  const runOnce = async () => {
    if (stopped || !navigator.onLine) return;
    // Web Locks: only one tab drains at a time (ifAvailable → skip if another holds it).
    const locks = (navigator as Navigator & { locks?: LockManager }).locks;
    const drain = async () => { const s = await drainOutbox(db, deps); opts.onDrain?.(s); };
    if (locks?.request) {
      await locks.request('mj-brasil-outbox-drain', { ifAvailable: true }, async (lock) => { if (lock) await drain(); });
    } else {
      await drain(); // no Web Locks (older Safari) → best-effort single tab
    }
  };

  const onOnline = () => void runOnce();
  const onVisible = () => { if (document.visibilityState === 'visible') void runOnce(); };
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  const timer = window.setInterval(() => void runOnce(), intervalMs);
  void runOnce(); // drain anything queued from a previous session on startup

  return () => {
    stopped = true;
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    window.clearInterval(timer);
  };
}
