"use client";

import React from "react";
import { motion } from "framer-motion";

interface SiriOrbProps {
  size?: string;
  colors?: {
    bg?: string;
  };
}

export default function SiriOrb({ 
  size = "24px", 
  colors = { bg: "oklch(22.64% 0 0)" } 
}: SiriOrbProps) {
  return (
    <motion.div
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        background: colors.bg || "oklch(22.64% 0 0)",
      }}
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 50%)`,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}




