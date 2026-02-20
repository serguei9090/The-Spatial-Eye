"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
  mode: string;
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  color,
  delay = 0,
  mode,
}: FeatureCardProps) {
  return (
    <Link href={`/studio?mode=${mode}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        viewport={{ once: true }}
        whileHover={{ y: -5, scale: 1.02 }}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer h-full"
      >
        <div
          className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
          style={{ backgroundColor: color }}
        />

        <div
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10"
          style={{ color }}
        >
          <Icon className="h-7 w-7" />
        </div>

        <h3 className="mb-3 text-xl font-bold text-white transition-colors group-hover:text-primary">
          {title}
        </h3>

        <p className="text-sm leading-relaxed text-muted-foreground transition-colors group-hover:text-white/80">
          {description}
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-primary opacity-0 transition-all group-hover:opacity-100">
          <span>Explore Mode</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
          >
            →
          </motion.span>
        </div>
      </motion.div>
    </Link>
  );
}
