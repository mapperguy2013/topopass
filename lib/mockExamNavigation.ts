import { canSubmitRoute } from "./routeDrawingControls.ts";
import type { MockExamAnswer } from "./mockExamEngine.ts";
import type { MockExamQuestion } from "./mockTestQuestions.ts";

export type MockExamNavigationCheck = {
  canAdvance: boolean;
  message: string | null;
};

export function validateMockExamQuestionForNext(
  question: MockExamQuestion,
  answer?: MockExamAnswer
): MockExamNavigationCheck {
  if (question.type === "knowledge") {
    return {
      canAdvance: true,
      message: null
    };
  }

  if (question.type === "map-click") {
    return answer?.type === "map-click"
      ? {
          canAdvance: true,
          message: null
        }
      : {
          canAdvance: false,
          message: "Select a location on the map before moving to the next question."
        };
  }

  return answer?.type === "route-drawing" && canSubmitRoute(answer.routePoints)
    ? {
        canAdvance: true,
        message: null
      }
    : {
        canAdvance: false,
        message: "Draw a route from the start point to the destination before moving to the next question."
      };
}
