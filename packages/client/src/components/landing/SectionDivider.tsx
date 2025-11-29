import { useEffect, useRef, useState } from 'react';

type DividerVariant = 'mystical' | 'ancient' | 'human' | 'dual';

interface SectionDividerProps {
  variant?: DividerVariant;
  className?: string;
}

export function SectionDivider({ variant = 'ancient', className = '' }: SectionDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const colorConfig = {
    mystical: {
      primary: 'from-transparent via-mystical-500 to-transparent',
      glow: 'bg-mystical-500/30',
      ornament: 'text-mystical-400',
      orb: 'bg-mystical-500',
    },
    ancient: {
      primary: 'from-transparent via-ancient-500 to-transparent',
      glow: 'bg-ancient-500/30',
      ornament: 'text-ancient-400',
      orb: 'bg-ancient-500',
    },
    human: {
      primary: 'from-transparent via-human-500 to-transparent',
      glow: 'bg-human-500/30',
      ornament: 'text-human-400',
      orb: 'bg-human-500',
    },
    dual: {
      primary: 'from-mystical-500 via-ancient-500 to-human-500',
      glow: 'bg-ancient-500/30',
      ornament: 'text-ancient-400',
      orb: 'bg-ancient-500',
    },
  };

  const colors = colorConfig[variant];

  return (
    <div
      ref={ref}
      className={`relative py-8 overflow-hidden ${className}`}
    >
      {/* Main line */}
      <div className="relative flex items-center justify-center">
        {/* Left line */}
        <div
          className={`
            h-px flex-1 max-w-xs bg-gradient-to-r ${colors.primary}
            transition-all duration-1000
            ${isVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}
          `}
          style={{ transformOrigin: 'right' }}
        />

        {/* Center ornament */}
        <div className="relative mx-4">
          {/* Glow */}
          <div
            className={`
              absolute inset-0 ${colors.glow} blur-xl rounded-full
              transition-opacity duration-500
              ${isVisible ? 'opacity-100' : 'opacity-0'}
            `}
          />

          {/* Ornament shape */}
          <svg
            className={`
              relative w-16 h-8 ${colors.ornament}
              transition-all duration-700 delay-300
              ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
            `}
            viewBox="0 0 64 32"
            fill="none"
          >
            {/* Diamond shape */}
            <path
              d="M32 4 L44 16 L32 28 L20 16 Z"
              fill="currentColor"
              opacity="0.3"
            />
            <path
              d="M32 8 L40 16 L32 24 L24 16 Z"
              fill="currentColor"
              opacity="0.6"
            />
            <path
              d="M32 12 L36 16 L32 20 L28 16 Z"
              fill="currentColor"
            />

            {/* Side decorations */}
            <circle cx="12" cy="16" r="2" fill="currentColor" opacity="0.4" />
            <circle cx="52" cy="16" r="2" fill="currentColor" opacity="0.4" />
            <line x1="0" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <line x1="56" y1="16" x2="64" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </svg>

          {/* Pulsing orb in center */}
          <div
            className={`
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-2 h-2 rounded-full ${colors.orb}
              ${isVisible ? 'animate-pulse' : ''}
            `}
          />
        </div>

        {/* Right line */}
        <div
          className={`
            h-px flex-1 max-w-xs bg-gradient-to-l ${colors.primary}
            transition-all duration-1000
            ${isVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}
          `}
          style={{ transformOrigin: 'left' }}
        />
      </div>

      {/* Floating particles */}
      {isVisible && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`
                absolute w-1 h-1 rounded-full ${colors.orb}
                animate-float
              `}
              style={{
                left: `${15 + i * 15}%`,
                top: '50%',
                opacity: 0.3,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${2 + i * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Alternative wave-style divider
export function WaveDivider({ variant = 'ancient', flip = false }: { variant?: DividerVariant; flip?: boolean }) {
  const colorConfig = {
    mystical: 'fill-mystical-500/10',
    ancient: 'fill-ancient-500/10',
    human: 'fill-human-500/10',
    dual: 'fill-ancient-500/10',
  };

  return (
    <div className={`relative h-24 overflow-hidden ${flip ? 'rotate-180' : ''}`}>
      <svg
        className={`absolute inset-0 w-full h-full ${colorConfig[variant]}`}
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path d="M0,0 C150,100 350,0 600,50 C850,100 1050,0 1200,50 L1200,120 L0,120 Z" />
      </svg>
    </div>
  );
}
