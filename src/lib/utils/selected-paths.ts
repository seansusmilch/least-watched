export function normalizeFolderPath(
  path: string | null | undefined
): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  const looksWindowsLike =
    /^[A-Za-z]:[\\/]/.test(trimmed) || trimmed.startsWith('\\\\');
  const looksPosixLike = trimmed.startsWith('/');

  if (looksWindowsLike) {
    let normalized = trimmed.replaceAll('/', '\\');
    while (
      normalized.length > 1 &&
      normalized.endsWith('\\') &&
      !/^[A-Za-z]:\\$/.test(normalized)
    ) {
      normalized = normalized.slice(0, -1);
    }
    return normalized.toLowerCase();
  }

  if (looksPosixLike) {
    let normalized = trimmed.replaceAll('\\', '/');
    while (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }

  let normalized = trimmed.replaceAll('\\', '/');
  while (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized.toLowerCase();
}

export function uniqueNormalizedFolderPaths(
  paths: readonly string[] | null | undefined
): string[] {
  if (!paths || paths.length === 0) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of paths) {
    const normalized = normalizeFolderPath(raw);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(raw.trim());
  }

  return result;
}

export function countUniqueNormalizedFolderPaths(
  paths: readonly string[] | null | undefined
): number {
  if (!paths || paths.length === 0) return 0;
  const seen = new Set<string>();
  for (const raw of paths) {
    const normalized = normalizeFolderPath(raw);
    if (!normalized) continue;
    seen.add(normalized);
  }
  return seen.size;
}

export function countUniqueNonEmptyStrings(
  values: readonly string[] | null | undefined
): number {
  if (!values || values.length === 0) return 0;
  const seen = new Set<string>();
  for (const raw of values) {
    const v = raw.trim();
    if (!v) continue;
    seen.add(v);
  }
  return seen.size;
}

