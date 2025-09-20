import { useCallback, useEffect, useRef } from 'react';

type SoundType = 'compare' | 'swap' | 'complete';

interface UseSortingAudioOptions {
  enabled: boolean;
}

export const useSortingAudio = ({ enabled }: UseSortingAudioOptions) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled) {
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
      return;
    }

    if (!audioContextRef.current) {
      try {
        const ContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = ContextCtor ? new ContextCtor() : null;
      } catch (error) {
        console.warn('Audio context not supported', error);
        audioContextRef.current = null;
      }
    }

    return () => {
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
    };
  }, [enabled]);

  const playSound = useCallback(
    (frequency: number = 440, duration: number = 120, type: SoundType = 'compare') => {
      if (!enabled) return;
      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const now = audioContext.currentTime;
        switch (type) {
          case 'swap':
            oscillator.type = 'square';
            break;
          case 'complete':
            oscillator.frequency.value = 880;
            oscillator.type = 'triangle';
            duration = 300;
            break;
          case 'compare':
          default:
            oscillator.type = 'sine';
            break;
        }

        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);

        oscillator.start(now);
        oscillator.stop(now + duration / 1000);
      } catch (error) {
        console.warn('Audio playback failed', error);
      }
    },
    [enabled]
  );

  return { playSound };
};
