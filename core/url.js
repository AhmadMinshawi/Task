export function normalizeOptionalUrl(value, field = 'link') {
  const text = String(value ?? '').trim();
  if (!text) return '';
  let url;
  try { url = new URL(text); } catch { throw new Error(`Invalid ${field}`); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Invalid ${field}`);
  return url.href;
}
