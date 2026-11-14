import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { IconLogout, IconMenu, IconSearch, IconSettings } from './Icons';

export const Header: React.FC<{ onMenuClick?: () => void }> = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(location.pathname === '/search' ? params.get('q') || '' : '');
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // "/" focuses search, like most media apps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showMenu]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      inputRef.current?.blur();
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-dark/80 backdrop-blur px-3 md:px-8"
      style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
    >
      {onMenuClick && (
        <button onClick={onMenuClick} className="md:hidden p-2 -ml-1 rounded-lg hover:bg-white/5" aria-label="Menu">
          <IconMenu className="w-6 h-6" />
        </button>
      )}

      <form onSubmit={submit} className="flex-1 max-w-xl">
        <label className="relative block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <IconSearch className="w-4 h-4" />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && inputRef.current?.blur()}
            placeholder="Rechercher un film, une série, un album…"
            className="w-full rounded-full bg-white/5 border border-white/10 pl-9 pr-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:bg-white/10"
          />
          <kbd className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 border border-white/10 rounded px-1.5">/</kbd>
        </label>
      </form>

      <div className="relative ml-auto" ref={menuRef}>
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center gap-2 rounded-full p-1 md:pr-3 hover:bg-white/5"
          aria-label="Compte"
        >
          <span className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-semibold">
            {user?.username.charAt(0).toUpperCase()}
          </span>
          <span className="hidden md:block text-sm text-gray-300 max-w-[10rem] truncate">{user?.username}</span>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-dark-100 shadow-2xl py-1.5 z-50">
            {user?.isAdmin && (
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5"
              >
                <IconSettings className="w-4 h-4" /> Paramètres
              </button>
            )}
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5"
            >
              <IconLogout className="w-4 h-4" /> Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
