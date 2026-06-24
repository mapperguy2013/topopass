import type {
  Json,
  QuestionDifficulty,
  QuestionStatus,
  QuestionType,
  TableInsert,
  TableRow
} from "./types.ts";

export type QuestionExportStatusFilter = "all" | QuestionStatus;
export type QuestionImportMode = "create" | "upsert";
export type QuestionImportRecord = TableInsert<"question_bank_items">;
export type QuestionExportRecord = TableRow<"question_bank_items">;

export type QuestionImportValidationError = {
  index: number;
  id?: string;
  field: string;
  message: string;
};

export type QuestionImportPreviewItem = {
  id: string;
  questionType: QuestionType;
  status: QuestionStatus;
  prompt: string;
};

export type QuestionImportPreview = {
  validRecords: QuestionImportRecord[];
  previewItems: QuestionImportPreviewItem[];
  errors: QuestionImportValidationError[];
};

export type QuestionBankExport = {
  format: "topopass-question-bank-items";
  version: 1;
  exportedAt: string;
  statusFilter: QuestionExportStatusFilter;
  question_bank_items: QuestionExportRecord[];
};

const QUESTION_TYPES = ["knowledge", "map-click", "route-drawing"] as const;
const QUESTION_STATUSES = ["draft", "published", "archived"] as const;
const QUESTION_DIFFICULTIES = ["easy", "medium", "hard"] as const;
const OLD_TABLE_KEYS = ["questions", "mock_test_attempts", "mock_test_answers"];
const OLD_QUESTION_FIELDS = ["bank_id", "source_note"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isQuestionType(value: unknown): value is QuestionType {
  return QUESTION_TYPES.includes(value as QuestionType);
}

function isQuestionStatus(value: unknown): value is QuestionStatus {
  return QUESTION_STATUSES.includes(value as QuestionStatus);
}

function isQuestionDifficulty(value: unknown): value is QuestionDifficulty {
  return QUESTION_DIFFICULTIES.includes(value as QuestionDifficulty);
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requiredString(
  value: unknown,
  field: string,
  errors: QuestionImportValidationError[],
  index: number,
  id?: string
) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push({
      index,
      id,
      field,
      message: `${field} is required.`
    });
    return "";
  }

  return value.trim();
}

function stringArray(
  value: unknown,
  field: string,
  errors: QuestionImportValidationError[],
  index: number,
  id?: string
) {
  if (value === undefined || value === null) return [];
  if (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string" && entry.trim())
  ) {
    return value.map((entry) => entry.trim());
  }

  errors.push({
    index,
    id,
    field,
    message: `${field} must be an array of non-empty strings.`
  });
  return [];
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function coordinates(
  value: unknown,
  field: string,
  errors: QuestionImportValidationError[],
  index: number,
  id?: string
) {
  if (!isPlainObject(value)) {
    errors.push({
      index,
      id,
      field,
      message: `${field} must be an object with numeric lat and lng.`
    });
    return null;
  }

  const lat = finiteNumber(value.lat);
  const lng = finiteNumber(value.lng);
  if (lat === null || lng === null) {
    errors.push({
      index,
      id,
      field,
      message: `${field} must include finite numeric lat and lng values.`
    });
    return null;
  }

  return { lat, lng };
}

function routeMapBounds(
  value: unknown,
  field: string,
  errors: QuestionImportValidationError[],
  index: number,
  id?: string
) {
  if (!isPlainObject(value)) {
    errors.push({
      index,
      id,
      field,
      message: `${field} must include numeric minX, minY, maxX, and maxY.`
    });
    return null;
  }

  const minX = finiteNumber(value.minX);
  const minY = finiteNumber(value.minY);
  const maxX = finiteNumber(value.maxX);
  const maxY = finiteNumber(value.maxY);
  if (
    minX === null ||
    minY === null ||
    maxX === null ||
    maxY === null ||
    maxX <= minX ||
    maxY <= minY
  ) {
    errors.push({
      index,
      id,
      field,
      message: `${field} must describe a valid map bounding box.`
    });
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function acceptedRoute(
  value: unknown,
  field: string,
  errors: QuestionImportValidationError[],
  index: number,
  id?: string
) {
  if (value === undefined || value === null) return undefined;
  if (!isPlainObject(value)) {
    errors.push({
      index,
      id,
      field,
      message: `${field} must be an accepted route object when provided.`
    });
    return undefined;
  }

  const geometry = value.geometry;
  const source = value.source;
  if (
    !Array.isArray(geometry) ||
    geometry.length < 2 ||
    !geometry.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        typeof point[0] === "number" &&
        Number.isFinite(point[0]) &&
        typeof point[1] === "number" &&
        Number.isFinite(point[1])
    )
  ) {
    errors.push({
      index,
      id,
      field: `${field}.geometry`,
      message: `${field}.geometry must contain at least two [x, y] points.`
    });
    return undefined;
  }

  if (source !== "osrm" && source !== "manual" && source !== "stored") {
    errors.push({
      index,
      id,
      field: `${field}.source`,
      message: `${field}.source must be osrm, manual, or stored.`
    });
    return undefined;
  }

  return {
    geometry: geometry as [number, number][],
    source,
    coordinateSystem: "map",
    reviewed: value.reviewed === true
  };
}

function jsonObject(value: Record<string, unknown>): Json {
  return value as Json;
}

function validateKnowledgePayload(
  payload: Record<string, unknown>,
  errors: QuestionImportValidationError[],
  index: number,
  id?: string
) {
  const options = stringArray(payload.options, "payload.options", errors, index, id);
  const correctAnswer = requiredString(
    payload.correctAnswer,
    "payload.correctAnswer",
    errors,
    index,
    id
  );
  if (options.length < 2) {
    errors.push({
      index,
      id,
      field: "payload.options",
      message: "payload.options must include at least two answer options."
    });
  }
  if (options.length >= 2 && correctAnswer && !options.includes(correctAnswer)) {
    errors.push({
      index,
      id,
      field: "payload.correctAnswer",
      message: "payload.correctAnswer must match one of payload.options."
    });
  }

  const result: Record<string, unknown> = {
    options,
    correctAnswer
  };

  if (isPlainObject(payload.incorrectExplanations)) {
    const explanations: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload.incorrectExplanations)) {
      if (typeof value === "string") explanations[key] = value;
    }
    result.incorrectExplanations = explanations;
  }

  return jsonObject(result);
}

function validateMapClickPayload(
  payload: Record<string, unknown>,
  errors: QuestionImportValidationError[],
  index: number,
  id?: string
) {
  const targetName = requiredString(
    payload.targetName,
    "payload.targetName",
    errors,
    index,
    id
  );
  const answer = coordinates(payload.answer, "payload.answer", errors, index, id);
  const toleranceMeters = finiteNumber(payload.toleranceMeters);
  if (toleranceMeters === null || toleranceMeters <= 0) {
    errors.push({
      index,
      id,
      field: "payload.toleranceMeters",
      message: "payload.toleranceMeters must be a positive number."
    });
  }

  const result: Record<string, unknown> = {
    targetName,
    answer: answer ?? { lat: 0, lng: 0 },
    toleranceMeters: toleranceMeters ?? 0
  };
  const acceptedAreaDescription = optionalString(payload.acceptedAreaDescription);
  if (acceptedAreaDescription) {
    result.acceptedAreaDescription = acceptedAreaDescription;
  }

  return jsonObject(result);
}

function validateRoutePayload(
  payload: Record<string, unknown>,
  errors: QuestionImportValidationError[],
  index: number,
  id?: string
) {
  const title = requiredString(payload.title, "payload.title", errors, index, id);
  const fromLabel = requiredString(
    payload.fromLabel,
    "payload.fromLabel",
    errors,
    index,
    id
  );
  const toLabel = requiredString(payload.toLabel, "payload.toLabel", errors, index, id);
  const from = coordinates(payload.from, "payload.from", errors, index, id);
  const to = coordinates(payload.to, "payload.to", errors, index, id);
  const mapArea = requiredString(payload.mapArea, "payload.mapArea", errors, index, id);
  const mapBounds = routeMapBounds(
    payload.mapBounds,
    "payload.mapBounds",
    errors,
    index,
    id
  );
  const route = acceptedRoute(
    payload.acceptedRoute,
    "payload.acceptedRoute",
    errors,
    index,
    id
  );

  const result: Record<string, unknown> = {
    title,
    fromLabel,
    toLabel,
    from: from ?? { lat: 0, lng: 0 },
    to: to ?? { lat: 0, lng: 0 },
    mapArea,
    mapBounds: mapBounds ?? { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  };

  if (route) result.acceptedRoute = route;
  const idealRouteDescription = optionalString(payload.idealRouteDescription);
  if (idealRouteDescription) result.idealRouteDescription = idealRouteDescription;
  const createdAt = optionalString(payload.createdAt);
  if (createdAt) result.createdAt = createdAt;
  const updatedAt = optionalString(payload.updatedAt);
  if (updatedAt) result.updatedAt = updatedAt;

  return jsonObject(result);
}

function validateQuestionRecord(
  value: unknown,
  index: number
): {
  record: QuestionImportRecord | null;
  errors: QuestionImportValidationError[];
} {
  const errors: QuestionImportValidationError[] = [];
  if (!isPlainObject(value)) {
    return {
      record: null,
      errors: [
        {
          index,
          field: "record",
          message: "Each import item must be a question_bank_items object."
        }
      ]
    };
  }

  const id = typeof value.id === "string" ? value.id.trim() : undefined;
  for (const oldField of OLD_QUESTION_FIELDS) {
    if (oldField in value) {
      errors.push({
        index,
        id,
        field: oldField,
        message: `${oldField} belongs to an old question table shape and is not accepted.`
      });
    }
  }

  const recordId = requiredString(value.id, "id", errors, index, id);
  const prompt = requiredString(value.prompt, "prompt", errors, index, id);

  if (!isQuestionType(value.question_type)) {
    errors.push({
      index,
      id,
      field: "question_type",
      message: "question_type must be knowledge, map-click, or route-drawing."
    });
  }

  let status: QuestionStatus = "draft";
  if (value.status !== undefined && value.status !== null) {
    if (isQuestionStatus(value.status)) {
      status = value.status;
    } else {
      errors.push({
        index,
        id,
        field: "status",
        message: "status must be draft, published, or archived."
      });
    }
  }

  let difficulty: QuestionDifficulty | null = null;
  if (value.difficulty !== undefined && value.difficulty !== null) {
    if (isQuestionDifficulty(value.difficulty)) {
      difficulty = value.difficulty;
    } else {
      errors.push({
        index,
        id,
        field: "difficulty",
        message: "difficulty must be easy, medium, or hard when provided."
      });
    }
  }

  const payload = isPlainObject(value.payload) ? value.payload : null;
  if (!payload) {
    errors.push({
      index,
      id,
      field: "payload",
      message: "payload must be an object shaped for the question type."
    });
  }

  let sanitizedPayload: Json = {};
  if (payload && value.question_type === "knowledge") {
    sanitizedPayload = validateKnowledgePayload(payload, errors, index, id);
  } else if (payload && value.question_type === "map-click") {
    sanitizedPayload = validateMapClickPayload(payload, errors, index, id);
  } else if (payload && value.question_type === "route-drawing") {
    sanitizedPayload = validateRoutePayload(payload, errors, index, id);
  }

  if (errors.length > 0 || !isQuestionType(value.question_type)) {
    return { record: null, errors };
  }

  const publishedAt =
    status === "published"
      ? optionalString(value.published_at) ?? new Date().toISOString()
      : null;

  return {
    record: {
      id: recordId,
      question_type: value.question_type,
      status,
      difficulty,
      category: optionalString(value.category),
      prompt,
      explanation: optionalString(value.explanation),
      tip: optionalString(value.tip),
      tags: stringArray(value.tags, "tags", errors, index, recordId),
      payload: sanitizedPayload,
      version:
        typeof value.version === "number" &&
        Number.isInteger(value.version) &&
        value.version > 0
          ? value.version
          : 1,
      source: optionalString(value.source) ?? "admin-import",
      published_at: publishedAt
    },
    errors
  };
}

export function parseQuestionImportJson(rawJson: string): {
  items: unknown[];
  rootErrors: QuestionImportValidationError[];
} {
  if (!rawJson.trim()) {
    return {
      items: [],
      rootErrors: [
        {
          index: -1,
          field: "json",
          message: "Paste JSON or choose a JSON file before previewing."
        }
      ]
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      items: [],
      rootErrors: [
        {
          index: -1,
          field: "json",
          message: "Import JSON could not be parsed."
        }
      ]
    };
  }

  if (Array.isArray(parsed)) {
    return { items: parsed, rootErrors: [] };
  }

  if (!isPlainObject(parsed)) {
    return {
      items: [],
      rootErrors: [
        {
          index: -1,
          field: "json",
          message: "Import JSON must be an array or a TopoPass export object."
        }
      ]
    };
  }

  for (const oldKey of OLD_TABLE_KEYS) {
    if (oldKey in parsed) {
      return {
        items: [],
        rootErrors: [
          {
            index: -1,
            field: oldKey,
            message: `${oldKey} is an old or unsupported table shape. Import question_bank_items instead.`
          }
        ]
      };
    }
  }

  if (Array.isArray(parsed.question_bank_items)) {
    return { items: parsed.question_bank_items, rootErrors: [] };
  }

  return {
    items: [],
    rootErrors: [
      {
        index: -1,
        field: "question_bank_items",
        message: "Import object must include a question_bank_items array."
      }
    ]
  };
}

export function previewQuestionImport(rawJson: string): QuestionImportPreview {
  const { items, rootErrors } = parseQuestionImportJson(rawJson);
  const validRecords: QuestionImportRecord[] = [];
  const errors = [...rootErrors];

  if (rootErrors.length === 0) {
    items.forEach((item, index) => {
      const result = validateQuestionRecord(item, index);
      if (result.record && result.errors.length === 0) {
        validRecords.push(result.record);
      } else {
        errors.push(...result.errors);
      }
    });
  }

  return {
    validRecords,
    previewItems: validRecords.map((record) => ({
      id: record.id,
      questionType: record.question_type,
      status: record.status ?? "draft",
      prompt: record.prompt
    })),
    errors
  };
}

export function createQuestionBankExport(
  rows: QuestionExportRecord[],
  statusFilter: QuestionExportStatusFilter
): QuestionBankExport {
  return {
    format: "topopass-question-bank-items",
    version: 1,
    exportedAt: new Date().toISOString(),
    statusFilter,
    question_bank_items: rows
  };
}
