import { useState, FormEvent, useEffect, useRef } from 'react';
import { Input } from '../ui';

// Stone Tablet Button - fantasy styled button
function StoneTabletButton({
  children,
  onClick,
  type = 'button',
  isLoading = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`
        group relative px-10 py-4 font-display font-bold uppercase tracking-wider
        transition-all duration-300 hover:scale-105
        text-amber-100
        ${isLoading ? 'opacity-70 cursor-wait' : ''}
        ${className}
      `}
    >
      {/* Outer glow on hover */}
      <div className="absolute -inset-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl bg-gradient-to-r from-amber-600/40 via-ancient-500/50 to-amber-600/40" />

      {/* Stone texture background */}
      <div
        className="absolute inset-0 rounded-sm"
        style={{
          background: 'linear-gradient(135deg, #4a4033 0%, #3d352b 50%, #2e2820 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)',
        }}
      />

      {/* Carved edge effect */}
      <div className="absolute inset-0 rounded-sm border-2 transition-colors duration-300 border-stone-600/50 group-hover:border-amber-600/70" />
      <div className="absolute inset-[3px] rounded-sm border border-stone-800/50" />

      {/* Rune carvings on sides */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs transition-all duration-300 text-stone-500 group-hover:text-amber-400 opacity-60 group-hover:opacity-100">ᚱ</div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs transition-all duration-300 text-stone-500 group-hover:text-amber-400 opacity-60 group-hover:opacity-100">ᚦ</div>

      {/* Cracked texture overlay */}
      <div
        className="absolute inset-0 opacity-10 rounded-sm"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L15 25 L30 35 L45 28 L60 30' stroke='%23000' fill='none' stroke-width='0.5'/%3E%3Cpath d='M30 0 L25 20 L35 40 L28 60' stroke='%23000' fill='none' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Embossed text effect */}
      <span
        className="relative z-10 flex items-center justify-center gap-2"
        style={{
          textShadow: '1px 1px 0 rgba(0,0,0,0.5), -1px -1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : children}
      </span>

      {/* Inner hover glow */}
      <div className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-amber-500/15" />
    </button>
  );
}

// Animated particles for background
function FloatingRunes() {
  const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛃ', 'ᛇ', 'ᛈ'];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-ancient-500/20 font-display animate-float-drift"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${12 + Math.random() * 16}px`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${15 + Math.random() * 10}s`,
          }}
        >
          {runes[Math.floor(Math.random() * runes.length)]}
        </div>
      ))}
    </div>
  );
}

// Animated war horn SVG
function WarHornIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="hornGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a16207" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
      {/* Horn body */}
      <path
        d="M12 32 Q16 20 32 16 Q48 12 56 20 L58 22 Q52 28 48 32 Q44 36 40 38 L16 40 Q12 38 12 32Z"
        fill="url(#hornGradient)"
        className="drop-shadow-lg"
      />
      {/* Horn rings */}
      <ellipse cx="14" cy="34" rx="4" ry="6" fill="#92400e" opacity="0.8" />
      <ellipse cx="20" cy="33" rx="2" ry="4" fill="#92400e" opacity="0.6" />
      {/* Sound waves */}
      <path
        d="M52 28 Q56 26 58 22"
        stroke="#eab308"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-pulse"
        opacity="0.6"
      />
      <path
        d="M50 32 Q56 30 60 24"
        stroke="#eab308"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="animate-pulse"
        style={{ animationDelay: '0.2s' }}
        opacity="0.4"
      />
      <path
        d="M48 36 Q56 34 62 26"
        stroke="#eab308"
        strokeWidth="1"
        strokeLinecap="round"
        className="animate-pulse"
        style={{ animationDelay: '0.4s' }}
        opacity="0.3"
      />
    </svg>
  );
}

// Custom SVG icons for rewards

// Beta Access - Ancient Portal/Gateway
function BetaKeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="portalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="portalInner" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="50%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#0f0a1e" />
        </linearGradient>
        <filter id="portalGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
        </filter>
      </defs>
      {/* Outer mystical glow */}
      <ellipse cx="32" cy="32" rx="26" ry="26" fill="#a855f7" opacity="0.25" filter="url(#portalGlow)" />
      {/* Stone archway */}
      <path d="M12 54 L12 24 Q12 8 32 8 Q52 8 52 24 L52 54" stroke="url(#portalGradient)" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Archway inner edge */}
      <path d="M17 54 L17 26 Q17 14 32 14 Q47 14 47 26 L47 54" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.5" />
      {/* Portal vortex */}
      <ellipse cx="32" cy="34" rx="12" ry="16" fill="url(#portalInner)" />
      {/* Swirling energy lines */}
      <path d="M26 28 Q32 32 26 40" stroke="#c084fc" strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M38 28 Q32 32 38 40" stroke="#c084fc" strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M32 22 Q28 34 32 46" stroke="#e9d5ff" strokeWidth="1" fill="none" opacity="0.6" />
      {/* Rune stones on pillars */}
      <rect x="10" y="44" width="6" height="10" fill="#6b21a8" rx="1" />
      <rect x="48" y="44" width="6" height="10" fill="#6b21a8" rx="1" />
      <text x="13" y="51" fill="#c084fc" fontSize="6" fontFamily="serif">ᚨ</text>
      <text x="51" y="51" fill="#c084fc" fontSize="6" fontFamily="serif">ᚱ</text>
      {/* Keystone */}
      <path d="M28 8 L32 4 L36 8 L34 10 L30 10 Z" fill="url(#portalGradient)" />
      {/* Magical particles emerging */}
      <circle cx="32" cy="28" r="2" fill="#e9d5ff" className="animate-pulse" />
      <circle cx="28" cy="36" r="1.5" fill="#c084fc" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
      <circle cx="36" cy="32" r="1" fill="#a855f7" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
      <circle cx="32" cy="42" r="1.5" fill="#e9d5ff" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
    </svg>
  );
}

// Founder Badge - Ancient Wax Seal with Dragon Emblem
function FounderBadgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="sealGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="25%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="75%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="sealWax" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#991b1b" />
          <stop offset="50%" stopColor="#7f1d1d" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
        <filter id="sealShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.5" />
        </filter>
      </defs>
      {/* Outer glow */}
      <circle cx="32" cy="32" r="28" fill="#f59e0b" opacity="0.2" filter="url(#sealShadow)" />
      {/* Wax seal base - irregular circle */}
      <path d="M32 6 Q48 8 54 20 Q58 32 54 44 Q48 56 32 58 Q16 56 10 44 Q6 32 10 20 Q16 8 32 6" fill="url(#sealWax)" />
      {/* Wax drips */}
      <ellipse cx="14" cy="32" rx="4" ry="6" fill="url(#sealWax)" />
      <ellipse cx="50" cy="28" rx="3" ry="5" fill="url(#sealWax)" />
      <ellipse cx="32" cy="56" rx="5" ry="4" fill="url(#sealWax)" />
      {/* Inner raised ring */}
      <circle cx="32" cy="32" r="18" stroke="url(#sealGold)" strokeWidth="3" fill="none" />
      <circle cx="32" cy="32" r="14" stroke="#92400e" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Dragon silhouette */}
      <path d="M24 38 Q20 34 22 28 Q24 24 28 24 L30 22 Q32 20 34 22 L36 24 Q40 24 42 28 Q44 34 40 38 L38 36 Q36 40 32 42 Q28 40 26 36 Z" fill="url(#sealGold)" />
      {/* Dragon details */}
      <circle cx="27" cy="28" r="1.5" fill="#92400e" /> {/* eye */}
      <circle cx="37" cy="28" r="1.5" fill="#92400e" /> {/* eye */}
      <path d="M30 32 L32 36 L34 32" stroke="#92400e" strokeWidth="1" fill="none" /> {/* snout */}
      {/* Crown above dragon */}
      <path d="M26 20 L28 16 L30 19 L32 14 L34 19 L36 16 L38 20" stroke="url(#sealGold)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Corner flourishes */}
      <path d="M18 18 Q14 22 18 26" stroke="url(#sealGold)" strokeWidth="1.5" fill="none" opacity="0.7" />
      <path d="M46 18 Q50 22 46 26" stroke="url(#sealGold)" strokeWidth="1.5" fill="none" opacity="0.7" />
      <path d="M18 46 Q14 42 18 38" stroke="url(#sealGold)" strokeWidth="1.5" fill="none" opacity="0.7" />
      <path d="M46 46 Q50 42 46 38" stroke="url(#sealGold)" strokeWidth="1.5" fill="none" opacity="0.7" />
      {/* Sparkles */}
      <circle cx="20" cy="14" r="1.5" fill="#fef3c7" className="animate-pulse" />
      <circle cx="44" cy="50" r="1" fill="#fcd34d" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
    </svg>
  );
}

// Legendary Skin - Celestial Dragon Armor Chest
function LegendarySkinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="chestWood" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="50%" stopColor="#451a03" />
          <stop offset="100%" stopColor="#1c0a00" />
        </linearGradient>
        <linearGradient id="chestGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="25%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="75%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="gemBlue" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="lightBeam" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="chestGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
        </filter>
        <filter id="gemGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
        </filter>
      </defs>
      {/* Mystical glow behind chest */}
      <ellipse cx="32" cy="36" rx="24" ry="20" fill="#0ea5e9" opacity="0.3" filter="url(#chestGlow)" />
      {/* Light beams emerging from chest */}
      <path d="M28 24 L24 4" stroke="url(#lightBeam)" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 22 L32 2" stroke="url(#lightBeam)" strokeWidth="4" strokeLinecap="round" />
      <path d="M36 24 L40 4" stroke="url(#lightBeam)" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 26 L14 10" stroke="url(#lightBeam)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M40 26 L50 10" stroke="url(#lightBeam)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      {/* Chest lid - open */}
      <path d="M8 32 L12 18 L52 18 L56 32" fill="url(#chestWood)" />
      <path d="M10 32 L14 20 L50 20 L54 32" fill="#5c2d0a" opacity="0.5" />
      {/* Lid gold trim */}
      <path d="M12 18 L52 18" stroke="url(#chestGold)" strokeWidth="2" />
      <path d="M8 32 L56 32" stroke="url(#chestGold)" strokeWidth="2" />
      {/* Chest body */}
      <path d="M8 32 L8 52 Q8 56 12 56 L52 56 Q56 56 56 52 L56 32 Z" fill="url(#chestWood)" />
      {/* Wood planks texture */}
      <path d="M8 40 L56 40" stroke="#3d1a00" strokeWidth="1" opacity="0.5" />
      <path d="M8 48 L56 48" stroke="#3d1a00" strokeWidth="1" opacity="0.5" />
      {/* Gold corner brackets */}
      <path d="M8 32 L8 38 M8 32 L14 32" stroke="url(#chestGold)" strokeWidth="3" strokeLinecap="round" />
      <path d="M56 32 L56 38 M56 32 L50 32" stroke="url(#chestGold)" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 56 L8 50 M8 56 L14 56" stroke="url(#chestGold)" strokeWidth="3" strokeLinecap="round" />
      <path d="M56 56 L56 50 M56 56 L50 56" stroke="url(#chestGold)" strokeWidth="3" strokeLinecap="round" />
      {/* Center lock plate */}
      <rect x="26" y="38" width="12" height="14" rx="2" fill="url(#chestGold)" />
      <rect x="28" y="40" width="8" height="10" rx="1" fill="#78350f" />
      {/* Keyhole */}
      <circle cx="32" cy="44" r="2" fill="url(#chestGold)" />
      <rect x="31" y="44" width="2" height="4" fill="url(#chestGold)" />
      {/* Glowing gem inside chest */}
      <ellipse cx="32" cy="28" rx="6" ry="5" fill="url(#gemBlue)" />
      <ellipse cx="32" cy="28" rx="6" ry="5" fill="#7dd3fc" opacity="0.5" filter="url(#gemGlow)" />
      <ellipse cx="30" cy="26" rx="2" ry="1.5" fill="#ffffff" opacity="0.8" />
      {/* Floating magical particles */}
      <circle cx="20" cy="14" r="1.5" fill="#7dd3fc" className="animate-pulse" />
      <circle cx="44" cy="12" r="2" fill="#0ea5e9" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
      <circle cx="32" cy="8" r="1.5" fill="#ffffff" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
      <circle cx="16" cy="22" r="1" fill="#7dd3fc" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
      <circle cx="48" cy="20" r="1" fill="#0ea5e9" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
      {/* Gold studs on chest */}
      <circle cx="18" cy="44" r="2" fill="url(#chestGold)" />
      <circle cx="46" cy="44" r="2" fill="url(#chestGold)" />
      {/* Decorative dragon heads on sides */}
      <path d="M10 44 Q6 42 6 38 Q8 40 10 38" fill="url(#chestGold)" />
      <path d="M54 44 Q58 42 58 38 Q56 40 54 38" fill="url(#chestGold)" />
    </svg>
  );
}

// Reward card with animation
function RewardCard({
  icon,
  title,
  description,
  delay,
  color,
  rarity
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  color: 'mystical' | 'ancient' | 'human';
  rarity: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const colorConfig = {
    mystical: {
      border: 'border-purple-500/40 group-hover:border-purple-400/70',
      bg: 'from-purple-950/80 via-purple-900/40 to-purple-950/80',
      glow: 'group-hover:shadow-purple-500/40',
      accent: 'text-purple-400',
      rarityBg: 'bg-purple-500/20 border-purple-500/40',
    },
    ancient: {
      border: 'border-amber-500/40 group-hover:border-amber-400/70',
      bg: 'from-amber-950/80 via-amber-900/40 to-amber-950/80',
      glow: 'group-hover:shadow-amber-500/40',
      accent: 'text-amber-400',
      rarityBg: 'bg-amber-500/20 border-amber-500/40',
    },
    human: {
      border: 'border-blue-500/40 group-hover:border-blue-400/70',
      bg: 'from-blue-950/80 via-blue-900/40 to-blue-950/80',
      glow: 'group-hover:shadow-blue-500/40',
      accent: 'text-blue-400',
      rarityBg: 'bg-blue-500/20 border-blue-500/40',
    },
  };

  const config = colorConfig[color];

  return (
    <div
      ref={ref}
      className={`
        group relative overflow-hidden rounded-xl transition-all duration-700
        ${config.glow} group-hover:shadow-2xl hover:scale-105
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Animated border */}
      <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-br from-white/20 via-transparent to-white/10">
        <div className={`absolute inset-0 rounded-xl border ${config.border} transition-colors duration-300`} />
      </div>

      {/* Badge background image */}
      <div
        className="absolute inset-0 rounded-xl opacity-[0.15]"
        style={{
          backgroundImage: 'url("/assets/badge.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Card background color overlay */}
      <div className={`absolute inset-[1px] rounded-xl bg-gradient-to-br ${config.bg}`} />

      {/* Outer shadow effect */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 8px 40px rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Animated background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
        }}
      />

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/20 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/20 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-white/20 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/20 rounded-br-xl" />

      <div className="relative p-6 text-center">
        {/* Rarity badge */}
        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config.rarityBg} ${config.accent} border`}>
          {rarity}
        </div>

        {/* Icon container with glow */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          {/* Glow ring */}
          <div className={`absolute inset-0 rounded-full ${config.accent} opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500`}
               style={{ background: `radial-gradient(circle, currentColor 0%, transparent 70%)` }} />

          {/* Icon */}
          <div className="relative w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
        </div>

        {/* Title with gradient */}
        <div className={`font-display font-bold text-lg mb-2 ${config.accent}`}>
          {title}
        </div>

        {/* Description */}
        <div className="text-sm text-gray-400 leading-relaxed">{description}</div>

        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent ${config.accent} to-transparent opacity-50 group-hover:opacity-100 group-hover:w-24 transition-all duration-500`} />
      </div>
    </div>
  );
}

// Countdown component
function LaunchCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set launch date to 3 months from now for demo
    const launchDate = new Date();
    launchDate.setMonth(launchDate.getMonth() + 3);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center gap-4 mb-8">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hours' },
        { value: timeLeft.minutes, label: 'Minutes' },
        { value: timeLeft.seconds, label: 'Seconds' },
      ].map((item, index) => (
        <div key={item.label} className="text-center">
          <div
            className="w-16 h-16 rounded-lg bg-game-card border border-ancient-500/30 flex items-center justify-center mb-2 relative overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-ancient-500/10 to-transparent" />
            <span className="relative font-display text-2xl font-bold text-ancient-400">
              {String(item.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [waitlistCount] = useState(2847); // Simulated count

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');

    // Simulate API call - replace with actual endpoint later
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, just show success
    setStatus('success');
    setMessage('You\'re on the list! We\'ll notify you when Sundering launches.');
    setEmail('');
  };

  return (
    <section id="newsletter" className="py-32 px-4 relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-game-dark via-game-darker to-game-dark" />

      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-mystical-500/10 rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-human-500/10 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '-5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-ancient-500/10 rounded-full blur-[150px]" />

      {/* Floating runes */}
      <FloatingRunes />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(161,98,7,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(161,98,7,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* War horn icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-ancient-500/30 blur-2xl rounded-full" />
            <WarHornIcon className="relative w-24 h-24" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-ancient-500/20 via-ancient-500/10 to-ancient-500/20 border border-ancient-500/30 mb-8">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ancient-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-ancient-500"></span>
          </span>
          <span className="font-display text-ancient-400 tracking-wider">BETA COMING SOON</span>
        </div>

        {/* Main heading */}
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6">
          <span className="text-white">The War</span>
          <br />
          <span className="bg-gradient-to-r from-ancient-400 via-ancient-300 to-ancient-400 bg-clip-text text-transparent">
            Awaits You
          </span>
        </h2>

        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
          Join <span className="text-ancient-400 font-semibold">{waitlistCount.toLocaleString()}</span> warriors
          on the waitlist. Be among the first to enter the ancient battlegrounds.
        </p>

        {/* Countdown */}
        <LaunchCountdown />

        {/* Form / Success state */}
        {status === 'success' ? (
          <div className="max-w-xl mx-auto">
            <div className="relative rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-900/10 p-10 overflow-hidden">
              {/* Success particles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-green-400 rounded-full animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>

              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-3">Warrior Enlisted!</h3>
                <p className="text-gray-400">{message}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="relative rounded-2xl border border-ancient-500/30 bg-gradient-to-br from-game-card to-game-dark p-8 overflow-hidden"
            >
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-ancient-500/50 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-ancient-500/50 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-ancient-500/50 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-ancient-500/50 rounded-br-lg" />

              <div className="relative">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter your battle email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={status === 'error' ? message : undefined}
                      className="h-14 text-lg"
                    />
                  </div>
                  <StoneTabletButton
                    type="submit"
                    isLoading={status === 'loading'}
                    className="h-14"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Enlist Now
                  </StoneTabletButton>
                </div>
                <p className="text-gray-600 text-sm mt-4 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Your information is sacred. We never share or spam.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Rewards Preview */}
        <div className="mt-16">
          <h3 className="text-lg font-display text-gray-400 mb-8 tracking-wider uppercase">
            Early Warrior Rewards
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <RewardCard
              icon={<BetaKeyIcon className="w-16 h-16" />}
              title="Beta Access"
              description="Exclusive key to enter the battlegrounds before anyone else"
              delay={0}
              color="mystical"
              rarity="Epic"
            />
            <RewardCard
              icon={<FounderBadgeIcon className="w-16 h-16" />}
              title="Founder Badge"
              description="Eternal mark of honor displayed on your profile forever"
              delay={150}
              color="ancient"
              rarity="Legendary"
            />
            <RewardCard
              icon={<LegendarySkinIcon className="w-16 h-16" />}
              title="Legendary Skin"
              description="Unique armor set that will never be obtainable again"
              delay={300}
              color="human"
              rarity="Mythic"
            />
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-6 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-game-dark bg-gradient-to-br from-gray-600 to-gray-800"
                  style={{ zIndex: 4 - i }}
                />
              ))}
            </div>
            <span>+{(waitlistCount - 4).toLocaleString()} warriors waiting</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-gray-700" />
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>No credit card required</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-gray-700" />
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-ancient-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>100% secure signup</span>
          </div>
        </div>
      </div>
    </section>
  );
}
