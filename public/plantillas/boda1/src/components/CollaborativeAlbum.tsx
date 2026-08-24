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

type InvitationData = { invitationSlug?: string; guestToken?: string; guestName?: string; sharedAlbumEnabled?: boolean };
declare global { interface Window { INVITATION_DATA?: InvitationData; } }

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
  const invitation = window.INVITATION_DATA || {};
  const canUpload = Boolean(invitation.invitationSlug && invitation.guestToken);

  useEffect(() => {
    const slug = window.INVITATION_DATA?.invitationSlug;
    if (!slug || !window.INVITATION_DATA?.sharedAlbumEnabled) return;
    fetch(`/api/shared-album?slug=${encodeURIComponent(slug)}`)
      .then((response) => response.ok ? response.json() : { photos: [] })
      .then((payload) => setPhotos((payload.photos || []).map((photo: any) => ({
        id: photo.id, src: photo.src, guestName: photo.guestName, message: photo.message,
        timestamp: new Date(photo.createdAt).toLocaleString("es-MX"), likes: 0
      }))))
      .catch(() => setPhotos([]));
  }, []);

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
    if (!canUpload) return;
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl || !selectedFile) return;
    if (!canUpload) return;
    setUploading(true);
    setUploadProgress(30);
    try {
      const response = await fetch("/api/shared-album", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: invitation.invitationSlug, guestToken: invitation.guestToken,
          guestName: guestName.trim() || invitation.guestName || "Invitado", message: photoMessage.trim(),
          mimeType: selectedFile.type, fileBase64: previewUrl })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible subir la foto.");
      setPhotos((current) => [{ id: payload.photo.id, src: payload.photo.src, guestName: payload.photo.guestName,
        message: payload.photo.message, timestamp: new Date(payload.photo.createdAt).toLocaleString("es-MX"), likes: 0 }, ...current]);
      setSelectedFile(null); setPreviewUrl(null); setPhotoMessage(""); setUploadProgress(100);
    } catch (error: any) { alert(error.message || "No fue posible subir la foto."); }
    finally { setUploading(false); setUploadProgress(0); }
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

  if (!window.INVITATION_DATA?.sharedAlbumEnabled) return null;

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
                Recuerdos compartidos
              </span>
              <h3 className="font-serif text-2xl md:text-3xl text-ink font-light leading-snug">
                Comparte fotos desde tu pase
              </h3>
              <p className="text-on-surface-variant/80 text-xs leading-relaxed font-sans font-light">
                Abre tu enlace personalizado de invitado y comparte tus fotografías. Así cada recuerdo queda asociado al evento correcto.
              </p>
            </div>

            <div className="my-8 flex justify-center items-center relative z-10">
              <div className="p-8 bg-paper rounded-sm shadow-xl border border-champagne-gold/30 text-center">
                <Camera className="w-10 h-10 text-champagne-gold mx-auto mb-3" />
                <span className="text-[9px] tracking-[0.18em] font-serif uppercase text-sage font-bold">Tu invitación es tu acceso</span>
              </div>
            </div>

            {/* Link copier */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
              {!canUpload && (
                <p className="w-full text-center text-[11px] leading-relaxed text-sage/80 border border-champagne-gold/20 bg-paper/60 px-4 py-3">
                  Para subir una foto, abre el enlace personal que recibiste como invitado.
                </p>
              )}
              {canUpload && (
                <>
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
                </>
              )}
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
                  {canUpload ? "Sube una foto desde esta pantalla" : "Comparte desde tu enlace personal"}
                </h3>
                {!canUpload && (
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    Este enlace muestra el álbum. La carga de fotos se habilita únicamente en la invitación personalizada de cada invitado.
                  </p>
                )}
              </div>

              {/* UPLOAD TRIGGER DRAG-AND-DROP ZONE */}
              {!canUpload ? (
                <div className="mt-6 mb-6 flex flex-col items-center justify-center p-8 border border-sage/20 rounded-xs min-h-[180px] bg-paper/40 text-center">
                  <Camera className="w-8 h-8 stroke-[1.2] text-sage/60 mb-4" />
                  <p className="font-serif italic text-sm text-ink/80">La carga está disponible desde tu pase personalizado.</p>
                  <p className="text-[10px] uppercase tracking-widest text-sage/60 mt-2">Pide al anfitrión tu enlace de invitado</p>
                </div>
              ) : !previewUrl ? (
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
                    disabled={!canUpload || !previewUrl}
                    className={`w-full py-4 text-[11px] tracking-[0.25em] font-semibold uppercase rounded-xs transition-all duration-500 flex items-center justify-center gap-2 cursor-pointer ${
                      canUpload && previewUrl
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
