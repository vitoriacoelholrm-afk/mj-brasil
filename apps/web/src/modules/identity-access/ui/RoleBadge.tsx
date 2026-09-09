// RoleBadge — reusable presentational badge for a member's role. OWNED by identity-access:
// any app that installs the module drops this in to render roles consistently. Pure + prop-driven
// (no data fetching), uses the automatic JSX runtime so it needs no React import. `Preview` is the
// sample render the Modules dev-hub (and any docs surface) shows.
const STYLES: Record<string, { color: string; border: string; bg: string }> = {
  admin: { color: '#fca5a5', border: 'rgba(248,113,113,.45)', bg: 'rgba(248,113,113,.1)' },
  member: { color: '#7dd3fc', border: 'rgba(125,211,252,.45)', bg: 'rgba(125,211,252,.1)' },
  viewer: { color: '#94a3b8', border: '#475569', bg: 'rgba(148,163,184,.08)' },
};

export function RoleBadge({ role }: { role: string }) {
  const s = STYLES[role] ?? STYLES.viewer;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 20, padding: '1px 9px', textTransform: 'capitalize' }}>
      {role}
    </span>
  );
}

export function Preview() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <RoleBadge role="admin" />
      <RoleBadge role="member" />
      <RoleBadge role="viewer" />
    </div>
  );
}
