import { demoMapClickQuestions } from "@/lib/mapClickQuestions";

export type MultipleChoiceMockQuestion = {
  id: string;
  type: "multiple-choice";
  title: string;
  description: string;
  question: string;
  options: string[];
  correctOption: string;
};

export type MapClickMockQuestion = {
  id: string;
  type: "map-click";
  prompt: string;
  description: string;
  target: {
    lat: number;
    lng: number;
  };
  allowedDistanceMeters: number;
  initialCenter: {
    lat: number;
    lng: number;
  };
  initialZoom: number;
};

export type MockTestQuestion =
  | MultipleChoiceMockQuestion
  | MapClickMockQuestion;

const mapClickMockQuestions: MapClickMockQuestion[] = demoMapClickQuestions.map(
  (question) => ({
    id: `mock-${question.id}`,
    type: "map-click",
    prompt: question.prompt,
    description:
      "Click or tap the map to answer this mock-test map-reading question.",
    target: question.answer,
    allowedDistanceMeters: question.toleranceMeters,
    initialCenter: question.answer,
    initialZoom: 15
  })
);

export const mockTestQuestions: MockTestQuestion[] = [
  {
    id: "directions-basics",
    type: "multiple-choice",
    title: "Direction awareness",
    description:
      "A short warm-up question before the map-click tasks in this temporary mock flow.",
    question: "Which direction is generally opposite north?",
    options: ["South", "East", "West", "North-east"],
    correctOption: "South"
  },
  ...mapClickMockQuestions
];
