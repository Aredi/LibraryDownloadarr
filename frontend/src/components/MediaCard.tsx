import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MediaItem } from '../types';
import { api } from '../services/api';
import { episodeCode } from '../utils/format';
import { IconFilm, IconMusic, IconTv } from './Icons';

/** Where a card should lead: episodes and seasons open their show, on the right season. */
export const mediaLink = (m: MediaItem): string => {
  if (m.type === 'episode' && m.grandparentRatingKey) {
    return `/media/${m.grandparentRatingKey}?saison=${m.parentRatingKey}&ep=${m.ratingKey}`;
  }
  if (m.type === 'season' && m.parentRatingKey) return `/media/${m.parentRatingKey}?saison=${m.ratingKey}`;
  return `/media/${m.ratingKey}`;
};

const placeholderIcon = (type: string) =>
  type === 'movie' ? <IconFilm className="w-10 h-10" /> : ['album', 'track', 'artist'].includes(type) ? <IconMusic className="w-10 h-10" /> : <IconTv className="w-10 h-10" />;

export const Poster: React.FC<{ media: MediaItem; path?: string; width?: number; className?: string; square?: boolean }> = ({
  media,
  path,
  width = 300,
  className = '',
  square,
}) => {
  const [failed, setFailed] = useState(false);
  const src = path || media.thumb;
  return (
    <div className={`relative overflow-hidden bg-white/5 ${square ? 'aspect-square' : 'aspect-[2/3]'} ${className}`}>
      {src && !failed ? (
        <img
          src={api.getThumbnailUrl(media.ratingKey, src, width)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-600">{placeholderIcon(media.type)}</div>
      )}
    </div>
  );
};

const cardText = (m: MediaItem): { title: string; subtitle: string } => {
  switch (m.type) {
    case 'episode':
      return { title: m.grandparentTitle || m.title, subtitle: `${episodeCode(m)} · ${m.title}` };
    case 'season':
      return { title: m.parentTitle || m.title, subtitle: m.title + (m.leafCount ? ` · ${m.leafCount} ép.` : '') };
    case 'show': {
      const bits = [m.year, m.childCount ? `${m.childCount} saison${m.childCount > 1 ? 's' : ''}` : null];
      return { title: m.title, subtitle: bits.filter(Boolean).join(' · ') };
    }
    case 'album':
      return { title: m.title, subtitle: [m.parentTitle, m.year].filter(Boolean).join(' · ') };
    case 'track':
      return { title: m.title, subtitle: [m.grandparentTitle, m.parentTitle].filter(Boolean).join(' · ') };
    default:
      return { title: m.title, subtitle: m.year ? String(m.year) : '' };
  }
};

export const MediaCard: React.FC<{ media: MediaItem }> = ({ media }) => {
  const { title, subtitle } = cardText(media);
  const square = ['album', 'track', 'artist'].includes(media.type);
  // Episodes use the show poster so the grid stays uniform
  const path = media.type === 'episode' ? media.grandparentThumb || media.parentThumb || media.thumb : undefined;

  return (
    <Link to={mediaLink(media)} className="group block focus:outline-none" title={title}>
      <div className="relative rounded-lg overflow-hidden ring-1 ring-white/5 transition group-hover:ring-2 group-hover:ring-primary-500 group-focus-visible:ring-2 group-focus-visible:ring-primary-400">
        <Poster media={media} path={path} square={square} />
        {media.type === 'episode' && (
          <span className="absolute top-2 left-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide">
            {episodeCode(media)}
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <div className="text-sm font-medium leading-tight line-clamp-1 group-hover:text-primary-300">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{subtitle}</div>}
      </div>
    </Link>
  );
};
