import React from 'react';
import { useDownloads } from '../contexts/DownloadContext';
import { IconAlert, IconCheck, IconClose, IconDownload } from './Icons';

/** Small toast stack (bottom-right). Real progress is shown by the browser's download manager. */
export const DownloadManager: React.FC = () => {
  const { toasts, dismiss } = useDownloads();
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed right-4 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      role="status"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur bg-dark-100/95 text-sm animate-toast ${
            t.tone === 'error' ? 'border-red-500/40' : t.tone === 'success' ? 'border-emerald-500/30' : 'border-dark-50'
          }`}
        >
          <span className={t.tone === 'error' ? 'text-red-400' : t.tone === 'success' ? 'text-emerald-400' : 'text-primary-400'}>
            {t.tone === 'error' ? <IconAlert /> : t.tone === 'success' ? <IconDownload /> : <IconCheck />}
          </span>
          <span className="flex-1 text-gray-200">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-gray-500 hover:text-white" aria-label="Fermer">
            <IconClose className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
