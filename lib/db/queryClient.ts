export type DbQueryError = {
  message: string;
};

export type DbQueryResult<T> = {
  data: T | null;
  error: DbQueryError | null;
};

export type DbQueryBuilder = PromiseLike<DbQueryResult<unknown>> & {
  select: (columns?: string) => DbQueryBuilder;
  insert: (values: unknown) => DbQueryBuilder;
  upsert: (values: unknown, options?: unknown) => DbQueryBuilder;
  eq: (column: string, value: unknown) => DbQueryBuilder;
  order: (column: string, options?: unknown) => DbQueryBuilder;
  single: <T = unknown>() => Promise<DbQueryResult<T>>;
};

export type PersistenceClient = {
  from: (table: string) => DbQueryBuilder;
};

export function asPersistenceClient(client: unknown): PersistenceClient | null {
  return client ? (client as PersistenceClient) : null;
}
