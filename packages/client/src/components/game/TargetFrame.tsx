/**
 * TargetFrame Component
 *
 * Displays information about the currently selected target (player).
 * Shows: name, hero, role, level, HP/MP bars, team color.
 */

import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useAuthStore } from '../../stores/authStore';
import { HEROES } from '@sundering/shared';

export default function TargetFrame() {
  const { players, selectedTargetId, setSelectedTarget, myTeam } = useGameStore();
  const { user } = useAuthStore();

  const selectedTarget = useMemo(() => {
    if (!selectedTargetId) return null;
    return players.get(selectedTargetId) || null;
  }, [players, selectedTargetId]);

  if (!selectedTarget) return null;

  const hero = HEROES[selectedTarget.heroId];
  if (!hero) return null;

  const isEnemy = selectedTarget.team !== myTeam;
  const isMe = selectedTarget.userId === user?.id;

  const healthPercent = selectedTarget.maxHealth > 0
    ? Math.max(0, Math.min(100, (selectedTarget.currentHealth / selectedTarget.maxHealth) * 100))
    : 0;
  const manaPercent = selectedTarget.maxMana > 0
    ? Math.max(0, Math.min(100, (selectedTarget.currentMana / selectedTarget.maxMana) * 100))
    : 0;

  // Health bar color based on percentage
  const getHealthColor = () => {
    if (healthPercent > 60) return 'bg-green-500';
    if (healthPercent > 30) return 'bg-human-500';
    return 'bg-red-500';
  };

  const teamBorderColor = selectedTarget.team === 'radiant' ? 'border-emerald-500/50' : 'border-red-500/50';

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-40
        rounded-xl border ${teamBorderColor}
        min-w-[300px]
      `}
      style={{
        background: 'linear-gradient(180deg, rgba(28, 25, 23, 0.97) 0%, rgba(12, 10, 9, 0.98) 100%)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Badge background texture */}
      <div
        className="absolute inset-0 rounded-xl opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: 'url("/assets/badge.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Header with name and close button */}
      <div
        className="relative flex items-center justify-between px-3 py-2 rounded-t-xl border-b border-stone-700/50"
        style={{
          background: selectedTarget.team === 'radiant'
            ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Level badge */}
          <span
            className="text-sm font-bold text-amber-300 px-2 py-0.5 rounded border border-amber-500/30"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(180, 83, 9, 0.1) 100%)',
            }}
          >
            {selectedTarget.level}
          </span>
          {/* Name */}
          <span className={`font-semibold ${isMe ? 'text-amber-300' : isEnemy ? 'text-red-400' : 'text-emerald-400'}`}>
            {selectedTarget.displayName || selectedTarget.username}
          </span>
          {/* Team indicator */}
          <span
            className={`text-xs px-1.5 py-0.5 rounded border ${
              selectedTarget.team === 'radiant'
                ? 'border-emerald-500/30 text-emerald-400'
                : 'border-red-500/30 text-red-400'
            }`}
            style={{
              background: selectedTarget.team === 'radiant'
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
            }}
          >
            {selectedTarget.team === 'radiant' ? 'Radiant' : 'Dire'}
          </span>
        </div>
        {/* Close button */}
        <button
          onClick={() => setSelectedTarget(null)}
          className="text-stone-500 hover:text-amber-300 transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="relative px-3 py-2 space-y-2">
        {/* Hero info */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">Hero:</span>
          <span className="text-stone-200 font-medium">{hero.name}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded border ${
              hero.faction === 'mystical'
                ? 'border-mystical-500/30 text-mystical-400'
                : 'border-human-500/30 text-human-400'
            }`}
            style={{
              background: hero.faction === 'mystical'
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
            }}
          >
            {hero.role}
          </span>
        </div>

        {/* Health bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">Health</span>
            <span className="text-emerald-400 font-mono">
              {Math.floor(selectedTarget.currentHealth)} / {selectedTarget.maxHealth}
            </span>
          </div>
          <div
            className="h-3 rounded overflow-hidden"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className={`h-full ${getHealthColor()} transition-all duration-200`}
              style={{
                width: `${healthPercent}%`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            />
          </div>
        </div>

        {/* Mana bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">Mana</span>
            <span className="text-blue-400 font-mono">
              {Math.floor(selectedTarget.currentMana)} / {selectedTarget.maxMana}
            </span>
          </div>
          <div
            className="h-2.5 rounded overflow-hidden"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{
                width: `${manaPercent}%`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 text-xs pt-2 border-t border-stone-700/50">
          <div className="flex items-center gap-1">
            <span className="text-stone-500">AD:</span>
            <span className="text-human-400">{selectedTarget.attackDamage}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-stone-500">Armor:</span>
            <span className="text-amber-300">{selectedTarget.armor}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-stone-500">MR:</span>
            <span className="text-mystical-400">{selectedTarget.magicResist}</span>
          </div>
        </div>

        {/* Status: alive/dead */}
        {!selectedTarget.isAlive && (
          <div
            className="text-center py-1.5 rounded text-red-400 text-sm font-medium border border-red-500/30"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
            }}
          >
            DEAD - Respawning in {Math.ceil(selectedTarget.respawnTime)}s
          </div>
        )}
      </div>
    </div>
  );
}
