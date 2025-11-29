import { useEffect, useState, useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface QueueStatusData {
  queueSize: number;
  timeInQueue: number;
  estimatedWaitTime: number;
}

interface QueueStatusProps {
  isInQueue: boolean;
  queueStatus?: QueueStatusData;
  queueCount: number;
  onLeaveQueue: () => void;
  matchForming?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Floating particle effects that create an ambient mystical atmosphere
 */
function FloatingParticles({ intensity = 1 }: { intensity?: number }) {
  const particles = useMemo(() => {
    const count = Math.floor(20 * intensity);
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, [intensity]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-mystical-400"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Animated circular progress ring with pulsing effect
 */
function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 4,
  intensity = 1,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  intensity?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow that intensifies with queue time */}
      <div
        className="absolute inset-0 rounded-full blur-xl transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle, rgba(79, 70, 229, ${0.2 + intensity * 0.3}) 0%, transparent 70%)`,
          transform: `scale(${1 + intensity * 0.2})`,
        }}
      />

      {/* Pulsing ring animation */}
      <div
        className="absolute inset-0 rounded-full animate-ping"
        style={{
          border: `2px solid rgba(79, 70, 229, ${0.1 + intensity * 0.1})`,
          animationDuration: `${2 - intensity * 0.5}s`,
        }}
      />

      {/* SVG Ring */}
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(79, 70, 229, 0.1)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
          style={{
            filter: `drop-shadow(0 0 ${6 + intensity * 4}px rgba(79, 70, 229, ${0.5 + intensity * 0.3}))`,
          }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-display font-bold text-white">
            {Math.floor(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Typing animation for the search message
 */
function TypingText({ text, speed = 50 }: { text: string; speed?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    setDisplayText('');

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, speed);

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, [text, speed]);

  return (
    <span className="font-mono">
      {displayText}
      <span
        className={`
          inline-block w-0.5 h-5 ml-0.5 bg-mystical-400
          ${showCursor ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </span>
  );
}

/**
 * Match forming dramatic reveal animation
 */
function MatchFormingAnimation() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const phases = [0, 1, 2, 3];
    let currentPhase = 0;

    const interval = setInterval(() => {
      currentPhase = (currentPhase + 1) % phases.length;
      setPhase(currentPhase);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Dramatic background pulse */}
      <div
        className="
          absolute inset-0 rounded-2xl
          bg-gradient-to-r from-green-500/20 via-emerald-500/30 to-green-500/20
          animate-pulse
        "
        style={{ animationDuration: '0.5s' }}
      />

      {/* Central burst effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`
            w-32 h-32 rounded-full bg-green-500/30
            transition-all duration-300
            ${phase % 2 === 0 ? 'scale-100 opacity-100' : 'scale-150 opacity-0'}
          `}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-green-400 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-display font-bold text-green-400 mb-2">
          Match Found!
        </h3>
        <p className="text-gray-400">Preparing your battlefield...</p>

        {/* Loading dots */}
        <div className="flex justify-center gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`
                w-2 h-2 rounded-full bg-green-400
                transition-all duration-300
                ${phase === i + 1 ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Countdown timer display
 */
function EstimatedCountdown({ seconds }: { seconds: number }) {
  const [displaySeconds, setDisplaySeconds] = useState(seconds);

  useEffect(() => {
    setDisplaySeconds(seconds);
    const interval = setInterval(() => {
      setDisplaySeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        <span className="w-6 text-center bg-game-dark/50 rounded px-1 py-0.5 text-lg font-mono font-bold text-white">
          {Math.floor(mins / 10)}
        </span>
        <span className="w-6 text-center bg-game-dark/50 rounded px-1 py-0.5 text-lg font-mono font-bold text-white">
          {mins % 10}
        </span>
      </div>
      <span className="text-mystical-400 font-bold animate-pulse">:</span>
      <div className="flex">
        <span className="w-6 text-center bg-game-dark/50 rounded px-1 py-0.5 text-lg font-mono font-bold text-white">
          {Math.floor(secs / 10)}
        </span>
        <span className="w-6 text-center bg-game-dark/50 rounded px-1 py-0.5 text-lg font-mono font-bold text-white">
          {secs % 10}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function QueueStatus({
  isInQueue,
  queueStatus,
  queueCount,
  onLeaveQueue,
  matchForming = false,
}: QueueStatusProps) {
  // Calculate intensity based on time in queue (increases glow as wait increases)
  const intensity = useMemo(() => {
    if (!queueStatus) return 0;
    // Max intensity at 5 minutes
    return Math.min(1, queueStatus.timeInQueue / 300);
  }, [queueStatus]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (!queueStatus || queueStatus.estimatedWaitTime === 0) return 50;
    return Math.min(99, (queueStatus.timeInQueue / queueStatus.estimatedWaitTime) * 100);
  }, [queueStatus]);

  // Search messages that rotate
  const searchMessages = [
    'Searching for worthy opponents...',
    'Scanning the battlefields...',
    'Matching skill levels...',
    'Finding your destiny...',
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isInQueue) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % searchMessages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isInQueue, searchMessages.length]);

  if (!isInQueue) return null;

  if (matchForming) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-green-500/30">
        <MatchFormingAnimation />
      </div>
    );
  }

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden
        bg-gradient-to-br from-mystical-950/50 via-mystical-950/30 to-indigo-950/50
        border border-mystical-500/30
        transition-all duration-500
      `}
      style={{
        boxShadow: `
          0 0 ${20 + intensity * 30}px rgba(79, 70, 229, ${0.1 + intensity * 0.2}),
          inset 0 0 ${30 + intensity * 20}px rgba(79, 70, 229, ${0.05 + intensity * 0.1})
        `,
      }}
    >
      {/* Floating particles */}
      <FloatingParticles intensity={intensity} />

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-display text-mystical-300 mb-2">
            <TypingText text={searchMessages[messageIndex]} speed={30} />
          </h3>
        </div>

        {/* Progress Ring */}
        <div className="flex justify-center mb-6">
          <ProgressRing progress={progress} size={140} strokeWidth={6} intensity={intensity} />
        </div>

        {/* Queue Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Players in Queue */}
          <div className="text-center p-3 rounded-lg bg-game-dark/30 border border-mystical-500/20">
            <div className="text-2xl font-bold text-white mb-1">
              {queueStatus?.queueSize ?? queueCount}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">In Queue</div>
          </div>

          {/* Time in Queue */}
          <div className="text-center p-3 rounded-lg bg-game-dark/30 border border-mystical-500/20">
            <div className="text-2xl font-bold text-mystical-400 mb-1">
              {queueStatus ? formatTime(queueStatus.timeInQueue) : '0:00'}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Time</div>
          </div>

          {/* Estimated Wait */}
          <div className="text-center p-3 rounded-lg bg-game-dark/30 border border-mystical-500/20">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Est. Wait</div>
            {queueStatus ? (
              <EstimatedCountdown seconds={Math.max(0, queueStatus.estimatedWaitTime - queueStatus.timeInQueue)} />
            ) : (
              <span className="text-2xl font-bold text-gray-400">...</span>
            )}
          </div>
        </div>

        {/* Activity indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 h-4 rounded-full bg-mystical-500"
                style={{
                  animation: `pulse 1s ease-in-out ${i * 0.1}s infinite`,
                  opacity: 0.3 + (i * 0.15),
                }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-400 ml-2">
            Searching across all regions...
          </span>
        </div>

        {/* Cancel Button */}
        <div className="flex justify-center">
          <button
            onClick={onLeaveQueue}
            className="
              px-8 py-3 rounded-lg
              bg-transparent border-2 border-red-500/50
              text-red-400 font-semibold
              hover:bg-red-500/10 hover:border-red-500/70
              transition-all duration-300
              active:scale-95
            "
          >
            Cancel Search
          </button>
        </div>
      </div>

      {/* Bottom glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-mystical-500 to-transparent"
        style={{
          opacity: 0.5 + intensity * 0.5,
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />
    </div>
  );
}

export default QueueStatus;
