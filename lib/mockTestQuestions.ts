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
  title: string;
  description: string;
  target: {
    lat: number;
    lng: number;
  };
  passRadiusMetres: number;
  initialCenter: {
    lat: number;
    lng: number;
  };
  initialZoom: number;
};

export type MockTestQuestion =
  | MultipleChoiceMockQuestion
  | MapClickMockQuestion;

export const mockTestQuestions: MockTestQuestion[] = [
  {
    id: "directions-basics",
    type: "multiple-choice",
    title: "Direction awareness",
    description:
      "A short warm-up question before the map-click task in this temporary mock flow.",
    question: "Which direction is generally opposite north?",
    options: ["South", "East", "West", "North-east"],
    correctOption: "South"
  },
  {
    id: "kings-cross-map-click",
    type: "map-click",
    title: "Click on King\u2019s Cross Station.",
    description:
      "This mock-test question uses the same reusable MapClickQuestion component as the standalone demo.",
    target: {
      lat: 51.5308,
      lng: -0.1238
    },
    passRadiusMetres: 120,
    initialCenter: {
      lat: 51.5308,
      lng: -0.1238
    },
    initialZoom: 15
  }
];
