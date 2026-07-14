/**
 * studio-form.js
 * Lógica para crear y editar invitaciones en Invitta Studio
 */


const VALID_TEMPLATES = {
  xv: [
    "xv-elegance-basic",
    "xv-rose-gold-premium",
    "xv-champagne-rose-vip"
  ],
  boda: [
    "boda-classic-basic",
    "boda-golden-romance-premium",
    "boda-midnight-gold-vip"
  ]
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
  
  const optsXV = [
    {val: "xv-elegance-basic", text: "Élégance XV — Básica"},
    {val: "xv-rose-gold-premium", text: "Rose Gold XV — Premium"},
    {val: "xv-champagne-rose-vip", text: "Champagne Rose VIP"}
  ];
  
  const optsBoda = [
    {val: "boda-classic-basic", text: "Classic Boda — Básica"},
    {val: "boda-golden-romance-premium", text: "Golden Romance — Premium"},
    {val: "boda-midnight-gold-vip", text: "Midnight Gold — VIP"}
  ];

  const opts = eventType === "xv" ? optsXV : optsBoda;
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
}

document.addEventListener("DOMContentLoaded", () => {
  const et = document.getElementById("event_type");
  if (et) {
    et.addEventListener("change", () => {
      // El usuario cambió explícitamente el tipo de evento
      updateTemplateOptions({ preserveLegacyNull: false });
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

document.addEventListener("DOMContentLoaded", async () => {
  const session = await window.studioAuth.requireSession();
  if (!session) return;

  const db = window.studioAuth.db;
  const urlParams = new URLSearchParams(window.location.search);
  let inviteId = urlParams.get("id");
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
  let selectedGalleryFiles = [];
  let selectedGalleryPreviewUrls = [];

  let currentStudioId = localStorage.getItem("invitta_studio_id");
  let currentSlug = "";

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

  // Si no tenemos el studio_id, lo buscamos
  if (!currentStudioId) {
    const { data: studio } = await db
      .from("studios")
      .select("id")
      .eq("user_id", session.user.id)
      .single();
    if (studio) {
      currentStudioId = studio.id;
      localStorage.setItem("invitta_studio_id", currentStudioId);
    } else {
      errorAlert.textContent = "No se pudo encontrar tu estudio.";
      errorAlert.style.display = "block";
      loading.style.display = "none";
      return;
    }
  }

  // Si es modo edición, cargar datos
  if (isEditMode) {
    pageTitle.textContent = "Editar Invitación";
    await loadInvitationData(inviteId);
  } else {
    // Modo creación
    updateTemplateOptions({ preserveLegacyNull: false });
    loading.style.display = "none";
    form.style.display = "block";
  }

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

  function clearSelectedGalleryPreviews() {
    selectedGalleryPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    selectedGalleryPreviewUrls = [];
  }

  function getActiveGalleryItems() {
    if (selectedGalleryFiles.length > 0) {
      return selectedGalleryFiles.map((file, index) => ({
        src: selectedGalleryPreviewUrls[index],
        alt: file.name || `Foto ${index + 1}`
      }));
    }

    return existingGalleryUrls.map((url, index) => ({
      src: url,
      alt: `Foto ${index + 1}`
    }));
  }

  function renderGalleryThumbnails() {
    const galCurrent = document.getElementById("gallery-current");
    const galCount = document.getElementById("gallery-count-label");
    const galThumbs = document.getElementById("gallery-thumbnails");
    const galHint = document.getElementById("gallery-order-hint");
    const items = getActiveGalleryItems();

    if (galCurrent) galCurrent.style.display = items.length ? "block" : "none";
    if (galHint) galHint.hidden = items.length < 2;
    if (galCount) {
      const label = selectedGalleryFiles.length > 0 ? "Fotos seleccionadas" : "Galer\u00eda actual";
      galCount.textContent = `${label}: ${items.length} foto${items.length !== 1 ? "s" : ""}`;
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

      handle.appendChild(grip);
      wrap.append(img, order, handle);
      galThumbs.appendChild(wrap);
    });
  }

  function moveGalleryItem(fromIndex, toIndex) {
    const items = selectedGalleryFiles.length > 0 ? selectedGalleryFiles : existingGalleryUrls;
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) return;

    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);

    if (selectedGalleryFiles.length > 0) {
      const [movedPreview] = selectedGalleryPreviewUrls.splice(fromIndex, 1);
      selectedGalleryPreviewUrls.splice(toIndex, 0, movedPreview);
    }

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
      clearSelectedGalleryPreviews();
      selectedGalleryFiles = Array.from(galleryInput.files || []);
      selectedGalleryPreviewUrls = selectedGalleryFiles.map((file) => URL.createObjectURL(file));
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
    if (existingGalleryUrls.length > 0) {
      const galCurrent   = document.getElementById("gallery-current");
      const galCount     = document.getElementById("gallery-count-label");
      const galThumbs    = document.getElementById("gallery-thumbnails");
      const galWarning   = document.getElementById("gallery-replace-warning");
      if (galCurrent) galCurrent.style.display = "block";
      if (galCount)   galCount.textContent = `Galería actual: ${existingGalleryUrls.length} foto${existingGalleryUrls.length !== 1 ? "s" : ""}`;
      if (galWarning) galWarning.style.display = "block";
      if (galThumbs) {
        galThumbs.innerHTML = "";
        existingGalleryUrls.forEach((url) => {
          const wrap = document.createElement("div");
          wrap.className = "gallery-thumb-wrap";
          const img = document.createElement("img");
          img.src = url;
          img.alt = "Foto de galería";
          img.loading = "lazy";
          wrap.appendChild(img);
          galThumbs.appendChild(wrap);
        });
      }
      renderGalleryThumbnails();
    }

    form.style.display = "block";
  }

  // ── Guardar datos ────────────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorAlert.style.display = "none";
    successAlert.style.display = "none";
    clearMediaError("photo");
    clearMediaError("music");
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";

    const slugValue = document.getElementById("slug").value.trim();
    const slugToUse = slugValue || currentSlug;

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
    let finalGalleryUrls = existingGalleryUrls;
    const galleryFiles   = selectedGalleryFiles;

    if (galleryFiles.length > 0) {
      clearMediaError("gallery");

      if (galleryFiles.length > 10) {
        showMediaError("gallery", `Solo puedes subir máximo 10 fotos. Seleccionaste ${galleryFiles.length}.`);
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        return;
      }

      // Validar cada archivo
      for (let i = 0; i < galleryFiles.length; i++) {
        if (!validateFile(galleryFiles[i], ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, "gallery")) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Guardar cambios";
          return;
        }
      }

      // Subir cada archivo secuencialmente
      showProgress("gallery");
      const uploadedUrls = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const el = document.getElementById("gallery-progress");
        if (el) el.textContent = `⏳ Subiendo foto ${i + 1} de ${galleryFiles.length}...`;
        const url = await uploadFileToStorage(galleryFiles[i], "gallery", slugToUse);
        if (!url) {
          hideProgress("gallery");
          showMediaError("gallery", `Error al subir la foto ${i + 1}. Intenta de nuevo.`);
          saveBtn.disabled = false;
          saveBtn.textContent = "Guardar cambios";
          return;
        }
        uploadedUrls.push(url);
      }
      hideProgress("gallery");
      finalGalleryUrls = uploadedUrls;
    }

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
      visual_theme: document.getElementById("visual_theme") ? document.getElementById("visual_theme").value : "rose-floral",
      color_primary: document.getElementById("color_primary").value,
      color_secondary: document.getElementById("color_secondary").value,
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
      template_id: null,
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
