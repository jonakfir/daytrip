/**
 * Universal Postgres client.
 *
 * Production / Vercel:   uses @vercel/postgres (Neon HTTP driver) so that
 *                        serverless function cold starts stay fast.
 * Local dev / Playwright: uses `pg` over plain TCP so that a developer
 *                        or CI can point POSTGRES_URL at a local
 *                        Postgres instance without a Neon WebSocket
 *                        proxy. Triggered when POSTGRES_URL's host is
 *                        localhost / 127.0.0.1 / starts with postgres://.
 *
 * Both paths expose the same `sql` tagged-template API as
 * @vercel/postgres so call sites don't change.
 */

import type { QueryResult, QueryResultRow } from "pg";

type SqlTag = <T extends QueryResultRow = QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<QueryResult<T>>;

function isLocalPostgres(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1"
    );
  } catch {
    return false;
  }
}

const url =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

type LazySql = { sql: SqlTag };

let lazy: LazySql | null = null;

async function init(): Promise<LazySql> {
  if (lazy) return lazy;

  if (isLocalPostgres(url)) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url });
    const sql: SqlTag = async <T extends QueryResultRow = QueryResultRow>(
      strings: TemplateStringsArray,
      ...values: unknown[]
    ): Promise<QueryResult<T>> => {
      // Build a $1, $2 parameterised query from the template.
      let text = "";
      for (let i = 0; i < strings.length; i++) {
        text += strings[i];
        if (i < values.length) text += `$${i + 1}`;
      }
      return pool.query<T>(text, values as unknown[]);
    };
    lazy = { sql };
    return lazy;
  }

  // Vercel Postgres (Neon HTTP)
  const mod = await import("@vercel/postgres");
  lazy = { sql: mod.sql as unknown as SqlTag };
  return lazy;
}

export const sql: SqlTag = async (strings, ...values) => {
  const { sql: s } = await init();
  return s(strings, ...values);
};
