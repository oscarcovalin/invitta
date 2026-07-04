/**
 * studio-form.js
 * Lógica para crear y editar invitaciones en Invitta Studio
 */

document.addEventListener("DOMContentLoaded", async () => {
  const session = await window.studioAuth.requireSession();
  if (!session) return;

  const db = window.studioAuth.db;
  const urlParams = new URLSearchParams(window.location.search);
  const inviteId = urlParams.get("id");
  const isEditMode = !!inviteId;
  
  // Elementos del DOM
  const form = document.getElementById("invitation-form");
  const loading = document.getElementById("loading-indicator");
  const errorAlert = document.getElementById("form-error");
  const successAlert = document.getElementById("form-success");
  const pageTitle = document.getElementById("page-title");
  const saveBtn = document.getElementById("save-btn");

  // URLs actuales (preservar si no se sube archivo nuevo)
  let existingPhotoUrl = null;
  let existingMusicUrl = null;
  let existingGalleryUrls = [];

  let currentStudioId = localStorage.getItem("invitta_studio_id");
  let currentSlug = "";

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
    document.getElementById("title").value = data.title || "";
    document.getElementById("slug").value = data.slug || "";
    document.getElementById("event_type").value = data.event_type || "boda";
    document.getElementById("honoree_name").value = data.honoree_name || "";
    document.getElementById("event_date").value = data.event_date || "";
    document.getElementById("event_time").value = data.event_time || "";
    document.getElementById("welcome_text").value = data.welcome_text || "";
    
    document.getElementById("father_name").value = data.father_name || "";
    document.getElementById("mother_name").value = data.mother_name || "";
    document.getElementById("instagram_hashtag").value = data.instagram_hashtag || "";

    let godparentsText = "";
    if (data.godparents && Array.isArray(data.godparents)) {
      godparentsText = data.godparents.map(gp => {
        if (gp.role && gp.role !== "Padrinos") return `${gp.role}: ${gp.name}`;
        return gp.name;
      }).join("\n");
    }
    document.getElementById("godparents_text").value = godparentsText;

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
    document.getElementById("whatsapp_number").value = data.whatsapp_number || "";
    document.getElementById("published").checked = !!data.published;

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

    const slugValue = document.getElementById("slug").value;
    const slugToUse = slugValue || currentSlug;

    // ── Subida de foto ──
    let finalPhotoUrl = existingPhotoUrl;
    const photoFile = document.getElementById("mainPhotoFile")?.files[0];
    if (photoFile) {
      if (!validateFile(photoFile, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, "photo")) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar Invitación";
        return;
      }
      showProgress("photo");
      const uploadedUrl = await uploadFileToStorage(photoFile, "main-photo", slugToUse);
      hideProgress("photo");
      if (!uploadedUrl) {
        showMediaError("photo", "Error al subir la foto. Intenta de nuevo.");
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar Invitación";
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
        saveBtn.textContent = "Guardar Invitación";
        return;
      }
      showProgress("music");
      const uploadedUrl = await uploadFileToStorage(musicFile, "music", slugToUse);
      hideProgress("music");
      if (!uploadedUrl) {
        showMediaError("music", "Error al subir la música. Intenta de nuevo.");
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar Invitación";
        return;
      }
      finalMusicUrl = uploadedUrl;
    }

    // ── Subida de galería ──
    let finalGalleryUrls = existingGalleryUrls;
    const galleryInput   = document.getElementById("galleryFiles");
    const galleryFiles   = galleryInput ? Array.from(galleryInput.files) : [];

    if (galleryFiles.length > 0) {
      clearMediaError("gallery");

      if (galleryFiles.length > 10) {
        showMediaError("gallery", `Solo puedes subir máximo 10 fotos. Seleccionaste ${galleryFiles.length}.`);
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar Invitación";
        return;
      }

      // Validar cada archivo
      for (let i = 0; i < galleryFiles.length; i++) {
        if (!validateFile(galleryFiles[i], ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, "gallery")) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Guardar Invitación";
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
          saveBtn.textContent = "Guardar Invitación";
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
    const payload = {
      title: document.getElementById("title").value,
      slug: slugValue,
      event_type: document.getElementById("event_type").value,
      honoree_name: document.getElementById("honoree_name").value,
      event_date: document.getElementById("event_date").value || null,
      event_time: document.getElementById("event_time").value || null,
      welcome_text: document.getElementById("welcome_text").value,
      father_name: document.getElementById("father_name").value || null,
      mother_name: document.getElementById("mother_name").value || null,
      instagram_hashtag: document.getElementById("instagram_hashtag").value || null,
      godparents: godparentsJson,
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
      whatsapp_number: document.getElementById("whatsapp_number").value,
      published: document.getElementById("published").checked,
      gallery_urls: finalGalleryUrls,
      itinerary: [],
      template_id: null,
      main_photo_url: finalPhotoUrl,
      music_url: finalMusicUrl,
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
        .insert([payload]);
    }

    if (result.error) {
      console.error("Error al guardar:", result.error);
      errorAlert.textContent = "Error al guardar. Puede que el slug ya esté en uso u otro error de validación.";
      errorAlert.style.display = "block";
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar Invitación";
    } else {
      successAlert.textContent = "Invitación guardada exitosamente. Redirigiendo...";
      successAlert.style.display = "block";
      setTimeout(() => {
        window.location.href = "/administracion/studio-dashboard.html";
      }, 1500);
    }
  });

});
