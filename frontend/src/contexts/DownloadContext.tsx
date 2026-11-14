import React, { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';

export interface DownloadRequest {
  url: string; // already authenticated (see api.getDownloadUrl & co)
  label: string; // shown to the user
  size?: number; // bytes, used for the big-download warning
}

interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'error';
}

interface DownloadContextType {
  /** Hands files to the browser's own download manager. Returns false if the user cancelled. */
  download: (requests: DownloadRequest[]) => boolean;
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
    (requests: DownloadRequest[]) => {
      if (requests.length === 0) return false;
      const total = requests.reduce((s, r) => s + (r.size || 0), 0);
      if (total > BIG_DOWNLOAD) {
        const go = window.confirm(
          `Ce téléchargement fait ${(total / 1024 ** 3).toFixed(1)} Go. Ça peut prendre du temps.\n\nContinuer ?`
        );
        if (!go) return false;
      }

      // Space out multiple files: browsers ignore several downloads fired in the same tick.
      requests.forEach((r, i) => setTimeout(() => triggerBrowserDownload(r.url), i * 800));

      notify(
        requests.length === 1
          ? `Téléchargement lancé : ${requests[0].label}`
          : `${requests.length} téléchargements lancés`,
        'success'
      );
      if (requests.length > 1) {
        notify('Si ton navigateur le demande, autorise les téléchargements multiples.', 'info');
      }
      return true;
    },
    [notify]
  );

  return (
    <DownloadContext.Provider value={{ download, notify, toasts, dismiss }}>{children}</DownloadContext.Provider>
  );
};
