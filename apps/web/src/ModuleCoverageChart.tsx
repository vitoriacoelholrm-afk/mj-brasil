// ModuleCoverageChart — a clean, professional horizontal bar chart
import { useState } from 'react';

export interface CoverageSlice {
  key: string;
  label: string;
  color: string;
  modules: string[];
}

export function ModuleCoverageChart({ slices }: { slices: CoverageSlice[] }) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const nonEmpty = slices.filter((s) => s.modules.length > 0);
  const total = nonEmpty.reduce((sum, s) => sum + s.modules.length, 0);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {nonEmpty.map((slice) => {
          const percentage = (slice.modules.length / total) * 100;
          const isHovered = hoverKey === slice.key;

          return (
            <div
              key={slice.key}
              onMouseEnter={() => setHoverKey(slice.key)}
              onMouseLeave={() => setHoverKey(null)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: slice.color,
                      transition: 'transform 0.2s ease',
                      transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                    }}
                  />
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'hsl(var(--foreground))',
                  }}>
                    {slice.label}
                  </span>
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: slice.color,
                }}>
                  {slice.modules.length}
                </span>
              </div>

              <div
                style={{
                  height: 8,
                  borderRadius: 4,
                  overflow: 'hidden',
                  transition: 'background 0.2s ease',
                  background: isHovered ? 'hsl(var(--muted) / 0.5)' : 'hsl(var(--muted) / 0.3)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: slice.color,
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                    boxShadow: isHovered ? `0 0 8px ${slice.color}40` : 'none',
                  }}
                />
              </div>

              <div style={{
                fontSize: 11,
                color: 'hsl(var(--muted-foreground))',
                marginTop: 4,
              }}>
                {percentage.toFixed(0)}% coverage
              </div>

              {isHovered && slice.modules.length > 0 && (
                <div style={{
                  marginTop: 12,
                  padding: '12px',
                  background: 'hsl(var(--muted) / 0.2)',
                  borderLeft: `3px solid ${slice.color}`,
                  borderRadius: 4,
                  fontSize: 12,
                  color: 'hsl(var(--foreground) / 0.85)',
                  lineHeight: 1.6,
                  animation: 'fadeIn 0.2s ease',
                }}>
                  {slice.modules.map((mod, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {mod}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
