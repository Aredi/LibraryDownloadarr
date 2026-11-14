import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { MediaGrid, GridSkeleton } from '../components/MediaGrid';
import { api } from '../services/api';
import { MediaItem } from '../types';

const GROUPS: { label: string; types: string[] }[] = [
  { label: 'Films', types: ['movie'] },
  { label: 'Séries', types: ['show'] },
  { label: 'Saisons', types: ['season'] },
  { label: 'Épisodes', types: ['episode'] },
  { label: 'Musique & livres audio', types: ['artist', 'album', 'track'] },
];

export const SearchResults: React.FC = () => {
  const [params] = useSearchParams();
  const query = (params.get('q') || '').trim();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query.length < 2) {
      setMedia([]);
      setError(query ? 'Tape au moins 2 caractères.' : '');
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError('');
    api
      .searchMedia(query)
      .then((r) => !cancelled && setMedia(r || []))
      .catch((err) => !cancelled && setError(err.response?.data?.error || 'La recherche a échoué'))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const known = GROUPS.flatMap((g) => g.types);
  const groups = [
    ...GROUPS.map((g) => ({ label: g.label, items: media.filter((m) => g.types.includes(m.type)) })),
    { label: 'Autres', items: media.filter((m) => !known.includes(m.type)) },
  ].filter((g) => g.items.length > 0);

  return (
    <Layout>
      <h1 className="text-2xl md:text-3xl font-bold mb-1">Recherche</h1>
      {query && <p className="text-sm text-gray-400 mb-6">Résultats pour « {query} »</p>}

      {error && <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      {isLoading ? (
        <GridSkeleton count={12} />
      ) : groups.length > 0 ? (
        groups.map((g) => (
          <section key={g.label} className="mb-10">
            <h2 className="text-lg font-semibold mb-3">
              {g.label} <span className="text-gray-500 font-normal text-sm">{g.items.length}</span>
            </h2>
            <MediaGrid media={g.items} />
          </section>
        ))
      ) : (
        !error && query && <div className="py-20 text-center text-gray-500">Aucun résultat pour « {query} »</div>
      )}
    </Layout>
  );
};
