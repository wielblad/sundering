/**
 * AbilityTooltip Component
 *
 * Displays rich tooltip information for abilities including:
 * - Ability name and slot
 * - Lore flavor text
 * - Mechanical description
 * - Stats (damage, cooldown, mana cost, range)
 *
 * Styled with the "Arcane Elegance" fantasy theme.
 */

import { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ABILITIES } from '@sundering/shared';
import { getAbilityLore } from '../../constants/abilityLore';
import { AbilityState, useGameStore } from '../../stores/gameStore';

interface AbilityTooltipProps {
  ability: AbilityState;
  slot: string;
  children: ReactNode;
}

export default function AbilityTooltip({ ability, slot, children }: AbilityTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const setHoveredAbility = useGameStore(state => state.setHoveredAbility);

  const abilityDef = ABILITIES[ability.abilityId];
  const lore = getAbilityLore(ability.abilityId);

  // Handle mouse enter - show tooltip and range indicator
  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
    if (abilityDef && abilityDef.range > 0) {
      setHoveredAbility(ability.abilityId, abilityDef.range);
    }
  }, [abilityDef, ability.abilityId, setHoveredAbility]);

  // Handle mouse leave - hide tooltip and range indicator
  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
    setHoveredAbility(null, null);
  }, [setHoveredAbility]);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // Position tooltip above the trigger element
      let x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      let y = triggerRect.top - tooltipRect.height - 8;

      // Keep tooltip within viewport bounds
      if (x < 8) x = 8;
      if (x + tooltipRect.width > window.innerWidth - 8) {
        x = window.innerWidth - tooltipRect.width - 8;
      }
      if (y < 8) {
        // Show below if no room above
        y = triggerRect.bottom + 8;
      }

      setPosition({ x, y });
    }
  }, [isVisible]);

  if (!abilityDef) return <>{children}</>;

  // Get current level values (use level 1 if not learned)
  const level = ability.level || 1;
  const levelIndex = Math.max(0, level - 1);
  const maxLevel = abilityDef.baseDamage?.length || abilityDef.cooldown.length;

  const manaCost = abilityDef.manaCost[levelIndex] || abilityDef.manaCost[0];
  const cooldown = abilityDef.cooldown[levelIndex] || abilityDef.cooldown[0];

  // Format all damage values for the ability
  const getAllDamageValues = () => {
    if (!abilityDef.baseDamage) return null;
    return abilityDef.baseDamage.map((dmg: number, i: number) => (
      <span
        key={i}
        className={i === levelIndex ? 'text-human-400 font-bold' : 'text-slate-400'}
      >
        {dmg}{i < abilityDef.baseDamage!.length - 1 ? ' / ' : ''}
      </span>
    ));
  };

  // Get target type display text
  const getTargetTypeText = () => {
    switch (abilityDef.targetType) {
      case 'self': return 'Self';
      case 'unit': return 'Single Target';
      case 'point': return 'Ground Target';
      case 'area': return 'Area';
      case 'direction': return 'Direction';
      default: return abilityDef.targetType;
    }
  };

  // Get damage type display with color
  const getDamageTypeDisplay = () => {
    if (!abilityDef.damageType) {
      return <span className="text-slate-400">Utility</span>;
    }
    if (abilityDef.damageType === 'physical') {
      return <span className="text-orange-400">Physical</span>;
    }
    return <span className="text-mystical-400">Magical</span>;
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {children}

      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none"
          style={{ left: position.x, top: position.y }}
        >
          {/* Tooltip container with fantasy styling */}
          <div className="w-80 bg-gradient-to-b from-slate-900/98 to-slate-950/98 backdrop-blur-sm rounded-lg border border-slate-700 shadow-2xl overflow-hidden">
            {/* Header with ability name and slot */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-human-400 font-display tracking-wide">
                  {abilityDef.name}
                </h3>
                <span className="px-2 py-0.5 bg-slate-700 rounded text-sm font-bold text-mystical-400">
                  {slot}
                </span>
              </div>
            </div>

            {/* Lore quote */}
            {lore && (
              <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800">
                <p className="text-sm italic text-mystical-300/80 leading-relaxed">
                  {lore.flavorText}
                </p>
              </div>
            )}

            {/* Description */}
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="text-sm text-slate-300 leading-relaxed">
                {abilityDef.description}
              </p>
            </div>

            {/* Stats grid */}
            <div className="px-4 py-3 space-y-2">
              {/* Damage values (if applicable) */}
              {abilityDef.baseDamage && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    {ability.abilityId.includes('sylara_q') ? 'Healing:' : 'Damage:'}
                  </span>
                  <span className="font-mono">{getAllDamageValues()}</span>
                </div>
              )}

              {/* Scaling info */}
              {(abilityDef.scalingAD || abilityDef.scalingAP) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Scaling:</span>
                  <span className="text-human-300">
                    {abilityDef.scalingAD && `+${Math.round(abilityDef.scalingAD * 100)}% AD`}
                    {abilityDef.scalingAD && abilityDef.scalingAP && ' / '}
                    {abilityDef.scalingAP && `+${Math.round(abilityDef.scalingAP * 100)}% AP`}
                  </span>
                </div>
              )}

              {/* Target type and damage type */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Target:</span>
                <span className="text-slate-200">{getTargetTypeText()}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Type:</span>
                {getDamageTypeDisplay()}
              </div>

              {/* Range and radius */}
              {abilityDef.range > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Range:</span>
                  <span className="text-slate-200">{abilityDef.range}</span>
                </div>
              )}

              {abilityDef.radius && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Radius:</span>
                  <span className="text-slate-200">{abilityDef.radius}</span>
                </div>
              )}

              {/* Cast time */}
              {abilityDef.castTime > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Cast Time:</span>
                  <span className="text-slate-200">{abilityDef.castTime}s</span>
                </div>
              )}
            </div>

            {/* Mana and Cooldown footer */}
            <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-sm text-blue-300 font-mono">{manaCost}</span>
                <span className="text-xs text-slate-500 ml-1">Mana</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-200 font-mono">{cooldown}s</span>
                <span className="text-xs text-slate-500">Cooldown</span>
              </div>
            </div>

            {/* Level indicator */}
            <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Level</span>
              <div className="flex gap-1">
                {Array.from({ length: maxLevel }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < level
                        ? 'bg-human-500 shadow-sm shadow-human-500/50'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Tooltip arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 rotate-45 bg-slate-900 border-r border-b border-slate-700" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
