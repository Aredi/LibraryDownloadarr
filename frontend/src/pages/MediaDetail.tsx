import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Poster } from '../components/MediaCard';
import { ItemList } from '../components/ItemList';
import { IconAlert, IconArchive, IconChevronLeft, IconDownload } from '../components/Icons';
import { api } from '../services/api';
import { MediaItem } from '../types';
import { useDownloads, DownloadRequest } from '../contexts/DownloadContext';
import { useAuthStore } from '../stores/authStore';
import { formatBytes, formatDate, formatDuration, isDownloadBlocked, itemSize, pad2, qualityLabel } from '../utils/format';

// ---------- Hero ----------

const Hero: React.FC<{ media: MediaItem; children?: React.ReactNode }> = ({ media, children }) => {
  const [showFull, setShowFull] = useState(false);
  const backdrop = media.art ? api.getThumbnailUrl(media.ratingKey, media.art, 1280, 720) : null;
  const square = media.type === 'album';
  const facts = [
    media.type === 'album' ? media.parentTitle : null,
    media.year,
    media.contentRating,
    media.type === 'movie' ? formatDuration(media.duration) : null,
    media.type === 'show' && media.childCount ? `${media.childCount} saison${media.childCount > 1 ? 's' : ''}` : null,
    media.type === 'show' && media.leafCount ? `${media.leafCount} épisodes` : null,
    media.rating ? `★ ${media.rating.toFixed(1)}` : null,
    media.studio,
  ].filter(Boolean);

  return (
    <div className="relative">
      {backdrop && (
        <div className="absolute inset-x-0 top-0 h-[22rem] md:h-[28rem] overflow-hidden -z-0">
          <img src={backdrop} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/70 to-dark/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark/80 to-transparent" />
        </div>
      )}
      <div className="relative px-4 md:px-8 pt-6 md:pt-12 pb-6">
        <div className="flex flex-col sm:flex-row gap-5 md:gap-8 sm:items-end">
          <div className={`${square ? 'w-40 md:w-56' : 'w-32 md:w-52'} shrink-0 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10`}>
            <Poster media={media} width={400} square={square} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-bold leading-tight">{media.title}</h1>
            {facts.length > 0 && <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-300">{facts.map((f, i) => <span key={i}>{f}</span>)}</div>}
            {media.Genre && media.Genre.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {media.Genre.map((g) => (
                  <span key={g.tag} className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-gray-300">
                    {g.tag}
                  </span>
                ))}
              </div>
            )}
            {children && <div className="mt-5 flex flex-wrap gap-2">{children}</div>}
          </div>
        </div>
        {media.summary && (
          <p
            onClick={() => setShowFull((v) => !v)}
            className={`mt-5 max-w-3xl text-sm md:text-[15px] text-gray-300 leading-relaxed cursor-pointer ${showFull ? '' : 'line-clamp-3'}`}
            title={showFull ? '' : 'Afficher tout'}
          >
            {media.summary}
          </p>
        )}
      </div>
    </div>
  );
};

const BlockedNotice = () => (
  <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
    <IconAlert className="w-5 h-5 shrink-0" /> Le téléchargement est désactivé pour ton compte sur ce serveur.
  </div>
);

// ---------- Movie ----------

const MovieVersions: React.FC<{ media: MediaItem; canDownload: boolean; onDownload: (r: DownloadRequest[]) => Promise<boolean> }> = ({
  media,
  canDownload,
  onDownload,
}) => {
  const versions = media.Media || [];
  if (versions.length <= 1) return null; // single version: the hero button is enough
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Versions disponibles</h2>
      <ul className="rounded-xl border border-white/10 divide-y divide-white/5 overflow-hidden">
        {versions.flatMap((v) =>
          v.Part.map((part) => (
            <li key={part.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{qualityLabel(v) || 'Version'}</div>
                <div className="text-xs text-gray-500 truncate">
                  {v.width}×{v.height} · {v.container?.toUpperCase()} · {part.file.split('/').pop()}
                </div>
              </div>
              <span className="text-sm text-gray-400 tabular-nums">{formatBytes(part.size)}</span>
              {canDownload && (
                <button
                  onClick={() => onDownload([{ url: api.getDownloadUrl(media.ratingKey, part.key), label: media.title, size: part.size, check: { ratingKey: media.ratingKey, partKey: part.key } }])}
                  className="btn-primary flex items-center gap-2 text-sm py-1.5"
                >
                  <IconDownload className="w-4 h-4" /> Télécharger
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
};

// ---------- Show ----------

const seasonLabel = (s: MediaItem) => (s.index === 0 ? s.title || 'Spéciaux' : `Saison ${s.index ?? ''}`.trim());

const SeasonBrowser: React.FC<{
  show: MediaItem;
  seasons: MediaItem[];
  canDownload: boolean;
  onDownload: (r: DownloadRequest[]) => Promise<boolean>;
}> = ({ show, seasons, canDownload, onDownload }) => {
  const [params, setParams] = useSearchParams();
  const [episodes, setEpisodes] = useState<Record<string, MediaItem[]>>({});
  const [loadError, setLoadError] = useState('');

  const defaultSeason = seasons.find((s) => (s.index ?? 0) >= 1) || seasons[0];
  const current = seasons.find((s) => s.ratingKey === params.get('saison')) || defaultSeason;
  const highlight = params.get('ep');

  useEffect(() => {
    if (!current || episodes[current.ratingKey]) return;
    setLoadError('');
    api
      .getEpisodes(current.ratingKey)
      .then((eps) => setEpisodes((prev) => ({ ...prev, [current.ratingKey]: eps })))
      .catch(() => setLoadError('Impossible de charger les épisodes.'));
  }, [current?.ratingKey]);

  if (!current) return <div className="text-gray-500">Aucune saison disponible.</div>;

  const list = episodes[current.ratingKey];
  const seasonSize = list?.reduce((s, e) => s + itemSize(e), 0) || 0;

  const downloadSeason = () =>
    onDownload([
      {
        url: api.getSeasonDownloadUrl(current.ratingKey),
        label: `${show.title} – ${seasonLabel(current)} (ZIP)`,
        size: seasonSize,
      },
    ]);

  return (
    <section>
      {/* Season tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0" role="tablist">
        {seasons.map((s) => {
          const active = s.ratingKey === current.ratingKey;
          return (
            <button
              key={s.ratingKey}
              role="tab"
              aria-selected={active}
              onClick={() => setParams({ saison: s.ratingKey }, { replace: true })}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${
                active ? 'bg-white text-black font-semibold' : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {seasonLabel(s)}
              {s.leafCount ? <span className={active ? 'text-black/50' : 'text-gray-500'}> · {s.leafCount}</span> : null}
            </button>
          );
        })}
      </div>

      {loadError && <div className="text-sm text-red-300 py-4">{loadError}</div>}

      {!list ? (
        <div className="rounded-xl border border-white/10 divide-y divide-white/5">
          {Array.from({ length: Math.min(current.leafCount || 6, 10) }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-white/[0.02]" />
          ))}
        </div>
      ) : (
        <ItemList
          items={list}
          kind="episode"
          canDownload={canDownload}
          onDownload={onDownload}
          highlightKey={highlight}
          actions={
            canDownload && list.length > 0 ? (
              <button onClick={downloadSeason} className="btn-secondary flex items-center gap-2 text-sm py-1.5" title="Toute la saison dans un seul fichier ZIP">
                <IconArchive className="w-4 h-4" /> Saison {pad2(current.index)} en ZIP · {formatBytes(seasonSize)}
              </button>
            ) : null
          }
        />
      )}
    </section>
  );
};

// ---------- Page ----------

export const MediaDetail: React.FC = () => {
  const { ratingKey } = useParams<{ ratingKey: string }>();
  const navigate = useNavigate();
  const { download } = useDownloads();
  const { user } = useAuthStore();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [children, setChildren] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ratingKey) return;
    let cancelled = false;
    setIsLoading(true);
    setError('');
    (async () => {
      try {
        const meta = await api.getMediaMetadata(ratingKey);
        // Seasons, episodes and tracks are shown inside their parent page
        if (meta.type === 'season' && meta.parentRatingKey) {
          return navigate(`/media/${meta.parentRatingKey}?saison=${meta.ratingKey}`, { replace: true });
        }
        if (meta.type === 'episode' && meta.grandparentRatingKey) {
          return navigate(`/media/${meta.grandparentRatingKey}?saison=${meta.parentRatingKey}&ep=${meta.ratingKey}`, { replace: true });
        }
        if (meta.type === 'track' && meta.parentRatingKey) {
          return navigate(`/media/${meta.parentRatingKey}`, { replace: true });
        }
        const kids = meta.type === 'show' ? await api.getSeasons(ratingKey) : meta.type === 'album' ? await api.getTracks(ratingKey) : [];
        if (!cancelled) {
          setMedia(meta);
          setChildren(kids);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Impossible de charger ce média');
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ratingKey]);

  if (isLoading) {
    return (
      <Layout padded={false}>
        <div className="px-4 md:px-8 pt-12 flex gap-8 items-end">
          <div className="w-32 md:w-52 aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-2/3 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-1/3 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !media) {
    return (
      <Layout>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error || 'Média introuvable'}</div>
      </Layout>
    );
  }

  const canDownload = !!user?.isAdmin || !isDownloadBlocked(media);
  const mainPart = media.Media?.[0]?.Part?.[0];
  const backTo = media.librarySectionID ? `/library/${media.librarySectionID}` : null;

  const downloadAllSeasons = () => {
    const eps = children.reduce((s, c) => s + (c.leafCount || 0), 0);
    if (!window.confirm(`Télécharger les ${children.length} saisons (${eps} épisodes) dans un seul ZIP, un dossier par saison ?`)) return;
    void download([{ url: api.getShowDownloadUrl(media.ratingKey), label: `${media.title} (ZIP)` }]);
  };

  return (
    <Layout padded={false}>
      {backTo && (
        <Link to={backTo} className="relative z-10 inline-flex items-center gap-1 mt-4 ml-3 md:ml-6 px-2 py-1 rounded text-sm text-gray-300 hover:text-white">
          <IconChevronLeft className="w-4 h-4" /> {media.librarySectionTitle || 'Bibliothèque'}
        </Link>
      )}

      <Hero media={media}>
        {canDownload && media.type === 'movie' && mainPart && (
          <button
            onClick={() => download([{ url: api.getDownloadUrl(media.ratingKey, mainPart.key), label: media.title, size: mainPart.size, check: { ratingKey: media.ratingKey, partKey: mainPart.key } }])}
            className="btn-primary flex items-center gap-2 px-5 py-2.5"
          >
            <IconDownload /> Télécharger
            <span className="opacity-70 font-normal">
              · {[qualityLabel(media.Media?.[0]).split(' · ')[0], formatBytes(mainPart.size)].filter(Boolean).join(' · ')}
            </span>
          </button>
        )}
        {canDownload && media.type === 'show' && children.length > 1 && (
          <button onClick={downloadAllSeasons} className="btn-secondary flex items-center gap-2">
            <IconArchive className="w-4 h-4" /> Toute la série en ZIP
          </button>
        )}
        {canDownload && media.type === 'album' && children.length > 0 && (
          <button
            onClick={() =>
              download([{ url: api.getAlbumDownloadUrl(media.ratingKey), label: `${media.title} (ZIP)`, size: children.reduce((s, t) => s + itemSize(t), 0) }])
            }
            className="btn-primary flex items-center gap-2 px-5 py-2.5"
          >
            <IconArchive /> Tout l’album en ZIP · {formatBytes(children.reduce((s, t) => s + itemSize(t), 0))}
          </button>
        )}
      </Hero>

      <div className="px-4 md:px-8 pb-12 space-y-8 max-w-6xl">
        {!canDownload && <BlockedNotice />}

        {media.type === 'movie' && <MovieVersions media={media} canDownload={canDownload} onDownload={download} />}
        {media.type === 'movie' && media.originallyAvailableAt && (
          <p className="text-xs text-gray-500">Sortie : {formatDate(media.originallyAvailableAt)}</p>
        )}

        {media.type === 'show' && <SeasonBrowser show={media} seasons={children} canDownload={canDownload} onDownload={download} />}

        {media.type === 'album' && <ItemList items={children} kind="track" canDownload={canDownload} onDownload={download} />}

        {!['movie', 'show', 'album'].includes(media.type) && mainPart && canDownload && (
          <button
            onClick={() => download([{ url: api.getDownloadUrl(media.ratingKey, mainPart.key), label: media.title, size: mainPart.size, check: { ratingKey: media.ratingKey, partKey: mainPart.key } }])}
            className="btn-primary flex items-center gap-2"
          >
            <IconDownload /> Télécharger · {formatBytes(mainPart.size)}
          </button>
        )}
      </div>
    </Layout>
  );
};
