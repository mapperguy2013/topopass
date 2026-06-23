import type {
  RouteMapBounds,
  RouteQuestion
} from "@/src/data/routeQuestions";

export type RouteQuestionValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type RouteQuestionBankValidationResult =
  RouteQuestionValidationResult & {
    results: RouteQuestionValidationResult[];
  };

const VALID_STATUSES = new Set(["draft", "active", "archived"]);
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isLatitude(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isLongitude(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

function hasValidBounds(bounds: RouteMapBounds | undefined) {
  return Boolean(
    bounds &&
      [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].every(
        (value) => typeof value === "number" && Number.isFinite(value)
      ) &&
      bounds.minX < bounds.maxX &&
      bounds.minY < bounds.maxY
  );
}

function canDeriveBounds(question: Partial<RouteQuestion>) {
  const geometry = question.acceptedRoute?.geometry;

  if (!Array.isArray(geometry) || geometry.length < 2) {
    return false;
  }

  const points = geometry.filter(
    (point) =>
      Array.isArray(point) &&
      point.length === 2 &&
      point.every((value) => typeof value === "number" && Number.isFinite(value))
  );

  if (points.length < 2) {
    return false;
  }

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);

  return Math.min(...xs) < Math.max(...xs) && Math.min(...ys) < Math.max(...ys);
}

export function validateRouteQuestion(
  question: Partial<RouteQuestion>,
  duplicateId = false
): RouteQuestionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!hasText(question.id)) {
    errors.push("ID is required.");
  } else if (duplicateId) {
    errors.push("ID must be unique within the route question bank.");
  }

  if (!hasText(question.title)) {
    errors.push("Title is required.");
  }
  if (!hasText(question.prompt)) {
    errors.push("Prompt is required.");
  }
  if (!hasText(question.fromLabel)) {
    errors.push("Start location name is required.");
  }
  if (!hasText(question.toLabel)) {
    errors.push("End location name is required.");
  }

  if (!isLatitude(question.from?.lat)) {
    errors.push("Start latitude must be between -90 and 90.");
  }
  if (!isLongitude(question.from?.lng)) {
    errors.push("Start longitude must be between -180 and 180.");
  }
  if (!isLatitude(question.to?.lat)) {
    errors.push("End latitude must be between -90 and 90.");
  }
  if (!isLongitude(question.to?.lng)) {
    errors.push("End longitude must be between -180 and 180.");
  }

  const geometry = question.acceptedRoute?.geometry;
  if (!Array.isArray(geometry)) {
    errors.push("Accepted route geometry is required.");
  } else {
    if (geometry.length < 3) {
      errors.push("Accepted route geometry needs at least three points.");
    }
    if (
      geometry.some(
        (point) =>
          !Array.isArray(point) ||
          point.length !== 2 ||
          point.some(
            (value) => typeof value !== "number" || !Number.isFinite(value)
          )
      )
    ) {
      errors.push("Every accepted route point must contain two finite numbers.");
    }
  }

  if (!VALID_STATUSES.has(question.status ?? "")) {
    errors.push("Status must be draft, active, or archived.");
  }
  if (!VALID_DIFFICULTIES.has(question.difficulty ?? "")) {
    errors.push("Difficulty must be easy, medium, or hard.");
  }
  if (!hasText(question.mapArea)) {
    errors.push("Map area is required.");
  }

  if (!hasValidBounds(question.mapBounds)) {
    if (canDeriveBounds(question)) {
      warnings.push(
        "Map bounds are missing or invalid; preview bounds can be derived from the accepted route."
      );
    } else {
      errors.push("Valid map bounds are required and cannot be derived safely.");
    }
  }

  if (!hasText(question.explanation)) {
    warnings.push("Explanation or feedback text has not been added.");
  }
  if (!question.tags?.length) {
    warnings.push("No tags or categories have been added.");
  }
  if (!question.acceptedRoute?.reviewed) {
    warnings.push("Accepted route geometry is not marked as reviewed.");
  }
  if (!hasText(question.createdAt) || Number.isNaN(Date.parse(question.createdAt))) {
    errors.push("Created date must be a valid date.");
  }
  if (!hasText(question.updatedAt) || Number.isNaN(Date.parse(question.updatedAt))) {
    errors.push("Updated date must be a valid date.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateRouteQuestionBank(
  questions: RouteQuestion[]
): RouteQuestionBankValidationResult {
  const idCounts = new Map<string, number>();

  questions.forEach((question) => {
    const id = question.id.trim();
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  });

  const results = questions.map((question) =>
    validateRouteQuestion(question, (idCounts.get(question.id.trim()) ?? 0) > 1)
  );
  const errors = results.flatMap((result, index) =>
    result.errors.map((error) => `Question ${index + 1}: ${error}`)
  );
  const warnings = results.flatMap((result, index) =>
    result.warnings.map((warning) => `Question ${index + 1}: ${warning}`)
  );

  return {
    valid: results.every((result) => result.valid),
    errors,
    warnings,
    results
  };
}
