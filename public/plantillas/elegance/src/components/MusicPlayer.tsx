import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
import { BACKGROUND_MUSIC_URL } from '../data';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const invitationMusicUrl = (window as Window & typeof globalThis & {
      INVITATION_DATA?: { musicUrl?: string };
    }).INVITATION_DATA?.musicUrl || BACKGROUND_MUSIC_URL;
    const audio = new Audio(invitationMusicUrl);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    const handleCanPlay = () => {
      setError(null);
      void startPlayback();
    };

    const startPlayback = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
        setHasStarted(true);
        setError(null);
      } catch (err) {
        // Mobile browsers require a user gesture before allowing audible media.
        setError('Toca para activar la música');
      }
    };

    const retryFromFirstGesture = () => {
      void startPlayback();
    };

    audio.addEventListener('canplay', handleCanPlay);
    document.addEventListener('pointerdown', retryFromFirstGesture, { once: true, passive: true });

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      document.removeEventListener('pointerdown', retryFromFirstGesture);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setHasStarted(true);
          setError(null);
        })
        .catch((err) => {
          console.error("Audio playback blocked or failed:", err);
          setError("Haz clic para activar la música");
        });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    audioRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  return (
    <div id="music-player-container" className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 flex flex-col items-end gap-2">
      {/* Small informative bubble */}
      {!hasStarted && !error && (
        <div className="bg-paper/95 backdrop-blur-md px-3 py-1.5 border border-outline-variant/30 rounded-full shadow-md text-[10px] font-sans tracking-widest text-sage animate-bounce font-medium uppercase">
          ♫ Activar Música
        </div>
      )}

      {error && (
        <div className="bg-paper/95 backdrop-blur-md px-3 py-1.5 border border-outline-variant/30 rounded-full shadow-md text-[10px] font-sans tracking-widest text-primary font-medium uppercase">
          {error}
        </div>
      )}

      {/* Main control player */}
      <div className="bg-paper/90 backdrop-blur-lg border border-outline-variant/25 p-2 rounded-full shadow-xl flex items-center gap-2">
        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-ink text-paper hover:bg-sage flex items-center justify-center transition-all duration-300 shadow-md group"
          title={isPlaying ? "Pausar música" : "Reproducir música"}
          aria-label={isPlaying ? "Pausar música" : "Reproducir música"}
        >
          {isPlaying ? (
            <Pause size={16} className="text-paper group-hover:scale-110 transition-transform" />
          ) : (
            <Play size={16} className="text-paper ml-0.5 group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Animated Visualizer Waves */}
        {isPlaying && (
          <div className="flex items-end gap-0.5 h-4 px-2">
            <span className="w-0.5 bg-sage animate-[bounce_1s_infinite_100ms] h-3"></span>
            <span className="w-0.5 bg-sage animate-[bounce_1s_infinite_300ms] h-4"></span>
            <span className="w-0.5 bg-sage animate-[bounce_1s_infinite_200ms] h-2"></span>
            <span className="w-0.5 bg-sage animate-[bounce_1s_infinite_400ms] h-3"></span>
          </div>
        )}

        {/* Mute toggle button */}
        {hasStarted && (
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center text-secondary hover:text-ink transition-colors"
            title={isMuted ? "Desactivar silencio" : "Silenciar"}
            aria-label={isMuted ? "Desactivar silencio" : "Silenciar"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
