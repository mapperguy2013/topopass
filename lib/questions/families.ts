import {
  isSeruQuestionTopic,
  type AnyQuestionTopic
} from "./topics.ts";

export type QuestionFamily = "topographical" | "seru";

export function getQuestionFamily({
  id,
  category,
  tags = []
}: {
  id?: string | null;
  category?: string | null;
  tags?: string[];
}): QuestionFamily {
  if (typeof id === "string" && id.startsWith("seru-")) return "seru";
  if (isSeruQuestionTopic(category)) return "seru";
  if (tags.some(isSeruQuestionTopic)) return "seru";
  return "topographical";
}

export function getQuestionFamilyLabel(family: QuestionFamily) {
  return family === "seru" ? "SERU Preparation" : "Topographical Skills";
}

export function getTopicFamily(topic: AnyQuestionTopic): QuestionFamily {
  return isSeruQuestionTopic(topic) ? "seru" : "topographical";
}
