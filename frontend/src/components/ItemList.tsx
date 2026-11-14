import React, { useEffect, useRef, useState } from 'react';
import { MediaItem } from '../types';
import { api } from '../services/api';
import { DownloadRequest } from '../contexts/DownloadContext';
import { firstPart, formatBytes, formatDate, formatDuration, itemSize, pad2, qualityLabel, episodeCode } from '../utils/format';
import { IconCheck, IconChevronDown, IconDownload } from './Icons';

export const requestFor = (item: MediaItem): DownloadRequest | null => {
  const part = firstPart(item);
  if (!part) return null;
  const label = item.type === 'episode' && item.grandparentTitle ? `${item.grandparentTitle} ${episodeCode(item)}` : item.title;
  return { url: api.getDownloadUrl(item.ratingKey, part.key), label, size: part.size };
};

const Checkbox: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: (shiftKey: boolean) => void; label: string }> = ({
  checked,
  indeterminate,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={indeterminate ? 'mixed' : checked}
    aria-label={label}
    onClick={(e) => {
      e.stopPropagation();
      onChange(e.shiftKey);
    }}
    className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center transition ${
      checked || indeterminate ? 'bg-primary-500 border-primary-500' : 'border-white/25 hover:border-white/50'
    }`}
  >
    {checked && <IconCheck className="w-3.5 h-3.5" />}
    {!checked && indeterminate && <span className="w-2.5 h-0.5 bg-white rounded" />}
  </button>
);

interface ItemListProps {
  items: MediaItem[];
  kind: 'episode' | 'track';
  canDownload: boolean;
  onDownload: (requests: DownloadRequest[]) => boolean;
  highlightKey?: string | null;
  /** Extra buttons on the right of the toolbar (e.g. "season as ZIP") */
  actions?: React.ReactNode;
}

/** Numbered episode/track list with multi-select and per-row download. */
export const ItemList: React.FC<ItemListProps> = ({ items, kind, canDownload, onDownload, highlightKey, actions }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(highlightKey || null);
  const highlightRef = useRef<HTMLLIElement>(null);

  useEffect(() => setSelected(new Set()), [items]);
  useEffect(() => {
    if (highlightKey) {
      setExpanded(highlightKey);
      setTimeout(() => highlightRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
    }
  }, [highlightKey, items]);

  const downloadable = items.filter((i) => firstPart(i));
  const selectedItems = downloadable.filter((i) => selected.has(i.ratingKey));
  const selectedSize = selectedItems.reduce((s, i) => s + itemSize(i), 0);
  const allSelected = downloadable.length > 0 && selectedItems.length === downloadable.length;

  const lastClicked = useRef<number | null>(null);

  // Shift+click selects every item between the last clicked one and this one
  const toggle = (index: number, shiftKey: boolean) => {
    const key = items[index].ratingKey;
    const anchor = lastClicked.current; // read now: the updater below runs later
    lastClicked.current = index;
    setSelected((prev) => {
      const next = new Set(prev);
      if (shiftKey && anchor !== null) {
        const [from, to] = [anchor, index].sort((a, b) => a - b);
        const select = !prev.has(key);
        items.slice(from, to + 1).forEach((i) => {
          if (!firstPart(i)) return;
          select ? next.add(i.ratingKey) : next.delete(i.ratingKey);
        });
      } else {
        next.has(key) ? next.delete(key) : next.add(key);
      }
      return next;
    });
  };

  const downloadSelection = () => {
    const ok = onDownload(selectedItems.map(requestFor).filter(Boolean) as DownloadRequest[]);
    if (ok) setSelected(new Set());
  };

  const word = kind === 'episode' ? 'épisode' : 'piste';

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-3 md:px-4 py-3 border-b border-white/10 bg-white/[0.03]">
        {canDownload && downloadable.length > 0 && (
          <Checkbox
            checked={allSelected}
            indeterminate={selectedItems.length > 0 && !allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(downloadable.map((i) => i.ratingKey)))}
            label="Tout sélectionner"
          />
        )}
        <span className="text-sm text-gray-400">
          {selectedItems.length > 0
            ? `${selectedItems.length} ${word}${selectedItems.length > 1 ? 's' : ''} sélectionné${selectedItems.length > 1 ? 's' : ''} · ${formatBytes(selectedSize)}`
            : `${items.length} ${word}${items.length > 1 ? 's' : ''}`}
          {canDownload && downloadable.length > 2 && (
            <span className="hidden lg:inline text-gray-600"> · Maj + clic pour sélectionner une plage</span>
          )}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {selectedItems.length > 0 ? (
            <button onClick={downloadSelection} className="btn-primary flex items-center gap-2 text-sm py-1.5">
              <IconDownload className="w-4 h-4" /> Télécharger la sélection
            </button>
          ) : (
            actions
          )}
        </div>
      </div>

      <ul className="divide-y divide-white/5">
        {items.map((item, index) => {
          const part = firstPart(item);
          const isOpen = expanded === item.ratingKey;
          const isSel = selected.has(item.ratingKey);
          const isHighlight = item.ratingKey === highlightKey;
          const meta = [
            kind === 'episode' ? formatDate(item.originallyAvailableAt) : null,
            formatDuration(item.duration),
            kind === 'episode' ? qualityLabel(item.Media?.[0]) : null,
          ].filter(Boolean);

          return (
            <li
              key={item.ratingKey}
              ref={isHighlight ? highlightRef : undefined}
              className={`transition-colors ${isSel ? 'bg-primary-500/10' : isHighlight ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}
            >
              <div
                className="flex items-center gap-3 px-3 md:px-4 py-2.5 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : item.ratingKey)}
              >
                {canDownload && part && <Checkbox checked={isSel} onChange={(shift) => toggle(index, shift)} label={`Sélectionner ${item.title}`} />}

                <span className="w-9 shrink-0 text-center font-mono text-sm font-semibold text-gray-400 tabular-nums">
                  {item.index !== undefined ? pad2(item.index) : '–'}
                </span>

                {kind === 'episode' && (
                  <div className="hidden sm:block w-28 aspect-video shrink-0 rounded overflow-hidden bg-white/5">
                    {item.thumb && (
                      <img src={api.getThumbnailUrl(item.ratingKey, item.thumb, 240)} alt="" loading="lazy" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-sm md:text-[15px] font-medium leading-snug line-clamp-1">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{meta.join(' · ')}</div>
                </div>

                <span className="hidden md:block w-20 text-right text-xs text-gray-400 tabular-nums">{part ? formatBytes(part.size) : ''}</span>

                {canDownload && part ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const r = requestFor(item);
                      if (r) onDownload([r]);
                    }}
                    className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-primary-500/80"
                    title={`Télécharger (${formatBytes(part.size)})`}
                    aria-label={`Télécharger ${item.title}`}
                  >
                    <IconDownload className="w-5 h-5" />
                  </button>
                ) : (
                  <span className="w-9" />
                )}

                {kind === 'episode' && (
                  <IconChevronDown className={`hidden sm:block w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                )}
              </div>

              {isOpen && kind === 'episode' && (
                <div className="px-4 pb-4 sm:pl-[10.5rem] text-sm text-gray-300 leading-relaxed">
                  {item.summary || <span className="text-gray-500">Pas de résumé.</span>}
                  {part && (
                    <div className="mt-2 text-xs text-gray-500 break-all">
                      {part.file.split('/').pop()} · {formatBytes(part.size)}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
