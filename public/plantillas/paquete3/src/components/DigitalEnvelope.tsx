import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface DigitalEnvelopeProps {
  onOpen: () => void;
}

export function DigitalEnvelope({ onOpen }: DigitalEnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCardExtracted, setIsCardExtracted] = useState(false);

  const handleOpenClick = () => {
    if (isOpen) return;
    setIsOpen(true);
    
    // Step 1: Flap rotates open (takes 0.8s)
    // Step 2: Card slides up after flap opens (after 0.8s)
    setTimeout(() => {
      setIsCardExtracted(true);
    }, 850);

    // Step 3: Trigger main site load after card is fully shown (after 2.5s)
    setTimeout(() => {
      onOpen();
    }, 2800);
  };

  return (
    <motion.div
      key="envelope-overlay"
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
      }}
      className="fixed inset-0 z-[120] bg-[#120e0d] flex items-center justify-center overflow-hidden p-4 select-none"
    >
      {/* Elegantly textured background with a soft ambient radial gold spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(223,186,107,0.08)_0%,transparent_70%)] pointer-events-none"></div>
      
      {/* Soft floating luxury particles strictly within the envelope screen */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-champagne-gold/30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-champagne-gold/20 rounded-full animate-ping [animation-duration:4s]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.2 h-1.2 bg-champagne-gold/25 rounded-full animate-pulse [animation-delay:1.5s]"></div>
      </div>

      {/* Frame border */}
      <div className="absolute inset-4 md:inset-8 border border-sage/10 pointer-events-none z-10"></div>

      {/* Main 3D Scene Viewport */}
      <div className="relative w-full max-w-lg aspect-[4/3] md:aspect-[1.414/1] flex items-center justify-center pt-12 md:pt-16">
        
        {/* ENVELOPE BASE GROUP (with 3D perspective to make flips pop!) */}
        <div className="relative w-[90%] md:w-[85%] h-[68%] md:h-[72%] [perspective:1200px]">
          
          {/* 1. EXTRACTABLE INVITATION CARD */}
          <motion.div
            initial={{ y: 0, z: -10, scale: 0.95 }}
            animate={
              isCardExtracted 
                ? { y: "-102%", z: 20, scale: 1.02 } 
                : { y: 0, z: -10, scale: 0.95 }
            }
            transition={{ 
              duration: 1.4, 
              ease: [0.16, 1, 0.3, 1]
            }}
            className="absolute left-[3%] right-[3%] top-[4%] bottom-[4%] bg-[#fbfbf9] rounded-sm p-5 md:p-8 flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.4)] border border-sage/15 z-[15]"
          >
            {/* Fine internal border for premium stationary feel */}
            <div className="absolute inset-2 md:inset-3 border border-sage/10 rounded-xs pointer-events-none"></div>

            {/* Micro ornaments */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-champagne-gold/30"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-champagne-gold/30"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-champagne-gold/30"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-champagne-gold/30"></div>

            <div className="text-center space-y-2 md:space-y-3 my-auto">
              <span className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-sage/70 font-semibold block">
                Invitación de Gala
              </span>
              <div className="w-8 h-[1px] bg-champagne-gold/25 mx-auto"></div>
              
              <h3 className="font-serif italic text-2xl md:text-3xl text-sage block select-none">
                Mis Quince Años
              </h3>
              
              <h2 className="font-serif text-3xl md:text-4xl text-ink tracking-wide font-light">
                Ana Camila
              </h2>
              
              <p className="font-sans text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-sage/80">
                Zavala Almazán
              </p>
              
              <div className="pt-2 md:pt-4">
                <p className="font-serif italic text-[11px] text-ink/60 max-w-[240px] mx-auto leading-relaxed">
                  "Hay momentos en la vida que son únicos e inolvidables, y compartirlos con quienes más amamos los hace eternos..."
                </p>
              </div>
            </div>
          </motion.div>

          {/* 2. ENVELOPE BACK PANEL (Behind the card) */}
          <div className="absolute inset-0 bg-[#2b2422] rounded-sm border border-[#3d3330] shadow-xl z-10 overflow-hidden">
            {/* Elegant luxury pattern inside the envelope pocket */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(223,186,107,0.15)_0%,transparent_80%)]"></div>
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,#dfba6b_25%,transparent_25%,transparent_75%,#dfba6b_75%,#dfba6b),linear-gradient(45deg,#dfba6b_25%,transparent_25%,transparent_75%,#dfba6b_75%,#dfba6b)] bg-[size:16px_16px] bg-[position:0_0,8px_8px]"></div>
          </div>

          {/* 3. ENVELOPE DIAGONAL SIDE FLAPS & BOTTOM FLAP OVERLAYS (In front of the card before extraction) */}
          {/* Bottom Flap (V-Shape overlay) */}
          <div className="absolute inset-0 pointer-events-none z-[18] flex items-end">
            <svg viewBox="0 0 500 300" className="w-full h-[60%] filter drop-shadow-[0_-5px_10px_rgba(0,0,0,0.15)] overflow-visible">
              {/* Left and Right overlapping panels styled elegant warm-tinted burgundy or deep cocoa */}
              <path d="M 0 300 L 250 145 L 500 300 Z" fill="#2d2422" stroke="#362c2a" strokeWidth="1.5" />
              <path d="M 0 0 L 195 160 L 0 300 Z" fill="#231b1a" opacity="0.9" />
              <path d="M 500 0 L 305 160 L 500 300 Z" fill="#231b1a" opacity="0.9" />
            </svg>
          </div>

          {/* 4. ENVELOPE TOP FOLDING FLAP (The 3D Flap!) */}
          <motion.div
            style={{ transformOrigin: "top" }}
            initial={{ rotateX: 0 }}
            animate={isOpen ? { rotateX: 180 } : { rotateX: 0 }}
            transition={{ 
              duration: 0.9, 
              ease: [0.16, 1, 0.3, 1]
            }}
            className="absolute inset-x-0 top-0 h-[52%] z-25 [backface-visibility:hidden] cursor-pointer"
            onClick={handleOpenClick}
          >
            <svg viewBox="0 0 500 160" className="w-full h-full filter drop-shadow-[0_8px_15px_rgba(0,0,0,0.25)]">
              {/* The triangular outer flap pointing downwards */}
              <path d="M 0 0 L 250 160 L 500 0 Z" fill="#382e2c" stroke="#4a3e3b" strokeWidth="1.5" />
            </svg>
          </motion.div>

          {/* 5. GORGEOUS EMBOSSED WAX SEAL (Sits directly on the flap tip, acts as the interactive unlock) */}
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ 
                  scale: 1.2, 
                  opacity: 0,
                  y: 40,
                  transition: { duration: 0.5, ease: "easeIn" }
                }}
                className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 z-35 flex flex-col items-center gap-6 cursor-pointer"
                onClick={handleOpenClick}
              >
                {/* Deluxe Pulsing Golden Ring */}
                <div className="relative w-24 h-24 flex items-center justify-center group">
                  <div className="absolute inset-0 rounded-full border border-champagne-gold/30 group-hover:scale-115 transition-transform duration-700 animate-ping opacity-35"></div>
                  
                  {/* Wax Seal Body */}
                  <div className="w-18 h-18 rounded-full bg-radial from-[#dfba6b] via-[#cfa653] to-[#b88e3a] shadow-[0_10px_20px_rgba(0,0,0,0.45),inset_0_1px_3px_rgba(255,255,255,0.4),inset_0_-1.5px_3px_rgba(0,0,0,0.4)] flex items-center justify-center relative border border-champagne-gold/30 transition-transform duration-300 group-hover:scale-105 active:scale-95">
                    {/* Inner seal circle */}
                    <div className="absolute inset-1.5 rounded-full border border-[#f1db9c]/20"></div>
                    {/* Monogram */}
                    <span className="font-serif text-xl text-[#fffbf0] tracking-wider drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)] select-none">
                      AC
                    </span>
                  </div>
                </div>

                {/* Sparkling Instruction text */}
                <div className="text-center space-y-1">
                  <span className="text-[10px] tracking-[0.3em] text-champagne-gold/90 font-bold uppercase block animate-pulse">
                    Tocar para Abrir
                  </span>
                  <span className="text-[8px] tracking-[0.2em] text-[#dfba6b]/50 block">
                    SOBRE DIGITAL
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subtle gold line on the flip side of the top flap when it flips up */}
          <motion.div
            style={{ transformOrigin: "top" }}
            initial={{ rotateX: -180, opacity: 0 }}
            animate={isOpen ? { rotateX: 0, opacity: 1 } : { rotateX: -180, opacity: 0 }}
            transition={{ 
              duration: 0.9, 
              ease: [0.16, 1, 0.3, 1]
            }}
            className="absolute inset-x-0 top-0 h-[52%] z-[12] [backface-visibility:hidden] pointer-events-none"
          >
            <svg viewBox="0 0 500 160" className="w-full h-full transform scale-y-[-1] opacity-90">
              <path d="M 0 0 L 250 160 L 500 0 Z" fill="#1e1817" stroke="#2b2422" strokeWidth="1" />
            </svg>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
