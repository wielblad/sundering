import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Grid, Sky } from '@react-three/drei';
import { Suspense, useCallback, useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore, GamePlayer, TowerState, CreepState, JungleMonsterState, JungleCampState } from '../../stores/gameStore';
import { useAuthStore } from '../../stores/authStore';
import { HEROES, BALANCE, MAIN_MAP, Obstacle, Circle, Rectangle, Region, Lane, TowerPosition } from '@sundering/shared';
import VisualEffects, {
  DamageNumber,
  LevelUpEffect,
  GoldEffect,
  AbilityEffect,
  DeathEffect,
  HitEffect,
} from './VisualEffects';
import BillboardHealthBar, { CreepHealthBar } from './BillboardHealthBar';

// Map dimensions from config
const MAP_SIZE = BALANCE.mapWidth;
const HALF_MAP = MAP_SIZE / 2;

interface PlayerMeshProps {
  player: GamePlayer;
  isMe: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function PlayerMesh({ player, isMe, isSelected, onSelect }: PlayerMeshProps) {
  const hero = HEROES[player.heroId];
  if (!hero) return null;

  // Color based on team and faction
  const teamColor = player.team === 'radiant' ? '#22c55e' : '#ef4444';
  const factionColor = hero.faction === 'mystical' ? '#8b5cf6' : '#f59e0b';

  // Position from server state
  const position: [number, number, number] = [
    player.position.x,
    player.position.y + 50, // Raise slightly above ground
    player.position.z,
  ];

  // Health bar position - fixed above player head
  const healthBarPosition: [number, number, number] = [
    player.position.x,
    player.position.y + 150,
    player.position.z,
  ];

  // Show mana bar for ALL units (teammates and enemies)
  const showMana = true;

  // Handle click on player for selection
  const handleClick = useCallback((e: any) => {
    if (e.stopPropagation) e.stopPropagation();
    onSelect();
  }, [onSelect]);

  return (
    <>
      {/* Health Bar - outside rotated group, fixed position */}
      <BillboardHealthBar
        position={healthBarPosition}
        currentHealth={player.currentHealth}
        maxHealth={player.maxHealth}
        currentMana={player.currentMana}
        maxMana={player.maxMana}
        name={player.displayName || player.username}
        team={player.team}
        isAlive={player.isAlive}
        showMana={showMana}
        isMe={isMe}
        level={player.level}
      />

      <group position={position} rotation={[0, player.rotation, 0]}>
        {/* Clickable hitbox for selection */}
        <mesh onClick={handleClick} visible={false}>
          <cylinderGeometry args={[70, 70, 150, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Selection ring - shown when this player is selected */}
        {isSelected && (
          <mesh position={[0, 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[75, 90, 32]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
        )}

        {/* Player body - cylinder */}
        <mesh castShadow>
          <cylinderGeometry args={[40, 50, 100, 16]} />
          <meshStandardMaterial
            color={isMe ? '#fbbf24' : factionColor}
            emissive={isSelected ? '#ffffff' : (isMe ? '#fbbf24' : undefined)}
            emissiveIntensity={isSelected ? 0.4 : (isMe ? 0.3 : 0)}
          />
        </mesh>

        {/* Direction indicator - cone */}
        <mesh position={[0, 0, 60]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[20, 40, 8]} />
          <meshStandardMaterial color={teamColor} />
        </mesh>

        {/* Team indicator ring */}
        <mesh position={[0, 5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[55, 65, 32]} />
          <meshBasicMaterial color={teamColor} side={THREE.DoubleSide} />
        </mesh>

        {/* Dead indicator */}
        {!player.isAlive && (
          <mesh position={[0, 100, 0]} rotation={[-Math.PI / 4, 0, Math.PI / 4]}>
            <boxGeometry args={[80, 10, 10]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        )}
      </group>
    </>
  );
}

function SpawnZone({ team, position }: { team: 'radiant' | 'dire'; position: [number, number, number] }) {
  const color = team === 'radiant' ? '#22c55e' : '#ef4444';

  return (
    <group position={position}>
      {/* Spawn platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[500, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.3}
        />
      </mesh>
      {/* Spawn ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
        <ringGeometry args={[480, 500, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// Colors for different obstacle types
const OBSTACLE_COLORS: Record<string, string> = {
  wall: '#4a5568',
  rock: '#718096',
  tree: '#2d6a4f',
  building: '#f59e0b',
  water: '#0ea5e9',
};

// Render a single obstacle
function ObstacleMesh({ obstacle }: { obstacle: Obstacle }) {
  const color = OBSTACLE_COLORS[obstacle.type] || '#666666';

  if (obstacle.shape === 'circle') {
    const circle = obstacle.bounds as Circle;
    const height = obstacle.type === 'tree' ? 300 : obstacle.type === 'building' ? 400 : 150;

    return (
      <group position={[circle.x, height / 2, circle.z]}>
        {obstacle.type === 'tree' ? (
          <>
            {/* Tree trunk */}
            <mesh castShadow>
              <cylinderGeometry args={[circle.radius * 0.3, circle.radius * 0.4, height * 0.5, 8]} />
              <meshStandardMaterial color="#5d4e37" />
            </mesh>
            {/* Tree foliage */}
            <mesh position={[0, height * 0.4, 0]} castShadow>
              <sphereGeometry args={[circle.radius, 8, 8]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </>
        ) : obstacle.type === 'building' ? (
          <>
            {/* Building base */}
            <mesh castShadow>
              <cylinderGeometry args={[circle.radius, circle.radius * 1.2, height, 8]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
            {/* Building top */}
            <mesh position={[0, height * 0.6, 0]} castShadow>
              <coneGeometry args={[circle.radius * 0.8, height * 0.3, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
            </mesh>
          </>
        ) : (
          <mesh castShadow>
            <sphereGeometry args={[circle.radius, 16, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )}
      </group>
    );
  } else {
    // Rectangle obstacle
    const rect = obstacle.bounds as Rectangle;
    const height = obstacle.type === 'wall' ? 200 : 100;
    const centerX = rect.x + rect.width / 2;
    const centerZ = rect.z + rect.height / 2;

    return (
      <mesh
        position={[centerX, height / 2, centerZ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[rect.width, height, rect.height]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
}

// Render all obstacles from map config
function MapObstacles() {
  return (
    <>
      {MAIN_MAP.obstacles.map((obstacle) => (
        <ObstacleMesh key={obstacle.id} obstacle={obstacle} />
      ))}
    </>
  );
}

// Render region indicators (semi-transparent colored areas)
function RegionIndicator({ region }: { region: Region }) {
  const regionColors: Record<string, string> = {
    radiant_base: '#22c55e',
    dire_base: '#ef4444',
    top_lane: '#3b82f6',
    mid_lane: '#a855f7',
    bot_lane: '#f97316',
    jungle_radiant_top: '#166534',
    jungle_radiant_bot: '#166534',
    jungle_dire_top: '#7f1d1d',
    jungle_dire_bot: '#7f1d1d',
    river: '#0ea5e9',
  };

  const color = regionColors[region.id] || '#666666';
  const bounds = region.bounds;
  const centerX = bounds.x + bounds.width / 2;
  const centerZ = bounds.z + bounds.height / 2;

  return (
    <mesh
      position={[centerX, 1, centerZ]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[bounds.width, bounds.height]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} />
    </mesh>
  );
}

// Render lane paths (radiant side path only for visual clarity)
function LanePath({ lane }: { lane: Lane }) {
  const laneColors: Record<string, string> = {
    top: '#3b82f6',
    mid: '#a855f7',
    bot: '#f97316',
  };

  const color = laneColors[lane.id] || '#ffffff';
  // Use radiant waypoints for the lane visualization
  const waypoints = lane.waypoints.radiant;
  const points = waypoints.map((wp) => new THREE.Vector3(wp.x, 5, wp.z));

  if (points.length < 2) return null;

  const curve = new THREE.CatmullRomCurve3(points);
  const curvePoints = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

  return (
    <line>
      <bufferGeometry attach="geometry" {...geometry} />
      <lineBasicMaterial attach="material" color={color} transparent opacity={0.5} linewidth={2} />
    </line>
  );
}

// Render tower placeholder (for map visualization)
function TowerMarker({ tower }: { tower: TowerPosition }) {
  const teamColor = tower.team === 'radiant' ? '#22c55e' : '#ef4444';

  return (
    <group position={[tower.position.x, 0, tower.position.z]}>
      {/* Base circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]}>
        <ringGeometry args={[80, 100, 32]} />
        <meshBasicMaterial color={teamColor} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Render actual game tower from server state
function TowerMesh({ tower }: { tower: TowerState }) {
  if (!tower.isAlive) return null;

  const teamColor = tower.team === 'radiant' ? '#22c55e' : '#ef4444';
  const tierColor = tower.tier === 4 ? '#fbbf24' : tower.tier === 3 ? '#a855f7' : tower.tier === 2 ? '#3b82f6' : '#64748b';

  // Tower height based on tier
  const towerHeight = 200 + (tower.tier * 50);
  const baseRadius = 70 + (tower.tier * 10);

  // Health bar
  const healthPercent = tower.maxHealth > 0 ? tower.currentHealth / tower.maxHealth : 0;

  return (
    <group position={[tower.position.x, 0, tower.position.z]}>
      {/* Tower base */}
      <mesh position={[0, 20, 0]} castShadow>
        <cylinderGeometry args={[baseRadius * 1.2, baseRadius * 1.5, 40, 8]} />
        <meshStandardMaterial color={tierColor} />
      </mesh>

      {/* Tower body */}
      <mesh position={[0, towerHeight / 2 + 40, 0]} castShadow>
        <cylinderGeometry args={[baseRadius * 0.6, baseRadius, towerHeight, 8]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>

      {/* Tower top (crown) */}
      <mesh position={[0, towerHeight + 40, 0]} castShadow>
        <cylinderGeometry args={[baseRadius * 0.8, baseRadius * 0.5, 50, 8]} />
        <meshStandardMaterial color={teamColor} emissive={teamColor} emissiveIntensity={0.4} />
      </mesh>

      {/* Attack indicator glow when attacking */}
      {tower.targetId && (
        <mesh position={[0, towerHeight + 60, 0]}>
          <sphereGeometry args={[30, 16, 16]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Team indicator ring on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]}>
        <ringGeometry args={[baseRadius + 20, baseRadius + 40, 32]} />
        <meshBasicMaterial color={teamColor} transparent opacity={0.7} />
      </mesh>

      {/* Attack range indicator (when under attack) */}
      {tower.isUnderAttack && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 3, 0]}>
          <ringGeometry args={[tower.attackRange - 20, tower.attackRange, 32]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Health bar background */}
      <mesh position={[0, towerHeight + 100, 0]}>
        <boxGeometry args={[120, 15, 10]} />
        <meshBasicMaterial color="#1f2937" />
      </mesh>

      {/* Health bar fill */}
      <mesh position={[(healthPercent - 1) * 60, towerHeight + 100, 1]}>
        <boxGeometry args={[120 * healthPercent, 12, 10]} />
        <meshBasicMaterial color={healthPercent > 0.3 ? '#22c55e' : '#ef4444'} />
      </mesh>

      {/* Tier label */}
      <mesh position={[0, towerHeight + 120, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[30, 20, 5]} />
        <meshBasicMaterial color={tierColor} />
      </mesh>
    </group>
  );
}

function Terrain() {
  return (
    <>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Grid for reference */}
      <Grid
        position={[0, 0, 0]}
        args={[MAP_SIZE, MAP_SIZE]}
        cellSize={500}
        cellThickness={0.5}
        cellColor="#334155"
        sectionSize={2000}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={15000}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {/* Region indicators - render first (background layer) */}
      {MAIN_MAP.regions.map((region) => (
        <RegionIndicator key={region.id} region={region} />
      ))}

      {/* Lane paths */}
      {MAIN_MAP.lanes.map((lane) => (
        <LanePath key={lane.id} lane={lane} />
      ))}

      {/* Tower position markers */}
      {MAIN_MAP.towers.map((tower) => (
        <TowerMarker key={tower.id} tower={tower} />
      ))}

      {/* Spawn zones from map config */}
      {MAIN_MAP.spawns.map((spawn) => (
        <SpawnZone
          key={`spawn-${spawn.team}`}
          team={spawn.team as 'radiant' | 'dire'}
          position={[spawn.position.x, 0, spawn.position.z]}
        />
      ))}

      {/* Map obstacles (walls, rocks, trees) */}
      <MapObstacles />

      {/* Map boundaries - visual walls */}
      <mesh position={[0, 100, -HALF_MAP]}>
        <boxGeometry args={[MAP_SIZE, 200, 50]} />
        <meshStandardMaterial color="#374151" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 100, HALF_MAP]}>
        <boxGeometry args={[MAP_SIZE, 200, 50]} />
        <meshStandardMaterial color="#374151" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-HALF_MAP, 100, 0]}>
        <boxGeometry args={[50, 200, MAP_SIZE]} />
        <meshStandardMaterial color="#374151" transparent opacity={0.5} />
      </mesh>
      <mesh position={[HALF_MAP, 100, 0]}>
        <boxGeometry args={[50, 200, MAP_SIZE]} />
        <meshStandardMaterial color="#374151" transparent opacity={0.5} />
      </mesh>
    </>
  );
}

// Helper to check if an entity is visible to my team
function isVisibleToMyTeam(
  entity: { visibleToRadiant: boolean; visibleToDire: boolean; team?: string },
  myTeam: 'radiant' | 'dire'
): boolean {
  return myTeam === 'radiant' ? entity.visibleToRadiant : entity.visibleToDire;
}

function Players() {
  const { players, myTeam, selectedTargetId, setSelectedTarget } = useGameStore();
  const { user } = useAuthStore();

  // Filter players by visibility - my team always visible, enemy team only if in vision
  const playerList = useMemo(() => {
    return Array.from(players.values()).filter(player => {
      // Always show players on my team
      if (player.team === myTeam) return true;
      // Show enemy players only if visible to my team
      return isVisibleToMyTeam(player, myTeam);
    });
  }, [players, myTeam]);

  return (
    <>
      {playerList.map(player => (
        <PlayerMesh
          key={player.id}
          player={player}
          isMe={player.userId === user?.id}
          isSelected={player.id === selectedTargetId}
          onSelect={() => setSelectedTarget(player.id)}
        />
      ))}
    </>
  );
}

function Towers() {
  const { towers } = useGameStore();

  const towerList = useMemo(() => Array.from(towers.values()), [towers]);

  return (
    <>
      {towerList.map(tower => (
        <TowerMesh
          key={tower.id}
          tower={tower}
        />
      ))}
    </>
  );
}

interface CreepMeshProps {
  creep: CreepState;
  isSelected: boolean;
  onAttack: () => void;
}

function CreepMesh({ creep, isSelected, onAttack }: CreepMeshProps) {
  if (!creep.isAlive) return null;

  // Color based on team
  const teamColor = creep.team === 'radiant' ? '#22c55e' : '#ef4444';

  // Size based on type
  const creepSize = creep.type === 'siege' ? 40 : creep.type === 'ranged' ? 30 : 35;
  const creepHeight = creep.type === 'siege' ? 60 : creep.type === 'ranged' ? 40 : 50;

  // Type-specific color accent
  const typeColor = creep.type === 'siege' ? '#f59e0b' : creep.type === 'ranged' ? '#60a5fa' : '#a855f7';

  // Health bar position - fixed above creep
  const healthBarPosition: [number, number, number] = [
    creep.position.x,
    creep.position.y + creepHeight + 40,
    creep.position.z,
  ];

  // Handle right-click to attack creep
  const handleClick = useCallback((e: any) => {
    // Only respond to right-click (button 2)
    if (e.nativeEvent?.button === 2) {
      e.stopPropagation();
      onAttack();
    }
  }, [onAttack]);

  return (
    <>
      {/* Billboard Health Bar - outside the group for fixed position */}
      <CreepHealthBar
        position={healthBarPosition}
        currentHealth={creep.currentHealth}
        maxHealth={creep.maxHealth}
        team={creep.team}
        isAlive={creep.isAlive}
      />

      <group position={[creep.position.x, 0, creep.position.z]}>
        {/* Clickable hitbox for targeting - uses transparent material, not visible={false} */}
        <mesh
          onPointerDown={handleClick}
          position={[0, creepHeight / 2, 0]}
        >
          <cylinderGeometry args={[creepSize + 10, creepSize + 10, creepHeight + 20, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Selection ring - shown when this creep is targeted */}
        {isSelected && (
          <mesh position={[0, 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[creepSize + 15, creepSize + 25, 16]} />
            <meshBasicMaterial color={teamColor} side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
        )}

        {/* Creep body - different shapes for different types */}
        {creep.type === 'melee' && (
          // Melee: squat cylinder
          <mesh position={[0, creepHeight / 2, 0]} rotation={[0, creep.rotation, 0]}>
            <cylinderGeometry args={[creepSize, creepSize * 0.8, creepHeight, 6]} />
            <meshStandardMaterial color={teamColor} />
          </mesh>
        )}

        {creep.type === 'ranged' && (
          // Ranged: tall thin cylinder
          <mesh position={[0, creepHeight / 2, 0]} rotation={[0, creep.rotation, 0]}>
            <cylinderGeometry args={[creepSize * 0.7, creepSize * 0.5, creepHeight, 8]} />
            <meshStandardMaterial color={teamColor} />
          </mesh>
        )}

        {creep.type === 'siege' && (
          // Siege: box-like
          <mesh position={[0, creepHeight / 2, 0]} rotation={[0, creep.rotation, 0]}>
            <boxGeometry args={[creepSize * 1.5, creepHeight, creepSize]} />
            <meshStandardMaterial color={teamColor} />
          </mesh>
        )}

        {/* Type indicator on top */}
        <mesh position={[0, creepHeight + 10, 0]}>
          <sphereGeometry args={[8, 8, 8]} />
          <meshStandardMaterial color={typeColor} emissive={typeColor} emissiveIntensity={0.5} />
        </mesh>

        {/* Direction indicator (small arrow) */}
        <mesh position={[Math.sin(creep.rotation) * creepSize * 0.8, 5, Math.cos(creep.rotation) * creepSize * 0.8]}>
          <coneGeometry args={[8, 16, 4]} />
          <meshBasicMaterial color={teamColor} />
        </mesh>
      </group>
    </>
  );
}

function Creeps() {
  const { creeps, myTeam, attack } = useGameStore();
  const { user } = useAuthStore();

  // Get my player's current target to highlight selected creep
  const { players } = useGameStore();
  const myPlayer = useMemo(() => {
    return Array.from(players.values()).find(p => p.userId === user?.id);
  }, [players, user]);

  // Filter creeps by visibility - my team's creeps always visible, enemy creeps only if in vision
  const creepList = useMemo(() => {
    return Array.from(creeps.values()).filter(creep => {
      // Always show creeps on my team
      if (creep.team === myTeam) return true;
      // Show enemy creeps only if visible to my team
      return isVisibleToMyTeam(creep, myTeam);
    });
  }, [creeps, myTeam]);

  return (
    <>
      {creepList.map(creep => (
        <CreepMesh
          key={creep.id}
          creep={creep}
          isSelected={myPlayer?.targetId === creep.id}
          onAttack={() => attack(creep.id)}
        />
      ))}
    </>
  );
}

// Monster type colors and shapes
const MONSTER_COLORS: Record<string, { primary: string; accent: string }> = {
  small_wolf: { primary: '#6b7280', accent: '#9ca3af' },
  wolf: { primary: '#4b5563', accent: '#6b7280' },
  alpha_wolf: { primary: '#374151', accent: '#f59e0b' },
  small_golem: { primary: '#78716c', accent: '#a8a29e' },
  golem: { primary: '#57534e', accent: '#78716c' },
  ancient_golem: { primary: '#44403c', accent: '#3b82f6' },
  harpy: { primary: '#7c3aed', accent: '#a78bfa' },
  harpy_queen: { primary: '#5b21b6', accent: '#f472b6' },
  centaur: { primary: '#92400e', accent: '#d97706' },
  centaur_khan: { primary: '#78350f', accent: '#fbbf24' },
  dragon: { primary: '#dc2626', accent: '#f97316' },
  elder_dragon: { primary: '#991b1b', accent: '#fbbf24' },
};

// Monster size based on type
const MONSTER_SIZES: Record<string, { radius: number; height: number }> = {
  small_wolf: { radius: 25, height: 40 },
  wolf: { radius: 35, height: 55 },
  alpha_wolf: { radius: 45, height: 70 },
  small_golem: { radius: 40, height: 60 },
  golem: { radius: 55, height: 90 },
  ancient_golem: { radius: 70, height: 120 },
  harpy: { radius: 30, height: 50 },
  harpy_queen: { radius: 45, height: 70 },
  centaur: { radius: 50, height: 80 },
  centaur_khan: { radius: 65, height: 100 },
  dragon: { radius: 80, height: 100 },
  elder_dragon: { radius: 120, height: 150 },
};

interface JungleMonsterMeshProps {
  monster: JungleMonsterState;
  isSelected: boolean;
  onAttack: () => void;
}

function JungleMonsterMesh({ monster, isSelected, onAttack }: JungleMonsterMeshProps) {
  if (!monster.isAlive) return null;

  const colors = MONSTER_COLORS[monster.monsterType] || { primary: '#6b7280', accent: '#9ca3af' };
  const size = MONSTER_SIZES[monster.monsterType] || { radius: 40, height: 60 };

  const healthPercent = monster.maxHealth > 0 ? monster.currentHealth / monster.maxHealth : 0;

  // Determine monster category for shape
  const isWolf = monster.monsterType.includes('wolf');
  const isGolem = monster.monsterType.includes('golem');
  const isHarpy = monster.monsterType.includes('harpy');
  const isCentaur = monster.monsterType.includes('centaur');
  const isDragon = monster.monsterType.includes('dragon');

  // Handle right-click to attack monster
  const handleClick = useCallback((e: any) => {
    // Only respond to right-click (button 2)
    if (e.nativeEvent?.button === 2) {
      e.stopPropagation();
      onAttack();
    }
  }, [onAttack]);

  return (
    <group position={[monster.position.x, 0, monster.position.z]}>
      {/* Clickable hitbox for targeting - uses transparent material, not visible={false} */}
      <mesh
        onPointerDown={handleClick}
        position={[0, size.height / 2, 0]}
      >
        <cylinderGeometry args={[size.radius + 15, size.radius + 15, size.height + 30, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Selection ring - shown when this monster is targeted */}
      {isSelected && (
        <mesh position={[0, 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size.radius + 20, size.radius + 35, 24]} />
          <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}
      {/* Monster body - different shapes based on type */}
      {isWolf && (
        <>
          {/* Wolf body - elongated ellipsoid */}
          <mesh position={[0, size.height * 0.4, 0]} rotation={[0, monster.rotation, 0]}>
            <sphereGeometry args={[size.radius, 12, 8]} />
            <meshStandardMaterial color={colors.primary} />
          </mesh>
          {/* Wolf head */}
          <mesh position={[Math.sin(monster.rotation) * size.radius * 0.8, size.height * 0.5, Math.cos(monster.rotation) * size.radius * 0.8]}>
            <sphereGeometry args={[size.radius * 0.5, 8, 8]} />
            <meshStandardMaterial color={colors.primary} />
          </mesh>
        </>
      )}

      {isGolem && (
        <>
          {/* Golem body - chunky boxes */}
          <mesh position={[0, size.height * 0.5, 0]} rotation={[0, monster.rotation, 0]}>
            <boxGeometry args={[size.radius * 1.4, size.height, size.radius]} />
            <meshStandardMaterial color={colors.primary} />
          </mesh>
          {/* Golem head */}
          <mesh position={[0, size.height + size.radius * 0.3, 0]}>
            <boxGeometry args={[size.radius * 0.8, size.radius * 0.6, size.radius * 0.6]} />
            <meshStandardMaterial color={colors.accent} />
          </mesh>
        </>
      )}

      {isHarpy && (
        <>
          {/* Harpy body - slender */}
          <mesh position={[0, size.height * 0.5, 0]} rotation={[0, monster.rotation, 0]}>
            <cylinderGeometry args={[size.radius * 0.6, size.radius * 0.4, size.height, 8]} />
            <meshStandardMaterial color={colors.primary} />
          </mesh>
          {/* Wings */}
          <mesh position={[size.radius * 0.8, size.height * 0.6, 0]} rotation={[0, 0, Math.PI / 6]}>
            <boxGeometry args={[size.radius * 1.2, 5, size.radius * 0.8]} />
            <meshStandardMaterial color={colors.accent} />
          </mesh>
          <mesh position={[-size.radius * 0.8, size.height * 0.6, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <boxGeometry args={[size.radius * 1.2, 5, size.radius * 0.8]} />
            <meshStandardMaterial color={colors.accent} />
          </mesh>
        </>
      )}

      {isCentaur && (
        <>
          {/* Centaur body (horse part) */}
          <mesh position={[0, size.height * 0.3, 0]} rotation={[0, monster.rotation, 0]}>
            <boxGeometry args={[size.radius * 0.8, size.height * 0.5, size.radius * 1.6]} />
            <meshStandardMaterial color={colors.primary} />
          </mesh>
          {/* Centaur torso (human part) */}
          <mesh position={[Math.sin(monster.rotation) * size.radius * 0.4, size.height * 0.7, Math.cos(monster.rotation) * size.radius * 0.4]}>
            <cylinderGeometry args={[size.radius * 0.3, size.radius * 0.4, size.height * 0.5, 8]} />
            <meshStandardMaterial color={colors.accent} />
          </mesh>
          {/* Four legs */}
          {[[-0.3, -0.5], [0.3, -0.5], [-0.3, 0.5], [0.3, 0.5]].map(([xOff, zOff], i) => (
            <mesh key={i} position={[xOff * size.radius, size.height * 0.15, zOff * size.radius]}>
              <cylinderGeometry args={[size.radius * 0.1, size.radius * 0.12, size.height * 0.3, 6]} />
              <meshStandardMaterial color={colors.primary} />
            </mesh>
          ))}
        </>
      )}

      {isDragon && (
        <>
          {/* Dragon body - large scaled beast */}
          <mesh position={[0, size.height * 0.4, 0]} rotation={[0, monster.rotation, 0]}>
            <sphereGeometry args={[size.radius, 12, 10]} />
            <meshStandardMaterial color={colors.primary} />
          </mesh>
          {/* Dragon head */}
          <mesh position={[Math.sin(monster.rotation) * size.radius * 1.2, size.height * 0.5, Math.cos(monster.rotation) * size.radius * 1.2]}>
            <coneGeometry args={[size.radius * 0.4, size.radius * 0.8, 8]} />
            <meshStandardMaterial color={colors.primary} />
          </mesh>
          {/* Dragon wings */}
          <mesh position={[size.radius * 0.6, size.height * 0.7, 0]} rotation={[0, 0, Math.PI / 5]}>
            <boxGeometry args={[size.radius * 1.5, 8, size.radius]} />
            <meshStandardMaterial color={colors.accent} />
          </mesh>
          <mesh position={[-size.radius * 0.6, size.height * 0.7, 0]} rotation={[0, 0, -Math.PI / 5]}>
            <boxGeometry args={[size.radius * 1.5, 8, size.radius]} />
            <meshStandardMaterial color={colors.accent} />
          </mesh>
          {/* Dragon tail */}
          <mesh position={[-Math.sin(monster.rotation) * size.radius * 1.2, size.height * 0.3, -Math.cos(monster.rotation) * size.radius * 1.2]} rotation={[Math.PI / 6, monster.rotation, 0]}>
            <coneGeometry args={[size.radius * 0.2, size.radius, 6]} />
            <meshStandardMaterial color={colors.primary} />
          </mesh>
        </>
      )}

      {/* Aggro indicator - glowing ring when attacking */}
      {monster.isAggro && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]}>
          <ringGeometry args={[size.radius + 10, size.radius + 20, 16]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Reset indicator - blue tint when returning to spawn */}
      {monster.isResetting && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]}>
          <ringGeometry args={[size.radius + 10, size.radius + 20, 16]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Health bar */}
      <group position={[0, size.height + 30, 0]}>
        {/* Background */}
        <mesh>
          <boxGeometry args={[60, 8, 3]} />
          <meshBasicMaterial color="#1f2937" />
        </mesh>
        {/* Health fill */}
        <mesh position={[(healthPercent - 1) * 30, 0, 1]}>
          <boxGeometry args={[60 * healthPercent, 6, 3]} />
          <meshBasicMaterial color={healthPercent > 0.5 ? '#fbbf24' : healthPercent > 0.25 ? '#f97316' : '#ef4444'} />
        </mesh>
      </group>

      {/* Neutral indicator (yellow diamond) */}
      <mesh position={[0, size.height + 50, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[12, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function JungleCampIndicator({ camp }: { camp: JungleCampState }) {
  // Show camp zone with difficulty-based color
  const difficultyColors: Record<string, string> = {
    easy: '#22c55e',
    medium: '#f59e0b',
    hard: '#ef4444',
    ancient: '#a855f7',
  };

  const color = difficultyColors[camp.difficulty] || '#6b7280';
  const radius = camp.difficulty === 'ancient' ? 200 : camp.difficulty === 'hard' ? 150 : 120;

  return (
    <group position={[camp.position.x, 0, camp.position.z]}>
      {/* Camp zone circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
        <ringGeometry args={[radius - 10, radius, 24]} />
        <meshBasicMaterial color={color} transparent opacity={camp.isCleared ? 0.2 : 0.4} />
      </mesh>

      {/* Cleared indicator */}
      {camp.isCleared && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]}>
          <circleGeometry args={[40, 16]} />
          <meshBasicMaterial color="#6b7280" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

function JungleCamps() {
  const { jungleCamps, jungleMonsters, myTeam, attack, players } = useGameStore();
  const { user } = useAuthStore();

  // Get my player's current target to highlight selected monster
  const myPlayer = useMemo(() => {
    return Array.from(players.values()).find(p => p.userId === user?.id);
  }, [players, user]);

  const campList = useMemo(() => Array.from(jungleCamps.values()), [jungleCamps]);

  // Filter monsters by visibility - only show if visible to my team
  const monsterList = useMemo(() => {
    return Array.from(jungleMonsters.values()).filter(monster => {
      return isVisibleToMyTeam(monster, myTeam);
    });
  }, [jungleMonsters, myTeam]);

  return (
    <>
      {/* Camp zone indicators */}
      {campList.map(camp => (
        <JungleCampIndicator key={camp.id} camp={camp} />
      ))}
      {/* Monsters - only visible ones */}
      {monsterList.map(monster => (
        <JungleMonsterMesh
          key={monster.id}
          monster={monster}
          isSelected={myPlayer?.targetId === monster.id}
          onAttack={() => attack(monster.id)}
        />
      ))}
    </>
  );
}

// Ability Range Indicator - shows ability range circle around current player when hovering a skill
function AbilityRangeIndicator() {
  const { players, hoveredAbilityRange } = useGameStore();
  const { user } = useAuthStore();

  // Find current player
  const myPlayer = useMemo(() => {
    return Array.from(players.values()).find(p => p.userId === user?.id);
  }, [players, user]);

  // Don't render if no ability is hovered or no range
  if (!hoveredAbilityRange || !myPlayer) return null;

  return (
    <mesh
      position={[myPlayer.position.x, 5, myPlayer.position.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[hoveredAbilityRange - 10, hoveredAbilityRange, 64]} />
      <meshBasicMaterial
        color="#60a5fa"
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Camera configuration for isometric view (Dota 2 style)
const CAMERA_CONFIG = {
  // Fixed height above the target point (lower for more side view)
  height: 2200,
  // Distance from target (horizontal - larger for more side view)
  distance: 2800,
  // Rotation angle (radians) - camera from right side looking at left edge
  rotation: -Math.PI / 2, // -90 degrees - from right looking left
  // Edge panning settings
  edgePanThreshold: 50, // pixels from edge to start panning
  edgePanSpeed: 2500, // units per second
  // Map boundaries for camera target
  minX: -HALF_MAP + 500,
  maxX: HALF_MAP - 500,
  minZ: -HALF_MAP + 500,
  maxZ: HALF_MAP - 500,
};

// Store camera target ref globally so it can be accessed from outside
let globalCameraTargetRef: THREE.Vector3 | null = null;

export function setCameraTarget(x: number, z: number) {
  if (globalCameraTargetRef) {
    globalCameraTargetRef.set(
      THREE.MathUtils.clamp(x, CAMERA_CONFIG.minX, CAMERA_CONFIG.maxX),
      0,
      THREE.MathUtils.clamp(z, CAMERA_CONFIG.minZ, CAMERA_CONFIG.maxZ)
    );
  }
}

function IsometricCameraController() {
  const { camera, gl } = useThree();
  const { players } = useGameStore();
  const { user } = useAuthStore();

  // Camera target position (what the camera looks at)
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  // Mouse position for edge panning
  const mouseRef = useRef({ x: 0, y: 0, isOnScreen: false });
  // Track if we've centered on player initially
  const initializedRef = useRef(false);
  // Left-click drag state for camera panning
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });

  // Expose target ref globally
  useEffect(() => {
    globalCameraTargetRef = targetRef.current;
    return () => {
      globalCameraTargetRef = null;
    };
  }, []);

  // Find current player
  const myPlayer = useMemo(() => {
    return Array.from(players.values()).find(p => p.userId === user?.id);
  }, [players, user]);

  // Set initial camera position centered on player
  useEffect(() => {
    if (myPlayer && !initializedRef.current) {
      targetRef.current.set(myPlayer.position.x, 0, myPlayer.position.z);
      initializedRef.current = true;
    }
  }, [myPlayer]);

  // Track mouse position for edge panning and right-click drag
  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseMove = (e: MouseEvent) => {
      // Use window dimensions for edge detection (works over UI elements)
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        isOnScreen: true,
      };

      // Handle left-click drag for camera panning
      if (dragRef.current.isDragging) {
        const deltaX = e.clientX - dragRef.current.lastX;
        const deltaY = e.clientY - dragRef.current.lastY;

        // Move camera in opposite direction of mouse drag
        // For camera rotation -PI/2: deltaX affects Z, deltaY affects X
        const dragSpeed = 5; // Adjust sensitivity
        const target = targetRef.current;

        target.x = THREE.MathUtils.clamp(
          target.x + deltaY * dragSpeed,
          CAMERA_CONFIG.minX,
          CAMERA_CONFIG.maxX
        );
        target.z = THREE.MathUtils.clamp(
          target.z - deltaX * dragSpeed,
          CAMERA_CONFIG.minZ,
          CAMERA_CONFIG.maxZ
        );

        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Left mouse button (button === 0)
      if (e.button === 0) {
        dragRef.current = {
          isDragging: true,
          lastX: e.clientX,
          lastY: e.clientY,
        };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        dragRef.current.isDragging = false;
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.isOnScreen = false;
      dragRef.current.isDragging = false;
    };

    // Prevent scroll wheel zoom on canvas
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    // Prevent context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Listen on window for mouse position (edge panning works over UI)
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl]);

  // Keyboard shortcut to center camera on player (Space key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Space key centers camera on player
      if (e.code === 'Space' && myPlayer) {
        e.preventDefault();
        targetRef.current.set(myPlayer.position.x, 0, myPlayer.position.z);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [myPlayer]);

  // Update camera every frame
  useFrame((_, delta) => {
    // Use window dimensions for edge detection
    const width = window.innerWidth;
    const height = window.innerHeight;
    const { x: mouseX, y: mouseY, isOnScreen } = mouseRef.current;
    const target = targetRef.current;

    // Edge panning - only when mouse is on screen
    // Screen directions are converted to world directions based on camera rotation
    if (isOnScreen) {
      const panSpeed = CAMERA_CONFIG.edgePanSpeed * delta;
      const threshold = CAMERA_CONFIG.edgePanThreshold;

      // Calculate pan intensity for each edge (0 to 1)
      let leftIntensity = 0;
      let rightIntensity = 0;
      let topIntensity = 0;
      let bottomIntensity = 0;

      // Left edge
      if (mouseX < threshold) {
        leftIntensity = 1 - mouseX / threshold;
      }
      // Right edge
      if (mouseX > width - threshold) {
        rightIntensity = 1 - (width - mouseX) / threshold;
      }
      // Top edge
      if (mouseY < threshold) {
        topIntensity = 1 - mouseY / threshold;
      }
      // Bottom edge
      if (mouseY > height - threshold) {
        bottomIntensity = 1 - (height - mouseY) / threshold;
      }

      // Direct mapping for camera rotation -PI/2 (from right side looking left):
      // Screen LEFT  -> camera target moves in -Z direction (left on screen = left in view)
      // Screen RIGHT -> camera target moves in +Z direction (right on screen = right in view)
      // Screen UP    -> camera target moves in +X direction (up on screen = away from camera)
      // Screen DOWN  -> camera target moves in -X direction (down on screen = toward camera)

      const panX = (topIntensity - bottomIntensity) * panSpeed;
      const panZ = (rightIntensity - leftIntensity) * panSpeed;

      // Apply panning with map boundary constraints
      target.x = THREE.MathUtils.clamp(
        target.x + panX,
        CAMERA_CONFIG.minX,
        CAMERA_CONFIG.maxX
      );
      target.z = THREE.MathUtils.clamp(
        target.z + panZ,
        CAMERA_CONFIG.minZ,
        CAMERA_CONFIG.maxZ
      );
    }

    // Calculate camera position using rotation angle
    const cameraX = target.x + Math.sin(CAMERA_CONFIG.rotation) * CAMERA_CONFIG.distance;
    const cameraY = CAMERA_CONFIG.height;
    const cameraZ = target.z + Math.cos(CAMERA_CONFIG.rotation) * CAMERA_CONFIG.distance;

    // Update camera position
    camera.position.set(cameraX, cameraY, cameraZ);

    // Make camera look at target
    camera.lookAt(target);

    // Ensure camera is using perspective (not orthographic distortion)
    camera.updateProjectionMatrix();
  });

  return null;
}

interface VisualEffectsData {
  damageNumbers: DamageNumber[];
  levelUpEffects: LevelUpEffect[];
  goldEffects: GoldEffect[];
  abilityEffects: AbilityEffect[];
  deathEffects: DeathEffect[];
  hitEffects: HitEffect[];
}

interface GameSceneProps {
  onGroundClick: (point: THREE.Vector3) => void;
  onPlayerClick: (playerId: string) => void;
  visualEffects?: VisualEffectsData;
  onEffectComplete?: (type: string, id: string) => void;
  cameraTargetRef?: React.MutableRefObject<THREE.Vector3 | null>; // Ref to control camera from outside
}

function ClickHandler({ onGroundClick }: { onGroundClick: (point: THREE.Vector3) => void }) {
  const isRightMouseDown = useRef(false);

  // Handle ground intersection and move player
  const handleGroundMove = useCallback((event: THREE.Event) => {
    const threeEvent = event as any;
    const intersects = threeEvent.intersections;
    if (intersects && intersects.length > 0) {
      const point = intersects[0].point;
      if (point) {
        onGroundClick(new THREE.Vector3(point.x, 0, point.z));
      }
    }
  }, [onGroundClick]);

  // Handle RIGHT-CLICK down to start moving
  const handlePointerDown = useCallback((event: THREE.Event) => {
    const threeEvent = event as any;
    // Only handle right mouse button (button === 2)
    if (threeEvent.nativeEvent?.button !== 2) return;

    isRightMouseDown.current = true;
    handleGroundMove(event);
  }, [handleGroundMove]);

  // Handle pointer move while RMB is held
  const handlePointerMove = useCallback((event: THREE.Event) => {
    if (!isRightMouseDown.current) return;
    handleGroundMove(event);
  }, [handleGroundMove]);

  // Handle pointer up - stop following
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDown.current = false;
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <mesh
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onContextMenu={(e) => e.nativeEvent.preventDefault()} // Prevent context menu
    >
      <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export default function GameScene({ onGroundClick, onPlayerClick: _onPlayerClick, visualEffects, onEffectComplete }: GameSceneProps) {
  return (
    <Canvas
      shadows
      camera={{
        // Initial position will be overridden by IsometricCameraController
        position: [CAMERA_CONFIG.distance * 0.7, CAMERA_CONFIG.height, CAMERA_CONFIG.distance * 0.7],
        fov: 50, // Narrower FOV for more "zoomed in" feel
        near: 10,
        far: 50000,
      }}
      style={{ background: '#0f172a' }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5000, 5000, 5000]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={20000}
          shadow-camera-left={-10000}
          shadow-camera-right={10000}
          shadow-camera-top={10000}
          shadow-camera-bottom={-10000}
        />

        {/* Sky */}
        <Sky
          distance={450000}
          sunPosition={[5000, 1000, 5000]}
          inclination={0.5}
          azimuth={0.25}
        />

        {/* Scene content */}
        <Terrain />
        <Towers />
        <Creeps />
        <JungleCamps />
        <Players />
        <AbilityRangeIndicator />
        <ClickHandler onGroundClick={onGroundClick} />

        {/* Visual Effects */}
        {visualEffects && onEffectComplete && (
          <VisualEffects
            damageNumbers={visualEffects.damageNumbers}
            levelUpEffects={visualEffects.levelUpEffects}
            goldEffects={visualEffects.goldEffects}
            abilityEffects={visualEffects.abilityEffects}
            deathEffects={visualEffects.deathEffects}
            hitEffects={visualEffects.hitEffects}
            onEffectComplete={onEffectComplete}
          />
        )}

        {/* Isometric camera with edge panning */}
        <IsometricCameraController />
      </Suspense>
    </Canvas>
  );
}
