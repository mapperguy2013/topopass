export type KnowledgeQuestionData = {
  id: string;
  type: "knowledge";
  prompt: string;
  options: string[];
  correctAnswer: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  sourceNote: string;
  isActive: boolean;
  explanation: string;
};

export const knowledgeQuestionBank: KnowledgeQuestionData[] = [
  {
    id: "knowledge-cardinal-direction",
    type: "knowledge",
    prompt: "Which direction is opposite north?",
    options: ["South", "East", "West", "North-east"],
    correctAnswer: "South",
    difficulty: "easy",
    category: "Directions",
    sourceNote: "General map-reading principle",
    isActive: true,
    explanation: "South is the cardinal direction opposite north."
  },
  {
    id: "knowledge-road-atlas-index",
    type: "knowledge",
    prompt: "What should you use first to locate a named street in a printed street atlas?",
    options: ["Street index", "Scale bar", "Compass rose", "Cover map"],
    correctAnswer: "Street index",
    difficulty: "easy",
    category: "Map reading",
    sourceNote: "Printed street-atlas navigation",
    isActive: true,
    explanation: "A street index identifies the page and grid area for a named street."
  },
  {
    id: "knowledge-route-check",
    type: "knowledge",
    prompt: "Before tracing a route, which two locations should be confirmed on the map?",
    options: [
      "Start and destination",
      "Nearest two parks",
      "Two borough boundaries",
      "North and south map edges"
    ],
    correctAnswer: "Start and destination",
    difficulty: "medium",
    category: "Route planning",
    sourceNote: "Point-to-point route preparation",
    isActive: true,
    explanation: "Confirming both endpoints establishes the journey that must be planned."
  },
  {
    id: "knowledge-map-scale",
    type: "knowledge",
    prompt: "What does a map scale help you estimate?",
    options: [
      "Distance on the ground",
      "Road speed limits",
      "Traffic volume",
      "Building opening hours"
    ],
    correctAnswer: "Distance on the ground",
    difficulty: "easy",
    category: "Map reading",
    sourceNote: "General map-reading principle",
    isActive: true,
    explanation: "The scale relates a distance measured on the map to distance on the ground."
  },
  {
    id: "knowledge-grid-reference-order",
    type: "knowledge",
    prompt: "When reading a grid reference, which value is normally read first?",
    options: ["Easting", "Northing", "Elevation", "Distance"],
    correctAnswer: "Easting",
    difficulty: "medium",
    category: "Grid references",
    sourceNote: "Standard grid-reference convention",
    isActive: true,
    explanation: "Grid references are normally read eastings first, then northings."
  },
  {
    id: "knowledge-one-way-arrow",
    type: "knowledge",
    prompt: "What does an arrow shown along a one-way street indicate?",
    options: [
      "Permitted travel direction",
      "Direction of north",
      "Nearest station",
      "Road gradient"
    ],
    correctAnswer: "Permitted travel direction",
    difficulty: "easy",
    category: "Road information",
    sourceNote: "General road-map symbol knowledge",
    isActive: true,
    explanation: "The arrow shows the direction in which traffic may travel on that street."
  },
  {
    id: "knowledge-route-junction-check",
    type: "knowledge",
    prompt: "Why should junctions be checked carefully when planning a route?",
    options: [
      "To confirm roads connect in the required direction",
      "To count nearby buildings",
      "To identify the map publisher",
      "To measure the page margin"
    ],
    correctAnswer: "To confirm roads connect in the required direction",
    difficulty: "medium",
    category: "Route planning",
    sourceNote: "Route continuity and junction awareness",
    isActive: true,
    explanation: "Junction checks confirm that the chosen streets connect as intended."
  },
  {
    id: "knowledge-landmark-orientation",
    type: "knowledge",
    prompt: "How can a major station or landmark help during map reading?",
    options: [
      "It provides a recognisable orientation point",
      "It replaces the need to read road names",
      "It proves every nearby road is two-way",
      "It sets the map scale"
    ],
    correctAnswer: "It provides a recognisable orientation point",
    difficulty: "easy",
    category: "Location knowledge",
    sourceNote: "Landmark-based orientation",
    isActive: true,
    explanation: "Recognisable landmarks help establish position and orientation on the map."
  }
];
