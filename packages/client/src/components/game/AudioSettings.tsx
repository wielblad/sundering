import { useState, useCallback } from 'react';
import {
  getMasterVolume,
  getSfxVolume,
  getMusicVolume,
  getIsMuted,
  setMasterVolume,
  setSfxVolume,
  setMusicVolume,
  setMuted,
  playClickSound,
} from '../../services/audio';

interface AudioSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AudioSettings({ isOpen, onClose }: AudioSettingsProps) {
  const [masterVol, setMasterVol] = useState(getMasterVolume() * 100);
  const [sfxVol, setSfxVol] = useState(getSfxVolume() * 100);
  const [musicVol, setMusicVol] = useState(getMusicVolume() * 100);
  const [muted, setMutedState] = useState(getIsMuted());

  const handleMasterChange = useCallback((value: number) => {
    setMasterVol(value);
    setMasterVolume(value / 100);
  }, []);

  const handleSfxChange = useCallback((value: number) => {
    setSfxVol(value);
    setSfxVolume(value / 100);
  }, []);

  const handleMusicChange = useCallback((value: number) => {
    setMusicVol(value);
    setMusicVolume(value / 100);
  }, []);

  const handleMuteToggle = useCallback(() => {
    const newMuted = !muted;
    setMutedState(newMuted);
    setMuted(newMuted);
  }, [muted]);

  const handleTestSound = useCallback(() => {
    playClickSound();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-lg border border-slate-700 w-[400px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Audio Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl"
          >
            X
          </button>
        </div>

        {/* Mute Toggle */}
        <div className="mb-6">
          <button
            onClick={handleMuteToggle}
            className={`w-full py-3 rounded-lg font-bold transition-colors ${
              muted
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {muted ? 'UNMUTE ALL' : 'MUTE ALL'}
          </button>
        </div>

        {/* Master Volume */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">Master Volume</span>
            <span className="text-human-400">{Math.round(masterVol)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVol}
            onChange={(e) => handleMasterChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-human-500"
          />
        </div>

        {/* SFX Volume */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">Sound Effects</span>
            <span className="text-human-400">{Math.round(sfxVol)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sfxVol}
            onChange={(e) => handleSfxChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Music Volume */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">Music</span>
            <span className="text-human-400">{Math.round(musicVol)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={musicVol}
            onChange={(e) => handleMusicChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-mystical-500"
          />
        </div>

        {/* Test Sound */}
        <button
          onClick={handleTestSound}
          className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Test Sound
        </button>
      </div>
    </div>
  );
}
