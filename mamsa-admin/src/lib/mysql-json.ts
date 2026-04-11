/** Serialize values for MySQL JSON columns (mysql2 prepared statements). */
export function toMysqlJson(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return JSON.stringify(value);
}

/** JSON array column (never null — use for NOT NULL JSON defaults). */
export function toMysqlJsonArray(value: unknown): string {
  if (value === undefined || value === null) {
    return '[]';
  }
  return JSON.stringify(value);
}
