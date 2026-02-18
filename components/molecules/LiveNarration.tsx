"use client";

import { motion } from "framer-motion";

interface LiveNarrationProps {
    text: string;
    isActive: boolean;
}

export function LiveNarration({ text, isActive }: LiveNarrationProps) {
    if (!isActive || !text) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl rounded-xl border border-white/10 bg-black/60 p-6 text-center shadow-2xl backdrop-blur-xl"
        >
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-400/80">
                Live Narration Stream
            </div>
            <p className="text-xl font-medium leading-relaxed text-white text-balance drop-shadow-md">
                "{text}"
            </p>
        </motion.div>
    );
}
