import React from 'react';
import Navbar from './Navbar';

interface PageWithNavbarProps {
  children: React.ReactNode;
}

/**
 * Wrapper component che aggiunge automaticamente la Navbar e il padding-top necessario
 * per evitare che la navbar copra il contenuto
 */
export default function PageWithNavbar({ children }: PageWithNavbarProps) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
}

