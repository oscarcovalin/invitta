import React from "react";
import { motion } from "motion/react";

interface ParallaxImageProps {
  src: string;
  alt: string;
  caption: string;
  onClick?: () => void;
  key?: React.Key;
}

export function ParallaxImage({ src, alt, onClick }: ParallaxImageProps) {
  return (
    <div className="w-full max-w-4xl mx-auto group">
      <button
        type="button"
        onClick={onClick}
        className="relative block w-full overflow-hidden bg-stone-100 cursor-zoom-in"
      >
        <motion.img
          src={src}
          alt={alt}
          initial={{ opacity: 0.88 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="block w-full h-auto object-contain select-none pointer-events-none"
          referrerPolicy="no-referrer"
        />
      </button>
    </div>
  );
}
