import React, { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { api } from '../services/api';

export interface DownloadRequest {
  url: string; // api.getDownloadUrl & co, without credentials
  label: string; // shown to the user
  size?: number; // bytes, used for the big-download warning
  check?: { ratingKey: string; partKey: string }; // single file: ask the server first if it may be downloaded
}

interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'error';
}

interface DownloadContextType {
  /** Hands files to the browser's own download manager. Resolves false if nothing was started. */
  download: (requests: DownloadRequest[]) => Promise<boolean>;
  notify: (message: string, tone?: Toast['tone']) => void;
  toasts: Toast[];
  dismiss: (id: number) => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export const useDownloads = () => {
  const context = useContext(DownloadContext);
  if (!context) throw new Error('useDownloads must be used within a DownloadProvider');
  return context;
};

const BIG_DOWNLOAD = 20 * 1024 ** 3; // 20 Go

const triggerBrowserDownload = (url: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = ''; // filename comes from the server's Content-Disposition
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const DownloadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    (message: string, tone: Toast['tone'] = 'info') => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-3), { id, message, tone }]);
      setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 4500);
    },
    [dismiss]
  );

  const download = useCallback(
    async (requests: DownloadRequest[]) => {
      if (requests.length === 0) return false;
      const total = requests.reduce((s, r) => s + (r.size || 0), 0);
      if (total > BIG_DOWNLOAD) {
        const go = window.confirm(
          `Ce téléchargement fait ${(total / 1024 ** 3).toFixed(1)} Go. Ça peut prendre du temps.\n\nContinuer ?`
        );
        if (!go) return false;
      }

      // One short-lived ticket per file; the server also checks permissions here,
      // so refusals show up as a readable message instead of a failed browser download.
      const results = await Promise.allSettled(requests.map((r) => api.getDownloadTicket(r.check)));
      const started: string[] = [];
      results.forEach((result, i) => {
        const r = requests[i];
        if (result.status === 'fulfilled') {
          // Space out multiple files: browsers ignore several downloads fired in the same tick.
          setTimeout(() => triggerBrowserDownload(`${r.url}${r.url.includes('?') ? '&' : '?'}ticket=${result.value}`), started.length * 800);
          started.push(r.label);
        } else {
          const reason = (result.reason as any)?.response?.data?.error || 'Impossible de préparer le téléchargement.';
          notify(requests.length > 1 ? `${r.label} : ${reason}` : reason, 'error');
        }
      });

      if (started.length === 1) notify(`Téléchargement lancé : ${started[0]}`, 'success');
      if (started.length > 1) {
        notify(`${started.length} téléchargements lancés`, 'success');
        notify('Si ton navigateur le demande, autorise les téléchargements multiples.', 'info');
      }
      return started.length > 0;
    },
    [notify]
  );

  return (
    <DownloadContext.Provider value={{ download, notify, toasts, dismiss }}>{children}</DownloadContext.Provider>
  );
};
