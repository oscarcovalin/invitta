/**
 * Fase 7F — Generador de invitación publicable desde invitta-configuracion.json.
 * 100% local en el navegador. Sin Supabase. Sin APIs externas.
 */

"use strict";

let loadedConfig = null;
let finalHTML = null;

// ─────────────────────────────────────────────
// FILE HANDLING
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");

    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("over"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("over"));
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("over");
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
        } catch {
            showError("Error al parsear el archivo JSON. Verifica que el archivo no esté corrupto.");
        }
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
        { label: "Nombre principal", value: data.event.primaryName },
        { label: "Nombre secundario", value: data.event.secondaryName || "—" },
        { label: "Tipo de evento", value: data.event.type },
        { label: "Paquete", value: data.event.packageLevel },
        { label: "Plantilla", value: data.template.name || data.template.id || "—" },
        { label: "Paleta", value: data.visual.palette },
        { label: "Tipografía", value: data.visual.typography || "—" },
        { label: "Handwritten", value: data.visual.handwritten || "—" },
        { label: "Fecha", value: data.event.dateText || "—" },
        { label: "Ceremonia", value: data.locations?.ceremony?.place || "—" },
        { label: "Recepción", value: data.locations?.reception?.place || "—" },
        { label: "Generado el", value: new Date().toLocaleDateString("es-MX", { dateStyle: "long" }) }
    ];

    const grid = document.getElementById("summaryGrid");
    grid.innerHTML = items.map(i => `
        <div class="sum-item">
            <div class="sum-label">${i.label}</div>
            <div class="sum-value">${i.value || "—"}</div>
        </div>`).join("");

    document.getElementById("summaryCard").style.display = "block";
    document.getElementById("generateCard").style.display = "block";
}

// ─────────────────────────────────────────────
// PALETTE MAP
// ─────────────────────────────────────────────
function getPaletteColors(name, custom) {
    const palettes = {
        "Rosa Champagne":    { bg:"#faf8f5", surface:"#fdfbfa", accent:"#c48473", text:"#4a4443", muted:"#8a7a65", hero:"rgba(196,132,115,0.15)" },
        "Lavanda Dream":     { bg:"#f8f6fa", surface:"#f2eef7", accent:"#9d8cb3", text:"#3b3542", muted:"#8b8594", hero:"rgba(157,140,179,0.18)" },
        "Cool Blue":         { bg:"#f4f7f9", surface:"#eef3f7", accent:"#6c8da8", text:"#2c3e50", muted:"#7f8c8d", hero:"rgba(108,141,168,0.18)" },
        "Olive Romance":     { bg:"#f5f6f4", surface:"#eff0ec", accent:"#7a8471", text:"#3a4035", muted:"#8a9481", hero:"rgba(122,132,113,0.15)" },
        "Terracotta Sunset": { bg:"#faf5f3", surface:"#f7efec", accent:"#b86b53", text:"#4a332d", muted:"#9a837d", hero:"rgba(184,107,83,0.15)" },
        "Plum Noir VIP":     { bg:"#1a1514", surface:"#2a2220", accent:"#dfba6b", text:"#f0eade", muted:"#8a7a65", hero:"rgba(0,0,0,0.5)" },
        "Jade Garden":       { bg:"#f0f4f1", surface:"#e6ede8", accent:"#4a7c59", text:"#233d2b", muted:"#708c78", hero:"rgba(74,124,89,0.15)" },
        "Personalizada":     { bg:"#f9f9f9", surface:"#f0f0f0", accent:"#aaaaaa", text:"#111111", muted:"#666666", hero:"rgba(0,0,0,0.1)", customNote: custom }
    };
    return palettes[name] || palettes["Rosa Champagne"];
}

// ─────────────────────────────────────────────
// TYPOGRAPHY MAP
// ─────────────────────────────────────────────
function getTypography(typoName, handName) {
    const typos = {
        "Clásica Editorial":  { title:"'Cormorant Garamond', serif", body:"'Jost', sans-serif", hw:"" },
        "Romántica Fina":     { title:"'Playfair Display', serif",   body:"'Montserrat', sans-serif", hw:"" },
        "Lujo Nocturno":      { title:"'Bodoni Moda', serif",        body:"'Lato', sans-serif", hw:"" },
        "Moderna Minimal":    { title:"'Libre Baskerville', serif",   body:"'Inter', sans-serif", hw:"" },
        "Jardín Romántico":   { title:"'Lora', serif",               body:"'Nunito Sans', sans-serif", hw:"" },
        "Glam Editorial":     { title:"'Cinzel', serif",             body:"'Raleway', sans-serif", hw:"" },
    };
    const hands = {
        "Handwritten Romántica":   "'Great Vibes', cursive",
        "Handwritten Moderna":     "'Parisienne', cursive",
        "Handwritten de Lujo":     "'Allura', cursive",
        "Handwritten Orgánica":    "'Sacramento', cursive",
        "Handwritten Sofisticada": "'Alex Brush', cursive",
    };

    const base = typos[typoName] || typos["Romántica Fina"];
    const hand = hands[handName] || null;

    return {
        title:  base.title,
        body:   base.body,
        accent: hand || base.title   // Si hay handwritten, se usa para nombres principales
    };
}

// ─────────────────────────────────────────────
// GOOGLE FONTS URL BUILDER
// ─────────────────────────────────────────────
function buildGoogleFontsUrl(typoName, handName) {
    const families = new Set();

    const typoMap = {
        "Clásica Editorial":  ["Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400", "Jost:wght@300;400;500;600"],
        "Romántica Fina":     ["Playfair+Display:ital,wght@0,400;0,600;0,700;1,400", "Montserrat:wght@300;400;500;600"],
        "Lujo Nocturno":      ["Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400;1,6..96,700", "Lato:wght@300;400;700"],
        "Moderna Minimal":    ["Libre+Baskerville:ital,wght@0,400;0,700;1,400", "Inter:wght@300;400;500;600"],
        "Jardín Romántico":   ["Lora:ital,wght@0,400;0,600;1,400", "Nunito+Sans:wght@300;400;600"],
        "Glam Editorial":     ["Cinzel:wght@400;600;700", "Raleway:wght@300;400;500;600"],
    };
    const handMap = {
        "Handwritten Romántica":   "Great+Vibes",
        "Handwritten Moderna":     "Parisienne",
        "Handwritten de Lujo":     "Allura",
        "Handwritten Orgánica":    "Sacramento",
        "Handwritten Sofisticada": "Alex+Brush",
    };

    (typoMap[typoName] || typoMap["Romántica Fina"]).forEach(f => families.add(f));
    if (handMap[handName]) families.add(handMap[handName]);

    return `https://fonts.googleapis.com/css2?family=${[...families].join("&family=")}&display=swap`;
}

// ─────────────────────────────────────────────
// HTML BUILDER — SECTIONS
// ─────────────────────────────────────────────
function buildSections(d, p, t) {
    const isBoda = d.event.type === "boda";
    const waText = encodeURIComponent(`Hola, confirmo mi asistencia al evento de ${d.event.primaryName}`);
    let s = "";

    // A · Hero / Portada
    s += `
  <!-- HERO -->
  <section class="hero">
    <div class="hero-inner">
      <div class="eyebrow">${isBoda ? "Nuestra Boda" : "Mis XV Años"}</div>
      <div class="hero-names">
        ${t.accent ? `<span class="name-accent">${d.event.primaryName}</span>` : `<h1>${d.event.primaryName}</h1>`}
        ${isBoda && d.event.secondaryName ? `<span class="ampersand">&amp;</span>
        ${t.accent ? `<span class="name-accent">${d.event.secondaryName}</span>` : `<h1>${d.event.secondaryName}</h1>`}` : ""}
      </div>
      ${d.event.initials ? `<div class="initials">${d.event.initials}</div>` : ""}
      ${d.event.dateText ? `<div class="hero-date">${d.event.dateText}</div>` : ""}
      ${d.event.quote ? `<blockquote class="hero-quote">"${d.event.quote}"</blockquote>` : ""}
    </div>
  </section>`;

    // B · Countdown
    if (d.event.countdownDateTime) {
        s += `
  <!-- COUNTDOWN -->
  <section class="section countdown-section">
    <div class="section-tag">Faltan</div>
    <div class="countdown" id="countdown">
      <div class="cd-block"><span class="cd-num" id="cd-days">00</span><span class="cd-label">Días</span></div>
      <div class="cd-sep">:</div>
      <div class="cd-block"><span class="cd-num" id="cd-hours">00</span><span class="cd-label">Horas</span></div>
      <div class="cd-sep">:</div>
      <div class="cd-block"><span class="cd-num" id="cd-mins">00</span><span class="cd-label">Minutos</span></div>
      <div class="cd-sep">:</div>
      <div class="cd-block"><span class="cd-num" id="cd-secs">00</span><span class="cd-label">Segundos</span></div>
    </div>
  </section>`;
    }

    // C · Familia
    const hp = d.family?.hostParents || {};
    const sp = d.family?.secondaryParents || {};
    const hasFam = hp.mother || hp.father || sp.mother || sp.father || d.family?.godparents;
    if (hasFam) {
        s += `
  <!-- FAMILIA -->
  <section class="section surface">
    <div class="section-tag">Con la bendición de Dios y nuestros padres</div>
    ${hp.mother || hp.father ? `<div class="family-block">${[hp.mother, hp.father].filter(Boolean).map(n => `<p class="family-name">${n}</p>`).join("")}</div>` : ""}
    ${(sp.mother || sp.father) ? `<div class="divider-line"></div><div class="family-block">${[sp.mother, sp.father].filter(Boolean).map(n => `<p class="family-name">${n}</p>`).join("")}</div>` : ""}
    ${d.family?.godparents ? `<div class="godparents"><span class="section-tag">Padrinos</span><p class="family-name">${d.family.godparents}</p></div>` : ""}
  </section>`;
    }

    // D · Ceremonia
    const cer = d.locations?.ceremony;
    if (cer?.title) {
        const mapsUrl = cer.mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cer.mapQuery)}` : "#";
        s += `
  <!-- CEREMONIA -->
  <section class="section">
    <div class="section-tag">${cer.title}</div>
    <div class="event-time">${cer.time}</div>
    <div class="event-place">${cer.place}</div>
    <div class="event-address">${cer.address}</div>
    <a href="${mapsUrl}" target="_blank" class="btn-map"><i class="fa-solid fa-location-dot"></i> Ver ubicación</a>
  </section>`;
    }

    // E · Recepción
    const rec = d.locations?.reception;
    if (rec?.title) {
        const mapsUrl = rec.mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.mapQuery)}` : "#";
        s += `
  <!-- RECEPCION -->
  <section class="section surface">
    <div class="section-tag">${rec.title}</div>
    <div class="event-time">${rec.time}</div>
    <div class="event-place">${rec.place}</div>
    <div class="event-address">${rec.address}</div>
    <a href="${mapsUrl}" target="_blank" class="btn-map"><i class="fa-solid fa-location-dot"></i> Ver ubicación</a>
  </section>`;
    }

    // F · Itinerario
    const iti = d.itinerary || [];
    if (iti.length > 0) {
        s += `
  <!-- ITINERARIO -->
  <section class="section">
    <div class="section-tag">Itinerario</div>
    <div class="iti-list">
      ${iti.map(item => `
      <div class="iti-item">
        <span class="iti-time">${item.time}</span>
        <div class="iti-body">
          <span class="iti-title">${item.title}</span>
          ${item.description ? `<span class="iti-desc">${item.description}</span>` : ""}
        </div>
      </div>`).join("")}
    </div>
  </section>`;
    }

    // G · Dress Code
    const dc = d.dressCode;
    if (dc?.title) {
        s += `
  <!-- DRESS CODE -->
  <section class="section surface">
    <div class="section-tag">${dc.title}</div>
    ${dc.women?.desc ? `<div class="dress-group"><b>${dc.women.title || "Mujeres"}:</b> ${dc.women.desc}${dc.women.note ? `<br><em style="font-size:0.85em;">${dc.women.note}</em>` : ""}</div>` : ""}
    ${dc.men?.desc ? `<div class="dress-group"><b>${dc.men.title || "Hombres"}:</b> ${dc.men.desc}</div>` : ""}
  </section>`;
    }

    // H · Mesa de regalos
    const reg = d.registry;
    const hasReg = reg && (reg.lluviaSobres || (reg.options && reg.options.length > 0));
    if (hasReg) {
        s += `
  <!-- MESA REGALOS -->
  <section class="section">
    <div class="section-tag">Mesa de Regalos</div>
    ${reg.description ? `<p class="section-desc">${reg.description}</p>` : ""}
    ${reg.lluviaSobres ? `<div class="lluvia"><i class="fa-solid fa-envelope-open-text"></i><p>Lluvia de Sobres</p></div>` : ""}
    ${(reg.options || []).map(o => `<a href="${o.url || "#"}" target="_blank" class="btn-map">${o.name}</a>`).join("")}
  </section>`;
    }

    // I · Hospedaje
    const lod = d.lodging;
    if (lod?.enabled && lod.options?.length > 0) {
        s += `
  <!-- HOSPEDAJE -->
  <section class="section surface">
    <div class="section-tag">Hospedaje sugerido</div>
    ${lod.description ? `<p class="section-desc">${lod.description}</p>` : ""}
    ${lod.options.map(h => `
    <div class="hotel-card">
      <strong>${h.name}</strong>
      ${h.address ? `<p>${h.address}</p>` : ""}
      ${h.phone ? `<p>${h.phone}</p>` : ""}
      ${h.url ? `<a href="${h.url}" target="_blank" class="btn-map">Ver información</a>` : ""}
    </div>`).join("")}
  </section>`;
    }

    // J · RSVP
    const rsvp = d.rsvp;
    if (rsvp?.title) {
        s += `
  <!-- RSVP -->
  <section class="section">
    <div class="section-tag">${rsvp.title}</div>
    ${rsvp.description ? `<p class="section-desc">${rsvp.description}</p>` : ""}
    ${(rsvp.whatsappNumbers || []).map(n => `<a href="https://wa.me/${n}?text=${waText}" target="_blank" class="btn-whatsapp"><i class="fa-brands fa-whatsapp"></i> Confirmar al ${n}</a>`).join("")}
  </section>`;
    }

    // K · Créditos
    s += `
  <!-- CREDITS -->
  <footer class="credits">Invitación digital creada con Invitta</footer>`;

    return s;
}

// ─────────────────────────────────────────────
// CSS BUILDER
// ─────────────────────────────────────────────
function buildCSS(p, t) {
    return `
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: ${t.body};
      background-color: ${p.bg};
      color: ${p.text};
      line-height: 1.7;
      text-align: center;
    }

    /* HERO */
    .hero {
      min-height: 100svh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: ${p.bg};
      padding: 60px 30px;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, ${p.hero || "rgba(0,0,0,0.04)"} 0%, transparent 70%);
    }
    .hero-inner { position: relative; z-index: 1; }
    .hero-names { display: flex; flex-direction: column; align-items: center; gap: 0; margin: 20px 0; }
    .name-accent {
      font-family: ${t.accent};
      color: ${p.accent};
      font-size: clamp(2.8rem, 9vw, 5rem);
      line-height: 1.1;
    }
    h1 {
      font-family: ${t.title};
      color: ${p.accent};
      font-size: clamp(2.2rem, 7vw, 4rem);
      font-weight: 400;
    }
    .ampersand {
      font-family: ${t.title};
      font-size: clamp(1.6rem, 5vw, 2.5rem);
      color: ${p.muted};
      margin: 8px 0;
    }
    .eyebrow {
      font-family: ${t.body};
      font-size: 0.75rem;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: ${p.muted};
      margin-bottom: 16px;
    }
    .initials {
      font-family: ${t.title};
      font-size: clamp(4rem, 15vw, 8rem);
      color: ${p.accent};
      opacity: 0.12;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 0;
      line-height: 1;
    }
    .hero-date {
      font-family: ${t.body};
      font-size: 0.85rem;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: ${p.muted};
      margin-top: 24px;
    }
    .hero-quote {
      max-width: 360px;
      margin: 28px auto 0;
      font-style: italic;
      font-size: 0.95rem;
      color: ${p.muted};
      border-left: 2px solid ${p.accent};
      padding-left: 16px;
      text-align: left;
    }

    /* SECTIONS */
    .section {
      padding: 70px 28px;
      border-bottom: 1px solid ${p.surface};
    }
    .section.surface { background-color: ${p.surface}; }
    .section-tag {
      font-family: ${t.body};
      font-size: 0.72rem;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: ${p.muted};
      margin-bottom: 24px;
    }
    .section-desc {
      font-size: 0.9rem;
      color: ${p.muted};
      max-width: 400px;
      margin: 0 auto 24px;
    }

    /* COUNTDOWN */
    .countdown-section { background: ${p.bg}; }
    .countdown { display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; }
    .cd-block { display: flex; flex-direction: column; align-items: center; }
    .cd-num {
      font-family: ${t.title};
      font-size: clamp(2.5rem, 8vw, 4rem);
      color: ${p.accent};
      line-height: 1;
    }
    .cd-label { font-size: 0.65rem; letter-spacing: 2px; text-transform: uppercase; color: ${p.muted}; margin-top: 6px; }
    .cd-sep { font-family: ${t.title}; font-size: 2rem; color: ${p.muted}; align-self: flex-start; margin-top: 8px; }

    /* FAMILY */
    .family-block { margin-bottom: 20px; }
    .family-name { font-family: ${t.title}; font-size: 1.15rem; font-weight: 400; line-height: 1.4; }
    .divider-line {
      width: 40px; height: 1px;
      background: ${p.accent};
      margin: 20px auto;
    }
    .godparents { margin-top: 30px; }

    /* LOCATION */
    .event-time {
      font-family: ${t.title};
      font-size: 1.6rem;
      color: ${p.accent};
      margin-bottom: 8px;
    }
    .event-place { font-weight: 600; font-size: 1rem; margin-bottom: 6px; }
    .event-address { font-size: 0.9rem; color: ${p.muted}; margin-bottom: 24px; }

    /* ITINERARY */
    .iti-list { display: flex; flex-direction: column; gap: 24px; max-width: 400px; margin: 0 auto; text-align: left; }
    .iti-item { display: flex; gap: 20px; align-items: flex-start; }
    .iti-time { font-family: ${t.title}; color: ${p.accent}; min-width: 70px; font-size: 1rem; }
    .iti-body { display: flex; flex-direction: column; }
    .iti-title { font-weight: 600; font-size: 0.95rem; }
    .iti-desc { font-size: 0.85rem; color: ${p.muted}; margin-top: 2px; }

    /* DRESS CODE */
    .dress-group { margin-bottom: 16px; font-size: 0.95rem; }

    /* REGISTRY */
    .lluvia { margin: 20px 0; }
    .lluvia i { font-size: 2rem; color: ${p.accent}; display: block; margin-bottom: 8px; }

    /* HOTELS */
    .hotel-card { margin-bottom: 24px; }
    .hotel-card p { font-size: 0.9rem; color: ${p.muted}; }

    /* BUTTONS */
    .btn-map, .btn-whatsapp {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-family: ${t.body};
      font-size: 0.85rem;
      letter-spacing: 1px;
      text-transform: uppercase;
      transition: opacity 0.2s;
      margin: 8px auto;
    }
    .btn-map { background: ${p.accent}; color: ${p.bg}; }
    .btn-whatsapp { background: #25D366; color: #ffffff; display: flex; }
    .btn-map:hover, .btn-whatsapp:hover { opacity: 0.85; }

    /* CREDITS */
    .credits {
      padding: 32px;
      font-size: 0.75rem;
      color: ${p.bg};
      background: ${p.text};
      text-align: center;
      letter-spacing: 1px;
    }

    @media (max-width: 480px) {
      .section { padding: 50px 20px; }
    }`;
}

// ─────────────────────────────────────────────
// COUNTDOWN JS (embedded)
// ─────────────────────────────────────────────
function buildCountdownJS(targetDateTime) {
    return `
  <script>
    (function() {
      const target = new Date("${targetDateTime}").getTime();
      function pad(n) { return String(n).padStart(2, "0"); }
      function tick() {
        const now = Date.now();
        const diff = target - now;
        if (diff <= 0) {
          ["cd-days","cd-hours","cd-mins","cd-secs"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "00";
          });
          return;
        }
        const days  = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins  = Math.floor((diff % 3600000) / 60000);
        const secs  = Math.floor((diff % 60000) / 1000);
        const dEl = document.getElementById("cd-days");   if(dEl) dEl.textContent = pad(days);
        const hEl = document.getElementById("cd-hours");  if(hEl) hEl.textContent = pad(hours);
        const mEl = document.getElementById("cd-mins");   if(mEl) mEl.textContent = pad(mins);
        const sEl = document.getElementById("cd-secs");   if(sEl) sEl.textContent = pad(secs);
      }
      tick();
      setInterval(tick, 1000);
    })();
  <\/script>`;
}

// ─────────────────────────────────────────────
// MAIN GENERATOR
// ─────────────────────────────────────────────
function generateInvitation() {
    if (!loadedConfig) return;
    const d = loadedConfig;

    const p = getPaletteColors(d.visual.palette, d.visual.customPalette);
    const t = getTypography(d.visual.typography, d.visual.handwritten);
    const fontUrl = buildGoogleFontsUrl(d.visual.typography, d.visual.handwritten);
    const isBoda = d.event.type === "boda";
    const titleName = isBoda
        ? `${d.event.primaryName} & ${d.event.secondaryName || ""}`.trim()
        : `XV Años de ${d.event.primaryName}`;

    const css = buildCSS(p, t);
    const sections = buildSections(d, p, t);
    const countdownJS = d.event.countdownDateTime ? buildCountdownJS(d.event.countdownDateTime) : "";
    const customNote = p.customNote ? `<div style="background:#fff3cd;color:#856404;padding:8px 14px;font-size:0.8rem;text-align:center;">Colores solicitados: ${p.customNote}</div>` : "";

    finalHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
${css}
  </style>
</head>
<body>
${customNote}
${sections}
${countdownJS}
</body>
</html>`;

    // Mostrar resultado en la UI
    document.getElementById("generateCard").style.display = "none";
    const resultCard = document.getElementById("resultCard");
    resultCard.style.display = "block";

    const successMsg = document.getElementById("successMsg");
    successMsg.textContent = `✅ Invitación generada correctamente (${(finalHTML.length / 1024).toFixed(1)} KB). Haz clic en "Descargar" para obtener el archivo.`;
    successMsg.style.display = "block";

    // Mostrar preview de código (primeras 80 líneas)
    const preview = finalHTML.split("\n").slice(0, 80).join("\n") + "\n\n... (archivo completo disponible al descargar)";
    document.getElementById("codePreview").textContent = preview;

    resultCard.scrollIntoView({ behavior: "smooth" });
}

// ─────────────────────────────────────────────
// DOWNLOAD
// ─────────────────────────────────────────────
function downloadFinal() {
    if (!finalHTML) return;
    const blob = new Blob([finalHTML], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invitacion-final.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
