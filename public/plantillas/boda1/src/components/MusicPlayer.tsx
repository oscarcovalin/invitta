import React, { useState, useRef, useEffect } from "react";

export function MusicPlayer({ autoPlay }: { autoPlay?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Elegant royalty-free soft piano/orchestra music for celebration
    const audio = new Audio("./assets/marry-you-glee-cast.mp3");
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Handle browser cleanup
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Listen to external autoplay triggers from the opening interaction
  useEffect(() => {
    if (autoPlay && audioRef.current && !isPlaying) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.log("Autoplay context initiated from overlay", err);
        });
    }
  }, [autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.log("Audio play failed due to browser restriction", err);
        });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.muted = nextMute;
    if (nextMute) {
      audioRef.current.volume = 0;
    } else {
      audioRef.current.volume = volume;
    }
  };

  return (
    <div 
      id="music-player-bottom-bar"
      className="fixed bottom-[68px] md:bottom-0 left-0 right-0 w-full z-50 bg-paper/95 backdrop-blur-md border-t border-sage/20 py-3 px-6 md:px-12 flex items-center justify-between transition-all duration-500 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.3)]"
    >
      <div className="flex items-center gap-4">
        {/* Waveform Animation */}
        <div className="flex items-end gap-[3px] h-4 w-5">
          {[0.6, 1.2, 0.4, 1.5, 0.8].map((speed, i) => (
            <div
              key={i}
              className={`w-[2.5px] bg-sage rounded-xs transition-all duration-300 ${isPlaying ? "animate-pulse" : "h-[3px]"}`}
              style={{
                height: isPlaying ? "100%" : "3px",
                animationDuration: isPlaying ? `${speed}s` : "0s",
                backgroundColor: i === 1 || i === 3 ? "var(--color-champagne-gold)" : "var(--color-sage)",
              }}
            />
          ))}
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] tracking-[0.25em] font-medium text-sage uppercase">Música de Fondo</span>
          <span className="text-[10px] font-medium text-on-surface-variant font-sans truncate max-w-[120px] md:max-w-[180px]">
            {isPlaying ? "Reproduciendo Melodía" : "Música Pausada"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 md:gap-4 pl-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          id="music-toggle-play-btn"
          className="w-9 h-9 rounded-full border border-sage/30 hover:border-sage bg-surface-container-low hover:bg-outline-variant flex items-center justify-center text-ink hover:text-champagne-gold transition-all duration-300 cursor-pointer shadow-md"
          title={isPlaying ? "Pausar música" : "Reproducir música"}
        >
          <span className="material-symbols-outlined text-[20px] leading-none select-none">
            {isPlaying ? "pause" : "play_arrow"}
          </span>
        </button>

        <div className="h-4 w-px bg-sage/20 hidden sm:block"></div>

        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          id="music-mute-toggle-btn"
          className="text-on-surface-variant hover:text-champagne-gold transition-colors p-1.5 flex items-center justify-center cursor-pointer"
          title={isMuted ? "Activar sonido" : "Silenciar"}
        >
          <span className="material-symbols-outlined text-[18px] select-none">
            {isMuted ? "volume_off" : "volume_up"}
          </span>
        </button>

        {/* Volume slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          id="music-volume-slider"
          className="w-16 md:w-24 accent-champagne-gold h-[2px] bg-sage/20 rounded-lg cursor-pointer outline-hidden transition-all"
        />
      </div>
    </div>
  );
}
