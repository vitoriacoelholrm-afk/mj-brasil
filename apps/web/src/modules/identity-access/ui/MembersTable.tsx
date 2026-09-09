// MembersTable — reusable presentational table of org members. OWNED by identity-access;
// composes RoleBadge (a module's components compose each other). Pure: takes rows as props, so
// any app feeds it from its own resolveContext/listMembers data and styles around it.
import { RoleBadge } from './RoleBadge';

export interface MemberRow {
  name: string;
  email?: string;
  role: string;
  status?: 'active' | 'invited' | 'inactive';
}

const STATUS_COLOR: Record<string, string> = { active: '#34d399', invited: '#fbbf24', inactive: '#64748b' };
const cell = { padding: '7px 10px', borderBottom: '1px solid rgba(51,65,85,.5)' };

export function MembersTable({ members }: { members: MemberRow[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr>
          {['Member', 'Role', 'Status'].map((h) => (
            <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #334155' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {members.map((m, i) => (
          <tr key={i}>
            <td style={cell}>
              <div style={{ color: '#e2e8f0' }}>{m.name}</div>
              {m.email && <div style={{ color: '#64748b', fontSize: 11 }}>{m.email}</div>}
            </td>
            <td style={cell}><RoleBadge role={m.role} /></td>
            <td style={{ ...cell, color: STATUS_COLOR[m.status ?? 'active'], fontSize: 12 }}>● {m.status ?? 'active'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Preview() {
  return (
    <MembersTable
      members={[
        { name: 'Ada Lovelace', email: 'ada@rondo.co', role: 'admin', status: 'active' },
        { name: 'Alan Turing', email: 'alan@rondo.co', role: 'member', status: 'active' },
        { name: 'Grace Hopper', email: 'grace@rondo.co', role: 'viewer', status: 'invited' },
      ]}
    />
  );
}
