"use client";

import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";

export function LandscapePrompt() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] hidden portrait:flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl sm:hidden"
    >
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 90 }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="flex h-24 w-40 items-center justify-center rounded-2xl border-4 border-primary/40 bg-primary/10"
        >
          <div className="h-2 w-10 rounded-full bg-primary/30" />
        </motion.div>
        <div className="absolute -right-4 -top-4">
          <RotateCw className="h-12 w-12 animate-spin-slow text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white">Rotate Your Device</h2>
      <p className="mt-2 px-8 text-center text-muted-foreground">
        Spatial Live mode is best experienced in horizontal (landscape) orientation.
      </p>
    </motion.div>
  );
}
