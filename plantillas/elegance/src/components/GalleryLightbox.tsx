import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GalleryImage } from '../types';

interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

export default function GalleryLightbox({ images, currentIndex, onClose, onSelectIndex }: LightboxProps) {
  const currentImage = images[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectIndex((currentIndex + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectIndex((currentIndex - 1 + images.length) % images.length);
  };

  if (!currentImage) return null;

  return (
    <AnimatePresence>
      <div id="gallery-lightbox-overlay" className="fixed inset-0 z-50 flex flex-col justify-between bg-ink/95 backdrop-blur-md p-4 md:p-8">
        
        {/* Header Controls */}
        <header className="flex justify-between items-center w-full z-10">
          <span className="font-sans text-[11px] tracking-[0.3em] text-sage font-medium uppercase">
            Fotografía • {currentIndex + 1} de {images.length}
          </span>
          <button
            onClick={onClose}
            className="p-3 text-paper hover:text-sage transition-colors rounded-full hover:bg-paper/5"
            aria-label="Cerrar galería"
          >
            <X size={24} />
          </button>
        </header>

        {/* Main Lightbox Stage */}
        <div className="relative flex-grow flex items-center justify-center max-w-5xl mx-auto w-full">
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="absolute left-2 md:left-4 p-3 text-paper hover:text-sage transition-all hover:bg-paper/5 rounded-full z-10"
            aria-label="Anterior foto"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Image Slide Wrapper */}
          <div className="relative w-full h-[70vh] md:h-[80vh] flex items-center justify-center overflow-hidden">
            <motion.img
              key={currentImage.id}
              src={currentImage.url}
              alt={currentImage.alt}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute right-2 md:right-4 p-3 text-paper hover:text-sage transition-all hover:bg-paper/5 rounded-full z-10"
            aria-label="Siguiente foto"
          >
            <ChevronRight size={32} />
          </button>
        </div>

        {/* Footer info & thumbnails */}
        <footer className="flex flex-col items-center gap-4 w-full z-10 pb-4">
          <p className="font-serif italic text-paper text-sm md:text-base tracking-wide max-w-md text-center opacity-90">
            {currentImage.alt}
          </p>

          {/* Miniature index dots */}
          <div className="flex gap-2">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => onSelectIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-sage w-6' : 'bg-paper/30 hover:bg-paper/60'}`}
                aria-label={`Ver foto ${idx + 1}`}
              ></button>
            ))}
          </div>
        </footer>
      </div>
    </AnimatePresence>
  );
}
