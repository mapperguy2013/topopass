import type {
  QuestionDifficulty,
  QuestionStatus,
  QuestionType
} from "../db/types.ts";

export type QuestionSource = "static" | "supabase";

export type QuestionCoordinates = {
  lat: number;
  lng: number;
};

export type QuestionMapBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type QuestionMetadata = {
  id: string;
  type: QuestionType;
  prompt: string;
  difficulty: QuestionDifficulty;
  category: string;
  status: QuestionStatus;
  explanation?: string;
  tip?: string;
  sourceNote?: string;
  tags: string[];
};

export type KnowledgeQuestionPayload = {
  options: string[];
  correctAnswer: string;
  incorrectExplanations?: Record<string, string>;
};

export type MapClickQuestionPayload = {
  targetName: string;
  answer: QuestionCoordinates;
  toleranceMeters: number;
  acceptedAreaDescription?: string;
};

export type RouteDrawingQuestionPayload = {
  title: string;
  fromLabel: string;
  toLabel: string;
  from: QuestionCoordinates;
  to: QuestionCoordinates;
  acceptedRoute?: {
    geometry: [number, number][];
    source: "osrm" | "manual" | "stored";
    coordinateSystem: "map";
    reviewed: boolean;
  };
  mapArea: string;
  mapBounds: QuestionMapBounds;
  idealRouteDescription?: string;
};

export type PersistedQuestion =
  | (QuestionMetadata & {
      type: "knowledge";
      payload: KnowledgeQuestionPayload;
    })
  | (QuestionMetadata & {
      type: "map-click";
      payload: MapClickQuestionPayload;
    })
  | (QuestionMetadata & {
      type: "route-drawing";
      payload: RouteDrawingQuestionPayload;
    });
