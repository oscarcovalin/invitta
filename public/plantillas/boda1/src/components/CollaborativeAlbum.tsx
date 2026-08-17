import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Upload, Trash2, Heart, Download, Sparkles } from "lucide-react";

interface AlbumPhoto {
  id: string;
  src: string;
  guestName: string;
  message?: string;
  timestamp: string;
  likes: number;
}

// Beautiful initial seed photos representing a premium elegant Quinceañera celebration
const SEED_PHOTOS: AlbumPhoto[] = [
  {
    id: "seed-1",
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600",
    guestName: "Familia Zavala",
    message: "¡La ceremonia estuvo hermosa! Muy orgullosos de ustedes, Ana Camila y Carlos.",
    timestamp: "12/07/2026, 17:45 P.M.",
    likes: 8
  },
  {
    id: "seed-2",
    src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600",
    guestName: "Mariana Rojas",
    message: "¡Qué bonita boda! El primer baile de esposos me hizo llorar. ¡Felicidades! 🎉",
    timestamp: "12/07/2026, 20:50 P.M.",
    likes: 15
  },
  {
    id: "seed-3",
    src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=600",
    guestName: "Santiago & Sofía",
    message: "Brindando por su amor eterno en este día tan especial. ¡A disfrutar la noche!",
    timestamp: "12/07/2026, 21:15 P.M.",
    likes: 12
  }
];

export function CollaborativeAlbum() {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [guestName, setGuestName] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({});
  const [zoomPhoto, setZoomPhoto] = useState<AlbumPhoto | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load photos from localStorage and combine with seed photos
  useEffect(() => {
    const saved = localStorage.getItem("collaborative_album_photos");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPhotos([...parsed, ...SEED_PHOTOS]);
      } catch (e) {
        console.error("Error reading collaborative album photos", e);
        setPhotos(SEED_PHOTOS);
      }
    } else {
      setPhotos(SEED_PHOTOS);
    }

    const savedLikes = localStorage.getItem("collaborative_album_likes");
    if (savedLikes) {
      try {
        setLikedPhotos(JSON.parse(savedLikes));
      } catch (e) {}
    }
  }, []);

  const savePhotosToStorage = (updatedPhotos: AlbumPhoto[]) => {
    // We only save custom uploaded photos to localStorage to avoid duplicating seed photos
    const customPhotos = updatedPhotos.filter(p => !p.id.startsWith("seed-"));
    localStorage.setItem("collaborative_album_photos", JSON.stringify(customPhotos));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona únicamente archivos de imagen.");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl || !selectedFile) return;

    setUploading(true);
    setUploadProgress(10);

    // Beautiful simulated premium upload animation
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 15;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        const newPhoto: AlbumPhoto = {
          id: "custom-" + Date.now(),
          src: previewUrl,
          guestName: guestName.trim() || "Invitado Especial",
          message: photoMessage.trim() || undefined,
          timestamp: new Date().toLocaleString("es-MX", { 
            hour: "2-digit", 
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          }) + " P.M.",
          likes: 0
        };

        const updated = [newPhoto, ...photos];
        setPhotos(updated);
        savePhotosToStorage(updated);

        // Reset state
        setUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        setPreviewUrl(null);
        setGuestName("");
        setPhotoMessage("");
      }, 400);
    }, 1200);
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyLiked = !!likedPhotos[id];
    const newLiked = { ...likedPhotos, [id]: !isCurrentlyLiked };
    setLikedPhotos(newLiked);
    localStorage.setItem("collaborative_album_likes", JSON.stringify(newLiked));

    const updated = photos.map(photo => {
      if (photo.id === id) {
        return { ...photo, likes: photo.likes + (isCurrentlyLiked ? -1 : 1) };
      }
      return photo;
    });
    setPhotos(updated);
    savePhotosToStorage(updated);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Estás seguro de que deseas eliminar esta fotografía del álbum colaborativo?")) {
      const updated = photos.filter(p => p.id !== id);
      setPhotos(updated);
      savePhotosToStorage(updated);
    }
  };

  const copyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowCopiedAlert(true);
      setTimeout(() => setShowCopiedAlert(false), 2500);
    });
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <section id="collaborative-album" className="py-24 px-margin-mobile bg-paper relative overflow-hidden">
      {/* Decorative luxury lines background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(223,186,107,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-sage/20 to-transparent"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Elegant Title Block */}
        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 mb-16"
        >
          <span className="text-subheading-caps text-sage tracking-[0.4em] flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-champagne-gold stroke-[1.5]" />
            Álbum de los Invitados
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-ink font-light tracking-tight">
            Álbum Colaborativo
          </h2>
          <p className="text-on-surface-variant text-xs uppercase tracking-widest">
            Comparte tus mejores momentos capturados durante nuestro evento
          </p>
          <div className="w-16 h-[1.5px] bg-champagne-gold/40 mx-auto pt-2"></div>
        </motion.div>

        {/* Dynamic Interactive Panel: QR Code Card & Upload Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-20">
          
          {/* LEFT: Premium QR Code Card with Luxury Gold Borders */}
          <motion.div
            initial={{ opacity: 0, x: -30, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 bg-surface-container-low text-ink p-8 md:p-10 border border-outline-variant/30 flex flex-col justify-between relative shadow-2xl rounded-xs"
          >
            {/* Fine internal golden lining */}
            <div className="absolute inset-2.5 border border-champagne-gold/15 pointer-events-none rounded-xs"></div>

            <div className="space-y-6 relative z-10 text-center lg:text-left">
              <span className="text-[10px] tracking-[0.3em] uppercase text-champagne-gold font-bold block">
                Escanea y Comparte
              </span>
              <h3 className="font-serif text-2xl md:text-3xl text-ink font-light leading-snug">
                Sube fotos en vivo desde tu celular
              </h3>
              <p className="text-on-surface-variant/80 text-xs leading-relaxed font-sans font-light">
                Escanea este código QR directamente en la fiesta para acceder al álbum compartido y subir tus fotografías al instante. ¡Creemos juntos un recuerdo eterno!
              </p>
            </div>

            {/* QR Code Graphic Frame */}
            <div className="my-8 flex justify-center items-center relative z-10">
              <div className="p-4 bg-white/95 rounded-sm shadow-xl border-4 border-champagne-gold/30 flex flex-col items-center gap-2 relative">
                {/* Micro gold corner tags */}
                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-champagne-gold"></div>
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-champagne-gold"></div>
                <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-champagne-gold"></div>
                <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-champagne-gold"></div>

                {/* Handcrafted Golden SVG QR Code */}
                <svg viewBox="0 0 100 100" className="w-40 h-40" fill="#1a0c17">
                  {/* Position detection patterns (top-left, top-right, bottom-left) */}
                  <rect x="0" y="0" width="30" height="30" fill="#1a0c17" rx="2" />
                  <rect x="5" y="5" width="20" height="20" fill="#fff" rx="1" />
                  <rect x="10" y="10" width="10" height="10" fill="#eac88b" rx="1" />

                  <rect x="70" y="0" width="30" height="30" fill="#1a0c17" rx="2" />
                  <rect x="75" y="5" width="20" height="20" fill="#fff" rx="1" />
                  <rect x="80" y="10" width="10" height="10" fill="#eac88b" rx="1" />

                  <rect x="0" y="70" width="30" height="30" fill="#1a0c17" rx="2" />
                  <rect x="5" y="75" width="20" height="20" fill="#fff" rx="1" />
                  <rect x="10" y="80" width="10" height="10" fill="#eac88b" rx="1" />

                  {/* Randomized realistic QR patterns representing a custom URL */}
                  <rect x="40" y="0" width="10" height="10" fill="#eac88b" />
                  <rect x="50" y="10" width="10" height="10" fill="#1a0c17" />
                  <rect x="40" y="20" width="10" height="10" fill="#1a0c17" />
                  <rect x="55" y="20" width="10" height="10" fill="#eac88b" />

                  <rect x="0" y="40" width="10" height="10" fill="#eac88b" />
                  <rect x="10" y="50" width="10" height="10" fill="#1a0c17" />
                  <rect x="20" y="40" width="10" height="10" fill="#eac88b" />

                  <rect x="70" y="40" width="10" height="10" fill="#eac88b" />
                  <rect x="80" y="50" width="10" height="10" fill="#1a0c17" />
                  <rect x="90" y="40" width="10" height="10" fill="#eac88b" />
                  
                  <rect x="40" y="40" width="20" height="20" fill="#1a0c17" rx="1" />
                  <rect x="45" y="45" width="10" height="10" fill="#fff" rx="0.5" />

                  <rect x="40" y="70" width="10" height="10" fill="#eac88b" />
                  <rect x="50" y="80" width="10" height="10" fill="#1a0c17" />
                  <rect x="40" y="90" width="10" height="10" fill="#1a0c17" />
                  <rect x="55" y="90" width="10" height="10" fill="#eac88b" />

                  <rect x="80" y="80" width="15" height="15" fill="#eac88b" />
                  <rect x="85" y="85" width="5" height="5" fill="#1a0c17" />
                </svg>

                {/* Micro emblem in the middle or bottom */}
                <span className="text-[8px] tracking-[0.1em] font-serif uppercase text-[#9c5d72] font-bold">
                  Ana Camila &amp; Carlos • Boda
                </span>
              </div>
            </div>

            {/* Link copier */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={copyLink}
                className="w-full py-3 px-6 border border-champagne-gold/30 hover:border-champagne-gold text-champagne-gold text-[10px] tracking-[0.25em] font-semibold uppercase rounded-xs transition-all duration-300 bg-transparent cursor-pointer flex items-center justify-center gap-2 hover:bg-white/5 active:scale-95"
              >
                <span>COPIAR ENLACE DE COMPARTIR</span>
              </button>
              
              <AnimatePresence>
                {showCopiedAlert && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-champagne-gold text-ink text-[10px] uppercase font-bold tracking-widest py-2 px-4 shadow-lg rounded-xs whitespace-nowrap"
                  >
                    ¡Enlace Copiado con éxito!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>

          {/* RIGHT: High-End Upload Card (supports drag-and-drop & click select) */}
          <motion.div
            initial={{ opacity: 0, x: 30, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 bg-surface-container-low p-8 md:p-10 border border-outline-variant/35 flex flex-col justify-between shadow-xl relative rounded-xs"
          >
            {/* Soft decorative flower corner frame */}
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-30">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full rotate-90">
                <path d="M0 0 C 30 10, 40 40, 10 100 Z" fill="#dfba6b" opacity="0.2" />
                <path d="M0 0 Q 30 30 60 100" stroke="#eac88b" strokeWidth="0.5" opacity="0.3" />
              </svg>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-6 flex-grow flex flex-col justify-between">
              
              <div className="space-y-4">
                <span className="text-[10px] tracking-[0.25em] text-sage font-bold uppercase block">
                  Cargar Fotografía
                </span>
                <h3 className="font-serif text-xl md:text-2xl text-ink font-normal">
                  Sube una foto desde esta pantalla
                </h3>
              </div>

              {/* UPLOAD TRIGGER DRAG-AND-DROP ZONE */}
              {!previewUrl ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerSelectFile}
                  className={`mt-6 mb-6 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xs cursor-pointer transition-all duration-300 min-h-[180px] ${
                    dragActive 
                      ? "border-champagne-gold bg-champagne-gold/5" 
                      : "border-sage/30 hover:border-sage hover:bg-white/5"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />

                  <div className="p-4 bg-paper rounded-full shadow-md border border-sage/10 text-sage/80 mb-4 transition-transform duration-500 group-hover:scale-105">
                    <Camera className="w-8 h-8 stroke-[1.2]" />
                  </div>
                  
                  <p className="font-serif italic text-sm text-ink/80 text-center">
                    Arrastra tu fotografía aquí o <span className="text-sage underline hover:text-ink font-normal">haz clic para examinar</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-sage/60 mt-2">
                    Formatos soportados: JPG, PNG • Máx 10MB
                  </p>
                </div>
              ) : (
                /* FILE CHOSEN PREVIEW GRID */
                <div className="mt-4 mb-4 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  {/* Miniature preview image */}
                  <div className="sm:col-span-4 relative aspect-[4/3] sm:aspect-square w-full overflow-hidden border border-outline-variant rounded-xs bg-surface-container-low/50">
                    <img 
                      src={previewUrl} 
                      alt="Mini vista previa" 
                      className="w-full h-full object-cover select-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-black/75 hover:bg-black p-2 text-white rounded-full transition-colors cursor-pointer"
                      title="Quitar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Text inputs (guest details) */}
                  <div className="sm:col-span-8 space-y-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-sage font-bold block mb-1">
                        Tu Nombre / Familia
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Ej. Familia Martínez o Juan Pérez"
                        className="w-full px-4 py-2 text-xs border border-outline-variant/60 focus:border-sage bg-surface-container-low rounded-xs focus:outline-none text-ink font-light tracking-wide"
                        required
                        disabled={uploading}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-sage font-bold block mb-1">
                        Mensaje o Dedicatoria (Opcional)
                      </label>
                      <input
                        type="text"
                        value={photoMessage}
                        onChange={(e) => setPhotoMessage(e.target.value)}
                        placeholder="¡Felicidades en su boda!"
                        className="w-full px-4 py-2 text-xs border border-outline-variant/60 focus:border-sage bg-surface-container-low rounded-xs focus:outline-none text-ink font-light tracking-wide"
                        disabled={uploading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPLOAD BUTTONS / PROGRESS */}
              <div className="pt-4 border-t border-sage/10 relative z-10">
                {uploading ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-sage font-semibold">
                      <span>Procesando y Subiendo Imagen...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    {/* Premium sleek gold progress line */}
                    <div className="w-full h-1 bg-outline-variant overflow-hidden rounded-full">
                      <motion.div
                        className="h-full bg-champagne-gold"
                        initial={{ width: "0%" }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={!previewUrl}
                    className={`w-full py-4 text-[11px] tracking-[0.25em] font-semibold uppercase rounded-xs transition-all duration-500 flex items-center justify-center gap-2 cursor-pointer ${
                      previewUrl
                        ? "bg-primary text-ink hover:bg-champagne-gold hover:text-paper shadow-lg"
                        : "bg-surface-container-low/50 text-on-surface-variant/30 border border-outline-variant/10 cursor-not-allowed"
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>PUBLICAR EN ÁLBUM COLABORATIVO</span>
                  </button>
                )}
              </div>

            </form>
          </motion.div>

        </div>

        {/* BRIGHT AND LIVELY GALLERY STREAM */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-sage/10 pb-4 mb-8">
            <span className="font-serif italic text-base md:text-lg text-sage">
              Recuerdos Compartidos por los Invitados ({photos.length})
            </span>
            <div className="flex gap-2">
              <span className="w-1.5 h-1.5 bg-champagne-gold rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-sage/50 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-sage/30 rounded-full"></span>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {photos.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-sage/70 italic text-sm"
              >
                Aún no hay fotos en el álbum. ¡Sé el primero en compartir!
              </motion.div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
              >
                {photos.map((photo) => {
                  const isCustom = photo.id.startsWith("custom-");
                  const isLiked = !!likedPhotos[photo.id];

                  return (
                    <motion.div
                      layout
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, y: 20 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="bg-surface-container-low border border-outline-variant/30 rounded-xs overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
                    >
                      {/* Interactive Visual Photo Frame */}
                      <div 
                        onClick={() => setZoomPhoto(photo)}
                        className="relative aspect-[4/3] overflow-hidden bg-surface-container-low/50 cursor-zoom-in"
                      >
                        <img
                          src={photo.src}
                          alt={`Foto subida por ${photo.guestName}`}
                          className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Elegant overlay on hover */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <span className="bg-paper/90 text-ink text-[10px] uppercase tracking-widest py-2 px-4 shadow-md rounded-xs">
                            Ver Ampliada
                          </span>
                        </div>

                        {/* Top corner customized delete key if is custom */}
                        {isCustom && (
                          <button
                            onClick={(e) => handleDelete(photo.id, e)}
                            className="absolute top-2 right-2 bg-black/60 hover:bg-red-900/90 p-2 text-white rounded-full transition-all duration-300 z-10 cursor-pointer"
                            title="Eliminar de mi galería local"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Photo details block */}
                      <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
                        
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-ink uppercase tracking-wider block">
                            {photo.guestName}
                          </span>
                          <span className="text-[9px] font-mono text-sage block">
                            {photo.timestamp}
                          </span>
                          
                          {photo.message && (
                            <p className="font-serif italic text-xs text-ink/75 leading-relaxed pt-2">
                              "{photo.message}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                          {/* Like reaction button */}
                          <button
                            onClick={(e) => handleLike(photo.id, e)}
                            className="flex items-center gap-1.5 text-sage hover:text-champagne-gold transition-colors cursor-pointer select-none group/btn"
                          >
                            <Heart 
                              className={`w-4 h-4 transition-all duration-300 ${
                                isLiked 
                                  ? "fill-champagne-gold text-champagne-gold scale-110" 
                                  : "text-sage group-hover/btn:scale-110"
                              }`} 
                            />
                            <span className="text-[10px] uppercase tracking-widest">
                              {photo.likes} {photo.likes === 1 ? "Me Gusta" : "Me Gusta"}
                            </span>
                          </button>

                          {/* Download visual mock-up */}
                          <a
                            href={photo.src}
                            download={`boda-recuerdo-${photo.id}.jpg`}
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-sage/60 hover:text-ink font-semibold uppercase tracking-wider flex items-center gap-1"
                            title="Descargar Foto"
                          >
                            <Download className="w-3 h-3" />
                            <span>Descargar</span>
                          </a>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* GORGEOUS MODAL LIGHTBOX FOR ENLARGING COLLABORATIVE PHOTOS */}
      <AnimatePresence>
        {zoomPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-[#10121e]/98 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
            onClick={() => setZoomPhoto(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setZoomPhoto(null)}
              className="absolute top-6 right-6 text-paper/60 hover:text-white p-3 transition-colors cursor-pointer z-150 rounded-full hover:bg-white/5"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-1">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Large Image container with caption */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-h-[75vh] max-w-[90vw] md:max-w-[65vw] flex flex-col justify-center items-center pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomPhoto.src}
                alt={`Fotografía subida por ${zoomPhoto.guestName}`}
                className="max-h-[65vh] max-w-full object-contain border border-white/5 shadow-2xl rounded-xs select-none"
                referrerPolicy="no-referrer"
              />

              <div className="text-center mt-6 text-white space-y-2 max-w-lg">
                <h4 className="font-serif text-lg tracking-wide">
                  {zoomPhoto.guestName}
                </h4>
                <p className="text-stone-400 text-xs font-mono">
                  {zoomPhoto.timestamp}
                </p>
                {zoomPhoto.message && (
                  <p className="font-serif italic text-sm text-stone-200 pt-2 leading-relaxed">
                    "{zoomPhoto.message}"
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
