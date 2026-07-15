export const PICCADILLY_CIRCUS_CONTEXT_SUPPLEMENT_ID = "piccadillyCircusContext";
export const WATERLOO_BRIDGE_CONTEXT_SUPPLEMENT_ID = "waterlooBridgeContext";
export const KINGS_CROSS_EUSTON_CONTEXT_SUPPLEMENT_ID = "kingsCrossEustonContext";
export const ONE_WAY_SYSTEM_AREA_CONTEXT_SUPPLEMENT_ID = "oneWaySystemAreaContext";
export const QUIET_RESIDENTIAL_ROADS_CONTEXT_SUPPLEMENT_ID = "quietResidentialRoadsContext";

export type CuratedRealLondonContextSupplementId =
  | typeof PICCADILLY_CIRCUS_CONTEXT_SUPPLEMENT_ID
  | typeof WATERLOO_BRIDGE_CONTEXT_SUPPLEMENT_ID
  | typeof KINGS_CROSS_EUSTON_CONTEXT_SUPPLEMENT_ID
  | typeof ONE_WAY_SYSTEM_AREA_CONTEXT_SUPPLEMENT_ID
  | typeof QUIET_RESIDENTIAL_ROADS_CONTEXT_SUPPLEMENT_ID;

export function mergeCuratedRealLondonContextFixture(routeFixture: unknown, ...contextFixtures: unknown[]): unknown {
  const routeElements = overpassElements(routeFixture);

  if (!routeElements) {
    return routeFixture;
  }

  const elementsByKey = new Map<string, unknown>();
  for (const element of routeElements) {
    const key = overpassElementKey(element);
    if (key) elementsByKey.set(key, element);
  }

  for (const contextFixture of contextFixtures) {
    const contextElements = overpassElements(contextFixture) ?? [];
    for (const element of contextElements) {
      const key = overpassElementKey(element);
      if (key) elementsByKey.set(key, element);
    }
  }

  return {
    ...(typeof routeFixture === "object" && routeFixture !== null ? routeFixture : {}),
    elements: Array.from(elementsByKey.values())
  };
}

export async function loadCuratedRealLondonContextSupplement(supplementId: string): Promise<unknown> {
  if (!isCuratedRealLondonContextSupplementId(supplementId)) {
    throw new Error(`Unknown Real London context supplement ${supplementId}`);
  }

  const response = await fetch(`/api/dev/route-runner/context-supplement?id=${encodeURIComponent(supplementId)}`, {
    credentials: "same-origin"
  });

  if (!response.ok) {
    throw new Error(`Unable to load Real London context supplement ${supplementId}: ${response.status}`);
  }

  return response.json();
}

export function isCuratedRealLondonContextSupplementId(
  supplementId: string
): supplementId is CuratedRealLondonContextSupplementId {
  return (
    supplementId === PICCADILLY_CIRCUS_CONTEXT_SUPPLEMENT_ID ||
    supplementId === WATERLOO_BRIDGE_CONTEXT_SUPPLEMENT_ID ||
    supplementId === KINGS_CROSS_EUSTON_CONTEXT_SUPPLEMENT_ID ||
    supplementId === ONE_WAY_SYSTEM_AREA_CONTEXT_SUPPLEMENT_ID ||
    supplementId === QUIET_RESIDENTIAL_ROADS_CONTEXT_SUPPLEMENT_ID
  );
}

function overpassElements(fixture: unknown): unknown[] | null {
  if (
    typeof fixture !== "object" ||
    fixture === null ||
    !("elements" in fixture) ||
    !Array.isArray((fixture as { elements?: unknown }).elements)
  ) {
    return null;
  }

  return (fixture as { elements: unknown[] }).elements;
}

function overpassElementKey(element: unknown): string | null {
  if (
    typeof element !== "object" ||
    element === null ||
    !("type" in element) ||
    !("id" in element) ||
    typeof (element as { type?: unknown }).type !== "string" ||
    typeof (element as { id?: unknown }).id !== "number"
  ) {
    return null;
  }

  const { type, id } = element as { type: string; id: number };
  return `${type}:${id}`;
}
