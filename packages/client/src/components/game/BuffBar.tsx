import { useMemo } from 'react';
import { useGameStore, BuffState } from '../../stores/gameStore';
import { useAuthStore } from '../../stores/authStore';
import { BUFFS } from '@sundering/shared';

interface BuffIconProps {
  buff: BuffState;
}

function getBuffColor(type: string): string {
  const ccTypes = ['stun', 'slow', 'root', 'silence', 'disarm', 'blind'];
  const dotTypes = ['poison', 'burn', 'bleed'];
  const buffTypes = ['haste', 'attack_speed_buff', 'damage_buff', 'armor_buff', 'magic_resist_buff', 'invulnerable', 'untargetable', 'stealth'];

  if (ccTypes.includes(type)) return 'bg-red-600 border-red-400';
  if (dotTypes.includes(type)) return 'bg-mystical-600 border-mystical-400';
  if (type === 'shield') return 'bg-cyan-600 border-cyan-400';
  if (type === 'heal_over_time') return 'bg-green-600 border-green-400';
  if (buffTypes.includes(type)) return 'bg-emerald-600 border-emerald-400';

  // Debuffs
  return 'bg-orange-600 border-orange-400';
}

function getBuffIcon(type: string): string {
  const icons: Record<string, string> = {
    stun: '⚡',
    slow: '🐢',
    root: '🌿',
    silence: '🤐',
    disarm: '🚫',
    blind: '👁️',
    poison: '☠️',
    burn: '🔥',
    bleed: '💉',
    shield: '🛡️',
    heal_over_time: '💚',
    haste: '💨',
    attack_speed_buff: '⚔️',
    attack_speed_debuff: '🐌',
    damage_buff: '💪',
    damage_debuff: '📉',
    armor_buff: '🛡️',
    armor_debuff: '💔',
    magic_resist_buff: '✨',
    magic_resist_debuff: '🌀',
    invulnerable: '🌟',
    untargetable: '👻',
    stealth: '🥷',
    revealed: '👁️',
  };
  return icons[type] || '⬤';
}

function BuffIcon({ buff }: BuffIconProps) {
  const definition = BUFFS[buff.buffId];
  const name = definition?.name || buff.buffId;
  const colorClass = getBuffColor(buff.type);
  const icon = getBuffIcon(buff.type);

  const durationPercent = Math.max(0, Math.min(100, (buff.remainingDuration / (definition?.defaultDuration || 5)) * 100));

  return (
    <div
      className={`relative w-10 h-10 rounded border-2 ${colorClass} flex items-center justify-center transition-all hover:scale-110`}
      title={`${name}${buff.stacks > 1 ? ` (x${buff.stacks})` : ''}\nRemaining: ${buff.remainingDuration.toFixed(1)}s${buff.value > 0 ? `\nValue: ${buff.value}` : ''}`}
    >
      {/* Icon */}
      <span className="text-lg">{icon}</span>

      {/* Duration sweep overlay */}
      <div
        className="absolute inset-0 bg-black/50 rounded"
        style={{
          clipPath: `inset(${100 - durationPercent}% 0 0 0)`,
        }}
      />

      {/* Stack count */}
      {buff.stacks > 1 && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-800 rounded-full text-xs font-bold text-white flex items-center justify-center border border-slate-600">
          {buff.stacks}
        </div>
      )}

      {/* Duration text (shows when hovered via CSS) */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white font-medium opacity-0 group-hover:opacity-100 whitespace-nowrap">
        {buff.remainingDuration.toFixed(1)}s
      </div>
    </div>
  );
}

export default function BuffBar() {
  const { players } = useGameStore();
  const { user } = useAuthStore();

  const myPlayer = useMemo(() => {
    return Array.from(players.values()).find(p => p.userId === user?.id);
  }, [players, user]);

  if (!myPlayer || myPlayer.buffs.length === 0) return null;

  // Separate buffs and debuffs
  const { buffs, debuffs } = useMemo(() => {
    const buffs: BuffState[] = [];
    const debuffs: BuffState[] = [];

    const debuffTypes = ['stun', 'slow', 'root', 'silence', 'disarm', 'blind', 'poison', 'burn', 'bleed', 'attack_speed_debuff', 'damage_debuff', 'armor_debuff', 'magic_resist_debuff', 'revealed'];

    for (const buff of myPlayer.buffs) {
      if (debuffTypes.includes(buff.type)) {
        debuffs.push(buff);
      } else {
        buffs.push(buff);
      }
    }

    return { buffs, debuffs };
  }, [myPlayer.buffs]);

  return (
    <div className="flex flex-col gap-2">
      {/* Buffs (positive effects) */}
      {buffs.length > 0 && (
        <div className="flex gap-1.5">
          {buffs.map(buff => (
            <BuffIcon key={buff.id} buff={buff} />
          ))}
        </div>
      )}

      {/* Debuffs (negative effects) */}
      {debuffs.length > 0 && (
        <div className="flex gap-1.5">
          {debuffs.map(buff => (
            <BuffIcon key={buff.id} buff={buff} />
          ))}
        </div>
      )}
    </div>
  );
}
