import { useState, useRef, useCallback, useEffect } from "react";

export interface MicLevelHook {
  level: number; // 0–1 normalised amplitude
  start: () => Promise<void>;
  stop: () => void;
}

export function useMicLevel(): MicLevelHook {
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeRef = useRef(false);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    analyserRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    stop(); // clean up previous
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext ?? (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      activeRef.current = true;

      const tick = () => {
        if (!activeRef.current || !analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;
        setLevel(Math.min(avg / 100, 1)); // normalise to 0–1
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // Permission denied or no mic — fail silently, level stays 0
      setLevel(0);
    }
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { level, start, stop };
}
