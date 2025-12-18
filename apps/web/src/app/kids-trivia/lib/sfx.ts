'use client';

type SfxName = 'tap' | 'correct' | 'wrong' | 'reveal' | 'countdown' | 'timeup';

let audioContext: AudioContext | null = null;
let enabled = true;
let volume = 0.35;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AnyAudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AnyAudioContext) return null;
    audioContext = new AnyAudioContext();
  }
  return audioContext;
}

function playTone(params: {
  type?: OscillatorType;
  freq: number;
  durationMs: number;
  gain: number;
  detune?: number;
}) {
  const ctx = getContext();
  if (!ctx || !enabled) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = params.type ?? 'sine';
  osc.frequency.value = params.freq;
  osc.detune.value = params.detune ?? 0;

  const start = ctx.currentTime;
  const duration = params.durationMs / 1000;

  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, params.gain * volume), start + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function setKidsTriviaSfxEnabled(nextEnabled: boolean) {
  enabled = nextEnabled;
}

export function isKidsTriviaSfxEnabled(): boolean {
  return enabled;
}

export function setKidsTriviaSfxVolume(nextVolume: number) {
  volume = Math.max(0, Math.min(1, nextVolume));
}

export function unlockKidsTriviaAudio() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function playKidsTriviaSfx(name: SfxName) {
  switch (name) {
    case 'tap':
      playTone({ type: 'triangle', freq: 660, durationMs: 55, gain: 0.35 });
      break;
    case 'correct':
      playTone({ type: 'sine', freq: 784, durationMs: 80, gain: 0.5 });
      playTone({ type: 'sine', freq: 988, durationMs: 120, gain: 0.55, detune: 8 });
      break;
    case 'wrong':
      playTone({ type: 'sawtooth', freq: 190, durationMs: 120, gain: 0.28 });
      playTone({ type: 'sawtooth', freq: 150, durationMs: 160, gain: 0.22 });
      break;
    case 'reveal':
      playTone({ type: 'triangle', freq: 523, durationMs: 90, gain: 0.35 });
      playTone({ type: 'triangle', freq: 659, durationMs: 140, gain: 0.3 });
      break;
    case 'countdown':
      playTone({ type: 'square', freq: 880, durationMs: 35, gain: 0.15 });
      break;
    case 'timeup':
      playTone({ type: 'square', freq: 330, durationMs: 220, gain: 0.25 });
      break;
  }
}

