export type MapClickQuestionData = {
  id: string;
  type: "map-click";
  prompt: string;
  answer: {
    lat: number;
    lng: number;
  };
  toleranceMeters: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  sourceNote: string;
  targetName: string;
  isActive: boolean;
  explanation: string;
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
    toleranceMeters: 120,
    difficulty: "easy",
    category: "Rail stations",
    sourceNote: "Existing TopoPass station target",
    targetName: "King's Cross Station",
    isActive: true,
    explanation: "The accepted point is centred on King's Cross St Pancras station."
  },
  {
    id: "london-bridge-station",
    type: "map-click",
    prompt: "Click on London Bridge Station.",
    answer: {
      lat: 51.5055,
      lng: -0.0865
    },
    toleranceMeters: 120,
    difficulty: "medium",
    category: "Rail stations",
    sourceNote: "Existing TopoPass station target",
    targetName: "London Bridge Station",
    isActive: true,
    explanation: "The accepted point is centred on London Bridge station."
  },
  {
    id: "oxford-circus-station",
    type: "map-click",
    prompt: "Click on Oxford Circus Station.",
    answer: {
      lat: 51.5152,
      lng: -0.1419
    },
    toleranceMeters: 120,
    difficulty: "medium",
    category: "Underground stations",
    sourceNote: "Existing TopoPass station target",
    targetName: "Oxford Circus Station",
    isActive: true,
    explanation: "The accepted point is centred on Oxford Circus station."
  },
  {
    id: "euston-station",
    type: "map-click",
    prompt: "Click on Euston Station.",
    answer: { lat: 51.5282865, lng: -0.1338745 },
    toleranceMeters: 120,
    difficulty: "easy",
    category: "Rail stations",
    sourceNote: "OSM station coordinate used by the route bank",
    targetName: "Euston Station",
    isActive: true,
    explanation: "The accepted point is centred on Euston station."
  },
  {
    id: "russell-square-station",
    type: "map-click",
    prompt: "Click on Russell Square Station.",
    answer: { lat: 51.5230529, lng: -0.1242529 },
    toleranceMeters: 120,
    difficulty: "medium",
    category: "Underground stations",
    sourceNote: "OSM station coordinate used by the route bank",
    targetName: "Russell Square Station",
    isActive: true,
    explanation: "The accepted point is centred on Russell Square station."
  },
  {
    id: "warren-street-station",
    type: "map-click",
    prompt: "Click on Warren Street Station.",
    answer: { lat: 51.5247178, lng: -0.1385303 },
    toleranceMeters: 120,
    difficulty: "medium",
    category: "Underground stations",
    sourceNote: "OSM station coordinate used by the route bank",
    targetName: "Warren Street Station",
    isActive: true,
    explanation: "The accepted point is centred on Warren Street station."
  },
  {
    id: "goodge-street-station",
    type: "map-click",
    prompt: "Click on Goodge Street Station.",
    answer: { lat: 51.5205978, lng: -0.1343573 },
    toleranceMeters: 120,
    difficulty: "hard",
    category: "Underground stations",
    sourceNote: "OSM station coordinate used by the route bank",
    targetName: "Goodge Street Station",
    isActive: true,
    explanation: "The accepted point is centred on Goodge Street station."
  },
  {
    id: "angel-station",
    type: "map-click",
    prompt: "Click on Angel Station.",
    answer: { lat: 51.5324874, lng: -0.1060356 },
    toleranceMeters: 120,
    difficulty: "hard",
    category: "Underground stations",
    sourceNote: "OSM station coordinate used by the route bank",
    targetName: "Angel Station",
    isActive: true,
    explanation: "The accepted point is centred on Angel station."
  }
];
