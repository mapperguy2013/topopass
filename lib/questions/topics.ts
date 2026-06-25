export const TOPOGRAPHICAL_QUESTION_TOPICS = [
  "London geography",
  "Major roads and routes",
  "Bridges and river crossings",
  "Stations and transport hubs",
  "Hospitals and key public buildings",
  "Landmarks and destinations",
  "Route planning",
  "Direction sense",
  "Map interpretation",
  "Passenger scenario judgement"
] as const;

export const SERU_QUESTION_TOPICS = [
  "Driver licensing and responsibilities",
  "Passenger safety",
  "Safeguarding",
  "Equality and accessibility",
  "Customer service",
  "Complaints and professionalism",
  "Private hire regulations",
  "Journey planning and conduct",
  "Lost property",
  "Road safety awareness",
  "London PHV Driver Licensing",
  "Licensing Requirements for PHVs",
  "Carrying out Private Hire Journeys",
  "Staying Safe",
  "Driver Behaviour",
  "Driving and Parking in London",
  "Safer Driving",
  "Being Aware of Equality and Disability",
  "Safeguarding Children and Adults at Risk",
  "Ridesharing",
  "SERU English - Complete the Sentence",
  "SERU English - Advanced Sentence Completion",
  "SERU Reading and Understanding"
] as const;

export const QUESTION_TOPICS = TOPOGRAPHICAL_QUESTION_TOPICS;

export const ALL_QUESTION_TOPICS = [
  ...TOPOGRAPHICAL_QUESTION_TOPICS,
  ...SERU_QUESTION_TOPICS
] as const;

export type QuestionTopic = (typeof QUESTION_TOPICS)[number];
export type SeruQuestionTopic = (typeof SERU_QUESTION_TOPICS)[number];
export type AnyQuestionTopic = (typeof ALL_QUESTION_TOPICS)[number];

export const QUESTION_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export function isQuestionTopic(value: unknown): value is QuestionTopic {
  return (
    typeof value === "string" &&
    QUESTION_TOPICS.includes(value as QuestionTopic)
  );
}

export function isSeruQuestionTopic(
  value: unknown
): value is SeruQuestionTopic {
  return (
    typeof value === "string" &&
    SERU_QUESTION_TOPICS.includes(value as SeruQuestionTopic)
  );
}

export function isAnyQuestionTopic(value: unknown): value is AnyQuestionTopic {
  return (
    typeof value === "string" &&
    ALL_QUESTION_TOPICS.includes(value as AnyQuestionTopic)
  );
}
