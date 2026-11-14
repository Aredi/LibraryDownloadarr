import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { MediaCard } from '../components/MediaCard';
import { api } from '../services/api';
import { Library, MediaItem } from '../types';
import { useAuthStore } from '../stores/authStore';
import { formatBytes } from '../utils/format';

const Row: React.FC<{ title: string; to: string; items: MediaItem[] }> = ({ title, to, items }) => (
  <section className="mb-10">
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
      <Link to={to} className="text-sm text-primary-300 hover:text-primary-200">
        Tout voir →
      </Link>
    </div>
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-8 md:px-8 snap-x scroll-px-4 md:scroll-px-8 scrollbar-thin">
      {items.map((m) => (
        <div key={m.ratingKey} className="w-[120px] md:w-[150px] shrink-0 snap-start">
          <MediaCard media={m} />
        </div>
      ))}
    </div>
  </section>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [recent, setRecent] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<{ count?: number; total_size?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.getLibraries(),
      api.getRecentlyAdded(0, 24),
      user.isAdmin ? api.getDownloadStats().catch(() => null) : Promise.resolve(null),
    ])
      .then(([libs, media, s]) => {
        setLibraries(libs);
        setRecent(media);
        setStats(s);
      })
      .catch((e) => console.error('Failed to load dashboard', e))
      .finally(() => setIsLoading(false));
  }, [user]);

  const rows = libraries
    .map((lib) => ({ lib, items: recent.filter((m) => String(m.librarySectionID) === lib.key).slice(0, 24) }))
    .filter((r) => r.items.length > 0);

  return (
    <Layout>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Bonjour {user?.username} 👋</h1>
          <p className="text-sm text-gray-400 mt-1">Les derniers ajouts de chaque bibliothèque.</p>
        </div>
        {stats && (
          <Link
            to="/admin/download-history"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:border-primary-500/50"
          >
            <span className="text-gray-400">Téléchargements : </span>
            <span className="font-semibold">{stats.count || 0}</span>
            <span className="text-gray-500"> · {formatBytes(stats.total_size)}</span>
          </Link>
        )}
      </div>

      {isLoading ? (
        [0, 1].map((i) => (
          <div key={i} className="mb-10">
            <div className="h-5 w-40 rounded bg-white/5 animate-pulse mb-3" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="w-[120px] md:w-[150px] shrink-0 aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        ))
      ) : rows.length > 0 ? (
        rows.map(({ lib, items }) => <Row key={lib.key} title={lib.title} to={`/library/${lib.key}`} items={items} />)
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
          Aucun ajout récent. Vérifie la connexion au serveur Plex dans les paramètres.
        </div>
      )}
    </Layout>
  );
};
