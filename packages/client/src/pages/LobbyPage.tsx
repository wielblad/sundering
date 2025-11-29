import { useEffect, useRef, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { ProfilePreview, RecentMatches, QueueStatus } from '../components/lobby';
import { useAuthStore } from '../stores/authStore';
import { useLobbyStore } from '../stores/lobbyStore';
import { useGameStore } from '../stores/gameStore';
import { authApi, ActiveGameResponse } from '../services/api';

// =============================================================================
// COLLAPSIBLE CHAT COMPONENT
// =============================================================================

interface LobbyChatProps {
  isConnected: boolean;
  messages: Array<{
    id: string;
    content: string;
    senderName?: string;
    timestamp: number;
    isSystem?: boolean;
  }>;
  onlineCount: number;
  onSendMessage: (message: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function LobbyChat({
  isConnected,
  messages,
  onlineCount,
  onSendMessage,
  isCollapsed,
  onToggleCollapse,
}: LobbyChatProps) {
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  // Collapsed state - just show toggle button
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="
          fixed right-4 bottom-4 z-40
          w-14 h-14 rounded-full
          bg-gradient-to-br from-mystical-600 to-mystical-700
          border border-mystical-500/50
          shadow-lg shadow-mystical-500/20
          flex items-center justify-center
          hover:scale-105 transition-transform duration-200
          group
        "
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {/* Online indicator */}
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 text-[10px] font-bold text-white flex items-center justify-center">
          {onlineCount}
        </span>
        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-2 py-1 rounded bg-game-dark text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Open Chat
        </span>
      </button>
    );
  }

  return (
    <div className="card-game flex flex-col h-[600px] relative">
      {/* Header */}
      <div className="p-4 border-b border-game-border flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-white">Lobby Chat</h2>
          <p className="text-xs text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse" />
            {onlineCount} players online
          </p>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-game-dark transition-colors text-gray-500 hover:text-white"
          title="Minimize chat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-8">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={msg.isSystem ? 'text-center' : ''}>
              {msg.isSystem ? (
                <span className="text-xs text-gray-600 italic">{msg.content}</span>
              ) : (
                <div className="group">
                  <div className="flex items-baseline gap-2">
                    <span className="text-mystical-400 font-medium text-sm hover:text-mystical-300 cursor-pointer">
                      {msg.senderName}
                    </span>
                    <span className="text-gray-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mt-0.5">{msg.content}</p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-game-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="
              flex-1 px-4 py-2 rounded-lg
              bg-game-dark border border-game-border
              text-white placeholder-gray-600
              focus:outline-none focus:border-mystical-500
              text-sm transition-colors
            "
            disabled={!isConnected}
          />
          <Button type="submit" size="sm" disabled={!isConnected || !chatInput.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

// =============================================================================
// PLAY CARD COMPONENT
// =============================================================================

interface PlayCardProps {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  inQueue: boolean;
  onPlayClick: () => void;
}

function PlayCard({ isConnected, isConnecting, error, inQueue, onPlayClick }: PlayCardProps) {
  if (!isConnected) {
    return (
      <div className="card-game p-8 text-center">
        {isConnecting ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-mystical-500/20 blur-xl animate-pulse" />
              <div className="relative w-16 h-16 border-4 border-mystical-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-gray-400">Connecting to lobby...</span>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-red-400">{error}</div>
          </div>
        ) : (
          <div className="text-gray-500">Disconnected from lobby</div>
        )}
      </div>
    );
  }

  if (inQueue) {
    return null; // Queue status is shown separately
  }

  return (
    <div className="card-game p-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-mystical-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-human-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center">
        <h2 className="text-2xl font-display font-bold mb-4">
          <span className="text-gradient-mystical">Ready to</span>{' '}
          <span className="text-gradient-human">Battle?</span>
        </h2>

        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Join the matchmaking queue and test your skills against worthy opponents.
          Glory awaits those who dare to fight.
        </p>

        {/* Play Button with enhanced styling */}
        <button
          onClick={onPlayClick}
          className="
            relative group
            px-12 py-5 rounded-xl
            bg-gradient-to-r from-mystical-600 via-mystical-500 to-mystical-500
            text-white text-xl font-display font-bold
            shadow-lg shadow-mystical-500/30
            hover:shadow-xl hover:shadow-mystical-500/50
            hover:scale-105
            active:scale-95
            transition-all duration-300
          "
        >
          {/* Button glow */}
          <div className="absolute inset-0 rounded-xl bg-mystical-500/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Button content */}
          <span className="relative flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Play Now
          </span>
        </button>

        {/* Faction symbols */}
        <div className="flex justify-center items-center gap-8 mt-8">
          <div className="text-center opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-mystical-500/20 flex items-center justify-center">
              <span className="text-mystical-400 text-xl">M</span>
            </div>
            <span className="text-xs text-gray-500">Mystic Forces</span>
          </div>
          <div className="text-2xl text-gray-600">vs</div>
          <div className="text-center opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-human-500/20 flex items-center justify-center">
              <span className="text-human-400 text-xl">H</span>
            </div>
            <span className="text-xs text-gray-500">Human Alliance</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN LOBBY PAGE
// =============================================================================

export default function LobbyPage() {
  const navigate = useNavigate();
  const { user, token, profile, fetchProfile, logout } = useAuthStore();
  const {
    isConnected,
    isConnecting,
    error,
    messages,
    onlineCount,
    queueCount,
    inQueue,
    queueStatus,
    matchFound,
    connect,
    disconnect,
    sendMessage,
    joinQueue,
    leaveQueue,
    clearMatchFound,
  } = useLobbyStore();
  const { setMatchFound } = useGameStore();

  const [activeGame, setActiveGame] = useState<ActiveGameResponse | null>(null);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [checkingActiveGame, setCheckingActiveGame] = useState(true);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate('/auth');
    }
  }, [token, navigate]);

  // Check for active game on mount
  useEffect(() => {
    const checkActiveGame = async () => {
      if (!token) return;

      try {
        const response = await authApi.getActiveGame();
        if (response.data?.hasActiveGame && response.data.canReconnect) {
          setActiveGame(response.data);
          setShowReconnectModal(true);
        }
      } catch (err) {
        console.error('Failed to check active game:', err);
      } finally {
        setCheckingActiveGame(false);
      }
    };

    checkActiveGame();
  }, [token]);

  // Connect to lobby on mount
  useEffect(() => {
    if (token && !isConnected && !isConnecting && !checkingActiveGame) {
      connect(token);
      fetchProfile();
    }

    return () => {
      // Cleanup on unmount
    };
  }, [token, isConnected, isConnecting, connect, fetchProfile, checkingActiveGame]);

  // Navigate to game when match is found
  useEffect(() => {
    if (matchFound) {
      clearMatchFound();
      navigate('/game');
    }
  }, [matchFound, clearMatchFound, navigate]);

  const handleLogout = async () => {
    await disconnect();
    await logout();
    navigate('/');
  };

  const handleQueueToggle = () => {
    if (inQueue) {
      leaveQueue();
    } else {
      joinQueue(['any']);
    }
  };

  const handleReconnect = () => {
    if (activeGame?.matchId && activeGame?.roomId && activeGame?.team) {
      setMatchFound({
        matchId: activeGame.matchId,
        roomId: activeGame.roomId,
        team: activeGame.team,
      });
      setShowReconnectModal(false);
      navigate('/game');
    }
  };

  const handleDeclineReconnect = () => {
    setShowReconnectModal(false);
    setActiveGame(null);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-game-darker flex flex-col">
      {/* Header */}
      <header className="bg-game-dark/80 backdrop-blur-md border-b border-game-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-display font-bold">
              <span className="text-gradient-mystical">PUN</span>
              <span className="text-gradient-human">CH</span>
            </h1>

            {/* Connection Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-gray-400">
                  <span className="text-white font-medium">{onlineCount}</span> online
                </span>
              </div>
              <div className="text-gray-400">
                <span className="text-mystical-400 font-medium">{queueCount}</span> in queue
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-white font-medium">{profile?.display_name || user.username}</div>
              <div className="text-xs text-gray-500">
                {profile?.stats?.mmr || 1000} MMR
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-mystical-500/20 border border-mystical-500/30 flex items-center justify-center">
              <span className="text-mystical-400 font-bold">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-6">
        <div
          className={`
            grid gap-6 transition-all duration-300
            ${chatCollapsed
              ? 'grid-cols-1 lg:grid-cols-[280px_1fr]'
              : 'grid-cols-1 lg:grid-cols-[280px_1fr_320px]'
            }
          `}
        >
          {/* Left Sidebar - Profile Preview */}
          <aside className="space-y-6">
            <ProfilePreview
              displayName={profile?.display_name || user.username}
              stats={profile?.stats}
            />
          </aside>

          {/* Center - Main Content */}
          <div className="space-y-6">
            {/* Queue Status or Play Card */}
            {inQueue ? (
              <QueueStatus
                isInQueue={inQueue}
                queueStatus={queueStatus ?? undefined}
                queueCount={queueCount}
                onLeaveQueue={leaveQueue}
              />
            ) : (
              <PlayCard
                isConnected={isConnected}
                isConnecting={isConnecting}
                error={error}
                inQueue={inQueue}
                onPlayClick={handleQueueToggle}
              />
            )}

            {/* Recent Matches */}
            <RecentMatches />
          </div>

          {/* Right Sidebar - Chat */}
          {!chatCollapsed && (
            <aside>
              <LobbyChat
                isConnected={isConnected}
                messages={messages}
                onlineCount={onlineCount}
                onSendMessage={sendMessage}
                isCollapsed={chatCollapsed}
                onToggleCollapse={() => setChatCollapsed(true)}
              />
            </aside>
          )}
        </div>
      </main>

      {/* Collapsed Chat Button */}
      {chatCollapsed && (
        <LobbyChat
          isConnected={isConnected}
          messages={messages}
          onlineCount={onlineCount}
          onSendMessage={sendMessage}
          isCollapsed={chatCollapsed}
          onToggleCollapse={() => setChatCollapsed(false)}
        />
      )}

      {/* Reconnect Modal */}
      {showReconnectModal && activeGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-game-dark border border-game-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-mystical-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-mystical-500/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-mystical-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Active Game Found</h2>
              <p className="text-gray-400">
                You have an active game in progress. Would you like to reconnect?
              </p>
            </div>

            <div className="bg-game-darker rounded-lg p-4 mb-6 border border-game-border">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Team:</span>
                <span
                  className={
                    activeGame.team === 'radiant'
                      ? 'text-green-400 font-medium'
                      : 'text-red-400 font-medium'
                  }
                >
                  {activeGame.team === 'radiant' ? 'Radiant' : 'Dire'}
                </span>
              </div>
              {activeGame.disconnectedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Disconnected:</span>
                  <span className="text-human-400 font-medium">
                    {Math.floor((Date.now() - activeGame.disconnectedAt) / 1000)}s ago
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleDeclineReconnect}>
                Decline
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleReconnect}>
                Reconnect
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Note: Declining will count as an abandonment
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
