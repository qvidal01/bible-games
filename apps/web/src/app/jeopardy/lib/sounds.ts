'use client';

// Sound effect URLs (using Web Audio API compatible sounds)
const SOUND_URLS = {
  buzz: '/sounds/buzz.mp3',
  correct: '/sounds/correct.mp3',
  wrong: '/sounds/wrong.mp3',
  select: '/sounds/select.mp3',
  timer: '/sounds/timer.mp3',
  dailyDouble: '/sounds/daily-double.mp3',
  finalJeopardy: '/sounds/final-jeopardy.mp3',
  gameOver: '/sounds/game-over.mp3',
} as const;

type SoundName = keyof typeof SOUND_URLS;

// Audio cache
const audioCache: Partial<Record<SoundName, HTMLAudioElement>> = {};

// Sound settings
let soundEnabled = true;
let volume = 0.7;

// Initialize audio elements
export function initSounds(): void {
  if (typeof window === 'undefined') return;

  Object.entries(SOUND_URLS).forEach(([name, url]) => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = volume;
    audioCache[name as SoundName] = audio;
  });
}

// Play a sound effect
export function playSound(name: SoundName, volumeOverride?: number): void {
  if (typeof window === 'undefined' || !soundEnabled) return;

  const audio = audioCache[name];
  if (audio) {
    audio.currentTime = 0;
    // Use override if provided, otherwise use global volume
    // Buzz sound is always louder (1.0 max)
    const effectiveVolume = volumeOverride !== undefined
      ? volumeOverride
      : (name === 'buzz' ? 1.0 : volume);
    audio.volume = Math.min(1, effectiveVolume);
    audio.play().catch(() => {
      // Ignore autoplay restrictions
    });
  }
}

// Play buzz sound with dramatic effect (multiple times for emphasis)
export function playDramaticBuzz(): void {
  if (typeof window === 'undefined' || !soundEnabled) return;

  // Play main buzz at full volume
  playSound('buzz', 1.0);

  // Vibrate longer for dramatic effect
  vibrate(200);
}

// Toggle sound on/off
export function toggleSound(): boolean {
  soundEnabled = !soundEnabled;
  return soundEnabled;
}

// Set sound enabled state
export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

// Check if sound is enabled
export function isSoundEnabled(): boolean {
  return soundEnabled;
}

// Set volume (0-1)
export function setVolume(newVolume: number): void {
  volume = Math.max(0, Math.min(1, newVolume));
  Object.values(audioCache).forEach((audio) => {
    if (audio) audio.volume = volume;
  });
}

// Get current volume
export function getVolume(): number {
  return volume;
}

// Haptic feedback for mobile
export function vibrate(duration: number = 50): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration);
  }
}

// Combined feedback (sound + haptic)
export function playFeedback(name: SoundName, hapticDuration: number = 50): void {
  playSound(name);
  vibrate(hapticDuration);
}
