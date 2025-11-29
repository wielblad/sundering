import { useState } from 'react';
import type { HeroDefinition } from '@sundering/shared';
import { HERO_LORE, ROLE_INFO } from '../../constants/loreData';

// Heroes that have actual artwork available
const HEROES_WITH_ASSETS = ['ironclad', 'bladewarden', 'pyralis', 'nightshade', 'sylara', 'vex', 'thornweaver', 'magnus', 'frostborne', 'grimjaw', 'valeria', 'zephyr', 'hex', 'scourge'] as const;

function hasHeroAssets(heroId: string): boolean {
  return HEROES_WITH_ASSETS.includes(heroId as (typeof HEROES_WITH_ASSETS)[number]);
}

function getHeroAvatarPath(heroId: string): string {
  return `/assets/heroes/${heroId}/avatar.png`;
}

// Role Icon SVG Components
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

// Difficulty Indicator Component
function DifficultyIndicator({
  difficulty,
  isMystical,
}: {
  difficulty: number;
  isMystical: boolean;
}) {
  return (
    <div className="flex gap-1" title={`Difficulty: ${difficulty}/3`}>
      {[1, 2, 3].map((level) => (
        <div
          key={level}
          className={`
            w-2 h-2 rounded-full transition-colors duration-300
            ${
              level <= difficulty
                ? isMystical
                  ? 'bg-mystical-400'
                  : 'bg-human-400'
                : 'bg-gray-700'
            }
          `}
        />
      ))}
    </div>
  );
}

// Faction Badge Component
function FactionBadge({ faction }: { faction: 'mystical' | 'human' }) {
  const isMystical = faction === 'mystical';
  return (
    <span
      className={`
        px-2 py-0.5 text-xs rounded-full uppercase font-medium tracking-wider
        ${
          isMystical
            ? 'bg-mystical-500/20 text-mystical-400 border border-mystical-500/30'
            : 'bg-human-500/20 text-human-400 border border-human-500/30'
        }
      `}
    >
      {faction}
    </span>
  );
}

// Hero Portrait - uses actual artwork if available, otherwise styled placeholder
function HeroPortrait({
  hero,
  showRoleIcon = true,
}: {
  hero: HeroDefinition;
  showRoleIcon?: boolean;
}) {
  const isMystical = hero.faction === 'mystical';
  const RoleIcon = RoleIcons[hero.role] || RoleIcons.warrior;
  const hasAssets = hasHeroAssets(hero.id);

  return (
    <div
      className={`
        relative w-full aspect-[3/4] rounded-lg overflow-hidden
        ${!hasAssets ? `bg-gradient-to-br ${
          isMystical
            ? 'from-mystical-900 via-mystical-800/80 to-indigo-900'
            : 'from-human-900 via-orange-800/80 to-yellow-900/90'
        }` : ''}
      `}
    >
      {/* Actual hero avatar image if available */}
      {hasAssets && (
        <img
          src={getHeroAvatarPath(hero.id)}
          alt={hero.name}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      )}

      {/* Abstract pattern overlay for placeholders */}
      {!hasAssets && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, ${isMystical ? 'rgba(79, 70, 229, 0.4)' : 'rgba(185, 28, 28, 0.4)'} 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${isMystical ? 'rgba(6, 182, 212, 0.3)' : 'rgba(217, 119, 6, 0.3)'} 0%, transparent 50%)`,
          }}
        />
      )}

      {/* Role Icon in center - only for placeholders */}
      {!hasAssets && showRoleIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              ${isMystical ? 'bg-mystical-500/20' : 'bg-human-500/20'}
            `}
          >
            <RoleIcon
              className={`w-10 h-10 ${isMystical ? 'text-mystical-400/80' : 'text-human-400/80'}`}
            />
          </div>
        </div>
      )}

      {/* Hero Initial (bottom right) - only for placeholders */}
      {!hasAssets && (
        <span
          className={`
            absolute bottom-3 right-3 text-5xl font-display font-bold opacity-20
            ${isMystical ? 'text-mystical-300' : 'text-human-300'}
          `}
        >
          {hero.name.charAt(0)}
        </span>
      )}

      {/* Gradient overlay at bottom for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
}

// Main HeroCard Props
interface HeroCardProps {
  hero: HeroDefinition;
  variant?: 'grid' | 'compact' | 'detailed';
  isSelected?: boolean;
  isLocked?: boolean;
  showLore?: boolean;
  onClick?: () => void;
  onHover?: (hero: HeroDefinition | null) => void;
}

/**
 * Reusable HeroCard Component
 *
 * Displays hero information with faction-themed styling.
 *
 * Variants:
 * - grid: Standard card for landing page showcase (default)
 * - compact: Smaller card for hero selection grid
 * - detailed: Full info card with lore excerpt
 */
export function HeroCard({
  hero,
  variant = 'grid',
  isSelected = false,
  isLocked = false,
  showLore = false,
  onClick,
  onHover,
}: HeroCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isMystical = hero.faction === 'mystical';
  const heroLore = HERO_LORE[hero.id];
  const roleInfo = ROLE_INFO[hero.role];
  const RoleIcon = RoleIcons[hero.role] || RoleIcons.warrior;

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(hero);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(null);
  };

  // Compact variant for hero selection
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={isLocked}
        className={`
          relative group transition-all duration-300
          ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isSelected ? 'scale-105 z-10' : 'hover:scale-102'}
        `}
      >
        <div
          className={`
            card-game p-2 h-full relative overflow-hidden
            ${isSelected ? (isMystical ? 'glow-mystical border-mystical-500' : 'glow-human border-human-500') : ''}
            ${!isSelected && !isLocked ? (isMystical ? 'hover:border-mystical-500/50' : 'hover:border-human-500/50') : ''}
          `}
        >
          {/* Portrait */}
          <HeroPortrait hero={hero} showRoleIcon={false} />

          {/* Role badge */}
          <div
            className={`
              absolute top-3 right-3 w-6 h-6 rounded flex items-center justify-center
              ${isMystical ? 'bg-mystical-500/40' : 'bg-human-500/40'}
            `}
          >
            <RoleIcon
              className={`w-4 h-4 ${isMystical ? 'text-mystical-300' : 'text-human-300'}`}
            />
          </div>

          {/* Difficulty */}
          <div className="absolute bottom-3 left-3">
            <DifficultyIndicator difficulty={hero.difficulty} isMystical={isMystical} />
          </div>

          {/* Hero Name Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <h4
              className={`
                font-display font-bold text-sm text-center
                ${isMystical ? 'text-mystical-300' : 'text-human-300'}
              `}
            >
              {hero.name}
            </h4>
          </div>

          {/* Locked Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Taken</span>
            </div>
          )}
        </div>

        {/* Hover Quote Tooltip */}
        {isHovered && heroLore && !isLocked && (
          <div
            className={`
              absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full z-20
              px-3 py-2 rounded-lg max-w-[200px] text-center
              ${isMystical ? 'bg-mystical-900/95 border border-mystical-500/30' : 'bg-human-900/95 border border-human-500/30'}
            `}
          >
            <p className="text-xs italic text-gray-300">"{heroLore.keyQuote}"</p>
          </div>
        )}
      </button>
    );
  }

  // Detailed variant with full lore
  if (variant === 'detailed') {
    return (
      <div
        className={`
          card-game p-6 relative overflow-hidden
          ${isMystical ? 'border-mystical-500/30' : 'border-human-500/30'}
        `}
      >
        {/* Background gradient */}
        <div
          className={`
            absolute inset-0 opacity-30
            bg-gradient-to-br ${isMystical ? 'from-mystical-900/50' : 'from-human-900/50'} to-transparent
          `}
        />

        <div className="relative grid md:grid-cols-[200px_1fr] gap-6">
          {/* Portrait */}
          <div>
            <HeroPortrait hero={hero} />
            <div className="mt-3 flex justify-between items-center">
              <FactionBadge faction={hero.faction} />
              <DifficultyIndicator difficulty={hero.difficulty} isMystical={isMystical} />
            </div>
          </div>

          {/* Info */}
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3
                  className={`
                    text-2xl font-display font-bold
                    ${isMystical ? 'text-mystical-300' : 'text-human-300'}
                  `}
                >
                  {hero.name}
                </h3>
                <p className="text-gray-400">{hero.title}</p>
                {heroLore && (
                  <p className="text-sm text-gray-500 mt-1">
                    True Name:{' '}
                    <span className={isMystical ? 'text-mystical-400' : 'text-human-400'}>
                      {heroLore.trueName}
                    </span>
                  </p>
                )}
              </div>
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${isMystical ? 'bg-mystical-500/20' : 'bg-human-500/20'}
                `}
              >
                <RoleIcon
                  className={`w-6 h-6 ${isMystical ? 'text-mystical-400' : 'text-human-400'}`}
                />
              </div>
            </div>

            {/* Role Info */}
            {roleInfo && (
              <div className="mb-4 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                  {roleInfo.name}
                </p>
                <p className="text-sm text-gray-400">{roleInfo.playstyle}</p>
              </div>
            )}

            {/* Description */}
            <p className="text-gray-400 mb-4">{hero.shortDescription}</p>

            {/* Lore */}
            {showLore && heroLore && (
              <div className="border-t border-white/10 pt-4 mt-4">
                <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                  Origin: {heroLore.origin}
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed mb-3">
                  {heroLore.historyExcerpt}
                </p>
                <blockquote
                  className={`
                    pl-3 border-l-2 text-sm italic
                    ${isMystical ? 'border-mystical-500/50 text-mystical-400/80' : 'border-human-500/50 text-human-400/80'}
                  `}
                >
                  "{heroLore.keyQuote}"
                </blockquote>
              </div>
            )}

            {/* Character Traits */}
            {showLore && heroLore && (
              <div className="mt-4">
                <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                  Character
                </h4>
                <div className="flex flex-wrap gap-2">
                  {heroLore.character.slice(0, 3).map((trait, idx) => (
                    <span
                      key={idx}
                      className={`
                        px-2 py-1 text-xs rounded border
                        ${
                          isMystical
                            ? 'bg-mystical-500/10 text-mystical-400/80 border-mystical-500/20'
                            : 'bg-human-500/10 text-human-400/80 border-human-500/20'
                        }
                      `}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default grid variant for landing page
  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative group cursor-pointer transition-all duration-300
        ${isSelected ? 'scale-105 z-10' : 'hover:scale-[1.02]'}
      `}
    >
      <div
        className={`
          card-game p-4 h-full transition-all duration-300
          ${isSelected ? (isMystical ? 'glow-mystical border-mystical-500' : 'glow-human border-human-500') : ''}
          ${!isSelected ? (isMystical ? 'hover:border-mystical-500/50' : 'hover:border-human-500/50') : ''}
        `}
      >
        {/* Hero Portrait */}
        <HeroPortrait hero={hero} />

        {/* Role badge */}
        <div
          className={`
            absolute top-6 right-6 px-2 py-1 rounded text-xs font-medium uppercase
            flex items-center gap-1
            ${isMystical ? 'bg-mystical-500/30 text-mystical-300' : 'bg-human-500/30 text-human-300'}
          `}
        >
          <RoleIcon className="w-3 h-3" />
          {hero.role}
        </div>

        {/* Difficulty indicator */}
        <div className="absolute bottom-6 left-6">
          <DifficultyIndicator difficulty={hero.difficulty} isMystical={isMystical} />
        </div>

        {/* Hero Info */}
        <div className="mt-4">
          <h4
            className={`
              font-display font-bold text-lg
              ${isMystical ? 'text-mystical-300' : 'text-human-300'}
            `}
          >
            {hero.name}
          </h4>
          <p className="text-gray-500 text-sm">{hero.title}</p>
        </div>

        {/* Hover Effect - Quote */}
        {isHovered && heroLore && (
          <div
            className={`
              absolute inset-0 flex items-end p-4 rounded-xl
              bg-gradient-to-t ${isMystical ? 'from-mystical-900/95 via-mystical-900/80' : 'from-human-900/95 via-human-900/80'} to-transparent
              transition-opacity duration-300
            `}
          >
            <div className="w-full">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                {heroLore.trueName}
              </p>
              <p className="text-sm italic text-gray-300 line-clamp-2">
                "{heroLore.keyQuote}"
              </p>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export default HeroCard;
