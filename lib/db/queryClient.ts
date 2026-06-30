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
  update: (values: unknown) => DbQueryBuilder;
  eq: (column: string, value: unknown) => DbQueryBuilder;
  is: (column: string, value: unknown) => DbQueryBuilder;
  order: (column: string, options?: unknown) => DbQueryBuilder;
  limit: (count: number) => DbQueryBuilder;
  single: <T = unknown>() => Promise<DbQueryResult<T>>;
};

export type PersistenceClient = {
  from: (table: string) => DbQueryBuilder;
};

export type AuthenticatedPersistenceClient = PersistenceClient & {
  auth?: {
    getUser?: () => Promise<{
      data?: {
        user?: {
          id?: string;
        } | null;
      };
      error?: {
        message?: string;
      } | null;
    }>;
  };
};

export function asPersistenceClient(client: unknown): PersistenceClient | null {
  return client ? (client as PersistenceClient) : null;
}

export async function authenticatedUserId(
  client: PersistenceClient,
  fallbackUserId: string
) {
  const authClient = client as AuthenticatedPersistenceClient;

  if (!authClient.auth?.getUser) {
    return fallbackUserId;
  }

  const {
    data: { user } = {}
  } = await authClient.auth.getUser();

  return user?.id ?? null;
}
