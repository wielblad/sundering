/**
 * GameChat Component
 *
 * In-game chat panel with team/all chat toggle,
 * player muting, and message display.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useGameStore, GameChatMessage } from '../../stores/gameStore';
import { useAuthStore } from '../../stores/authStore';

interface MutedPlayers {
  [playerId: string]: boolean;
}

export default function GameChat() {
  const { messages, sendChat, players, myTeam } = useGameStore();
  const { user } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [teamOnly, setTeamOnly] = useState(true);
  const [mutedPlayers, setMutedPlayers] = useState<MutedPlayers>({});
  const [showMuteMenu, setShowMuteMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter messages based on team-only mode and muted players
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      // Don't filter out own messages
      if (msg.senderId === user?.id) return true;

      // Filter muted players
      if (mutedPlayers[msg.senderId]) return false;

      // CRITICAL: Team-only messages should only be visible to the sender's team
      // If message is team-only AND sender is not on my team, hide it
      if (msg.teamOnly && msg.senderTeam !== myTeam) {
        return false;
      }

      return true;
    });
  }, [messages, mutedPlayers, user, myTeam]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, isExpanded]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to open chat (if not already focused on input)
      if (e.key === 'Enter' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsOpen(true);
        setIsExpanded(true);
      }

      // Shift+Enter for all chat
      if (e.key === 'Enter' && e.shiftKey && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
        setIsExpanded(true);
        setTeamOnly(false);
      }

      // Escape to close chat
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setInputValue('');
      }

      // Tab to toggle team/all while typing
      if (e.key === 'Tab' && isOpen) {
        e.preventDefault();
        setTeamOnly(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSend = useCallback(() => {
    if (inputValue.trim()) {
      sendChat(inputValue.trim(), teamOnly);
      setInputValue('');
    }
  }, [inputValue, teamOnly, sendChat]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const toggleMutePlayer = useCallback((playerId: string) => {
    setMutedPlayers(prev => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  }, []);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (msg: GameChatMessage) => {
    // Use senderTeam from message directly instead of looking up player
    const isMyTeam = msg.senderTeam === myTeam;
    const isMe = msg.senderId === user?.id;

    return (
      <div
        key={msg.id}
        className={`text-sm py-0.5 ${isMe ? 'text-yellow-300' : isMyTeam ? 'text-green-300' : 'text-red-300'}`}
      >
        <span className="text-slate-500 text-xs mr-1">[{formatTime(msg.timestamp)}]</span>
        {msg.teamOnly && <span className="text-blue-400 text-xs mr-1">[TEAM]</span>}
        {!msg.teamOnly && <span className="text-mystical-400 text-xs mr-1">[ALL]</span>}
        <span className="font-medium">{msg.senderName}: </span>
        <span className="text-white">{msg.content}</span>
      </div>
    );
  };

  // Get list of other players for mute menu
  const otherPlayers = useMemo(() => {
    return Array.from(players.values()).filter(p => p.userId !== user?.id && !p.isBot);
  }, [players, user]);

  return (
    <div className="fixed bottom-28 left-4 z-40">
      {/* Collapsed chat preview (always visible) */}
      {!isExpanded && (
        <div
          className="w-80 bg-slate-900/60 backdrop-blur rounded-lg p-2 cursor-pointer"
          onClick={() => { setIsOpen(true); setIsExpanded(true); }}
        >
          {/* Show last 3 messages */}
          <div className="max-h-20 overflow-hidden">
            {filteredMessages.slice(-3).map(renderMessage)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Press Enter to chat</p>
        </div>
      )}

      {/* Expanded chat */}
      {isExpanded && (
        <div className="w-96 bg-slate-900/90 backdrop-blur rounded-lg border border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-medium text-sm">Chat</h3>
              <button
                onClick={() => setTeamOnly(true)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  teamOnly ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                Team
              </button>
              <button
                onClick={() => setTeamOnly(false)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  !teamOnly ? 'bg-mystical-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                All
              </button>
            </div>
            <div className="flex items-center gap-1">
              {/* Mute menu button */}
              <div className="relative">
                <button
                  onClick={() => setShowMuteMenu(!showMuteMenu)}
                  className="text-slate-400 hover:text-white p-1 transition-colors"
                  title="Mute players"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Mute dropdown */}
                {showMuteMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded shadow-lg z-10">
                    <div className="p-2 border-b border-slate-700">
                      <p className="text-xs text-slate-400">Mute Players</p>
                    </div>
                    {otherPlayers.length === 0 ? (
                      <p className="p-2 text-xs text-slate-500">No other players</p>
                    ) : (
                      otherPlayers.map(player => (
                        <button
                          key={player.id}
                          onClick={() => toggleMutePlayer(player.userId)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700 flex items-center justify-between"
                        >
                          <span className={`${player.team === myTeam ? 'text-green-400' : 'text-red-400'}`}>
                            {player.displayName || player.username}
                          </span>
                          {mutedPlayers[player.userId] && (
                            <span className="text-red-500 text-xs">MUTED</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Minimize button */}
              <button
                onClick={() => { setIsExpanded(false); setIsOpen(false); setShowMuteMenu(false); }}
                className="text-slate-400 hover:text-white p-1 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="h-48 overflow-y-auto p-2 space-y-0.5">
            {filteredMessages.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No messages yet</p>
            ) : (
              filteredMessages.map(renderMessage)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-slate-700 p-2">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={teamOnly ? 'Team chat... (Tab to switch)' : 'All chat... (Tab to switch)'}
                className={`flex-1 px-3 py-1.5 rounded text-sm bg-slate-800 border focus:outline-none focus:ring-1 ${
                  teamOnly
                    ? 'border-green-600 focus:ring-green-500 text-green-100 placeholder-green-700'
                    : 'border-mystical-600 focus:ring-mystical-500 text-mystical-100 placeholder-mystical-700'
                }`}
                maxLength={200}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  inputValue.trim()
                    ? teamOnly
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-mystical-600 hover:bg-mystical-500 text-white'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                Send
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Enter to send | Tab to toggle team/all | Esc to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
