export type RouteMapPoint = {
  x: number;
  y: number;
};

export type RouteNode = RouteMapPoint & {
  id: string;
  label: string;
};

export type RouteEdge = {
  id: string;
  from: string;
  to: string;
  name: string;
  oneWay: boolean;
  restricted?: boolean;
};

export type RouteGraph = {
  mapId: string;
  mapWidth: number;
  mapHeight: number;
  nodes: RouteNode[];
  edges: RouteEdge[];
};

export type DrawRouteQuestion = {
  id: string;
  type: "draw-route";
  mapId: string;
  prompt: string;
  startNodeId: string;
  endNodeId: string;
  acceptedRoutes: string[][];
};
