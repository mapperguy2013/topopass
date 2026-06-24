import { acceptedRoutePointsById } from "./maps/kings-cross-euston/routeGraph.ts";

export type RouteQuestionStatus = "draft" | "active" | "archived";

export type RouteQuestionDifficulty = "easy" | "medium" | "hard";

export type RouteMapBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type RouteQuestion = {
  id: string;
  title: string;
  prompt: string;
  mapPageId?: string;
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
  mapArea: string;
  mapBounds: RouteMapBounds;
  difficulty: RouteQuestionDifficulty;
  status: RouteQuestionStatus;
  tags: string[];
  explanation?: string;
  tip?: string;
  idealRouteDescription?: string;
  createdAt: string;
  updatedAt: string;
};

const KINGS_CROSS_EUSTON_MAP = "kings-cross-euston";
const KINGS_CROSS_EUSTON_BOUNDS: RouteMapBounds = {
  minX: 0,
  minY: 0,
  maxX: 1600,
  maxY: 1000
};
const INITIAL_CONTENT_DATE = "2026-06-23T00:00:00.000Z";

const sharedQuestionMetadata = {
  mapArea: KINGS_CROSS_EUSTON_MAP,
  mapBounds: KINGS_CROSS_EUSTON_BOUNDS,
  status: "active" as const,
  tags: ["Route planning", "London geography"],
  explanation:
    "Compare your route with the accepted journey and review the start, destination, coverage, and off-route feedback.",
  tip:
    "Plan from the endpoints first, then choose clear connecting roads before drawing.",
  createdAt: INITIAL_CONTENT_DATE,
  updatedAt: INITIAL_CONTENT_DATE
};

function storedMapRoute(
  routeId: string,
  options: { reverse?: boolean } = {}
): RouteQuestion["acceptedRoute"] {
  const points = acceptedRoutePointsById[routeId];

  if (!points) {
    throw new Error(`Stored accepted route not found: ${routeId}`);
  }

  const routePoints = options.reverse ? [...points].reverse() : points;

  return {
    geometry: routePoints.map(({ x, y }) => [x, y]),
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
    ...sharedQuestionMetadata,
    idealRouteDescription:
      "Use the direct westbound road pattern between King's Cross St Pancras and Euston, avoiding unnecessary detours north or south.",
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
    ...sharedQuestionMetadata,
    idealRouteDescription:
      "Work west from Russell Square toward the Tottenham Court Road and Warren Street area using a continuous, direct route.",
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
    ...sharedQuestionMetadata,
    idealRouteDescription:
      "Connect Goodge Street to Angel with a clear north-east route, keeping the journey continuous and avoiding long loops.",
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
    ...sharedQuestionMetadata,
    idealRouteDescription:
      "Head south-east from Euston toward Holborn using connected main/local streets without overshooting the destination.",
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
    ...sharedQuestionMetadata,
    idealRouteDescription:
      "Plan a westbound route from King's Cross toward Oxford Circus, balancing directness with readable road connections.",
    difficulty: "hard"
  },
  {
    id: "route-euston-to-kings-cross",
    title: "Euston to King's Cross",
    prompt:
      "Begin at Euston and draw continuously along the visible roads to King's Cross St Pancras.",
    fromLabel: "Euston",
    toLabel: "King's Cross St Pancras",
    from: { lat: 51.5282865, lng: -0.1338745 },
    to: { lat: 51.530609, lng: -0.1239491 },
    acceptedRoute: storedMapRoute("kings-cross-to-euston", { reverse: true }),
    ...sharedQuestionMetadata,
    idealRouteDescription:
      "Use the direct eastbound road pattern from Euston toward King's Cross St Pancras, keeping the route continuous.",
    difficulty: "easy"
  },
  {
    id: "route-warren-street-to-russell-square",
    title: "Warren Street to Russell Square",
    prompt:
      "Begin at Warren Street and draw continuously along the visible roads to Russell Square.",
    fromLabel: "Warren Street",
    toLabel: "Russell Square",
    from: { lat: 51.5247178, lng: -0.1385303 },
    to: { lat: 51.5230529, lng: -0.1242529 },
    acceptedRoute: storedMapRoute("russell-square-to-warren-street", {
      reverse: true
    }),
    ...sharedQuestionMetadata,
    idealRouteDescription:
      "Work east from Warren Street toward Russell Square using connected streets without drifting too far north or south.",
    difficulty: "medium"
  },
  {
    id: "route-angel-to-goodge-street",
    title: "Angel to Goodge Street",
    prompt:
      "Begin at Angel and draw continuously along the visible roads to Goodge Street.",
    fromLabel: "Angel",
    toLabel: "Goodge Street",
    from: { lat: 51.5324874, lng: -0.1060356 },
    to: { lat: 51.5205978, lng: -0.1343573 },
    acceptedRoute: storedMapRoute("goodge-street-to-angel", { reverse: true }),
    ...sharedQuestionMetadata,
    idealRouteDescription:
      "Plan a south-west route from Angel toward Goodge Street, keeping to the accepted road sequence without long loops.",
    difficulty: "hard"
  },
  {
    id: "route-holborn-to-euston",
    title: "Holborn to Euston",
    prompt:
      "Begin at Holborn and draw continuously along the visible roads to Euston.",
    fromLabel: "Holborn",
    toLabel: "Euston",
    from: { lat: 51.5171149, lng: -0.1200657 },
    to: { lat: 51.5282865, lng: -0.1338745 },
    acceptedRoute: storedMapRoute("euston-to-holborn", { reverse: true }),
    ...sharedQuestionMetadata,
    idealRouteDescription:
      "Move north-west from Holborn toward Euston using a continuous route through the Bloomsbury street pattern.",
    difficulty: "hard"
  },
  {
    id: "route-oxford-circus-to-kings-cross",
    title: "Oxford Circus to King's Cross",
    prompt:
      "Begin at Oxford Circus and draw continuously along the visible roads to King's Cross St Pancras.",
    fromLabel: "Oxford Circus",
    toLabel: "King's Cross St Pancras",
    from: { lat: 51.5162, lng: -0.1419 },
    to: { lat: 51.530609, lng: -0.1239491 },
    acceptedRoute: storedMapRoute("kings-cross-to-oxford-circus", {
      reverse: true
    }),
    ...sharedQuestionMetadata,
    idealRouteDescription:
      "Plan an eastbound route from Oxford Circus toward King's Cross, using readable road links and avoiding unnecessary detours.",
    difficulty: "hard"
  }
];

export function getRouteQuestions() {
  return routeQuestions;
}

export function getActiveRouteQuestions() {
  return routeQuestions.filter((question) => question.status === "active");
}

export function getRouteQuestionById(id: string) {
  return routeQuestions.find((question) => question.id === id);
}

export function getRouteQuestionsByMapArea(area: string) {
  return routeQuestions.filter((question) => question.mapArea === area);
}
