/**
 * useColorSystem Hook
 * Intelligent color palette generation, manipulation, and WCAG contrast checking
 */

import { useMemo, useCallback } from 'react';
import { ColorPaletteOptions, ContrastCheckResult } from '../../../../types/theme';

interface ColorShades {
  base: string;
  lighter: string[];
  darker: string[];
}

interface ColorHarmony {
  complementary: string;
  analogous: [string, string];
  triadic: [string, string];
  tetradic: [string, string, string];
}

interface UseColorSystemReturn {
  generateShades: (baseColor: string, count?: number) => ColorShades;
  generateHarmony: (baseColor: string) => ColorHarmony;
  checkContrast: (foreground: string, background: string) => ContrastCheckResult;
  hexToRgb: (hex: string) => { r: number; g: number; b: number } | null;
  rgbToHex: (r: number, g: number, b: number) => string;
  hslToRgb: (h: number, s: number, l: number) => { r: number; g: number; b: number };
  rgbToHsl: (r: number, g: number, b: number) => { h: number; s: number; l: number };
  lighten: (color: string, amount: number) => string;
  darken: (color: string, amount: number) => string;
  adjustSaturation: (color: string, amount: number) => string;
  isValidColor: (color: string) => boolean;
}

export function useColorSystem(): UseColorSystemReturn {
  /**
   * Convert hex to RGB
   */
  const hexToRgb = useCallback((hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }, []);

  /**
   * Convert RGB to hex
   */
  const rgbToHex = useCallback((r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map((x) => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }, []);

  /**
   * Convert RGB to HSL
   */
  const rgbToHsl = useCallback((r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }, []);

  /**
   * Convert HSL to RGB
   */
  const hslToRgb = useCallback((h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }, []);

  /**
   * Lighten a color
   */
  const lighten = useCallback(
    (color: string, amount: number): string => {
      const rgb = hexToRgb(color);
      if (!rgb) return color;

      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      hsl.l = Math.min(100, hsl.l + amount);

      const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    },
    [hexToRgb, rgbToHsl, hslToRgb, rgbToHex]
  );

  /**
   * Darken a color
   */
  const darken = useCallback(
    (color: string, amount: number): string => {
      const rgb = hexToRgb(color);
      if (!rgb) return color;

      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      hsl.l = Math.max(0, hsl.l - amount);

      const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    },
    [hexToRgb, rgbToHsl, hslToRgb, rgbToHex]
  );

  /**
   * Adjust saturation
   */
  const adjustSaturation = useCallback(
    (color: string, amount: number): string => {
      const rgb = hexToRgb(color);
      if (!rgb) return color;

      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      hsl.s = Math.max(0, Math.min(100, hsl.s + amount));

      const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    },
    [hexToRgb, rgbToHsl, hslToRgb, rgbToHex]
  );

  /**
   * Generate color shades (lighter and darker)
   */
  const generateShades = useCallback(
    (baseColor: string, count: number = 5): ColorShades => {
      const lighter: string[] = [];
      const darker: string[] = [];

      for (let i = 1; i <= count; i++) {
        const lightAmount = (i / count) * 40; // Up to 40% lighter
        const darkAmount = (i / count) * 40; // Up to 40% darker

        lighter.push(lighten(baseColor, lightAmount));
        darker.push(darken(baseColor, darkAmount));
      }

      return { base: baseColor, lighter, darker };
    },
    [lighten, darken]
  );

  /**
   * Generate color harmony (complementary, analogous, triadic, tetradic)
   */
  const generateHarmony = useCallback(
    (baseColor: string): ColorHarmony => {
      const rgb = hexToRgb(baseColor);
      if (!rgb) {
        return {
          complementary: baseColor,
          analogous: [baseColor, baseColor],
          triadic: [baseColor, baseColor],
          tetradic: [baseColor, baseColor, baseColor],
        };
      }

      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

      // Complementary: opposite on color wheel (180°)
      const compHue = (hsl.h + 180) % 360;
      const complementary = rgbToHex(...Object.values(hslToRgb(compHue, hsl.s, hsl.l)));

      // Analogous: ±30° on color wheel
      const analog1Hue = (hsl.h + 30) % 360;
      const analog2Hue = (hsl.h - 30 + 360) % 360;
      const analogous: [string, string] = [
        rgbToHex(...Object.values(hslToRgb(analog1Hue, hsl.s, hsl.l))),
        rgbToHex(...Object.values(hslToRgb(analog2Hue, hsl.s, hsl.l))),
      ];

      // Triadic: 120° apart
      const triad1Hue = (hsl.h + 120) % 360;
      const triad2Hue = (hsl.h + 240) % 360;
      const triadic: [string, string] = [
        rgbToHex(...Object.values(hslToRgb(triad1Hue, hsl.s, hsl.l))),
        rgbToHex(...Object.values(hslToRgb(triad2Hue, hsl.s, hsl.l))),
      ];

      // Tetradic: 90° apart
      const tetra1Hue = (hsl.h + 90) % 360;
      const tetra2Hue = (hsl.h + 180) % 360;
      const tetra3Hue = (hsl.h + 270) % 360;
      const tetradic: [string, string, string] = [
        rgbToHex(...Object.values(hslToRgb(tetra1Hue, hsl.s, hsl.l))),
        rgbToHex(...Object.values(hslToRgb(tetra2Hue, hsl.s, hsl.l))),
        rgbToHex(...Object.values(hslToRgb(tetra3Hue, hsl.s, hsl.l))),
      ];

      return { complementary, analogous, triadic, tetradic };
    },
    [hexToRgb, rgbToHsl, hslToRgb, rgbToHex]
  );

  /**
   * Calculate relative luminance (WCAG formula)
   */
  const getLuminance = useCallback((r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }, []);

  /**
   * Check WCAG contrast ratio between two colors
   */
  const checkContrast = useCallback(
    (foreground: string, background: string): ContrastCheckResult => {
      const fgRgb = hexToRgb(foreground);
      const bgRgb = hexToRgb(background);

      if (!fgRgb || !bgRgb) {
        return { ratio: 1, levelAA: false, levelAAA: false, rating: 'fail' };
      }

      const fgLum = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
      const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

      const lighter = Math.max(fgLum, bgLum);
      const darker = Math.min(fgLum, bgLum);
      const ratio = (lighter + 0.05) / (darker + 0.05);

      const levelAA = ratio >= 4.5; // WCAG AA for normal text
      const levelAAA = ratio >= 7; // WCAG AAA for normal text

      let rating: 'fail' | 'AA' | 'AAA' = 'fail';
      if (levelAAA) rating = 'AAA';
      else if (levelAA) rating = 'AA';

      return { ratio: Math.round(ratio * 100) / 100, levelAA, levelAAA, rating };
    },
    [hexToRgb, getLuminance]
  );

  /**
   * Validate if a string is a valid color
   */
  const isValidColor = useCallback((color: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(color);
  }, []);

  return {
    generateShades,
    generateHarmony,
    checkContrast,
    hexToRgb,
    rgbToHex,
    hslToRgb,
    rgbToHsl,
    lighten,
    darken,
    adjustSaturation,
    isValidColor,
  };
}
