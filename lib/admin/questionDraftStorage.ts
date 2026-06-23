export function cloneDraftBank<T>(items: T[]) {
  return JSON.parse(JSON.stringify(items)) as T[];
}

export function loadDraftBank<T>(storageKey: string) {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

export function saveDraftBank<T>(storageKey: string, items: T[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(items));
}

export function clearDraftBank(storageKey: string) {
  window.localStorage.removeItem(storageKey);
}

export function exportDraftBank(filename: string, items: unknown[]) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(items, null, 2)], { type: "application/json" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
