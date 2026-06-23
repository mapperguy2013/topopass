import { validateRouteQuestion as validateLegacyRouteQuestion } from "../routeQuestionValidation.ts";
import type { KnowledgeQuestionData } from "../knowledgeQuestions.ts";
import type { MapClickQuestionData } from "../mapClickQuestions.ts";
import type { RouteQuestion } from "../../src/data/routeQuestions.ts";
import {
  getAllQuestions,
  type AdminQuestion
} from "./questionAdminHelpers.ts";

export type QuestionValidationIssue = {
  severity: "error" | "warning";
  field: string;
  message: string;
};

export type QuestionValidationResult = {
  valid: boolean;
  issues: QuestionValidationIssue[];
};

const SUPPORTED_LONDON_BOUNDS = {
  south: 51.28,
  west: -0.52,
  north: 51.7,
  east: 0.33
};

function issue(
  severity: QuestionValidationIssue["severity"],
  field: string,
  message: string
): QuestionValidationIssue {
  return { severity, field, message };
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function validLatitude(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function validLongitude(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

function duplicateIssue(id: string, duplicateIds: Set<string>) {
  return duplicateIds.has(id.trim())
    ? [issue("error", "id", "Question ID must be unique across all question banks.")]
    : [];
}

function result(issues: QuestionValidationIssue[]): QuestionValidationResult {
  return {
    valid: !issues.some((validationIssue) => validationIssue.severity === "error"),
    issues
  };
}

export function validateKnowledgeQuestion(
  question: KnowledgeQuestionData,
  duplicateIds = new Set<string>()
) {
  const issues: QuestionValidationIssue[] = [];
  if (!hasText(question.id)) issues.push(issue("error", "id", "Question ID is required."));
  issues.push(...duplicateIssue(question.id, duplicateIds));
  if (!hasText(question.prompt)) issues.push(issue("error", "prompt", "Question text is required."));
  if (question.options.length < 2) issues.push(issue("error", "options", "At least two answer options are required."));
  if (question.options.some((option) => !hasText(option))) issues.push(issue("error", "options", "Answer options cannot be empty."));
  const normalized = question.options.map((option) => option.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) issues.push(issue("error", "options", "Answer options must not contain duplicates."));
  if (!hasText(question.correctAnswer) || !question.options.includes(question.correctAnswer)) {
    issues.push(issue("error", "correctAnswer", "Select a correct answer from the available options."));
  }
  if (!hasText(question.category)) issues.push(issue("warning", "category", "Category is missing."));
  if (!hasText(question.explanation)) issues.push(issue("warning", "explanation", "Explanation is missing."));
  return result(issues);
}

export function validateMapClickQuestion(
  question: MapClickQuestionData,
  duplicateIds = new Set<string>()
) {
  const issues: QuestionValidationIssue[] = [];
  if (!hasText(question.id)) issues.push(issue("error", "id", "Question ID is required."));
  issues.push(...duplicateIssue(question.id, duplicateIds));
  if (!hasText(question.prompt)) issues.push(issue("error", "prompt", "Question prompt is required."));
  if (!hasText(question.targetName)) issues.push(issue("error", "targetName", "Target location name is required."));
  if (!validLatitude(question.answer?.lat)) issues.push(issue("error", "answer.lat", "Target latitude must be between -90 and 90."));
  if (!validLongitude(question.answer?.lng)) issues.push(issue("error", "answer.lng", "Target longitude must be between -180 and 180."));
  if (!Number.isFinite(question.toleranceMeters) || question.toleranceMeters < 25) {
    issues.push(issue("error", "toleranceMeters", "Accepted radius must be at least 25 metres."));
  }
  if (
    validLatitude(question.answer?.lat) &&
    validLongitude(question.answer?.lng) &&
    (question.answer.lat < SUPPORTED_LONDON_BOUNDS.south ||
      question.answer.lat > SUPPORTED_LONDON_BOUNDS.north ||
      question.answer.lng < SUPPORTED_LONDON_BOUNDS.west ||
      question.answer.lng > SUPPORTED_LONDON_BOUNDS.east)
  ) {
    issues.push(issue("warning", "answer", "Target is outside the supported London bounds."));
  }
  if (!hasText(question.explanation)) issues.push(issue("warning", "explanation", "Explanation is missing."));
  return result(issues);
}

function projectToKingsCrossMap(longitude: number, latitude: number) {
  const width = 1600;
  const height = 1000;
  const padding = 24;
  const bounds = { south: 51.516, west: -0.15, north: 51.536, east: -0.1 };
  const middleLatitude = (bounds.south + bounds.north) / 2;
  const longitudeScale = Math.cos((middleLatitude * Math.PI) / 180);
  const sourceWidth = (bounds.east - bounds.west) * longitudeScale;
  const sourceHeight = bounds.north - bounds.south;
  const scale = Math.min(
    (width - padding * 2) / sourceWidth,
    (height - padding * 2) / sourceHeight
  );
  const offsetX = (width - sourceWidth * scale) / 2;
  const offsetY = (height - sourceHeight * scale) / 2;
  return {
    x: offsetX + (longitude - bounds.west) * longitudeScale * scale,
    y: offsetY + (bounds.north - latitude) * scale
  };
}

function mapDistance(a: [number, number], b: { x: number; y: number }) {
  return Math.hypot(a[0] - b.x, a[1] - b.y) * 2.33;
}

export function validateRouteQuestion(
  question: RouteQuestion,
  duplicateIds = new Set<string>()
) {
  const legacy = validateLegacyRouteQuestion(question, duplicateIds.has(question.id.trim()));
  const issues: QuestionValidationIssue[] = [
    ...legacy.errors.map((message) => issue("error", "route", message)),
    ...legacy.warnings.map((message) => issue("warning", "route", message))
  ];
  const geometry = question.acceptedRoute?.geometry ?? [];

  if (geometry.length >= 2 && validLatitude(question.from.lat) && validLongitude(question.from.lng)) {
    const projectedStart = projectToKingsCrossMap(question.from.lng, question.from.lat);
    if (mapDistance(geometry[0], projectedStart) > 200) {
      issues.push(issue("warning", "acceptedRoute", "Accepted route starts more than 200 metres from the start coordinate."));
    }
  }
  if (geometry.length >= 2 && validLatitude(question.to.lat) && validLongitude(question.to.lng)) {
    const projectedEnd = projectToKingsCrossMap(question.to.lng, question.to.lat);
    if (mapDistance(geometry[geometry.length - 1], projectedEnd) > 200) {
      issues.push(issue("warning", "acceptedRoute", "Accepted route ends more than 200 metres from the destination coordinate."));
    }
  }
  if (geometry.length >= 2) {
    let length = 0;
    for (let index = 1; index < geometry.length; index += 1) {
      length += Math.hypot(
        geometry[index][0] - geometry[index - 1][0],
        geometry[index][1] - geometry[index - 1][1]
      );
    }
    if (length * 2.33 < 250) issues.push(issue("warning", "acceptedRoute", "Accepted route length is suspiciously short."));
    if (geometry.some(([x, y]) => x < question.mapBounds.minX || x > question.mapBounds.maxX || y < question.mapBounds.minY || y > question.mapBounds.maxY)) {
      issues.push(issue("warning", "acceptedRoute", "Accepted route leaves the configured map bounds."));
    }
  }
  return result(issues);
}

export function validateQuestion(
  question: AdminQuestion,
  duplicateIds = new Set<string>()
) {
  if (question.type === "knowledge") return validateKnowledgeQuestion(question, duplicateIds);
  if (question.type === "map-click") return validateMapClickQuestion(question, duplicateIds);
  const { type: _type, ...routeQuestion } = question;
  void _type;
  return validateRouteQuestion(routeQuestion, duplicateIds);
}

export function validateAllQuestionBanks(questions = getAllQuestions()) {
  const counts = new Map<string, number>();
  questions.forEach((question) => counts.set(question.id.trim(), (counts.get(question.id.trim()) ?? 0) + 1));
  const duplicateIds = new Set(
    [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id)
  );
  const results = questions.map((question) => ({
    question,
    ...validateQuestion(question, duplicateIds)
  }));
  return {
    valid: results.every((entry) => entry.valid),
    issues: results.flatMap((entry) => entry.issues),
    results
  };
}
