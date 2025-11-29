/**
 * HeroAbilityPreview Component
 *
 * Displays a preview of a hero's abilities during hero selection.
 * Shows ability names, descriptions, and lore quotes.
 *
 * Features:
 * - 4 ability cards (Q, W, E, R)
 * - Ability name and description
 * - Lore flavor text
 * - Visual styling based on damage type
 * - Hero lore excerpt
 */

import { useMemo } from 'react';
import { HEROES, getAbilitiesForHero } from '@sundering/shared';
import { getAbilityLore } from '../../constants/abilityLore';

interface HeroAbilityPreviewProps {
  heroId: string;
}

export default function HeroAbilityPreview({ heroId }: HeroAbilityPreviewProps) {
  const hero = HEROES[heroId];
  const abilities = useMemo(() => getAbilitiesForHero(heroId), [heroId]);

  if (!hero || abilities.length === 0) return null;

  const slots = ['Q', 'W', 'E', 'R'];

  // Get faction colors for styling
  const isMystical = hero.faction === 'mystical';
  const factionGradient = isMystical
    ? 'from-mystical-900/50 to-indigo-900/50'
    : 'from-human-900/50 to-orange-900/50';
  const factionBorder = isMystical ? 'border-mystical-500/30' : 'border-human-500/30';
  const factionAccent = isMystical ? 'text-mystical-400' : 'text-human-400';

  return (
    <div className={`bg-gradient-to-b ${factionGradient} rounded-xl border ${factionBorder} overflow-hidden`}>
      {/* Hero Header */}
      <div className={`px-6 py-4 border-b ${factionBorder} bg-slate-900/50`}>
        <div className="flex items-center gap-4">
          {/* Hero portrait placeholder */}
          <div className={`
            w-16 h-16 rounded-lg flex items-center justify-center text-3xl
            ${isMystical
              ? 'bg-gradient-to-br from-mystical-600 to-indigo-800'
              : 'bg-gradient-to-br from-human-600 to-orange-800'
            }
          `}>
            {hero.role === 'tank' && 'shield'}
            {hero.role === 'mage' && 'fire'}
            {hero.role === 'warrior' && 'sword'}
            {hero.role === 'healer' && 'heart'}
            {hero.role === 'assassin' && 'knife'}
          </div>

          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${factionAccent} font-display`}>
              {hero.name}
            </h2>
            <p className="text-slate-400 text-sm italic">
              {hero.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`
                px-2 py-0.5 rounded text-xs font-medium capitalize
                ${isMystical ? 'bg-mystical-500/20 text-mystical-300' : 'bg-human-500/20 text-human-300'}
              `}>
                {hero.faction}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium capitalize bg-slate-700 text-slate-300">
                {hero.role}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                Difficulty: {'*'.repeat(hero.difficulty)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Lore */}
      <div className="px-6 py-3 border-b border-slate-800/50 bg-slate-900/30">
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
          {hero.shortDescription}
        </p>
      </div>

      {/* Abilities Section */}
      <div className="p-4">
        <h3 className={`text-sm font-bold ${factionAccent} mb-3 uppercase tracking-wider`}>
          Abilities
        </h3>

        <div className="space-y-3">
          {abilities.map((ability, index) => {
            const lore = getAbilityLore(ability.id);
            const slot = slots[index];

            // Determine color based on damage type
            const getDamageTypeColor = () => {
              if (ability.damageType === 'magical') return 'border-mystical-500/40 bg-mystical-500/10';
              if (ability.damageType === 'physical') return 'border-human-500/40 bg-human-500/10';
              return 'border-green-500/40 bg-green-500/10'; // Utility/healing
            };

            const getSlotColor = () => {
              if (ability.damageType === 'magical') return 'bg-mystical-600 text-white';
              if (ability.damageType === 'physical') return 'bg-human-600 text-white';
              return 'bg-green-600 text-white';
            };

            return (
              <div
                key={ability.id}
                className={`rounded-lg border ${getDamageTypeColor()} p-3 transition-all hover:bg-slate-800/50`}
              >
                <div className="flex items-start gap-3">
                  {/* Ability slot indicator */}
                  <div className={`
                    w-8 h-8 rounded flex items-center justify-center text-sm font-bold
                    ${getSlotColor()}
                  `}>
                    {slot}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Ability name */}
                    <h4 className="text-white font-medium text-sm">
                      {ability.name}
                    </h4>

                    {/* Description */}
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      {ability.description}
                    </p>

                    {/* Lore quote */}
                    {lore && (
                      <p className="text-mystical-300/70 text-xs italic mt-2 leading-relaxed">
                        {lore.flavorText}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      {/* Cooldown */}
                      <span className="text-slate-500">
                        CD: <span className="text-slate-300">{ability.cooldown[0]}s</span>
                      </span>

                      {/* Mana cost */}
                      <span className="text-slate-500">
                        Mana: <span className="text-blue-300">{ability.manaCost[0]}</span>
                      </span>

                      {/* Damage type */}
                      <span className={`
                        ${ability.damageType === 'magical'
                          ? 'text-mystical-400'
                          : ability.damageType === 'physical'
                            ? 'text-human-400'
                            : 'text-green-400'
                        }
                      `}>
                        {ability.damageType === 'magical' ? 'Magic'
                          : ability.damageType === 'physical' ? 'Physical'
                          : 'Utility'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Base Stats Preview */}
      <div className={`px-4 py-3 border-t ${factionBorder} bg-slate-900/50`}>
        <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
          Base Stats
        </h3>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="text-green-400 font-bold">{hero.baseStats.maxHealth}</div>
            <div className="text-slate-500">Health</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-bold">{hero.baseStats.maxMana}</div>
            <div className="text-slate-500">Mana</div>
          </div>
          <div className="text-center">
            <div className="text-orange-400 font-bold">{hero.baseStats.attackDamage}</div>
            <div className="text-slate-500">AD</div>
          </div>
          <div className="text-center">
            <div className="text-slate-300 font-bold">{hero.baseStats.armor}</div>
            <div className="text-slate-500">Armor</div>
          </div>
        </div>
      </div>
    </div>
  );
}
