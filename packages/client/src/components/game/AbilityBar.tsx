import { useMemo, useCallback, useEffect } from 'react';
import { useGameStore, AbilityState } from '../../stores/gameStore';
import { useAuthStore } from '../../stores/authStore';
import { ABILITIES } from '@sundering/shared';
import { playAbilityCastSound, playErrorSound } from '../../services/audio';
import AbilityTooltip from './AbilityTooltip';

interface AbilityButtonProps {
  ability: AbilityState;
  slot: string;
  hotkey: string;
  onUse: () => void;
  currentMana: number;
}

function AbilityButton({ ability, slot, hotkey, onUse, currentMana }: AbilityButtonProps) {
  const abilityDef = ABILITIES[ability.abilityId];
  if (!abilityDef) return null;

  const isOnCooldown = ability.currentCooldown > 0;
  const manaCost = abilityDef.manaCost[ability.level - 1] || abilityDef.manaCost[0];
  const hasEnoughMana = currentMana >= manaCost;
  const isLearned = ability.level > 0;
  const isUsable = isLearned && !isOnCooldown && hasEnoughMana;

  const cooldownPercent = isOnCooldown
    ? (ability.currentCooldown / (abilityDef.cooldown[ability.level - 1] || abilityDef.cooldown[0])) * 100
    : 0;

  // Determine border color based on damage type for visual flavor
  const getBorderColor = () => {
    if (!isUsable) return 'border-slate-600';
    if (abilityDef.damageType === 'magical') return 'border-mystical-500';
    if (abilityDef.damageType === 'physical') return 'border-human-500';
    return 'border-green-500'; // Utility/healing abilities
  };

  const getGlowEffect = () => {
    if (!isUsable) return '';
    if (abilityDef.damageType === 'magical') return 'shadow-mystical-500/30 shadow-lg';
    if (abilityDef.damageType === 'physical') return 'shadow-human-500/30 shadow-lg';
    return 'shadow-green-500/30 shadow-lg';
  };

  return (
    <AbilityTooltip ability={ability} slot={slot}>
      <button
        onClick={onUse}
        disabled={!isUsable}
        className={`
          relative w-16 h-16 rounded-lg border-2 transition-all duration-200
          ${getBorderColor()}
          ${isUsable ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed'}
          ${isUsable ? getGlowEffect() : ''}
          ${!isLearned ? 'opacity-40' : ''}
          ${!hasEnoughMana && isLearned ? 'border-blue-400' : ''}
        `}
        style={{
          boxShadow: isUsable
            ? '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Badge background texture */}
        <div
          className="absolute inset-0 rounded-lg opacity-[0.12]"
          style={{
            backgroundImage: 'url("/assets/badge.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Ability icon placeholder with gradient based on type */}
        <div className={`
          absolute inset-1 rounded flex items-center justify-center
          ${abilityDef.damageType === 'magical'
            ? 'bg-gradient-to-br from-mystical-900/90 via-mystical-800/70 to-slate-900'
            : abilityDef.damageType === 'physical'
              ? 'bg-gradient-to-br from-human-900/90 via-human-800/70 to-slate-900'
              : 'bg-gradient-to-br from-green-900/90 via-green-800/70 to-slate-900'
          }
        `}>
          <span className="text-lg font-bold text-slate-200 drop-shadow-md">{slot}</span>
        </div>

        {/* Inner shadow overlay */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)',
          }}
        />

        {/* Cooldown overlay with sweep animation */}
        {isOnCooldown && (
          <div
            className="absolute inset-0 bg-black/75 rounded-lg"
            style={{
              clipPath: `inset(${100 - cooldownPercent}% 0 0 0)`,
            }}
          />
        )}

        {/* Cooldown text */}
        {isOnCooldown && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-lg drop-shadow-lg">
              {Math.ceil(ability.currentCooldown)}
            </span>
          </div>
        )}

        {/* Hotkey badge */}
        <div
          className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded text-xs font-bold text-amber-300 flex items-center justify-center border border-amber-500/50"
          style={{
            background: 'linear-gradient(135deg, #292524 0%, #1c1917 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
          }}
        >
          {hotkey}
        </div>

        {/* Mana cost badge */}
        {isLearned && (
          <div className={`
            absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-bold
            ${hasEnoughMana ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' : 'bg-gradient-to-r from-red-600 to-red-500 text-white animate-pulse'}
          `}
          style={{
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
          }}
          >
            {manaCost}
          </div>
        )}

        {/* Level indicator */}
        {isLearned && (
          <div
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4), 0 0 8px rgba(245,158,11,0.3)',
            }}
          >
            {ability.level}
          </div>
        )}

        {/* Ready pulse effect */}
        {isUsable && (
          <div className="absolute inset-0 rounded-lg border border-white/20 animate-pulse pointer-events-none" />
        )}
      </button>
    </AbilityTooltip>
  );
}

export default function AbilityBar() {
  const { players, useAbility } = useGameStore();
  const { user } = useAuthStore();

  const myPlayer = useMemo(() => {
    return Array.from(players.values()).find(p => p.userId === user?.id);
  }, [players, user]);

  const handleAbilityClick = useCallback((slot: string) => {
    if (!myPlayer) return;

    const slotIndex = ['Q', 'W', 'E', 'R'].indexOf(slot);
    if (slotIndex === -1 || slotIndex >= myPlayer.abilities.length) return;

    const ability = myPlayer.abilities[slotIndex];
    const abilityDef = ABILITIES[ability.abilityId];
    if (!abilityDef) return;

    // Check if ability can be used
    const isOnCooldown = ability.currentCooldown > 0;
    const manaCost = abilityDef.manaCost[ability.level - 1] || abilityDef.manaCost[0];
    const hasEnoughMana = myPlayer.currentMana >= manaCost;
    const isLearned = ability.level > 0;

    if (!isLearned || isOnCooldown || !hasEnoughMana) {
      playErrorSound();
      return;
    }

    // Play ability cast sound
    playAbilityCastSound(slot as 'Q' | 'W' | 'E' | 'R');

    // Self-targeted abilities can be used immediately
    if (abilityDef.targetType === 'self') {
      useAbility(slot);
      return;
    }

    // For point/area abilities, use player's current target position or center of map
    if (abilityDef.targetType === 'point' || abilityDef.targetType === 'area' || abilityDef.targetType === 'direction') {
      // Use in direction player is facing
      const range = abilityDef.range;
      const targetPoint = {
        x: myPlayer.position.x + Math.sin(myPlayer.rotation) * range,
        y: 0,
        z: myPlayer.position.z + Math.cos(myPlayer.rotation) * range,
      };
      useAbility(slot, undefined, targetPoint);
      return;
    }

    // Unit-targeted abilities need a target
    if (abilityDef.targetType === 'unit') {
      // Use on current attack target if exists
      if (myPlayer.targetId) {
        useAbility(slot, myPlayer.targetId);
      } else {
        // No target - play error
        playErrorSound();
      }
      return;
    }
  }, [myPlayer, useAbility]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!myPlayer || !myPlayer.isAlive) return;

      // Check if user is typing in an input field or textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' ||
                       activeElement?.tagName === 'TEXTAREA' ||
                       (activeElement as HTMLElement)?.isContentEditable;

      // Don't trigger ability hotkeys when typing in chat or other inputs
      if (isTyping) return;

      const key = e.key.toUpperCase();
      if (['Q', 'W', 'E', 'R'].includes(key)) {
        e.preventDefault();
        handleAbilityClick(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [myPlayer, handleAbilityClick]);

  if (!myPlayer || myPlayer.abilities.length === 0) return null;

  const slots = ['Q', 'W', 'E', 'R'];

  return (
    <div
      className="relative flex gap-2 p-3 rounded-xl border border-stone-700/50"
      style={{
        background: 'linear-gradient(180deg, rgba(28, 25, 23, 0.95) 0%, rgba(12, 10, 9, 0.98) 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Badge background texture */}
      <div
        className="absolute inset-0 rounded-xl opacity-[0.08]"
        style={{
          backgroundImage: 'url("/assets/badge.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Content */}
      <div className="relative flex gap-2">
        {myPlayer.abilities.map((ability, index) => (
          <AbilityButton
            key={ability.abilityId}
            ability={ability}
            slot={slots[index]}
            hotkey={slots[index]}
            onUse={() => handleAbilityClick(slots[index])}
            currentMana={myPlayer.currentMana}
          />
        ))}
      </div>
    </div>
  );
}
