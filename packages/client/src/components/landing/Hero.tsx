import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';

// Floating rune symbols - Nordic/Elder Futhark style
const RUNE_SYMBOLS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'];

// Floating particles with enhanced runes visibility
function FloatingParticles() {
  const particles = useMemo(() =>
    [...Array(50)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 16 + Math.random() * 20, // Larger runes
      duration: 20 + Math.random() * 15,
      delay: Math.random() * 15,
      symbol: RUNE_SYMBOLS[Math.floor(Math.random() * RUNE_SYMBOLS.length)],
      color: Math.random() > 0.5 ? 'mystical' : Math.random() > 0.5 ? 'human' : 'ancient',
    })), []
  );

  const getColorClass = (color: string) => {
    switch (color) {
      case 'mystical': return 'text-mystical-400';
      case 'human': return 'text-human-400';
      default: return 'text-ancient-400';
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute animate-float-drift ${getColorClass(p.color)}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: 0.08 + Math.random() * 0.12, // 8-20% opacity (dimmer)
            textShadow: p.color === 'mystical'
              ? '0 0 15px rgba(99,102,241,0.4), 0 0 30px rgba(99,102,241,0.2)'
              : p.color === 'human'
                ? '0 0 15px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.2)'
                : '0 0 15px rgba(234,179,8,0.4), 0 0 30px rgba(234,179,8,0.2)',
          }}
        >
          {p.symbol}
        </div>
      ))}
    </div>
  );
}

// Background with image
function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/assets/landing_bg.png")',
        }}
      />

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Top and bottom fade to game-dark */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-game-dark to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-game-dark to-transparent" />
    </div>
  );
}

// Animated title with letter-by-letter reveal
function AnimatedTitle() {
  const [isVisible, setIsVisible] = useState(false);
  const letters = 'SUNDERING'.split('');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold tracking-wider mb-4 relative">
      <span className="sr-only">SUNDERING</span>
      <span aria-hidden="true" className="relative inline-block">
        {letters.map((letter, index) => (
          <span
            key={index}
            className={`
              inline-block transition-all duration-700
              bg-gradient-to-b from-ancient-300 via-ancient-500 to-ancient-700 bg-clip-text text-transparent
              ${isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'}
            `}
            style={{
              transitionDelay: `${index * 80}ms`,
              textShadow: '0 0 80px rgba(234,179,8,0.5)',
            }}
          >
            {letter}
          </span>
        ))}

        {/* Glow effect behind text */}
        <div
          className={`
            absolute inset-0 -z-10 transition-opacity duration-1000 delay-500
            ${isVisible ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(234,179,8,0.3) 0%, transparent 70%)',
            filter: 'blur(30px)',
            transform: 'scale(1.5)',
          }}
        />
      </span>
    </h1>
  );
}


// Stone Tablet Button - fantasy styled button
function StoneTabletButton({ children, onClick, primary = true }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative px-10 py-4 font-display font-bold uppercase tracking-wider
        transition-all duration-300 hover:scale-105
        ${primary ? 'text-amber-100' : 'text-gray-300'}
      `}
    >
      {/* Outer glow on hover */}
      <div className={`
        absolute -inset-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl
        ${primary
          ? 'bg-gradient-to-r from-amber-600/40 via-ancient-500/50 to-amber-600/40'
          : 'bg-gradient-to-r from-gray-500/30 via-gray-400/40 to-gray-500/30'
        }
      `} />

      {/* Stone texture background */}
      <div
        className="absolute inset-0 rounded-sm"
        style={{
          background: primary
            ? 'linear-gradient(135deg, #4a4033 0%, #3d352b 50%, #2e2820 100%)'
            : 'linear-gradient(135deg, #3a3a3a 0%, #2d2d2d 50%, #1f1f1f 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)',
        }}
      />

      {/* Carved edge effect */}
      <div className={`
        absolute inset-0 rounded-sm border-2 transition-colors duration-300
        ${primary
          ? 'border-stone-600/50 group-hover:border-amber-600/70'
          : 'border-stone-600/50 group-hover:border-gray-400/70'
        }
      `} />
      <div className="absolute inset-[3px] rounded-sm border border-stone-800/50" />

      {/* Rune carvings on sides */}
      <div className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs transition-all duration-300 ${primary ? 'text-stone-500 group-hover:text-amber-400' : 'text-stone-500 group-hover:text-gray-300'} opacity-60 group-hover:opacity-100`}>ᚱ</div>
      <div className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs transition-all duration-300 ${primary ? 'text-stone-500 group-hover:text-amber-400' : 'text-stone-500 group-hover:text-gray-300'} opacity-60 group-hover:opacity-100`}>ᚦ</div>

      {/* Cracked texture overlay */}
      <div
        className="absolute inset-0 opacity-10 rounded-sm"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L15 25 L30 35 L45 28 L60 30' stroke='%23000' fill='none' stroke-width='0.5'/%3E%3Cpath d='M30 0 L25 20 L35 40 L28 60' stroke='%23000' fill='none' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Embossed text effect */}
      <span
        className="relative z-10 flex items-center gap-2"
        style={{
          textShadow: '1px 1px 0 rgba(0,0,0,0.5), -1px -1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {children}
      </span>

      {/* Inner hover glow */}
      <div className={`
        absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${primary ? 'bg-amber-500/15' : 'bg-gray-400/10'}
      `} />
    </button>
  );
}

// Animated stat counter with epic styling
function AnimatedStat({
  value,
  suffix = '',
  label,
  color,
  glowColor,
  delay = 0
}: {
  value: string;
  suffix?: string;
  label: string;
  color: string;
  glowColor: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 800 + delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`
      text-center transition-all duration-700
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      {/* Epic number display */}
      <div className="relative">
        {/* Glow effect behind number */}
        <div
          className="absolute inset-0 blur-2xl opacity-50"
          style={{ background: glowColor }}
        />
        <div
          className={`
            relative text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight
            ${color}
          `}
          style={{
            textShadow: `0 0 40px ${glowColor}, 0 0 80px ${glowColor}`,
          }}
        >
          {value}
          {suffix && <span className="text-3xl md:text-4xl">{suffix}</span>}
        </div>
      </div>
      {/* Label with decorative lines */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <div className="w-4 h-px bg-gradient-to-r from-transparent to-gray-600" />
        <span className="text-xs text-gray-500 uppercase tracking-[0.2em] font-medium">{label}</span>
        <div className="w-4 h-px bg-gradient-to-l from-transparent to-gray-600" />
      </div>
    </div>
  );
}

// Decorative corner frames
function CornerFrames() {
  return (
    <>
      {/* Top left */}
      <div className="absolute top-8 left-8 w-24 h-24 pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-ancient-500 to-transparent" />
        <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-ancient-500 to-transparent" />
        <div className="absolute top-2 left-2 w-2 h-2 bg-ancient-500 rounded-full animate-pulse" />
      </div>

      {/* Top right */}
      <div className="absolute top-8 right-8 w-24 h-24 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-ancient-500 to-transparent" />
        <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-ancient-500 to-transparent" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-ancient-500 rounded-full animate-pulse" />
      </div>

      {/* Bottom left */}
      <div className="absolute bottom-8 left-8 w-24 h-24 pointer-events-none opacity-30">
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-ancient-500 to-transparent" />
        <div className="absolute bottom-0 left-0 w-[2px] h-full bg-gradient-to-t from-ancient-500 to-transparent" />
      </div>

      {/* Bottom right */}
      <div className="absolute bottom-8 right-8 w-24 h-24 pointer-events-none opacity-30">
        <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-ancient-500 to-transparent" />
        <div className="absolute bottom-0 right-0 w-[2px] h-full bg-gradient-to-t from-ancient-500 to-transparent" />
      </div>
    </>
  );
}

// Animated divider line
function AnimatedDivider() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-1 w-80 mx-auto mt-6 mb-8 overflow-hidden">
      {/* Background track */}
      <div className="absolute inset-0 bg-gray-800/50 rounded-full" />

      {/* Animated gradient fill */}
      <div
        className={`
          absolute inset-y-0 left-1/2 rounded-full transition-all duration-1000 ease-out
          bg-gradient-to-r from-mystical-500 via-ancient-500 to-human-500
          ${isVisible ? 'w-full -translate-x-1/2' : 'w-0 translate-x-0'}
        `}
      />

      {/* Center glow dot */}
      <div className={`
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-3 h-3 bg-ancient-400 rounded-full
        transition-all duration-500 delay-700
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
      `}>
        <div className="absolute inset-0 bg-ancient-400 rounded-full animate-ping opacity-75" />
      </div>
    </div>
  );
}

export function Hero() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const scrollToHeroes = () => {
    document.getElementById('heroes')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePlayNow = () => {
    if (token) {
      navigate('/lobby');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Layered Background */}
      <HeroBackground />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Corner decorations */}
      <CornerFrames />

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Pre-title badge */}
        <div className={`
          inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full
          bg-white/5 border border-white/10 backdrop-blur-sm
          transition-all duration-700 delay-100
          ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-gray-400">Now in Development</span>
        </div>

        {/* Animated Title */}
        <AnimatedTitle />

        {/* Subtitle */}
        <p className={`
          text-lg md:text-xl text-silver-400 font-light tracking-[0.2em] uppercase mb-2
          transition-all duration-700 delay-500
          ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          Chronicles of the Eternal Conflict
        </p>

        {/* Animated divider */}
        <AnimatedDivider />

        {/* Taglines */}
        <div className={`
          space-y-4 mb-10
          transition-all duration-700 delay-700
          ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-wide"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #a3a3a3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 30px rgba(234,179,8,0.3)',
            }}
          >
            The Battle for Dominion Begins
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light">
            A 3D browser-based MOBA where{' '}
            <span
              className="font-display font-semibold"
              style={{
                background: 'linear-gradient(90deg, #818cf8, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Mystical Forces
            </span>{' '}
            clash with{' '}
            <span
              className="font-display font-semibold"
              style={{
                background: 'linear-gradient(90deg, #f87171, #fb923c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Humanity
            </span>{' '}
            in epic 5v5 battles.
          </p>
          <p
            className="text-lg md:text-xl font-display font-medium tracking-wider"
            style={{
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(234,179,8,0.4)',
            }}
          >
            No downloads. No limits.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className={`
          flex flex-col sm:flex-row gap-4 justify-center items-center mb-16
          transition-all duration-700 delay-900
          ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <StoneTabletButton onClick={handlePlayNow} primary>
            {token ? 'Enter Lobby' : 'Play Now'}
          </StoneTabletButton>
          <StoneTabletButton onClick={scrollToHeroes} primary={false}>
            Meet the Heroes
          </StoneTabletButton>
        </div>

        {/* Stats with staggered animation */}
        <div className="grid grid-cols-3 gap-6 md:gap-12 max-w-2xl mx-auto">
          <AnimatedStat
            value="20"
            suffix="+"
            label="Heroes"
            color="text-mystical-400"
            glowColor="rgba(99,102,241,0.5)"
            delay={0}
          />
          <AnimatedStat
            value="5v5"
            label="Battles"
            color="text-ancient-400"
            glowColor="rgba(234,179,8,0.5)"
            delay={150}
          />
          <AnimatedStat
            value="0"
            label="Downloads"
            color="text-human-400"
            glowColor="rgba(239,68,68,0.5)"
            delay={300}
          />
        </div>
      </div>

      {/* Enhanced scroll indicator */}
      <div className={`
        absolute bottom-8 left-1/2 -translate-x-1/2
        transition-all duration-700 delay-1000
        ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-gray-600">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-gray-500 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
