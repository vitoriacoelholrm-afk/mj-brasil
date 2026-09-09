// Live outbox state for the UI (SyncStatusChip, the sheet). Dexie liveQuery re-fires on every
// write, so counts + the command list stay current without manual refetch.
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { outboxDb } from './db';
import type { OutboxCommand } from './outbox';

export interface OutboxState {
  commands: OutboxCommand[];
  pending: number;
  inflight: number;
  rejected: number;
  online: boolean;
}

export function useOutbox(): OutboxState {
  const commands = useLiveQuery(
    () => outboxDb.commands.where('status').anyOf('pending', 'inflight', 'rejected').toArray(),
    [], [] as OutboxCommand[],
  );
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return {
    commands,
    pending: commands.filter((c) => c.status === 'pending').length,
    inflight: commands.filter((c) => c.status === 'inflight').length,
    rejected: commands.filter((c) => c.status === 'rejected').length,
    online,
  };
}
