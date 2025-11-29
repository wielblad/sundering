import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, GamePlayer, GameEndPlayerStats } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { HEROES, HERO_IDS } from '@sundering/shared';
import GameScene, { setCameraTarget } from '../components/game/GameScene';
import AbilityBar from '../components/game/AbilityBar';
import BuffBar from '../components/game/BuffBar';
import Minimap from '../components/game/Minimap';
import ItemShop from '../components/game/ItemShop';
import AudioSettings from '../components/game/AudioSettings';
import GameChat from '../components/game/GameChat';
import HeroAbilityPreview from '../components/game/HeroAbilityPreview';
import TargetFrame from '../components/game/TargetFrame';
import { useGameAudio } from '../hooks/useGameAudio';
import { useVisualEffects } from '../hooks/useVisualEffects';
import * as THREE from 'three';

// Heroes that have actual artwork available
const HEROES_WITH_ASSETS = ['ironclad', 'bladewarden', 'pyralis', 'nightshade', 'sylara', 'vex', 'thornweaver', 'magnus', 'frostborne', 'grimjaw', 'valeria', 'zephyr', 'hex', 'scourge'] as const;

function hasHeroAssets(heroId: string): boolean {
  return HEROES_WITH_ASSETS.includes(heroId as (typeof HEROES_WITH_ASSETS)[number]);
}

function getHeroAvatarPath(heroId: string): string {
  return `/assets/heroes/${heroId}/avatar.png`;
}

function HeroCard({
  heroId,
  isSelected,
  isLocked,
  isLockedByOther,
  onSelect,
}: {
  heroId: string;
  isSelected: boolean;
  isLocked: boolean;
  isLockedByOther: boolean;
  onSelect: () => void;
}) {
  const hero = HEROES[heroId];
  if (!hero) return null;

  const factionColor = hero.faction === 'mystical' ? 'purple' : 'amber';
  const hasAssets = hasHeroAssets(heroId);

  return (
    <button
      onClick={onSelect}
      disabled={isLocked || isLockedByOther}
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200
        ${isSelected ? `border-${factionColor}-500 bg-${factionColor}-500/20 scale-105` : 'border-slate-600 bg-slate-800/50'}
        ${isLocked ? `border-green-500 bg-green-500/20` : ''}
        ${isLockedByOther ? 'opacity-40 cursor-not-allowed' : 'hover:border-slate-400 cursor-pointer'}
      `}
    >
      {hasAssets ? (
        <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-2 border-2 border-slate-600">
          <img
            src={getHeroAvatarPath(heroId)}
            alt={hero.name}
            className="w-full h-full object-cover object-top"
          />
        </div>
      ) : (
        <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br
          ${hero.faction === 'mystical' ? 'from-mystical-600 to-indigo-800' : 'from-human-600 to-orange-800'}
          flex items-center justify-center text-2xl mb-2`}
        >
          {hero.role === 'tank' && '🛡️'}
          {hero.role === 'mage' && '🔮'}
          {hero.role === 'warrior' && '⚔️'}
          {hero.role === 'healer' && '💚'}
        </div>
      )}
      <h3 className="text-sm font-bold text-white text-center">{hero.name}</h3>
      <p className="text-xs text-slate-400 text-center capitalize">{hero.role}</p>
      {isLockedByOther && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <span className="text-red-400 font-bold">TAKEN</span>
        </div>
      )}
      {isLocked && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          LOCKED
        </div>
      )}
    </button>
  );
}

function PlayerSlot({ player, isMe }: { player: GamePlayer; isMe: boolean }) {
  const hero = player.lockedHeroId ? HEROES[player.lockedHeroId] : null;
  const hasAssets = player.lockedHeroId ? hasHeroAssets(player.lockedHeroId) : false;

  return (
    <div className={`
      p-3 rounded-lg border
      ${isMe ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-600 bg-slate-800/50'}
      ${player.isBot ? 'opacity-70' : ''}
    `}>
      <div className="flex items-center gap-3">
        {hasAssets && player.lockedHeroId ? (
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-600">
            <img
              src={getHeroAvatarPath(player.lockedHeroId)}
              alt={hero?.name || ''}
              className="w-full h-full object-cover object-top"
            />
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
            ${hero ? (hero.faction === 'mystical' ? 'bg-mystical-600' : 'bg-human-600') : 'bg-slate-700'}
          `}>
            {hero ? (
              <>
                {hero.role === 'tank' && '🛡️'}
                {hero.role === 'mage' && '🔮'}
                {hero.role === 'warrior' && '⚔️'}
                {hero.role === 'healer' && '💚'}
              </>
            ) : (
              '?'
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isMe ? 'text-yellow-400' : 'text-white'}`}>
            {player.displayName || player.username}
            {player.isBot && <span className="text-slate-500 ml-1">(BOT)</span>}
            {isMe && <span className="text-yellow-400 ml-1">(YOU)</span>}
          </p>
          <p className="text-xs text-slate-400">
            {hero ? hero.name : (player.selectedHeroId ? 'Selecting...' : 'Not selected')}
          </p>
        </div>
        {player.isReady && (
          <span className="text-green-400 text-sm">Ready</span>
        )}
      </div>
    </div>
  );
}

function HeroSelectPhase() {
  const { players, heroSelectTimer, selectHero, lockHero, myTeam } = useGameStore();
  const { user } = useAuthStore();

  const myPlayer = useMemo(() => {
    return Array.from(players.values()).find(p => p.userId === user?.id);
  }, [players, user]);

  const lockedHeroes = useMemo(() => {
    const locked = new Set<string>();
    players.forEach(p => {
      if (p.lockedHeroId) locked.add(p.lockedHeroId);
    });
    return locked;
  }, [players]);

  const radiantPlayers = useMemo(() =>
    Array.from(players.values()).filter(p => p.team === 'radiant'),
    [players]
  );

  const direPlayers = useMemo(() =>
    Array.from(players.values()).filter(p => p.team === 'dire'),
    [players]
  );

  // Get the currently selected or locked hero for preview
  const previewHeroId = myPlayer?.selectedHeroId || myPlayer?.lockedHeroId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 font-display tracking-wide">SELECT YOUR HERO</h1>
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm lg:text-lg px-3 lg:px-4 py-1.5 lg:py-2 rounded-full transition-all ${myTeam === 'radiant' ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' : 'bg-slate-700 text-slate-300'}`}>
            RADIANT
          </span>
          <div className="text-4xl lg:text-5xl font-bold text-human-400 font-mono min-w-[60px] text-center">
            {heroSelectTimer}
          </div>
          <span className={`text-sm lg:text-lg px-3 lg:px-4 py-1.5 lg:py-2 rounded-full transition-all ${myTeam === 'dire' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-slate-700 text-slate-300'}`}>
            DIRE
          </span>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Radiant Team */}
          <div className="col-span-12 lg:col-span-2 order-3 lg:order-1">
            <h2 className="text-green-400 font-bold text-lg mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
              RADIANT
            </h2>
            <div className="space-y-2">
              {radiantPlayers.map(player => (
                <PlayerSlot key={player.id} player={player} isMe={player.userId === user?.id} />
              ))}
            </div>
          </div>

          {/* Hero Grid - Center */}
          <div className="col-span-12 lg:col-span-6 order-1 lg:order-2">
            <div className="grid grid-cols-4 lg:grid-cols-5 gap-2 lg:gap-3">
              {HERO_IDS.map(heroId => (
                <HeroCard
                  key={heroId}
                  heroId={heroId}
                  isSelected={myPlayer?.selectedHeroId === heroId}
                  isLocked={myPlayer?.lockedHeroId === heroId}
                  isLockedByOther={lockedHeroes.has(heroId) && myPlayer?.lockedHeroId !== heroId}
                  onSelect={() => selectHero(heroId)}
                />
              ))}
            </div>

            {/* Lock Button */}
            {myPlayer && !myPlayer.lockedHeroId && myPlayer.selectedHeroId && (
              <div className="mt-6 text-center">
                <button
                  onClick={lockHero}
                  className="px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg lg:text-xl rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-green-600/30"
                >
                  LOCK IN {HEROES[myPlayer.selectedHeroId]?.name.toUpperCase()}
                </button>
              </div>
            )}

            {myPlayer?.lockedHeroId && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-900/30 border border-green-500/30 rounded-lg">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-green-400 text-lg font-bold">
                    Hero locked! Waiting for other players...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dire Team */}
          <div className="col-span-12 lg:col-span-2 order-4 lg:order-3">
            <h2 className="text-red-400 font-bold text-lg mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></span>
              DIRE
            </h2>
            <div className="space-y-2">
              {direPlayers.map(player => (
                <PlayerSlot key={player.id} player={player} isMe={player.userId === user?.id} />
              ))}
            </div>
          </div>

          {/* Hero Ability Preview Panel */}
          <div className="col-span-12 lg:col-span-2 order-2 lg:order-4">
            {previewHeroId ? (
              <div className="sticky top-4">
                <h2 className="text-human-400 font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 bg-human-400 rounded-full"></span>
                  HERO PREVIEW
                </h2>
                <HeroAbilityPreview heroId={previewHeroId} />
              </div>
            ) : (
              <div className="sticky top-4">
                <h2 className="text-slate-500 font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 bg-slate-500 rounded-full"></span>
                  HERO PREVIEW
                </h2>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 text-center">
                  <div className="text-slate-500 text-sm">
                    Select a hero to see their abilities
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayingPhase() {
  const { players, gameTime, radiantScore, direScore, move, attack } = useGameStore();
  const { user } = useAuthStore();
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);

  // Initialize game audio hook
  useGameAudio();

  // Initialize visual effects hook
  const { effects, handleEffectComplete } = useVisualEffects();

  // Keyboard shortcut for shop (B key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field or textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' ||
                       activeElement?.tagName === 'TEXTAREA' ||
                       (activeElement as HTMLElement)?.isContentEditable;

      // Don't trigger shop hotkey when typing in chat
      if (isTyping && e.key.toLowerCase() === 'b') return;

      if (e.key.toLowerCase() === 'b') {
        setIsShopOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isShopOpen) {
        setIsShopOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShopOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const myPlayer = useMemo(() => {
    return Array.from(players.values()).find(p => p.userId === user?.id);
  }, [players, user]);

  const handleGroundClick = useCallback((point: THREE.Vector3) => {
    move({ x: point.x, y: point.y, z: point.z });
  }, [move]);

  const handlePlayerClick = useCallback((playerId: string) => {
    const targetPlayer = players.get(playerId);
    if (targetPlayer && targetPlayer.team !== myPlayer?.team) {
      attack(playerId);
    }
  }, [players, myPlayer, attack]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Top HUD */}
      <div className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur border-b border-slate-700 p-3 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-green-400 font-bold text-2xl">{radiantScore}</span>
            <span className="text-slate-500 text-sm">RADIANT</span>
          </div>
          <div className="text-center">
            <div className="text-human-400 font-mono text-2xl font-bold">{formatTime(gameTime)}</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-500 text-sm">DIRE</span>
            <span className="text-red-400 font-bold text-2xl">{direScore}</span>
          </div>
        </div>
      </div>

      {/* 3D Game Scene */}
      <div className="absolute inset-0">
        <GameScene
          onGroundClick={handleGroundClick}
          onPlayerClick={handlePlayerClick}
          visualEffects={effects}
          onEffectComplete={handleEffectComplete}
        />
      </div>

      {/* Target Frame - Shows selected player info */}
      <TargetFrame />

      {/* Buff Bar - Above player portrait */}
      {myPlayer && myPlayer.buffs.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
          <BuffBar />
        </div>
      )}

      {/* Bottom HUD - Player Stats */}
      {myPlayer && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur border-t border-slate-700 p-3 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl
                ${myPlayer.heroId && HEROES[myPlayer.heroId]?.faction === 'mystical' ? 'bg-mystical-600' : 'bg-human-600'}`}
              >
                {myPlayer.heroId && HEROES[myPlayer.heroId]?.role === 'tank' && '🛡️'}
                {myPlayer.heroId && HEROES[myPlayer.heroId]?.role === 'mage' && '🔮'}
                {myPlayer.heroId && HEROES[myPlayer.heroId]?.role === 'warrior' && '⚔️'}
                {myPlayer.heroId && HEROES[myPlayer.heroId]?.role === 'healer' && '💚'}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{HEROES[myPlayer.heroId]?.name}</p>
                <p className="text-slate-400 text-xs">Level {myPlayer.level}</p>
              </div>
            </div>

            {/* Health/Mana bars */}
            <div className="flex-1 max-w-sm mx-6">
              <div className="mb-1">
                <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                  <span>HP</span>
                  <span>{Math.floor(myPlayer.currentHealth)}/{myPlayer.maxHealth}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-200"
                    style={{ width: `${(myPlayer.currentHealth / myPlayer.maxHealth) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                  <span>MP</span>
                  <span>{Math.floor(myPlayer.currentMana)}/{myPlayer.maxMana}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-200"
                    style={{ width: `${(myPlayer.currentMana / myPlayer.maxMana) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Abilities */}
            <div className="mx-4">
              <AbilityBar />
            </div>

            {/* KDA & Gold */}
            <div className="flex items-center gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-white">
                  {myPlayer.kills}/{myPlayer.deaths}/{myPlayer.assists}
                </p>
                <p className="text-xs text-slate-400">K / D / A</p>
              </div>
              <div>
                <p className="text-xl font-bold text-human-400">{myPlayer.gold}</p>
                <p className="text-xs text-slate-400">Gold</p>
              </div>
            </div>

            {/* Death/Respawn indicator */}
            {!myPlayer.isAlive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                <div className="text-center">
                  <p className="text-red-400 font-bold text-xl">DEAD</p>
                  <p className="text-slate-300">Respawning in {Math.ceil(myPlayer.respawnTime)}s</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mini-map */}
      <div className="fixed bottom-24 right-4 z-40">
        <Minimap
          onMoveClick={(pos) => move(pos)}
          onCameraClick={(pos) => setCameraTarget(pos.x, pos.z)}
        />
      </div>

      {/* Shop button */}
      <button
        onClick={() => setIsShopOpen(true)}
        className="fixed bottom-24 left-4 bg-human-600 hover:bg-human-500 text-white font-bold px-4 py-2 rounded z-40 transition-colors"
      >
        Shop (B)
      </button>

      {/* Game Chat */}
      <GameChat />

      {/* Item Shop Modal */}
      <ItemShop isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />

      {/* Audio Settings Modal */}
      <AudioSettings isOpen={isAudioSettingsOpen} onClose={() => setIsAudioSettingsOpen(false)} />

      {/* Audio settings button */}
      <button
        onClick={() => setIsAudioSettingsOpen(true)}
        className="fixed top-16 right-4 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded z-40 transition-colors"
        title="Audio Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

function WaitingPhase() {
  const { players } = useGameStore();
  const connectedCount = Array.from(players.values()).filter(p => p.isConnected).length;
  const totalPlayers = Array.from(players.values()).filter(p => !p.isBot).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-6xl mb-6">⚔️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Waiting for Players</h2>
        <p className="text-slate-400">
          {connectedCount} / {totalPlayers} players connected
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {Array.from(players.values()).filter(p => !p.isBot).map(player => (
            <div
              key={player.id}
              className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-slate-600'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerStatsRow({ player, isMe }: { player: GameEndPlayerStats; isMe: boolean }) {
  const hero = HEROES[player.heroId];
  const kda = player.deaths === 0
    ? (player.kills + player.assists).toFixed(1)
    : ((player.kills + player.assists) / player.deaths).toFixed(1);

  return (
    <tr className={`border-b border-slate-700 ${isMe ? 'bg-yellow-500/10' : ''}`}>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
            ${hero?.faction === 'mystical' ? 'bg-mystical-600' : 'bg-human-600'}`}
          >
            {hero?.role === 'tank' && '🛡️'}
            {hero?.role === 'mage' && '🔮'}
            {hero?.role === 'warrior' && '⚔️'}
            {hero?.role === 'healer' && '💚'}
            {hero?.role === 'assassin' && '🗡️'}
          </div>
          <div>
            <p className={`text-sm font-medium ${isMe ? 'text-yellow-400' : 'text-white'}`}>
              {player.oddsDisplayName}
              {player.isBot && <span className="text-slate-500 ml-1">(BOT)</span>}
              {isMe && <span className="text-yellow-400 ml-1">(YOU)</span>}
            </p>
            <p className="text-xs text-slate-400">{hero?.name || player.heroId}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-center">
        <span className="text-green-400">{player.kills}</span>
        <span className="text-slate-500"> / </span>
        <span className="text-red-400">{player.deaths}</span>
        <span className="text-slate-500"> / </span>
        <span className="text-blue-400">{player.assists}</span>
      </td>
      <td className="px-3 py-2 text-center text-slate-300">{kda}</td>
      <td className="px-3 py-2 text-center text-human-400">{player.goldEarned.toLocaleString()}</td>
      <td className="px-3 py-2 text-center text-red-300">{player.damageDealt.toLocaleString()}</td>
    </tr>
  );
}

function GameEndScreen() {
  const navigate = useNavigate();
  const { gameEndData, myTeam, disconnect } = useGameStore();
  const { user } = useAuthStore();
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          handleReturnToLobby();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleReturnToLobby = async () => {
    await disconnect();
    navigate('/lobby');
  };

  if (!gameEndData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Game Over</h2>
          <button
            onClick={handleReturnToLobby}
            className="px-6 py-3 bg-human-600 hover:bg-human-500 text-white rounded-lg"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  const isWinner = myTeam === gameEndData.winner;
  const radiantPlayers = gameEndData.playerStats.filter(p => p.team === 'radiant');
  const direPlayers = gameEndData.playerStats.filter(p => p.team === 'dire');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className={`text-5xl font-bold mb-2 ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
          {isWinner ? 'VICTORY' : 'DEFEAT'}
        </h1>
        <p className="text-slate-400 text-lg">
          {gameEndData.winner === 'radiant' ? 'Radiant' : 'Dire'} Victory
        </p>
        <div className="flex items-center justify-center gap-8 mt-4">
          <div className="text-center">
            <span className="text-green-400 font-bold text-3xl">{gameEndData.radiantScore}</span>
            <p className="text-slate-500 text-sm">Radiant</p>
          </div>
          <div className="text-slate-600 text-xl">vs</div>
          <div className="text-center">
            <span className="text-red-400 font-bold text-3xl">{gameEndData.direScore}</span>
            <p className="text-slate-500 text-sm">Dire</p>
          </div>
        </div>
        <p className="text-slate-500 mt-2">Game Duration: {formatTime(gameEndData.gameTime)}</p>
      </div>

      {/* Stats Tables */}
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Radiant Team */}
        <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-green-500/30">
          <div className="bg-green-600/20 px-4 py-2 border-b border-green-500/30">
            <h2 className="font-bold text-green-400 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              RADIANT {gameEndData.winner === 'radiant' && '- WINNER'}
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr className="text-slate-400 text-xs">
                <th className="px-3 py-2 text-left">Player</th>
                <th className="px-3 py-2 text-center">K / D / A</th>
                <th className="px-3 py-2 text-center">KDA</th>
                <th className="px-3 py-2 text-center">Gold</th>
                <th className="px-3 py-2 text-center">Damage</th>
              </tr>
            </thead>
            <tbody>
              {radiantPlayers.map(player => (
                <PlayerStatsRow
                  key={player.oddsUserId}
                  player={player}
                  isMe={player.oddsUserId === user?.id}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Dire Team */}
        <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-red-500/30">
          <div className="bg-red-600/20 px-4 py-2 border-b border-red-500/30">
            <h2 className="font-bold text-red-400 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-400 rounded-full"></span>
              DIRE {gameEndData.winner === 'dire' && '- WINNER'}
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr className="text-slate-400 text-xs">
                <th className="px-3 py-2 text-left">Player</th>
                <th className="px-3 py-2 text-center">K / D / A</th>
                <th className="px-3 py-2 text-center">KDA</th>
                <th className="px-3 py-2 text-center">Gold</th>
                <th className="px-3 py-2 text-center">Damage</th>
              </tr>
            </thead>
            <tbody>
              {direPlayers.map(player => (
                <PlayerStatsRow
                  key={player.oddsUserId}
                  player={player}
                  isMe={player.oddsUserId === user?.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return to Lobby */}
      <div className="text-center mt-8">
        <button
          onClick={handleReturnToLobby}
          className="px-8 py-4 bg-human-600 hover:bg-human-500 text-white font-bold text-lg rounded-lg transition-all transform hover:scale-105"
        >
          Return to Lobby
        </button>
        <p className="text-slate-500 mt-2 text-sm">
          Auto-returning in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}

export default function GamePage() {
  const navigate = useNavigate();
  const { isConnected, isConnecting, error, phase, matchId, connect } = useGameStore();
  const { token } = useAuthStore();
  const isAuthenticated = !!token;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!matchId) {
      navigate('/lobby');
      return;
    }

    if (!isConnected && !isConnecting) {
      connect();
    }

    return () => {
      // Don't disconnect on unmount - user might refresh
    };
  }, [isAuthenticated, matchId, isConnected, isConnecting, connect, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={() => navigate('/lobby')}
            className="px-6 py-3 bg-human-600 hover:bg-human-500 text-white rounded-lg"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-6">⚔️</div>
          <p className="text-white text-xl">Connecting to game...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-6">🎮</div>
          <p className="text-white text-xl">Joining match...</p>
        </div>
      </div>
    );
  }

  switch (phase) {
    case 'waiting':
      return <WaitingPhase />;
    case 'hero_select':
      return <HeroSelectPhase />;
    case 'loading':
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-6">🎮</div>
            <p className="text-white text-xl">Loading game...</p>
          </div>
        </div>
      );
    case 'playing':
    case 'paused':
      return <PlayingPhase />;
    case 'ended':
      return <GameEndScreen />;
    default:
      return <WaitingPhase />;
  }
}
