export type LinkPair = { key: string; value: string };

export function profileLinksToPairs(raw: unknown): LinkPair[] {
  if (raw == null) return [{ key: '', value: '' }];
  if (typeof raw === 'string') {
    try {
      const o = JSON.parse(raw) as Record<string, unknown>;
      return objectToPairs(o);
    } catch {
      return [{ key: '', value: '' }];
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return objectToPairs(raw as Record<string, unknown>);
  }
  return [{ key: '', value: '' }];
}

function objectToPairs(o: Record<string, unknown>): LinkPair[] {
  const entries = Object.entries(o).filter(([k]) => k.trim());
  if (entries.length === 0) return [{ key: '', value: '' }];
  return entries.map(([key, value]) => ({ key, value: value == null ? '' : String(value) }));
}

export function pairsToProfileLinks(pairs: LinkPair[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, value } of pairs) {
    const k = key.trim();
    if (!k) continue;
    out[k] = value.trim();
  }
  return out;
}
