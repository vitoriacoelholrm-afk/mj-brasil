// <OfflineGate> — wraps online-only surfaces (admin, reporting, money) and blocks them with a
// friendly message when there's no connection, instead of letting a query hang. Surfaces that run
// from the offline outbox are NOT gated. Chassis UI = neutral English (docs/CONVENTIONS.md); apps
// that need MX-Spanish localize at the app/module layer.
import { type ReactNode } from 'react';
import { CloudOff } from 'lucide-react';
import { useOutbox } from './useOutbox';

export function OfflineGate({ children, feature }: { children: ReactNode; feature?: string }) {
  const { online } = useOutbox();
  if (online) return <>{children}</>;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <CloudOff className="size-6" />
      </span>
      <h2 className="text-lg font-semibold">Offline</h2>
      <p className="text-sm text-muted-foreground">
        {feature ? `${feature} requires a connection.` : 'This section requires a connection.'} Your
        queued changes are saved and sync automatically when you're back online.
      </p>
    </div>
  );
}
