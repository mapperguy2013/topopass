export type MapboxPublicEnv = Record<string, string | undefined>;

export const publicMapboxConfig = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? ""
};

function normalizeMapboxPublicConfig(accessToken: string | undefined) {
  const normalizedAccessToken = accessToken?.trim() ?? "";

  if (!normalizedAccessToken) {
    return null;
  }

  return {
    accessToken: normalizedAccessToken
  };
}

export function getMapboxPublicConfig(env?: MapboxPublicEnv) {
  if (env) {
    return normalizeMapboxPublicConfig(env.NEXT_PUBLIC_MAPBOX_TOKEN);
  }

  return normalizeMapboxPublicConfig(publicMapboxConfig.accessToken);
}

export function hasMapboxPublicConfig(env?: MapboxPublicEnv) {
  return Boolean(getMapboxPublicConfig(env));
}
