import type {
  CuratedTrainingRouteMetadata,
  CuratedTrainingRouteStatus
} from "./curatedTrainingRoutes.ts";

export type CuratedTrainingRouteSaveMode = "working-draft" | "review-candidate" | "complete-route";

export type CuratedTrainingRouteLifecycleStage = "authoring" | "draft" | "review" | "complete";

export const CURATED_TRAINING_ROUTE_SAVE_MODE_LABELS: Record<CuratedTrainingRouteSaveMode, string> = {
  "working-draft": "Save working draft",
  "review-candidate": "Save review candidate",
  "complete-route": "Save complete route"
};

export const CURATED_TRAINING_ROUTE_SAVE_MODE_DIRECTORIES: Record<CuratedTrainingRouteSaveMode, string> = {
  "working-draft": "data/training-routes/drafts",
  "review-candidate": "data/training-routes/review",
  "complete-route": "data/training-routes/complete"
};

const GENERIC_ROUTE_IDS = new Set(["curated-training-route", "curated-training-route-draft"]);

export function slugifyCuratedTrainingRouteValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isGenericCuratedTrainingRouteId(routeId: string | null | undefined): boolean {
  const slug = slugifyCuratedTrainingRouteValue(routeId ?? "");

  return slug.length === 0 || GENERIC_ROUTE_IDS.has(slug);
}

export function suggestCuratedTrainingRouteId(metadata: Pick<
  CuratedTrainingRouteMetadata,
  "area" | "difficulty" | "exerciseType" | "title"
>): string {
  const slugParts = [
    slugifyCuratedTrainingRouteValue(metadata.area),
    slugifyCuratedTrainingRouteValue(metadata.difficulty),
    slugifyCuratedTrainingRouteValue(metadata.exerciseType),
    slugifyCuratedTrainingRouteValue(cleanRouteTitle(metadata.title))
  ].filter(Boolean);

  return slugParts.join("-").slice(0, 120) || "curated-training-route";
}

export function effectiveCuratedTrainingRouteId(metadata: Pick<
  CuratedTrainingRouteMetadata,
  "routeId" | "area" | "difficulty" | "exerciseType" | "title"
>): string {
  return isGenericCuratedTrainingRouteId(metadata.routeId)
    ? suggestCuratedTrainingRouteId(metadata)
    : slugifyCuratedTrainingRouteValue(metadata.routeId);
}

export function curatedTrainingRouteFilename(input: {
  metadata: Pick<CuratedTrainingRouteMetadata, "area" | "difficulty" | "exerciseType" | "title">;
  saveMode: CuratedTrainingRouteSaveMode;
}): string {
  const baseSlug = suggestCuratedTrainingRouteId(input.metadata);
  const draftSuffix = input.saveMode === "working-draft" ? "-draft" : "";

  return `${baseSlug}${draftSuffix}.json`;
}

export function curatedTrainingRouteRelativePath(input: {
  metadata: Pick<CuratedTrainingRouteMetadata, "area" | "difficulty" | "exerciseType" | "title">;
  saveMode: CuratedTrainingRouteSaveMode;
}): string {
  return `${CURATED_TRAINING_ROUTE_SAVE_MODE_DIRECTORIES[input.saveMode]}/${curatedTrainingRouteFilename(input)}`;
}

export function statusForCuratedTrainingRouteSaveMode(input: {
  saveMode: CuratedTrainingRouteSaveMode;
  status: CuratedTrainingRouteStatus | unknown;
}): CuratedTrainingRouteStatus {
  if (input.saveMode === "complete-route") {
    return input.status === "beta" || input.status === "approved" || input.status === "draft"
      ? input.status
      : "draft";
  }

  return "draft";
}

export function lifecycleStageForCuratedTrainingRouteSaveMode(
  saveMode: CuratedTrainingRouteSaveMode
): CuratedTrainingRouteLifecycleStage {
  if (saveMode === "complete-route") {
    return "complete";
  }

  if (saveMode === "review-candidate") {
    return "review";
  }

  return "draft";
}

export function normaliseCuratedTrainingRouteSaveMode(value: unknown): CuratedTrainingRouteSaveMode {
  if (value === "review-candidate" || value === "complete-route" || value === "working-draft") {
    return value;
  }

  if (value === "validated-draft") {
    return "review-candidate";
  }

  return "working-draft";
}

function cleanRouteTitle(title: string): string {
  const cleaned = title
    .replace(/\bcurated\b/gi, " ")
    .replace(/\btraining\b/gi, " ")
    .replace(/\broute\b/gi, " ")
    .replace(/\bdraft\b/gi, " ")
    .replace(/\buntitled\b/gi, " ")
    .trim();

  return cleaned || "route";
}
