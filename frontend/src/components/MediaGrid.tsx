import React, { useEffect, useRef, useState } from 'react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';

const PAGE = 90;

export const GRID_CLASSES = 'grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-6';

export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 18 }) => (
  <div className={GRID_CLASSES}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i}>
        <div className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
        <div className="h-3 mt-2 w-3/4 rounded bg-white/5 animate-pulse" />
      </div>
    ))}
  </div>
);

/** Poster grid that renders progressively, so libraries with thousands of items stay fast. */
export const MediaGrid: React.FC<{ media: MediaItem[]; isLoading?: boolean; emptyText?: string }> = ({
  media,
  isLoading,
  emptyText = 'Rien à afficher ici.',
}) => {
  const [visible, setVisible] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => setVisible(PAGE), [media]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setVisible((v) => v + PAGE),
      { rootMargin: '800px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [media, visible]);

  if (isLoading) return <GridSkeleton />;
  if (media.length === 0) return <div className="py-20 text-center text-gray-500">{emptyText}</div>;

  return (
    <>
      <div className={GRID_CLASSES}>
        {media.slice(0, visible).map((item) => (
          <MediaCard key={item.ratingKey} media={item} />
        ))}
      </div>
      {visible < media.length && <div ref={sentinel} className="h-10" />}
    </>
  );
};
