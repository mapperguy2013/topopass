export type LearnSkillType =
  | "Knowledge"
  | "Map Skills"
  | "Route Planning"
  | "Mock Exam"
  | "Review"
  | "SERU";

export type LessonCard = {
  id: string;
  title: string;
  description: string;
  skillType: LearnSkillType;
  href: string;
  actionLabel: string;
};

export type LearningPathStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
};

export type LearnSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  skillType: LearnSkillType;
  href: string;
  actionLabel: string;
  guidance: string[];
};

export const learnSkillTypes: LearnSkillType[] = [
  "Knowledge",
  "Map Skills",
  "Route Planning",
  "Mock Exam",
  "Review",
  "SERU"
];

export const validLearnHrefs = [
  "/learn",
  "/practice",
  "/practice/knowledge",
  "/practice/map-click",
  "/practice/routes",
  "/mock-test",
  "/progress",
  "/progress/mistakes",
  "/learn#seru-preparation"
] as const;

export const gettingStartedTips = [
  "Use Learn to understand the skill, then move straight into the matching practice mode.",
  "Start with shorter focused practice sessions before attempting a full mock exam.",
  "Review explanations and tips after each attempt so mistakes become specific next steps.",
  "Use Progress and Mistakes to decide whether to practise knowledge, map locations, or route planning next."
] as const;

export const learningPathSteps: LearningPathStep[] = [
  {
    id: "core-skills",
    title: "Read the core skills",
    description:
      "Understand how knowledge, map locations, route planning, mock exams, and review fit together.",
    href: "/learn",
    actionLabel: "Stay on Learn"
  },
  {
    id: "knowledge-practice",
    title: "Practise knowledge questions",
    description:
      "Build confidence with licensing rules, conduct, safety, accessibility, and route awareness.",
    href: "/practice/knowledge",
    actionLabel: "Start knowledge practice"
  },
  {
    id: "map-click-practice",
    title: "Practise map-click locations",
    description:
      "Find London stations, landmarks, bridges, hospitals, and other useful private hire locations.",
    href: "/practice/map-click",
    actionLabel: "Practise map locations"
  },
  {
    id: "route-planning-practice",
    title: "Practise route planning",
    description:
      "Draw training routes from a start point to a destination and compare your answer after submission.",
    href: "/practice/routes",
    actionLabel: "Practise route planning"
  },
  {
    id: "mistake-review",
    title: "Review mistakes",
    description:
      "Revisit incorrect answers, read the explanations, and retry weak areas before moving on.",
    href: "/progress/mistakes",
    actionLabel: "Review mistakes"
  },
  {
    id: "mock-exam",
    title: "Attempt a mock exam",
    description:
      "Use a mixed mock when focused practice feels reliable across all question types.",
    href: "/mock-test",
    actionLabel: "Try a mock exam"
  },
  {
    id: "progress-recommendations",
    title: "Use progress recommendations",
    description:
      "Check trends and weak areas, then return to the practice mode that needs attention.",
    href: "/progress",
    actionLabel: "View progress"
  }
];

export const lessonCards: LessonCard[] = [
  {
    id: "knowledge-foundations",
    title: "Knowledge foundations",
    description:
      "Prepare for licensing, passenger safety, professional conduct, accessibility, and common rule-based questions.",
    skillType: "Knowledge",
    href: "/practice/knowledge",
    actionLabel: "Start knowledge practice"
  },
  {
    id: "map-location-method",
    title: "Map location method",
    description:
      "Use road names, junctions, nearby landmarks, and careful zooming before selecting a point.",
    skillType: "Map Skills",
    href: "/practice/map-click",
    actionLabel: "Practise map locations"
  },
  {
    id: "route-planning-method",
    title: "Route Planning & Map Skills",
    description:
      "Plan a legal and realistic training route, follow road hierarchy, and compare your drawn route with the accepted route.",
    skillType: "Route Planning",
    href: "/practice/routes",
    actionLabel: "Practise route planning"
  },
  {
    id: "mock-exam-readiness",
    title: "Mock exam readiness",
    description:
      "Attempt a mock after focused practice, then use the review to decide what to retry.",
    skillType: "Mock Exam",
    href: "/mock-test",
    actionLabel: "Try a mock exam"
  },
  {
    id: "mistake-review-loop",
    title: "Mistake review loop",
    description:
      "Turn incorrect answers into targeted retries using explanations, tips, and repeated weak-area checks.",
    skillType: "Review",
    href: "/progress/mistakes",
    actionLabel: "Review mistakes"
  },
  {
    id: "progress-check",
    title: "Progress check",
    description:
      "Use your local progress history to spot weak question types and choose the next practice area.",
    skillType: "Review",
    href: "/progress",
    actionLabel: "View progress"
  },
  {
    id: "seru-preparation-support",
    title: "SERU preparation support",
    description:
      "Understand the SERU-style themes TopoPass will support separately from topographical mock exams, including safety, equality, accessibility, and driver responsibilities.",
    skillType: "SERU",
    href: "/learn#seru-preparation",
    actionLabel: "Read SERU notes"
  }
];

export const routePlanningTips = [
  "Read the start and destination labels before drawing.",
  "Plan the broad direction first, then choose the roads that connect the journey.",
  "Use major roads before minor roads where that gives a sensible driver-focused route.",
  "Watch for one-way, no-entry, private, or restricted-access information where the map shows it.",
  "Keep the route continuous and avoid cutting across blocks, parks, rail lines, or non-road space.",
  "After submission, compare your route with the accepted route and review start, end, coverage, and off-route feedback."
] as const;

export const mapClickTips = [
  "Identify the type of target first, such as a station, bridge, hospital, venue, or square.",
  "Use nearby road names, junction shapes, rail lines, river crossings, and large landmarks as clues.",
  "Zoom and pan carefully before selecting, especially on mobile.",
  "Tap again if the selected marker is not exactly where you intended.",
  "Use the accepted answer radius as a training tolerance, not as a promise that every nearby point is equally good."
] as const;

export const knowledgeTips = [
  "Review licensing rules and local responsibilities in small groups rather than cramming everything at once.",
  "Treat passenger safety and professional conduct questions as practical driver decisions.",
  "Pay attention to accessibility, assistance needs, and clear communication with passengers.",
  "Use incorrect answers to identify repeated patterns, not just isolated misses.",
  "Connect rule-based questions back to real route awareness and customer service."
] as const;

export const mockExamTips = [
  "Attempt a mock when you can complete focused practice without frequent guessing.",
  "Do not stop at the final score. Review each failed question and read the explanation.",
  "Retry weak areas before starting another mock so the next attempt tests improvement.",
  "Use progress recommendations to balance knowledge, map-click, and route planning practice."
] as const;

export const mistakeReviewTips = [
  "Review incorrect answers soon after practice while the question is still familiar.",
  "Use explanations and tips to understand the reason behind the accepted answer.",
  "Retry saved mistakes rather than only starting new questions.",
  "Watch for repeated weak areas, especially if the same question type keeps appearing.",
  "Mark reviewed mistakes only when you understand what to do differently next time."
] as const;

export const seruPreparationTips = [
  "Treat SERU-style practice as a separate learning area from topographical map and route exams.",
  "Build confidence with safety, equality, accessibility, customer service, and safeguarding themes.",
  "Review licensing rules, driver responsibilities, complaints, lost property, and regulatory awareness as practical decisions.",
  "Use original learning content and public guidance-style knowledge rather than copied official questions.",
  "When SERU practice is added, keep progress separated from map skills while using the same learner account."
] as const;

export const learnSections: LearnSection[] = [
  {
    id: "route-planning-map-skills",
    eyebrow: "Driver-focused routing",
    title: "Route Planning & Map Skills",
    description:
      "Route drawing practice trains you to read the start point, destination, road hierarchy, and restrictions before drawing a realistic training route. The comparison is a learning tool, not a claim that there is only one possible answer.",
    skillType: "Route Planning",
    href: "/practice/routes",
    actionLabel: "Practise route planning",
    guidance: [...routePlanningTips]
  },
  {
    id: "map-click-skills",
    eyebrow: "Location confidence",
    title: "Map-click Skills",
    description:
      "Map-click practice helps you identify useful London locations by reading the map around the target rather than guessing from memory.",
    skillType: "Map Skills",
    href: "/practice/map-click",
    actionLabel: "Practise map locations",
    guidance: [...mapClickTips]
  },
  {
    id: "knowledge-skills",
    eyebrow: "Rules and conduct",
    title: "Knowledge Skills",
    description:
      "Knowledge practice builds the decision-making needed around safety, conduct, accessibility, licensing, and route awareness.",
    skillType: "Knowledge",
    href: "/practice/knowledge",
    actionLabel: "Start knowledge practice",
    guidance: [...knowledgeTips]
  },
  {
    id: "seru-preparation",
    eyebrow: "Separate knowledge area",
    title: "SERU Preparation Support",
    description:
      "SERU-style preparation is a separate product area for private hire knowledge confidence. It is planned to cover safety, equality, accessibility, customer service, safeguarding, licensing rules, driver responsibilities, complaints, lost property, and regulatory awareness without mixing those questions into topographical mock exams.",
    skillType: "SERU",
    href: "/learn#seru-preparation",
    actionLabel: "Read SERU guidance",
    guidance: [...seruPreparationTips]
  },
  {
    id: "mock-exam-preparation",
    eyebrow: "Exam readiness",
    title: "Mock Exam Preparation",
    description:
      "Mock exams are most useful after focused practice. Use them to test mixed performance, then review the failed questions carefully.",
    skillType: "Mock Exam",
    href: "/mock-test",
    actionLabel: "Try a mock exam",
    guidance: [...mockExamTips]
  },
  {
    id: "mistake-review",
    eyebrow: "Targeted improvement",
    title: "Mistake Review",
    description:
      "Mistake review turns saved incorrect answers into a practical study list. Use it to retry weak areas before they become habits.",
    skillType: "Review",
    href: "/progress/mistakes",
    actionLabel: "Review mistakes",
    guidance: [...mistakeReviewTips]
  }
];
