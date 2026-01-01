export function sanitizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function pickOverview(opts: {
  arrOverview: unknown;
  embyOverview: unknown;
}): string | undefined {
  return sanitizeText(opts.arrOverview) ?? sanitizeText(opts.embyOverview);
}
