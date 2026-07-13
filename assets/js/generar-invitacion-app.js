/**
 * Fase 7F/7G/7H/7I.2 — Generador de invitación publicable desde invitta-configuracion.json.
 * 7I.2: Renderizar portada fotográfica, galería, música y marca del estudio.
 * 100% local en el navegador. Sin Supabase. Sin APIs externas.
 */

"use strict";

let loadedConfig = null;
let finalHTML    = null;

// ─────────────────────────────────────────────
// FILE HANDLING
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const dropZone  = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");

    dropZone.addEventListener("dragover",  (e) => { e.preventDefault(); dropZone.classList.add("over"); });
    dropZone.addEventListener("dragleave", ()  => dropZone.classList.remove("over"));
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault(); dropZone.classList.remove("over");
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener("change", (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); });
});

function handleFile(file) {
    if (!file.name.endsWith(".json")) { showError("Selecciona un archivo .json válido."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.meta || !data.template || !data.event || !data.visual) {
                showError("El archivo no parece ser una configuración Invitta válida.");
                return;
            }
            loadedConfig = data;
            renderSummary(data);
        } catch { showError("Error al parsear el archivo JSON. Verifica que el archivo no esté corrupto."); }
    };
    reader.readAsText(file);
}

function showError(msg) {
    const el = document.getElementById("errorMsg");
    el.textContent = msg;
    el.style.display = "block";
}

function renderSummary(data) {
    document.getElementById("uploadCard").style.display = "none";

    const items = [
        { label: "Nombre principal",  value: data.event.primaryName },
        { label: "Nombre secundario", value: data.event.secondaryName || "—" },
        { label: "Tipo de evento",    value: data.event.type },
        { label: "Paquete",           value: data.event.packageLevel },
        { label: "Plantilla",         value: data.template.name || data.template.id || "—" },
        { label: "Nivel",             value: data.template.level || "—" },
        { label: "Paleta",            value: data.visual.palette },
        { label: "Tipografía",        value: data.visual.typography || "—" },
        { label: "Handwritten",       value: data.visual.handwritten || "—" },
        { label: "Fecha",             value: data.event.dateText || "—" },
        { label: "Generado el",       value: new Date().toLocaleDateString("es-MX", { dateStyle: "long" }) }
    ];

    const grid = document.getElementById("summaryGrid");
    grid.innerHTML = items.map(i => `
        <div class="sum-item">
            <div class="sum-label">${i.label}</div>
            <div class="sum-value">${i.value || "—"}</div>
        </div>`).join("");

    document.getElementById("summaryCard").style.display  = "block";
    document.getElementById("generateCard").style.display = "block";
}

// ─────────────────────────────────────────────
// SECURITY & MEDIA HELPERS
// ─────────────────────────────────────────────
function escapeHTML(val) {
    if (val === null || val === undefined) return "";
    return String(val)
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;")
        .replace(/'/g,  "&#39;");
}

function escapeAttribute(val) {
    return escapeHTML(val);
}

function safeHttpsUrl(value) {
    try {
        const url = new URL(String(value || "").trim());
        return url.protocol === "https:" ? url.href : null;
    } catch {
        return null;
    }
}

function cleanWhatsApp(number) {
    return String(number || "").replace(/\D/g, "");
}

function getValidMedia(d) {
    if (!d.media) return { heroImage: null, gallery: [], music: null, studioLogo: null };
    
    const heroImage = safeHttpsUrl(d.media.heroImage);
    
    const rawGallery = Array.isArray(d.media.gallery) ? d.media.gallery : [];
    const gallery = rawGallery.map(g => {
        const url = safeHttpsUrl(g.url);
        if (!url) return null;
        return {
            url,
            alt: escapeAttribute(g.alt || "Fotografía del evento"),
            orientation: ["auto", "vertical", "horizontal", "cuadrada"].includes(g.orientation) ? g.orientation : "auto"
        };
    }).filter(Boolean).slice(0, 10);
    
    let music = null;
    if (d.media.music && d.media.music.url) {
        const mUrl = safeHttpsUrl(d.media.music.url);
        if (mUrl) {
            music = {
                url: mUrl,
                title: escapeHTML(d.media.music.title || "Música de fondo"),
                autoplay: !!d.media.music.autoplay
            };
        }
    }
    
    const studioLogo = safeHttpsUrl(d.media.studioLogo);
    
    return { heroImage, gallery, music, studioLogo };
}

function getValidStudio(d) {
    if (!d.studio) return { name: "", whatsapp: "", website: null };
    return {
        name: escapeHTML(d.studio.name || ""),
        whatsapp: cleanWhatsApp(d.studio.whatsapp),
        website: safeHttpsUrl(d.studio.website)
    };
}

// ─────────────────────────────────────────────
// COLOR HELPERS
// ─────────────────────────────────────────────
function isDarkColor(hex) {
    if (!hex || typeof hex !== "string") return false;
    const clean = hex.replace("#", "").trim();
    let r, g, b;
    if (clean.length === 3) {
        r = parseInt(clean[0] + clean[0], 16);
        g = parseInt(clean[1] + clean[1], 16);
        b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length === 6) {
        r = parseInt(clean.slice(0,2), 16);
        g = parseInt(clean.slice(2,4), 16);
        b = parseInt(clean.slice(4,6), 16);
    } else { return false; }
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.4;
}

// ─────────────────────────────────────────────
// PALETTE & TYPOGRAPHY MAPS
// ─────────────────────────────────────────────
function getPaletteColors(name, custom) {
    const palettes = {
        "Rosa Champagne":    { bg:"#faf8f5", surface:"#fdfbfa", accent:"#c48473", text:"#4a4443", muted:"#8a7a65", hero:"rgba(196,132,115,0.12)" },
        "Lavanda Dream":     { bg:"#f8f6fa", surface:"#f2eef7", accent:"#9d8cb3", text:"#3b3542", muted:"#8b8594", hero:"rgba(157,140,179,0.15)" },
        "Cool Blue":         { bg:"#f4f7f9", surface:"#eef3f7", accent:"#6c8da8", text:"#2c3e50", muted:"#7f8c8d", hero:"rgba(108,141,168,0.15)" },
        "Olive Romance":     { bg:"#f5f6f4", surface:"#eff0ec", accent:"#7a8471", text:"#3a4035", muted:"#8a9481", hero:"rgba(122,132,113,0.12)" },
        "Terracotta Sunset": { bg:"#faf5f3", surface:"#f7efec", accent:"#b86b53", text:"#4a332d", muted:"#9a837d", hero:"rgba(184,107,83,0.12)" },
        "Plum Noir VIP":     { bg:"#1a1514", surface:"#2a2220", accent:"#dfba6b", text:"#f0eade", muted:"#8a7a65", hero:"rgba(0,0,0,0.5)" },
        "Jade Garden":       { bg:"#f0f4f1", surface:"#e6ede8", accent:"#4a7c59", text:"#233d2b", muted:"#708c78", hero:"rgba(74,124,89,0.12)" },
        "Personalizada":     { bg:"#f9f9f9", surface:"#f0f0f0", accent:"#aaaaaa", text:"#111111", muted:"#666666", hero:"rgba(0,0,0,0.06)", customNote: custom }
    };
    return palettes[name] || palettes["Rosa Champagne"];
}

function getTypography(typoName, handName) {
    const typos = {
        "Clásica Editorial": { title:"'Cormorant Garamond', serif",  body:"'Jost', sans-serif" },
        "Romántica Fina":    { title:"'Playfair Display', serif",    body:"'Montserrat', sans-serif" },
        "Lujo Nocturno":     { title:"'Bodoni Moda', serif",         body:"'Lato', sans-serif" },
        "Moderna Minimal":   { title:"'Libre Baskerville', serif",   body:"'Inter', sans-serif" },
        "Jardín Romántico":  { title:"'Lora', serif",                body:"'Nunito Sans', sans-serif" },
        "Glam Editorial":    { title:"'Cinzel', serif",              body:"'Raleway', sans-serif" }
    };
    const hands = {
        "Handwritten Romántica":   "'Great Vibes', cursive",
        "Handwritten Moderna":     "'Parisienne', cursive",
        "Handwritten de Lujo":     "'Allura', cursive",
        "Handwritten Orgánica":    "'Sacramento', cursive",
        "Handwritten Sofisticada": "'Alex Brush', cursive"
    };
    const base = typos[typoName] || typos["Romántica Fina"];
    const hand = hands[handName] || null;
    return { title: base.title, body: base.body, accent: hand || base.title };
}

function buildGoogleFontsUrl(typoName, handName) {
    const families = new Set();
    const typoMap = {
        "Clásica Editorial": ["Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400", "Jost:wght@300;400;500;600"],
        "Romántica Fina":    ["Playfair+Display:ital,wght@0,400;0,600;0,700;1,400",          "Montserrat:wght@300;400;500;600"],
        "Lujo Nocturno":     ["Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400",     "Lato:wght@300;400;700"],
        "Moderna Minimal":   ["Libre+Baskerville:ital,wght@0,400;0,700;1,400",               "Inter:wght@300;400;500;600"],
        "Jardín Romántico":  ["Lora:ital,wght@0,400;0,600;1,400",                            "Nunito+Sans:wght@300;400;600"],
        "Glam Editorial":    ["Cinzel:wght@400;600;700",                                      "Raleway:wght@300;400;500;600"]
    };
    const handMap = {
        "Handwritten Romántica":   "Great+Vibes",
        "Handwritten Moderna":     "Parisienne",
        "Handwritten de Lujo":     "Allura",
        "Handwritten Orgánica":    "Sacramento",
        "Handwritten Sofisticada": "Alex+Brush"
    };
    (typoMap[typoName] || typoMap["Romántica Fina"]).forEach(f => families.add(f));
    if (handMap[handName]) families.add(handMap[handName]);
    return `https://fonts.googleapis.com/css2?family=${[...families].join("&family=")}&display=swap`;
}

function getTemplateDesign(templateId, visual) {
    const safeId = (templateId || "generic").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const designs = {
        "xv-elegance-basic": { layout: "classic-xv", heroStyle: "light", sectionStyle: "clean", ornaments: ["divider"], buttonStyle: "classic", animationLevel: "none" },
        "xv-rose-gold-premium": { layout: "rose-premium", heroStyle: "gradient", sectionStyle: "soft", ornaments: ["divider", "floral"], buttonStyle: "soft", animationLevel: "subtle" },
        "xv-champagne-rose-vip": { layout: "champagne-vip", heroStyle: "shimmer", sectionStyle: "prestige", ornaments: ["divider", "sparkle", "gold-frame"], buttonStyle: "gold", animationLevel: "medium" },
        "boda-classic-basic": { layout: "classic-wedding", heroStyle: "light", sectionStyle: "clean", ornaments: ["divider"], buttonStyle: "classic", animationLevel: "none" },
        "boda-golden-romance-premium": { layout: "golden-romance", heroStyle: "warm", sectionStyle: "romantic", ornaments: ["divider", "gold-frame"], buttonStyle: "gold", animationLevel: "subtle" },
        "boda-midnight-gold-vip": { layout: "midnight-luxury", heroStyle: "dark", sectionStyle: "luxury", ornaments: ["divider", "sparkle", "gold-frame"], buttonStyle: "luxury", animationLevel: "medium" }
    };
    const base = designs[templateId] || { layout: "generic", heroStyle: "light", sectionStyle: "clean", ornaments: [], buttonStyle: "classic", animationLevel: "none" };
    return { ...base, safeId };
}

// ─────────────────────────────────────────────
// HTML BUILDER — SECTIONS
// ─────────────────────────────────────────────
function buildSections(d, p, t, design, media, studio) {
    const hasDivider   = design?.ornaments?.includes("divider");
    const isBoda       = d.event.type === "boda";
    const waText       = encodeURIComponent(`Hola, confirmo mi asistencia al evento de ${d.event.primaryName}`);
    let s = "";

    const sTag = hasDivider
        ? (label) => `<div class="ornament-line" aria-hidden="true"></div><div class="section-tag">${escapeHTML(label)}</div><div class="ornament-line" aria-hidden="true"></div>`
        : (label) => `<div class="section-tag">${escapeHTML(label)}</div>`;

    // A · HERO
    const baseHeroClass = `hero hero-${design?.heroStyle || "light"}`;
    const heroClass = media.heroImage ? `${baseHeroClass} has-hero-image` : baseHeroClass;
    
    s += `
  <!-- HERO -->
  <section class="${heroClass}" aria-label="Portada">
    ${media.heroImage ? `<img class="hero-background-image" src="${escapeAttribute(media.heroImage)}" alt="" aria-hidden="true" loading="eager" decoding="async">
    <div class="hero-overlay" aria-hidden="true"></div>` : ""}
    <div class="hero-inner">
      <div class="eyebrow">${isBoda ? "Nuestra Boda" : "Mis XV Años"}</div>
      <div class="hero-names">
        <span class="name-accent">${escapeHTML(d.event.primaryName)}</span>
        ${isBoda && d.event.secondaryName ? `
        <span class="ampersand" aria-hidden="true">&amp;</span>
        <span class="name-accent">${escapeHTML(d.event.secondaryName)}</span>` : ""}
      </div>
      ${d.event.initials ? `<div class="initials" aria-hidden="true">${escapeHTML(d.event.initials)}</div>` : ""}
      ${d.event.dateText ? `<div class="hero-date">${escapeHTML(d.event.dateText)}</div>` : ""}
      ${d.event.quote    ? `<blockquote class="hero-quote">${escapeHTML(d.event.quote)}</blockquote>` : ""}
    </div>
  </section>`;

    // B · COUNTDOWN
    if (d.event.countdownDateTime) {
        s += `
  <!-- COUNTDOWN -->
  <section class="section countdown-section" aria-label="Cuenta regresiva">
    <div class="section-inner">
      ${sTag("Faltan")}
      <div class="countdown" role="timer" aria-live="polite">
        <div class="cd-block"><span class="cd-num" id="cd-days">00</span><span class="cd-label">Días</span></div>
        <div class="cd-sep" aria-hidden="true">:</div>
        <div class="cd-block"><span class="cd-num" id="cd-hours">00</span><span class="cd-label">Horas</span></div>
        <div class="cd-sep" aria-hidden="true">:</div>
        <div class="cd-block"><span class="cd-num" id="cd-mins">00</span><span class="cd-label">Minutos</span></div>
        <div class="cd-sep" aria-hidden="true">:</div>
        <div class="cd-block"><span class="cd-num" id="cd-secs">00</span><span class="cd-label">Segundos</span></div>
      </div>
    </div>
  </section>`;
    }

    // C · FAMILIA
    const hp = d.family?.hostParents || {};
    const sp = d.family?.secondaryParents || {};
    const hasFam = hp.mother || hp.father || sp.mother || sp.father || d.family?.godparents;
    if (hasFam) {
        s += `
  <!-- FAMILIA -->
  <section class="section surface family-section" aria-label="Familia">
    <div class="section-inner">
      ${sTag("Con la bendición de Dios y nuestros padres")}
      ${(hp.mother || hp.father) ? `<div class="family-block">${[hp.mother, hp.father].filter(Boolean).map(n => `<p class="family-name">${escapeHTML(n)}</p>`).join("")}</div>` : ""}
      ${(sp.mother || sp.father) ? `<div class="divider-line" aria-hidden="true"></div><div class="family-block">${[sp.mother, sp.father].filter(Boolean).map(n => `<p class="family-name">${escapeHTML(n)}</p>`).join("")}</div>` : ""}
      ${d.family?.godparents ? `<div class="godparents">${sTag("Padrinos")}<p class="family-name">${escapeHTML(d.family.godparents)}</p></div>` : ""}
    </div>
  </section>`;
    }

    // D · CEREMONIA
    const cer = d.locations?.ceremony;
    if (cer?.title) {
        const mapsUrl = cer.mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cer.mapQuery)}` : null;
        s += `
  <!-- CEREMONIA -->
  <section class="section location-card ceremony-card" aria-label="Ceremonia">
    <div class="section-inner">
      ${sTag(cer.title)}
      <div class="event-time">${escapeHTML(cer.time)}</div>
      <div class="event-place">${escapeHTML(cer.place)}</div>
      <div class="event-address">${escapeHTML(cer.address)}</div>
      ${mapsUrl ? `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-map" aria-label="Ver ubicación de la ceremonia en Google Maps"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Ver ubicación</a>` : ""}
    </div>
  </section>`;
    }

    // E · RECEPCIÓN
    const rec = d.locations?.reception;
    if (rec?.title) {
        const mapsUrl = rec.mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.mapQuery)}` : null;
        s += `
  <!-- RECEPCION -->
  <section class="section surface location-card reception-card" aria-label="Recepción">
    <div class="section-inner">
      ${sTag(rec.title)}
      <div class="event-time">${escapeHTML(rec.time)}</div>
      <div class="event-place">${escapeHTML(rec.place)}</div>
      <div class="event-address">${escapeHTML(rec.address)}</div>
      ${mapsUrl ? `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-map" aria-label="Ver ubicación de la recepción en Google Maps"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Ver ubicación</a>` : ""}
    </div>
  </section>`;
    }

    // F · ITINERARIO
    const iti = d.itinerary || [];
    if (iti.length > 0) {
        s += `
  <!-- ITINERARIO -->
  <section class="section itinerary-section" aria-label="Itinerario">
    <div class="section-inner">
      ${sTag("Itinerario")}
      <div class="iti-list">
        ${iti.map(item => `
        <div class="iti-item">
          <div class="iti-marker" aria-hidden="true"></div>
          <span class="iti-time">${escapeHTML(item.time)}</span>
          <div class="iti-body">
            <span class="iti-title">${escapeHTML(item.title)}</span>
            ${item.description ? `<span class="iti-desc">${escapeHTML(item.description)}</span>` : ""}
          </div>
        </div>`).join("")}
      </div>
    </div>
  </section>`;
    }

    // G · GALERÍA (NUEVO)
    if (media.gallery && media.gallery.length > 0) {
        s += `
  <!-- GALERIA -->
  <section class="section gallery-section" aria-label="Galería de fotografías">
    <div class="section-inner">
      ${sTag("Nuestros Recuerdos")}
      <div class="invitta-gallery">
        ${media.gallery.map((img, i) => `
        <button type="button" class="gallery-item orientation-${img.orientation}" data-index="${i}" aria-label="Ver fotografía ${i+1} en pantalla completa">
          <img src="${escapeAttribute(img.url)}" alt="${img.alt}" loading="lazy" decoding="async">
        </button>`).join("")}
      </div>
    </div>
  </section>`;
    }

    // H · DRESS CODE
    const dc = d.dressCode;
    if (dc?.title) {
        s += `
  <!-- DRESS CODE -->
  <section class="section surface" aria-label="Dress Code">
    <div class="section-inner">
      ${sTag(dc.title)}
      ${dc.women?.desc ? `<div class="dress-group"><b>${escapeHTML(dc.women.title || "Mujeres")}:</b> ${escapeHTML(dc.women.desc)}${dc.women.note ? `<br><em>${escapeHTML(dc.women.note)}</em>` : ""}</div>` : ""}
      ${dc.men?.desc   ? `<div class="dress-group"><b>${escapeHTML(dc.men.title   || "Hombres")}:</b> ${escapeHTML(dc.men.desc)}</div>` : ""}
    </div>
  </section>`;
    }

    // I · MESA DE REGALOS
    const reg    = d.registry;
    const hasReg = reg && (reg.lluviaSobres || (reg.options && reg.options.length > 0));
    if (hasReg) {
        const regButtons = (reg.options || []).map(o => {
            const url = safeHttpsUrl(o.url);
            return url ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="btn-map" aria-label="Ver mesa de regalos ${escapeHTML(o.name)}">${escapeHTML(o.name)}</a>` : "";
        }).filter(Boolean).join("");

        s += `
  <!-- MESA REGALOS -->
  <section class="section registry-section" aria-label="Mesa de Regalos">
    <div class="section-inner">
      ${sTag("Mesa de Regalos")}
      ${reg.description ? `<p class="section-desc">${escapeHTML(reg.description)}</p>` : ""}
      ${reg.lluviaSobres ? `<div class="lluvia"><i class="fa-solid fa-envelope-open-text" aria-hidden="true"></i><p>Lluvia de Sobres</p></div>` : ""}
      ${regButtons}
    </div>
  </section>`;
    }

    // J · HOSPEDAJE
    const lod = d.lodging;
    if (lod?.enabled && lod.options?.length > 0) {
        s += `
  <!-- HOSPEDAJE -->
  <section class="section surface lodging-section" aria-label="Hospedaje">
    <div class="section-inner">
      ${sTag("Hospedaje sugerido")}
      ${lod.description ? `<p class="section-desc">${escapeHTML(lod.description)}</p>` : ""}
      ${lod.options.map(h => {
          const url = safeHttpsUrl(h.url);
          return `<div class="hotel-card">
        <strong>${escapeHTML(h.name)}</strong>
        ${h.address ? `<p>${escapeHTML(h.address)}</p>` : ""}
        ${h.phone   ? `<p>${escapeHTML(h.phone)}</p>` : ""}
        ${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="btn-map" aria-label="Ver información del hotel ${escapeHTML(h.name)}">Ver información</a>` : ""}
      </div>`;
      }).join("")}
    </div>
  </section>`;
    }

    // K · RSVP
    const rsvp = d.rsvp;
    if (rsvp?.title) {
        const waButtons = (rsvp.whatsappNumbers || []).map(num => {
            const clean = cleanWhatsApp(num);
            if (clean.length < 10) return "";
            const waUrl = `https://wa.me/${clean}?text=${waText}`;
            return `<a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp" aria-label="Confirmar asistencia por WhatsApp al número ${clean}"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Confirmar al +${clean}</a>`;
        }).filter(Boolean).join("");

        s += `
  <!-- RSVP -->
  <section class="section rsvp-section" aria-label="Confirmar Asistencia">
    <div class="section-inner">
      ${sTag(rsvp.title)}
      ${rsvp.description ? `<p class="section-desc">${escapeHTML(rsvp.description)}</p>` : ""}
      ${waButtons}
    </div>
  </section>`;
    }

    // L · CRÉDITOS
    s += buildCredits(studio, media);

    return s;
}

// ─────────────────────────────────────────────
// COMPONENT BUILDERS (NEW)
// ─────────────────────────────────────────────
function buildCredits(studio, media) {
    const hasStudio = studio.name || studio.whatsapp || studio.website || media.studioLogo;
    
    let logoHTML = media.studioLogo ? `<img src="${escapeAttribute(media.studioLogo)}" alt="Logotipo del estudio" class="studio-logo" loading="lazy" decoding="async">` : "";
    let nameHTML = "";
    
    if (studio.name) {
        if (studio.website) {
            nameHTML = `<p>Invitación creada por <a href="${escapeAttribute(studio.website)}" target="_blank" rel="noopener noreferrer">${studio.name}</a></p>`;
        } else {
            nameHTML = `<p>Invitación creada por <strong>${studio.name}</strong></p>`;
        }
    } else {
        nameHTML = `<p>Invitación digital creada con <strong>Invitta</strong></p>`;
    }
    
    let waHTML = "";
    if (studio.whatsapp && studio.whatsapp.length >= 10) {
        const waText = encodeURIComponent("Hola, me interesa una invitación digital");
        waHTML = `<a href="https://wa.me/${studio.whatsapp}?text=${waText}" target="_blank" rel="noopener noreferrer" class="btn-studio-wa" aria-label="Contactar al estudio por WhatsApp">¿Cómo contratar?</a>`;
    }
    
    let invittaTag = hasStudio ? `<p class="tech-tag">Tecnología Invitta</p>` : "";
    
    return `
  <!-- CREDITS -->
  <footer class="credits">
    ${logoHTML}
    ${nameHTML}
    ${waHTML}
    ${invittaTag}
  </footer>`;
}

function buildLightboxHTML() {
    return `
  <!-- LIGHTBOX -->
  <div class="lightbox" id="invittaLightbox" hidden aria-modal="true" role="dialog" aria-label="Visor de fotografías">
    <button class="lightbox-close" id="lbClose" type="button" aria-label="Cerrar fotografía">&times;</button>
    <button class="lightbox-prev" id="lbPrev" type="button" aria-label="Fotografía anterior">&#10094;</button>
    <img id="lightboxImage" src="" alt="">
    <button class="lightbox-next" id="lbNext" type="button" aria-label="Fotografía siguiente">&#10095;</button>
  </div>`;
}

function buildMusicHTML(music) {
    if (!music) return "";
    return `
  <!-- MUSIC PLAYER -->
  <audio id="invittaAudio" preload="metadata" src="${escapeAttribute(music.url)}"></audio>
  <div class="music-player" id="musicPlayer">
    <button type="button" class="music-toggle" id="musicToggle" aria-label="Reproducir música" aria-pressed="false">
      <i class="fa-solid fa-play"></i>
    </button>
    <div class="music-info">
      <span class="music-label">Música</span>
      <span class="music-title">${music.title}</span>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// EMBEDDED JS SCRIPTS
// ─────────────────────────────────────────────
function buildCountdownJS(targetDateTime) {
    return `
  <script>
    (function() {
      const target = new Date("${targetDateTime}").getTime();
      function pad(n) { return String(n).padStart(2, "0"); }
      function tick() {
        const diff = target - Date.now();
        if (diff <= 0) {
          ["cd-days","cd-hours","cd-mins","cd-secs"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = "00"; });
          return;
        }
        const dEl = document.getElementById("cd-days");   if (dEl) dEl.textContent = pad(Math.floor(diff / 86400000));
        const hEl = document.getElementById("cd-hours");  if (hEl) hEl.textContent = pad(Math.floor((diff % 86400000) / 3600000));
        const mEl = document.getElementById("cd-mins");   if (mEl) mEl.textContent = pad(Math.floor((diff % 3600000) / 60000));
        const sEl = document.getElementById("cd-secs");   if (sEl) sEl.textContent = pad(Math.floor((diff % 60000) / 1000));
      }
      tick(); setInterval(tick, 1000);
    })();
  <\/script>`;
}

function buildGalleryJS() {
    return `
  <script>
    (function(){
      const galleryItems = document.querySelectorAll('.gallery-item');
      const lightbox = document.getElementById('invittaLightbox');
      const lbImage = document.getElementById('lightboxImage');
      const lbClose = document.getElementById('lbClose');
      const lbPrev = document.getElementById('lbPrev');
      const lbNext = document.getElementById('lbNext');
      
      if(!galleryItems.length || !lightbox) return;
      
      let currentIndex = 0;
      const images = Array.from(galleryItems).map(btn => ({
         src: btn.querySelector('img').src,
         alt: btn.querySelector('img').alt
      }));
      
      if(images.length <= 1) {
         lbPrev.style.display = 'none';
         lbNext.style.display = 'none';
      }
      
      function openLightbox(index) {
         currentIndex = index;
         lbImage.src = images[currentIndex].src;
         lbImage.alt = images[currentIndex].alt;
         lightbox.hidden = false;
         document.body.style.overflow = 'hidden';
      }
      
      function closeLightbox() {
         lightbox.hidden = true;
         document.body.style.overflow = '';
         lbImage.src = '';
      }
      
      function showNext() {
         currentIndex = (currentIndex + 1) % images.length;
         openLightbox(currentIndex);
      }
      
      function showPrev() {
         currentIndex = (currentIndex - 1 + images.length) % images.length;
         openLightbox(currentIndex);
      }
      
      galleryItems.forEach((btn, i) => {
         btn.addEventListener('click', () => openLightbox(i));
      });
      
      lbClose.addEventListener('click', closeLightbox);
      lbPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
      lbNext.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
      
      lightbox.addEventListener('click', (e) => {
         if(e.target === lightbox) closeLightbox();
      });
      
      document.addEventListener('keydown', (e) => {
         if(!lightbox.hidden) {
            if(e.key === 'Escape') closeLightbox();
            if(e.key === 'ArrowRight' && images.length > 1) showNext();
            if(e.key === 'ArrowLeft' && images.length > 1) showPrev();
         }
      });
    })();
  <\/script>`;
}

function buildMusicJS(autoplayRequested) {
    return `
  <script>
    (function(){
      const audio = document.getElementById('invittaAudio');
      const toggle = document.getElementById('musicToggle');
      if(!audio || !toggle) return;
      
      const icon = toggle.querySelector('i');
      let isPlaying = false;
      let hasInteracted = false;
      
      function updateUI() {
         if(isPlaying) {
            icon.className = 'fa-solid fa-pause';
            toggle.setAttribute('aria-pressed', 'true');
            toggle.setAttribute('aria-label', 'Pausar música');
         } else {
            icon.className = 'fa-solid fa-play';
            toggle.setAttribute('aria-pressed', 'false');
            toggle.setAttribute('aria-label', 'Reproducir música');
         }
      }
      
      function togglePlay() {
         if(isPlaying) {
            audio.pause();
         } else {
            audio.play().catch(e => console.warn('Play blocked:', e));
         }
      }
      
      audio.addEventListener('play', () => { isPlaying = true; updateUI(); });
      audio.addEventListener('pause', () => { isPlaying = false; updateUI(); });
      audio.addEventListener('ended', () => { isPlaying = false; updateUI(); });
      
      toggle.addEventListener('click', togglePlay);
      
      ${autoplayRequested ? `
      // Intento de autoplay
      const attemptAutoplay = () => {
         if(hasInteracted) return;
         hasInteracted = true;
         audio.play().catch(() => { /* Silencioso si falla */ });
      };
      
      audio.play().catch(() => {
          document.addEventListener('click', attemptAutoplay, {once: true});
          document.addEventListener('touchstart', attemptAutoplay, {once: true});
          document.addEventListener('keydown', attemptAutoplay, {once: true});
      });
      ` : ''}
    })();
  <\/script>`;
}

// ─────────────────────────────────────────────
// CSS BUILDER — BASE
// ─────────────────────────────────────────────
function buildCSS(p, t, design, media) {
    return `
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: ${t.body}; background-color: ${p.bg}; color: ${p.text}; line-height: 1.7; text-align: center; }

    /* HERO */
    .hero { min-height: 90svh; display: flex; align-items: center; justify-content: center; background-color: ${p.bg}; padding: 60px 30px; position: relative; overflow: hidden; }
    .hero::before { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at center, ${p.hero || "rgba(0,0,0,0.04)"} 0%, transparent 70%); }
    .hero-background-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
    .hero-overlay { position: absolute; inset: 0; z-index: 1; background: rgba(0,0,0,0.3); }
    .hero-inner { position: relative; z-index: 2; max-width: 560px; margin: 0 auto; }
    .hero.has-hero-image .hero-inner { text-shadow: 0 2px 10px rgba(0,0,0,0.6); }
    .hero.has-hero-image .name-accent, .hero.has-hero-image h1, .hero.has-hero-image .ampersand, .hero.has-hero-image .eyebrow, .hero.has-hero-image .hero-date, .hero.has-hero-image .hero-quote { color: #ffffff !important; }
    .hero-names { display: flex; flex-direction: column; align-items: center; margin: 20px 0; }
    .name-accent { font-family: ${t.accent}; color: ${p.accent}; font-size: clamp(2.6rem, 8vw, 4.8rem); line-height: 1.1; }
    h1 { font-family: ${t.title}; color: ${p.accent}; font-size: clamp(2.2rem, 7vw, 4rem); font-weight: 400; }
    .ampersand { font-family: ${t.title}; font-size: clamp(1.4rem, 4vw, 2.2rem); color: ${p.muted}; margin: 6px 0; }
    .eyebrow { font-family: ${t.body}; font-size: 0.72rem; letter-spacing: 3.5px; text-transform: uppercase; color: ${p.muted}; margin-bottom: 18px; }
    .initials { font-family: ${t.title}; font-size: clamp(4rem, 18vw, 9rem); color: ${p.accent}; opacity: 0.1; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; z-index: 0; line-height: 1; }
    .hero-date { font-family: ${t.body}; font-size: 0.8rem; letter-spacing: 2.5px; text-transform: uppercase; color: ${p.muted}; margin-top: 28px; }
    .hero-quote { max-width: 340px; margin: 28px auto 0; font-style: italic; font-size: 0.92rem; color: ${p.muted}; border-left: 2px solid ${p.accent}; padding-left: 16px; text-align: left; }

    /* SECTIONS */
    .section { padding: 70px 28px; border-bottom: 1px solid ${p.surface}; }
    .section.surface { background-color: ${p.surface}; }
    .section-inner { max-width: 600px; margin: 0 auto; }
    .section-tag { font-family: ${t.body}; font-size: 0.7rem; letter-spacing: 3.5px; text-transform: uppercase; color: ${p.muted}; margin-bottom: 24px; }
    .ornament-line { width: 50px; height: 1px; background: ${p.accent}; margin: 8px auto; opacity: 0.55; }
    .section-desc { font-size: 0.9rem; color: ${p.muted}; max-width: 400px; margin: 0 auto 24px; }

    /* COUNTDOWN, FAMILY, LOCATION, ITINERARY, DRESS CODE, REGISTRY, HOTELS (unchanged functionality) */
    .countdown-section { background: ${p.bg}; }
    .countdown { display: flex; justify-content: center; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
    .cd-block { display: flex; flex-direction: column; align-items: center; min-width: 54px; }
    .cd-num { font-family: ${t.title}; font-size: clamp(2.2rem, 7vw, 3.8rem); color: ${p.accent}; line-height: 1; }
    .cd-label { font-size: 0.6rem; letter-spacing: 2px; text-transform: uppercase; color: ${p.muted}; margin-top: 6px; }
    .cd-sep { font-family: ${t.title}; font-size: 2rem; color: ${p.muted}; margin-top: 4px; }
    .family-block { margin-bottom: 20px; }
    .family-name { font-family: ${t.title}; font-size: 1.1rem; font-weight: 400; line-height: 1.5; }
    .divider-line { width: 40px; height: 1px; background: ${p.accent}; margin: 20px auto; opacity: 0.6; }
    .godparents { margin-top: 30px; }
    .event-time { font-family: ${t.title}; font-size: 1.6rem; color: ${p.accent}; margin-bottom: 8px; }
    .event-place { font-weight: 600; font-size: 1rem; margin-bottom: 6px; }
    .event-address { font-size: 0.88rem; color: ${p.muted}; margin-bottom: 24px; }
    .iti-list { display: flex; flex-direction: column; gap: 28px; max-width: 440px; margin: 0 auto; text-align: left; position: relative; }
    .iti-item { display: flex; gap: 16px; align-items: flex-start; position: relative; }
    .iti-marker { width: 10px; height: 10px; border-radius: 50%; background: ${p.accent}; margin-top: 5px; flex-shrink: 0; opacity: 0.8; }
    .iti-time { font-family: ${t.title}; color: ${p.accent}; min-width: 68px; font-size: 1rem; flex-shrink: 0; }
    .iti-body { display: flex; flex-direction: column; }
    .iti-title { font-weight: 600; font-size: 0.95rem; }
    .iti-desc { font-size: 0.83rem; color: ${p.muted}; margin-top: 2px; }
    .dress-group { margin-bottom: 16px; font-size: 0.93rem; }
    .lluvia { margin: 20px 0; }
    .lluvia i { font-size: 2rem; color: ${p.accent}; display: block; margin-bottom: 8px; }
    .hotel-card { margin-bottom: 26px; }
    .hotel-card p { font-size: 0.88rem; color: ${p.muted}; margin: 3px 0; }
    .hotel-card strong { font-size: 1rem; }
    .btn-map, .btn-whatsapp { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 26px; border-radius: 4px; text-decoration: none; font-family: ${t.body}; font-size: 0.8rem; letter-spacing: 1.5px; text-transform: uppercase; transition: opacity 0.2s, transform 0.2s; margin: 8px auto; cursor: pointer; }
    .btn-map { background: ${p.accent}; color: ${p.bg}; }
    .btn-whatsapp { background: #25D366; color: #ffffff; }
    .btn-map:hover, .btn-whatsapp:hover { opacity: 0.82; transform: translateY(-1px); }

    /* MEDIA OVERRIDES (GALLERY, LIGHTBOX, MUSIC, STUDIO) */
    .invitta-gallery { display: grid; gap: 12px; grid-template-columns: 1fr; }
    .gallery-item { border: none; padding: 0; background: transparent; cursor: pointer; display: block; width: 100%; overflow: hidden; }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
    .gallery-item:hover img { transform: scale(1.02); }
    .orientation-vertical { height: 360px; }
    .orientation-horizontal { height: 220px; }
    .orientation-cuadrada { height: 300px; aspect-ratio: 1/1; }
    .orientation-auto { height: 280px; }
    @media (min-width: 480px) {
        .invitta-gallery { grid-template-columns: repeat(2, 1fr); }
        .orientation-horizontal { grid-column: span 2; }
    }
    @media (min-width: 768px) {
        .invitta-gallery { grid-template-columns: repeat(3, 1fr); }
        .orientation-horizontal { grid-column: span 2; }
    }

    .lightbox { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.92); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
    .lightbox[hidden] { display: none !important; }
    .lightbox img { max-width: 90vw; max-height: 85vh; object-fit: contain; }
    .lightbox button { background: transparent; border: none; color: white; cursor: pointer; padding: 15px; display: flex; align-items: center; justify-content: center; }
    .lightbox-close { position: absolute; top: 15px; right: 15px; font-size: 2.5rem; line-height: 1; z-index: 2; }
    .lightbox-prev, .lightbox-next { position: absolute; top: 50%; transform: translateY(-50%); font-size: 3rem; z-index: 2; }
    .lightbox-prev { left: 10px; }
    .lightbox-next { right: 10px; }
    
    .music-player { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: ${p.surface}; border: 1px solid ${p.accent}; border-radius: 50px; padding: 8px 24px 8px 8px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); z-index: 990; max-width: 90vw; width: max-content; }
    .music-toggle { width: 40px; height: 40px; border-radius: 50%; background: ${p.accent}; color: ${p.bg}; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; flex-shrink: 0; }
    .music-info { display: flex; flex-direction: column; overflow: hidden; }
    .music-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 2px; color: ${p.muted}; line-height: 1; }
    .music-title { font-size: 0.85rem; font-weight: 500; color: ${p.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    body.has-music-player { padding-bottom: 86px; }

    .studio-logo { max-width: 120px; max-height: 60px; object-fit: contain; margin: 0 auto 16px; display: block; }
    .btn-studio-wa { display: inline-block; margin-top: 12px; padding: 6px 16px; border: 1px solid ${p.bg}; border-radius: 4px; color: ${p.bg}; text-decoration: none; font-size: 0.8rem; }
    .tech-tag { margin-top: 24px; font-size: 0.65rem; opacity: 0.6; }
    .credits { padding: 36px 28px; font-size: 0.73rem; letter-spacing: 1.5px; color: ${p.bg}; background: ${p.text}; text-align: center; }
    .credits a { color: inherit; text-decoration: underline; }
    .credits strong { font-weight: 600; }

    @media (max-width: 480px) {
      .section { padding: 52px 18px; }
      .hero { padding: 52px 20px; }
      .iti-list { max-width: 100%; }
    }

    ${buildTemplateCSS(p, t, design)}

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }`;
}

// ─────────────────────────────────────────────
// CSS BUILDER — TEMPLATE SPECIFIC
// ─────────────────────────────────────────────
function buildTemplateCSS(p, t, design) {
    if (!design) return "";
    const { layout, ornaments = [], buttonStyle, heroStyle, sectionStyle, safeId } = design;
    let css = `\n    /* ═══ Template: ${safeId} | Layout: ${layout} ═══ */`;

    const hasDivider = ornaments.includes("divider");
    if (hasDivider) {
        css += `\n    .ornament-line { width: 60px; height: 1px; background: ${p.accent}; margin: 8px auto; opacity: 0.6; }`;
    }

    // Button style overrides
    const btnStyles = {
        soft:    `border-radius: 50px !important; border: 1px solid ${p.accent} !important; background: transparent !important; color: ${p.accent} !important;`,
        gold:    `background: linear-gradient(135deg, ${p.accent}, color-mix(in srgb, ${p.accent} 80%, #fff)) !important; letter-spacing: 2px !important;`,
        luxury:  `background: transparent !important; border: 1px solid ${p.accent} !important; color: ${p.accent} !important; letter-spacing: 3px !important; padding: 14px 32px !important;`,
        classic: ""
    };
    if (btnStyles[buttonStyle]) {
        css += `\n    .btn-map { ${btnStyles[buttonStyle]} }`;
    }

    // A. classic-xv
    if (layout === "classic-xv") {
        css += `
    .layout-classic-xv .hero { min-height: 88svh; }
    .layout-classic-xv .hero-inner::after { content: ""; display: block; width: 48px; height: 1px; background: ${p.accent}; margin: 20px auto 0; opacity: 0.5; }
    .layout-classic-xv .name-accent { font-size: clamp(2.8rem, 8vw, 4.2rem); }
    .layout-classic-xv .hero-date { margin-top: 20px; }
    .layout-classic-xv .section-inner { max-width: 560px; }
    .layout-classic-xv .section { padding: 58px 24px; }
    .layout-classic-xv .section.surface { background: ${p.surface}; }
    .layout-classic-xv .btn-map { background: transparent; border: 1px solid ${p.accent}; color: ${p.accent}; border-radius: 2px; }
    .layout-classic-xv .hero-overlay { background: rgba(0,0,0,0.25); }
    .layout-classic-xv .invitta-gallery { gap: 8px; }`;
    }

    // B. rose-premium
    if (layout === "rose-premium") {
        css += `
    .layout-rose-premium .hero { min-height: 92svh; background: linear-gradient(160deg, ${p.bg} 0%, ${p.surface} 100%); }
    .layout-rose-premium .hero::after { content: ""; position: absolute; width: 220px; height: 220px; border-radius: 50%; border: 1px solid ${p.accent}; opacity: 0.12; top: 8%; right: -50px; }
    .layout-rose-premium .hero::before { content: ""; position: absolute; width: 140px; height: 140px; border-radius: 50%; border: 1px solid ${p.accent}; opacity: 0.1; bottom: 10%; left: -30px; background: none; }
    .layout-rose-premium .section.surface { margin: 18px; border-radius: 28px; box-shadow: 0 2px 16px rgba(0,0,0,0.04); padding: 52px 28px; }
    .layout-rose-premium .section { padding: 64px 28px; }
    .layout-rose-premium .section-inner { max-width: 520px; }
    .layout-rose-premium .btn-map { border-radius: 50px; border: 1px solid ${p.accent}; background: transparent; color: ${p.accent}; }
    .layout-rose-premium .iti-item { align-items: center; }
    .layout-rose-premium .iti-marker { width: 8px; height: 8px; border: 2px solid ${p.accent}; background: transparent; }
    .layout-rose-premium .hero-overlay { background: linear-gradient(180deg, rgba(255,240,245,0.3) 0%, rgba(0,0,0,0.4) 100%); }
    .layout-rose-premium .gallery-item { border-radius: 12px; }
    .layout-rose-premium .invitta-gallery { gap: 16px; }
    @media (max-width: 480px) { .layout-rose-premium .section.surface { margin: 10px; border-radius: 20px; } }`;
    }

    // C. champagne-vip
    if (layout === "champagne-vip") {
        css += `
    .layout-champagne-vip .hero { min-height: 100svh; background: linear-gradient(170deg, ${p.bg} 0%, ${p.surface} 60%, ${p.bg} 100%); }
    .layout-champagne-vip .hero-inner { position: relative; border: 1px solid ${p.accent}; padding: 48px 36px; margin: 16px; opacity: 1; }
    .layout-champagne-vip .hero-inner::before { content: "✦"; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: ${p.bg}; padding: 0 10px; font-size: 0.75rem; color: ${p.accent}; opacity: 0.7; }
    .layout-champagne-vip .hero-inner::after { content: "✦"; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); background: ${p.bg}; padding: 0 10px; font-size: 0.75rem; color: ${p.accent}; opacity: 0.7; }
    .layout-champagne-vip .name-accent { font-size: clamp(2.8rem, 8vw, 5.2rem); }
    .layout-champagne-vip .eyebrow { letter-spacing: 6px; font-size: 0.65rem; }
    .layout-champagne-vip .hero-date { letter-spacing: 4px; font-size: 0.72rem; }
    .layout-champagne-vip .section { padding: 80px 28px; }
    .layout-champagne-vip .section-inner { max-width: 640px; }
    .layout-champagne-vip .section-tag { letter-spacing: 6px; font-size: 0.6rem; }
    .layout-champagne-vip .event-time { font-size: 2.2rem; }
    .layout-champagne-vip .btn-map { background: linear-gradient(135deg, ${p.accent} 0%, rgba(212,175,55,0.7) 100%); color: ${p.bg}; letter-spacing: 2.5px; border-radius: 2px; }
    .layout-champagne-vip .credits { background: ${p.surface}; color: ${p.accent}; font-weight: 500; letter-spacing: 4px; border-top: 1px solid ${p.accent}; }
    @keyframes champagne-shimmer { 0% { opacity: 0.06; } 50% { opacity: 0.12; } 100% { opacity: 0.06; } }
    .layout-champagne-vip .hero::before { animation: champagne-shimmer 6s ease-in-out infinite; }
    .layout-champagne-vip .hero-overlay { background: rgba(0,0,0,0.35); }
    .layout-champagne-vip .hero.has-hero-image .hero-inner { background: rgba(255,255,255,0.05); backdrop-filter: blur(2px); }
    .layout-champagne-vip .hero.has-hero-image .hero-inner::before, .layout-champagne-vip .hero.has-hero-image .hero-inner::after { background: transparent; text-shadow: none; }
    .layout-champagne-vip .gallery-item { border: 1px solid ${p.accent}; }
    .layout-champagne-vip .invitta-gallery { gap: 12px; }`;
    }

    // D. classic-wedding
    if (layout === "classic-wedding") {
        css += `
    .layout-classic-wedding .hero { min-height: 88svh; }
    .layout-classic-wedding .hero-names { gap: 4px; }
    .layout-classic-wedding .name-accent { font-family: ${t.title}; font-size: clamp(2.4rem, 7vw, 4rem); }
    .layout-classic-wedding .ampersand { font-size: clamp(1.8rem, 5vw, 2.6rem); opacity: 0.5; }
    .layout-classic-wedding .hero-inner::after { content: ""; display: block; width: 80px; height: 1px; background: ${p.accent}; margin: 22px auto 0; opacity: 0.45; }
    .layout-classic-wedding .section { padding: 66px 28px; }
    .layout-classic-wedding .section-inner { max-width: 560px; }
    .layout-classic-wedding .family-name { font-size: 1.05rem; }
    .layout-classic-wedding .btn-map { background: transparent; border: 1px solid ${p.text}; color: ${p.text}; border-radius: 2px; letter-spacing: 1.5px; }
    .layout-classic-wedding .btn-map:hover { background: ${p.text}; color: ${p.bg}; opacity: 1; }
    .layout-classic-wedding .hero-overlay { background: rgba(0,0,0,0.3); }
    .layout-classic-wedding .gallery-item { border-radius: 4px; }`;
    }

    // E. golden-romance
    if (layout === "golden-romance") {
        css += `
    .layout-golden-romance .hero { min-height: 92svh; background: linear-gradient(180deg, ${p.bg} 0%, ${p.surface} 100%); }
    .layout-golden-romance .hero::after { content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, ${p.accent}, transparent); z-index: 1; }
    .layout-golden-romance .hero-inner::before { content: ""; display: block; width: 70px; height: 1px; background: linear-gradient(90deg, transparent, ${p.accent}, transparent); margin: 0 auto 22px; }
    .layout-golden-romance .hero-inner::after { content: ""; display: block; width: 70px; height: 1px; background: linear-gradient(90deg, transparent, ${p.accent}, transparent); margin: 22px auto 0; }
    .layout-golden-romance .location-card .section-inner { max-width: 560px; border: 1px solid ${p.accent}; border-radius: 6px; padding: 36px 28px; }
    .layout-golden-romance .section { padding: 70px 28px; }
    .layout-golden-romance .section-tag::before, .layout-golden-romance .section-tag::after { content: " ─── "; opacity: 0.4; color: ${p.accent}; }
    .layout-golden-romance .iti-list { border-left: 1px solid ${p.accent}; padding-left: 20px; }
    .layout-golden-romance .iti-marker { margin-left: -25px; width: 10px; height: 10px; border: 2px solid ${p.accent}; background: ${p.bg}; }
    .layout-golden-romance .btn-map { background: transparent; border: 1px solid ${p.accent}; color: ${p.accent}; letter-spacing: 2px; }
    .layout-golden-romance .btn-map:hover { background: ${p.accent}; color: ${p.bg}; opacity: 1; }
    .layout-golden-romance .family-name { font-style: italic; }
    .layout-golden-romance .hero-overlay { background: linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(212,175,55,0.15) 100%); }
    .layout-golden-romance .gallery-item { border: 2px solid rgba(212,175,55,0.2); }`;
    }

    // F. midnight-luxury
    if (layout === "midnight-luxury") {
        css += `
    .layout-midnight-luxury .hero { min-height: 100svh; }
    .layout-midnight-luxury .hero-inner { max-width: 500px; }
    .layout-midnight-luxury .eyebrow { letter-spacing: 7px; font-size: 0.62rem; }
    .layout-midnight-luxury .hero-date { letter-spacing: 5px; font-size: 0.68rem; }
    .layout-midnight-luxury .name-accent { font-size: clamp(2.8rem, 8vw, 5rem); letter-spacing: 1px; }
    .layout-midnight-luxury .hero::after { content: "✦   ✦   ✦"; position: absolute; bottom: 28px; left: 0; right: 0; text-align: center; font-size: 0.55rem; letter-spacing: 10px; color: ${p.accent}; opacity: 0.45; z-index: 1; }
    .layout-midnight-luxury .hero-inner::before, .layout-midnight-luxury .hero-inner::after { content: ""; display: block; width: 90px; height: 1px; background: linear-gradient(90deg, transparent, ${p.accent}, transparent); margin: 0 auto; }
    .layout-midnight-luxury .hero-inner::before { margin-bottom: 28px; }
    .layout-midnight-luxury .hero-inner::after  { margin-top: 28px; }
    .layout-midnight-luxury .section { padding: 78px 28px; border-bottom: 1px solid ${p.accent}; border-bottom-width: 1px; border-bottom-opacity: 0.15; }
    .layout-midnight-luxury .section-inner { max-width: 620px; }
    .layout-midnight-luxury .section-tag { letter-spacing: 7px; font-size: 0.58rem; }
    .layout-midnight-luxury .event-time { font-size: 2rem; letter-spacing: 2px; }
    .layout-midnight-luxury .btn-map { background: transparent; border: 1px solid ${p.accent}; color: ${p.accent}; letter-spacing: 3px; padding: 13px 30px; border-radius: 0; }
    .layout-midnight-luxury .btn-map:hover { background: ${p.accent}; color: ${p.bg}; opacity: 1; }
    .layout-midnight-luxury .credits { background: ${p.surface}; color: ${p.accent}; letter-spacing: 4px; font-weight: 500; border-top: 1px solid ${p.accent}; }
    .layout-midnight-luxury .hero-overlay { background: rgba(0,0,0,0.55); }
    .layout-midnight-luxury .gallery-item { border: 1px solid ${p.accent}; }
    .layout-midnight-luxury .music-player { background: ${p.bg}; border: 1px solid ${p.accent}; }
    /* Dark-theme overrides */
    .is-dark-theme.layout-midnight-luxury .section.surface { background: ${p.surface}; }
    .is-dark-theme.layout-midnight-luxury .hotel-card { border: 1px solid ${p.accent}; border-radius: 4px; padding: 18px; margin: 0 auto 20px; max-width: 360px; }`;
    }

    return css;
}

// ─────────────────────────────────────────────
// MAIN GENERATOR
// ─────────────────────────────────────────────
function generateInvitation() {
    if (!loadedConfig) return;
    const d = loadedConfig;

    const p      = getPaletteColors(d.visual.palette, d.visual.customPalette);
    const t      = getTypography(d.visual.typography, d.visual.handwritten);
    const design = getTemplateDesign(d.template?.id, d.visual);
    const fontUrl= buildGoogleFontsUrl(d.visual.typography, d.visual.handwritten);
    
    // Process Resources
    const media  = getValidMedia(d);
    const studio = getValidStudio(d);

    const isBoda = d.event.type === "boda";
    const titleName = isBoda
        ? `${d.event.primaryName} & ${d.event.secondaryName || ""}`.trim()
        : `XV Años de ${d.event.primaryName}`;

    // Body classes
    const rawLevel  = (d.template?.level || "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    let bodyClasses = `template-${design.safeId} layout-${design.layout}${rawLevel ? ` level-${rawLevel}` : ""}`;

    // Conditional body classes based on media
    if (media.heroImage) bodyClasses += " has-media-hero";
    if (media.gallery && media.gallery.length > 0) bodyClasses += " has-gallery";
    if (media.music) bodyClasses += " has-music-player";
    if (studio.name || media.studioLogo) bodyClasses += " has-studio-branding";

    // Dark theme detection for midnight-luxury
    if (design.layout === "midnight-luxury") {
        const paletteIsDark = d.visual.palette === "Plum Noir VIP" || isDarkColor(p.bg);
        if (paletteIsDark) bodyClasses += " is-dark-theme";
    }

    const css        = buildCSS(p, t, design, media);
    const sections   = buildSections(d, p, t, design, media, studio);
    
    // Embedded HTML
    const lightboxHTML = (media.gallery && media.gallery.length > 0) ? buildLightboxHTML() : "";
    const musicHTML    = media.music ? buildMusicHTML(media.music) : "";
    
    // Embedded JS
    const countdownJS  = d.event.countdownDateTime ? buildCountdownJS(d.event.countdownDateTime) : "";
    const galleryJS    = (media.gallery && media.gallery.length > 0) ? buildGalleryJS() : "";
    const musicJS      = media.music ? buildMusicJS(media.music.autoplay) : "";

    const customNote = p.customNote
        ? `<div style="background:#fff3cd;color:#856404;padding:8px 14px;font-size:0.8rem;text-align:center;">Colores solicitados: ${escapeHTML(p.customNote)}</div>`
        : "";

    finalHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(titleName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
${css}
  </style>
</head>
<body class="${bodyClasses}">
${customNote}
${sections}
${lightboxHTML}
${musicHTML}
${countdownJS}
${galleryJS}
${musicJS}
</body>
</html>`;

    // Show result
    document.getElementById("generateCard").style.display = "none";
    const resultCard = document.getElementById("resultCard");
    resultCard.style.display = "block";

    const successMsg = document.getElementById("successMsg");
    successMsg.textContent = `✅ Invitación generada (${(finalHTML.length / 1024).toFixed(1)} KB) — Layout: ${design.layout}`;
    successMsg.style.display = "block";

    document.getElementById("codePreview").textContent =
        finalHTML.split("\n").slice(0, 80).join("\n") + "\n\n... (archivo completo disponible al descargar)";

    resultCard.scrollIntoView({ behavior: "smooth" });
}

// ─────────────────────────────────────────────
// DOWNLOAD
// ─────────────────────────────────────────────
function downloadFinal() {
    if (!finalHTML) return;
    const blob = new Blob([finalHTML], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "invitacion-final.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
