import React from 'react';
import { AppleStyleDock } from './core/AppleStyleDock';
import GradualBlur from './GradualBlur';

/**
 * GlobalUI Component
 * 
 * Questo componente contiene tutti i componenti UI globali che devono essere
 * visualizzati su tutte le pagine dell'applicazione:
 * - AppleStyleDock: Dock di navigazione in basso al centro
 * - GradualBlur: Effetto blur graduale in basso
 */
export default function GlobalUI() {
  return (
    <>
      <AppleStyleDock />
      <GradualBlur
        position="bottom"
        target="page"
        exponential={true}
        strength={1}
        divCount={10}
        opacity={1}
      />
    </>
  );
}

