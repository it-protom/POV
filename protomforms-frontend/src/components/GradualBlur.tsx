// Component added by Ansh - github.com/ansh-dhanani

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as math from 'mathjs';
import './GradualBlur.css';

const DEFAULT_CONFIG = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: '0.3s',
  easing: 'ease-out',
  opacity: 1,
  curve: 'linear',
  responsive: false,
  target: 'parent',
  className: '',
  style: {},
  darken: 0.05 // Intensità dello scurimento (0-1, default 0.05 = 5% di scurimento)
};

const PRESETS = {
  top: { position: 'top', height: '6rem' },
  bottom: { position: 'bottom', height: '6rem' },
  left: { position: 'left', height: '6rem' },
  right: { position: 'right', height: '6rem' },
  subtle: { height: '4rem', strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
  smooth: { height: '8rem', curve: 'bezier', divCount: 10 },
  sharp: { height: '5rem', curve: 'linear', divCount: 4 },
  header: { position: 'top', height: '8rem', curve: 'ease-out' },
  footer: { position: 'bottom', height: '8rem', curve: 'ease-out' },
  sidebar: { position: 'left', height: '6rem', strength: 2.5 },
  'page-header': { position: 'top', height: '10rem', target: 'page', strength: 3 },
  'page-footer': { position: 'bottom', height: '10rem', target: 'page', strength: 3 }
};

const CURVE_FUNCTIONS: Record<string, (p: number) => number> = {
  linear: p => p,
  bezier: p => p * p * (3 - 2 * p),
  'ease-in': p => p * p,
  'ease-out': p => 1 - Math.pow(1 - p, 2),
  'ease-in-out': p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)
};

interface GradualBlurConfig {
  position?: 'top' | 'bottom' | 'left' | 'right';
  strength?: number;
  height?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  animated?: boolean | 'scroll';
  duration?: string;
  easing?: string;
  opacity?: number;
  curve?: 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out';
  responsive?: boolean;
  target?: 'parent' | 'page';
  className?: string;
  style?: React.CSSProperties;
  preset?: keyof typeof PRESETS;
  hoverIntensity?: number;
  onAnimationComplete?: () => void;
  width?: string;
  mobileHeight?: string;
  tabletHeight?: string;
  desktopHeight?: string;
  mobileWidth?: string;
  tabletWidth?: string;
  desktopWidth?: string;
  darken?: number; // Intensità dello scurimento (0-1)
}

const mergeConfigs = (...configs: Partial<GradualBlurConfig>[]): GradualBlurConfig =>
  configs.reduce((acc, c) => ({ ...acc, ...c }), {} as GradualBlurConfig);

const getGradientDirection = (position: string): string =>
  ({
    top: 'to top',
    bottom: 'to bottom',
    left: 'to left',
    right: 'to right'
  }[position] || 'to bottom');

const debounce = <T extends (...args: any[]) => any>(fn: T, wait: number) => {
  let t: ReturnType<typeof setTimeout>;
  return (...a: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
};

const useResponsiveDimension = (
  responsive: boolean,
  config: GradualBlurConfig,
  key: 'height' | 'width'
): string => {
  const [value, setValue] = useState<string>(config[key] || '');

  useEffect(() => {
    if (!responsive) return;

    const calc = () => {
      const w = window.innerWidth;
      let v = config[key] || '';

      const capitalizedKey = key[0].toUpperCase() + key.slice(1);
      const mobileKey = `mobile${capitalizedKey}` as keyof GradualBlurConfig;
      const tabletKey = `tablet${capitalizedKey}` as keyof GradualBlurConfig;
      const desktopKey = `desktop${capitalizedKey}` as keyof GradualBlurConfig;

      if (w <= 480 && config[mobileKey]) v = config[mobileKey] as string;
      else if (w <= 768 && config[tabletKey]) v = config[tabletKey] as string;
      else if (w <= 1024 && config[desktopKey]) v = config[desktopKey] as string;

      setValue(v);
    };

    const debounced = debounce(calc, 100);
    calc();

    window.addEventListener('resize', debounced);
    return () => window.removeEventListener('resize', debounced);
  }, [responsive, config, key]);

  return responsive ? value : (config[key] || '');
};

const useIntersectionObserver = (ref: React.RefObject<HTMLElement>, shouldObserve: boolean = false): boolean => {
  const [isVisible, setIsVisible] = useState(!shouldObserve);

  useEffect(() => {
    if (!shouldObserve || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, shouldObserve]);

  return isVisible;
};

function GradualBlur(props: GradualBlurConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const config = useMemo(() => {
    const presetConfig = props.preset && PRESETS[props.preset] ? PRESETS[props.preset] : {};
    return mergeConfigs(DEFAULT_CONFIG, presetConfig, props);
  }, [props]);

  const responsiveHeight = useResponsiveDimension(config.responsive || false, config, 'height');
  const responsiveWidth = useResponsiveDimension(config.responsive || false, config, 'width');

  const isVisible = useIntersectionObserver(containerRef, config.animated === 'scroll');

  const blurDivs = useMemo(() => {
    const divs: React.ReactElement[] = [];
    const increment = 100 / (config.divCount || 5);
    const currentStrength =
      isHovered && config.hoverIntensity
        ? (config.strength || 2) * config.hoverIntensity
        : config.strength || 2;

    const curveFunc = CURVE_FUNCTIONS[config.curve || 'linear'] || CURVE_FUNCTIONS.linear;

    for (let i = 1; i <= (config.divCount || 5); i++) {
      let progress = i / (config.divCount || 5);
      progress = curveFunc(progress);

      let blurValue: number;
      if (config.exponential) {
        blurValue = math.pow(2, progress * 4) * 0.0625 * currentStrength;
      } else {
        blurValue = 0.0625 * (progress * (config.divCount || 5) + 1) * currentStrength;
      }

      // Calcola lo scurimento graduale basato sulla progress
      const darkenAmount = config.darken || 0.1;
      const brightnessValue = 1 - (progress * darkenAmount); // Diminuisce da 1 a (1 - darkenAmount)

      const p1 = math.round((increment * i - increment) * 10) / 10;
      const p2 = math.round(increment * i * 10) / 10;
      const p3 = math.round((increment * i + increment) * 10) / 10;
      const p4 = math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const direction = getGradientDirection(config.position || 'bottom');

      // Combina blur e brightness nel backdrop-filter
      const backdropFilters = [
        `blur(${blurValue.toFixed(3)}rem)`,
        `brightness(${brightnessValue.toFixed(3)})`
      ].join(' ');

      const divStyle: React.CSSProperties = {
        position: 'absolute',
        inset: '0',
        maskImage: `linear-gradient(${direction}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
        backdropFilter: backdropFilters,
        WebkitBackdropFilter: backdropFilters,
        opacity: config.opacity || 1,
        transition:
          config.animated && config.animated !== 'scroll'
            ? `backdrop-filter ${config.duration || '0.3s'} ${config.easing || 'ease-out'}`
            : undefined
      };

      divs.push(<div key={i} style={divStyle} />);
    }

    return divs;
  }, [config, isHovered]);

  const containerStyle = useMemo(() => {
    const isVertical = ['top', 'bottom'].includes(config.position || 'bottom');
    const isHorizontal = ['left', 'right'].includes(config.position || 'bottom');
    const isPageTarget = config.target === 'page';

    const baseStyle: React.CSSProperties = {
      position: isPageTarget ? 'fixed' : 'absolute',
      pointerEvents: config.hoverIntensity ? 'auto' : 'none',
      opacity: isVisible ? 1 : 0,
      transition: config.animated ? `opacity ${config.duration || '0.3s'} ${config.easing || 'ease-out'}` : undefined,
      zIndex: isPageTarget ? (config.zIndex || 1000) + 100 : config.zIndex || 1000,
      ...config.style
    };

    if (isVertical) {
      baseStyle.height = responsiveHeight;
      baseStyle.width = responsiveWidth || '100%';
      baseStyle[config.position || 'bottom'] = 0;
      baseStyle.left = 0;
      baseStyle.right = 0;
    } else if (isHorizontal) {
      baseStyle.width = responsiveWidth || responsiveHeight;
      baseStyle.height = '100%';
      baseStyle[config.position || 'left'] = 0;
      baseStyle.top = 0;
      baseStyle.bottom = 0;
    }

    return baseStyle;
  }, [config, responsiveHeight, responsiveWidth, isVisible]);

  const { hoverIntensity, animated, onAnimationComplete, duration } = config;

  useEffect(() => {
    if (isVisible && animated === 'scroll' && onAnimationComplete) {
      const ms = parseFloat(duration || '0.3s') * 1000;
      const t = setTimeout(() => onAnimationComplete(), ms);
      return () => clearTimeout(t);
    }
  }, [isVisible, animated, onAnimationComplete, duration]);

  return (
    <div
      ref={containerRef}
      className={`gradual-blur ${config.target === 'page' ? 'gradual-blur-page' : 'gradual-blur-parent'} ${config.className || ''}`}
      style={containerStyle}
      onMouseEnter={hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setIsHovered(false) : undefined}
    >
      <div
        className="gradual-blur-inner"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%'
        }}
      >
        {blurDivs}
      </div>
    </div>
  );
}

const GradualBlurMemo = React.memo(GradualBlur) as typeof GradualBlur & {
  PRESETS: typeof PRESETS;
  CURVE_FUNCTIONS: typeof CURVE_FUNCTIONS;
};

GradualBlurMemo.displayName = 'GradualBlur';
(GradualBlurMemo as any).PRESETS = PRESETS;
(GradualBlurMemo as any).CURVE_FUNCTIONS = CURVE_FUNCTIONS;

const injectStyles = () => {
  if (typeof document === 'undefined') return;

  const styleId = 'gradual-blur-styles';
  if (document.getElementById(styleId)) return;

  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = `
  .gradual-blur { pointer-events: none; transition: opacity 0.3s ease-out; }
  .gradual-blur-parent { overflow: hidden; }
  .gradual-blur-inner { pointer-events: none; }`;

  document.head.appendChild(styleElement);
};

if (typeof document !== 'undefined') {
  injectStyles();
}

export default GradualBlurMemo;

