import React from "react";
import { motion } from "motion/react";

interface ImageRevealProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  yParallax?: any;
  isHero?: boolean;
  showBorder?: boolean;
  showBackdrop?: boolean;
  targetOpacity?: number;
  targetImageScale?: number;
  initialImageScale?: number;
  aspectRatio?: string;
  breathe?: boolean;
  viewportMargin?: string;
  parallaxClass?: string;
  children?: React.ReactNode;
}

export function ImageReveal({
  src,
  alt,
  className = "",
  imageClassName = "",
  yParallax,
  isHero = false,
  showBorder = true,
  showBackdrop = true,
  targetOpacity = 1,
  targetImageScale = 1,
  initialImageScale = 1.08,
  aspectRatio = "",
  breathe = false,
  viewportMargin = "-100px",
  parallaxClass = "absolute inset-0 h-[115%] -top-[7%] w-full",
  children,
}: ImageRevealProps) {
  // Staggered stagger children and delay properties
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.18,
        delayChildren: isHero ? 0.05 : 0.12,
      },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0, scale: 0.95, filter: "blur(4px)" },
    visible: {
      opacity: 0.06,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 1.4,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const frameVariants = {
    hidden: { opacity: 0, scale: initialImageScale, filter: "blur(6px)" },
    visible: {
      opacity: targetOpacity,
      scale: targetImageScale,
      filter: "blur(0px)",
      transition: {
        duration: 1.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const borderVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.8,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.35,
      },
    },
  };

  const triggerProps = isHero
    ? { animate: "visible" }
    : { whileInView: "visible", viewport: { once: true, margin: viewportMargin } };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      {...triggerProps}
      className={`relative overflow-hidden ${aspectRatio} ${className}`}
    >
      {/* 1. Backdrop underlay */}
      {showBackdrop && (
        <motion.div
          variants={backdropVariants}
          className="absolute inset-0 bg-champagne-gold pointer-events-none z-0"
        />
      )}

      {/* 2. Main Frame & Image */}
      <motion.div
        variants={frameVariants}
        className="w-full h-full relative overflow-hidden z-10"
      >
        <motion.div
          style={yParallax ? { y: yParallax } : {}}
          className={yParallax ? parallaxClass : "w-full h-full relative"}
        >
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover select-none pointer-events-none ${
              breathe ? "breathe-animation" : ""
            } ${imageClassName}`}
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </motion.div>

      {/* 3. Gold Accent Outline frame */}
      {showBorder && (
        <motion.div
          variants={borderVariants}
          className="absolute inset-4 md:inset-6 border border-champagne-gold/25 pointer-events-none z-20 rounded-xs"
        />
      )}

      {children}
    </motion.div>
  );
}
