import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

interface AudioTriggerProps {
  readonly description: string;
  readonly active?: boolean;
}

export function AudioTrigger({ description, active = true }: AudioTriggerProps) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!active) return;

    setPlaying(true);

    // Procedural Audio Generation
    let audioCtx: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;

    try {
      const AudioContextClass =
        globalThis.AudioContext ||
        (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();

      // Configure sound based on description or just generic ambient
      const isOminous =
        description.toLowerCase().includes("ominous") ||
        description.toLowerCase().includes("thrum");

      oscillator.type = isOminous ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(isOminous ? 60 : 220, audioCtx.currentTime);

      // Subtle sweep
      oscillator.frequency.exponentialRampToValueAtTime(
        isOminous ? 40 : 110,
        audioCtx.currentTime + 4,
      );

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 1); // Very quiet
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 5);
    } catch (e) {
      console.error("Audio Trigger Error:", e);
    }

    const timer = setTimeout(() => {
      setPlaying(false);
      if (audioCtx?.state !== "closed") audioCtx?.close();
    }, 6000);

    return () => {
      clearTimeout(timer);
      if (audioCtx?.state !== "closed") audioCtx?.close();
    };
  }, [active, description]);

  if (!playing) return null;

  return (
    <div className="my-2 inline-flex items-center gap-2 rounded-full bg-cyan-950/30 px-3 py-1.5 text-xs text-cyan-200/70 border border-cyan-500/20 animate-in fade-in slide-in-from-left-2">
      <Volume2 className="h-3 w-3 animate-pulse" />
      <span className="font-mono uppercase tracking-wider">Atmosphere: {description}</span>
    </div>
  );
}
