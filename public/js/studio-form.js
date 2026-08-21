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

function getValidTemplateIds(eventType) {
  return getTemplatesByType(eventType).map(template => template.id);
}

function hasActiveTemplates(eventType) {
  return getValidTemplateIds(eventType).length > 0;
}

const SECTION_BACKGROUND_KEYS = ["hero", "family", "locations", "gallery", "rsvp"];
const OPTIONAL_SECTION_KEYS = ["family", "locations", "itinerary", "gallery", "registry", "rsvp", "music"];

function normalizeSectionVisibility(value) {
  let parsed = value;
  if (typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } catch (error) { parsed = {}; }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) parsed = {};
  return OPTIONAL_SECTION_KEYS.reduce((result, key) => {
    result[key] = parsed[key] !== false;
    return result;
  }, {});
}

function setSectionVisibilityControls(value) {
  const visibility = normalizeSectionVisibility(value);
  OPTIONAL_SECTION_KEYS.forEach(key => {
    const input = document.querySelector(`[name="section_visibility"][value="${key}"]`);
    if (input) input.checked = visibility[key];
  });
}

function getSectionVisibilityControls() {
  return OPTIONAL_SECTION_KEYS.reduce((result, key) => {
    const input = document.querySelector(`[name="section_visibility"][value="${key}"]`);
    result[key] = !input || input.checked;
    return result;
  }, {});
}

function getSelectedTemplateSectionBackgroundKeys() {
  const templateId = document.getElementById("template_id")?.value;
  const template = window.InvittaTemplateCatalog?.getById(templateId);
  const configured = template?.customization?.sectionBackgrounds;
  return Array.isArray(configured)
    ? configured.filter(key => SECTION_BACKGROUND_KEYS.includes(key))
    : [];
}

function updateSectionBackgroundControls() {
  const container = document.getElementById("section-backgrounds-controls");
  if (!container) return;
  const activeKeys = new Set(getSelectedTemplateSectionBackgroundKeys());
  container.hidden = activeKeys.size === 0;
  container.querySelectorAll("[data-section-background-control]").forEach(control => {
    control.hidden = !activeKeys.has(control.dataset.sectionBackgroundControl);
  });
}

function normalizeSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

let isTemplateEditMode = false;
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

function splitWeddingCoupleName(value) {
  const parts = String(value || "")
    .split(/\s*(?:&|\by\b)\s*/i)
    .map(part => part.trim())
    .filter(Boolean);
  return { bride: parts[0] || "", groom: parts.slice(1).join(" ") || "" };
}

function getWeddingCoupleName() {
  const bride = document.getElementById("bride_name")?.value.trim() || "";
  const groom = document.getElementById("groom_name")?.value.trim() || "";
  return [bride, groom].filter(Boolean).join(" & ");
}

function updateWeddingNameFields() {
  const isWedding = document.getElementById("event_type")?.value === "boda";
  const coupleFields = document.getElementById("wedding-couple-fields");
  const legacyField = document.getElementById("honoree-name-field");
  const bride = document.getElementById("bride_name");
  const groom = document.getElementById("groom_name");
  const combined = document.getElementById("honoree_name");

  if (coupleFields) coupleFields.hidden = !isWedding;
  if (legacyField) legacyField.hidden = isWedding;
  if (bride) bride.required = isWedding;
  if (groom) groom.required = isWedding;

  if (isWedding && combined) combined.value = getWeddingCoupleName();
}

function updateTemplateOptions(options = { preserveLegacyNull: false, preferredTemplateId: null }) {
  const eventType = document.getElementById("event_type").value;
  const templateSelect = document.getElementById("template_id");
  const currentVal = templateSelect.value;
  
  templateSelect.innerHTML = "";
  
  const showLegacyNull = isTemplateEditMode && originalTemplateId === null && options.preserveLegacyNull;

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
  const validArray = getValidTemplateIds(eventType);

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
  } else if (isCurrentValid) {
    templateSelect.value = currentVal;
  } else if (showLegacyNull) {
    // Keep historical invitations without a template unchanged until the user
    // deliberately selects a current template or changes event type.
    templateSelect.value = "";
  } else {
    templateSelect.value = validArray[0] || "";
  }

  updatePackageSummary();
  updateSectionBackgroundControls();
}

document.addEventListener("DOMContentLoaded", () => {
  const et = document.getElementById("event_type");
  if (et) {
    et.addEventListener("change", () => {
      // El usuario cambió explícitamente el tipo de evento
      updateTemplateOptions({ preserveLegacyNull: false });
      updateWeddingNameFields();
    });
  }

  const templateSelect = document.getElementById("template_id");
  if (templateSelect) {
    templateSelect.addEventListener("change", () => {
      updatePackageSummary();
      updateSectionBackgroundControls();
    });
  }
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

function isValidConfirmationPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

// ── RFC-032: Opciones de Regalo (Mesas de regalos y Datos bancarios) ──

/**
 * Actualiza la apariencia visual de las tarjetas de opciones de regalo
 * según el estado de sus checkboxes.
 */
function updateGiftOptionsVisibility() {
  [1, 2, 3].forEach(index => {
    const enabled = document.getElementById(`gift_${index}_enabled`)?.checked === true;
    const card = document.getElementById(`gift-card-${index}`);
    if (card) {
      card.classList.toggle("is-active", enabled);
    }
  });
}

/**
 * Carga las opciones de regalo desde los datos de la invitación en los 3 bloques.
 * Si existe gift_options (array), lo mapea a los bloques.
 * Si no existe gift_options pero existe gift_table_url, lo precarga en Mesa 1 como fallback retrocompatible.
 */
function loadGiftOptions(data = {}) {
  const gift1Enabled = document.getElementById("gift_1_enabled");
  const gift1Title = document.getElementById("gift_1_title");
  const gift1Url = document.getElementById("gift_1_url");
  const gift1Desc = document.getElementById("gift_1_description");

  const gift2Enabled = document.getElementById("gift_2_enabled");
  const gift2Title = document.getElementById("gift_2_title");
  const gift2Url = document.getElementById("gift_2_url");
  const gift2Desc = document.getElementById("gift_2_description");

  const gift3Enabled = document.getElementById("gift_3_enabled");
  const gift3Bank = document.getElementById("gift_3_bank");
  const gift3Holder = document.getElementById("gift_3_holder");
  const gift3Clabe = document.getElementById("gift_3_clabe");
  const gift3Account = document.getElementById("gift_3_account");
  const gift3Note = document.getElementById("gift_3_note");

  const legacyInput = document.getElementById("gift_table_url");

  // Reset defaults
  if (gift1Enabled) gift1Enabled.checked = false;
  if (gift1Title) gift1Title.value = "";
  if (gift1Url) gift1Url.value = "";
  if (gift1Desc) gift1Desc.value = "";

  if (gift2Enabled) gift2Enabled.checked = false;
  if (gift2Title) gift2Title.value = "";
  if (gift2Url) gift2Url.value = "";
  if (gift2Desc) gift2Desc.value = "";

  if (gift3Enabled) gift3Enabled.checked = false;
  if (gift3Bank) gift3Bank.value = "";
  if (gift3Holder) gift3Holder.value = "";
  if (gift3Clabe) gift3Clabe.value = "";
  if (gift3Account) gift3Account.value = "";
  if (gift3Note) gift3Note.value = "";

  const options = Array.isArray(data?.gift_options) ? data.gift_options : [];

  if (options.length > 0) {
    // Opción 1: Buscar por id 'gift-1' o primer registry
    const opt1 = options.find(o => o?.id === "gift-1") || options.find(o => o?.type === "registry");
    if (opt1) {
      if (gift1Enabled) gift1Enabled.checked = opt1.enabled !== false;
      if (gift1Title) gift1Title.value = opt1.title || "";
      if (gift1Url) gift1Url.value = opt1.url || "";
      if (gift1Desc) gift1Desc.value = opt1.description || "";
    }

    // Opción 2: Buscar por id 'gift-2' o segundo registry
    const opt2 = options.find(o => o?.id === "gift-2") || options.filter(o => o?.type === "registry" && o !== opt1)[0];
    if (opt2) {
      if (gift2Enabled) gift2Enabled.checked = opt2.enabled !== false;
      if (gift2Title) gift2Title.value = opt2.title || "";
      if (gift2Url) gift2Url.value = opt2.url || "";
      if (gift2Desc) gift2Desc.value = opt2.description || "";
    }

    // Opción 3: Buscar por id 'gift-3' o tipo 'bank'
    const opt3 = options.find(o => o?.id === "gift-3" || o?.type === "bank");
    if (opt3) {
      if (gift3Enabled) gift3Enabled.checked = opt3.enabled !== false;
      if (gift3Bank) gift3Bank.value = opt3.bank || "";
      if (gift3Holder) gift3Holder.value = opt3.holder || "";
      if (gift3Clabe) gift3Clabe.value = opt3.clabe || "";
      if (gift3Account) gift3Account.value = opt3.account || "";
      if (gift3Note) gift3Note.value = opt3.note || "";
    }
  } else if (data?.gift_table_url && String(data.gift_table_url).trim()) {
    // Fallback retrocompatible para invitaciones existentes con gift_table_url único
    if (gift1Enabled) gift1Enabled.checked = true;
    if (gift1Title) gift1Title.value = "Mesa de regalos";
    if (gift1Url) gift1Url.value = String(data.gift_table_url).trim();
  }

  // Sincronizar campo legacy
  if (legacyInput) {
    legacyInput.value = data?.gift_table_url || (gift1Enabled?.checked ? (gift1Url?.value || "") : "");
  }

  updateGiftOptionsVisibility();
}

/**
 * Construye el array gift_options con las opciones activadas y válidas.
 * - Registry: enabled=true + (title o url)
 * - Bank: enabled=true + (bank, holder, clabe o account)
 */
function buildGiftOptions() {
  const result = [];

  const gift1Enabled = document.getElementById("gift_1_enabled")?.checked === true;
  const gift1Title = document.getElementById("gift_1_title")?.value.trim() || "";
  const gift1Url = document.getElementById("gift_1_url")?.value.trim() || "";
  const gift1Desc = document.getElementById("gift_1_description")?.value.trim() || "";

  if (gift1Enabled && (gift1Title || gift1Url)) {
    result.push({
      id: "gift-1",
      type: "registry",
      enabled: true,
      title: gift1Title || "Mesa de regalos",
      url: gift1Url,
      description: gift1Desc
    });
  }

  const gift2Enabled = document.getElementById("gift_2_enabled")?.checked === true;
  const gift2Title = document.getElementById("gift_2_title")?.value.trim() || "";
  const gift2Url = document.getElementById("gift_2_url")?.value.trim() || "";
  const gift2Desc = document.getElementById("gift_2_description")?.value.trim() || "";

  if (gift2Enabled && (gift2Title || gift2Url)) {
    result.push({
      id: "gift-2",
      type: "registry",
      enabled: true,
      title: gift2Title || "Mesa de regalos 2",
      url: gift2Url,
      description: gift2Desc
    });
  }

  const gift3Enabled = document.getElementById("gift_3_enabled")?.checked === true;
  const gift3Bank = document.getElementById("gift_3_bank")?.value.trim() || "";
  const gift3Holder = document.getElementById("gift_3_holder")?.value.trim() || "";
  const gift3Clabe = document.getElementById("gift_3_clabe")?.value.trim() || "";
  const gift3Account = document.getElementById("gift_3_account")?.value.trim() || "";
  const gift3Note = document.getElementById("gift_3_note")?.value.trim() || "";

  if (gift3Enabled && (gift3Bank || gift3Holder || gift3Clabe || gift3Account)) {
    result.push({
      id: "gift-3",
      type: "bank",
      enabled: true,
      title: "Transferencia / Depósito",
      bank: gift3Bank,
      holder: gift3Holder,
      clabe: gift3Clabe,
      account: gift3Account,
      note: gift3Note
    });
  }

  return result;
}

/**
 * Obtiene la URL de la Mesa 1 si está habilitada, para guardarla en el campo legacy gift_table_url.
 */
function getLegacyGiftTableUrl(giftOptions) {
  if (Array.isArray(giftOptions)) {
    const gift1 = giftOptions.find(o => o?.id === "gift-1" || o?.type === "registry");
    if (gift1 && gift1.url) {
      return String(gift1.url).trim();
    }
  }
  const gift1Enabled = document.getElementById("gift_1_enabled")?.checked === true;
  const gift1Url = document.getElementById("gift_1_url")?.value.trim() || "";
  if (gift1Enabled && gift1Url) return gift1Url;

  return "";
}

/**
 * Configura listeners de eventos para reactividad de opciones de regalo.
 */
function setupGiftOptionListeners() {
  [1, 2, 3].forEach(index => {
    const toggle = document.getElementById(`gift_${index}_enabled`);
    if (toggle) {
      toggle.addEventListener("change", () => {
        updateGiftOptionsVisibility();
        if (index === 1) {
          const legacyInput = document.getElementById("gift_table_url");
          const gift1Url = document.getElementById("gift_1_url");
          if (legacyInput) {
            legacyInput.value = toggle.checked ? (gift1Url?.value.trim() || "") : "";
          }
        }
      });
    }
  });

  const gift1UrlInput = document.getElementById("gift_1_url");
  if (gift1UrlInput) {
    gift1UrlInput.addEventListener("input", () => {
      const gift1Enabled = document.getElementById("gift_1_enabled")?.checked === true;
      const legacyInput = document.getElementById("gift_table_url");
      if (legacyInput && gift1Enabled) {
        legacyInput.value = gift1UrlInput.value.trim();
      }
    });
  }
}

const TYPOGRAPHY_ROLES = [
  "coverName",
  "closingName",
  "mainTitle",
  "sectionTitle",
  "cardTitle",
  "guestName",
  "body",
  "labels"
];
const TYPOGRAPHY_FONT_SOURCES = [
  "inherit",
  "classic",
  "romantic",
  "editorial",
  "minimal",
  "luxury",
  "signature",
  "couture",
  "custom"
];
const TYPOGRAPHY_FONT_TOKEN_PREFIX = "typeface:v2:";
const TYPOGRAPHY_SCALE_TOKEN_PREFIX = "type-scale:v2:";
const TYPOGRAPHY_LIBRARY_TOKEN_PREFIX = "typography-library:v1:";
const MAX_CUSTOM_FONTS = 4;

function normalizeTypographyFontLibrary(value) {
  const parsed = Array.isArray(value) ? value : [];
  return parsed.slice(0, MAX_CUSTOM_FONTS).map((font, index) => {
    const id = /^font-[a-z0-9-]{4,50}$/.test(String(font?.id || ""))
      ? String(font.id)
      : `font-${index + 1}`;
    return {
      id,
      name: String(font?.name || `Fuente ${index + 1}`).trim().slice(0, 80),
      url: String(font?.url || "").trim()
    };
  }).filter(font => font.name && font.url);
}

function parseTypographyFontLibraryFallback(value) {
  const token = (Array.isArray(value) ? value : [])
    .find(item => String(item || "").startsWith(TYPOGRAPHY_LIBRARY_TOKEN_PREFIX));
  if (!token) return [];
  try {
    return normalizeTypographyFontLibrary(JSON.parse(decodeURIComponent(String(token).slice(TYPOGRAPHY_LIBRARY_TOKEN_PREFIX.length))));
  } catch (_) {
    return [];
  }
}

function typographyFontLibraryToken(fonts) {
  const safeFonts = normalizeTypographyFontLibrary(fonts);
  return `${TYPOGRAPHY_LIBRARY_TOKEN_PREFIX}${encodeURIComponent(JSON.stringify(safeFonts))}`;
}

function isTypographyFontSource(value) {
  return TYPOGRAPHY_FONT_SOURCES.includes(value) || /^font-[a-z0-9-]{4,50}$/.test(String(value || ""));
}

function emptyTypographyRoleConfig() {
  return TYPOGRAPHY_ROLES.reduce((result, role) => {
    result[role] = { font: "inherit", scale: 100 };
    return result;
  }, {});
}

function parseTypographyRoleConfig(value) {
  const config = emptyTypographyRoleConfig();
  const tokens = Array.isArray(value) ? value : [];
  let hasRoleTokens = tokens.includes("typography:v1") || tokens.includes("typography:v2");

  tokens.forEach(token => {
    const fontMatch = String(token || "").match(/^typeface:v(?:1|2):([A-Za-z]+):([a-z0-9-]+)$/);
    if (fontMatch && TYPOGRAPHY_ROLES.includes(fontMatch[1]) && isTypographyFontSource(fontMatch[2])) {
      config[fontMatch[1]].font = fontMatch[2];
      hasRoleTokens = true;
      return;
    }
    const scaleMatch = String(token || "").match(/^type-scale:v(?:1|2):([A-Za-z]+):(\d{2,3})$/);
    if (scaleMatch && TYPOGRAPHY_ROLES.includes(scaleMatch[1])) {
      config[scaleMatch[1]].scale = Math.min(150, Math.max(75, Number(scaleMatch[2]) || 100));
      hasRoleTokens = true;
    }
  });

  if (hasRoleTokens) return config;

  // Traducción transparente de invitaciones creadas con las cuatro zonas anteriores.
  const legacyTargets = new Set(tokens.filter(token => ["titles", "subtitles", "names", "body"].includes(token)));
  const legacyScales = { titles: 100, subtitles: 100, names: 100, body: 100 };
  tokens.forEach(token => {
    const match = String(token || "").match(/^scale:(titles|subtitles|names|body):(\d{2,3})$/);
    if (match) legacyScales[match[1]] = Math.min(150, Math.max(75, Number(match[2]) || 100));
  });
  if (legacyTargets.has("titles")) config.mainTitle.font = "custom";
  if (legacyTargets.has("subtitles")) {
    config.sectionTitle.font = "custom";
    config.cardTitle.font = "custom";
  }
  if (legacyTargets.has("names")) {
    config.coverName.font = "custom";
    config.closingName.font = "custom";
  }
  if (legacyTargets.has("body")) config.body.font = "custom";
  config.mainTitle.scale = legacyScales.titles;
  config.sectionTitle.scale = legacyScales.subtitles;
  config.cardTitle.scale = legacyScales.subtitles;
  config.coverName.scale = legacyScales.names;
  config.body.scale = legacyScales.body;
  return config;
}

function typographyRoleTokens() {
  const tokens = ["typography:v2"];
  document.querySelectorAll('select[name="typography_role_font"]').forEach(select => {
    const role = select.dataset.role;
    const source = isTypographyFontSource(select.value) ? select.value : "inherit";
    if (TYPOGRAPHY_ROLES.includes(role) && source !== "inherit") {
      tokens.push(`${TYPOGRAPHY_FONT_TOKEN_PREFIX}${role}:${source}`);
    }
  });
  document.querySelectorAll('input[name="typography_role_scale"]').forEach(input => {
    const role = input.dataset.role;
    const value = Math.min(150, Math.max(75, Number(input.value) || 100));
    if (TYPOGRAPHY_ROLES.includes(role) && value !== 100) {
      tokens.push(`${TYPOGRAPHY_SCALE_TOKEN_PREFIX}${role}:${value}`);
    }
  });
  return tokens;
}

function setTypographyRoleControls(value) {
  const config = parseTypographyRoleConfig(value);
  document.querySelectorAll('select[name="typography_role_font"]').forEach(select => {
    const setting = config[select.dataset.role] || { font: "inherit" };
    const source = setting.font === "custom"
      ? (select.querySelector("option[data-custom-font]")?.value || "inherit")
      : setting.font;
    select.value = select.querySelector(`option[value="${source}"]`) ? source : "inherit";
    select.dataset.inherit = String(select.value === "inherit");
  });
  document.querySelectorAll('input[name="typography_role_scale"]').forEach(input => {
    const setting = config[input.dataset.role] || { scale: 100 };
    input.value = String(setting.scale);
    const output = document.querySelector(`output[for="${input.id}"]`);
    if (output) output.textContent = `${input.value}%`;
  });
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
  const typographyRoleFontSelects = Array.from(document.querySelectorAll('select[name="typography_role_font"]'));
  const typographyScaleInputs = Array.from(document.querySelectorAll('input[name="typography_role_scale"]'));
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

  const typographyFontLabels = {
    inherit: "Conservar diseño original",
    classic: "Clásica elegante",
    romantic: "Romántica script",
    editorial: "Editorial fine art",
    minimal: "Moderna minimal",
    luxury: "Luxury dramática",
    signature: "Firma orgánica",
    couture: "Caligrafía couture",
    custom: "Fuente especial cargada"
  };

  typographyRoleFontSelects.forEach(select => {
    TYPOGRAPHY_FONT_SOURCES.filter(source => source !== "custom").forEach(source => {
      const option = document.createElement("option");
      option.value = source;
      option.textContent = typographyFontLabels[source];
      select.appendChild(option);
    });
    select.dataset.inherit = String(select.value === "inherit");
  });

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

  Object.entries(fonts).filter(([value]) => value !== "custom").forEach(([value, definition]) => {
    fontOptions.appendChild(createOptionButton(value, definition, "font"));
  });

  Object.entries(palettes)
    .filter(([, definition]) => !definition.legacy)
    .forEach(([value, definition]) => {
      paletteOptions.appendChild(createOptionButton(value, definition, "palette"));
    });

  let typographyFontLibrary = [];
  const customFontObjectUrls = new Map();

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

  function customPreviewFamily(fontId) {
    return `InvittaCustomPreview_${String(fontId || "").replace(/[^a-z0-9]/gi, "_")}`;
  }

  async function loadCustomFontPreview(fontId, source) {
    if (!source || typeof FontFace !== "function") return;
    try {
      const customFont = new FontFace(customPreviewFamily(fontId), `url(${JSON.stringify(source)})`);
      await customFont.load();
      document.fonts.add(customFont);
      fontSelect.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (error) {
      console.error("No se pudo previsualizar la tipografia personalizada:", error);
      showCustomFontError("No se pudo previsualizar este archivo de tipografía.");
    }
  }

  function refreshTypographyRoleFontOptions() {
    typographyRoleFontSelects.forEach(select => {
      const previous = select.value;
      select.querySelectorAll("option[data-custom-font]").forEach(option => option.remove());
      typographyFontLibrary.forEach(font => {
        const option = document.createElement("option");
        option.value = font.id;
        option.textContent = font.name;
        option.dataset.customFont = "true";
        select.appendChild(option);
      });
      const replacement = previous === "custom" ? typographyFontLibrary[0]?.id : previous;
      select.value = isTypographyFontSource(replacement) && select.querySelector(`option[value="${replacement}"]`)
        ? replacement
        : "inherit";
      select.dataset.inherit = String(select.value === "inherit");
    });
  }

  function renderTypographyFontLibrary() {
    const container = document.getElementById("custom-font-library");
    const empty = document.getElementById("custom-font-library-empty");
    const count = document.getElementById("custom-font-count");
    if (!container) return;
    container.querySelectorAll(".studio-custom-font-library-item").forEach(item => item.remove());
    if (empty) empty.hidden = typographyFontLibrary.length > 0;
    if (count) count.textContent = `${typographyFontLibrary.length} de ${MAX_CUSTOM_FONTS} fuentes`;
    if (customFontInput) customFontInput.disabled = typographyFontLibrary.length >= MAX_CUSTOM_FONTS;

    typographyFontLibrary.forEach(font => {
      const item = document.createElement("div");
      item.className = "studio-custom-font-library-item";
      item.dataset.fontId = font.id;

      const name = document.createElement("input");
      name.type = "text";
      name.maxLength = 80;
      name.className = "studio-custom-font-library-name";
      name.value = font.name;
      name.setAttribute("aria-label", "Nombre de la tipografía");
      name.style.fontFamily = `"${customPreviewFamily(font.id)}", "Cormorant Garamond", serif`;
      name.addEventListener("input", () => {
        font.name = name.value.trim().slice(0, 80) || "Fuente personalizada";
        refreshTypographyRoleFontOptions();
        updatePreview();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "studio-custom-font-remove";
      remove.textContent = "Quitar";
      remove.addEventListener("click", () => {
        typographyRoleFontSelects.forEach(select => {
          if (select.value === font.id) select.value = "inherit";
        });
        const objectUrl = customFontObjectUrls.get(font.id);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        customFontObjectUrls.delete(font.id);
        typographyFontLibrary = typographyFontLibrary.filter(itemFont => itemFont.id !== font.id);
        refreshTypographyRoleFontOptions();
        renderTypographyFontLibrary();
        updatePreview();
      });

      item.append(name, remove);
      container.appendChild(item);
    });
  }

  window.setStudioTypographyFontLibrary = (fontsValue, roleTokens = []) => {
    typographyFontLibrary = (Array.isArray(fontsValue) ? fontsValue : []).slice(0, MAX_CUSTOM_FONTS).map((font, index) => ({
      id: /^font-[a-z0-9-]{4,50}$/.test(String(font?.id || "")) ? String(font.id) : `font-${index + 1}`,
      name: String(font?.name || `Fuente ${index + 1}`).trim().slice(0, 80),
      url: String(font?.url || "").trim(),
      file: font?.file || null
    })).filter(font => font.name && (font.url || font.file));
    refreshTypographyRoleFontOptions();
    setTypographyRoleControls(roleTokens);
    typographyRoleFontSelects.forEach(select => {
      if (select.value === "custom") select.value = typographyFontLibrary[0]?.id || "inherit";
      select.dataset.inherit = String(select.value === "inherit");
    });
    typographyFontLibrary.forEach(font => loadCustomFontPreview(font.id, font.url));
    renderTypographyFontLibrary();
    updatePreview();
  };
  window.getStudioTypographyFontLibrary = () => typographyFontLibrary.map(font => ({ ...font }));

  customFontInput?.addEventListener("change", () => {
    const file = customFontInput.files?.[0];
    clearCustomFontError();
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["woff2", "woff", "ttf", "otf"].includes(extension) || file.size > 3 * 1024 * 1024) {
      showCustomFontError("Usa un archivo WOFF2, WOFF, TTF u OTF de máximo 3 MB.");
      customFontInput.value = "";
      return;
    }
    if (typographyFontLibrary.length >= MAX_CUSTOM_FONTS) {
      showCustomFontError("Puedes cargar hasta cuatro tipografías por invitación.");
      customFontInput.value = "";
      return;
    }
    const id = `font-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const objectUrl = URL.createObjectURL(file);
    customFontObjectUrls.set(id, objectUrl);
    typographyFontLibrary.push({
      id,
      name: file.name.replace(/\.(woff2?|ttf|otf)$/i, "").slice(0, 80),
      url: "",
      file
    });
    refreshTypographyRoleFontOptions();
    renderTypographyFontLibrary();
    if (!typographyRoleFontSelects.some(select => /^font-/.test(select.value))) {
      typographyRoleFontSelects.forEach(select => {
        if (["coverName", "closingName"].includes(select.dataset.role)) {
          select.value = id;
          select.dataset.inherit = "false";
        }
      });
    }
    loadCustomFontPreview(id, objectUrl);
    customFontInput.value = "";
    updatePreview();
  });
  renderTypographyFontLibrary();

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
    previewPhone.style.setProperty("--preview-title-font", font.display);
    previewPhone.style.setProperty("--preview-subtitle-font", font.display);
    previewPhone.style.setProperty("--preview-name-font", font.display);
    previewPhone.style.setProperty("--preview-body-font", font.body);
    previewPhone.dataset.font = fontSelect.value;

    const previewEyebrow = document.getElementById("studio-preview-eyebrow");
    const previewName = document.getElementById("studio-preview-name");
    const previewDate = document.getElementById("studio-preview-date");
    const previewEventTitle = document.getElementById("studio-preview-event-title");

    if (previewEyebrow) previewEyebrow.textContent = eventType === "boda" ? "NUESTRA BODA" : "MIS QUINCE ANOS";
    if (previewName) previewName.textContent = honoree || (eventType === "boda" ? "Ana & Carlos" : "Maria");
    if (previewDate) previewDate.textContent = formatPreviewDate(eventDate);
    if (previewEventTitle) previewEventTitle.textContent = title || (eventType === "boda" ? "Nuestra celebracion" : "Una noche especial");

    const previewRoleSelectors = {
      coverName: ["#studio-preview-name"],
      closingName: ["#studio-preview-closing-name"],
      mainTitle: ["#studio-preview-event-title"],
      sectionTitle: ["#studio-preview-eyebrow"],
      cardTitle: [".studio-preview-card p"],
      guestName: ["#studio-preview-guest-name"],
      body: [".studio-preview-card small"],
      labels: ["#studio-preview-date", ".studio-preview-button-sample"]
    };
    previewPhone.querySelectorAll(Object.values(previewRoleSelectors).flat().join(","))
      .forEach(element => {
        element.style.removeProperty("font-size");
        element.style.removeProperty("font-family");
      });
    const selectedSources = typographyRoleFontSelects.reduce((result, select) => {
      result[select.dataset.role] = select.value;
      return result;
    }, {});
    const scaleValues = typographyScaleInputs.reduce((result, input) => {
      result[input.dataset.role] = (Number(input.value) || 100) / 100;
      return result;
    }, {});
    Object.entries(previewRoleSelectors).forEach(([role, selectors]) => {
      const source = selectedSources[role] || "inherit";
      const customAsset = typographyFontLibrary.find(asset => asset.id === source);
      const selectedFont = customAsset
        ? { display: `"${customPreviewFamily(customAsset.id)}", "Cormorant Garamond", serif`, body: `"${customPreviewFamily(customAsset.id)}", "Cormorant Garamond", serif` }
        : (source === "inherit" ? font : (fonts[source] || font));
      const family = ["body", "labels"].includes(role) ? selectedFont.body : selectedFont.display;
      selectors.forEach(selector => {
        previewPhone.querySelectorAll(selector).forEach(element => {
          element.style.fontFamily = family;
          const baseSize = Number.parseFloat(getComputedStyle(element).fontSize);
          if (Number.isFinite(baseSize)) element.style.fontSize = `${baseSize * (scaleValues[role] || 1)}px`;
        });
      });
    });

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

  typographyRoleFontSelects.forEach(select => select.addEventListener("change", () => {
    if (select.value === "custom") {
      select.value = typographyFontLibrary[0]?.id || "inherit";
    }
    if (/^font-/.test(select.value) && !typographyFontLibrary.some(font => font.id === select.value)) {
      select.value = "inherit";
      customFontInput?.click();
    }
    select.dataset.inherit = String(select.value === "inherit");
    updatePreview();
  }));
  typographyScaleInputs.forEach(input => input.addEventListener("input", () => {
    const output = document.querySelector(`output[for="${input.id}"]`);
    if (output) output.textContent = `${input.value}%`;
    updatePreview();
  }));

  ["title", "honoree_name", "event_date"]
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .forEach(input => input.addEventListener("input", updatePreview));

  ["bride_name", "groom_name"]
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .forEach(input => input.addEventListener("input", () => {
      const combined = document.getElementById("honoree_name");
      if (combined) combined.value = getWeddingCoupleName();
      updatePreview();
    }));

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
  isTemplateEditMode = isEditMode;
  
  // Elementos del DOM
  const form = document.getElementById("invitation-form");
  const loading = document.getElementById("loading-indicator");
  const errorAlert = document.getElementById("form-error");
  const successAlert = document.getElementById("form-success");
  const pageTitle = document.getElementById("page-title");
  const saveBtn = document.getElementById("save-btn");
  const saveBtnDock = document.getElementById("save-btn-dock");
  const previewBtn = document.getElementById("preview-invitation-btn");
  const previewBtnDock = document.getElementById("preview-invitation-btn-dock");
  const copyLinkBtn = document.getElementById("copy-invitation-link-btn");
  const copyLinkBtnDock = document.getElementById("copy-invitation-link-btn-dock");

  function setSavingState(isSaving) {
    const label = isSaving ? "Guardando..." : "Guardar cambios";
    if (saveBtn) {
      saveBtn.disabled = isSaving;
      saveBtn.textContent = label;
    }
    if (saveBtnDock) {
      saveBtnDock.disabled = isSaving;
      saveBtnDock.textContent = label;
    }
  }
  const clientDashboardEmail = document.getElementById("clientDashboardEmail");
  const clientDashboardBadge = document.getElementById("client-dashboard-badge");
  const clientDashboardStatus = document.getElementById("client-dashboard-status");
  const sendClientAccessButton = document.getElementById("sendClientAccessButton");
  const openClientDashboardButton = document.getElementById("openClientDashboardButton");
  const disableClientAccessButton = document.getElementById("disableClientAccessButton");

  // URLs actuales (preservar si no se sube archivo nuevo)
  let existingPhotoUrl = null;
  let existingMusicUrl = null;
  let existingBackgroundUrl = null;
  let existingSectionBackgrounds = {};
  const removedSectionBackgrounds = new Set();
  let existingGalleryUrls = [];
  let galleryDraftItems = [];

  let currentStudioId = null;
  let isCurrentStudioManager = false;
  let currentSlug = "";
  let currentEventoId = null;
  let clientDashboardEnabled = false;
  let sourceRequestId = requestId || null;

  window.__invittaStudio_getCurrentSlug = () => currentSlug;

  function setClientAccessStatus(message, type = "") {
    if (!clientDashboardStatus) return;
    clientDashboardStatus.textContent = message;
    clientDashboardStatus.classList.toggle("is-error", type === "error");
    clientDashboardStatus.classList.toggle("is-success", type === "success");
  }

  function updateClientAccessUi(options = {}) {
    clientDashboardEnabled = options.enabled === true;
    if (clientDashboardBadge) {
      clientDashboardBadge.textContent = clientDashboardEnabled ? "Acceso activo" : "Sin activar";
      clientDashboardBadge.classList.toggle("is-active", clientDashboardEnabled);
    }
    if (sendClientAccessButton) {
      sendClientAccessButton.disabled = !isCurrentStudioManager || !inviteId || !currentEventoId;
      sendClientAccessButton.textContent = clientDashboardEnabled ? "Reenviar acceso" : "Enviar acceso";
    }
    if (openClientDashboardButton) {
      openClientDashboardButton.disabled = !currentEventoId;
    }
    if (disableClientAccessButton) {
      disableClientAccessButton.hidden = !clientDashboardEnabled;
      disableClientAccessButton.disabled = !isCurrentStudioManager;
    }

    if (!inviteId || !currentEventoId) {
      setClientAccessStatus("Guarda la invitación antes de enviar el acceso.");
      return;
    }
    if (clientDashboardEnabled && options.sentAt) {
      const sentDate = new Date(options.sentAt);
      const formatted = Number.isNaN(sentDate.getTime())
        ? ""
        : sentDate.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
      setClientAccessStatus(
        formatted ? `Acceso enviado por última vez: ${formatted}.` : "El acceso del cliente está activo.",
        "success"
      );
      return;
    }
    if (clientDashboardEnabled) {
      setClientAccessStatus("El acceso del cliente está activo.", "success");
      return;
    }
    setClientAccessStatus("Escribe el correo del cliente y envía su acceso.");
  }

  async function requestClientDashboardAccess(action) {
    const email = (clientDashboardEmail?.value || "").trim().toLowerCase();
    if (action === "send" && !email) {
      setClientAccessStatus("Escribe el correo del cliente.", "error");
      clientDashboardEmail?.focus();
      return null;
    }
    if (!inviteId || !currentEventoId) {
      setClientAccessStatus("Guarda la invitación antes de administrar este acceso.", "error");
      return null;
    }

    const activeSession = await window.studioAuth.getSession();
    if (!activeSession?.access_token) {
      throw new Error("Tu sesión venció. Inicia sesión nuevamente.");
    }

    const response = await fetch("/api/client-dashboard-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeSession.access_token}`
      },
      body: JSON.stringify({
        action,
        invitationId: inviteId,
        email
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "No fue posible administrar el acceso.");
    }
    return payload;
  }

  sendClientAccessButton?.addEventListener("click", async () => {
    sendClientAccessButton.disabled = true;
    sendClientAccessButton.textContent = "Enviando...";
    setClientAccessStatus("Preparando el acceso seguro del cliente...");
    try {
      const result = await requestClientDashboardAccess("send");
      if (!result) return;
      updateClientAccessUi({ enabled: true, sentAt: result.sentAt });
      showSuccessMessage("Acceso del cliente enviado correctamente.");
    } catch (error) {
      console.error("No se pudo enviar el acceso del cliente:", error);
      setClientAccessStatus(error.message || "No fue posible enviar el acceso.", "error");
    } finally {
      if (sendClientAccessButton) {
        sendClientAccessButton.disabled = !isCurrentStudioManager || !inviteId || !currentEventoId;
        sendClientAccessButton.textContent = clientDashboardEnabled ? "Reenviar acceso" : "Enviar acceso";
      }
    }
  });

  openClientDashboardButton?.addEventListener("click", () => {
    if (!currentEventoId) {
      setClientAccessStatus("Guarda la invitación antes de abrir el panel.", "error");
      return;
    }
    window.open(
      `/administracion/dashboard.html?event_id=${encodeURIComponent(currentEventoId)}`,
      "_blank",
      "noopener,noreferrer"
    );
  });

  disableClientAccessButton?.addEventListener("click", async () => {
    if (!window.confirm("¿Desactivar el acceso del cliente a este evento?")) return;
    disableClientAccessButton.disabled = true;
    setClientAccessStatus("Desactivando acceso...");
    try {
      const result = await requestClientDashboardAccess("disable");
      if (!result) return;
      updateClientAccessUi({ enabled: false });
      showSuccessMessage("Acceso del cliente desactivado.");
    } catch (error) {
      console.error("No se pudo desactivar el acceso del cliente:", error);
      setClientAccessStatus(error.message || "No fue posible desactivar el acceso.", "error");
    } finally {
      if (disableClientAccessButton) disableClientAccessButton.disabled = false;
    }
  });

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

    const requestEventType = hasActiveTemplates(request.event_type) ? request.event_type : "xv";
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

  saveBtnDock?.addEventListener("click", () => {
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else {
      saveBtn?.click();
    }
  });

  previewBtn?.addEventListener("click", () => {
    const slug = requireSlugForAction();
    if (!slug) return;
    window.open(getPreviewInvitationUrl(slug), "_blank", "noopener");
  });

  previewBtnDock?.addEventListener("click", () => {
    previewBtn?.click();
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

  copyLinkBtnDock?.addEventListener("click", () => {
    copyLinkBtn?.click();
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
    updateClientAccessUi({ enabled: clientDashboardEnabled });
  }

  // Si es modo edición, cargar datos
  if (isEditMode) {
    pageTitle.textContent = "Editar Invitación";
    await loadInvitationData(inviteId);
  } else {
    // Modo creación
    updateTemplateOptions({ preserveLegacyNull: false });
    loadGiftOptions({});
    if (sourceRequestId) await loadSalesRequest(sourceRequestId);
    loading.style.display = "none";
    form.style.display = "block";
  }

  updateWeddingNameFields();
  setupStudioVisualPreview();
  setupGiftOptionListeners();

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

  function normalizeSectionBackgrounds(value) {
    let parsed = value;
    if (typeof value === "string") {
      try { parsed = JSON.parse(value); } catch { return {}; }
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return SECTION_BACKGROUND_KEYS.reduce((result, key) => {
      if (typeof parsed[key] === "string" && parsed[key].trim()) result[key] = parsed[key].trim();
      return result;
    }, {});
  }

  function renderSectionBackgroundStatus() {
    SECTION_BACKGROUND_KEYS.forEach(key => {
      const current = document.getElementById(`section-background-${key}-current`);
      const link = document.getElementById(`section-background-${key}-link`);
      const pending = document.getElementById(`section-background-${key}-pending`);
      const input = document.querySelector(`[data-section-background-input="${key}"]`);
      const selectedFile = input?.files?.[0];
      const url = existingSectionBackgrounds[key];
      const hasBackground = Boolean(url || selectedFile);
      if (current) {
        current.hidden = !hasBackground;
        current.classList.toggle("visible", hasBackground);
      }
      if (link) {
        link.hidden = !url;
        if (url) link.href = url;
      }
      if (pending) {
        pending.hidden = !selectedFile;
        pending.textContent = selectedFile ? `Archivo seleccionado: ${selectedFile.name}` : "";
      }
    });
  }

  document.querySelectorAll("[data-section-background-input]").forEach(input => {
    input.addEventListener("change", () => {
      const key = input.dataset.sectionBackgroundInput;
      clearMediaError(`section-background-${key}`);
      if (input.files?.[0]) removedSectionBackgrounds.delete(key);
      renderSectionBackgroundStatus();
    });
  });

  document.querySelectorAll("[data-section-background-remove]").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.sectionBackgroundRemove;
      if (existingSectionBackgrounds[key]) removedSectionBackgrounds.add(key);
      delete existingSectionBackgrounds[key];
      const input = document.querySelector(`[data-section-background-input="${key}"]`);
      if (input) input.value = "";
      renderSectionBackgroundStatus();
    });
  });

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
    currentEventoId = data.evento_id || null;
    if (clientDashboardEmail) {
      clientDashboardEmail.value = data.client_dashboard_email || "";
    }
    updateClientAccessUi({
      enabled: data.client_dashboard_enabled === true,
      sentAt: data.client_dashboard_last_sent_at
    });

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
    const savedCouple = splitWeddingCoupleName(heroFields.honoree);
    const brideName = document.getElementById("bride_name");
    const groomName = document.getElementById("groom_name");
    if (brideName) brideName.value = savedCouple.bride;
    if (groomName) groomName.value = savedCouple.groom;
    updateWeddingNameFields();
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
    setSectionVisibilityControls(data.section_visibility);
    const customFontUrl = document.getElementById("customFontUrl");
    const customFontName = document.getElementById("customFontName");
    if (customFontUrl) customFontUrl.value = data.custom_font_url || "";
    if (customFontName) customFontName.value = data.custom_font_name || "";
    const savedTypographyConfig = Array.isArray(data.custom_font_targets)
      ? data.custom_font_targets
      : [];
    let savedTypographyFonts = normalizeTypographyFontLibrary(data.typography_fonts);
    if (!savedTypographyFonts.length) savedTypographyFonts = parseTypographyFontLibraryFallback(savedTypographyConfig);
    if (!savedTypographyFonts.length && data.custom_font_url) {
      savedTypographyFonts = [{
        id: "font-legacy-custom",
        name: data.custom_font_name || "Tipografía personalizada",
        url: data.custom_font_url
      }];
    }
    window.setStudioTypographyFontLibrary?.(savedTypographyFonts, savedTypographyConfig);
    // El preset "custom" pertenecía al modelo anterior. El nuevo modelo asigna
    // la fuente cargada por función y conserva Clásica como base del diseño.
    const savedFontPreset = document.getElementById("font_preset");
    if (savedFontPreset?.value === "custom") savedFontPreset.value = "classic";
    document.getElementById("ceremony_name").value = data.ceremony_name || "";
    document.getElementById("ceremony_address").value = data.ceremony_address || "";
    document.getElementById("ceremony_map_url").value = data.ceremony_map_url || "";
    document.getElementById("reception_name").value = data.reception_name || "";
    document.getElementById("reception_address").value = data.reception_address || "";
    document.getElementById("reception_map_url").value = data.reception_map_url || "";
    loadGiftOptions(data);
    document.getElementById("dress_code").value = data.dress_code || "";
    document.getElementById("dress_code_details").value = data.dress_code_details || "";
    document.getElementById("children_note").value = data.children_note || "";
    document.getElementById("children_label").value = data.children_label || "";
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
    existingSectionBackgrounds = normalizeSectionBackgrounds(data.section_backgrounds);
    removedSectionBackgrounds.clear();
    renderSectionBackgroundStatus();
    if (existingBackgroundUrl) {
      const bgCurrent = document.getElementById("background-current");
      const bgDisplay = document.getElementById("background-url-display");
      if (bgCurrent) bgCurrent.style.display = "block";
      if (bgDisplay) {
        bgDisplay.innerHTML = `<a href="${existingBackgroundUrl}" target="_blank">Ver fondo</a>`;
      }
      
      // UX Fase 2B.1: Actualizar vista previa
      const bgImageThumbnail = document.getElementById("bgImageThumbnail");
      const bgImageEmpty = document.getElementById("bgImageEmpty");
      const bgImagePreview = document.getElementById("bgImagePreview");
      const bgImageFilename = document.getElementById("bgImageFilename");
      const bgRemoveImageButton = document.getElementById("bgRemoveImageButton");
      
      if (bgImageThumbnail) {
        bgImageThumbnail.src = existingBackgroundUrl;
        bgImageThumbnail.style.display = "block";
      }
      if (bgImageEmpty) bgImageEmpty.style.display = "none";
      if (bgImageFilename) bgImageFilename.textContent = "Fondo guardado";
      if (bgImagePreview) bgImagePreview.classList.remove("studio-bg-image-empty");
      if (bgRemoveImageButton) bgRemoveImageButton.style.display = "inline-block";
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

    // Cargar configuración avanzada de fondo (Fase 2B)
    loadBackgroundConfig(data);

    form.style.display = "block";

    if (typeof window.__invittaStudio_triggerPreviewRefresh === "function") {
      window.__invittaStudio_triggerPreviewRefresh();
    }
  }

  // ── Guardar datos ────────────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorAlert.style.display = "none";
    successAlert.style.display = "none";
    clearMediaError("photo");
    clearMediaError("music");
    clearMediaError("custom-font");

    const publishInput = document.getElementById("published");
    const rsvpEnabled = getSectionVisibilityControls().rsvp;
    const confirmationPhoneInput = document.getElementById("whatsapp_number");
    if (publishInput?.checked && rsvpEnabled && !isValidConfirmationPhone(confirmationPhoneInput?.value)) {
      errorAlert.textContent = "Para publicar una invitación con RSVP, agrega un WhatsApp de confirmación válido (10 a 15 dígitos).";
      errorAlert.style.display = "block";
      confirmationPhoneInput?.setAttribute("aria-invalid", "true");
      confirmationPhoneInput?.focus();
      return;
    }
    confirmationPhoneInput?.removeAttribute("aria-invalid");
    setSavingState(true);

    updateWeddingNameFields();

    const slugInput = document.getElementById("slug");
    const slugToUse = normalizeSlug(slugInput.value || currentSlug);
    if (!slugToUse) {
      errorAlert.textContent = "Escribe un slug con letras o números.";
      errorAlert.style.display = "block";
      setSavingState(false);
      return;
    }
    slugInput.value = slugToUse;

    // Biblioteca de tipografias personalizadas
    const typographyFontDraft = window.getStudioTypographyFontLibrary?.() || [];
    const savedTypographyRoleTokens = typographyRoleTokens();
    const assignedFontIds = new Set(
      savedTypographyRoleTokens
        .map(token => token.match(/^typeface:v2:[^:]+:(.+)$/)?.[1])
        .filter(source => source?.startsWith("font-"))
    );
    const availableFontIds = new Set(typographyFontDraft.map(font => font.id));
    if (Array.from(assignedFontIds).some(fontId => !availableFontIds.has(fontId))) {
      showMediaError("custom-font", "Una zona usa una tipografía que ya no está disponible. Selecciona otra antes de guardar.");
      setSavingState(false);
      return;
    }
    const finalTypographyFonts = [];
    for (const font of typographyFontDraft) {
      let uploadedUrl = font.url || "";
      if (font.file) {
        if (!validateFontFile(font.file)) {
          setSavingState(false);
          return;
        }
        showProgress("custom-font");
        uploadedUrl = await uploadFileToStorage(font.file, `fonts/${font.id}`, slugToUse);
        hideProgress("custom-font");
      }
      if (!uploadedUrl) {
        showMediaError("custom-font", `No se pudo subir la tipografía ${font.name || "seleccionada"}. Intenta de nuevo.`);
        setSavingState(false);
        return;
      }
      finalTypographyFonts.push({ id: font.id, name: font.name, url: uploadedUrl });
    }
    const finalCustomFontUrl = finalTypographyFonts[0]?.url || null;
    const finalCustomFontName = finalTypographyFonts[0]?.name || null;
    const savedTypographyTokens = [
      ...savedTypographyRoleTokens,
      typographyFontLibraryToken(finalTypographyFonts)
    ];

    // ── Subida de foto ──
    let finalPhotoUrl = existingPhotoUrl;
    const photoFile = document.getElementById("mainPhotoFile")?.files[0];
    if (photoFile) {
      if (!validateFile(photoFile, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, "photo")) {
        setSavingState(false);
        return;
      }
      showProgress("photo");
      const uploadedUrl = await uploadFileToStorage(photoFile, "main-photo", slugToUse);
      hideProgress("photo");
      if (!uploadedUrl) {
        showMediaError("photo", "Error al subir la foto. Intenta de nuevo.");
        setSavingState(false);
        return;
      }
      finalPhotoUrl = uploadedUrl;
    }

    // ── Subida de música ──
    let finalMusicUrl = existingMusicUrl;
    const musicFile = document.getElementById("musicFile")?.files[0];
    if (musicFile) {
      if (!validateFile(musicFile, ALLOWED_AUDIO_TYPES, MAX_MUSIC_BYTES, "music")) {
        setSavingState(false);
        return;
      }
      showProgress("music");
      const uploadedUrl = await uploadFileToStorage(musicFile, "music", slugToUse);
      hideProgress("music");
      if (!uploadedUrl) {
        showMediaError("music", "Error al subir la música. Intenta de nuevo.");
        setSavingState(false);
        return;
      }
      finalMusicUrl = uploadedUrl;
    }

    // ── Subida de fondo ──
    let finalBackgroundUrl = existingBackgroundUrl;
    const bgFile = document.getElementById("backgroundImageFile")?.files[0];
    if (bgFile) {
      if (!validateFile(bgFile, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, "background")) {
        setSavingState(false);
        return;
      }
      showProgress("background");
      const uploadedUrl = await uploadFileToStorage(bgFile, "background", slugToUse);
      hideProgress("background");
      if (!uploadedUrl) {
        showMediaError("background", "Error al subir el fondo. Intenta de nuevo.");
        setSavingState(false);
        return;
      }
      finalBackgroundUrl = uploadedUrl;
    }

    // ── Fondos personalizados por sección ──
    const finalSectionBackgrounds = { ...existingSectionBackgrounds };
    removedSectionBackgrounds.forEach(key => delete finalSectionBackgrounds[key]);
    const activeSectionBackgroundKeys = new Set(getSelectedTemplateSectionBackgroundKeys());

    for (const key of SECTION_BACKGROUND_KEYS) {
      if (!activeSectionBackgroundKeys.has(key)) continue;
      const input = document.querySelector(`[data-section-background-input="${key}"]`);
      const file = input?.files?.[0];
      if (!file) continue;
      const mediaType = `section-background-${key}`;
      if (!validateFile(file, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, mediaType)) {
        setSavingState(false);
        return;
      }
      showProgress(mediaType);
      const uploadedUrl = await uploadFileToStorage(file, `section-backgrounds/${key}`, slugToUse);
      hideProgress(mediaType);
      if (!uploadedUrl) {
        showMediaError(mediaType, "Error al subir el fondo. Intenta de nuevo.");
        setSavingState(false);
        return;
      }
      finalSectionBackgrounds[key] = uploadedUrl;
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
        setSavingState(false);
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
    const validArray = getValidTemplateIds(eventType);
    
    if (!isEditMode) {
      if (!validArray.includes(templateIdRaw)) {
        errorAlert.textContent = "La plantilla seleccionada no es válida para este tipo de evento.";
        errorAlert.style.display = "block";
        setSavingState(false);
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
          setSavingState(false);
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

    const finalGiftOptions = buildGiftOptions();
    const legacyGiftTableUrl = getLegacyGiftTableUrl(finalGiftOptions);

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
      custom_font_name: finalCustomFontName,
      custom_font_targets: savedTypographyTokens,
      typography_fonts: finalTypographyFonts,
      visual_theme: document.getElementById("visual_theme") ? document.getElementById("visual_theme").value : "rose-floral",
      color_primary: document.getElementById("color_primary").value,
      color_secondary: document.getElementById("color_secondary").value,
      palette_preset: document.getElementById("palette_preset") ? document.getElementById("palette_preset").value || "original" : "original",
      title_color: document.getElementById("title_color") ? document.getElementById("title_color").value || null : null,
      body_color: document.getElementById("body_color") ? document.getElementById("body_color").value || null : null,
      accent_color: document.getElementById("accent_color") ? document.getElementById("accent_color").value || null : null,
      section_visibility: getSectionVisibilityControls(),
      ceremony_name: document.getElementById("ceremony_name").value,
      ceremony_address: document.getElementById("ceremony_address").value,
      ceremony_map_url: document.getElementById("ceremony_map_url").value,
      reception_name: document.getElementById("reception_name").value,
      reception_address: document.getElementById("reception_address").value,
      reception_map_url: document.getElementById("reception_map_url").value,
      gift_options: finalGiftOptions,
      gift_table_url: legacyGiftTableUrl,
      dress_code: document.getElementById("dress_code").value,
      dress_code_details: document.getElementById("dress_code_details").value || null,
      children_note: document.getElementById("children_note").value || null,
      children_label: document.getElementById("children_label").value || null,
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
      section_backgrounds: finalSectionBackgrounds,
      music_title: musicFile ? cleanMusicFileName(musicFile.name) : (document.getElementById("music_title").value || null),
      music_artist: document.getElementById("music_artist").value || null,
      main_photo_url: finalPhotoUrl,
      music_url: finalMusicUrl,
      // ── Configuración avanzada de fondo (Fase 2B) ──
      bg_enabled: document.getElementById("bg_enabled")?.checked === true,
      bg_overlay_enabled: document.getElementById("bg_overlay_enabled")?.checked !== false,
      bg_overlay_color: document.getElementById("bg_overlay_color")?.value || "#000000",
      bg_overlay_opacity: Math.round(Number(document.getElementById("bg_overlay_opacity")?.value ?? 35)) / 100,
      bg_position: document.getElementById("bg_position")?.value || "center",
      bg_size: document.getElementById("bg_size")?.value || "cover",
      bg_blur: Number(document.getElementById("bg_blur")?.value ?? 0),
      updated_at: new Date().toISOString()
    };

    const saveInvitationPayload = async payloadToSave => {
      if (isEditMode) {
        return db
          .from("studio_invitations")
          .update(payloadToSave)
          .eq("id", inviteId)
          .eq("studio_id", currentStudioId);
      }
      return db
        .from("studio_invitations")
        .insert([{ ...payloadToSave, studio_id: currentStudioId }])
        .select("id, slug")
        .single();
    };

    let result = await saveInvitationPayload(payload);

    // Fallback RFC-032: si la columna gift_options no existe aún en BD (PGRST204)
    const missingGiftOptionsColumn = result.error && (
      result.error.code === "PGRST204" ||
      /gift_options.*column|column.*gift_options/i.test(result.error.message || "")
    );
    if (missingGiftOptionsColumn) {
      const compatiblePayload = { ...payload };
      delete compatiblePayload.gift_options;
      result = await saveInvitationPayload(compatiblePayload);
    }

    const missingTypographyColumn = result.error && (
      result.error.code === "PGRST204" ||
      /typography_fonts.*column|column.*typography_fonts/i.test(result.error.message || "")
    );
    if (missingTypographyColumn) {
      const compatiblePayload = { ...payload };
      delete compatiblePayload.typography_fonts;
      if (missingGiftOptionsColumn) delete compatiblePayload.gift_options;
      result = await saveInvitationPayload(compatiblePayload);
    }

    // Fallback: si las columnas bg_* no existen aún en BD (PGRST204)
    const missingBgColumns = result.error && (
      result.error.code === "PGRST204" ||
      /bg_enabled.*column|column.*bg_enabled/i.test(result.error.message || "")
    );
    if (missingBgColumns) {
      const compatiblePayload = { ...payload };
      ["bg_enabled", "bg_overlay_enabled", "bg_overlay_color",
       "bg_overlay_opacity", "bg_position", "bg_size", "bg_blur"].forEach(k => delete compatiblePayload[k]);
      if (missingGiftOptionsColumn) delete compatiblePayload.gift_options;
      result = await saveInvitationPayload(compatiblePayload);
    }

    if (result.error) {
      console.error("Error al guardar:", result.error);
      const isInsufficientCredits = !isEditMode && (
        result.error.code === "P0001" ||
        /INVITTA_INSUFFICIENT_CREDITS/i.test(result.error.message || "") ||
        /INVITTA_INSUFFICIENT_CREDITS/i.test(result.error.details || "")
      );
      if (isInsufficientCredits) {
        errorAlert.textContent = "No tienes créditos disponibles para crear una nueva invitación. Contacta a soporte para recargar.";
      } else {
        errorAlert.textContent = "Error al guardar. Puede que el slug ya esté en uso u otro error de validación.";
      }
      errorAlert.style.display = "block";
      setSavingState(false);
    } else {
      currentSlug = slugToUse;
      if (typeof window.__invittaStudio_triggerPreviewRefresh === "function") {
        window.__invittaStudio_triggerPreviewRefresh();
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
        isTemplateEditMode = true;
        window.history.replaceState({}, "", `/administracion/studio-invitacion-form.html?id=${encodeURIComponent(inviteId)}`);
      }
      setSavingState(false);
      updateClientAccessUi({ enabled: clientDashboardEnabled });
      showSuccessMessage("Invitación guardada correctamente.");
    }
  });

  // UX Fase 2B.1: Helper para limpiar URL de fondo guardada
  window.__clearExistingBackgroundUrl = () => { existingBackgroundUrl = null; };
});

// --- Editor Visual Fase 1 ---
document.addEventListener("DOMContentLoaded", () => {
  const iframe = document.getElementById("studio-preview-frame");
  const deviceContainer = document.getElementById("studio-preview-device");
  const emptyState = document.getElementById("studio-preview-empty");
  const btnRefresh = document.getElementById("studio-preview-refresh");
  const btnNewTab = document.getElementById("studio-preview-newtab");
  const slugInput = document.getElementById("slug");

  function getPreviewUrl(slug) {
    if (!slug) return "";
    return `/invitacion.html?slug=${encodeURIComponent(slug)}&preview=studio&v=${Date.now()}`;
  }

  window.__invittaStudio_triggerPreviewRefresh = updatePreview;

  function updatePreview() {
    const savedSlug = typeof window.__invittaStudio_getCurrentSlug === 'function' ? window.__invittaStudio_getCurrentSlug() : "";
    const inputSlug = slugInput ? slugInput.value.trim() : "";

    if (!savedSlug) {
      if (deviceContainer) deviceContainer.style.display = "none";
      if (emptyState) {
        emptyState.textContent = inputSlug ? "Guarda los cambios para actualizar la vista previa." : "Selecciona un slug y guarda para ver la previsualización.";
        emptyState.style.display = "block";
      }
      if (btnNewTab) btnNewTab.style.display = "none";
      return;
    }

    if (inputSlug && inputSlug !== savedSlug) {
      alert("Guarda los cambios para actualizar la vista previa.");
      return;
    }

    const url = getPreviewUrl(savedSlug);
    if (iframe) iframe.src = url;
    if (btnNewTab) {
      btnNewTab.href = url;
      btnNewTab.style.display = "inline-block";
    }
    if (deviceContainer) deviceContainer.style.display = "block";
    if (emptyState) emptyState.style.display = "none";
  }

  if (btnRefresh) {
    btnRefresh.addEventListener("click", updatePreview);
  }

  // Carga inicial síncrona, si el slug ya existe (ej. renderizado desde el servidor).
  // Si no, el usuario debe presionar el botón "Actualizar vista previa" manualmente.
  updatePreview();
});

// --- Fase 2B: loadBackgroundConfig + UX listeners para controles de fondo ---

/**
 * Carga los valores de configuración de fondo en los inputs del formulario.
 * Se llama al final de loadInvitationData(). Segura para invitaciones antiguas
 * que no tengan los campos bg_* (los valores son null/undefined → se usan defaults).
 */
function loadBackgroundConfig(data) {
  const bgEnabled = document.getElementById("bg_enabled");
  const bgControls = document.getElementById("bg-controls");
  if (bgEnabled) {
    bgEnabled.checked = data.bg_enabled === true;
    if (bgControls) bgControls.hidden = !bgEnabled.checked;
  }

  const bgOverlayEnabled = document.getElementById("bg_overlay_enabled");
  if (bgOverlayEnabled) {
    bgOverlayEnabled.checked = data.bg_overlay_enabled !== false;
  }

  const bgOverlayColor = document.getElementById("bg_overlay_color");
  if (bgOverlayColor) {
    bgOverlayColor.value = data.bg_overlay_color || "#000000";
  }

  const bgOverlayOpacity = document.getElementById("bg_overlay_opacity");
  const bgOpacityDisplay = document.getElementById("bg_overlay_opacity_display");
  if (bgOverlayOpacity) {
    const pct = Math.round((data.bg_overlay_opacity ?? 0.35) * 100);
    bgOverlayOpacity.value = pct;
    if (bgOpacityDisplay) bgOpacityDisplay.value = `${pct}%`;
  }

  const bgPosition = document.getElementById("bg_position");
  if (bgPosition) bgPosition.value = data.bg_position || "center";

  const bgSize = document.getElementById("bg_size");
  if (bgSize) bgSize.value = data.bg_size || "cover";

  const bgBlur = document.getElementById("bg_blur");
  const bgBlurDisplay = document.getElementById("bg_blur_display");
  if (bgBlur) {
    bgBlur.value = data.bg_blur ?? 0;
    if (bgBlurDisplay) bgBlurDisplay.value = `${bgBlur.value}px`;
  }

  updateBgNoImageNotice();
}

/**
 * Muestra/oculta el aviso cuando bg_enabled está activo pero no hay imagen subida.
 * Segura de llamar en cualquier momento.
 */
function updateBgNoImageNotice() {
  const notice = document.getElementById("bg-no-image-notice");
  if (!notice) return;
  const bgEnabled = document.getElementById("bg_enabled");
  // existingBackgroundUrl es una variable en scope del DOMContentLoaded principal.
  // Como loadBackgroundConfig se define en scope global del archivo, usamos el input
  // de URL display como proxy confiable.
  const bgUrlDisplay = document.getElementById("background-url-display");
  const hasBgImage = Boolean(
    bgUrlDisplay?.textContent?.trim() ||
    document.getElementById("backgroundImageFile")?.files?.[0]
  );
  const isEnabled = bgEnabled?.checked === true;
  notice.hidden = !(isEnabled && !hasBgImage);
}

// UX listeners: se inicializan cuando carga el DOM
document.addEventListener("DOMContentLoaded", () => {
  const bgEnabled = document.getElementById("bg_enabled");
  const bgControls = document.getElementById("bg-controls");
  const bgOverlayOpacity = document.getElementById("bg_overlay_opacity");
  const bgOpacityDisplay = document.getElementById("bg_overlay_opacity_display");
  const bgBlur = document.getElementById("bg_blur");
  const bgBlurDisplay = document.getElementById("bg_blur_display");
  const bgImageFile = document.getElementById("backgroundImageFile");

  // Toggle show/hide del panel de controles
  if (bgEnabled && bgControls) {
    bgEnabled.addEventListener("change", () => {
      bgControls.hidden = !bgEnabled.checked;
      updateBgNoImageNotice();
    });
  }

  // Slider de opacidad → actualizar <output>
  if (bgOverlayOpacity && bgOpacityDisplay) {
    bgOverlayOpacity.addEventListener("input", () => {
      bgOpacityDisplay.value = `${bgOverlayOpacity.value}%`;
    });
  }

  // Slider de blur → actualizar <output>
  if (bgBlur && bgBlurDisplay) {
    bgBlur.addEventListener("input", () => {
      bgBlurDisplay.value = `${bgBlur.value}px`;
    });
  }

  // Al seleccionar imagen, re-evaluar el aviso de imagen faltante y UX
  const bgSelectImageButton = document.getElementById("bgSelectImageButton");
  const bgRemoveImageButton = document.getElementById("bgRemoveImageButton");
  const bgImagePreview = document.getElementById("bgImagePreview");
  const bgImageThumbnail = document.getElementById("bgImageThumbnail");
  const bgImageEmpty = document.getElementById("bgImageEmpty");
  const bgImageFilename = document.getElementById("bgImageFilename");

  if (bgSelectImageButton && bgImageFile) {
    bgSelectImageButton.addEventListener("click", () => {
      bgImageFile.click();
    });
  }

  if (bgRemoveImageButton && bgImageFile) {
    bgRemoveImageButton.addEventListener("click", () => {
      bgImageFile.value = "";
      if (bgImageThumbnail) {
        bgImageThumbnail.src = "";
        bgImageThumbnail.style.display = "none";
      }
      if (bgImageEmpty) bgImageEmpty.style.display = "block";
      if (bgImageFilename) bgImageFilename.textContent = "";
      if (bgImagePreview) {
        bgImagePreview.classList.add("studio-bg-image-empty");
      }
      bgRemoveImageButton.style.display = "none";
      
      const bgDisplay = document.getElementById("background-url-display");
      if (bgDisplay) bgDisplay.innerHTML = "";
      const bgCurrent = document.getElementById("background-current");
      if (bgCurrent) bgCurrent.style.display = "none";

      if (typeof window.__clearExistingBackgroundUrl === "function") {
        window.__clearExistingBackgroundUrl();
      }
      updateBgNoImageNotice();
    });
  }

  if (bgImageFile) {
    bgImageFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          if (bgImageThumbnail) {
             bgImageThumbnail.src = evt.target.result;
             bgImageThumbnail.style.display = "block";
          }
          if (bgImageEmpty) bgImageEmpty.style.display = "none";
          if (bgImageFilename) bgImageFilename.textContent = file.name;
          if (bgImagePreview) {
             bgImagePreview.classList.remove("studio-bg-image-empty");
          }
          if (bgRemoveImageButton) bgRemoveImageButton.style.display = "inline-block";
        }
        reader.readAsDataURL(file);
      }
      updateBgNoImageNotice();
    });
  }
});
