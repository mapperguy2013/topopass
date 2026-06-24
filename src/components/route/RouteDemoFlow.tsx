"use client";

import { useState } from "react";
import {
  atlasPageToRouteMapBase,
  getAtlasPageById,
  type RouteMapBase
} from "@/lib/map/atlasPages";
import { RouteDrawingQuestion } from "@/src/components/route/RouteDrawingQuestion";
import { kingsCrossEustonRouteGraph } from "@/src/data/maps/kings-cross-euston/routeGraph";
import {
  getRouteQuestionById,
  getRouteQuestions,
  routeQuestions,
  type RouteQuestion
} from "@/src/data/routeQuestions";

const fallbackRouteMapBase: RouteMapBase = {
  graph: kingsCrossEustonRouteGraph,
  imagePath: "/maps/kings-cross-euston/map.svg",
  mapAttribution: "(c) OpenStreetMap contributors, ODbL"
};

export function RouteDemoFlow() {
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    routeQuestions[0].id
  );
  const selectedQuestion = getRouteQuestionById(
    selectedQuestionId
  ) as RouteQuestion;
  const acceptedRoute = selectedQuestion.acceptedRoute?.geometry.map(
    ([x, y]) => ({ x, y })
  );
  const atlasPage = getAtlasPageById(selectedQuestion.mapPageId);
  const routeMapBase = atlasPage
    ? atlasPageToRouteMapBase(atlasPage)
    : fallbackRouteMapBase;

  if (!acceptedRoute) {
    throw new Error(
      `Accepted route not found for question: ${selectedQuestion.id}`
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-24">
        <p className="px-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Route questions
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {getRouteQuestions().map((question, index) => {
            const isSelected = question.id === selectedQuestion.id;

            return (
              <button
                aria-pressed={isSelected}
                className={`min-h-14 rounded-md border px-3 py-2 text-left transition ${
                  isSelected
                    ? "border-road bg-blue-50 text-road"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
                key={question.id}
                onClick={() => setSelectedQuestionId(question.id)}
                type="button"
              >
                <span className="block text-xs font-semibold text-slate-500">
                  Route {index + 1}
                </span>
                <span className="mt-1 block text-sm font-bold leading-5">
                  {question.title}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <RouteDrawingQuestion
        acceptedRoutePoints={acceptedRoute}
        graph={routeMapBase.graph}
        key={selectedQuestion.id}
        mapAttribution={routeMapBase.mapAttribution}
        mapImagePath={routeMapBase.imagePath}
        question={selectedQuestion}
        routeScoringConfig={routeMapBase.scoringConfig}
      />
    </div>
  );
}
