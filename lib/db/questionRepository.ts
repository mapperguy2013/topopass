import {
  getAllQuestions,
  type AdminQuestion
} from "../admin/questionAdminHelpers.ts";
import type {
  QuestionDifficulty,
  QuestionStatus,
  TableInsert,
  TableRow
} from "./types.ts";
import { asPersistenceClient } from "./queryClient.ts";
import { getSupabaseClient } from "../supabaseClient.ts";
import type { KnowledgeQuestionData } from "../knowledgeQuestions.ts";
import type { MapClickQuestionData } from "../mapClickQuestions.ts";
import type { RouteQuestion } from "../../src/data/routeQuestions.ts";

export type QuestionRepositorySource = "supabase" | "static";

export type QuestionRepositoryResult = {
  source: QuestionRepositorySource;
  questions: AdminQuestion[];
};

export type QuestionRepositoryOptions = {
  client?: unknown | null;
};

type QuestionRow = TableRow<"questions">;
type QuestionInsert = TableInsert<"questions">;

function questionStatus(question: AdminQuestion): QuestionStatus {
  return question.type === "route"
    ? question.status
    : question.isActive
      ? "active"
      : "draft";
}

function questionDifficulty(question: AdminQuestion): QuestionDifficulty {
  return question.difficulty;
}

function questionCategory(question: AdminQuestion) {
  return question.type === "route"
    ? question.tags[0] ?? "Route planning"
    : question.category;
}

function questionTags(question: AdminQuestion) {
  return question.type === "route" ? question.tags : [question.category];
}

export function staticQuestionToDbInsert(
  question: AdminQuestion,
  bankId: string | null = null
): QuestionInsert {
  if (question.type === "knowledge") {
    return {
      id: question.id,
      bank_id: bankId,
      question_type: "knowledge",
      status: questionStatus(question),
      difficulty: questionDifficulty(question),
      category: questionCategory(question),
      prompt: question.prompt,
      explanation: question.explanation,
      tags: questionTags(question),
      source_note: question.sourceNote,
      payload: {
        options: question.options,
        correctAnswer: question.correctAnswer
      }
    };
  }

  if (question.type === "map-click") {
    return {
      id: question.id,
      bank_id: bankId,
      question_type: "map-click",
      status: questionStatus(question),
      difficulty: questionDifficulty(question),
      category: questionCategory(question),
      prompt: question.prompt,
      explanation: question.explanation,
      tags: questionTags(question),
      source_note: question.sourceNote,
      payload: {
        targetName: question.targetName,
        answer: question.answer,
        toleranceMeters: question.toleranceMeters
      }
    };
  }

  return {
    id: question.id,
    bank_id: bankId,
    question_type: "route-drawing",
    status: question.status,
    difficulty: question.difficulty,
    category: question.tags[0] ?? "Route planning",
    prompt: question.prompt,
    explanation: question.explanation,
    tags: question.tags,
    source_note: "Route question bank",
    payload: {
      title: question.title,
      fromLabel: question.fromLabel,
      toLabel: question.toLabel,
      from: question.from,
      to: question.to,
      acceptedRoute: question.acceptedRoute,
      mapArea: question.mapArea,
      mapBounds: question.mapBounds,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    }
  };
}

function payloadObject(row: QuestionRow) {
  return row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
    ? row.payload
    : {};
}

function stringArray(value: unknown) {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? value
    : [];
}

function coordinates(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const lat = (value as { lat?: unknown }).lat;
  const lng = (value as { lng?: unknown }).lng;
  return typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;
}

function mapBounds(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const bounds = value as {
    minX?: unknown;
    minY?: unknown;
    maxX?: unknown;
    maxY?: unknown;
  };
  return typeof bounds.minX === "number" &&
    typeof bounds.minY === "number" &&
    typeof bounds.maxX === "number" &&
    typeof bounds.maxY === "number"
    ? {
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY
      }
    : null;
}

function acceptedRoute(value: unknown): RouteQuestion["acceptedRoute"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const route = value as {
    geometry?: unknown;
    source?: unknown;
    coordinateSystem?: unknown;
    reviewed?: unknown;
  };
  const geometry =
    Array.isArray(route.geometry) &&
    route.geometry.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        typeof point[0] === "number" &&
        typeof point[1] === "number"
    )
      ? (route.geometry as [number, number][])
      : [];
  if (
    geometry.length === 0 ||
    (route.source !== "osrm" && route.source !== "manual" && route.source !== "stored")
  ) {
    return undefined;
  }
  return {
    geometry,
    source: route.source,
    coordinateSystem: route.coordinateSystem === "map" ? "map" : "map",
    reviewed: route.reviewed === true
  };
}

export function dbRowToStaticQuestion(row: QuestionRow): AdminQuestion | null {
  const payload = payloadObject(row);
  const common = {
    id: row.id,
    prompt: row.prompt,
    difficulty: row.difficulty ?? "medium",
    explanation: row.explanation ?? "",
    sourceNote: row.source_note ?? "Supabase question row"
  } as const;

  if (row.question_type === "knowledge") {
    const options = stringArray((payload as { options?: unknown }).options);
    const correctAnswer = (payload as { correctAnswer?: unknown }).correctAnswer;
    if (options.length < 2 || typeof correctAnswer !== "string") return null;
    return {
      ...common,
      type: "knowledge",
      options,
      correctAnswer,
      category: row.category ?? "Knowledge",
      isActive: row.status === "active"
    } satisfies KnowledgeQuestionData;
  }

  if (row.question_type === "map-click") {
    const answer = coordinates((payload as { answer?: unknown }).answer);
    const targetName = (payload as { targetName?: unknown }).targetName;
    const toleranceMeters = (payload as { toleranceMeters?: unknown }).toleranceMeters;
    if (!answer || typeof targetName !== "string" || typeof toleranceMeters !== "number") {
      return null;
    }
    return {
      ...common,
      type: "map-click",
      answer,
      toleranceMeters,
      targetName,
      category: row.category ?? "Location knowledge",
      isActive: row.status === "active"
    } satisfies MapClickQuestionData;
  }

  const from = coordinates((payload as { from?: unknown }).from);
  const to = coordinates((payload as { to?: unknown }).to);
  const bounds = mapBounds((payload as { mapBounds?: unknown }).mapBounds);
  const title = (payload as { title?: unknown }).title;
  const fromLabel = (payload as { fromLabel?: unknown }).fromLabel;
  const toLabel = (payload as { toLabel?: unknown }).toLabel;
  const mapArea = (payload as { mapArea?: unknown }).mapArea;
  if (
    !from ||
    !to ||
    !bounds ||
    typeof title !== "string" ||
    typeof fromLabel !== "string" ||
    typeof toLabel !== "string" ||
    typeof mapArea !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    title,
    prompt: row.prompt,
    fromLabel,
    toLabel,
    from,
    to,
    acceptedRoute: acceptedRoute((payload as { acceptedRoute?: unknown }).acceptedRoute),
    mapArea,
    mapBounds: bounds,
    difficulty: row.difficulty ?? "medium",
    status: row.status,
    tags: row.tags,
    explanation: row.explanation ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    type: "route"
  } satisfies AdminQuestion;
}

export async function readQuestions(
  options: QuestionRepositoryOptions = {}
): Promise<QuestionRepositoryResult> {
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    return { source: "static", questions: getAllQuestions() };
  }

  const { data, error } = await client
    .from("questions")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error || !data) {
    return { source: "static", questions: getAllQuestions() };
  }

  const rows = Array.isArray(data) ? (data as QuestionRow[]) : [];
  const questions = rows
    .map((row) => dbRowToStaticQuestion(row))
    .filter((question): question is AdminQuestion => Boolean(question));

  return questions.length > 0
    ? { source: "supabase", questions }
    : { source: "static", questions: getAllQuestions() };
}

export async function upsertQuestion(
  question: AdminQuestion,
  options: QuestionRepositoryOptions = {}
) {
  const client = asPersistenceClient(options.client ?? getSupabaseClient());
  if (!client) {
    return {
      source: "static" as const,
      persisted: false,
      reason: "Supabase is not configured; export JSON or commit source-bank changes."
    };
  }

  const { error } = await client
    .from("questions")
    .upsert(staticQuestionToDbInsert(question), { onConflict: "id" });

  return {
    source: "supabase" as const,
    persisted: !error,
    error: error?.message
  };
}
