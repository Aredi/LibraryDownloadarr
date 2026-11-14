import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { MediaGrid } from '../components/MediaGrid';
import { IconSearch } from '../components/Icons';
import { api } from '../services/api';
import { Library, MediaItem } from '../types';

type SortKey = 'added' | 'title' | 'year';
const SORTS: Record<SortKey, { label: string; fn: (a: MediaItem, b: MediaItem) => number }> = {
  added: { label: 'Ajouts récents', fn: (a, b) => (b.addedAt || 0) - (a.addedAt || 0) },
  title: { label: 'Titre (A → Z)', fn: (a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base', numeric: true }) },
  year: { label: 'Année (récent d’abord)', fn: (a, b) => (b.year || 0) - (a.year || 0) },
};

// Ignore accents and case when filtering ("amelie" finds "Amélie")
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const LibraryView: React.FC = () => {
  const { libraryKey } = useParams<{ libraryKey: string }>();
  const [library, setLibrary] = useState<Library | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<SortKey>(() => (localStorage.getItem('library-sort') as SortKey) || 'added');

  useEffect(() => {
    if (!libraryKey) return;
    let cancelled = false;
    setIsLoading(true);
    setError('');
    setFilter('');
    (async () => {
      try {
        const libraries = await api.getLibraries();
        const current = libraries.find((l) => l.key === libraryKey) || null;
        const content = await api.getLibraryContent(libraryKey, current?.type === 'artist' ? 'albums' : undefined);
        if (!cancelled) {
          setLibrary(current);
          setMedia(content);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.error || 'Impossible de charger cette bibliothèque');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [libraryKey]);

  useEffect(() => localStorage.setItem('library-sort', sort), [sort]);

  const shown = useMemo(() => {
    const q = normalize(filter.trim());
    const list = q ? media.filter((m) => normalize(`${m.title} ${m.parentTitle || ''} ${m.year || ''}`).includes(q)) : media;
    return [...list].sort(SORTS[sort].fn);
  }, [media, filter, sort]);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate">{library?.title || (isLoading ? '' : 'Bibliothèque')}</h1>
          {!isLoading && (
            <p className="text-sm text-gray-400 mt-1">
              {filter ? `${shown.length} sur ${media.length}` : media.length} élément{media.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <label className="relative flex-1 md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrer…"
              className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
            aria-label="Trier par"
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k} className="bg-dark-100">
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <MediaGrid media={shown} isLoading={isLoading} emptyText={filter ? `Aucun résultat pour « ${filter} »` : undefined} />
    </Layout>
  );
};
