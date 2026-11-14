import React from 'react';

type IconProps = { className?: string };
const make = (path: React.ReactNode) => ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

export const IconHome = make(<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />);
export const IconFilm = make(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" /></>);
export const IconTv = make(<><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M8 3l4 3 4-3" /></>);
export const IconMusic = make(<><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>);
export const IconFolder = make(<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />);
export const IconSearch = make(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>);
export const IconDownload = make(<path d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14" />);
export const IconChart = make(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />);
export const IconList = make(<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />);
export const IconSettings = make(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>);
export const IconMenu = make(<path d="M4 6h16M4 12h16M4 18h16" />);
export const IconClose = make(<path d="M18 6L6 18M6 6l12 12" />);
export const IconLogout = make(<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />);
export const IconChevronDown = make(<path d="M6 9l6 6 6-6" />);
export const IconChevronLeft = make(<path d="M15 18l-6-6 6-6" />);
export const IconCheck = make(<path d="M5 13l4 4L19 7" />);
export const IconArchive = make(<><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" /></>);
export const IconAlert = make(<><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>);
