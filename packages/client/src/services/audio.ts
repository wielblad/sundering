/**
 * Audio Service
 *
 * Handles all game sounds using Web Audio API.
 * Generates sounds procedurally without external audio files.
 */

// Audio context singleton
let audioContext: AudioContext | null = null;

// Master volume controls
let masterVolume = 0.5;
let sfxVolume = 0.7;
let musicVolume = 0.3;
let isMuted = false;

// Currently playing music
let currentMusic: OscillatorNode | null = null;
let musicGainNode: GainNode | null = null;

/**
 * Initialize audio context (must be called after user interaction)
 */
export function initAudio(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Get audio context
 */
function getContext(): AudioContext | null {
  if (!audioContext) {
    return null;
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Calculate effective volume
 */
function getEffectiveVolume(baseVolume: number): number {
  if (isMuted) return 0;
  return masterVolume * baseVolume;
}

// ============================================
// Volume Controls
// ============================================

export function setMasterVolume(volume: number): void {
  masterVolume = Math.max(0, Math.min(1, volume));
  if (musicGainNode) {
    musicGainNode.gain.value = getEffectiveVolume(musicVolume);
  }
}

export function setSfxVolume(volume: number): void {
  sfxVolume = Math.max(0, Math.min(1, volume));
}

export function setMusicVolume(volume: number): void {
  musicVolume = Math.max(0, Math.min(1, volume));
  if (musicGainNode) {
    musicGainNode.gain.value = getEffectiveVolume(musicVolume);
  }
}

export function setMuted(muted: boolean): void {
  isMuted = muted;
  if (musicGainNode) {
    musicGainNode.gain.value = getEffectiveVolume(musicVolume);
  }
}

export function getMasterVolume(): number {
  return masterVolume;
}

export function getSfxVolume(): number {
  return sfxVolume;
}

export function getMusicVolume(): number {
  return musicVolume;
}

export function getIsMuted(): boolean {
  return isMuted;
}

// ============================================
// Sound Effect Generators
// ============================================

/**
 * Play a basic attack sound (sword swing)
 */
export function playAttackSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.3;

  // Create noise for whoosh effect
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Filtered noise with envelope
    const t = i / bufferSize;
    const envelope = Math.sin(t * Math.PI) * (1 - t);
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Bandpass filter for whoosh
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 1;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start();
}

/**
 * Play a ranged attack sound (arrow/projectile)
 */
export function playRangedAttackSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.25;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

/**
 * Play hit/damage received sound
 */
export function playHitSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.4;

  // Impact noise
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    const envelope = Math.exp(-t * 15);
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1500;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start();
}

/**
 * Play kill sound (enemy defeated)
 */
export function playKillSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.5;

  // Triumphant chord
  const frequencies = [261.63, 329.63, 392.00]; // C major chord

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
    gain.gain.linearRampToValueAtTime(volume / 3, ctx.currentTime + i * 0.05 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + i * 0.05);
    osc.stop(ctx.currentTime + 0.5);
  });
}

/**
 * Play death sound (player died)
 */
export function playDeathSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.5;

  // Descending tone
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

/**
 * Play respawn sound
 */
export function playRespawnSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.4;

  // Ascending arpeggio
  const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume / 4, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.2);
  });
}

/**
 * Play level up sound
 */
export function playLevelUpSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.5;

  // Fanfare
  const notes = [392.00, 493.88, 587.33, 783.99]; // G B D G

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500;

    const gain = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.1;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume / 4, startTime + 0.03);
    gain.gain.setValueAtTime(volume / 4, startTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.4);
  });
}

/**
 * Play gold earned sound
 */
export function playGoldSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.25;

  // Coin clink
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2000, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.05);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

/**
 * Play ability cast sound (generic)
 */
export function playAbilityCastSound(slot: 'Q' | 'W' | 'E' | 'R'): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.4;

  // Different sounds per ability slot
  const baseFreq = slot === 'Q' ? 300 : slot === 'W' ? 400 : slot === 'E' ? 500 : 200;
  const duration = slot === 'R' ? 0.3 : 0.15;

  const osc = ctx.createOscillator();
  osc.type = slot === 'R' ? 'sawtooth' : 'triangle';
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + duration * 0.3);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, ctx.currentTime + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);

  // Add impact for ultimate
  if (slot === 'R') {
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 100;

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(volume * 0.8, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start();
      osc2.stop(ctx.currentTime + 0.2);
    }, 100);
  }
}

/**
 * Play tower attack sound
 */
export function playTowerAttackSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.35;

  // Deep boom
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

/**
 * Play tower destroyed sound
 */
export function playTowerDestroyedSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.6;

  // Explosion
  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    const envelope = Math.exp(-t * 5);
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start();
}

// ============================================
// UI Sounds
// ============================================

/**
 * Play button click sound
 */
export function playClickSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.2;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 800;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

/**
 * Play button hover sound
 */
export function playHoverSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.1;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 600;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.03);
}

/**
 * Play error/invalid action sound
 */
export function playErrorSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.3;

  // Two descending tones
  [400, 300].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.1;
    gain.gain.setValueAtTime(volume / 2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.1);
  });
}

/**
 * Play queue pop / match found sound
 */
export function playMatchFoundSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.6;

  // Alert fanfare
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C (high)

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume / 4, startTime + 0.02);
    gain.gain.setValueAtTime(volume / 4, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
}

/**
 * Play ping sound
 */
export function playPingSound(type: string): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.35;

  // Different frequencies for different ping types
  const freqMap: Record<string, number> = {
    alert: 800,
    danger: 500,
    missing: 600,
    on_my_way: 700,
    attack: 900,
    defend: 400,
  };

  const freq = freqMap[type] || 600;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.setValueAtTime(freq * 1.2, ctx.currentTime + 0.05);
  osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.setValueAtTime(volume * 0.7, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

/**
 * Play item purchase sound
 */
export function playBuyItemSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.3;

  // Cash register ding
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1200;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.15);

  // Second ding
  setTimeout(() => {
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1500;

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(volume * 0.7, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start();
    osc2.stop(ctx.currentTime + 0.1);
  }, 80);
}

/**
 * Play item sell sound
 */
export function playSellItemSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.25;

  // Reverse ding (descending)
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

/**
 * Play victory sound
 */
export function playVictorySound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.5;

  // Triumphant fanfare
  const melody = [
    { freq: 523.25, start: 0, duration: 0.2 },
    { freq: 659.25, start: 0.15, duration: 0.2 },
    { freq: 783.99, start: 0.3, duration: 0.3 },
    { freq: 1046.50, start: 0.5, duration: 0.5 },
  ];

  melody.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const startTime = ctx.currentTime + start;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume / 4, startTime + 0.03);
    gain.gain.setValueAtTime(volume / 4, startTime + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

/**
 * Play defeat sound
 */
export function playDefeatSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.4;

  // Sad descending melody
  const melody = [
    { freq: 392.00, start: 0, duration: 0.3 },
    { freq: 349.23, start: 0.25, duration: 0.3 },
    { freq: 293.66, start: 0.5, duration: 0.4 },
    { freq: 261.63, start: 0.8, duration: 0.5 },
  ];

  melody.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const startTime = ctx.currentTime + start;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume / 4, startTime + 0.05);
    gain.gain.setValueAtTime(volume / 4, startTime + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

// ============================================
// Background Music
// ============================================

/**
 * Play lobby ambient music
 */
export function playLobbyMusic(): void {
  stopMusic();

  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(musicVolume);

  musicGainNode = ctx.createGain();
  musicGainNode.gain.value = volume * 0.3;
  musicGainNode.connect(ctx.destination);

  // Simple ambient pad
  const playChord = () => {
    if (!ctx || !musicGainNode) return;

    const chords = [
      [130.81, 164.81, 196.00], // C
      [146.83, 174.61, 220.00], // D
      [164.81, 196.00, 246.94], // E
      [130.81, 164.81, 196.00], // C
    ];

    let chordIndex = 0;

    const playNextChord = () => {
      if (!musicGainNode) return;

      const chord = chords[chordIndex % chords.length];

      chord.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + 3);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4);

        osc.connect(gain);
        gain.connect(musicGainNode!);

        osc.start();
        osc.stop(ctx.currentTime + 4);
      });

      chordIndex++;
    };

    playNextChord();
    const interval = setInterval(() => {
      if (!musicGainNode) {
        clearInterval(interval);
        return;
      }
      playNextChord();
    }, 4000);
  };

  playChord();
}

/**
 * Play game ambient music
 */
export function playGameMusic(): void {
  stopMusic();

  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(musicVolume);

  musicGainNode = ctx.createGain();
  musicGainNode.gain.value = volume * 0.2;
  musicGainNode.connect(ctx.destination);

  // Rhythmic game music
  const playBeat = () => {
    if (!ctx || !musicGainNode) return;

    let beatCount = 0;

    const playNextBeat = () => {
      if (!musicGainNode) return;

      // Bass drum on 1 and 3
      if (beatCount % 4 === 0 || beatCount % 4 === 2) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(musicGainNode!);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }

      // Hi-hat on every beat
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30);
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const hihatFilter = ctx.createBiquadFilter();
      hihatFilter.type = 'highpass';
      hihatFilter.frequency.value = 8000;

      const hihatGain = ctx.createGain();
      hihatGain.gain.value = 0.1;

      source.connect(hihatFilter);
      hihatFilter.connect(hihatGain);
      hihatGain.connect(musicGainNode!);

      source.start();

      beatCount++;
    };

    playNextBeat();
    const interval = setInterval(() => {
      if (!musicGainNode) {
        clearInterval(interval);
        return;
      }
      playNextBeat();
    }, 500); // 120 BPM
  };

  playBeat();
}

/**
 * Stop all music
 */
export function stopMusic(): void {
  if (currentMusic) {
    try {
      currentMusic.stop();
    } catch (e) {
      // Already stopped
    }
    currentMusic = null;
  }
  musicGainNode = null;
}

// ============================================
// Creep/Monster Sounds
// ============================================

/**
 * Play creep attack sound
 */
export function playCreepAttackSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.15;

  // Small impact
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

/**
 * Play monster attack sound
 */
export function playMonsterAttackSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.25;

  // Growl-like sound
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.setValueAtTime(100, ctx.currentTime + 0.05);
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

/**
 * Play creep death sound
 */
export function playCreepDeathSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.2;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

/**
 * Play monster death sound
 */
export function playMonsterDeathSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const volume = getEffectiveVolume(sfxVolume) * 0.35;

  // Deep growl dying
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}
