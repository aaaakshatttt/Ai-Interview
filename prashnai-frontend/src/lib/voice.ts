import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Text-to-speech (window.speechSynthesis)                             */
/* ------------------------------------------------------------------ */

export function speak(text: string, onStart?: () => void, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  utter.onstart = () => onStart?.();
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

export function cancelSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

/* ------------------------------------------------------------------ */
/* Speech-to-text hook (SpeechRecognition / webkitSpeechRecognition)   */
/* ------------------------------------------------------------------ */

export interface STTState {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechToText(): STTState {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  const supported =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (!supported) return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interimChunk += r[0].transcript;
      }
      if (finalChunk) setTranscript((prev) => (prev + " " + finalChunk).trim());
      setInterim(interimChunk);
    };
    rec.onerror = (e: any) => {
      if (e.error !== "no-speech") setError(e.error);
    };
    rec.onend = () => {
      setListening((wasListening) => {
        if (wasListening) {
          try {
            rec.start();
          } catch {
            /* already restarting */
          }
        }
        return wasListening;
      });
    };

    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
  }, [supported]);

  const start = useCallback(() => {
    setError(null);
    if (!supported || !recRef.current) {
      setError("Speech recognition isn't supported in this browser.");
      return;
    }
    try {
      recRef.current.start();
      setListening(true);
    } catch {
      /* start() throws if already started */
    }
  }, [supported]);

  const stop = useCallback(() => {
    setListening(false);
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return { supported, listening, transcript, interim, error, start, stop, reset };
}

/* ------------------------------------------------------------------ */
/* Mic level / waveform analyser (Web Audio API)                       */
/* ------------------------------------------------------------------ */

export interface MicAnalyser {
  level: number; // 0-1 smoothed RMS, for simple level meters
  bars: number[]; // small array of bar heights (0-1) for waveform UI
  start: () => Promise<boolean>;
  stop: () => void;
  active: boolean;
  error: string | null;
}

const BAR_COUNT = 24;

export function useMicAnalyser(): MicAnalyser {
  const [level, setLevel] = useState(0);
  const [bars, setBars] = useState<number[]>(new Array(BAR_COUNT).fill(0));
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    setLevel((prev) => prev * 0.7 + Math.min(1, rms * 4) * 0.3);

    const chunk = Math.floor(data.length / BAR_COUNT);
    const nextBars: number[] = [];
    for (let b = 0; b < BAR_COUNT; b++) {
      let bSum = 0;
      for (let i = 0; i < chunk; i++) {
        const idx = b * chunk + i;
        const v = (data[idx] - 128) / 128;
        bSum += Math.abs(v);
      }
      nextBars.push(Math.min(1, (bSum / chunk) * 6));
    }
    setBars(nextBars);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      setActive(true);
      rafRef.current = requestAnimationFrame(tick);
      return true;
    } catch (e: any) {
      setError(e?.name === "NotAllowedError" ? "Microphone access denied." : "Microphone unavailable.");
      return false;
    }
  }, [tick]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    analyserRef.current = null;
    setActive(false);
    setLevel(0);
    setBars(new Array(BAR_COUNT).fill(0));
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { level, bars, start, stop, active, error };
}
