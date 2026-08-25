import React, { useEffect, useRef, useState } from "react";
import { Camera, ExternalLink, Hotel, MapPin, Phone, Upload } from "lucide-react";

type HotelSuggestion = { id?: string; name?: string; phone?: string; address?: string; mapsUrl?: string };
type AlbumPhoto = { id: string; src: string; guestName: string; message?: string; createdAt?: string };
type InvitationData = {
  invitationSlug?: string;
  guestToken?: string;
  guestName?: string;
  sharedAlbumEnabled?: boolean;
  lodgingOptions?: HotelSuggestion[];
};

declare global { interface Window { INVITATION_DATA?: InvitationData; } }

/** Shared native modules for invitation templates. They remain absent until Studio enables them. */
export function InvitationExtras() {
  const invitation = window.INVITATION_DATA || {};
  const hotels = Array.isArray(invitation.lodgingOptions)
    ? invitation.lodgingOptions.filter((hotel) => hotel && hotel.name)
    : [];
  const showAlbum = invitation.sharedAlbumEnabled === true;

  if (!showAlbum && !hotels.length) return null;
  return <>
    {showAlbum && <CollaborativeAlbum invitation={invitation} />}
    {hotels.length > 0 && <LodgingSuggestions hotels={hotels} />}
  </>;
}

function CollaborativeAlbum({ invitation }: { invitation: InvitationData }) {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const canUpload = Boolean(invitation.invitationSlug && invitation.guestToken);

  useEffect(() => {
    if (!invitation.invitationSlug) return;
    fetch(`/api/shared-album?slug=${encodeURIComponent(invitation.invitationSlug)}`)
      .then((response) => response.ok ? response.json() : { photos: [] })
      .then((payload) => setPhotos(Array.isArray(payload.photos) ? payload.photos : []))
      .catch(() => setPhotos([]));
  }, [invitation.invitationSlug]);

  async function uploadPhoto() {
    if (!file || !canUpload || !invitation.invitationSlug || !invitation.guestToken) return;
    setLoading(true);
    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("No fue posible leer la fotografía."));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/shared-album", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: invitation.invitationSlug, guestToken: invitation.guestToken,
          guestName: invitation.guestName || "Invitado", message: message.trim(),
          mimeType: file.type, fileBase64
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible publicar la fotografía.");
      setPhotos((current) => [payload.photo, ...current]);
      setFile(null); setMessage("");
    } catch (error: any) {
      window.alert(error.message || "No fue posible publicar la fotografía.");
    } finally { setLoading(false); }
  }

  return <section id="collaborative-album" className="py-24 px-margin-mobile bg-surface-container-low/20 border-t border-b border-outline-variant/15">
    <div className="max-w-5xl mx-auto">
      <header className="text-center mb-12">
        <span className="text-subheading-caps text-sage tracking-[0.35em] inline-flex items-center gap-2"><Camera className="w-4 h-4" /> Recuerdos compartidos</span>
        <h2 className="font-display text-3xl md:text-5xl text-ink font-light mt-4">Álbum Colaborativo</h2>
        <p className="text-sm text-on-surface-variant mt-4 max-w-xl mx-auto">Comparte tus fotografías y conserva los mejores momentos de esta celebración.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-paper border border-outline-variant/30 p-7 md:p-9 shadow-sm">
          <h3 className="font-display text-2xl text-ink">Comparte desde tu pase</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed mt-3">{canUpload ? "Elige una fotografía para publicarla en el álbum de la festejada." : "Abre el enlace personalizado que recibiste como invitado para poder subir una fotografía."}</p>
          {canUpload && <div className="mt-6 space-y-3">
            <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <button type="button" onClick={() => picker.current?.click()} className="w-full border border-sage/40 py-3 text-xs uppercase tracking-[0.18em] text-sage hover:bg-sage/10">{file ? file.name : "Elegir fotografía"}</button>
            <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={280} placeholder="Dedicatoria opcional" className="w-full border border-outline-variant/40 bg-transparent px-4 py-3 text-sm text-ink" />
            <button type="button" onClick={uploadPhoto} disabled={!file || loading} className="w-full bg-primary text-ink py-3 text-xs uppercase tracking-[0.18em] disabled:opacity-40 inline-flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> {loading ? "Publicando…" : "Publicar fotografía"}</button>
          </div>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {photos.length ? photos.map((photo) => <figure key={photo.id} className="bg-paper border border-outline-variant/25 overflow-hidden">
            <img src={photo.src} alt={`Fotografía compartida por ${photo.guestName}`} className="aspect-square w-full object-cover" loading="lazy" />
            <figcaption className="p-3 text-xs text-on-surface-variant"><strong className="block text-ink">{photo.guestName}</strong>{photo.message || ""}</figcaption>
          </figure>) : <p className="col-span-2 text-center text-sm text-on-surface-variant py-16 border border-dashed border-outline-variant/40">Aún no hay fotos compartidas.</p>}
        </div>
      </div>
    </div>
  </section>;
}

function LodgingSuggestions({ hotels }: { hotels: HotelSuggestion[] }) {
  return <section id="lodging" className="py-24 px-margin-mobile bg-paper border-b border-outline-variant/15">
    <div className="max-w-5xl mx-auto">
      <header className="text-center mb-12"><span className="text-subheading-caps text-sage tracking-[0.35em] inline-flex items-center gap-2"><Hotel className="w-4 h-4" /> Hospedaje</span><h2 className="font-display text-3xl md:text-5xl text-ink font-light mt-4">Sugerencias de Hospedaje</h2></header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{hotels.map((hotel, index) => <article key={hotel.id || `${hotel.name}-${index}`} className="border border-outline-variant/30 bg-surface-container-low/20 p-7 flex flex-col">
        <h3 className="font-display text-2xl text-ink">{hotel.name}</h3>
        {hotel.address && <p className="mt-4 text-sm text-on-surface-variant flex gap-2"><MapPin className="w-4 h-4 shrink-0 text-sage" />{hotel.address}</p>}
        {hotel.phone && <a href={`tel:${hotel.phone.replace(/[^0-9+]/g, "")}`} className="mt-3 text-sm text-on-surface-variant inline-flex gap-2 hover:text-ink"><Phone className="w-4 h-4 text-sage" />{hotel.phone}</a>}
        {hotel.mapsUrl && <a href={hotel.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-7 pt-4 border-t border-outline-variant/30 text-xs uppercase tracking-[0.18em] text-sage inline-flex gap-2 hover:text-ink"><ExternalLink className="w-4 h-4" />Cómo llegar</a>}
      </article>)}</div>
    </div>
  </section>;
}
