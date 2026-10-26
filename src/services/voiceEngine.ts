import { VetoVoiceName } from '../types/veto';

// Procedural Web Audio API chimes so there are zero external MP3/WAV dependencies
export function playTacticalChime(type: 'wake' | 'confirm' | 'alert' | 'complete') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'wake') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'confirm') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.12);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(185, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.24);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {
    // Ignore audio context restriction before user gesture
  }
}

export const VETO_VOICE_LINES = [
  {
    id: 'vl-1',
    label: 'On y croit! What madness today?',
    quote: 'On y croit! What madness are we getting into today?',
    context: 'Session Greeting',
  },
  {
    id: 'vl-2',
    label: 'Rule #1: Hit your shots',
    quote: 'Rule number one: hit your shots. Every step verified, zero wasted motion.',
    context: 'Task Precision',
  },
  {
    id: 'vl-3',
    label: 'I know my limits',
    quote: 'I know my limits, and I respect your permission boundaries. Give the word and it is done.',
    context: 'Security Gate',
  },
  {
    id: 'vl-4',
    label: 'Hinglish Tactical Ready',
    quote: 'Bolo boss, aaj kaunsa workflow automate karna hai? Emails, WhatsApp, ya files—sab control mein hai.',
    context: 'Multilingual Mode',
  },
];

let currentAudioElement: HTMLAudioElement | null = null;

export function stopSpeakingAudio() {
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export async function speakWithVetoVoice(
  text: string,
  voiceName: VetoVoiceName = 'Fenrir',
  rate = 1.0,
  onStart?: () => void,
  onEnd?: () => void,
  onAmplitude?: (amp: number) => void
): Promise<void> {
  stopSpeakingAudio();
  onStart?.();

  let amplitudeTimer: number | null = null;
  const startSimulatedVoicePulse = () => {
    amplitudeTimer = window.setInterval(() => {
      const pulse = 0.25 + Math.sin(Date.now() * 0.018) * 0.2 + Math.random() * 0.35;
      onAmplitude?.(Math.min(1, Math.max(0.1, pulse)));
    }, 60);
  };
  const stopSimulatedVoicePulse = () => {
    if (amplitudeTimer !== null) {
      clearInterval(amplitudeTimer);
      amplitudeTimer = null;
    }
    onAmplitude?.(0);
  };

  try {
    const res = await fetch('/api/veto/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
        audio.playbackRate = rate;
        currentAudioElement = audio;
        startSimulatedVoicePulse();

        await new Promise<void>((resolve) => {
          audio.onended = () => {
            stopSimulatedVoicePulse();
            onEnd?.();
            resolve();
          };
          audio.onerror = () => {
            stopSimulatedVoicePulse();
            onEnd?.();
            resolve();
          };
          audio.play().catch(() => {
            stopSimulatedVoicePulse();
            onEnd?.();
            resolve();
          });
        });
        return;
      }
    }
  } catch {
    // Fallback to browser SpeechSynthesis below
  }

  if ('speechSynthesis' in window) {
    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = 0.85; // deeper resonant pitch for Veto
      const voices = window.speechSynthesis.getVoices();
      const hasDevanagari = /[\u0900-\u097F]/.test(text);
      if (hasDevanagari) {
        const hindiVoice = voices.find((v) => v.lang.startsWith('hi'));
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        const deepVoice =
          voices.find((v) => /daniel|alex|google uk english male|microsoft david|aaron/i.test(v.name)) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (deepVoice) utterance.voice = deepVoice;
      }

      startSimulatedVoicePulse();
      utterance.onend = () => {
        stopSimulatedVoicePulse();
        onEnd?.();
        resolve();
      };
      utterance.onerror = () => {
        stopSimulatedVoicePulse();
        onEnd?.();
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  } else {
    stopSimulatedVoicePulse();
    onEnd?.();
  }
}

// Wake-word pattern matching "Veto" across English, Hindi, and common ASR variations
const WAKE_WORD_REGEX = /\b(veto|veeto|vito|beto|v2|hey veto|ok veto|agent veto|वीटो)\b/i;

export function extractCommandAfterWakeWord(transcript: string): {
  wakeDetected: boolean;
  commandRemainder: string;
} {
  const match = transcript.match(WAKE_WORD_REGEX);
  if (!match || match.index === undefined) {
    return { wakeDetected: false, commandRemainder: '' };
  }
  const afterWake = transcript
    .slice(match.index + match[0].length)
    .replace(/^[\s,.:;!-]+/, '')
    .trim();
  return {
    wakeDetected: true,
    commandRemainder: afterWake,
  };
}
