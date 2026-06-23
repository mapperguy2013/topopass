import type { RouteQuestion } from "@/src/data/routeQuestions";

export const ADMIN_ROUTE_QUESTION_STORAGE_KEY =
  "topopass.admin.route-questions.v1";

export function cloneRouteQuestionBank(questions: RouteQuestion[]) {
  return JSON.parse(JSON.stringify(questions)) as RouteQuestion[];
}

export function createRouteQuestionDraft(): RouteQuestion {
  const now = new Date().toISOString();

  return {
    id: `route-${Date.now()}`,
    title: "",
    prompt: "",
    fromLabel: "",
    toLabel: "",
    from: { lat: 51.5, lng: -0.12 },
    to: { lat: 51.51, lng: -0.13 },
    acceptedRoute: {
      geometry: [],
      source: "manual",
      coordinateSystem: "map",
      reviewed: false
    },
    mapArea: "kings-cross-euston",
    mapBounds: { minX: 0, minY: 0, maxX: 1600, maxY: 1000 },
    difficulty: "medium",
    status: "draft",
    tags: ["route-planning", "london"],
    explanation: "",
    createdAt: now,
    updatedAt: now
  };
}

export function loadAdminRouteQuestionDrafts() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(ADMIN_ROUTE_QUESTION_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    const questions = JSON.parse(stored) as unknown;
    return Array.isArray(questions) ? (questions as RouteQuestion[]) : null;
  } catch {
    return null;
  }
}

export function saveAdminRouteQuestionDrafts(questions: RouteQuestion[]) {
  window.localStorage.setItem(
    ADMIN_ROUTE_QUESTION_STORAGE_KEY,
    JSON.stringify(questions)
  );
}

export function clearAdminRouteQuestionDrafts() {
  window.localStorage.removeItem(ADMIN_ROUTE_QUESTION_STORAGE_KEY);
}
