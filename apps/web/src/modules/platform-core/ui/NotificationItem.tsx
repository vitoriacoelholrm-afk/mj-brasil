// NotificationItem — reusable presentational notification row. OWNED by platform-core (pairs
// with its NotificationTemplate + delivery-log entities). Any app renders alerts consistently
// instead of re-styling toasts per app. Pure + prop-driven; `Preview` is the dev-hub sample.
export interface Notification {
  title: string;
  body?: string;
  kind?: 'info' | 'success' | 'warning';
  at?: string;
}

const KIND: Record<string, { color: string; bg: string; icon: string }> = {
  info: { color: '#7dd3fc', bg: 'rgba(125,211,252,.08)', icon: 'ℹ' },
  success: { color: '#34d399', bg: 'rgba(52,211,153,.08)', icon: '✓' },
  warning: { color: '#fbbf24', bg: 'rgba(245,158,11,.08)', icon: '!' },
};

export function NotificationItem({ notification }: { notification: Notification }) {
  const k = KIND[notification.kind ?? 'info'];
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: k.bg, border: `1px solid ${k.color}33`, borderRadius: 10, padding: '10px 12px' }}>
      <span style={{ color: k.color, fontWeight: 700, lineHeight: 1.4 }}>{k.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{notification.title}</div>
        {notification.body && <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{notification.body}</div>}
      </div>
      {notification.at && <span style={{ color: '#64748b', fontSize: 11 }}>{notification.at}</span>}
    </div>
  );
}

export function Preview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <NotificationItem notification={{ kind: 'success', title: 'Payment received', body: 'Invoice #1042 settled.', at: '2m' }} />
      <NotificationItem notification={{ kind: 'warning', title: 'Trial ending soon', body: '3 days left on the Rondo workspace.', at: '1h' }} />
    </div>
  );
}
