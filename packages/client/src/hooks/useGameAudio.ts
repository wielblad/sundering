/**
 * useGameAudio Hook
 *
 * Manages game audio by listening to game state changes
 * and playing appropriate sound effects.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import {
  initAudio,
  playAttackSound,
  playRangedAttackSound,
  playHitSound,
  playDeathSound,
  playRespawnSound,
  playLevelUpSound,
  playGoldSound,
  playTowerAttackSound,
  playTowerDestroyedSound,
  playCreepDeathSound,
  playMonsterDeathSound,
  playPingSound,
  playBuyItemSound,
  playSellItemSound,
  playVictorySound,
  playDefeatSound,
  playGameMusic,
  stopMusic,
} from '../services/audio';
import { HEROES } from '@sundering/shared';

interface AudioState {
  initialized: boolean;
  playerLevel: number;
  playerGold: number;
  playerAlive: boolean;
  playerHealth: number;
  inventoryCount: number;
  towerCount: number;
  creepCount: number;
  monsterCount: number;
  pingsCount: number;
}

export function useGameAudio(): void {
  const { players, phase, towers, creeps, jungleMonsters, pings, winner } = useGameStore();
  const { user } = useAuthStore();

  const audioStateRef = useRef<AudioState>({
    initialized: false,
    playerLevel: 1,
    playerGold: 600,
    playerAlive: true,
    playerHealth: 100,
    inventoryCount: 0,
    towerCount: 0,
    creepCount: 0,
    monsterCount: 0,
    pingsCount: 0,
  });

  const lastAttackTimeRef = useRef<Map<string, number>>(new Map());
  const lastHitTimeRef = useRef<number>(0);

  // Initialize audio on first user interaction
  const handleUserInteraction = useCallback(() => {
    if (!audioStateRef.current.initialized) {
      initAudio();
      audioStateRef.current.initialized = true;
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    }
  }, []);

  // Setup interaction listeners
  useEffect(() => {
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [handleUserInteraction]);

  // Start/stop game music based on phase
  useEffect(() => {
    if (phase === 'playing' && audioStateRef.current.initialized) {
      playGameMusic();
    } else if (phase === 'ended') {
      stopMusic();
    }

    return () => {
      if (phase === 'playing') {
        stopMusic();
      }
    };
  }, [phase]);

  // Handle game end sounds
  useEffect(() => {
    if (phase === 'ended' && winner && user) {
      const myPlayer = Array.from(players.values()).find(p => p.userId === user.id);
      if (myPlayer) {
        if (myPlayer.team === winner) {
          playVictorySound();
        } else {
          playDefeatSound();
        }
      }
    }
  }, [phase, winner, players, user]);

  // Monitor player state changes
  useEffect(() => {
    if (!user || !audioStateRef.current.initialized) return;

    const myPlayer = Array.from(players.values()).find(p => p.userId === user.id);
    if (!myPlayer) return;

    const prevState = audioStateRef.current;

    // Level up sound
    if (myPlayer.level > prevState.playerLevel && prevState.playerLevel > 0) {
      playLevelUpSound();
    }

    // Gold earned sound (only for significant gains)
    if (myPlayer.gold > prevState.playerGold + 50) {
      playGoldSound();
    }

    // Death sound
    if (!myPlayer.isAlive && prevState.playerAlive) {
      playDeathSound();
    }

    // Respawn sound
    if (myPlayer.isAlive && !prevState.playerAlive) {
      playRespawnSound();
    }

    // Took damage sound
    const now = Date.now();
    if (myPlayer.currentHealth < prevState.playerHealth - 10 && myPlayer.isAlive) {
      if (now - lastHitTimeRef.current > 200) {
        playHitSound();
        lastHitTimeRef.current = now;
      }
    }

    // Item buy/sell sounds
    const currentInventoryCount = myPlayer.inventory?.length || 0;
    if (currentInventoryCount > prevState.inventoryCount) {
      playBuyItemSound();
    } else if (currentInventoryCount < prevState.inventoryCount && prevState.inventoryCount > 0) {
      playSellItemSound();
    }

    // Update state
    audioStateRef.current = {
      ...prevState,
      playerLevel: myPlayer.level,
      playerGold: myPlayer.gold,
      playerAlive: myPlayer.isAlive,
      playerHealth: myPlayer.currentHealth,
      inventoryCount: currentInventoryCount,
    };
  }, [players, user]);

  // Monitor player attacks
  useEffect(() => {
    if (!audioStateRef.current.initialized) return;

    const now = Date.now();

    players.forEach((player) => {
      if (player.targetId && player.attackCooldown <= 0.1 && player.attackCooldown > 0) {
        const lastAttack = lastAttackTimeRef.current.get(player.id) || 0;

        if (now - lastAttack > 400) {
          const hero = HEROES[player.heroId];
          if (hero?.attackType === 'ranged') {
            playRangedAttackSound();
          } else {
            playAttackSound();
          }
          lastAttackTimeRef.current.set(player.id, now);
        }
      }
    });
  }, [players]);

  // Monitor kills (by watching deaths)
  useEffect(() => {
    if (!user || !audioStateRef.current.initialized) return;

    const myPlayer = Array.from(players.values()).find(p => p.userId === user.id);
    if (!myPlayer) return;

    // Check if we killed someone (our kills increased)
    // This would require tracking kills, simplified version:
    players.forEach((player) => {
      if (!player.isAlive && player.team !== myPlayer.team) {
        // Someone on enemy team died - if we have target on them, we might have killed
        // Simplified: play kill sound when enemy dies (may not be accurate)
      }
    });
  }, [players, user]);

  // Monitor tower attacks and destruction
  useEffect(() => {
    if (!audioStateRef.current.initialized) return;

    const currentTowerCount = towers.size;
    const prevTowerCount = audioStateRef.current.towerCount;

    // Tower destroyed
    if (currentTowerCount < prevTowerCount && prevTowerCount > 0) {
      playTowerDestroyedSound();
    }

    // Tower attacking
    towers.forEach((tower) => {
      if (tower.targetId && tower.attackCooldown <= 0.1 && tower.attackCooldown > 0) {
        playTowerAttackSound();
      }
    });

    audioStateRef.current.towerCount = currentTowerCount;
  }, [towers]);

  // Monitor creep deaths
  useEffect(() => {
    if (!audioStateRef.current.initialized) return;

    const currentCreepCount = creeps.size;
    const prevCreepCount = audioStateRef.current.creepCount;

    // Creep died
    if (currentCreepCount < prevCreepCount && prevCreepCount > 0) {
      // Don't play for every creep death, too noisy
      // Only play occasionally
      if (Math.random() < 0.2) {
        playCreepDeathSound();
      }
    }

    audioStateRef.current.creepCount = currentCreepCount;
  }, [creeps]);

  // Monitor monster deaths
  useEffect(() => {
    if (!audioStateRef.current.initialized) return;

    const currentMonsterCount = jungleMonsters.size;
    const prevMonsterCount = audioStateRef.current.monsterCount;

    // Monster died
    if (currentMonsterCount < prevMonsterCount && prevMonsterCount > 0) {
      playMonsterDeathSound();
    }

    audioStateRef.current.monsterCount = currentMonsterCount;
  }, [jungleMonsters]);

  // Monitor pings
  useEffect(() => {
    if (!audioStateRef.current.initialized) return;

    const currentPingsCount = pings.length;
    const prevPingsCount = audioStateRef.current.pingsCount;

    // New ping
    if (currentPingsCount > prevPingsCount && prevPingsCount >= 0) {
      const latestPing = pings[pings.length - 1];
      if (latestPing) {
        playPingSound(latestPing.type);
      }
    }

    audioStateRef.current.pingsCount = currentPingsCount;
  }, [pings]);
}
