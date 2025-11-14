import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// SplitText è un plugin premium di GSAP, usiamo un'implementazione alternativa
// Se hai una licenza premium, puoi importare: import { SplitText as GSAPSplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Implementazione alternativa di SplitText
class SimpleSplitText {
  chars: HTMLElement[] = [];
  words: HTMLElement[] = [];
  lines: HTMLElement[] = [];
  
  constructor(
    element: HTMLElement,
    options: {
      type: string;
      charsClass?: string;
      wordsClass?: string;
      linesClass?: string;
      onSplit?: (self: SimpleSplitText) => any;
    }
  ) {
    const { type, charsClass = 'split-char', wordsClass = 'split-word', linesClass = 'split-line', onSplit } = options;
    
    if (type.includes('chars')) {
      const text = element.textContent || '';
      element.innerHTML = '';
      text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.className = charsClass;
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        element.appendChild(span);
        this.chars.push(span);
      });
    } else if (type.includes('words')) {
      const text = element.textContent || '';
      element.innerHTML = '';
      text.split(/\s+/).forEach((word, index) => {
        const span = document.createElement('span');
        span.className = wordsClass;
        span.textContent = word;
        span.style.display = 'inline-block';
        if (index > 0) {
          element.appendChild(document.createTextNode(' '));
        }
        element.appendChild(span);
        this.words.push(span);
      });
    }
    
    if (onSplit) {
      onSplit(this);
    }
  }
  
  revert() {
    // Ripristina il testo originale
    this.chars.forEach(char => {
      if (char.parentNode) {
        char.parentNode.replaceChild(document.createTextNode(char.textContent || ''), char);
      }
    });
    this.words.forEach(word => {
      if (word.parentNode) {
        const text = word.textContent || '';
        word.parentNode.replaceChild(document.createTextNode(text), word);
      }
    });
  }
}

const SplitText = ({
  text,
  className = '',
  style,
  delay = 100,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: string;
  from?: { opacity?: number; y?: number };
  to?: { opacity?: number; y?: number };
  threshold?: number;
  rootMargin?: string;
  textAlign?: string;
  tag?: string;
  onLetterAnimationComplete?: () => void;
}) => {
  const ref = useRef<HTMLElement>(null);
  const animationCompletedRef = useRef(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      const el = ref.current;

      if ((el as any)._rbsplitInstance) {
        try {
          (el as any)._rbsplitInstance.revert();
        } catch (_) {
          /* noop */
        }
        (el as any)._rbsplitInstance = null;
      }

      let targets: any;
      const assignTargets = (self: any) => {
        if (splitType.includes('chars') && self.chars.length) targets = self.chars;
        if (!targets && splitType.includes('words') && self.words.length) targets = self.words;
        if (!targets && splitType.includes('lines') && self.lines.length) targets = self.lines;
        if (!targets) targets = self.chars || self.words || self.lines;
      };

      const splitInstance = new SimpleSplitText(el, {
        type: splitType,
        charsClass: 'split-char',
        wordsClass: 'split-word',
        linesClass: 'split-line',
        onSplit: (self: any) => {
          assignTargets(self);
          const tween = gsap.fromTo(
            targets,
            { ...from },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              onComplete: () => {
                animationCompletedRef.current = true;
                onLetterAnimationComplete?.();
              },
              willChange: 'transform, opacity',
              force3D: true
            }
          );
          return tween;
        }
      });

      (el as any)._rbsplitInstance = splitInstance;

      return () => {
        try {
          splitInstance.revert();
        } catch (_) {
          /* noop */
        }
        (el as any)._rbsplitInstance = null;
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        fontsLoaded,
        onLetterAnimationComplete
      ],
      scope: ref
    }
  );

  const renderTag = () => {
    const combinedStyle: React.CSSProperties = {
      textAlign: textAlign as 'left' | 'center' | 'right',
      overflow: 'hidden',
      display: 'inline-block',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      willChange: 'transform, opacity',
      ...style
    };
    const classes = `split-parent ${className}`;
    switch (tag) {
      case 'h1':
        return (
          <h1 ref={ref as React.RefObject<HTMLHeadingElement>} style={combinedStyle} className={classes}>
            {text}
          </h1>
        );
      case 'h2':
        return (
          <h2 ref={ref as React.RefObject<HTMLHeadingElement>} style={combinedStyle} className={classes}>
            {text}
          </h2>
        );
      case 'h3':
        return (
          <h3 ref={ref as React.RefObject<HTMLHeadingElement>} style={combinedStyle} className={classes}>
            {text}
          </h3>
        );
      case 'h4':
        return (
          <h4 ref={ref as React.RefObject<HTMLHeadingElement>} style={combinedStyle} className={classes}>
            {text}
          </h4>
        );
      case 'h5':
        return (
          <h5 ref={ref as React.RefObject<HTMLHeadingElement>} style={combinedStyle} className={classes}>
            {text}
          </h5>
        );
      case 'h6':
        return (
          <h6 ref={ref as React.RefObject<HTMLHeadingElement>} style={combinedStyle} className={classes}>
            {text}
          </h6>
        );
      default:
        return (
          <p ref={ref as React.RefObject<HTMLParagraphElement>} style={combinedStyle} className={classes}>
            {text}
          </p>
        );
    }
  };
  return renderTag();
};

export default SplitText;

