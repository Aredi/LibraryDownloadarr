import { MediaItem, MediaPart } from '../types';

export const formatBytes = (bytes?: number | null): string => {
  if (!bytes) return '—';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: value < 10 ? 1 : 0 })} ${units[i]}`;
};

export const formatDuration = (ms?: number): string => {
  if (!ms) return '';
  const minutes = Math.round(ms / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
};

export const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const pad2 = (n?: number) => String(n ?? 0).padStart(2, '0');

export const episodeCode = (item: MediaItem): string =>
  item.parentIndex !== undefined ? `S${pad2(item.parentIndex)}E${pad2(item.index)}` : `E${pad2(item.index)}`;

const resolutionLabel = (res?: string) => {
  if (!res) return '';
  if (res === '4k') return '4K';
  if (/^\d+$/.test(res)) return `${res}p`;
  return res.toUpperCase();
};

/** "1080p · HEVC · 5.1" style summary of a file version. */
export const qualityLabel = (m?: MediaPart): string => {
  if (!m) return '';
  const channels = m.audioChannels ? (m.audioChannels === 6 ? '5.1' : m.audioChannels === 8 ? '7.1' : `${m.audioChannels}ch`) : '';
  return [resolutionLabel(m.videoResolution), m.videoCodec?.toUpperCase(), m.audioCodec?.toUpperCase(), channels]
    .filter(Boolean)
    .join(' · ');
};

export const firstPart = (item: MediaItem) => item.Media?.[0]?.Part?.[0];

export const itemSize = (item: MediaItem): number =>
  (item.Media || []).slice(0, 1).flatMap((m) => m.Part).reduce((sum, p) => sum + (p.size || 0), 0);

export const isDownloadBlocked = (item: MediaItem) =>
  item.allowSync === false || item.allowSync === 0 || item.allowSync === '0';
