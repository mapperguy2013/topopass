import {
  CENTRAL_LONDON_LAZY_LOAD_ID,
  KINGS_CROSS_EUSTON_LAZY_LOAD_ID
} from "./curatedRealLondonRouteRunnerMaps.ts";
import type { RouteRunnerMapOption } from "./routeRunnerMaps.ts";

export function routeRunnerMapOptionNeedsLazyLoad(option: RouteRunnerMapOption): boolean {
  return Boolean(option.lazyLoadId);
}

export async function loadLazyRouteRunnerMapOption(lazyLoadId: string): Promise<RouteRunnerMapOption> {
  if (lazyLoadId === KINGS_CROSS_EUSTON_LAZY_LOAD_ID) {
    const loadedMapOptionModule = await import("./curatedKingsCrossEustonRouteRunnerMap");

    return loadedMapOptionModule.kingsCrossEustonOsmRouteRunnerMapOption;
  }

  if (lazyLoadId === CENTRAL_LONDON_LAZY_LOAD_ID) {
    const loadedMapOptionModule = await import("./curatedCentralLondonRouteRunnerMap");

    return loadedMapOptionModule.centralLondonOsmRouteRunnerMapOption;
  }

  throw new Error(`Unknown lazy route-runner map option ${lazyLoadId}.`);
}
