import { useState, useEffect, useCallback, useMemo } from 'react';
import { HEROES, HEROES_BY_FACTION } from '@sundering/shared';
import type { HeroDefinition, Faction } from '@sundering/shared';
import { HERO_LORE, ROLE_INFO } from '../../constants/loreData';

// Heroes that have actual artwork available
const HEROES_WITH_ASSETS = ['ironclad', 'bladewarden', 'pyralis', 'nightshade', 'sylara', 'vex', 'thornweaver', 'magnus', 'frostborne', 'grimjaw', 'valeria', 'zephyr', 'hex', 'scourge'] as const;

function hasHeroAssets(heroId: string): boolean {
  return HEROES_WITH_ASSETS.includes(heroId as (typeof HEROES_WITH_ASSETS)[number]);
}

function getHeroAvatarPath(heroId: string): string {
  return `/assets/heroes/${heroId}/avatar.png`;
}

function getHeroBackgroundPath(heroId: string): string {
  return `/assets/heroes/${heroId}/background.png`;
}

// Role icons
const RoleIcons: Record<string, React.FC<{ className?: string }>> = {
  tank: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
    </svg>
  ),
  warrior: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.92 5H5l5 15h1.5l1.5-4.5 1.5 4.5H16l5-15h-1.92l-4.35 13-1.48-4.5L14.73 5H9.27l1.48 4.5L9.27 14l-4.35-13z" />
    </svg>
  ),
  mage: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.5 5.6L5 7l1.4 1.5L5 10l2.5 1.4L6.1 13l2.5.5L8 16l2.5-.9L12 18l1.5-2.9L16 16l-.6-2.5L18 13l-1.4-1.6L18 10l-2.5-1.4 1.4-1.5-2.5-1.4L15.4 4 13 4.5 12 2l-1 2.5L8.6 4l.9 1.6z" />
    </svg>
  ),
  healer: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    </svg>
  ),
  assassin: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2zm0 3.8l5.5 13.21L12 16.4l-5.5 2.61L12 5.8z" />
    </svg>
  ),
};

// Floating particles component
function FloatingParticles({ color }: { color: 'mystical' | 'human' | 'neutral' }) {
  const particles = useMemo(() =>
    [...Array(30)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
    })), []
  );

  const colorClass = color === 'mystical'
    ? 'bg-mystical-400'
    : color === 'human'
      ? 'bg-human-400'
      : 'bg-ancient-400';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${colorClass} opacity-40 animate-float`}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  );
}

// Flying sparks component for forge title
function ForgeSparks() {
  const sparks = useMemo(() =>
    [...Array(25)].map((_, i) => ({
      id: i,
      // Start from bottom of title, spread across width
      startX: 10 + Math.random() * 80,
      startY: 70 + Math.random() * 30,
      size: 1 + Math.random() * 2.5,
      delay: Math.random() * 3,
      duration: 1 + Math.random() * 1.5,
      // Color variation: orange, yellow, white-hot
      colorType: Math.random(),
      // Unique trajectory per spark
      trajectory: Math.floor(Math.random() * 8),
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none">
      {sparks.map((spark) => {
        // Color based on "temperature"
        const color = spark.colorType > 0.7
          ? 'bg-yellow-200' // white-hot
          : spark.colorType > 0.3
            ? 'bg-orange-400' // orange
            : 'bg-amber-500'; // amber/gold

        const glowColor = spark.colorType > 0.7
          ? 'rgba(254, 240, 138, 0.9)'
          : spark.colorType > 0.3
            ? 'rgba(251, 146, 60, 0.8)'
            : 'rgba(245, 158, 11, 0.8)';

        return (
          <div
            key={spark.id}
            className={`absolute rounded-full ${color}`}
            style={{
              left: `${spark.startX}%`,
              top: `${spark.startY}%`,
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              boxShadow: `0 0 ${spark.size * 3}px ${spark.size}px ${glowColor}`,
              animation: `spark-fly-${spark.trajectory} ${spark.duration}s ease-out infinite`,
              animationDelay: `${spark.delay}s`,
              opacity: 0,
            }}
          />
        );
      })}
      <style>{`
        @keyframes spark-fly-0 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-40px, -80px) scale(0.2); }
        }
        @keyframes spark-fly-1 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(30px, -70px) scale(0.3); }
        }
        @keyframes spark-fly-2 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-20px, -100px) scale(0.1); }
        }
        @keyframes spark-fly-3 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(50px, -60px) scale(0.4); }
        }
        @keyframes spark-fly-4 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-15px, -90px) scale(0.2); }
        }
        @keyframes spark-fly-5 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(25px, -85px) scale(0.3); }
        }
        @keyframes spark-fly-6 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-35px, -65px) scale(0.25); }
        }
        @keyframes spark-fly-7 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(10px, -110px) scale(0.15); }
        }
      `}</style>
    </div>
  );
}

// Avatar background sparks component
function AvatarSparks() {
  const sparks = useMemo(() =>
    [...Array(30)].map((_, i) => ({
      id: i,
      // Start from center-top area of avatar
      startX: 25 + Math.random() * 50,
      startY: 5 + Math.random() * 20,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 2.5,
      duration: 1 + Math.random() * 1.2,
      trajectory: Math.floor(Math.random() * 6),
      colorType: Math.random(),
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
      {sparks.map((spark) => {
        // Fire colors - brighter
        const sparkColor = spark.colorType > 0.6
          ? 'bg-yellow-100'
          : spark.colorType > 0.3
            ? 'bg-orange-300'
            : 'bg-amber-400';

        const glowColor = spark.colorType > 0.6
          ? 'rgba(254, 249, 195, 1)'
          : spark.colorType > 0.3
            ? 'rgba(253, 186, 116, 0.95)'
            : 'rgba(251, 191, 36, 0.9)';

        return (
          <div
            key={spark.id}
            className={`absolute rounded-full ${sparkColor}`}
            style={{
              left: `${spark.startX}%`,
              top: `${spark.startY}%`,
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              boxShadow: `0 0 ${spark.size * 4}px ${spark.size * 1.5}px ${glowColor}`,
              animation: `avatar-spark-${spark.trajectory} ${spark.duration}s ease-out infinite`,
              animationDelay: `${spark.delay}s`,
              opacity: 0,
            }}
          />
        );
      })}
      <style>{`
        @keyframes avatar-spark-0 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-20px, -70px) scale(0.3); }
        }
        @keyframes avatar-spark-1 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(18px, -80px) scale(0.35); }
        }
        @keyframes avatar-spark-2 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-10px, -90px) scale(0.2); }
        }
        @keyframes avatar-spark-3 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(25px, -65px) scale(0.4); }
        }
        @keyframes avatar-spark-4 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-25px, -75px) scale(0.25); }
        }
        @keyframes avatar-spark-5 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(5px, -100px) scale(0.2); }
        }
      `}</style>
    </div>
  );
}

// Hero name sparks component
function HeroNameSparks() {
  const sparks = useMemo(() =>
    [...Array(15)].map((_, i) => ({
      id: i,
      startX: 10 + Math.random() * 80,
      startY: 80 + Math.random() * 20,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 2,
      duration: 0.8 + Math.random() * 1,
      trajectory: Math.floor(Math.random() * 5),
      colorType: Math.random(),
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none">
      {sparks.map((spark) => {
        // Fire colors: white-hot, yellow, orange
        const sparkColor = spark.colorType > 0.7
          ? 'bg-yellow-200'
          : spark.colorType > 0.3
            ? 'bg-orange-400'
            : 'bg-amber-500';

        const glowColor = spark.colorType > 0.7
          ? 'rgba(254, 240, 138, 0.9)'
          : spark.colorType > 0.3
            ? 'rgba(251, 146, 60, 0.8)'
            : 'rgba(245, 158, 11, 0.8)';

        return (
          <div
            key={spark.id}
            className={`absolute rounded-full ${sparkColor}`}
            style={{
              left: `${spark.startX}%`,
              top: `${spark.startY}%`,
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              boxShadow: `0 0 ${spark.size * 3}px ${spark.size}px ${glowColor}`,
              animation: `hero-spark-${spark.trajectory} ${spark.duration}s ease-out infinite`,
              animationDelay: `${spark.delay}s`,
              opacity: 0,
            }}
          />
        );
      })}
      <style>{`
        @keyframes hero-spark-0 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-20px, -40px) scale(0.2); }
        }
        @keyframes hero-spark-1 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(15px, -35px) scale(0.3); }
        }
        @keyframes hero-spark-2 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-10px, -50px) scale(0.1); }
        }
        @keyframes hero-spark-3 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(25px, -30px) scale(0.4); }
        }
        @keyframes hero-spark-4 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-5px, -45px) scale(0.2); }
        }
      `}</style>
    </div>
  );
}

// Stat ring component for circular stats display
function StatRing({
  value,
  max,
  label,
  color
}: {
  value: number;
  max: number;
  label: string;
  color: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {value}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{label}</span>
    </div>
  );
}

// Background card (static, no hover effects)
function BackgroundHeroCard({
  hero,
}: {
  hero: HeroDefinition;
}) {
  const isMystical = hero.faction === 'mystical';
  const hasAssets = hasHeroAssets(hero.id);
  const RoleIcon = RoleIcons[hero.role] || RoleIcons.warrior;

  return (
    <div
      className="relative w-[180px] md:w-[220px] h-[280px] md:h-[340px] rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        {hasAssets ? (
          <img
            src={getHeroBackgroundPath(hero.id)}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`
            w-full h-full
            bg-gradient-to-br ${isMystical
              ? 'from-mystical-900 via-mystical-800 to-indigo-900'
              : 'from-human-900 via-orange-800 to-yellow-900'
            }
          `} />
        )}
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

      {/* Role badge */}
      <div className={`
        absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center
        ${isMystical ? 'bg-mystical-500/50' : 'bg-human-500/50'}
        backdrop-blur-sm border border-white/10
      `}>
        <RoleIcon className={`w-4 h-4 ${isMystical ? 'text-mystical-200' : 'text-human-200'}`} />
      </div>

      {/* Hero info */}
      <div className="absolute left-0 right-0 bottom-0 p-4 w-full text-center">
        <h4 className={`
          font-display font-bold text-lg mb-1
          ${isMystical ? 'text-mystical-200' : 'text-human-200'}
        `}>
          {hero.name}
        </h4>
        <p className="text-sm text-gray-400 line-clamp-1">{hero.title}</p>

        {/* Difficulty dots */}
        <div className="flex gap-1 mt-2 justify-center">
          {[1, 2, 3].map((level) => (
            <div
              key={level}
              className={`
                w-1.5 h-1.5 rounded-full
                ${level <= hero.difficulty
                  ? isMystical ? 'bg-mystical-400' : 'bg-human-400'
                  : 'bg-gray-700'
                }
              `}
            />
          ))}
        </div>
      </div>

      {/* Border */}
      <div className={`
        absolute inset-0 rounded-2xl border-2
        ${isMystical ? 'border-mystical-500/30' : 'border-human-500/30'}
      `} />
    </div>
  );
}

// Side hero card (smaller, perspective view)
function SideHeroCard({
  hero,
  position,
  onClick,
  isAnimating,
}: {
  hero: HeroDefinition;
  position: 'left' | 'right';
  onClick: () => void;
  isAnimating: boolean;
}) {
  const isMystical = hero.faction === 'mystical';
  const hasAssets = hasHeroAssets(hero.id);
  const RoleIcon = RoleIcons[hero.role] || RoleIcons.warrior;
  const [isHovered, setIsHovered] = useState(false);

  const rotation = position === 'left' ? 15 : -15;
  const currentRotation = isHovered ? 0 : rotation;

  return (
    <div
      style={{
        perspective: '1000px',
        perspectiveOrigin: position === 'left' ? 'right center' : 'left center',
      }}
    >
      <button
        onClick={onClick}
        disabled={isAnimating}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative group cursor-pointer
          w-[180px] md:w-[220px] h-[280px] md:h-[340px] rounded-2xl
          shadow-2xl
          ${isAnimating ? 'pointer-events-none' : ''}
        `}
        style={{
          transform: `rotateY(${currentRotation}deg) scale(${isHovered ? 1.05 : 1})`,
          transformStyle: 'flat',
          transition: 'transform 0.5s ease-out',
        }}
      >
        {/* Background - fixed to card */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {hasAssets ? (
            <img
              src={getHeroBackgroundPath(hero.id)}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`
              w-full h-full
              bg-gradient-to-br ${isMystical
                ? 'from-mystical-900 via-mystical-800 to-indigo-900'
                : 'from-human-900 via-orange-800 to-yellow-900'
              }
            `} />
          )}
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

        {/* Faction glow edge */}
        <div className={`
          absolute inset-0 rounded-2xl transition-opacity duration-500
          ${isHovered ? 'opacity-100' : 'opacity-0'}
          ${isMystical
            ? 'shadow-[inset_0_0_30px_rgba(79,70,229,0.5)]'
            : 'shadow-[inset_0_0_30px_rgba(185,28,28,0.5)]'
          }
        `} />

        {/* Role badge */}
        <div className={`
          absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center
          ${isMystical ? 'bg-mystical-500/50' : 'bg-human-500/50'}
          backdrop-blur-sm border border-white/10
        `}>
          <RoleIcon className={`w-4 h-4 ${isMystical ? 'text-mystical-200' : 'text-human-200'}`} />
        </div>

        {/* Hero info */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h4 className={`
            font-display font-bold text-lg mb-1
            ${isMystical ? 'text-mystical-200' : 'text-human-200'}
          `}>
            {hero.name}
          </h4>
          <p className="text-sm text-gray-400 line-clamp-1">{hero.title}</p>

          {/* Difficulty dots */}
          <div className="flex gap-1 mt-2">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={`
                  w-1.5 h-1.5 rounded-full
                  ${level <= hero.difficulty
                    ? isMystical ? 'bg-mystical-400' : 'bg-human-400'
                    : 'bg-gray-700'
                  }
                `}
              />
            ))}
          </div>
        </div>

        {/* Hover arrow indicator */}
        <div className={`
          absolute top-1/2 -translate-y-1/2 transition-opacity duration-300
          ${isHovered ? 'opacity-100' : 'opacity-0'}
          ${position === 'left' ? 'right-2' : 'left-2'}
        `}>
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${isMystical ? 'bg-mystical-500/80' : 'bg-human-500/80'}
          `}>
            <svg
              className={`w-4 h-4 text-white ${position === 'left' ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Border */}
        <div className={`
          absolute inset-0 rounded-2xl border-2 transition-colors duration-300
          ${isMystical
            ? isHovered ? 'border-mystical-400/60' : 'border-mystical-500/30'
            : isHovered ? 'border-human-400/60' : 'border-human-500/30'
          }
        `} />
      </button>
    </div>
  );
}

// Central hero showcase (main focus)
function CentralHeroShowcase({
  hero,
  isTransitioning,
  onPrevious,
  onNext,
}: {
  hero: HeroDefinition;
  isTransitioning: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const isMystical = hero.faction === 'mystical';
  const heroLore = HERO_LORE[hero.id];
  const roleInfo = ROLE_INFO[hero.role];
  const hasAssets = hasHeroAssets(hero.id);
  const RoleIcon = RoleIcons[hero.role] || RoleIcons.warrior;

  return (
    <div className={`
      relative w-full max-w-[700px] mx-auto
      transition-all duration-500
      ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
    `}>
      {/* Main card container */}
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden">
        {/* Background artwork */}
        <div className="absolute inset-0">
          {hasAssets ? (
            <img
              src={getHeroBackgroundPath(hero.id)}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`
              w-full h-full
              bg-gradient-to-br ${isMystical
                ? 'from-mystical-900 via-mystical-800 to-indigo-900'
                : 'from-human-900 via-orange-800 to-yellow-900'
              }
            `}>
              <div className="absolute inset-0 opacity-30">
                <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl ${isMystical ? 'bg-mystical-500' : 'bg-human-500'}`} />
                <div className={`absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl ${isMystical ? 'bg-cyan-500' : 'bg-orange-500'}`} />
              </div>
            </div>
          )}
        </div>

        {/* Stronger dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Animated particles */}
        <FloatingParticles color={isMystical ? 'mystical' : 'human'} />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        <div className={`
          absolute inset-0 opacity-40
          ${isMystical
            ? 'bg-gradient-to-br from-mystical-500/40 via-transparent to-transparent'
            : 'bg-gradient-to-br from-human-500/40 via-transparent to-transparent'
          }
        `} />

        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none">
          <div className={`absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 rounded-tl-2xl ${isMystical ? 'border-mystical-400/50' : 'border-human-400/50'}`} />
          <div className={`absolute top-6 left-6 w-8 h-8 border-t border-l rounded-tl-xl ${isMystical ? 'border-mystical-300/30' : 'border-human-300/30'}`} />
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none">
          <div className={`absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 rounded-tr-2xl ${isMystical ? 'border-mystical-400/50' : 'border-human-400/50'}`} />
          <div className={`absolute top-6 right-6 w-8 h-8 border-t border-r rounded-tr-xl ${isMystical ? 'border-mystical-300/30' : 'border-human-300/30'}`} />
        </div>

        {/* Hero avatar (smaller, with hexagonal/diamond mask effect) */}
        {hasAssets && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[65%] h-[60%] mt-[-5%]">
              {/* Sparks behind avatar */}
              <AvatarSparks />
              {/* Glow behind avatar */}
              <div className={`
                absolute inset-0 blur-3xl opacity-60
                ${isMystical ? 'bg-mystical-500/40' : 'bg-human-500/40'}
              `} style={{ zIndex: 1 }} />
              {/* Avatar with custom shape mask */}
              <img
                src={getHeroAvatarPath(hero.id)}
                alt={hero.name}
                className="relative w-full h-full object-cover object-top"
                style={{
                  clipPath: 'polygon(50% 0%, 95% 15%, 100% 50%, 95% 85%, 50% 100%, 5% 85%, 0% 50%, 5% 15%)',
                  filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.8))',
                  zIndex: 2,
                }}
              />
              {/* Decorative frame around avatar */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ zIndex: 3 }}
              >
                <polygon
                  points="50,0 95,15 100,50 95,85 50,100 5,85 0,50 5,15"
                  fill="none"
                  stroke={isMystical ? 'rgba(129,140,248,0.6)' : 'rgba(248,113,113,0.6)'}
                  strokeWidth="0.5"
                />
                <polygon
                  points="50,2 93,16 98,50 93,84 50,98 7,84 2,50 7,16"
                  fill="none"
                  stroke={isMystical ? 'rgba(129,140,248,0.3)' : 'rgba(248,113,113,0.3)'}
                  strokeWidth="0.3"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Faction & Role badges (top) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <span className={`
            px-4 py-1.5 text-xs rounded-full uppercase font-bold tracking-wider
            backdrop-blur-md border shadow-lg
            ${isMystical
              ? 'bg-mystical-500/50 text-mystical-100 border-mystical-400/50'
              : 'bg-human-500/50 text-human-100 border-human-400/50'
            }
          `}>
            {hero.faction}
          </span>
          <div className={`
            flex items-center gap-2 px-4 py-1.5 rounded-full
            backdrop-blur-md border shadow-lg
            ${isMystical
              ? 'bg-mystical-500/40 border-mystical-400/40'
              : 'bg-human-500/40 border-human-400/40'
            }
          `}>
            <RoleIcon className={`w-4 h-4 ${isMystical ? 'text-mystical-200' : 'text-human-200'}`} />
            <span className={`text-xs uppercase font-medium ${isMystical ? 'text-mystical-100' : 'text-human-100'}`}>
              {hero.role}
            </span>
          </div>
        </div>

        {/* Hero info (bottom) with improved text visibility */}
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8" style={{ zIndex: 10 }}>
          {/* Semi-transparent backdrop for text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent -z-10" />

          {/* Name with stronger glow and shadow */}
          <div className="relative inline-block w-full">
            <HeroNameSparks />
            <h3
              className={`
                text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-2 text-center text-white
              `}
              style={{
                textShadow: `
                  0 2px 4px rgba(0,0,0,0.9),
                  0 4px 8px rgba(0,0,0,0.7),
                  ${isMystical
                    ? '0 0 40px rgba(99, 102, 241, 0.9), 0 0 80px rgba(99, 102, 241, 0.5)'
                    : '0 0 40px rgba(239, 68, 68, 0.9), 0 0 80px rgba(239, 68, 68, 0.5)'
                  }
                `
              }}
            >
              {hero.name}
            </h3>
          </div>

          {/* Title with shadow */}
          <p
            className="text-lg md:text-xl text-white text-center mb-1"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 8px rgba(0,0,0,0.7)' }}
          >
            {hero.title}
          </p>

          {/* True name */}
          {heroLore && (
            <p
              className={`text-sm text-center mb-4 ${isMystical ? 'text-mystical-300' : 'text-human-300'}`}
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
            >
              "{heroLore.trueName}"
            </p>
          )}

          {/* Difficulty indicator */}
          <div className="flex justify-center items-center gap-3 mb-4 px-4 py-2 rounded-lg bg-black/50 backdrop-blur-sm w-fit mx-auto">
            <span
              className="text-xs text-white font-semibold uppercase tracking-wider"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
            >
              Difficulty
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`
                    w-8 h-2.5 rounded-full transition-all duration-300
                    ${level <= hero.difficulty
                      ? isMystical
                        ? 'bg-gradient-to-r from-mystical-400 to-mystical-300 shadow-[0_0_8px_rgba(129,140,248,0.6)]'
                        : 'bg-gradient-to-r from-human-400 to-human-300 shadow-[0_0_8px_rgba(248,113,113,0.6)]'
                      : 'bg-gray-700/80 border border-gray-600'
                    }
                  `}
                />
              ))}
            </div>
          </div>

          {/* Stats rings with backdrop */}
          <div className="flex justify-center gap-4 md:gap-6 mb-4 p-3 rounded-xl bg-black/40 backdrop-blur-sm w-fit mx-auto">
            <StatRing
              value={hero.baseStats.maxHealth}
              max={800}
              label="HP"
              color="#22c55e"
            />
            <StatRing
              value={hero.baseStats.maxMana}
              max={500}
              label="MP"
              color="#3b82f6"
            />
            <StatRing
              value={hero.baseStats.attackDamage}
              max={70}
              label="ATK"
              color={isMystical ? '#818cf8' : '#f87171'}
            />
            <StatRing
              value={hero.baseStats.armor}
              max={40}
              label="DEF"
              color="#94a3b8"
            />
          </div>

          {/* Quote with improved visibility */}
          {heroLore && (
            <blockquote
              className="text-center text-sm italic max-w-md mx-auto leading-relaxed text-gray-200"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
            >
              "{heroLore.keyQuote}"
            </blockquote>
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={onPrevious}
          className={`
            absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full
            flex items-center justify-center
            backdrop-blur-md border transition-all duration-300 shadow-lg
            hover:scale-110 active:scale-95
            ${isMystical
              ? 'bg-mystical-500/30 border-mystical-400/40 hover:bg-mystical-500/50'
              : 'bg-human-500/30 border-human-400/40 hover:bg-human-500/50'
            }
          `}
        >
          <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={onNext}
          className={`
            absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full
            flex items-center justify-center
            backdrop-blur-md border transition-all duration-300 shadow-lg
            hover:scale-110 active:scale-95
            ${isMystical
              ? 'bg-mystical-500/30 border-mystical-400/40 hover:bg-mystical-500/50'
              : 'bg-human-500/30 border-human-400/40 hover:bg-human-500/50'
            }
          `}
        >
          <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Inner border glow */}
        <div className={`
          absolute inset-0 rounded-3xl pointer-events-none
          border-2 ${isMystical ? 'border-mystical-400/60' : 'border-human-400/60'}
        `} />
      </div>

      {/* Additional info panel */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Role info */}
        {roleInfo && (
          <div className={`
            p-4 rounded-xl backdrop-blur-sm border
            ${isMystical
              ? 'bg-mystical-500/10 border-mystical-500/20'
              : 'bg-human-500/10 border-human-500/20'
            }
          `}>
            <div className="flex items-center gap-2 mb-2">
              <RoleIcon className={`w-5 h-5 ${isMystical ? 'text-mystical-400' : 'text-human-400'}`} />
              <span className="text-sm font-bold text-white">{roleInfo.name}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{roleInfo.playstyle}</p>
          </div>
        )}

        {/* Combat style */}
        <div className={`
          p-4 rounded-xl backdrop-blur-sm border
          ${isMystical
            ? 'bg-mystical-500/10 border-mystical-500/20'
            : 'bg-human-500/10 border-human-500/20'
          }
        `}>
          <div className="flex items-center gap-2 mb-2">
            <svg className={`w-5 h-5 ${isMystical ? 'text-mystical-400' : 'text-human-400'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-bold text-white">Combat Style</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className={isMystical ? 'text-mystical-300' : 'text-human-300'}>
                {hero.attackType === 'melee' ? 'Melee' : 'Ranged'}
              </span>
              <span className="text-gray-600">({hero.baseStats.attackRange})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className={isMystical ? 'text-mystical-300' : 'text-human-300'}>
                {hero.baseStats.moveSpeed}
              </span>
              <span className="text-gray-600">MS</span>
            </span>
          </div>
        </div>
      </div>

      {/* Character traits */}
      {heroLore && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {heroLore.character.slice(0, 4).map((trait, idx) => (
            <span
              key={idx}
              className={`
                px-3 py-1 text-xs rounded-full border
                ${isMystical
                  ? 'bg-mystical-500/10 text-mystical-300 border-mystical-500/30'
                  : 'bg-human-500/10 text-human-300 border-human-500/30'
                }
              `}
            >
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Hero indicator dots
function HeroIndicators({
  heroes,
  currentIndex,
  onSelect,
}: {
  heroes: HeroDefinition[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex justify-center gap-2 flex-wrap max-w-xl mx-auto">
      {heroes.map((hero, index) => {
        const isActive = index === currentIndex;

        return (
          <button
            key={hero.id}
            onClick={() => onSelect(index)}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${isActive
                ? 'scale-125 bg-ancient-400'
                : 'bg-gray-600 hover:bg-gray-400'
              }
            `}
            title={hero.name}
          />
        );
      })}
    </div>
  );
}

export function HeroShowcase() {
  const [selectedFaction, setSelectedFaction] = useState<Faction | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const displayedHeroes = useMemo(() =>
    selectedFaction === 'all' ? Object.values(HEROES) : HEROES_BY_FACTION[selectedFaction],
    [selectedFaction]
  );

  const currentHero = displayedHeroes[currentIndex];
  const prevHero = displayedHeroes[(currentIndex - 1 + displayedHeroes.length) % displayedHeroes.length];
  const prevHero2 = displayedHeroes[(currentIndex - 2 + displayedHeroes.length) % displayedHeroes.length];
  const nextHero = displayedHeroes[(currentIndex + 1) % displayedHeroes.length];
  const nextHero2 = displayedHeroes[(currentIndex + 2) % displayedHeroes.length];

  // Reset index when faction changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedFaction]);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prev => {
        if (direction === 'prev') {
          return (prev - 1 + displayedHeroes.length) % displayedHeroes.length;
        }
        return (prev + 1) % displayedHeroes.length;
      });
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, displayedHeroes.length]);

  const handleSelectIndex = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <section id="heroes" className="pt-8 pb-20 md:pt-12 md:pb-32 px-4 relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/assets/forge_hero.png")' }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
        {/* Top fade to game-dark */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-game-dark to-transparent" />
        {/* Bottom fade to game-dark */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-game-dark to-transparent" />
      </div>

      <div className="max-w-[1800px] mx-auto relative">
        {/* Section Header - Forge Your Legend with metallic colors */}
        <div className="text-center mb-12 md:mb-16 relative">
          <div className="relative inline-block">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent" />
              <span className="text-gray-500 text-2xl">⚔</span>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent" />
            </div>
            <h2
              className="text-5xl md:text-6xl lg:text-8xl font-display font-black tracking-wider mb-4"
              style={{
                background: 'linear-gradient(180deg, #e5e5e5 0%, #a1a1aa 40%, #71717a 70%, #52525b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              FORGE YOUR LEGEND
            </h2>
            {/* Flying sparks around the title */}
            <ForgeSparks />
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
            Heroes of myth and might await your command
          </p>
        </div>

        {/* Faction Filter - Stone Tablets with muted glows */}
        <div className="flex justify-center gap-3 md:gap-4 mb-12 flex-wrap">
          {/* All */}
          <button
            onClick={() => setSelectedFaction('all')}
            className={`
              group relative px-6 md:px-8 py-3 font-display font-bold uppercase tracking-wider text-sm
              transition-all duration-300 hover:scale-105
              ${selectedFaction === 'all' ? 'text-amber-100' : 'text-gray-400'}
            `}
          >
            <div className={`
              absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl
              bg-gradient-to-r from-amber-700/20 via-ancient-600/25 to-amber-700/20
            `} />
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                background: selectedFaction === 'all'
                  ? 'linear-gradient(135deg, #4a4033 0%, #3d352b 50%, #2e2820 100%)'
                  : 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 50%, #171717 100%)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)',
              }}
            />
            <div className={`absolute inset-0 rounded-sm border-2 transition-colors duration-300 ${selectedFaction === 'all' ? 'border-amber-600/50' : 'border-stone-700/50 group-hover:border-amber-700/40'}`} />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-600 group-hover:text-amber-500/70 opacity-50 group-hover:opacity-80 transition-all">ᚠ</div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-600 group-hover:text-amber-500/70 opacity-50 group-hover:opacity-80 transition-all">ᚠ</div>
            <span className="relative z-10">All Heroes</span>
          </button>
          {/* Mystical */}
          <button
            onClick={() => setSelectedFaction('mystical')}
            className={`
              group relative px-6 md:px-8 py-3 font-display font-bold uppercase tracking-wider text-sm
              transition-all duration-300 hover:scale-105
              ${selectedFaction === 'mystical' ? 'text-mystical-100' : 'text-gray-400'}
            `}
          >
            <div className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl bg-mystical-600/20" />
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                background: selectedFaction === 'mystical'
                  ? 'linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f0e2e 100%)'
                  : 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 50%, #171717 100%)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)',
              }}
            />
            <div className={`absolute inset-0 rounded-sm border-2 transition-colors duration-300 ${selectedFaction === 'mystical' ? 'border-mystical-500/50' : 'border-stone-700/50 group-hover:border-mystical-600/40'}`} />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-mystical-700 group-hover:text-mystical-500/70 opacity-50 group-hover:opacity-80 transition-all">ᛟ</div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-mystical-700 group-hover:text-mystical-500/70 opacity-50 group-hover:opacity-80 transition-all">ᛞ</div>
            <span className="relative z-10">Mystical</span>
          </button>
          {/* Human */}
          <button
            onClick={() => setSelectedFaction('human')}
            className={`
              group relative px-6 md:px-8 py-3 font-display font-bold uppercase tracking-wider text-sm
              transition-all duration-300 hover:scale-105
              ${selectedFaction === 'human' ? 'text-human-100' : 'text-gray-400'}
            `}
          >
            <div className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl bg-human-600/20" />
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                background: selectedFaction === 'human'
                  ? 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 50%, #1c0505 100%)'
                  : 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 50%, #171717 100%)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)',
              }}
            />
            <div className={`absolute inset-0 rounded-sm border-2 transition-colors duration-300 ${selectedFaction === 'human' ? 'border-human-500/50' : 'border-stone-700/50 group-hover:border-human-600/40'}`} />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-human-700 group-hover:text-human-500/70 opacity-50 group-hover:opacity-80 transition-all">ᚢ</div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-human-700 group-hover:text-human-500/70 opacity-50 group-hover:opacity-80 transition-all">ᚦ</div>
            <span className="relative z-10">Human</span>
          </button>
        </div>

        {/* Arena Carousel Layout */}
        <div className="flex items-center justify-center gap-4 md:gap-8 lg:gap-12 mb-10">
          {/* Previous heroes (left side) - stacked */}
          <div className="hidden md:flex items-center">
            {/* Background card (second previous) */}
            {prevHero2 && displayedHeroes.length > 2 && (
              <div
                className="pointer-events-none -mr-[170px] md:-mr-[190px]"
                style={{
                  transform: 'scale(0.88)',
                  opacity: 0.5,
                  filter: 'brightness(0.7)',
                  zIndex: 0,
                }}
              >
                <BackgroundHeroCard
                  hero={prevHero2}
                />
              </div>
            )}
            {/* Front card (previous) */}
            <div className="relative opacity-60 hover:opacity-100 transition-opacity" style={{ zIndex: 1 }}>
              {prevHero && (
                <SideHeroCard
                  hero={prevHero}
                  position="left"
                  onClick={() => navigate('prev')}
                  isAnimating={isTransitioning}
                />
              )}
            </div>
          </div>

          {/* Current hero (center) */}
          {currentHero && (
            <CentralHeroShowcase
              hero={currentHero}
              isTransitioning={isTransitioning}
              onPrevious={() => navigate('prev')}
              onNext={() => navigate('next')}
            />
          )}

          {/* Next heroes (right side) - stacked */}
          <div className="hidden md:flex items-center">
            {/* Front card (next) */}
            <div className="relative opacity-60 hover:opacity-100 transition-opacity" style={{ zIndex: 1 }}>
              {nextHero && (
                <SideHeroCard
                  hero={nextHero}
                  position="right"
                  onClick={() => navigate('next')}
                  isAnimating={isTransitioning}
                />
              )}
            </div>
            {/* Background card (second next) */}
            {nextHero2 && displayedHeroes.length > 2 && (
              <div
                className="pointer-events-none -ml-[170px] md:-ml-[190px]"
                style={{
                  transform: 'scale(0.88)',
                  opacity: 0.5,
                  filter: 'brightness(0.7)',
                  zIndex: 0,
                }}
              >
                <BackgroundHeroCard
                  hero={nextHero2}
                />
              </div>
            )}
          </div>
        </div>

        {/* Hero indicators */}
        <div className="mb-8">
          <HeroIndicators
            heroes={displayedHeroes}
            currentIndex={currentIndex}
            onSelect={handleSelectIndex}
          />
        </div>

        {/* Keyboard hint */}
        <div className="text-center">
          <p className="text-gray-600 text-xs">
            Use <kbd className="px-2 py-0.5 bg-white/5 rounded border border-white/10 text-gray-400 mx-1">←</kbd>
            <kbd className="px-2 py-0.5 bg-white/5 rounded border border-white/10 text-gray-400 mx-1">→</kbd>
            to navigate
          </p>
        </div>

        {/* Bottom Quote */}
        <div className="mt-16 md:mt-24 text-center">
          <div className="inline-flex items-center gap-6 mb-6">
            <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent via-mystical-500/50 to-transparent" />
            <span className="text-gray-500 text-sm uppercase tracking-wider">
              {Object.keys(HEROES).length} Champions Await
            </span>
            <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent via-human-500/50 to-transparent" />
          </div>

          <p className="text-gray-500 italic max-w-xl mx-auto text-lg">
            "Every hero carries the burden of their past. Some fight to forget. Others fight to
            remember. All fight because they must."
          </p>
        </div>
      </div>
    </section>
  );
}
