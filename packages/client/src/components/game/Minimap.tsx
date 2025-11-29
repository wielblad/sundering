import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useGameStore, PingType } from '../../stores/gameStore';
import { useAuthStore } from '../../stores/authStore';
import { BALANCE, MAIN_MAP, Circle, Rectangle, Region, Obstacle } from '@sundering/shared';

const MAP_SIZE = BALANCE.mapWidth; // 14000
const MINIMAP_SIZE = 200; // pixels
const SCALE = MINIMAP_SIZE / MAP_SIZE;

// Convert world coordinates to minimap coordinates
// Rotated 90° clockwise to match camera view from right side
// World X (left-right) -> Minimap Y (top-bottom, inverted)
// World Z (front-back) -> Minimap X (left-right)
function worldToMinimap(x: number, z: number): { x: number; y: number } {
  // World: -7000 to 7000 -> Minimap: 0 to 200
  const minimapX = (z + MAP_SIZE / 2) * SCALE;
  const minimapY = MINIMAP_SIZE - (x + MAP_SIZE / 2) * SCALE;
  return { x: minimapX, y: minimapY };
}

// Convert minimap coordinates to world coordinates
function minimapToWorld(minimapX: number, minimapY: number): { x: number; z: number } {
  // Inverse of the rotation
  const worldZ = (minimapX / SCALE) - MAP_SIZE / 2;
  const worldX = ((MINIMAP_SIZE - minimapY) / SCALE) - MAP_SIZE / 2;
  return { x: worldX, z: worldZ };
}

// Colors for regions on minimap
const REGION_COLORS: Record<string, string> = {
  radiant_base: 'rgba(34, 197, 94, 0.3)',
  dire_base: 'rgba(239, 68, 68, 0.3)',
  jungle_radiant_top: 'rgba(22, 101, 52, 0.2)',
  jungle_radiant_bot: 'rgba(22, 101, 52, 0.2)',
  jungle_dire_top: 'rgba(127, 29, 29, 0.2)',
  jungle_dire_bot: 'rgba(127, 29, 29, 0.2)',
  river: 'rgba(14, 165, 233, 0.3)',
};

// Colors for obstacles on minimap
const OBSTACLE_COLORS: Record<string, string> = {
  wall: '#4a5568',
  rock: '#718096',
  tree: '#2d6a4f',
  building: '#f59e0b',
  water: '#0ea5e9',
};

// Lane colors for minimap
const LANE_COLORS: Record<string, string> = {
  top: 'rgba(59, 130, 246, 0.5)',
  mid: 'rgba(168, 85, 247, 0.5)',
  bot: 'rgba(249, 115, 22, 0.5)',
};

// Render a region as minimap background
function MinimapRegion({ region }: { region: Region }) {
  const pos = worldToMinimap(region.bounds.x, region.bounds.z);
  const width = region.bounds.width * SCALE;
  const height = region.bounds.height * SCALE;
  const color = REGION_COLORS[region.id] || 'rgba(100, 100, 100, 0.1)';

  return (
    <div
      className="absolute"
      style={{
        left: pos.x,
        top: pos.y,
        width,
        height,
        backgroundColor: color,
      }}
    />
  );
}

// Render an obstacle on minimap
function MinimapObstacle({ obstacle }: { obstacle: Obstacle }) {
  const color = OBSTACLE_COLORS[obstacle.type] || '#666666';

  if (obstacle.shape === 'circle') {
    const circle = obstacle.bounds as Circle;
    const pos = worldToMinimap(circle.x, circle.z);
    const radius = circle.radius * SCALE;

    return (
      <div
        className="absolute rounded-full"
        style={{
          left: pos.x - radius,
          top: pos.y - radius,
          width: radius * 2,
          height: radius * 2,
          backgroundColor: color,
        }}
      />
    );
  } else {
    const rect = obstacle.bounds as Rectangle;
    const pos = worldToMinimap(rect.x, rect.z);
    const width = rect.width * SCALE;
    const height = rect.height * SCALE;

    return (
      <div
        className="absolute"
        style={{
          left: pos.x,
          top: pos.y,
          width,
          height,
          backgroundColor: color,
        }}
      />
    );
  }
}

// Render tower markers on minimap
function MinimapTowers() {
  return (
    <>
      {MAIN_MAP.towers.map((tower) => {
        const pos = worldToMinimap(tower.position.x, tower.position.z);
        const teamColor = tower.team === 'radiant' ? '#22c55e' : '#ef4444';

        return (
          <div
            key={tower.id}
            className="absolute w-1.5 h-1.5 border transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: pos.x,
              top: pos.y,
              borderColor: teamColor,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
            title={`${tower.team} ${tower.lane} T${tower.tier}`}
          />
        );
      })}
    </>
  );
}

// Render lane paths on minimap
function MinimapLanes() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {MAIN_MAP.lanes.map((lane) => {
        const waypoints = lane.waypoints.radiant;
        const color = LANE_COLORS[lane.id] || 'rgba(255, 255, 255, 0.3)';

        if (waypoints.length < 2) return null;

        const pathData = waypoints
          .map((wp, i) => {
            const pos = worldToMinimap(wp.x, wp.z);
            return `${i === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`;
          })
          .join(' ');

        return (
          <path
            key={lane.id}
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth={lane.width * SCALE * 0.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

const PING_ICONS: Record<PingType, { icon: string; color: string }> = {
  alert: { icon: '!', color: 'bg-yellow-500' },
  danger: { icon: '⚠', color: 'bg-red-500' },
  missing: { icon: '?', color: 'bg-mystical-500' },
  on_my_way: { icon: '→', color: 'bg-blue-500' },
  attack: { icon: '⚔', color: 'bg-orange-500' },
  defend: { icon: '🛡', color: 'bg-green-500' },
};

interface MinimapProps {
  onMoveClick?: (worldPos: { x: number; y: number; z: number }) => void; // Right-click: move player
  onCameraClick?: (worldPos: { x: number; y: number; z: number }) => void; // Left-click: move camera
}

export default function Minimap({ onMoveClick, onCameraClick }: MinimapProps) {
  const { players, pings, sendPing, myTeam } = useGameStore();
  const { user } = useAuthStore();
  const [showPingMenu, setShowPingMenu] = useState(false);
  const [pingMenuPosition, setPingMenuPosition] = useState({ x: 0, y: 0 });
  const [pendingPingWorldPos, setPendingPingWorldPos] = useState<{ x: number; y: number; z: number } | null>(null);

  // Drag-to-pan state for camera
  const [isDragging, setIsDragging] = useState(false);
  const minimapRef = useRef<HTMLDivElement>(null);

  const myPlayer = useMemo(() => {
    return Array.from(players.values()).find(p => p.userId === user?.id);
  }, [players, user]);

  // Filter pings to only show my team's pings
  const visiblePings = useMemo(() => {
    return pings.filter(ping => ping.team === myTeam);
  }, [pings, myTeam]);

  // Helper to get world position from mouse event
  const getWorldPosFromEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!minimapRef.current) return null;
    const rect = minimapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(MINIMAP_SIZE, e.clientX - rect.left));
    const y = Math.max(0, Math.min(MINIMAP_SIZE, e.clientY - rect.top));
    return minimapToWorld(x, y);
  }, []);

  // LEFT-CLICK DOWN: Start dragging camera
  const handleLeftMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only left mouse button (button === 0)
    if (e.button !== 0) return;

    if (e.altKey || e.ctrlKey || e.shiftKey) {
      // Modifier + left-click opens ping menu
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = minimapToWorld(x, y);
      setPingMenuPosition({ x, y });
      setPendingPingWorldPos({ x: worldPos.x, y: 0, z: worldPos.z });
      setShowPingMenu(true);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Start dragging - move camera immediately
    setIsDragging(true);
    const worldPos = getWorldPosFromEvent(e);
    if (worldPos && onCameraClick) {
      onCameraClick({ x: worldPos.x, y: 0, z: worldPos.z });
    }
  }, [onCameraClick, getWorldPosFromEvent]);

  // RIGHT-CLICK: Move player to location
  const handleRightClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only right mouse button (button === 2)
    if (e.button !== 2) return;
    e.preventDefault();

    // Right-click = move PLAYER
    const worldPos = getWorldPosFromEvent(e);
    if (worldPos && onMoveClick) {
      onMoveClick({ x: worldPos.x, y: 0, z: worldPos.z });
    }
  }, [onMoveClick, getWorldPosFromEvent]);

  // Handle mouse move while dragging camera (globally)
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const worldPos = getWorldPosFromEvent(e);
      if (worldPos && onCameraClick) {
        onCameraClick({ x: worldPos.x, y: 0, z: worldPos.z });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        setIsDragging(false);
      }
    };

    // Listen globally so dragging works even if mouse leaves minimap
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onCameraClick, getWorldPosFromEvent]);

  // Prevent context menu on minimap
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handlePingSelect = useCallback((type: PingType) => {
    if (pendingPingWorldPos) {
      sendPing(type, pendingPingWorldPos);
    }
    setShowPingMenu(false);
    setPendingPingWorldPos(null);
  }, [pendingPingWorldPos, sendPing]);

  // Close menu when clicking outside
  const pingMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking inside the ping menu
      if (pingMenuRef.current && pingMenuRef.current.contains(e.target as Node)) {
        return;
      }
      setShowPingMenu(false);
    };
    if (showPingMenu) {
      // Use setTimeout to avoid immediate closing from the same click that opened the menu
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showPingMenu]);

  // Keyboard shortcut for quick ping (G key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'g' && myPlayer) {
        // Quick ping at player's current position
        sendPing('alert', {
          x: myPlayer.position.x,
          y: 0,
          z: myPlayer.position.z,
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [myPlayer, sendPing]);

  const playerMarkers = useMemo(() => {
    return Array.from(players.values())
      // Filter by visibility - only show enemies if they are visible to my team
      .filter(player => {
        // Always show my team's players
        if (player.team === myTeam) return true;
        // Show enemy players only if visible to my team
        return myTeam === 'radiant' ? player.visibleToRadiant : player.visibleToDire;
      })
      .map(player => {
        const pos = worldToMinimap(player.position.x, player.position.z);
        const isMe = player.userId === user?.id;
        const isAlly = player.team === myPlayer?.team;

        // Determine color based on team and if it's me
        let bgColor = 'bg-red-500'; // Enemy
        if (isMe) {
          bgColor = 'bg-yellow-400';
        } else if (isAlly) {
          bgColor = player.team === 'radiant' ? 'bg-green-500' : 'bg-red-500';
        } else {
          bgColor = player.team === 'radiant' ? 'bg-green-500' : 'bg-red-500';
        }

        // Different color if dead
        if (!player.isAlive) {
          bgColor = 'bg-gray-500';
        }

        return {
          id: player.id,
          x: pos.x,
          y: pos.y,
          bgColor,
          isMe,
          isAlive: player.isAlive,
        };
      });
  }, [players, user, myPlayer, myTeam]);

  const pingMarkers = useMemo(() => {
    const now = Date.now();
    return visiblePings
      .filter(ping => ping.expiresAt > now)
      .map(ping => {
        const pos = worldToMinimap(ping.position.x, ping.position.z);
        const pingInfo = PING_ICONS[ping.type as PingType] || PING_ICONS.alert;
        const timeLeft = ping.expiresAt - now;
        const opacity = Math.min(1, timeLeft / 1000); // Fade out in last second

        return {
          id: ping.id,
          x: pos.x,
          y: pos.y,
          icon: pingInfo.icon,
          color: pingInfo.color,
          opacity,
          senderName: ping.senderName,
        };
      });
  }, [visiblePings]);

  return (
    <div
      ref={minimapRef}
      className={`relative bg-slate-900/90 border-2 border-slate-600 rounded cursor-pointer select-none ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
      onMouseDown={(e) => {
        handleLeftMouseDown(e);
        handleRightClick(e);
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Map background with terrain representation */}
      <div className="absolute inset-0 overflow-hidden rounded">
        {/* Base terrain */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-700" />

        {/* Regions from map config */}
        {MAIN_MAP.regions.map((region) => (
          <MinimapRegion key={region.id} region={region} />
        ))}

        {/* Lane paths */}
        <MinimapLanes />

        {/* Obstacles from map config */}
        {MAIN_MAP.obstacles.map((obstacle) => (
          <MinimapObstacle key={obstacle.id} obstacle={obstacle} />
        ))}

        {/* Tower markers */}
        <MinimapTowers />

        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          {/* Vertical lines */}
          {[0.25, 0.5, 0.75].map(ratio => (
            <line
              key={`v-${ratio}`}
              x1={`${ratio * 100}%`}
              y1="0"
              x2={`${ratio * 100}%`}
              y2="100%"
              stroke="white"
              strokeWidth="1"
            />
          ))}
          {/* Horizontal lines */}
          {[0.25, 0.5, 0.75].map(ratio => (
            <line
              key={`h-${ratio}`}
              x1="0"
              y1={`${ratio * 100}%`}
              x2="100%"
              y2={`${ratio * 100}%`}
              stroke="white"
              strokeWidth="1"
            />
          ))}
          {/* Center cross */}
          <line x1="48%" y1="50%" x2="52%" y2="50%" stroke="white" strokeWidth="2" />
          <line x1="50%" y1="48%" x2="50%" y2="52%" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      {/* Player markers */}
      {playerMarkers.map(marker => (
        <div
          key={marker.id}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100
            ${marker.bgColor}
            ${marker.isMe ? 'w-3 h-3 ring-2 ring-white z-20' : 'w-2 h-2 z-10'}
            ${marker.isAlive ? '' : 'opacity-50'}
            rounded-full
          `}
          style={{
            left: marker.x,
            top: marker.y,
          }}
        />
      ))}

      {/* Ping markers */}
      {pingMarkers.map(ping => (
        <div
          key={ping.id}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-30
            ${ping.color} w-5 h-5 rounded-full flex items-center justify-center
            text-white text-xs font-bold animate-ping-pulse
          `}
          style={{
            left: ping.x,
            top: ping.y,
            opacity: ping.opacity,
          }}
          title={ping.senderName}
        >
          {ping.icon}
        </div>
      ))}

      {/* Ping menu */}
      {showPingMenu && (
        <div
          ref={pingMenuRef}
          className="absolute z-50 bg-slate-800 rounded-lg shadow-lg border border-slate-600 p-1"
          style={{
            left: Math.min(pingMenuPosition.x, MINIMAP_SIZE - 100),
            top: Math.min(pingMenuPosition.y, MINIMAP_SIZE - 80),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-3 gap-1">
            {(Object.entries(PING_ICONS) as [PingType, { icon: string; color: string }][]).map(([type, { icon, color }]) => (
              <button
                key={type}
                onClick={() => handlePingSelect(type)}
                className={`${color} w-6 h-6 rounded flex items-center justify-center text-white text-xs hover:opacity-80 transition-opacity`}
                title={type.replace('_', ' ')}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Team labels - Radiant at (-X,-Z) = top-left on minimap, Dire at (+X,+Z) = bottom-right */}
      <div className="absolute top-0.5 left-0.5 text-[8px] text-green-400 font-bold">R</div>
      <div className="absolute bottom-0.5 right-0.5 text-[8px] text-red-400 font-bold">D</div>

      {/* Hint */}
      <div className="absolute -bottom-5 left-0 right-0 text-center text-[8px] text-slate-500">
        LMB drag: camera | RMB: move | Shift+LMB: ping
      </div>
    </div>
  );
}
