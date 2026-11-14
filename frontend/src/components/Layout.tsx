import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useMobileMenu } from '../hooks/useMobileMenu';

/** Shared page shell: sidebar on the left, header + scrollable content on the right. */
export const Layout: React.FC<{ children: React.ReactNode; padded?: boolean }> = ({ children, padded = true }) => {
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileMenu();
  return (
    <div className="h-[100dvh] flex overflow-hidden bg-dark">
      <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuClick={toggleMobileMenu} />
        <main id="main-scroll" className={`flex-1 overflow-y-auto ${padded ? 'px-4 py-5 md:px-8 md:py-8' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};
