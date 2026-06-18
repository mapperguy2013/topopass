export type MapClickQuestionData = {
  id: string;
  type: "map-click";
  prompt: string;
  answer: {
    lat: number;
    lng: number;
  };
  toleranceMeters: number;
};

export const demoMapClickQuestions: MapClickQuestionData[] = [
  {
    id: "kings-cross-station",
    type: "map-click",
    prompt: "Click on King\u2019s Cross Station.",
    answer: {
      lat: 51.5308,
      lng: -0.1238
    },
    toleranceMeters: 120
  },
  {
    id: "london-bridge-station",
    type: "map-click",
    prompt: "Click on London Bridge Station.",
    answer: {
      lat: 51.5055,
      lng: -0.0865
    },
    toleranceMeters: 120
  },
  {
    id: "oxford-circus-station",
    type: "map-click",
    prompt: "Click on Oxford Circus Station.",
    answer: {
      lat: 51.5152,
      lng: -0.1419
    },
    toleranceMeters: 120
  }
];
