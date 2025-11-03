'use client';

import { useEffect, useState } from 'react';
import { usePathname } from "react-router-dom";

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Disabilito temporaneamente il PageLoader per evitare conflitti
    setIsLoading(false);
  }, [pathname]);

  // Ritorno null per ora per evitare errori
  return null;
} 