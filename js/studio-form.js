/**
 * studio-form.js
 * Lógica para crear y editar invitaciones en Invitta Studio
 */


const TEMPLATE_FALLBACKS = {
  xv: [
    { id: "xv-elegance-basic", name: "Élégance XV", packageLabel: "Esencial" },
    { id: "xv-rose-gold-premium", name: "Rose Gold XV", packageLabel: "Premium" },
    { id: "xv-champagne-rose-vip", name: "Champagne Rose", packageLabel: "VIP Experience" }
  ],
  boda: [
    { id: "boda-classic-basic", name: "Classic Wedding", packageLabel: "Esencial" },
    { id: "boda-golden-romance-premium", name: "Golden Romance", packageLabel: "Premium" },
    { id: "boda-midnight-gold-vip", name: "Midnight Gold Wedding", packageLabel: "VIP Experience" }
  ]
};

function getTemplatesByType(eventType) {
  if (window.InvittaTemplateCatalog) {
    const templates = window.InvittaTemplateCatalog
      .getByType(eventType)
      .filter(template => template.status === "active");

    if (templates.length) return templates;
  }

  return TEMPLATE_FALLBACKS[eventType] || [];
}

function updatePackageSummary() {
  const summary = document.getElementById("studio-package-summary");
  const templateId = document.getElementById("template_id")?.value;
  if (!summary) return;

  const template = window.InvittaTemplateCatalog?.getById(templateId);
  if (!template) {
    summary.hidden = true;
    summary.replaceChildren();
    return;
  }

  const features = template.features || {};
  const details = [
    `Galería: hasta ${template.galleryLimit || 10} fotos`,
    features.music ? "Música incluida" : "Sin música",
    features.itinerary ? "Itinerario incluido" : "Sin itinerario",
    features.qr ? "Pase QR y control de acceso" : "RSVP por WhatsApp",
    `Vigencia: ${template.activeMonths || 2} meses`
  ];

  const heading = document.createElement("strong");
  heading.textContent = `${template.packageLabel}:`;
  summary.replaceChildren(heading);

  details.forEach(detail => {
    const item = document.createElement("span");
    item.className = "studio-package-feature";
    item.textContent = detail;
    summary.appendChild(item);
  });

  summary.hidden = false;
}

const VALID_TEMPLATES = {
  xv: getTemplatesByType("xv").map(template => template.id),
  boda: getTemplatesByType("boda").map(template => template.id)
};

let isEditMode = false;
let originalTemplateId = null;
let originalEventType = null;

function splitLegacyXvHeading(title, honoreeName, eventType) {
  let eventTitle = String(title || "").trim();
  let honoree = String(honoreeName || "").trim();

  if (String(eventType || "").toLowerCase() !== "xv") {
    return { title: eventTitle, honoree };
  }

  if (!honoree) {
    const legacyTitle = eventTitle.match(/^(.*?\b(?:XV|15)\s+A(?:\u00f1|n)os)(?:\s+de)?\s+(.+)$/i);

    if (legacyTitle) {
      eventTitle = legacyTitle[1].trim();
      honoree = legacyTitle[2].trim();
    }
  } else {
    const escapedName = honoree.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    eventTitle = eventTitle
      .replace(new RegExp("\\s+(de|para)\\s+" + escapedName + "\\s*$", "i"), "")
      .replace(new RegExp("\\s+" + escapedName + "\\s*$", "i"), "")
      .trim();
  }

  if (/^xv\s+a(?:\u00f1|n)os$/i.test(eventTitle)) {
    eventTitle = "Mis XV Años";
  }

  return { title: eventTitle || "Mis XV Años", honoree };
}

function updateTemplateOptions(options = { preserveLegacyNull: false, preferredTemplateId: null }) {
  const eventType = document.getElementById("event_type").value;
  const templateSelect = document.getElementById("template_id");
  const currentVal = templateSelect.value;
  
  templateSelect.innerHTML = "";
  
  const showLegacyNull = isEditMode && originalTemplateId === null && options.preserveLegacyNull;

  if (showLegacyNull) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Diseño anterior / sin plantilla asignada";
    templateSelect.appendChild(opt);
  }
  
  const opts = getTemplatesByType(eventType).map(template => ({
    val: template.id,
    text: `${template.name} — ${template.packageLabel || template.level || "Plantilla"}`
  }));
  const validArray = VALID_TEMPLATES[eventType] || [];

  opts.forEach(o => {
    const opt = document.createElement("option");
    opt.value = o.val;
    opt.textContent = o.text;
    templateSelect.appendChild(opt);
  });
  
  const preferred = options.preferredTemplateId;
  const isPreferredValid = preferred && validArray.includes(preferred);
  const isCurrentValid = currentVal && validArray.includes(currentVal);

  if (isPreferredValid) {
    templateSelect.value = preferred;
  } else if (showLegacyNull && (!currentVal || currentVal === "")) {
    templateSelect.value = "";
  } else if (isCurrentValid) {
    templateSelect.value = currentVal;
  } else {
    templateSelect.value = eventType === "xv" ? "xv-rose-gold-premium" : "boda-classic-basic";
  }

  updatePackageSummary();
}

document.addEventListener("DOMContentLoaded", () => {
  const et = document.getElementById("event_type");
  if (et) {
    et.addEventListener("change", () => {
      // El usuario cambió explícitamente el tipo de evento
      updateTemplateOptions({ preserveLegacyNull: false });
    });
  }

  const templateSelect = document.getElementById("template_id");
  if (templateSelect) templateSelect.addEventListener("change", updatePackageSummary);
});

function parseItineraryText(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split("|");
      if (parts.length >= 2) {
        return {
          time: parts[0].trim(),
          title: parts.slice(1).join("|").trim()
        };
      }
      return {
        time: "",
        title: line.trim()
      };
    })
    .filter(item => item.title);
}

function itineraryToText(value) {
  let items = [];

  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      items = Array.isArray(parsed) ? parsed : [];
    } catch {
      items = [];
    }
  }

  return items
    .map(item => {
      const time = item.time || "";
      const title = item.title || "";
      return time ? `${time} | ${title}` : title;
    })
    .filter(Boolean)
    .join("\n");
}

function cleanMusicFileName(filename) {
  if (!filename) return "";
  const decoded = decodeURIComponent(filename);
  return decoded
    .replace(/\.(mp3|m4a|wav|ogg)$/i, "")
    .replace(/^\d+[-_]/, "")
    .trim();
}

function getChecked(id) {
  const el = document.getElementById(id);
  return Boolean(el && el.checked);
}

function parseConfirmationNumbers(value) {
  return String(value || "")
    .split(/[|,;\n]+/)
    .map(number => number.trim())
    .filter(Boolean)
    .slice(0, 2);
}

function serializeConfirmationNumbers(primary, secondary) {
  return [primary, secondary]
    .map(number => String(number || "").trim())
    .filter(Boolean)
    .join("|");
}

function setupStudioVisualPreview() {
  const fontSelect = document.getElementById("font_preset");
  const paletteSelect = document.getElementById("palette_preset");
  const titleColorSelect = document.getElementById("title_color");
  const bodyColorSelect = document.getElementById("body_color");
  const accentColorSelect = document.getElementById("accent_color");
  const customFontInput = document.getElementById("customFontFile");
  const customFontNameInput = document.getElementById("customFontName");
  const customFontUrlInput = document.getElementById("customFontUrl");
  const customFontTargetInputs = Array.from(document.querySelectorAll('input[name="custom_font_target"]'));
  const removeCustomFontBtn = document.getElementById("removeCustomFontBtn");
  const fontOptions = document.getElementById("studio-font-options");
  const paletteOptions = document.getElementById("studio-palette-options");
  const previewPhone = document.getElementById("studio-preview-phone");

  if (!fontSelect || !paletteSelect || !fontOptions || !paletteOptions || !previewPhone) return;

  const fonts = {
    classic: {
      label: "Clasica elegante",
      sample: "Elegancia",
      display: '"Cormorant Garamond", Georgia, serif',
      body: '"Montserrat", Arial, sans-serif'
    },
    romantic: {
      label: "Romantica script",
      sample: "Con amor",
      display: '"Great Vibes", "Cormorant Garamond", cursive',
      body: '"Montserrat", Arial, sans-serif'
    },
    editorial: {
      label: "Editorial fine art",
      sample: "Editorial",
      display: '"Playfair Display", Georgia, serif',
      body: '"Montserrat", Arial, sans-serif'
    },
    minimal: {
      label: "Moderna minimal",
      sample: "MODERNA",
      display: '"Montserrat", Arial, sans-serif',
      body: '"Montserrat", Arial, sans-serif'
    },
    luxury: {
      label: "Luxury dramatica",
      sample: "Gala",
      display: '"Playfair Display", Georgia, serif',
      body: '"Montserrat", Arial, sans-serif'
    },
    signature: {
      label: "Firma organica",
      sample: "Siempre",
      display: '"Allura", "Great Vibes", cursive',
      body: '"Cormorant Garamond", Georgia, serif'
    },
    couture: {
      label: "Caligrafia couture",
      sample: "Amour",
      display: '"Parisienne", "Great Vibes", cursive',
      body: '"Montserrat", Arial, sans-serif'
    },
    custom: {
      label: "Tipografia personalizada",
      sample: "Tu estilo",
      display: '"InvittaCustomPreview", "Cormorant Garamond", Georgia, serif',
      body: '"Montserrat", Arial, sans-serif'
    }
  };

  const palettes = {
    original: {
      label: "Original del diseno",
      surface: "#FFFAF5",
      card: "#FFFFFF",
      title: "#342D29",
      body: "#756961",
      accent: "#C9867A"
    },
    champagne: {
      label: "Champagne suave",
      legacy: true,
      surface: "#FBF6EE",
      card: "#FFFDF9",
      title: "#3B3028",
      body: "#6D6259",
      accent: "#B99654"
    },
    rose: {
      label: "Rosa editorial",
      legacy: true,
      surface: "#FFF5F4",
      card: "#FFFCFA",
      title: "#4A3236",
      body: "#755F62",
      accent: "#C88A7E"
    },
    sage: {
      label: "Salvia y marfil",
      legacy: true,
      surface: "#F6F7F0",
      card: "#FFFEF8",
      title: "#344039",
      body: "#667066",
      accent: "#718067"
    },
    emerald: {
      label: "Esmeralda y oro",
      legacy: true,
      surface: "#F3F4EF",
      card: "#FCFBF5",
      title: "#173B30",
      body: "#53615B",
      accent: "#B99654"
    },
    midnight: {
      label: "Noche y oro",
      legacy: true,
      surface: "#17131A",
      card: "#251E27",
      title: "#F4EADF",
      body: "#CBBFC6",
      accent: "#D5AF54"
    },
    "terracotta-sand": {
      label: "Terracota y arena",
      surface: "#F4E6D8",
      card: "#FFF8F0",
      title: "#512F28",
      body: "#74564A",
      accent: "#D26345"
    },
    "plum-olive": {
      label: "Ciruela y olivo",
      surface: "#EEEBDD",
      card: "#F8F5EC",
      title: "#3D1831",
      body: "#5F5C42",
      accent: "#7A7D45"
    },
    "opal-blue": {
      label: "Opalo azul",
      surface: "#EAF2F4",
      card: "#F8FAFC",
      title: "#263B5B",
      body: "#59697B",
      accent: "#8B79A8"
    },
    "emerald-jewel": {
      label: "Esmeralda joya",
      surface: "#E8EFEA",
      card: "#F8F7F0",
      title: "#0E3B31",
      body: "#3F5B52",
      accent: "#C19A3C"
    },
    "celestial-navy": {
      label: "Azul celestial",
      surface: "#0C1630",
      card: "#142345",
      title: "#F5EBD5",
      body: "#C9D1E2",
      accent: "#D6AF4B"
    }
  };

  function createOptionButton(value, definition, type) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "studio-visual-option";
    button.dataset.value = value;

    if (type === "font") {
      const sample = document.createElement("span");
      sample.className = "studio-font-sample";
      sample.textContent = definition.sample;
      sample.style.fontFamily = definition.display;
      button.appendChild(sample);
    } else {
      const swatches = document.createElement("span");
      swatches.className = "studio-palette-swatches";
      [definition.surface, definition.title, definition.body, definition.accent].forEach(color => {
        const swatch = document.createElement("span");
        swatch.className = "studio-palette-swatch";
        swatch.style.backgroundColor = color;
        swatches.appendChild(swatch);
      });
      button.appendChild(swatches);
    }

    const label = document.createElement("span");
    label.className = "studio-option-label";
    label.textContent = definition.label;
    button.appendChild(label);

    button.addEventListener("click", () => {
      const select = type === "font" ? fontSelect : paletteSelect;
      if (type === "font" && value === "custom" && !customFontUrlInput?.value && !customFontInput?.files?.[0]) {
        customFontInput?.click();
        return;
      }
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    return button;
  }

  Object.entries(fonts).forEach(([value, definition]) => {
    fontOptions.appendChild(createOptionButton(value, definition, "font"));
  });

  Object.entries(palettes)
    .filter(([, definition]) => !definition.legacy)
    .forEach(([value, definition]) => {
      paletteOptions.appendChild(createOptionButton(value, definition, "palette"));
    });

  let customFontObjectUrl = "";

  function getSelectedCustomFontTargets() {
    return customFontTargetInputs
      .filter(input => input.checked)
      .map(input => input.value);
  }

  function clearCustomFontError() {
    const errorElement = document.getElementById("custom-font-error");
    if (!errorElement) return;
    errorElement.textContent = "";
    errorElement.classList.remove("visible");
  }

  function showCustomFontError(message) {
    const errorElement = document.getElementById("custom-font-error");
    if (!errorElement) return;
    errorElement.textContent = message;
    errorElement.classList.add("visible");
  }

  function updateCustomFontCard() {
    const option = fontOptions.querySelector('[data-value="custom"]');
    const label = option?.querySelector(".studio-option-label");
    const sample = option?.querySelector(".studio-font-sample");
    const name = customFontNameInput?.value.trim();
    if (label) label.textContent = name || fonts.custom.label;
    if (sample) sample.textContent = name || fonts.custom.sample;
  }

  async function loadCustomFontPreview(source) {
    if (!source || typeof FontFace !== "function") return;
    try {
      const customFont = new FontFace("InvittaCustomPreview", `url(${JSON.stringify(source)})`);
      await customFont.load();
      document.fonts.add(customFont);
      fontSelect.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (error) {
      console.error("No se pudo previsualizar la tipografia personalizada:", error);
      showCustomFontError("No se pudo previsualizar este archivo de tipografía.");
    }
  }

  customFontInput?.addEventListener("change", () => {
    const file = customFontInput.files?.[0];
    clearCustomFontError();
    if (!file) return;

    if (!customFontNameInput.value.trim()) {
      customFontNameInput.value = file.name.replace(/\.(woff2?|ttf|otf)$/i, "");
    }
    if (customFontObjectUrl) URL.revokeObjectURL(customFontObjectUrl);
    customFontObjectUrl = URL.createObjectURL(file);
    updateCustomFontCard();
    fontSelect.value = "custom";
    loadCustomFontPreview(customFontObjectUrl);
  });

  customFontNameInput?.addEventListener("input", updateCustomFontCard);

  removeCustomFontBtn?.addEventListener("click", () => {
    if (customFontObjectUrl) URL.revokeObjectURL(customFontObjectUrl);
    customFontObjectUrl = "";
    if (customFontInput) customFontInput.value = "";
    if (customFontUrlInput) customFontUrlInput.value = "";
    if (customFontNameInput) customFontNameInput.value = "";
    customFontTargetInputs.forEach(input => {
      input.checked = input.value !== "body";
    });
    document.getElementById("custom-font-current")?.classList.remove("visible");
    updateCustomFontCard();
    if (fontSelect.value === "custom") {
      fontSelect.value = "classic";
      fontSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  updateCustomFontCard();
  if (customFontUrlInput?.value) loadCustomFontPreview(customFontUrlInput.value);

  function formatPreviewDate(value) {
    if (!value) return "28 · NOVIEMBRE · 2026";
    const parts = value.split("-");
    if (parts.length !== 3) return value;
    const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const month = months[Number(parts[1]) - 1] || parts[1];
    return `${Number(parts[2])} · ${month} · ${parts[0]}`;
  }

  function updatePreview() {
    const palette = palettes[paletteSelect.value] || palettes.original;
    const font = fonts[fontSelect.value] || fonts.classic;
    const customTargets = new Set(getSelectedCustomFontTargets());
    const isCustomFont = fontSelect.value === "custom";
    const defaultDisplay = fonts.classic.display;
    const defaultBody = fonts.classic.body;
    const selectedTitle = titleColorSelect?.value || palette.title;
    const selectedBody = bodyColorSelect?.value || palette.body;
    const selectedAccent = accentColorSelect?.value || palette.accent;
    const eventType = document.getElementById("event_type")?.value || "xv";
    const honoree = document.getElementById("honoree_name")?.value.trim();
    const title = document.getElementById("title")?.value.trim();
    const eventDate = document.getElementById("event_date")?.value || "";

    previewPhone.style.setProperty("--preview-surface", palette.surface);
    previewPhone.style.setProperty("--preview-card", palette.card);
    previewPhone.style.setProperty("--preview-title", selectedTitle);
    previewPhone.style.setProperty("--preview-body", selectedBody);
    previewPhone.style.setProperty("--preview-accent", selectedAccent);
    previewPhone.style.setProperty("--preview-title-font", isCustomFont && !customTargets.has("titles") ? defaultDisplay : font.display);
    previewPhone.style.setProperty("--preview-subtitle-font", isCustomFont && !customTargets.has("subtitles") ? defaultDisplay : font.display);
    previewPhone.style.setProperty("--preview-name-font", isCustomFont && !customTargets.has("names") ? defaultDisplay : font.display);
    previewPhone.style.setProperty("--preview-body-font", isCustomFont && !customTargets.has("body") ? defaultBody : (isCustomFont ? font.display : font.body));
    previewPhone.dataset.font = fontSelect.value;

    const previewEyebrow = document.getElementById("studio-preview-eyebrow");
    const previewName = document.getElementById("studio-preview-name");
    const previewDate = document.getElementById("studio-preview-date");
    const previewEventTitle = document.getElementById("studio-preview-event-title");

    if (previewEyebrow) previewEyebrow.textContent = eventType === "boda" ? "NUESTRA BODA" : "MIS QUINCE ANOS";
    if (previewName) previewName.textContent = honoree || (eventType === "boda" ? "Ana & Carlos" : "Maria");
    if (previewDate) previewDate.textContent = formatPreviewDate(eventDate);
    if (previewEventTitle) previewEventTitle.textContent = title || (eventType === "boda" ? "Nuestra celebracion" : "Una noche especial");

    fontOptions.querySelectorAll(".studio-visual-option").forEach(option => {
      const selected = option.dataset.value === fontSelect.value;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });

    paletteOptions.querySelectorAll(".studio-visual-option").forEach(option => {
      const selected = option.dataset.value === paletteSelect.value;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
  }

  [fontSelect, paletteSelect, titleColorSelect, bodyColorSelect, accentColorSelect]
    .filter(Boolean)
    .forEach(select => select.addEventListener("change", updatePreview));

  customFontTargetInputs.forEach(input => input.addEventListener("change", updatePreview));

  ["title", "honoree_name", "event_date"]
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .forEach(input => input.addEventListener("input", updatePreview));

  document.getElementById("event_type")?.addEventListener("change", updatePreview);
  updatePreview();
}

document.addEventListener("DOMContentLoaded", async () => {
  const session = await window.studioAuth.requireSession();
  if (!session) return;

  const db = window.studioAuth.db;
  const urlParams = new URLSearchParams(window.location.search);
  let inviteId = urlParams.get("id");
  const requestId = urlParams.get("request");
  let isEditMode = !!inviteId;
  
  // Elementos del DOM
  const form = document.getElementById("invitation-form");
  const loading = document.getElementById("loading-indicator");
  const errorAlert = document.getElementById("form-error");
  const successAlert = document.getElementById("form-success");
  const pageTitle = document.getElementById("page-title");
  const saveBtn = document.getElementById("save-btn");
  const previewBtn = document.getElementById("preview-invitation-btn");
  const copyLinkBtn = document.getElementById("copy-invitation-link-btn");

  // URLs actuales (preservar si no se sube archivo nuevo)
  let existingPhotoUrl = null;
  let existingMusicUrl = null;
  let existingBackgroundUrl = null;
  let existingGalleryUrls = [];
  let galleryDraftItems = [];

  let currentStudioId = null;
  let isCurrentStudioManager = false;
  let currentSlug = "";
  let sourceRequestId = requestId || null;

  function getCurrentSlugValue() {
    return (document.getElementById("slug")?.value || currentSlug || "").trim();
  }

  function getPublicInvitationUrl(slug) {
    const params = new URLSearchParams({
      slug,
      v: `share-${Date.now()}`
    });
    return `https://invitta.vercel.app/invitacion.html?${params.toString()}`;
  }

  function getPreviewInvitationUrl(slug) {
    const params = new URLSearchParams({
      slug,
      n: "Familia Garcia",
      p: "4",
      m: "5",
      preview: "studio",
      v: `preview-${Date.now()}`
    });
    return `https://invitta.vercel.app/invitacion.html?${params.toString()}`;
  }

  function requireSlugForAction() {
    const slug = getCurrentSlugValue();
    if (!slug) {
      alert("Primero guarda o escribe el slug de la invitación.");
      return "";
    }
    return slug;
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  function showSuccessMessage(message) {
    successAlert.textContent = message;
    successAlert.style.display = "block";
  }

  function applySalesRequestStyles(request) {
    const paletteStyles = {
      "Rosa y champagne": { theme: "rose-floral", primary: "#B97D88", secondary: "#F4DADD" },
      "Marfil y salvia": { theme: "classic-champagne", primary: "#7A9068", secondary: "#F2E7D6" },
      "Esmeralda y oro": { theme: "gold-marble", primary: "#2E7D52", secondary: "#D4AF37" },
      "Olivo y arena": { theme: "classic-champagne", primary: "#68765A", secondary: "#B87C55" },
      "Ciruela, negro y oro": { theme: "black-luxury", primary: "#5A203E", secondary: "#D4AF37" }
    };
    const typographyStyles = {
      "Editorial serif": "editorial",
      "Romantico con script": "romantic",
      "Clasico y atemporal": "classic",
      "Moderno y limpio": "minimal",
      "Noir de gala": "luxury"
    };
    const palette = paletteStyles[request.palette_preference];

    if (palette) {
      document.getElementById("visual_theme").value = palette.theme;
      document.getElementById("color_primary").value = palette.primary;
      document.getElementById("color_secondary").value = palette.secondary;
      const palettePreset = document.getElementById("palette_preset");
      if (palettePreset) {
        palettePreset.value = {
          "Rosa y champagne": "terracotta-sand",
          "Marfil y salvia": "plum-olive",
          "Esmeralda y oro": "emerald-jewel",
          "Olivo y arena": "plum-olive",
          "Ciruela, negro y oro": "celestial-navy"
        }[request.palette_preference] || "original";
      }
    }

    const fontPreset = typographyStyles[request.typography_preference];
    if (fontPreset) document.getElementById("font_preset").value = fontPreset;
  }

  async function loadSalesRequest(id) {
    const { data: request, error } = await db
      .from("invitation_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !request) {
      errorAlert.textContent = "No se pudo abrir la solicitud comercial.";
      errorAlert.style.display = "block";
      sourceRequestId = null;
      return;
    }

    if (request.assigned_studio_id && request.assigned_studio_id !== currentStudioId) {
      errorAlert.textContent = "Esta solicitud ya fue asignada a otro estudio.";
      errorAlert.style.display = "block";
      sourceRequestId = null;
      return;
    }

    if (!request.assigned_studio_id) {
      const { data: claimedRequest, error: claimError } = await db
        .from("invitation_requests")
        .update({
          assigned_studio_id: currentStudioId,
          claimed_by: session.user.id,
          claimed_at: new Date().toISOString(),
          status: request.status === "new" ? "in_progress" : request.status
        })
        .eq("id", request.id)
        .is("assigned_studio_id", null)
        .select("*")
        .single();

      if (claimError || !claimedRequest) {
        errorAlert.textContent = "No se pudo asignar la solicitud a este estudio.";
        errorAlert.style.display = "block";
        sourceRequestId = null;
        return;
      }

      Object.assign(request, claimedRequest);
    }

    const requestEventType = VALID_TEMPLATES[request.event_type] ? request.event_type : "xv";
    document.getElementById("event_type").value = requestEventType;
    updateTemplateOptions({
      preserveLegacyNull: false,
      preferredTemplateId: request.requested_template_id
    });
    document.getElementById("title").value = requestEventType === "xv" ? "Mis XV A\u00f1os" : "Nuestra Boda";
    document.getElementById("event_date").value = request.event_date || "";
    applySalesRequestStyles(request);
    pageTitle.textContent = "Crear invitacion desde solicitud";
    showSuccessMessage("Solicitud precargada. Completa los nombres y los detalles del evento antes de guardar.");
  }

  previewBtn?.addEventListener("click", () => {
    const slug = requireSlugForAction();
    if (!slug) return;
    window.open(getPreviewInvitationUrl(slug), "_blank", "noopener");
  });

  copyLinkBtn?.addEventListener("click", async () => {
    const slug = requireSlugForAction();
    if (!slug) return;

    try {
      await copyTextToClipboard(getPublicInvitationUrl(slug));
      showSuccessMessage("Enlace copiado.");
    } catch (err) {
      console.error(err);
      alert("Error al copiar el enlace.");
    }
  });

  const openLinkBuilderBtn = document.getElementById("openLinkBuilderBtn");
  openLinkBuilderBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    const slug = requireSlugForAction();
    if (!slug) return;
    window.open(`/invitacion-link.html?slug=${slug}`, "_blank", "noopener");
  });

  const openEmergencyPassBuilderButton = document.getElementById("openEmergencyPassBuilderButton");
  openEmergencyPassBuilderButton?.addEventListener("click", (e) => {
    e.preventDefault();
    const slug = requireSlugForAction();
    if (!slug) return;
    window.open(`/invitacion-link.html?slug=${encodeURIComponent(slug)}`, "_blank", "noopener,noreferrer");
  });

  const copyEmergencyPassBuilderLinkButton = document.getElementById("copyEmergencyPassBuilderLinkButton");
  copyEmergencyPassBuilderLinkButton?.addEventListener("click", async (e) => {
    e.preventDefault();
    const slug = requireSlugForAction();
    if (!slug) return;
    const url = `${window.location.origin}/invitacion-link.html?slug=${encodeURIComponent(slug)}`;
    try {
      await copyTextToClipboard(url);
      showSuccessMessage("Link del generador copiado.");
    } catch (err) {
      console.error(err);
      alert("Error al copiar el enlace del generador.");
    }
  });

  // Resolve the saved Studio only after verifying that it still belongs to this user.
  {
    const preferredStudioId = new URLSearchParams(window.location.search).get("studio_id")
      || localStorage.getItem("invitta_studio_id");
    const { studio, error: studiosError } = await window.studioAuth.resolveStudioContext(preferredStudioId);
    if (studiosError || !studio) {
      errorAlert.textContent = "No se pudo encontrar tu estudio.";
      errorAlert.style.display = "block";
      loading.style.display = "none";
      return;
    }
    currentStudioId = studio.studio_id;
    isCurrentStudioManager = ["owner", "manager"].includes(studio.studio_role);
    localStorage.setItem("invitta_studio_id", currentStudioId);

    if (!isCurrentStudioManager) {
      const publishedInput = document.getElementById("published");
      if (publishedInput) {
        publishedInput.disabled = true;
        publishedInput.title = "Solo responsables del Studio pueden publicar invitaciones.";
      }
    }
  }

  // Si es modo edición, cargar datos
  if (isEditMode) {
    pageTitle.textContent = "Editar Invitación";
    await loadInvitationData(inviteId);
  } else {
    // Modo creación
    updateTemplateOptions({ preserveLegacyNull: false });
    if (sourceRequestId) await loadSalesRequest(sourceRequestId);
    loading.style.display = "none";
    form.style.display = "block";
  }

  setupStudioVisualPreview();

  // Preview de foto al seleccionar archivo local
  const mainPhotoInput = document.getElementById("mainPhotoFile");
  if (mainPhotoInput) {
    mainPhotoInput.addEventListener("change", () => {
      const file = mainPhotoInput.files[0];
      clearMediaError("photo");
      if (!file) return;
      const preview = document.getElementById("photo-preview");
      if (preview) {
        preview.src = URL.createObjectURL(file);
        preview.classList.add("visible");
      }
    });
  }

  const musicInput = document.getElementById("musicFile");
  if (musicInput) {
    musicInput.addEventListener("change", () => {
      const file = musicInput.files[0];
      clearMediaError("music");
      if (!file) return;
      const titleInput = document.getElementById("music_title");
      if (titleInput) {
        titleInput.value = cleanMusicFileName(file.name);
      }
    });
  }

  // ── uploadFileToStorage ──────────────────────────────────────────
  /**
   * Sube un archivo al bucket "invitation-assets" en Supabase Storage.
   * @param {File} file - El archivo a subir.
   * @param {string} folder - Subcarpeta: "main-photo" o "music".
   * @param {string} slug - Slug de la invitación.
   * @returns {Promise<string|null>} URL pública del archivo, o null si falla.
   */
  async function uploadFileToStorage(file, folder, slug) {
    const timestamp = Date.now();
    // Sanitizar nombre de archivo: sin espacios ni caracteres especiales
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    const path = `studio-assets/${currentStudioId}/${slug}/${folder}/${timestamp}-${safeName}`;

    const { data, error } = await db.storage
      .from("invitation-assets")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error(`Error subiendo ${folder}:`, error);
      return null;
    }

    const { data: publicData } = db.storage
      .from("invitation-assets")
      .getPublicUrl(path);

    return publicData?.publicUrl || null;
  }

  // ── Validaciones de archivo ───────────────────────────────────────
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const ALLOWED_AUDIO_TYPES = [
    "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a",
    "audio/wav", "audio/ogg", "audio/vnd.wav",
  ];
  const MAX_PHOTO_BYTES = 8 * 1024 * 1024;   // 8 MB
  const MAX_MUSIC_BYTES = 15 * 1024 * 1024;  // 15 MB
  const ALLOWED_FONT_EXTENSIONS = ["woff2", "woff", "ttf", "otf"];
  const MAX_FONT_BYTES = 3 * 1024 * 1024;

  function showMediaError(type, message) {
    const el = document.getElementById(`${type}-error`);
    if (el) { el.textContent = message; el.classList.add("visible"); }
  }

  function clearMediaError(type) {
    const el = document.getElementById(`${type}-error`);
    if (el) { el.textContent = ""; el.classList.remove("visible"); }
  }

  function showProgress(type) {
    const el = document.getElementById(`${type}-progress`);
    if (el) el.classList.add("visible");
  }

  function hideProgress(type) {
    const el = document.getElementById(`${type}-progress`);
    if (el) el.classList.remove("visible");
  }

  function validateFile(file, allowedTypes, maxBytes, type) {
    if (!allowedTypes.includes(file.type)) {
      showMediaError(type, `Tipo de archivo no permitido: ${file.type}`);
      return false;
    }
    if (file.size > maxBytes) {
      const mb = Math.round(maxBytes / 1024 / 1024);
      showMediaError(type, `El archivo excede el tamaño máximo de ${mb} MB.`);
      return false;
    }
    return true;
  }

  function validateFontFile(file) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_FONT_EXTENSIONS.includes(extension)) {
      showMediaError("custom-font", "Usa un archivo WOFF2, WOFF, TTF u OTF.");
      return false;
    }
    if (file.size > MAX_FONT_BYTES) {
      showMediaError("custom-font", "La tipografía excede el tamaño máximo de 3 MB.");
      return false;
    }
    return true;
  }

  // ── Normalizar gallery_urls ───────────────────────────────────────
  function normalizeGalleryUrls(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).slice(0, 10);
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 10) : [];
    } catch {
      return [];
    }
  }

  function revokeGalleryPreview(item) {
    if (item?.kind === "file" && item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }

  function clearSelectedGalleryPreviews() {
    galleryDraftItems.forEach(revokeGalleryPreview);
  }

  function createGalleryFileItem(file) {
    return {
      kind: "file",
      file,
      previewUrl: URL.createObjectURL(file)
    };
  }

  function getActiveGalleryItems() {
    return galleryDraftItems.map((item, index) => ({
      src: item.kind === "file" ? item.previewUrl : item.url,
      alt: item.kind === "file" ? (item.file.name || `Foto ${index + 1}`) : `Foto ${index + 1}`
    }));
  }

  function renderGalleryThumbnails() {
    const galCurrent = document.getElementById("gallery-current");
    const galCount = document.getElementById("gallery-count-label");
    const galThumbs = document.getElementById("gallery-thumbnails");
    const galHint = document.getElementById("gallery-order-hint");
    const galNotice = document.getElementById("gallery-replace-warning");
    const items = getActiveGalleryItems();

    if (galCurrent) galCurrent.style.display = items.length ? "block" : "none";
    if (galHint) galHint.hidden = items.length < 2;
    if (galNotice) galNotice.style.display = items.length ? "block" : "none";
    if (galCount) {
      galCount.textContent = `Galer\u00eda: ${items.length} foto${items.length !== 1 ? "s" : ""}`;
    }
    if (!galThumbs) return;

    galThumbs.innerHTML = "";
    items.forEach((item, index) => {
      const wrap = document.createElement("div");
      wrap.className = "gallery-thumb-wrap";
      wrap.draggable = true;
      wrap.dataset.index = String(index);

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.alt;
      img.loading = "lazy";

      const order = document.createElement("span");
      order.className = "gallery-order-badge";
      order.textContent = String(index + 1);
      order.setAttribute("aria-hidden", "true");

      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "gallery-drag-handle";
      handle.setAttribute("aria-label", `Mover foto ${index + 1}`);
      handle.title = "Arrastrar para reordenar";

      const grip = document.createElement("span");
      grip.className = "gallery-drag-grip";
      grip.setAttribute("aria-hidden", "true");

      const actions = document.createElement("div");
      actions.className = "gallery-thumb-actions";

      const replaceButton = document.createElement("button");
      replaceButton.type = "button";
      replaceButton.className = "gallery-thumb-action gallery-replace-button";
      replaceButton.textContent = "Cambiar";
      replaceButton.setAttribute("aria-label", `Sustituir foto ${index + 1}`);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "gallery-thumb-action gallery-delete-button";
      deleteButton.textContent = "Eliminar";
      deleteButton.setAttribute("aria-label", `Eliminar foto ${index + 1}`);

      const replaceInput = document.createElement("input");
      replaceInput.type = "file";
      replaceInput.accept = "image/jpeg,image/jpg,image/png,image/webp";
      replaceInput.hidden = true;

      replaceButton.addEventListener("click", (event) => {
        event.stopPropagation();
        replaceInput.click();
      });

      replaceInput.addEventListener("change", () => {
        const file = replaceInput.files?.[0];
        if (!file || !validateFile(file, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, "gallery")) return;
        clearMediaError("gallery");
        revokeGalleryPreview(galleryDraftItems[index]);
        galleryDraftItems[index] = createGalleryFileItem(file);
        renderGalleryThumbnails();
      });

      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!window.confirm(`\u00bfEliminar la foto ${index + 1} de la galer\u00eda?`)) return;
        const [removed] = galleryDraftItems.splice(index, 1);
        revokeGalleryPreview(removed);
        renderGalleryThumbnails();
      });

      handle.appendChild(grip);
      actions.append(replaceButton, deleteButton);
      wrap.append(img, order, handle, actions, replaceInput);
      galThumbs.appendChild(wrap);
    });
  }

  function moveGalleryItem(fromIndex, toIndex) {
    const items = galleryDraftItems;
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) return;

    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);

    renderGalleryThumbnails();
  }

  function setupGalleryOrdering() {
    const galThumbs = document.getElementById("gallery-thumbnails");
    const galleryInput = document.getElementById("galleryFiles");
    if (!galThumbs || !galleryInput) return;

    let draggedIndex = null;
    let touchStartIndex = null;
    let touchTargetIndex = null;

    function getThumb(target) {
      return target instanceof Element ? target.closest(".gallery-thumb-wrap") : null;
    }

    function clearDragState() {
      galThumbs.querySelectorAll(".gallery-thumb-wrap").forEach((thumb) => {
        thumb.classList.remove("is-dragging", "is-drop-target");
      });
    }

    galThumbs.addEventListener("dragstart", (event) => {
      const thumb = getThumb(event.target);
      if (!thumb) return;
      draggedIndex = Number(thumb.dataset.index);
      thumb.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(draggedIndex));
    });

    galThumbs.addEventListener("dragover", (event) => {
      const thumb = getThumb(event.target);
      if (!thumb || draggedIndex === null) return;
      event.preventDefault();
      clearDragState();
      galThumbs.querySelector(`[data-index="${draggedIndex}"]`)?.classList.add("is-dragging");
      thumb.classList.add("is-drop-target");
      event.dataTransfer.dropEffect = "move";
    });

    galThumbs.addEventListener("drop", (event) => {
      const thumb = getThumb(event.target);
      if (!thumb || draggedIndex === null) return;
      event.preventDefault();
      moveGalleryItem(draggedIndex, Number(thumb.dataset.index));
      draggedIndex = null;
      clearDragState();
    });

    galThumbs.addEventListener("dragend", () => {
      draggedIndex = null;
      clearDragState();
    });

    galThumbs.addEventListener("keydown", (event) => {
      const handle = event.target.closest(".gallery-drag-handle");
      const thumb = getThumb(handle);
      if (!handle || !thumb) return;

      const currentIndex = Number(thumb.dataset.index);
      const direction = event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? -1
        : event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : 0;

      if (!direction) return;
      event.preventDefault();
      const targetIndex = currentIndex + direction;
      moveGalleryItem(currentIndex, targetIndex);
      galThumbs.querySelector(`[data-index="${targetIndex}"] .gallery-drag-handle`)?.focus();
    });

    galThumbs.addEventListener("touchstart", (event) => {
      const handle = event.target.closest(".gallery-drag-handle");
      const thumb = getThumb(handle);
      if (!handle || !thumb) return;
      touchStartIndex = Number(thumb.dataset.index);
      touchTargetIndex = touchStartIndex;
      thumb.classList.add("is-dragging");
    }, { passive: true });

    document.addEventListener("touchmove", (event) => {
      if (touchStartIndex === null || !event.touches.length) return;
      event.preventDefault();
      const touch = event.touches[0];
      const thumb = getThumb(document.elementFromPoint(touch.clientX, touch.clientY));
      if (!thumb) return;
      touchTargetIndex = Number(thumb.dataset.index);
      clearDragState();
      galThumbs.querySelector(`[data-index="${touchStartIndex}"]`)?.classList.add("is-dragging");
      thumb.classList.add("is-drop-target");
    }, { passive: false });

    document.addEventListener("touchend", () => {
      if (touchStartIndex !== null && touchTargetIndex !== null) {
        moveGalleryItem(touchStartIndex, touchTargetIndex);
      }
      touchStartIndex = null;
      touchTargetIndex = null;
      clearDragState();
    });

    document.addEventListener("touchcancel", () => {
      touchStartIndex = null;
      touchTargetIndex = null;
      clearDragState();
    });

    galleryInput.addEventListener("change", () => {
      clearMediaError("gallery");
      const files = Array.from(galleryInput.files || []);

      if (galleryDraftItems.length + files.length > 10) {
        showMediaError("gallery", `La galer\u00eda admite m\u00e1ximo 10 fotos. Actualmente hay ${galleryDraftItems.length}.`);
        galleryInput.value = "";
        return;
      }

      if (!files.every((file) => validateFile(file, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, "gallery"))) {
        galleryInput.value = "";
        return;
      }

      galleryDraftItems.push(...files.map(createGalleryFileItem));
      galleryInput.value = "";
      renderGalleryThumbnails();
    });

    window.addEventListener("beforeunload", clearSelectedGalleryPreviews);
  }

  setupGalleryOrdering();

  // ── Función para cargar datos ─────────────────────────────────────
  async function loadInvitationData(id) {
    const { data, error } = await db
      .from("studio_invitations")
      .select("*")
      .eq("id", id)
      .eq("studio_id", currentStudioId)
      .single();

    loading.style.display = "none";

    if (error || !data) {
      errorAlert.textContent = "Error al cargar la invitación o no tienes permiso.";
      errorAlert.style.display = "block";
      return;
    }

    currentSlug = data.slug || "";

    // Llenar formulario
    const heroFields = splitLegacyXvHeading(data.title, data.honoree_name, data.event_type);
    document.getElementById("title").value = heroFields.title;
    document.getElementById("slug").value = data.slug || "";
    document.getElementById("event_type").value = data.event_type || "boda";
    
    isEditMode = true;
    originalTemplateId = data.template_id || null;
    originalEventType = data.event_type || null;
    
    updateTemplateOptions({ 
        preserveLegacyNull: originalTemplateId === null,
        preferredTemplateId: originalTemplateId 
    });
    document.getElementById("honoree_name").value = heroFields.honoree;
    document.getElementById("event_date").value = data.event_date || "";
    document.getElementById("event_time").value = data.event_time || "";
    document.getElementById("welcome_text").value = data.welcome_text || "";
    
    document.getElementById("father_name").value = data.father_name || "";
    document.getElementById("mother_name").value = data.mother_name || "";
    document.getElementById("instagram_hashtag").value = data.instagram_hashtag || "";
    document.getElementById("thankYouTitle").value = data.thank_you_title || "";
    document.getElementById("thankYouMessage").value = data.thank_you_message || "";
    document.getElementById("thankYouSignature").value = data.thank_you_signature || "";
    document.getElementById("hashtagSectionTitle").value = data.hashtag_section_title || "";
    document.getElementById("hashtagSectionMessage").value = data.hashtag_section_message || "";

    let godparentsText = "";
    if (data.godparents && Array.isArray(data.godparents)) {
      godparentsText = data.godparents.map(gp => {
        if (gp.role && gp.role !== "Padrinos") return `${gp.role}: ${gp.name}`;
        return gp.name;
      }).join("\n");
    }
    document.getElementById("godparents_text").value = godparentsText;

    document.getElementById("font_preset").value = data.font_preset || "classic";
    const visualThemeInput = document.getElementById("visual_theme");
    if (visualThemeInput) {
      visualThemeInput.value = data.visual_theme || "rose-floral";
    }
    document.getElementById("color_primary").value = data.color_primary || "#C9A46A";
    document.getElementById("color_secondary").value = data.color_secondary || "#F7E7D7";
    const palettePreset = document.getElementById("palette_preset");
    if (palettePreset) palettePreset.value = data.palette_preset || "original";
    const titleColor = document.getElementById("title_color");
    if (titleColor) titleColor.value = data.title_color || "";
    const bodyColor = document.getElementById("body_color");
    if (bodyColor) bodyColor.value = data.body_color || "";
    const accentColor = document.getElementById("accent_color");
    if (accentColor) accentColor.value = data.accent_color || "";
    const customFontUrl = document.getElementById("customFontUrl");
    const customFontName = document.getElementById("customFontName");
    const customFontCurrent = document.getElementById("custom-font-current");
    const customFontCurrentName = document.getElementById("custom-font-current-name");
    if (customFontUrl) customFontUrl.value = data.custom_font_url || "";
    if (customFontName) customFontName.value = data.custom_font_name || "";
    const savedCustomFontTargets = Array.isArray(data.custom_font_targets)
      ? data.custom_font_targets
      : ["titles", "subtitles", "names"];
    document.querySelectorAll('input[name="custom_font_target"]').forEach(input => {
      input.checked = savedCustomFontTargets.includes(input.value);
    });
    if (data.custom_font_url) {
      customFontCurrent?.classList.add("visible");
      if (customFontCurrentName) customFontCurrentName.textContent = data.custom_font_name || "Tipografía personalizada cargada";
    }
    document.getElementById("ceremony_name").value = data.ceremony_name || "";
    document.getElementById("ceremony_address").value = data.ceremony_address || "";
    document.getElementById("ceremony_map_url").value = data.ceremony_map_url || "";
    document.getElementById("reception_name").value = data.reception_name || "";
    document.getElementById("reception_address").value = data.reception_address || "";
    document.getElementById("reception_map_url").value = data.reception_map_url || "";
    document.getElementById("gift_table_url").value = data.gift_table_url || "";
    document.getElementById("dress_code").value = data.dress_code || "";
    const confirmationNumbers = parseConfirmationNumbers(data.whatsapp_number);
    document.getElementById("whatsapp_number").value = confirmationNumbers[0] || "";
    document.getElementById("whatsapp_number_secondary").value = confirmationNumbers[1] || "";
    document.getElementById("published").checked = !!data.published;
    
    if (document.getElementById("studioName")) {
      document.getElementById("studioName").value = data.studio_name || "Invitta Studio";
    }
    if (document.getElementById("studioLogoUrl")) {
      document.getElementById("studioLogoUrl").value = data.studio_logo_url || "";
    }
    if (document.getElementById("musicPlayerBrandEnabled")) {
      document.getElementById("musicPlayerBrandEnabled").checked = data.music_player_brand_enabled !== false;
    }
    if (document.getElementById("studioWhatsapp")) {
      document.getElementById("studioWhatsapp").value = data.studio_whatsapp || "";
    }
    if (document.getElementById("studioCtaEnabled")) {
      document.getElementById("studioCtaEnabled").checked = data.studio_cta_enabled !== false;
    }
    if (document.getElementById("studioCtaText")) {
      document.getElementById("studioCtaText").value = data.studio_cta_text || "Quiero una invitación así";
    }
    if (document.getElementById("studioCtaMessage")) {
      document.getElementById("studioCtaMessage").value = data.studio_cta_message || "Hola, vi esta invitación digital y me interesa contratar una para mi evento.";
    }
    
    if (document.getElementById("linkBuilderEnabled")) {
      document.getElementById("linkBuilderEnabled").checked = data.link_builder_enabled !== false;
    }
    if (document.getElementById("linkBuilderPin")) {
      document.getElementById("linkBuilderPin").value = data.link_builder_pin || "";
    }
    if (document.getElementById("linkBuilderTitle")) {
      document.getElementById("linkBuilderTitle").value = data.link_builder_title || "Generador de pase personalizado";
    }
    if (document.getElementById("linkBuilderMessage")) {
      document.getElementById("linkBuilderMessage").value = data.link_builder_message || "Crea un enlace rápido para invitados de último momento.";
    }
    
    document.getElementById("itineraryText").value = itineraryToText(data.itinerary);
    
    document.getElementById("music_title").value = data.music_title || "";
    document.getElementById("music_artist").value = data.music_artist || "";

    // Preservar URLs existentes de foto y música
    existingPhotoUrl = data.main_photo_url || null;
    existingMusicUrl = data.music_url || null;

    // Mostrar URL actual de foto
    if (existingPhotoUrl) {
      const photoCurrent = document.getElementById("photo-current");
      const photoDisplay = document.getElementById("photo-url-display");
      const photoPreview = document.getElementById("photo-preview");
      if (photoCurrent) photoCurrent.classList.add("visible");
      if (photoDisplay) photoDisplay.textContent = existingPhotoUrl;
      if (photoPreview) {
        photoPreview.src = existingPhotoUrl;
        photoPreview.classList.add("visible");
      }
    }

    // Mostrar URL actual de música
    // Preservar URL existente de fondo
    existingBackgroundUrl = data.background_image_url || null;
    if (existingBackgroundUrl) {
      const bgCurrent = document.getElementById("background-current");
      const bgDisplay = document.getElementById("background-url-display");
      if (bgCurrent) bgCurrent.style.display = "block";
      if (bgDisplay) {
        bgDisplay.innerHTML = `<a href="${existingBackgroundUrl}" target="_blank">Ver fondo</a>`;
      }
    }

    if (existingMusicUrl) {
      const musicCurrent = document.getElementById("music-current");
      const musicDisplay = document.getElementById("music-url-display");
      if (musicCurrent) musicCurrent.classList.add("visible");
      if (musicDisplay) musicDisplay.textContent = existingMusicUrl;
    }

    // Mostrar galería existente
    existingGalleryUrls = normalizeGalleryUrls(data.gallery_urls);
    galleryDraftItems = existingGalleryUrls.map((url) => ({ kind: "existing", url }));
    const galWarning = document.getElementById("gallery-replace-warning");
    if (galWarning) galWarning.style.display = "block";
    renderGalleryThumbnails();

    form.style.display = "block";
  }

  // ── Guardar datos ────────────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorAlert.style.display = "none";
    successAlert.style.display = "none";
    clearMediaError("photo");
    clearMediaError("music");
    clearMediaError("custom-font");
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";

    const slugValue = document.getElementById("slug").value.trim();
    const slugToUse = slugValue || currentSlug;

    // Tipografia personalizada
    let finalCustomFontUrl = document.getElementById("customFontUrl")?.value || null;
    const customFontFile = document.getElementById("customFontFile")?.files?.[0];
    const selectedCustomFontTargets = Array.from(
      document.querySelectorAll('input[name="custom_font_target"]:checked')
    ).map(input => input.value);
    if (document.getElementById("font_preset")?.value === "custom" && !selectedCustomFontTargets.length) {
      showMediaError("custom-font", "Elige al menos una zona donde aplicar la tipografÃ­a.");
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar cambios";
      return;
    }
    if (customFontFile) {
      if (!validateFontFile(customFontFile)) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        return;
      }
      showProgress("custom-font");
      const uploadedUrl = await uploadFileToStorage(customFontFile, "fonts", slugToUse);
      hideProgress("custom-font");
      if (!uploadedUrl) {
        showMediaError("custom-font", "Error al subir la tipografía. Intenta de nuevo.");
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        return;
      }
      finalCustomFontUrl = uploadedUrl;
      const customFontUrl = document.getElementById("customFontUrl");
      if (customFontUrl) customFontUrl.value = uploadedUrl;
    }

    // ── Subida de foto ──
    let finalPhotoUrl = existingPhotoUrl;
    const photoFile = document.getElementById("mainPhotoFile")?.files[0];
    if (photoFile) {
      if (!validateFile(photoFile, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, "photo")) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        return;
      }
      showProgress("photo");
      const uploadedUrl = await uploadFileToStorage(photoFile, "main-photo", slugToUse);
      hideProgress("photo");
      if (!uploadedUrl) {
        showMediaError("photo", "Error al subir la foto. Intenta de nuevo.");
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        return;
      }
      finalPhotoUrl = uploadedUrl;
    }

    // ── Subida de música ──
    let finalMusicUrl = existingMusicUrl;
    const musicFile = document.getElementById("musicFile")?.files[0];
    if (musicFile) {
      if (!validateFile(musicFile, ALLOWED_AUDIO_TYPES, MAX_MUSIC_BYTES, "music")) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        return;
      }
      showProgress("music");
      const uploadedUrl = await uploadFileToStorage(musicFile, "music", slugToUse);
      hideProgress("music");
      if (!uploadedUrl) {
        showMediaError("music", "Error al subir la música. Intenta de nuevo.");
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        return;
      }
      finalMusicUrl = uploadedUrl;
    }

    // ── Subida de fondo ──
    let finalBackgroundUrl = existingBackgroundUrl;
    const bgFile = document.getElementById("backgroundImageFile")?.files[0];
    if (bgFile) {
      if (!validateFile(bgFile, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, "background")) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        return;
      }
      showProgress("background");
      const uploadedUrl = await uploadFileToStorage(bgFile, "background", slugToUse);
      hideProgress("background");
      if (!uploadedUrl) {
        showMediaError("background", "Error al subir el fondo. Intenta de nuevo.");
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        return;
      }
      finalBackgroundUrl = uploadedUrl;
    }

    // ── Subida de galería ──
    let finalGalleryUrls = [];
    const newGalleryItems = galleryDraftItems.filter((item) => item.kind === "file");

    if (newGalleryItems.length > 0) showProgress("gallery");

    let uploadedCount = 0;
    for (let i = 0; i < galleryDraftItems.length; i++) {
      const item = galleryDraftItems[i];

      if (item.kind === "existing") {
        finalGalleryUrls.push(item.url);
        continue;
      }

      const el = document.getElementById("gallery-progress");
      if (el) el.textContent = `Subiendo foto ${uploadedCount + 1} de ${newGalleryItems.length}...`;
      const url = await uploadFileToStorage(item.file, "gallery", slugToUse);

      if (!url) {
        hideProgress("gallery");
        showMediaError("gallery", `Error al subir la foto ${i + 1}. Intenta de nuevo.`);
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        return;
      }

      finalGalleryUrls.push(url);
      uploadedCount += 1;
    }

    hideProgress("gallery");

    // Parse godparents
    const godparentsLines = document.getElementById("godparents_text").value.split("\n").filter(l => l.trim().length > 0);
    const godparentsJson = godparentsLines.map(line => {
      const idx = line.indexOf(":");
      if (idx !== -1) {
        return {
          role: line.substring(0, idx).trim(),
          name: line.substring(idx + 1).trim()
        };
      }
      return {
        role: "Padrinos",
        name: line.trim()
      };
    });

    // ── Payload ──
    const eventType = document.getElementById("event_type").value;
    const templateIdRaw = document.getElementById("template_id").value;
    
    let validTemplateId = null;
    const validArray = VALID_TEMPLATES[eventType] || [];
    
    if (!isEditMode) {
      if (!validArray.includes(templateIdRaw)) {
        errorAlert.textContent = "La plantilla seleccionada no es válida para este tipo de evento.";
        errorAlert.style.display = "block";
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        return;
      }
      validTemplateId = templateIdRaw;
    } else {
      // Es edición
      if (originalTemplateId === null && eventType === originalEventType && templateIdRaw === "") {
        // Caso histórico sin modificar plantilla ni tipo
        validTemplateId = null;
      } else {
        if (!validArray.includes(templateIdRaw)) {
          errorAlert.textContent = "La plantilla seleccionada no es válida para el tipo de evento actual.";
          errorAlert.style.display = "block";
          saveBtn.disabled = false;
          saveBtn.textContent = "Guardar cambios";
          return;
        }
        validTemplateId = templateIdRaw;
      }
    }

    const heroFields = splitLegacyXvHeading(
      document.getElementById("title").value,
      document.getElementById("honoree_name").value,
      eventType
    );

    const payload = {
      title: heroFields.title,
      slug: slugToUse,
      event_type: eventType,
      template_id: validTemplateId || null,
      honoree_name: heroFields.honoree,
      event_date: document.getElementById("event_date").value || null,
      event_time: document.getElementById("event_time").value || null,
      welcome_text: document.getElementById("welcome_text").value,
      father_name: document.getElementById("father_name").value || null,
      mother_name: document.getElementById("mother_name").value || null,
      instagram_hashtag: document.getElementById("instagram_hashtag").value || null,
      thank_you_title: document.getElementById("thankYouTitle").value || "Con cariño",
      thank_you_message: document.getElementById("thankYouMessage").value || "Gracias por ser parte de mis XV años",
      thank_you_signature: document.getElementById("thankYouSignature").value || null,
      hashtag_section_title: document.getElementById("hashtagSectionTitle").value || "Comparte el momento",
      hashtag_section_message: document.getElementById("hashtagSectionMessage").value || "Usa el hashtag en tus fotos y videos para que no se pierda ningún recuerdo.",
      godparents: godparentsJson,
      font_preset: document.getElementById("font_preset").value || "classic",
      custom_font_url: finalCustomFontUrl,
      custom_font_name: document.getElementById("customFontName")?.value.trim() || null,
      custom_font_targets: selectedCustomFontTargets,
      visual_theme: document.getElementById("visual_theme") ? document.getElementById("visual_theme").value : "rose-floral",
      color_primary: document.getElementById("color_primary").value,
      color_secondary: document.getElementById("color_secondary").value,
      palette_preset: document.getElementById("palette_preset") ? document.getElementById("palette_preset").value || "original" : "original",
      title_color: document.getElementById("title_color") ? document.getElementById("title_color").value || null : null,
      body_color: document.getElementById("body_color") ? document.getElementById("body_color").value || null : null,
      accent_color: document.getElementById("accent_color") ? document.getElementById("accent_color").value || null : null,
      ceremony_name: document.getElementById("ceremony_name").value,
      ceremony_address: document.getElementById("ceremony_address").value,
      ceremony_map_url: document.getElementById("ceremony_map_url").value,
      reception_name: document.getElementById("reception_name").value,
      reception_address: document.getElementById("reception_address").value,
      reception_map_url: document.getElementById("reception_map_url").value,
      gift_table_url: document.getElementById("gift_table_url").value,
      dress_code: document.getElementById("dress_code").value,
      whatsapp_number: serializeConfirmationNumbers(
        document.getElementById("whatsapp_number").value,
        document.getElementById("whatsapp_number_secondary").value
      ),
      published: document.getElementById("published").checked,
      studio_name: document.getElementById("studioName") ? document.getElementById("studioName").value || "Invitta Studio" : "Invitta Studio",
      studio_logo_url: document.getElementById("studioLogoUrl") ? document.getElementById("studioLogoUrl").value || "" : "",
      music_player_brand_enabled: getChecked("musicPlayerBrandEnabled"),
      studio_whatsapp: document.getElementById("studioWhatsapp") ? document.getElementById("studioWhatsapp").value || "" : "",
      studio_cta_enabled: getChecked("studioCtaEnabled"),
      studio_cta_text: document.getElementById("studioCtaText") ? document.getElementById("studioCtaText").value || "Quiero una invitación así" : "Quiero una invitación así",
      studio_cta_message: document.getElementById("studioCtaMessage") ? document.getElementById("studioCtaMessage").value || "Hola, vi esta invitación digital y me interesa contratar una para mi evento." : "Hola, vi esta invitación digital y me interesa contratar una para mi evento.",
      link_builder_enabled: getChecked("linkBuilderEnabled"),
      link_builder_pin: document.getElementById("linkBuilderPin") ? document.getElementById("linkBuilderPin").value || "" : "",
      link_builder_title: document.getElementById("linkBuilderTitle") ? document.getElementById("linkBuilderTitle").value || "Generador de pase personalizado" : "Generador de pase personalizado",
      link_builder_message: document.getElementById("linkBuilderMessage") ? document.getElementById("linkBuilderMessage").value || "Crea un enlace rápido para invitados de último momento." : "Crea un enlace rápido para invitados de último momento.",
      gallery_urls: finalGalleryUrls,
      itinerary: parseItineraryText(document.getElementById("itineraryText").value),
      background_image_url: finalBackgroundUrl,
      music_title: musicFile ? cleanMusicFileName(musicFile.name) : (document.getElementById("music_title").value || null),
      music_artist: document.getElementById("music_artist").value || null,
      main_photo_url: finalPhotoUrl,
      music_url: finalMusicUrl,
      updated_at: new Date().toISOString()
    };

    let result;
    if (isEditMode) {
      // Actualizar
      result = await db
        .from("studio_invitations")
        .update(payload)
        .eq("id", inviteId)
        .eq("studio_id", currentStudioId);
    } else {
      // Insertar
      payload.studio_id = currentStudioId;
      result = await db
        .from("studio_invitations")
        .insert([payload])
        .select("id, slug")
        .single();
    }

    if (result.error) {
      console.error("Error al guardar:", result.error);
      errorAlert.textContent = "Error al guardar. Puede que el slug ya esté en uso u otro error de validación.";
      errorAlert.style.display = "block";
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar cambios";
    } else {
      currentSlug = slugToUse;
      const savedInvitationId = result.data?.id || inviteId;
      if (savedInvitationId && isCurrentStudioManager) {
        const { error: eventSyncError } = await db.rpc("sync_studio_invitation_event", {
          target_invitation_id: savedInvitationId
        });
        if (eventSyncError) {
          console.error("No se pudo vincular el panel de invitados:", eventSyncError);
          errorAlert.textContent = "La invitacion se guardo, pero no se pudo vincular el panel de invitados.";
          errorAlert.style.display = "block";
        }
      }
      clearSelectedGalleryPreviews();
      existingGalleryUrls = finalGalleryUrls.slice();
      galleryDraftItems = existingGalleryUrls.map((url) => ({ kind: "existing", url }));
      renderGalleryThumbnails();
      if (sourceRequestId && result.data?.id) {
        const { error: requestError } = await db
          .from("invitation_requests")
          .update({
            status: "in_progress",
            assigned_studio_id: currentStudioId,
            converted_invitation_id: result.data.id
          })
          .eq("id", sourceRequestId);
        if (requestError) console.error("No se pudo vincular la solicitud:", requestError);
        sourceRequestId = null;
      }
      if (!isEditMode && result.data?.id) {
        inviteId = result.data.id;
        isEditMode = true;
        window.history.replaceState({}, "", `/administracion/studio-invitacion-form.html?id=${encodeURIComponent(inviteId)}`);
      }
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar cambios";
      showSuccessMessage("Invitación guardada correctamente.");
    }
  });

});
