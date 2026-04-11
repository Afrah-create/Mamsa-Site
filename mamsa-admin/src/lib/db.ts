import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader, ExecuteValues } from 'mysql2';

/**
 * DATABASE_URL must be a MySQL URI for mysql2 createPool(), e.g.
 * mysql://USER:PASSWORD@HOST:PORT/DATABASE
 * (empty password: mysql://root:@localhost:3306/dbname)
 * Use URL-encoded credentials if they contain special characters.
 */
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL. Set DATABASE_URL in your environment before starting the app.');
}

const pool = mysql.createPool(databaseUrl);

type SqlTaggedValue = unknown;

function flatten(
  strings: TemplateStringsArray,
  values: readonly SqlTaggedValue[],
): { query: string; params: unknown[] } {
  let query = '';
  const params: unknown[] = [];

  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    if (i < values.length) {
      const v = values[i];
      if (v instanceof SqlTagged) {
        const inner = flatten(v.strings, v.values);
        query += inner.query;
        params.push(...inner.params);
      } else {
        query += '?';
        params.push(v);
      }
    }
  }

  return { query, params };
}

/** Run INSERT; returns auto-increment id from the driver (safe with connection pool). */
export async function insertAndGetId(
  strings: TemplateStringsArray,
  ...values: SqlTaggedValue[]
): Promise<number> {
  const { query, params } = flatten(strings, values);
  const [result] = await pool.execute(query, params as ExecuteValues[]);
  return (result as ResultSetHeader).insertId;
}

class SqlTagged<T = RowDataPacket[] | ResultSetHeader> implements PromiseLike<T> {
  constructor(
    readonly strings: TemplateStringsArray,
    readonly values: readonly SqlTaggedValue[],
  ) {}

  private toPromise(): Promise<T> {
    const { query, params } = flatten(this.strings, this.values);
    return pool.execute(query, params as ExecuteValues[]).then(([rows]) => rows as T);
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.toPromise().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult> {
    return this.toPromise().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<T> {
    return this.toPromise().finally(onfinally ?? undefined);
  }
}

type SqlFn = <T = RowDataPacket[]>(
  strings: TemplateStringsArray,
  ...values: SqlTaggedValue[]
) => SqlTagged<T>;

const sql: SqlFn & { end: (options?: { timeout?: number }) => Promise<void> } = Object.assign(
  function sqlTag<T = RowDataPacket[]>(
    strings: TemplateStringsArray,
    ...values: SqlTaggedValue[]
  ): SqlTagged<T> {
    return new SqlTagged<T>(strings, values);
  },
  {
    end: (_options?: { timeout?: number }) => pool.end(),
  },
);

export default sql;
