import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

interface ParallaxImageProps {
  src: string;
  alt: string;
  caption: string;
  onClick?: () => void;
  key?: React.Key;
}

export function ParallaxImage({ src, alt, onClick }: ParallaxImageProps) {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");
  const reduceMotion = useReducedMotion();
  const isPortrait = orientation === "portrait";

  return (
    <div className="w-full max-w-4xl mx-auto group">
      <button
        type="button"
        onClick={onClick}
        className={`relative block w-full overflow-hidden bg-stone-900 cursor-zoom-in ${
          isPortrait
            ? "h-[76svh] min-h-[480px] max-h-[900px] md:h-[82vh]"
            : "aspect-[16/10] max-h-[78vh]"
        }`}
      >
        <motion.img
          src={src}
          alt=""
          aria-hidden="true"
          initial={{ scale: 1.04, x: "-1.5%", y: "-1%" }}
          animate={reduceMotion ? { scale: 1.06, x: 0, y: 0 } : {
            scale: [1.04, 1.12, 1.06],
            x: ["-1.5%", "1.5%", "0%"],
            y: ["-1%", "1%", "0%"],
          }}
          transition={reduceMotion ? { duration: 0 } : {
            duration: 18,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          className="absolute inset-[-8%] w-[116%] h-[116%] object-cover blur-2xl opacity-55 select-none pointer-events-none"
          referrerPolicy="no-referrer"
        />
        <span className="absolute inset-0 bg-black/15 pointer-events-none" aria-hidden="true"></span>
        <motion.img
          src={src}
          alt={alt}
          onLoad={(event) => {
            const image = event.currentTarget;
            setOrientation(image.naturalHeight > image.naturalWidth ? "portrait" : "landscape");
          }}
          initial={{ opacity: 0.88 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 block w-full h-full object-contain p-2 md:p-3 select-none pointer-events-none"
          referrerPolicy="no-referrer"
        />
      </button>
    </div>
  );
}
