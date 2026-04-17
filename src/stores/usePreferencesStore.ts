import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesStore {
  soundEnabled: boolean;
  toggleSound: () => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      soundEnabled: true,
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    { name: 'cipher_preferences' }
  )
);

// Soft, futuristic blip using WebAudio (no asset needed)
let audioCtx: AudioContext | null = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
}

export function playBlip(kind: 'sent' | 'received' = 'sent') {
  if (!usePreferencesStore.getState().soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  const startFreq = kind === 'sent' ? 880 : 520;
  const endFreq = kind === 'sent' ? 1320 : 740;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}
