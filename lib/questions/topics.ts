export const QUESTION_TOPICS = [
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

export type QuestionTopic = (typeof QUESTION_TOPICS)[number];

export const QUESTION_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export function isQuestionTopic(value: unknown): value is QuestionTopic {
  return (
    typeof value === "string" &&
    QUESTION_TOPICS.includes(value as QuestionTopic)
  );
}
