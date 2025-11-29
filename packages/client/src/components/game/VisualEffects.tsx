/**
 * VisualEffects Component
 *
 * Renders floating damage numbers, level up effects, gold pickup effects,
 * ability particles, and death animations in the 3D scene.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// ============================================
// Types
// ============================================

export interface DamageNumber {
  id: string;
  position: { x: number; y: number; z: number };
  damage: number;
  isCritical: boolean;
  isHeal: boolean;
  createdAt: number;
}

export interface LevelUpEffect {
  id: string;
  position: { x: number; y: number; z: number };
  level: number;
  createdAt: number;
}

export interface GoldEffect {
  id: string;
  position: { x: number; y: number; z: number };
  amount: number;
  createdAt: number;
}

export interface AbilityEffect {
  id: string;
  position: { x: number; y: number; z: number };
  abilitySlot: 'Q' | 'W' | 'E' | 'R';
  targetPosition?: { x: number; y: number; z: number };
  createdAt: number;
}

export interface DeathEffect {
  id: string;
  position: { x: number; y: number; z: number };
  team: 'radiant' | 'dire';
  createdAt: number;
}

// ============================================
// Damage Number Component
// ============================================

interface FloatingDamageProps {
  effect: DamageNumber;
  onComplete: (id: string) => void;
}

function FloatingDamage({ effect, onComplete }: FloatingDamageProps) {
  const meshRef = useRef<THREE.Group>(null);
  const startTime = useRef(effect.createdAt);
  const duration = 1500; // 1.5 seconds

  useFrame(() => {
    if (!meshRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = elapsed / duration;

    if (progress >= 1) {
      onComplete(effect.id);
      return;
    }

    // Float upward
    meshRef.current.position.y = effect.position.y + 100 + progress * 150;

    // Fade out
    meshRef.current.children.forEach(child => {
      if ((child as THREE.Mesh).material) {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (material.opacity !== undefined) {
          material.opacity = 1 - progress;
        }
      }
    });

    // Scale down slightly at end
    const scale = progress > 0.7 ? 1 - (progress - 0.7) * 2 : 1;
    meshRef.current.scale.setScalar(scale);
  });

  // Color based on damage type
  const color = effect.isHeal ? '#22c55e' : effect.isCritical ? '#fbbf24' : '#ef4444';
  const fontSize = effect.isCritical ? 40 : 30;
  const displayText = effect.isHeal ? `+${effect.damage}` : `-${effect.damage}`;

  return (
    <group
      ref={meshRef}
      position={[effect.position.x, effect.position.y + 100, effect.position.z]}
    >
      <Text
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={2}
        outlineColor="#000000"
      >
        {displayText}
      </Text>
    </group>
  );
}

// ============================================
// Level Up Effect Component
// ============================================

interface LevelUpEffectProps {
  effect: LevelUpEffect;
  onComplete: (id: string) => void;
}

function LevelUpParticles({ effect, onComplete }: LevelUpEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const startTime = useRef(effect.createdAt);
  const duration = 2000; // 2 seconds

  // Create particle geometry
  const particleCount = 50;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 50 + Math.random() * 30;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (!groupRef.current || !particlesRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = elapsed / duration;

    if (progress >= 1) {
      onComplete(effect.id);
      return;
    }

    // Spiral upward
    const positionArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      const baseAngle = (i / particleCount) * Math.PI * 2;
      const angle = baseAngle + progress * Math.PI * 4;
      const radius = (50 + Math.random() * 30) * (1 + progress);
      positionArray[i * 3] = Math.cos(angle) * radius;
      positionArray[i * 3 + 1] = progress * 300;
      positionArray[i * 3 + 2] = Math.sin(angle) * radius;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;

    // Fade out
    const material = particlesRef.current.material as THREE.PointsMaterial;
    material.opacity = 1 - progress * 0.5;
  });

  return (
    <group ref={groupRef} position={[effect.position.x, effect.position.y, effect.position.z]}>
      {/* Particle ring */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={15}
          color="#fbbf24"
          transparent
          opacity={1}
          sizeAttenuation
        />
      </points>

      {/* Level text */}
      <Text
        position={[0, 150, 0]}
        fontSize={50}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
        outlineWidth={3}
        outlineColor="#000000"
      >
        {`LEVEL ${effect.level}`}
      </Text>

      {/* Expanding ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[80, 100, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ============================================
// Gold Pickup Effect Component
// ============================================

interface GoldEffectProps {
  effect: GoldEffect;
  onComplete: (id: string) => void;
}

function GoldPickup({ effect, onComplete }: GoldEffectProps) {
  const meshRef = useRef<THREE.Group>(null);
  const startTime = useRef(effect.createdAt);
  const duration = 1000; // 1 second

  useFrame(() => {
    if (!meshRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = elapsed / duration;

    if (progress >= 1) {
      onComplete(effect.id);
      return;
    }

    // Float upward and fade
    meshRef.current.position.y = effect.position.y + 80 + progress * 100;

    // Scale bounce
    const bounce = Math.sin(progress * Math.PI);
    meshRef.current.scale.setScalar(1 + bounce * 0.3);
  });

  return (
    <group
      ref={meshRef}
      position={[effect.position.x, effect.position.y + 80, effect.position.z]}
    >
      {/* Gold coin icon */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[15, 15, 5, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
      </mesh>

      {/* Amount text */}
      <Text
        position={[0, 30, 0]}
        fontSize={25}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
        outlineWidth={2}
        outlineColor="#000000"
      >
        {`+${effect.amount}g`}
      </Text>
    </group>
  );
}

// ============================================
// Ability Effect Component
// ============================================

interface AbilityEffectProps {
  effect: AbilityEffect;
  onComplete: (id: string) => void;
}

function AbilityParticles({ effect, onComplete }: AbilityEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(effect.createdAt);
  const duration = 800; // 0.8 seconds

  // Ability colors
  const abilityColors: Record<string, string> = {
    Q: '#3b82f6', // Blue
    W: '#22c55e', // Green
    E: '#a855f7', // Purple
    R: '#ef4444', // Red (ultimate)
  };

  const color = abilityColors[effect.abilitySlot] || '#ffffff';

  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = elapsed / duration;

    if (progress >= 1) {
      onComplete(effect.id);
      return;
    }

    // Expand outward
    const scale = 1 + progress * 2;
    groupRef.current.scale.setScalar(scale);

    // Rotate
    groupRef.current.rotation.y += 0.1;
  });

  return (
    <group ref={groupRef} position={[effect.position.x, effect.position.y + 50, effect.position.z]}>
      {/* Central burst */}
      <mesh>
        <sphereGeometry args={[30, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>

      {/* Outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[40, 50, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Directional rays */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <mesh key={i} rotation={[0, (i / 6) * Math.PI * 2, 0]} position={[0, 0, 0]}>
          <boxGeometry args={[5, 10, 60]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// Death Effect Component
// ============================================

interface DeathEffectProps {
  effect: DeathEffect;
  onComplete: (id: string) => void;
}

function DeathParticles({ effect, onComplete }: DeathEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const startTime = useRef(effect.createdAt);
  const duration = 2500; // 2.5 seconds

  // Create scattered particles
  const particleCount = 30;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return pos;
  }, []);

  const velocities = useMemo(() => {
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      vel[i * 3] = (Math.random() - 0.5) * 4;
      vel[i * 3 + 1] = Math.random() * 3 + 1;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return vel;
  }, []);

  useFrame(() => {
    if (!groupRef.current || !particlesRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = elapsed / duration;

    if (progress >= 1) {
      onComplete(effect.id);
      return;
    }

    // Animate particles outward and down (gravity)
    const positionArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      positionArray[i * 3] += velocities[i * 3];
      positionArray[i * 3 + 1] += velocities[i * 3 + 1] - progress * 2; // gravity
      positionArray[i * 3 + 2] += velocities[i * 3 + 2];
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;

    // Fade out
    const material = particlesRef.current.material as THREE.PointsMaterial;
    material.opacity = 1 - progress;
  });

  const color = effect.team === 'radiant' ? '#22c55e' : '#ef4444';

  return (
    <group ref={groupRef} position={[effect.position.x, effect.position.y + 50, effect.position.z]}>
      {/* Death particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={20}
          color={color}
          transparent
          opacity={1}
          sizeAttenuation
        />
      </points>

      {/* Skull marker */}
      <mesh position={[0, 80, 0]}>
        <boxGeometry args={[40, 40, 40]} />
        <meshBasicMaterial color="#4b5563" transparent opacity={0.8} />
      </mesh>

      {/* Cross marker */}
      <mesh position={[0, 80, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[60, 10, 10]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 80, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[60, 10, 10]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

// ============================================
// Hit Effect Component (on-hit flash)
// ============================================

export interface HitEffect {
  id: string;
  position: { x: number; y: number; z: number };
  createdAt: number;
}

interface HitFlashProps {
  effect: HitEffect;
  onComplete: (id: string) => void;
}

function HitFlash({ effect, onComplete }: HitFlashProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(effect.createdAt);
  const duration = 200; // 0.2 seconds - very quick flash

  useFrame(() => {
    if (!meshRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = elapsed / duration;

    if (progress >= 1) {
      onComplete(effect.id);
      return;
    }

    // Quick scale up then down
    const scale = Math.sin(progress * Math.PI) * 2;
    meshRef.current.scale.setScalar(scale);

    // Fade out
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 1 - progress;
  });

  return (
    <mesh
      ref={meshRef}
      position={[effect.position.x, effect.position.y + 50, effect.position.z]}
    >
      <sphereGeometry args={[20, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={1} />
    </mesh>
  );
}

// ============================================
// Main Visual Effects Manager
// ============================================

interface VisualEffectsProps {
  damageNumbers: DamageNumber[];
  levelUpEffects: LevelUpEffect[];
  goldEffects: GoldEffect[];
  abilityEffects: AbilityEffect[];
  deathEffects: DeathEffect[];
  hitEffects: HitEffect[];
  onEffectComplete: (type: string, id: string) => void;
}

export default function VisualEffects({
  damageNumbers,
  levelUpEffects,
  goldEffects,
  abilityEffects,
  deathEffects,
  hitEffects,
  onEffectComplete,
}: VisualEffectsProps) {
  return (
    <>
      {/* Damage Numbers */}
      {damageNumbers.map(effect => (
        <FloatingDamage
          key={effect.id}
          effect={effect}
          onComplete={(id) => onEffectComplete('damage', id)}
        />
      ))}

      {/* Level Up Effects */}
      {levelUpEffects.map(effect => (
        <LevelUpParticles
          key={effect.id}
          effect={effect}
          onComplete={(id) => onEffectComplete('levelUp', id)}
        />
      ))}

      {/* Gold Pickup Effects */}
      {goldEffects.map(effect => (
        <GoldPickup
          key={effect.id}
          effect={effect}
          onComplete={(id) => onEffectComplete('gold', id)}
        />
      ))}

      {/* Ability Effects */}
      {abilityEffects.map(effect => (
        <AbilityParticles
          key={effect.id}
          effect={effect}
          onComplete={(id) => onEffectComplete('ability', id)}
        />
      ))}

      {/* Death Effects */}
      {deathEffects.map(effect => (
        <DeathParticles
          key={effect.id}
          effect={effect}
          onComplete={(id) => onEffectComplete('death', id)}
        />
      ))}

      {/* Hit Flash Effects */}
      {hitEffects.map(effect => (
        <HitFlash
          key={effect.id}
          effect={effect}
          onComplete={(id) => onEffectComplete('hit', id)}
        />
      ))}
    </>
  );
}
