import { acceptedRoutePointsById } from "@/src/data/maps/kings-cross-euston/routeGraph";

export type RouteQuestion = {
  id: string;
  title: string;
  prompt: string;
  fromLabel: string;
  toLabel: string;
  from: {
    lat: number;
    lng: number;
  };
  to: {
    lat: number;
    lng: number;
  };
  acceptedRoute?: {
    geometry: [number, number][];
    source: "osrm" | "manual" | "stored";
    coordinateSystem: "map";
    reviewed: boolean;
  };
  mapArea?: string;
  difficulty?: "easy" | "medium" | "hard";
};

const KINGS_CROSS_EUSTON_MAP = "kings-cross-euston";

function storedMapRoute(routeId: string): RouteQuestion["acceptedRoute"] {
  const points = acceptedRoutePointsById[routeId];

  if (!points) {
    throw new Error(`Stored accepted route not found: ${routeId}`);
  }

  return {
    geometry: points.map(({ x, y }) => [x, y]),
    source: "stored",
    coordinateSystem: "map",
    reviewed: false
  };
}

export const routeQuestions: RouteQuestion[] = [
  {
    id: "kings-cross-to-euston",
    title: "King's Cross to Euston",
    prompt:
      "Begin at King's Cross St Pancras and draw continuously along the visible roads to Euston.",
    fromLabel: "King's Cross St Pancras",
    toLabel: "Euston",
    from: { lat: 51.530609, lng: -0.1239491 },
    to: { lat: 51.5282865, lng: -0.1338745 },
    acceptedRoute: storedMapRoute("kings-cross-to-euston"),
    mapArea: KINGS_CROSS_EUSTON_MAP,
    difficulty: "easy"
  },
  {
    id: "russell-square-to-warren-street",
    title: "Russell Square to Warren Street",
    prompt:
      "Begin at Russell Square and draw continuously along the visible roads to Warren Street.",
    fromLabel: "Russell Square",
    toLabel: "Warren Street",
    from: { lat: 51.5230529, lng: -0.1242529 },
    to: { lat: 51.5247178, lng: -0.1385303 },
    acceptedRoute: storedMapRoute("russell-square-to-warren-street"),
    mapArea: KINGS_CROSS_EUSTON_MAP,
    difficulty: "medium"
  },
  {
    id: "goodge-street-to-angel",
    title: "Goodge Street to Angel",
    prompt:
      "Begin at Goodge Street and draw continuously along the visible roads to Angel.",
    fromLabel: "Goodge Street",
    toLabel: "Angel",
    from: { lat: 51.5205978, lng: -0.1343573 },
    to: { lat: 51.5324874, lng: -0.1060356 },
    acceptedRoute: storedMapRoute("goodge-street-to-angel"),
    mapArea: KINGS_CROSS_EUSTON_MAP,
    difficulty: "hard"
  },
  {
    id: "euston-to-holborn",
    title: "Euston to Holborn",
    prompt:
      "Begin at Euston and draw continuously along the visible roads to Holborn.",
    fromLabel: "Euston",
    toLabel: "Holborn",
    from: { lat: 51.5282865, lng: -0.1338745 },
    to: { lat: 51.5171149, lng: -0.1200657 },
    acceptedRoute: storedMapRoute("euston-to-holborn"),
    mapArea: KINGS_CROSS_EUSTON_MAP,
    difficulty: "hard"
  },
  {
    id: "kings-cross-to-oxford-circus",
    title: "King's Cross to Oxford Circus",
    prompt:
      "Begin at King's Cross St Pancras and draw continuously along the visible roads to Oxford Circus.",
    fromLabel: "King's Cross St Pancras",
    toLabel: "Oxford Circus",
    from: { lat: 51.530609, lng: -0.1239491 },
    to: { lat: 51.5162, lng: -0.1419 },
    acceptedRoute: storedMapRoute("kings-cross-to-oxford-circus"),
    mapArea: KINGS_CROSS_EUSTON_MAP,
    difficulty: "hard"
  }
];

export function getRouteQuestions() {
  return routeQuestions;
}

export function getRouteQuestionById(id: string) {
  return routeQuestions.find((question) => question.id === id);
}

export function getRouteQuestionsByMapArea(area: string) {
  return routeQuestions.filter((question) => question.mapArea === area);
}
