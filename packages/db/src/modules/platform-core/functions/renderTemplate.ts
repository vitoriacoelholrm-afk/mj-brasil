// Function: renderTemplate (public) — pure template rendering.
// Substitutes {{var}} placeholders; throws on a missing required variable so a
// half-rendered notification never goes out. Pure → pinned by the contract test.

export interface RenderResult {
  text: string;
  missing: string[];
}

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

/** Render a template body against vars. `strict` throws if any placeholder is unfilled. */
export function renderTemplate(body: string, vars: Record<string, string>, strict = true): RenderResult {
  const missing: string[] = [];
  const text = body.replace(PLACEHOLDER, (_m, key: string) => {
    if (key in vars) return vars[key]!;
    missing.push(key);
    return `{{${key}}}`;
  });
  if (strict && missing.length > 0) {
    throw new Error(`renderTemplate: missing variables: ${[...new Set(missing)].join(', ')}`);
  }
  return { text, missing: [...new Set(missing)] };
}
