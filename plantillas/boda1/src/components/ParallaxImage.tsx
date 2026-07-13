import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface ParallaxImageProps {
  src: string;
  alt: string;
  caption: string;
  onClick?: () => void;
  key?: React.Key;
}

export function ParallaxImage({ src, alt, onClick }: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the scroll progress of the container as it passes through the viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Smooth mapping of scroll progress (0 to 1) to vertical translate offset (-50px to 50px)
  const y = useTransform(scrollYProgress, [0, 1], [-60, 60]);

  return (
    <div 
      ref={containerRef} 
      className="w-full max-w-4xl mx-auto overflow-hidden group"
    >
      {/* 
        Container has hidden overflow to contain the shifting image.
        The image itself has h-[120%] and is offset to prevent white edges.
      */}
      <div 
        onClick={onClick}
        className="relative w-full h-[55vh] md:h-[75vh] overflow-hidden bg-stone-100 cursor-zoom-in"
      >
        <motion.div
          className="w-full h-full"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.img
            src={src}
            alt={alt}
            style={{ y, scale: 1.12 }}
            className="absolute inset-0 w-full h-[120%] -top-[10%] object-cover select-none pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>
    </div>
  );
}

