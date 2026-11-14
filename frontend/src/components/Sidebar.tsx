import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../services/api';
import { Library } from '../types';
import { useAuthStore } from '../stores/authStore';
import { IconChart, IconFilm, IconFolder, IconHome, IconList, IconMusic, IconSettings, IconTv } from './Icons';

const libraryIcon = (type: string) =>
  type === 'movie' ? <IconFilm /> : type === 'show' ? <IconTv /> : type === 'artist' ? <IconMusic /> : <IconFolder />;

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive ? 'bg-primary-500/15 text-primary-300 font-medium' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
  }`;

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [libraries, setLibraries] = useState<Library[] | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    api.getLibraries().then(setLibraries).catch(() => setLibraries([]));
  }, []);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col bg-dark-300 border-r border-white/5
          transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          paddingTop: 'calc(1rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
          paddingLeft: 'env(safe-area-inset-left)',
        }}
      >
        <NavLink to="/" onClick={onClose} className="flex items-center gap-2.5 px-5 pb-5">
          <img src="/icon-192.png" alt="" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold tracking-tight">Sanctuary Vacation</span>
        </NavLink>

        <nav className="flex-1 overflow-y-auto px-3 space-y-1" onClick={onClose}>
          <NavLink to="/" end className={linkClass}>
            <IconHome /> Accueil
          </NavLink>

          <div className="pt-5 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Bibliothèques</div>
          {libraries === null
            ? [0, 1, 2].map((i) => <div key={i} className="h-9 mx-1 rounded-lg bg-white/5 animate-pulse" />)
            : libraries.map((lib) => (
                <NavLink key={lib.key} to={`/library/${lib.key}`} className={linkClass}>
                  {libraryIcon(lib.type)} <span className="truncate">{lib.title}</span>
                </NavLink>
              ))}

          {user?.isAdmin && (
            <>
              <div className="pt-5 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Administration</div>
              <NavLink to="/admin/download-history" className={linkClass}>
                <IconChart /> Historique
              </NavLink>
              <NavLink to="/admin/logs" className={linkClass}>
                <IconList /> Journaux
              </NavLink>
              <NavLink to="/settings" className={linkClass}>
                <IconSettings /> Paramètres
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};
