/**
 * useVisualEffects Hook
 *
 * Monitors game state changes and spawns visual effects
 * (damage numbers, level up effects, gold pickup, death effects, etc.)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import {
  DamageNumber,
  LevelUpEffect,
  GoldEffect,
  AbilityEffect,
  DeathEffect,
  HitEffect,
} from '../components/game/VisualEffects';

interface PlayerTrackingState {
  level: number;
  gold: number;
  health: number;
  isAlive: boolean;
}

interface VisualEffectsState {
  damageNumbers: DamageNumber[];
  levelUpEffects: LevelUpEffect[];
  goldEffects: GoldEffect[];
  abilityEffects: AbilityEffect[];
  deathEffects: DeathEffect[];
  hitEffects: HitEffect[];
}

let effectIdCounter = 0;
function generateEffectId(): string {
  return `effect-${Date.now()}-${effectIdCounter++}`;
}

export function useVisualEffects() {
  const { players, towers, creeps, jungleMonsters } = useGameStore();
  const { user } = useAuthStore();

  // Track previous state for all entities
  const playerStatesRef = useRef<Map<string, PlayerTrackingState>>(new Map());
  const towerHealthRef = useRef<Map<string, number>>(new Map());
  const creepHealthRef = useRef<Map<string, number>>(new Map());
  const monsterHealthRef = useRef<Map<string, number>>(new Map());

  // Visual effects state
  const [effects, setEffects] = useState<VisualEffectsState>({
    damageNumbers: [],
    levelUpEffects: [],
    goldEffects: [],
    abilityEffects: [],
    deathEffects: [],
    hitEffects: [],
  });

  // Add a damage number effect
  const addDamageNumber = useCallback((
    position: { x: number; y: number; z: number },
    damage: number,
    options: { isCritical?: boolean; isHeal?: boolean } = {}
  ) => {
    const effect: DamageNumber = {
      id: generateEffectId(),
      position,
      damage: Math.round(damage),
      isCritical: options.isCritical || false,
      isHeal: options.isHeal || false,
      createdAt: Date.now(),
    };

    setEffects(prev => ({
      ...prev,
      damageNumbers: [...prev.damageNumbers, effect],
    }));
  }, []);

  // Add level up effect
  const addLevelUpEffect = useCallback((
    position: { x: number; y: number; z: number },
    level: number
  ) => {
    const effect: LevelUpEffect = {
      id: generateEffectId(),
      position,
      level,
      createdAt: Date.now(),
    };

    setEffects(prev => ({
      ...prev,
      levelUpEffects: [...prev.levelUpEffects, effect],
    }));
  }, []);

  // Add gold effect
  const addGoldEffect = useCallback((
    position: { x: number; y: number; z: number },
    amount: number
  ) => {
    const effect: GoldEffect = {
      id: generateEffectId(),
      position,
      amount,
      createdAt: Date.now(),
    };

    setEffects(prev => ({
      ...prev,
      goldEffects: [...prev.goldEffects, effect],
    }));
  }, []);

  // Add ability effect
  const addAbilityEffect = useCallback((
    position: { x: number; y: number; z: number },
    abilitySlot: 'Q' | 'W' | 'E' | 'R',
    targetPosition?: { x: number; y: number; z: number }
  ) => {
    const effect: AbilityEffect = {
      id: generateEffectId(),
      position,
      abilitySlot,
      targetPosition,
      createdAt: Date.now(),
    };

    setEffects(prev => ({
      ...prev,
      abilityEffects: [...prev.abilityEffects, effect],
    }));
  }, []);

  // Add death effect
  const addDeathEffect = useCallback((
    position: { x: number; y: number; z: number },
    team: 'radiant' | 'dire'
  ) => {
    const effect: DeathEffect = {
      id: generateEffectId(),
      position,
      team,
      createdAt: Date.now(),
    };

    setEffects(prev => ({
      ...prev,
      deathEffects: [...prev.deathEffects, effect],
    }));
  }, []);

  // Add hit effect
  const addHitEffect = useCallback((
    position: { x: number; y: number; z: number }
  ) => {
    const effect: HitEffect = {
      id: generateEffectId(),
      position,
      createdAt: Date.now(),
    };

    setEffects(prev => ({
      ...prev,
      hitEffects: [...prev.hitEffects, effect],
    }));
  }, []);

  // Remove completed effect
  const handleEffectComplete = useCallback((type: string, id: string) => {
    setEffects(prev => {
      switch (type) {
        case 'damage':
          return { ...prev, damageNumbers: prev.damageNumbers.filter(e => e.id !== id) };
        case 'levelUp':
          return { ...prev, levelUpEffects: prev.levelUpEffects.filter(e => e.id !== id) };
        case 'gold':
          return { ...prev, goldEffects: prev.goldEffects.filter(e => e.id !== id) };
        case 'ability':
          return { ...prev, abilityEffects: prev.abilityEffects.filter(e => e.id !== id) };
        case 'death':
          return { ...prev, deathEffects: prev.deathEffects.filter(e => e.id !== id) };
        case 'hit':
          return { ...prev, hitEffects: prev.hitEffects.filter(e => e.id !== id) };
        default:
          return prev;
      }
    });
  }, []);

  // Monitor player state changes
  useEffect(() => {
    if (!user) return;

    players.forEach((player) => {
      const prevState = playerStatesRef.current.get(player.id);

      if (prevState) {
        // Level up effect
        if (player.level > prevState.level) {
          addLevelUpEffect(
            { x: player.position.x, y: player.position.y, z: player.position.z },
            player.level
          );
        }

        // Gold gained effect (for significant amounts)
        const goldGained = player.gold - prevState.gold;
        if (goldGained >= 50) {
          addGoldEffect(
            { x: player.position.x, y: player.position.y, z: player.position.z },
            goldGained
          );
        }

        // Took damage effect
        const damageTaken = prevState.health - player.currentHealth;
        if (damageTaken > 0 && player.isAlive) {
          addDamageNumber(
            { x: player.position.x, y: player.position.y, z: player.position.z },
            damageTaken,
            { isCritical: damageTaken > 100 }
          );
          addHitEffect({ x: player.position.x, y: player.position.y, z: player.position.z });
        }

        // Healed effect
        const healthGained = player.currentHealth - prevState.health;
        if (healthGained > 10 && player.isAlive) {
          addDamageNumber(
            { x: player.position.x, y: player.position.y, z: player.position.z },
            healthGained,
            { isHeal: true }
          );
        }

        // Death effect
        if (!player.isAlive && prevState.isAlive) {
          addDeathEffect(
            { x: player.position.x, y: player.position.y, z: player.position.z },
            player.team
          );
        }
      }

      // Update tracking state
      playerStatesRef.current.set(player.id, {
        level: player.level,
        gold: player.gold,
        health: player.currentHealth,
        isAlive: player.isAlive,
      });
    });
  }, [players, user, addDamageNumber, addLevelUpEffect, addGoldEffect, addDeathEffect, addHitEffect]);

  // Monitor tower damage
  useEffect(() => {
    towers.forEach((tower) => {
      const prevHealth = towerHealthRef.current.get(tower.id);

      if (prevHealth !== undefined && tower.isAlive) {
        const damageTaken = prevHealth - tower.currentHealth;
        if (damageTaken > 0) {
          addDamageNumber(
            { x: tower.position.x, y: tower.position.y + 200, z: tower.position.z },
            damageTaken,
            { isCritical: damageTaken > 200 }
          );
        }
      }

      towerHealthRef.current.set(tower.id, tower.currentHealth);
    });
  }, [towers, addDamageNumber]);

  // Monitor creep damage
  useEffect(() => {
    creeps.forEach((creep) => {
      const prevHealth = creepHealthRef.current.get(creep.id);

      if (prevHealth !== undefined && creep.isAlive) {
        const damageTaken = prevHealth - creep.currentHealth;
        if (damageTaken > 0) {
          addDamageNumber(
            { x: creep.position.x, y: creep.position.y + 50, z: creep.position.z },
            damageTaken
          );
        }
      }

      if (creep.isAlive) {
        creepHealthRef.current.set(creep.id, creep.currentHealth);
      } else {
        creepHealthRef.current.delete(creep.id);
      }
    });
  }, [creeps, addDamageNumber]);

  // Monitor jungle monster damage
  useEffect(() => {
    jungleMonsters.forEach((monster) => {
      const prevHealth = monsterHealthRef.current.get(monster.id);

      if (prevHealth !== undefined && monster.isAlive) {
        const damageTaken = prevHealth - monster.currentHealth;
        if (damageTaken > 0) {
          addDamageNumber(
            { x: monster.position.x, y: monster.position.y + 80, z: monster.position.z },
            damageTaken
          );
        }
      }

      if (monster.isAlive) {
        monsterHealthRef.current.set(monster.id, monster.currentHealth);
      } else {
        monsterHealthRef.current.delete(monster.id);
      }
    });
  }, [jungleMonsters, addDamageNumber]);

  return {
    effects,
    handleEffectComplete,
    addAbilityEffect,
  };
}
