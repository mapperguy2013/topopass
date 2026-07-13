import {
  CENTRAL_LONDON_LAZY_LOAD_ID,
  KINGS_CROSS_EUSTON_LAZY_LOAD_ID,
  VICTORIA_WESTMINSTER_VAUXHALL_LAZY_LOAD_ID
} from "./curatedRealLondonLazyIds.ts";
import type { RouteRunnerMapOption } from "./routeRunnerMapOptionUtils.ts";

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

  if (lazyLoadId === VICTORIA_WESTMINSTER_VAUXHALL_LAZY_LOAD_ID) {
    const loadedMapOptionModule = await import("./curatedVictoriaWestminsterVauxhallRouteRunnerMap");

    return loadedMapOptionModule.victoriaWestminsterVauxhallOsmRouteRunnerMapOption;
  }

  throw new Error(`Unknown lazy route-runner map option ${lazyLoadId}.`);
}
