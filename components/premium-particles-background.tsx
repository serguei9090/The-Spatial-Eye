"use client";

import type { ISourceOptions } from "@tsparticles/engine";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export function PremiumParticlesBackground() {
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      detectRetina: true,
      fpsLimit: 60,
      background: { color: "transparent" },
      particles: {
        number: { value: reduceMotion ? 28 : 62, density: { enable: true, area: 860 } },
        color: { value: ["#22d3ee", "#38bdf8", "#0ea5e9", "#67e8f9"] },
        links: {
          enable: true,
          color: "#7dd3fc",
          distance: 140,
          opacity: 0.18,
          width: 1,
        },
        move: {
          enable: true,
          speed: reduceMotion ? 0.18 : 0.75,
          outModes: { default: "out" },
          direction: "none",
          random: true,
        },
        opacity: { value: { min: 0.2, max: 0.65 } },
        size: { value: { min: 1, max: 3.8 } },
      },
      interactivity: {
        events: {
          onHover: { enable: !reduceMotion, mode: "grab" },
          onClick: { enable: !reduceMotion, mode: "push" },
          resize: { enable: true },
        },
        modes: {
          grab: { distance: 180, links: { opacity: 0.28 } },
          push: { quantity: 3 },
        },
      },
    }),
    [reduceMotion],
  );

  if (!ready) {
    return null;
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Particles className="h-full w-full" options={options} />
      <motion.div
        className="absolute -left-24 top-[-7rem] h-[28rem] w-[28rem] rounded-full bg-cyan-300/24 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 90, 10, 0],
                y: [0, 36, -22, 0],
                scale: [1, 1.08, 0.96, 1],
              }
        }
        transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute right-[-9rem] top-[-3rem] h-[34rem] w-[34rem] rounded-full bg-sky-400/18 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -78, -10, 0],
                y: [0, 64, 12, 0],
                scale: [1, 0.95, 1.1, 1],
              }
        }
        transition={{ duration: 24, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-[-10rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-blue-500/16 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -40, 42, 0],
                y: [0, -30, -12, 0],
                scale: [1, 1.12, 0.94, 1],
              }
        }
        transition={{ duration: 28, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-0 opacity-35"
        animate={reduceMotion ? undefined : { opacity: [0.24, 0.38, 0.24] }}
        transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.11) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(circle at center, black 42%, transparent 88%)",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(34,211,238,0.16),transparent_42%),radial-gradient(circle_at_78%_2%,rgba(56,189,248,0.14),transparent_35%),radial-gradient(circle_at_50%_92%,rgba(14,165,233,0.12),transparent_42%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.24),rgba(2,6,23,0.45))]" />
    </div>
  );
}
