// Builds a Content-Disposition header that survives accents and other non-ASCII
// characters (a raw `filename="Amélie.mkv"` makes Node throw or browsers mangle it).
export const contentDisposition = (filename: string): string => {
  const ascii = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]|["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
};
