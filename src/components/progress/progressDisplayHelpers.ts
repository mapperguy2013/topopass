export function formatAttemptType(type: string | null | undefined) {
  if (type === "map-click") return "Map click";
  if (type === "route" || type === "route-drawing") return "Route practice";
  if (type === "mock-test") return "Mock exam";
  if (type === "knowledge") return "Knowledge";
  if (type === "sentence-completion") return "Sentence completion";
  if (type === "reading-comprehension") return "Reading comprehension";

  return "Practice";
}

function isRawSlug(value: string) {
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(value);
}

function sentenceCase(value: string) {
  const normalised = value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalised) return "";

  return normalised.charAt(0).toUpperCase() + normalised.slice(1);
}

export function formatAttemptTitle(
  title: string | null | undefined,
  type: string | null | undefined
) {
  const fallback = formatAttemptType(type);
  const trimmedTitle = title?.trim();

  if (!trimmedTitle) return fallback;
  if (type === "mock-test") return "Mock exam";
  if (trimmedTitle === "unknown-question") return fallback;

  return isRawSlug(trimmedTitle) ? sentenceCase(trimmedTitle) : trimmedTitle;
}
