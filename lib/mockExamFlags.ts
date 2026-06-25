export function normalizeFlaggedQuestionIds(
  flaggedQuestionIds: unknown,
  validQuestionIds?: string[]
) {
  const validQuestionIdSet = validQuestionIds
    ? new Set(validQuestionIds)
    : null;
  const seen = new Set<string>();

  if (!Array.isArray(flaggedQuestionIds)) return [];

  return flaggedQuestionIds.filter((questionId): questionId is string => {
    if (typeof questionId !== "string" || !questionId.trim()) return false;
    if (validQuestionIdSet && !validQuestionIdSet.has(questionId)) return false;
    if (seen.has(questionId)) return false;
    seen.add(questionId);
    return true;
  });
}

export function isMockQuestionFlagged(
  flaggedQuestionIds: string[],
  questionId: string
) {
  return flaggedQuestionIds.includes(questionId);
}

export function toggleMockQuestionFlag(
  flaggedQuestionIds: string[],
  questionId: string
) {
  if (isMockQuestionFlagged(flaggedQuestionIds, questionId)) {
    return flaggedQuestionIds.filter((id) => id !== questionId);
  }

  return [...flaggedQuestionIds, questionId];
}
