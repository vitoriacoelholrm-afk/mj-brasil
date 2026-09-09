// <SyncStatusChip> — the trust indicator, always visible: Online · Offline · N queued ·
// Syncing… · M rejected. Tap → a dialog listing the outbox per command (status + last error).
// The colored dot carries the state at a glance; the live region announces transitions.
// Chassis UI = neutral English (docs/CONVENTIONS.md); localize at the app/module layer if needed.
import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useOutbox } from './useOutbox';

type Tone = 'ok' | 'warn' | 'danger' | 'sky';

// The dot carries the state; the pill itself stays quiet (hairline + ink).
const DOT: Record<Tone, string> = {
  ok: 'bg-[hsl(var(--ok))]',
  warn: 'bg-[hsl(var(--warn))]',
  danger: 'bg-destructive',
  sky: 'bg-primary',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Queued', inflight: 'Sending', done: 'Synced', failed: 'Retrying', rejected: 'Rejected',
};
const STATUS_TONE: Record<string, Tone> = {
  pending: 'warn', inflight: 'sky', done: 'ok', failed: 'warn', rejected: 'danger',
};

export function SyncStatusChip() {
  const { commands, pending, inflight, rejected, online } = useOutbox();
  const [open, setOpen] = useState(false);
  const queued = pending + inflight;

  let label: string, tone: Tone, syncing = false;
  if (!online) { label = queued ? `Offline · ${queued}` : 'Offline'; tone = 'warn'; }
  else if (inflight) { label = 'Syncing…'; tone = 'sky'; syncing = true; }
  else if (rejected) { label = `${rejected} rejected`; tone = 'danger'; }
  else if (pending) { label = `${pending} queued`; tone = 'warn'; }
  else { label = 'Online'; tone = 'ok'; }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50"
            aria-label={`Sync status: ${label}`}
          >
            <span className={cn('size-1.5 rounded-full', DOT[tone], syncing && 'animate-pulse')} />
            {label}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsynced changes</DialogTitle>
          </DialogHeader>
          {commands.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-[hsl(var(--ok)/0.12)] text-[hsl(var(--ok))]">
                <CheckCheck className="size-5" />
              </span>
              <p className="font-medium">All synced</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                No pending changes. Everything is up to date.
              </p>
            </div>
          ) : (
            <ul className="-mx-1 max-h-[60vh] space-y-1 overflow-y-auto">
              {commands.map((c) => {
                const t = STATUS_TONE[c.status] ?? 'warn';
                return (
                  <li key={c.id} className="flex items-start gap-3 rounded-lg px-1 py-2">
                    <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', DOT[t])} />
                    <div className="min-w-0 flex-1">
                      <code className="block truncate font-mono text-xs text-foreground">{c.type}</code>
                      <p className="truncate text-xs text-muted-foreground" title={c.lastError ?? undefined}>
                        {STATUS_LABEL[c.status] ?? c.status}
                        {c.attempts ? ` · attempt ${c.attempts}` : ''}
                        {c.lastError ? ` · ${c.lastError}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Announce status transitions (offline / rejected / synced) to assistive tech. */}
      <span className="sr-only" role={tone === 'danger' ? 'alert' : 'status'}
        aria-live={tone === 'danger' ? 'assertive' : 'polite'}>{label}</span>
    </>
  );
}
