"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Cloud, Eye, Mic, Server, Sparkles, Wrench } from "lucide-react";

export function TechArchitectureVisual() {
  return (
    <div className="relative h-full w-full bg-[#030305] rounded-[calc(1.5rem-2px)] overflow-hidden flex flex-col items-center justify-center p-6 gap-0">
      {/* Premium Dark Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Ambient Core Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary/10 opacity-30 blur-[120px] pointer-events-none" />

      {/* =========================================
          LAYER 1: CLIENT EDGE
         ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[280px] bg-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-xl relative z-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <Eye className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs font-bold text-white/90 uppercase tracking-widest">
              Client Edge
            </span>
          </div>
          <Mic className="w-4 h-4 text-white/30" />
        </div>
        <div className="flex justify-between items-end">
          <p className="text-[10px] text-white/50 leading-relaxed font-medium">
            Next.js 15 Frontend
            <br />
            WebRTC & PCM Audio API
          </p>
          <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" />
        </div>
      </motion.div>

      {/* Pipeline 1 -> 2 */}
      <div className="flex w-[180px] justify-between px-6 pt-1">
        {[0, 1].map((i) => (
          <div
            key={`pipe1-${i}`}
            className="h-8 w-[1px] bg-gradient-to-b from-blue-500/30 to-cyan-500/30 relative"
          >
            <motion.div
              className="absolute top-0 left-[-1px] w-[3px] h-4 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,1)]"
              animate={{ y: [0, 32, 0], opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
                delay: i * 0.5,
              }}
            />
          </div>
        ))}
      </div>

      {/* =========================================
          LAYER 2: CLOUD RELAY (ORCHESTRATOR)
         ========================================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="w-full max-w-[300px] bg-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-xl relative z-20 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:bg-white/[0.04] transition-colors"
      >
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 border-y border-r border-white/10 rounded-r-lg" />
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 border-y border-l border-white/10 rounded-l-lg" />

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <Server className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
              Cloud Relay <Cloud className="w-3 h-3 text-cyan-400/50" />
            </h3>
            <p className="text-[10px] text-white/50 font-medium tracking-wide mt-0.5">
              Google Cloud Run • FastAPI
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
              State Hook
            </span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 flex items-center gap-1">
              <Wrench className="w-2 h-2" /> Tools
            </span>
          </div>
        </div>
      </motion.div>

      {/* Pipeline 2 -> 3 */}
      <div className="flex w-[180px] justify-between px-6 pb-1">
        {[0, 1].map((i) => (
          <div
            key={`pipe2-${i}`}
            className="h-8 w-[1px] bg-gradient-to-b from-cyan-500/30 to-pink-500/30 relative"
          >
            <motion.div
              className="absolute bottom-0 left-[-1px] w-[3px] h-4 bg-pink-400 rounded-full shadow-[0_0_10px_rgba(236,72,153,1)]"
              animate={{ y: [0, -32, 0], opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
                delay: i * 0.7,
              }}
            />
          </div>
        ))}
      </div>

      {/* =========================================
          LAYER 3: COGNITIVE ENGINE
         ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="w-full max-w-[320px] bg-gradient-to-b from-pink-500/10 to-purple-800/20 border border-pink-500/30 rounded-2xl p-5 backdrop-blur-xl relative z-30 shadow-[0_0_40px_rgba(236,72,153,0.15)] group hover:shadow-[0_0_60px_rgba(236,72,153,0.25)] transition-all overflow-hidden"
      >
        {/* Core Animated Flare */}
        <motion.div
          className="absolute top-0 left-[20%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-pink-400 to-transparent"
          animate={{ opacity: [0.3, 1, 0.3], width: ["40%", "80%", "40%"] }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <div className="flex gap-4 items-center relative z-10">
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-xl bg-pink-500 blur-md opacity-40"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
            <div className="h-12 w-12 rounded-xl bg-black border border-pink-500/50 flex items-center justify-center relative z-10">
              <BrainCircuit className="w-6 h-6 text-pink-400" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-[13px] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-200 to-purple-300 uppercase tracking-[0.2em] mb-1">
              Gemini Live
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-pink-200/60 font-semibold tracking-wide">
                Multi-modal Brain API
              </span>
              <Sparkles className="w-3 h-3 text-pink-400/80 animate-pulse" />
            </div>
          </div>

          {/* Activity indicator */}
          <div className="flex gap-1 h-4 items-end justify-end">
            {[1, 2, 3].map((bar) => (
              <motion.div
                key={`bar-${bar}`}
                className="w-1 bg-pink-500/60 rounded-t-sm"
                animate={{ height: ["4px", "16px", "4px"] }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: bar * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
