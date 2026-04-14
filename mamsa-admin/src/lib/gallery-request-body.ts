/** Parse tags from admin JSON body (comma string or array). */
export function parseTagsBody(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}
