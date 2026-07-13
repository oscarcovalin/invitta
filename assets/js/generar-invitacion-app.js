/**
 * Fase 7F/7G/7H/7I.2 — Generador de invitación publicable desde invitta-configuracion.json.
 * 7I.2: Renderizar portada fotográfica, galería, música y marca del estudio.
 * 100% local en el navegador. Sin Supabase. Sin APIs externas.
 */

"use strict";

let loadedConfig = null;
let finalHTML    = null;
let previewBlobUrl = null;
let currentPublicationSlug = null;
let currentPublicationManifest = null;
let currentStudioPayload = null;

let currentStudioSession = null;
let currentStudioContext = null;
let studioContextReady = false;

let draftCreationInProgress = false;
let createdStudioDraft = null;
let draftUpdateInProgress = false;
let draftPayloadDirty = false;
let lastSavedDraftPayloadFingerprint = null;

let draftPublishInProgress = false;
let publishedStudioInvitation = null;
let publishConfirmationArmed = false;

let requestedDraftId = null;
let recoveredStudioDraft = null;
let draftRecoveryInProgress = false;
let draftRecoveryReady = false;
let configurationBackupInProgress = false;

function cloneConfigurationForBackup(source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
        return null;
    }
    try {
        return JSON.parse(JSON.stringify(source));
    } catch (e) {
        console.error("Error al clonar configuración para respaldo:", e);
        return null;
    }
}

function removeInternalBackupFields(value) {
    if (!value || typeof value !== "object") return value;

    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            value[i] = removeInternalBackupFields(value[i]);
        }
        return value;
    }

    const forbidden = [
        "studio_id", "user_id", "owner_id", "created_at", "updated_at",
        "published", "link_builder_pin", "access_token", "refresh_token", "token", "session",
        "requestedDraftId", "recoveredStudioDraft", "draftRecoveryReady",
        "createdStudioDraft", "publishedStudioInvitation", "lastSavedDraftPayloadFingerprint",
        "draftPayloadDirty", "currentStudioContext", "currentStudioSession"
    ];

    for (const key of Object.keys(value)) {
        if (forbidden.includes(key)) {
            delete value[key];
        } else if (typeof value[key] === "object") {
            value[key] = removeInternalBackupFields(value[key]);
        }
    }

    return value;
}

function buildConfigurationBackup() {
    if (!loadedConfig) return null;

    let copy = cloneConfigurationForBackup(loadedConfig);
    if (!copy) return null;

    copy = removeInternalBackupFields(copy);

    copy._backup = {
        format: "invitta-configuracion",
        version: 1
    };

    return copy;
}

function createConfigurationBackupFilename() {
    const safeSlug = String(currentPublicationSlug || "").trim();
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(safeSlug) && safeSlug.length > 0 && safeSlug.length <= 160) {
        return `invitta-configuracion-${safeSlug}.json`;
    }
    return "invitta-configuracion-respaldo.json";
}

function downloadConfigurationBackup() {
    if (!enforceStudioReady()) return;
    if (configurationBackupInProgress) return;
    if (!loadedConfig) return;

    configurationBackupInProgress = true;
    updateConfigurationBackupButtonState();

    let backup;
    try {
        backup = buildConfigurationBackup();
        if (!backup) throw new Error("buildConfigurationBackup returned null");
        
        const jsonStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = createConfigurationBackupFilename();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        const msgEl = document.getElementById("configurationBackupStatusMsg") || document.getElementById("previewStatusMsg");
        if (msgEl) {
            msgEl.textContent = "Respaldo de configuración descargado correctamente.";
            msgEl.style.color = "var(--success)";
            msgEl.style.display = "block";
            msgEl.setAttribute("role", "status");
            msgEl.setAttribute("aria-live", "polite");
        }
    } catch (err) {
        console.error("Error al generar respaldo:", err);
        const msgEl = document.getElementById("configurationBackupStatusMsg") || document.getElementById("previewStatusMsg");
        if (msgEl) {
            msgEl.textContent = "No fue posible preparar el respaldo de configuración.";
            msgEl.style.color = "var(--danger)";
            msgEl.style.display = "block";
            msgEl.setAttribute("role", "alert");
            msgEl.setAttribute("aria-live", "assertive");
        }
    } finally {
        configurationBackupInProgress = false;
        updateConfigurationBackupButtonState();
    }
}

function updateConfigurationBackupButtonState() {
    const btn = document.getElementById("btnDownloadConfigurationBackup");
    if (!btn) return;

    if (!loadedConfig) {
        btn.disabled = true;
        btn.textContent = "Respaldo no disponible";
        return;
    }

    if (draftCreationInProgress || draftUpdateInProgress || draftPublishInProgress) {
        btn.disabled = true;
        btn.textContent = "Preparando invitación...";
        return;
    }

    if (configurationBackupInProgress) {
        btn.disabled = true;
        btn.textContent = "Preparando respaldo...";
        return;
    }

    btn.disabled = false;
    btn.textContent = "Descargar respaldo de configuración";
}

function readRequestedDraftId() {
    const params = new URLSearchParams(window.location.search);
    const id = String(params.get("draft") || "").trim();
    if (!id) return null;
    
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        const msgEl = document.getElementById("authStatusMsg");
        if (msgEl) {
            msgEl.textContent = "El enlace de recuperación no es válido.";
            msgEl.style.color = "var(--danger)";
        }
        return null;
    }
    return id;
}

function createDraftPayloadFingerprint(payload) {
    if (!payload) return null;
    const copy = JSON.parse(JSON.stringify(payload));
    delete copy.studio_id;
    copy.published = false;
    copy.link_builder_pin = "";
    
    const sorted = {};
    Object.keys(copy).sort().forEach(k => {
        sorted[k] = copy[k];
    });
    return JSON.stringify(sorted);
}

function validateDraftCreationReadiness() {
    const errors = [];
    const warnings = [];

    if (!isStudioGeneratorReady()) errors.push("No hay una sesión de estudio válida o activa.");
    if (!currentStudioContext || !currentStudioContext.id) errors.push("No se ha podido resolver el ID del estudio.");
    if (!currentStudioPayload) errors.push("No se ha generado el payload para Invitta Studio.");
    if (!currentPublicationSlug) errors.push("No se ha generado un slug de publicación.");
    if (currentStudioPayload && currentStudioPayload.slug !== currentPublicationSlug) errors.push("El slug del payload no coincide con el slug actual.");
    if (currentStudioPayload && currentStudioPayload.published !== false) errors.push("El borrador no puede estar marcado como publicado.");
    if (draftCreationInProgress) errors.push("Ya hay una creación de borrador en progreso.");
    if (draftUpdateInProgress) errors.push("Ya hay una actualización de borrador en progreso.");
    if (createdStudioDraft) errors.push("Ya existe un borrador creado para esta generación.");
    if (!window.studioAuth || !window.studioAuth.db) errors.push("No existe conexión con la base de datos.");

    if (currentStudioPayload) {
        const payloadValidation = validateStudioInvitationPayload(currentStudioPayload);
        if (payloadValidation.errors.length > 0) {
            errors.push("El payload contiene errores de validación.");
        }
        warnings.push(...payloadValidation.warnings);
    }

    return { errors, warnings };
}

function validateDraftUpdateReadiness() {
    const errors = [];
    const warnings = [];

    if (!isStudioGeneratorReady()) errors.push("No hay una sesión de estudio válida o activa.");
    if (draftUpdateInProgress) errors.push("Ya hay una actualización de borrador en progreso.");
    if (draftCreationInProgress) errors.push("Ya hay una creación de borrador en progreso.");
    if (!createdStudioDraft) errors.push("No existe un borrador creado previamente.");
    if (createdStudioDraft && !createdStudioDraft.id) errors.push("El borrador previo no tiene un ID válido.");
    if (createdStudioDraft && !createdStudioDraft.slug) errors.push("El borrador previo no tiene un slug válido.");
    if (!currentStudioPayload) errors.push("No se ha generado el payload para Invitta Studio.");
    if (!currentPublicationSlug) errors.push("No se ha generado un slug de publicación.");
    if (createdStudioDraft && currentPublicationSlug !== createdStudioDraft.slug) errors.push("El slug actual es diferente al del borrador original.");
    if (currentStudioPayload && createdStudioDraft && currentStudioPayload.slug !== createdStudioDraft.slug) errors.push("El slug del payload no coincide con el del borrador original.");
    if (currentStudioPayload && currentStudioPayload.published !== false) errors.push("El borrador no puede estar marcado como publicado.");
    if (!draftPayloadDirty) errors.push("El borrador no tiene cambios pendientes de guardar.");
    if (!window.studioAuth || !window.studioAuth.db) errors.push("No existe conexión con la base de datos.");

    if (currentStudioPayload) {
        const payloadValidation = validateStudioInvitationPayload(currentStudioPayload);
        if (payloadValidation.errors.length > 0) {
            errors.push("El payload contiene errores de validación.");
        }
        warnings.push(...payloadValidation.warnings);
    }

    return { errors, warnings };
}

function validateDraftPublishReadiness() {
    const errors = [];
    const warnings = [];

    if (!isStudioGeneratorReady()) errors.push("No hay una sesión de estudio válida o activa.");
    if (draftCreationInProgress) errors.push("Ya hay una creación de borrador en progreso.");
    if (draftUpdateInProgress) errors.push("Ya hay una actualización de borrador en progreso.");
    if (draftPublishInProgress) errors.push("Ya hay una publicación en progreso.");
    if (!createdStudioDraft) errors.push("No existe un borrador creado previamente.");
    if (createdStudioDraft && !createdStudioDraft.id) errors.push("El borrador previo no tiene un ID válido.");
    if (createdStudioDraft && !createdStudioDraft.slug) errors.push("El borrador previo no tiene un slug válido.");
    if (!currentStudioPayload) errors.push("No se ha generado el payload para Invitta Studio.");
    if (!currentPublicationSlug) errors.push("No se ha generado un slug de publicación.");
    if (createdStudioDraft && currentPublicationSlug !== createdStudioDraft.slug) errors.push("El slug actual es diferente al del borrador original.");
    if (currentStudioPayload && createdStudioDraft && currentStudioPayload.slug !== createdStudioDraft.slug) errors.push("El slug del payload no coincide con el del borrador original.");
    if (draftPayloadDirty) errors.push("El borrador tiene cambios pendientes de guardar.");
    if (!lastSavedDraftPayloadFingerprint) errors.push("No existe fingerprint del último borrador guardado.");
    if (publishedStudioInvitation) errors.push("La invitación ya está publicada localmente.");
    if (!window.studioAuth || !window.studioAuth.db) errors.push("No existe conexión con la base de datos.");
    if (!publishConfirmationArmed) errors.push("La confirmación de publicación no está armada.");

    if (currentStudioPayload) {
        const payloadValidation = validateStudioInvitationPayload(currentStudioPayload);
        if (payloadValidation.errors.length > 0) {
            errors.push("El payload contiene errores de validación.");
        }
        warnings.push(...payloadValidation.warnings);
    }

    return { errors, warnings };
}

function buildDraftInsertPayload() {
    const cp = currentStudioPayload;
    
    const payload = {
        title: cp.title,
        slug: cp.slug,
        event_type: cp.event_type,
        honoree_name: cp.honoree_name,
        event_date: cp.event_date,
        event_time: cp.event_time,
        welcome_text: cp.welcome_text,
        father_name: cp.father_name,
        mother_name: cp.mother_name,
        instagram_hashtag: cp.instagram_hashtag,
        thank_you_title: cp.thank_you_title,
        thank_you_message: cp.thank_you_message,
        thank_you_signature: cp.thank_you_signature,
        hashtag_section_title: cp.hashtag_section_title,
        hashtag_section_message: cp.hashtag_section_message,
        godparents: Array.isArray(cp.godparents) 
            ? cp.godparents
                .filter(g => g && typeof g === "object" && typeof g.name === "string" && g.name.trim() !== "")
                .map(g => ({
                    role: String(g.role || "").trim(),
                    name: String(g.name).trim()
                }))
                .slice(0, 20)
            : [],
        font_preset: cp.font_preset,
        visual_theme: cp.visual_theme,
        color_primary: cp.color_primary,
        color_secondary: cp.color_secondary,
        ceremony_name: cp.ceremony_name,
        ceremony_address: cp.ceremony_address,
        ceremony_map_url: cp.ceremony_map_url,
        reception_name: cp.reception_name,
        reception_address: cp.reception_address,
        reception_map_url: cp.reception_map_url,
        gift_table_url: cp.gift_table_url,
        dress_code: cp.dress_code,
        whatsapp_number: cp.whatsapp_number,
        published: false,
        studio_name: cp.studio_name,
        studio_logo_url: cp.studio_logo_url,
        music_player_brand_enabled: cp.music_player_brand_enabled,
        studio_whatsapp: cp.studio_whatsapp,
        studio_cta_enabled: cp.studio_cta_enabled,
        studio_cta_text: cp.studio_cta_text,
        studio_cta_message: cp.studio_cta_message,
        link_builder_enabled: cp.link_builder_enabled,
        link_builder_pin: "",
        link_builder_title: cp.link_builder_title,
        link_builder_message: cp.link_builder_message,
        gallery_urls: Array.isArray(cp.gallery_urls) 
            ? cp.gallery_urls
                .filter(url => typeof url === "string" && safeHttpsUrl(url))
                .slice(0, 10)
            : [],
        itinerary: Array.isArray(cp.itinerary) 
            ? cp.itinerary
                .filter(i => i && typeof i === "object" && typeof i.title === "string" && i.title.trim() !== "")
                .map(i => ({
                    time: String(i.time || "").trim(),
                    title: String(i.title).replace(/<[^>]*>?/gm, "").trim()
                }))
                .slice(0, 30)
            : [],
        background_image_url: cp.background_image_url,
        music_title: cp.music_title,
        music_artist: cp.music_artist,
        template_id: cp.template_id,
        main_photo_url: cp.main_photo_url,
        music_url: cp.music_url,
        studio_id: String(currentStudioContext.id)
    };

    return payload;
}

function buildDraftUpdatePayload() {
    const payload = buildDraftInsertPayload();
    delete payload.studio_id;
    delete payload.id;
    delete payload.slug;
    payload.published = false;
    payload.link_builder_pin = "";
    return payload;
}

function cancelDraftRecovery() {
    requestedDraftId = null;
    recoveredStudioDraft = null;
    draftRecoveryReady = false;
    createdStudioDraft = null;
    publishedStudioInvitation = null;
    lastSavedDraftPayloadFingerprint = null;
    draftPayloadDirty = false;
    publishConfirmationArmed = false;

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("draft");
    window.history.replaceState({}, document.title, newUrl.toString());

    updateDraftCreationButtonState();
    updateDraftUpdateButtonState();
    updateDraftPublishButtonState();
    updateConfigurationBackupButtonState();

    const btnCancel = document.getElementById("btnCancelDraftRecovery");
    if (btnCancel) btnCancel.style.display = "none";

    const msgEl = document.getElementById("authStatusMsg");
    if (msgEl) {
        msgEl.textContent = "Ahora estás trabajando como una invitación nueva.";
        msgEl.style.color = "var(--text)";
    }
}

function appendCancelDraftRecoveryButton(container) {
    if (!container || !recoveredStudioDraft) return;
    if (document.getElementById("btnCancelDraftRecovery")) return;

    const btnCancelRecovery = document.createElement("button");
    btnCancelRecovery.type = "button";
    btnCancelRecovery.id = "btnCancelDraftRecovery";
    btnCancelRecovery.className = "btn";
    btnCancelRecovery.style.marginTop = "10px";
    btnCancelRecovery.style.marginLeft = "10px";
    btnCancelRecovery.textContent = "Trabajar como invitación nueva";
    btnCancelRecovery.addEventListener("click", cancelDraftRecovery);
    
    container.appendChild(btnCancelRecovery);
}

function updateDraftCreationButtonState() {
    const btn = document.getElementById("btnCreateStudioDraft");
    if (!btn) return;

    if (draftRecoveryInProgress || (draftRecoveryReady && recoveredStudioDraft && (!currentPublicationSlug || currentPublicationSlug !== recoveredStudioDraft.slug))) {
        btn.disabled = true;
        btn.textContent = "Archivo no correspondiente";
        return;
    }

    if (draftCreationInProgress || draftUpdateInProgress || draftPublishInProgress || !isStudioGeneratorReady() || !currentStudioPayload || createdStudioDraft || (draftRecoveryReady && recoveredStudioDraft)) {
        btn.disabled = true;
    } else {
        const validation = validateStudioInvitationPayload(currentStudioPayload);
        btn.disabled = (validation.errors.length > 0);
    }

    if (draftCreationInProgress) {
        btn.textContent = "Creando borrador...";
    } else if (createdStudioDraft || (draftRecoveryReady && recoveredStudioDraft)) {
        btn.textContent = "Borrador creado";
    } else {
        btn.textContent = "Crear borrador en Invitta Studio";
    }
}

function updateDraftUpdateButtonState() {
    const btn = document.getElementById("btnUpdateStudioDraft");
    if (!btn) return;
    
    if (draftRecoveryInProgress || (draftRecoveryReady && recoveredStudioDraft && (!currentPublicationSlug || currentPublicationSlug !== recoveredStudioDraft.slug))) {
        btn.style.display = "none";
        btn.disabled = true;
        return;
    }
    
    if (!createdStudioDraft || 
        !currentPublicationSlug || 
        currentPublicationSlug !== createdStudioDraft.slug || 
        !currentStudioPayload || 
        currentStudioPayload.slug !== createdStudioDraft.slug) {
        btn.style.display = "none";
        btn.disabled = true;
        btn.textContent = "Actualizar borrador en Invitta Studio";
        return;
    }

    if (draftUpdateInProgress) {
        btn.style.display = "inline-block";
        btn.disabled = true;
        btn.textContent = "Actualizando borrador...";
        return;
    }

    if (draftPublishInProgress) {
        btn.style.display = "inline-block";
        btn.disabled = true;
        btn.textContent = "Publicación no disponible";
        return;
    }

    if (draftCreationInProgress) {
        btn.style.display = "inline-block";
        btn.disabled = true;
        btn.textContent = "Actualizar borrador en Invitta Studio";
        return;
    }

    const validation = validateStudioInvitationPayload(currentStudioPayload);
    if (validation.errors.length > 0) {
        btn.style.display = "inline-block";
        btn.disabled = true;
        btn.textContent = "Actualizar borrador no disponible";
        return;
    }

    if (!draftPayloadDirty) {
        btn.style.display = "inline-block";
        btn.disabled = true;
        btn.textContent = "Borrador sin cambios";
        return;
    }

    btn.style.display = "inline-block";
    btn.disabled = false;
    btn.textContent = "Actualizar borrador en Invitta Studio";
}

function updateDraftPublishButtonState() {
    const btn = document.getElementById("btnPublishStudioInvitation");
    const panel = document.getElementById("publishConfirmationPanel");
    if (!btn) return;
    
    if (draftRecoveryInProgress || (draftRecoveryReady && recoveredStudioDraft && (!currentPublicationSlug || currentPublicationSlug !== recoveredStudioDraft.slug))) {
        btn.style.display = "none";
        if (panel) panel.style.display = "none";
        btn.disabled = true;
        return;
    }
    
    if (!createdStudioDraft || 
        !currentPublicationSlug || 
        currentPublicationSlug !== createdStudioDraft.slug) {
        btn.style.display = "none";
        btn.disabled = true;
        if (panel) panel.style.display = "none";
        return;
    }

    btn.style.display = "inline-block";

    if (publishedStudioInvitation) {
        btn.disabled = true;
        btn.textContent = "Invitación publicada";
        if (panel) panel.style.display = "none";
        return;
    }

    if (draftPublishInProgress) {
        btn.disabled = true;
        btn.textContent = "Publicando invitación...";
        if (panel) panel.style.display = "none";
        return;
    }

    if (draftCreationInProgress || draftUpdateInProgress) {
        btn.disabled = true;
        btn.textContent = "Publicación no disponible";
        if (panel) panel.style.display = "none";
        return;
    }

    if (draftPayloadDirty) {
        btn.disabled = true;
        btn.textContent = "Guarda los cambios antes de publicar";
        if (panel) panel.style.display = "none";
        return;
    }

    if (publishConfirmationArmed) {
        btn.style.display = "none";
        if (panel) panel.style.display = "block";
        return;
    }

    btn.disabled = false;
    btn.textContent = "Publicar invitación";
    if (panel) panel.style.display = "none";
}

function preparePublishConfirmation() {
    if (draftCreationInProgress || draftUpdateInProgress || draftPublishInProgress || draftPayloadDirty) return;
    
    publishConfirmationArmed = true;
    updateDraftPublishButtonState();
    updateConfigurationBackupButtonState();
    
    const panel = document.getElementById("publishConfirmationPanel");
    if (panel) panel.style.display = "block";
}

function cancelPublishConfirmation() {
    publishConfirmationArmed = false;
    updateDraftPublishButtonState();
    updateConfigurationBackupButtonState();
    const panel = document.getElementById("publishConfirmationPanel");
    if (panel) panel.style.display = "none";
}

async function createStudioInvitationDraft() {
    if (!enforceStudioReady()) return;
    if (draftCreationInProgress || createdStudioDraft) return;
    
    const readiness = validateDraftCreationReadiness();
    const msgEl = document.getElementById("studioDraftStatusMsg");
    
    if (readiness.errors.length > 0) {
        if (msgEl) {
            msgEl.textContent = "Errores: " + readiness.errors.join(" ");
            msgEl.style.color = "var(--danger)";
            msgEl.setAttribute("role", "alert");
            msgEl.setAttribute("aria-live", "assertive");
        }
        return;
    }

    draftCreationInProgress = true;
    updateDraftCreationButtonState();
    
    if (msgEl) {
        msgEl.textContent = "Creando borrador...";
        msgEl.style.color = "var(--text)";
        msgEl.setAttribute("role", "status");
        msgEl.setAttribute("aria-live", "polite");
        // Remove old anchor if any
        Array.from(msgEl.children).forEach(c => c.remove());
    }

    try {
        const db = window.studioAuth.db;
        
        const { data: existing, error: findError } = await db
            .from("studio_invitations")
            .select("id, slug")
            .eq("studio_id", currentStudioContext.id)
            .eq("slug", currentPublicationSlug)
            .maybeSingle();

        if (findError) {
            console.error("Error buscando slug duplicado:", findError);
            const err = new Error("DUPLICATE_CHECK_FAILED");
            err.code = "DUPLICATE_CHECK_FAILED";
            throw err;
        }
        if (existing) {
            const err = new Error("DUPLICATE_SLUG");
            err.code = "DUPLICATE_SLUG";
            throw err;
        }

        const payload = buildDraftInsertPayload();

        const { data, error: insertError } = await db
            .from("studio_invitations")
            .insert([payload])
            .select("id, slug")
            .single();

        if (insertError) {
            console.error("Error insertando borrador:", insertError);
            const err = new Error("INSERT_FAILED");
            err.code = "INSERT_FAILED";
            throw err;
        }
        if (!data || !data.id || !data.slug) {
            console.error("Respuesta inesperada al crear borrador:", data);
            const err = new Error("INVALID_RESPONSE");
            err.code = "INVALID_RESPONSE";
            throw err;
        }

        createdStudioDraft = {
            id: String(data.id),
            slug: String(data.slug)
        };
        const fullPayload = buildDraftInsertPayload();
        lastSavedDraftPayloadFingerprint = createDraftPayloadFingerprint(fullPayload);
        draftPayloadDirty = false;

        if (msgEl) {
            msgEl.textContent = `Borrador creado: ${createdStudioDraft.slug}`;
            msgEl.style.color = "var(--success)";
            msgEl.setAttribute("role", "status");
            msgEl.setAttribute("aria-live", "polite");
            
            const a = document.createElement("a");
            a.href = `/administracion/studio-invitacion-form.html?id=${encodeURIComponent(createdStudioDraft.id)}`;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = "Abrir en el editor de Studio";
            a.style.display = "block";
            a.style.marginTop = "8px";
            a.style.color = "var(--accent)";
            a.style.fontWeight = "500";
            a.style.textDecoration = "none";
            
            const linkDash = document.createElement("a");
            linkDash.href = `/administracion/studio-dashboard.html`;
            linkDash.id = "goToDashboardAfterDraft";
            linkDash.textContent = "Ver todas mis invitaciones";
            linkDash.style.display = "block";
            linkDash.style.marginTop = "8px";
            linkDash.style.color = "var(--text)";
            linkDash.style.fontWeight = "500";
            linkDash.style.textDecoration = "none";
            
            msgEl.appendChild(document.createElement("br"));
            msgEl.appendChild(a);
            msgEl.appendChild(linkDash);
        }
    } catch (err) {
        console.error("Error creando borrador Studio:", err);
        if (msgEl) {
            let uiMsg = "No fue posible crear el borrador.";
            if (err.code === "DUPLICATE_SLUG") {
                uiMsg = "Ya existe una invitación con este slug en tu estudio.";
            } else if (err.code === "DUPLICATE_CHECK_FAILED") {
                uiMsg = "No fue posible comprobar la disponibilidad del enlace.";
            }
            
            msgEl.textContent = uiMsg;
            msgEl.style.color = "var(--danger)";
            msgEl.setAttribute("role", "alert");
            msgEl.setAttribute("aria-live", "assertive");
        }
    } finally {
        draftCreationInProgress = false;
        updateDraftCreationButtonState();
        updateDraftUpdateButtonState();
    }
}

async function updateStudioInvitationDraft() {
    if (!enforceStudioReady()) return;
    if (draftUpdateInProgress || draftCreationInProgress) return;
    
    const readiness = validateDraftUpdateReadiness();
    const msgEl = document.getElementById("studioDraftStatusMsg");
    
    if (readiness.errors.length > 0) {
        if (msgEl) {
            msgEl.textContent = "Errores: " + readiness.errors.join(" ");
            msgEl.style.color = "var(--danger)";
            msgEl.setAttribute("role", "alert");
            msgEl.setAttribute("aria-live", "assertive");
        }
        return;
    }

    draftUpdateInProgress = true;
    updateDraftUpdateButtonState();
    updateDraftCreationButtonState();
    
    if (msgEl) {
        msgEl.textContent = "Actualizando borrador...";
        msgEl.style.color = "var(--text)";
        msgEl.setAttribute("role", "status");
        msgEl.setAttribute("aria-live", "polite");
        Array.from(msgEl.children).forEach(c => c.remove());
    }

    try {
        const db = window.studioAuth.db;
        
        const { data: existing, error: findError } = await db
            .from("studio_invitations")
            .select("id, slug, studio_id, published")
            .eq("id", createdStudioDraft.id)
            .eq("studio_id", currentStudioContext.id)
            .maybeSingle();

        if (findError) {
            console.error("Error verificando borrador para actualización:", findError);
            const err = new Error("UPDATE_CHECK_FAILED");
            err.code = "UPDATE_CHECK_FAILED";
            throw err;
        }
        if (!existing) {
            const err = new Error("DRAFT_NOT_FOUND");
            err.code = "DRAFT_NOT_FOUND";
            throw err;
        }
        if (existing.slug !== createdStudioDraft.slug) {
            const err = new Error("DRAFT_SLUG_MISMATCH");
            err.code = "DRAFT_SLUG_MISMATCH";
            throw err;
        }
        if (existing.studio_id !== currentStudioContext.id) {
            const err = new Error("DRAFT_STUDIO_MISMATCH");
            err.code = "DRAFT_STUDIO_MISMATCH";
            throw err;
        }
        if (existing.published !== false) {
            const err = new Error("DRAFT_ALREADY_PUBLISHED");
            err.code = "DRAFT_ALREADY_PUBLISHED";
            throw err;
        }

        const payload = buildDraftUpdatePayload();

        const { data, error: updateError } = await db
            .from("studio_invitations")
            .update(payload)
            .eq("id", createdStudioDraft.id)
            .eq("studio_id", currentStudioContext.id)
            .eq("slug", createdStudioDraft.slug)
            .eq("published", false)
            .select("id, slug, published")
            .single();

        if (updateError) {
            console.error("Error actualizando borrador:", updateError);
            const err = new Error("UPDATE_FAILED");
            err.code = "UPDATE_FAILED";
            throw err;
        }
        if (!data || !data.id || !data.slug || data.published !== false) {
            console.error("Respuesta inesperada al actualizar borrador:", data);
            const err = new Error("INVALID_UPDATE_RESPONSE");
            err.code = "INVALID_UPDATE_RESPONSE";
            throw err;
        }
        if (data.id !== createdStudioDraft.id || data.slug !== createdStudioDraft.slug) {
            console.error("Inconsistencia en respuesta al actualizar:", data);
            const err = new Error("INVALID_UPDATE_RESPONSE");
            err.code = "INVALID_UPDATE_RESPONSE";
            throw err;
        }

        const fullPayload = buildDraftInsertPayload();
        lastSavedDraftPayloadFingerprint = createDraftPayloadFingerprint(fullPayload);
        draftPayloadDirty = false;

        if (msgEl) {
            msgEl.textContent = `Borrador actualizado correctamente.`;
            msgEl.style.color = "var(--success)";
            msgEl.setAttribute("role", "status");
            msgEl.setAttribute("aria-live", "polite");
            
            const a = document.createElement("a");
            a.href = `/administracion/studio-invitacion-form.html?id=${encodeURIComponent(createdStudioDraft.id)}`;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = "Abrir en el editor de Studio";
            a.style.display = "block";
            a.style.marginTop = "8px";
            a.style.color = "var(--accent)";
            a.style.fontWeight = "500";
            a.style.textDecoration = "none";
            
            const linkDash = document.createElement("a");
            linkDash.href = `/administracion/studio-dashboard.html`;
            linkDash.id = "goToDashboardAfterUpdate";
            linkDash.textContent = "Ver todas mis invitaciones";
            linkDash.style.display = "block";
            linkDash.style.marginTop = "8px";
            linkDash.style.color = "var(--text)";
            linkDash.style.fontWeight = "500";
            linkDash.style.textDecoration = "none";
            
            msgEl.appendChild(document.createElement("br"));
            msgEl.appendChild(a);
            msgEl.appendChild(linkDash);
        }
    } catch (err) {
        console.error("Error en updateStudioInvitationDraft:", err);
        if (msgEl) {
            let uiMsg = "No fue posible actualizar el borrador.";
            if (err.code === "DRAFT_NOT_FOUND") {
                uiMsg = "No se encontró el borrador asociado.";
            } else if (err.code === "DRAFT_ALREADY_PUBLISHED") {
                uiMsg = "La invitación ya está publicada y no puede modificarse desde este generador.";
            }
            msgEl.textContent = uiMsg;
            msgEl.style.color = "var(--danger)";
            msgEl.setAttribute("role", "alert");
            msgEl.setAttribute("aria-live", "assertive");
        }
    } finally {
        draftUpdateInProgress = false;
        updateDraftUpdateButtonState();
        updateDraftCreationButtonState();
        updateDraftPublishButtonState();
    updateConfigurationBackupButtonState();
    }
}

async function publishStudioInvitation() {
    if (!enforceStudioReady()) return;
    if (draftCreationInProgress || draftUpdateInProgress || draftPublishInProgress) return;
    
    const readiness = validateDraftPublishReadiness();
    const msgEl = document.getElementById("studioPublishStatusMsg");
    
    if (readiness.errors.length > 0) {
        if (msgEl) {
            msgEl.textContent = "Errores: " + readiness.errors.join(" ");
            msgEl.style.color = "var(--danger)";
            msgEl.setAttribute("role", "alert");
            msgEl.setAttribute("aria-live", "assertive");
        }
        return;
    }

    draftPublishInProgress = true;
    updateDraftCreationButtonState();
    updateDraftUpdateButtonState();
    updateDraftPublishButtonState();
    updateConfigurationBackupButtonState();
    
    if (msgEl) {
        msgEl.textContent = "Publicando invitación...";
        msgEl.style.color = "var(--text)";
        msgEl.setAttribute("role", "status");
        msgEl.setAttribute("aria-live", "polite");
        Array.from(msgEl.children).forEach(c => c.remove());
    }

    try {
        const db = window.studioAuth.db;
        
        const { data: existing, error: findError } = await db
            .from("studio_invitations")
            .select("id, slug, studio_id, published")
            .eq("id", createdStudioDraft.id)
            .eq("studio_id", currentStudioContext.id)
            .maybeSingle();

        if (findError) {
            console.error("Error verificando borrador para publicación:", findError);
            const err = new Error("PUBLISH_CHECK_FAILED");
            err.code = "PUBLISH_CHECK_FAILED";
            throw err;
        }
        if (!existing) {
            const err = new Error("DRAFT_NOT_FOUND");
            err.code = "DRAFT_NOT_FOUND";
            throw err;
        }
        if (existing.id !== createdStudioDraft.id) {
            const err = new Error("PUBLISH_CHECK_FAILED");
            err.code = "PUBLISH_CHECK_FAILED";
            throw err;
        }
        if (existing.slug !== createdStudioDraft.slug) {
            const err = new Error("PUBLISH_SLUG_MISMATCH");
            err.code = "PUBLISH_SLUG_MISMATCH";
            throw err;
        }
        if (existing.studio_id !== currentStudioContext.id) {
            const err = new Error("PUBLISH_STUDIO_MISMATCH");
            err.code = "PUBLISH_STUDIO_MISMATCH";
            throw err;
        }
        if (existing.published === true) {
            publishedStudioInvitation = {
                id: String(existing.id),
                slug: String(existing.slug),
                published: true
            };
            publishConfirmationArmed = false;
            const err = new Error("ALREADY_PUBLISHED");
            err.code = "ALREADY_PUBLISHED";
            throw err;
        }
        if (existing.published !== false) {
            const err = new Error("PUBLISH_CHECK_FAILED");
            err.code = "PUBLISH_CHECK_FAILED";
            throw err;
        }

        const { data, error: updateError } = await db
            .from("studio_invitations")
            .update({ published: true })
            .eq("id", createdStudioDraft.id)
            .eq("studio_id", currentStudioContext.id)
            .eq("slug", createdStudioDraft.slug)
            .eq("published", false)
            .select("id, slug, published")
            .single();

        if (updateError) {
            console.error("Error publicando invitación:", updateError);
            const err = new Error("PUBLISH_FAILED");
            err.code = "PUBLISH_FAILED";
            throw err;
        }
        
        if (!data || !data.id || !data.slug || data.published !== true) {
            console.error("Respuesta inesperada al publicar invitación:", data);
            const err = new Error("INVALID_PUBLISH_RESPONSE");
            err.code = "INVALID_PUBLISH_RESPONSE";
            throw err;
        }
        if (data.id !== createdStudioDraft.id || data.slug !== createdStudioDraft.slug) {
            console.error("Inconsistencia en respuesta al publicar:", data);
            const err = new Error("INVALID_PUBLISH_RESPONSE");
            err.code = "INVALID_PUBLISH_RESPONSE";
            throw err;
        }

        publishedStudioInvitation = {
            id: String(data.id),
            slug: String(data.slug),
            published: true
        };
        publishConfirmationArmed = false;

        if (msgEl) {
            msgEl.textContent = `Invitación publicada correctamente.`;
            msgEl.style.color = "var(--success)";
            msgEl.setAttribute("role", "status");
            msgEl.setAttribute("aria-live", "polite");
            
            const a = document.createElement("a");
            a.href = `/invitacion.html?slug=${encodeURIComponent(publishedStudioInvitation.slug)}`;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = "Ver invitación publicada";
            a.style.display = "block";
            a.style.marginTop = "8px";
            a.style.color = "var(--accent)";
            a.style.fontWeight = "500";
            a.style.textDecoration = "none";
            
            const linkDash = document.createElement("a");
            linkDash.href = `/administracion/studio-dashboard.html`;
            linkDash.id = "goToDashboardAfterPublish";
            linkDash.textContent = "Ir al panel de Studio";
            linkDash.style.display = "block";
            linkDash.style.marginTop = "8px";
            linkDash.style.color = "var(--text)";
            linkDash.style.fontWeight = "500";
            linkDash.style.textDecoration = "none";
            
            msgEl.appendChild(document.createElement("br"));
            msgEl.appendChild(a);
            msgEl.appendChild(linkDash);
        }
    } catch (err) {
        console.error("Error en publishStudioInvitation:", err);
        if (msgEl) {
            let uiMsg = "No fue posible publicar la invitación.";
            if (err.code === "DRAFT_NOT_FOUND") {
                uiMsg = "No se encontró el borrador asociado.";
            } else if (err.code === "ALREADY_PUBLISHED") {
                uiMsg = "La invitación ya se encuentra publicada.";
            }
            msgEl.textContent = uiMsg;
            if (err.code === "ALREADY_PUBLISHED") {
                msgEl.style.color = "var(--success)";
                msgEl.setAttribute("role", "status");
                msgEl.setAttribute("aria-live", "polite");
            } else {
                msgEl.style.color = "var(--danger)";
                msgEl.setAttribute("role", "alert");
                msgEl.setAttribute("aria-live", "assertive");
            }
        }
    } finally {
        draftPublishInProgress = false;
        updateDraftCreationButtonState();
        updateDraftUpdateButtonState();
        updateDraftPublishButtonState();
    updateConfigurationBackupButtonState();
    }
}

async function recoverStudioDraftContext() {
    if (draftRecoveryInProgress) return;
    if (!isStudioGeneratorReady()) return;
    if (!requestedDraftId) return;

    draftRecoveryInProgress = true;
    updateDraftCreationButtonState();
    updateDraftUpdateButtonState();
    updateDraftPublishButtonState();
    updateConfigurationBackupButtonState();

    const msgEl = document.getElementById("authStatusMsg");
    if (msgEl) {
        msgEl.textContent = "Recuperando contexto del borrador...";
        msgEl.style.color = "var(--text)";
    }

    try {
        const db = window.studioAuth.db;
        const { data, error } = await db
            .from("studio_invitations")
            .select("id, slug, published")
            .eq("id", requestedDraftId)
            .eq("studio_id", currentStudioContext.id)
            .maybeSingle();

        if (error) {
            console.error("Error recuperando borrador:", error);
            const err = new Error("RECOVERY_CHECK_FAILED");
            err.code = "RECOVERY_CHECK_FAILED";
            throw err;
        }

        if (!data) {
            const err = new Error("RECOVERY_NOT_FOUND");
            err.code = "RECOVERY_NOT_FOUND";
            throw err;
        }

        if (!data.id || !data.slug || typeof data.published !== "boolean") {
            const err = new Error("INVALID_RECOVERY_RESPONSE");
            err.code = "INVALID_RECOVERY_RESPONSE";
            throw err;
        }

        if (String(data.id) !== requestedDraftId) {
            const err = new Error("INVALID_RECOVERY_RESPONSE");
            err.code = "INVALID_RECOVERY_RESPONSE";
            throw err;
        }

        const safeSlug = String(data.slug).trim().slice(0, 160);
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(safeSlug) || safeSlug !== data.slug) {
            const err = new Error("RECOVERY_SLUG_MISMATCH");
            err.code = "RECOVERY_SLUG_MISMATCH";
            throw err;
        }

        recoveredStudioDraft = {
            id: String(data.id),
            slug: safeSlug,
            published: data.published === true
        };

        draftRecoveryReady = true;

        if (msgEl) {
            if (recoveredStudioDraft.published) {
                msgEl.textContent = "Invitación publicada localizada. Carga el archivo JSON correspondiente para verificarla.";
            } else {
                msgEl.textContent = "Borrador localizado. Carga el archivo JSON correspondiente para continuar.";
            }
            msgEl.style.color = "var(--accent)";
        }
    } catch (err) {
        console.error("Error en recoverStudioDraftContext:", err);
        requestedDraftId = null;
        if (msgEl) {
            let uiMsg = "No fue posible recuperar la invitación.";
            if (err.code === "INVALID_RECOVERY_ID") {
                uiMsg = "El enlace de recuperación no es válido.";
            } else if (err.code === "RECOVERY_NOT_FOUND") {
                uiMsg = "No se encontró una invitación asociada a este enlace.";
            }
            msgEl.textContent = uiMsg;
            msgEl.style.color = "var(--danger)";
        }
    } finally {
        draftRecoveryInProgress = false;
        updateDraftCreationButtonState();
        updateDraftUpdateButtonState();
        updateDraftPublishButtonState();
    updateConfigurationBackupButtonState();
    }
}

function isStudioGeneratorReady() {
    return !!(currentStudioSession && currentStudioContext && currentStudioContext.id && studioContextReady);
}

function updateGeneratorActionState() {
    const btnGenerate = document.getElementById("btnGenerate");
    if (btnGenerate) {
        const canGenerate = isStudioGeneratorReady() && !!loadedConfig;
        btnGenerate.disabled = !canGenerate;
    }
}

function enforceStudioReady() {
    if (!isStudioGeneratorReady()) {
        const msgEl = document.getElementById("authStatusMsg");
        if (msgEl) {
            msgEl.textContent = "Error: Acción bloqueada. El generador requiere autenticación activa en Invitta Studio.";
            msgEl.style.color = "var(--danger)";
            msgEl.setAttribute("role", "alert");
            msgEl.setAttribute("aria-live", "assertive");
        }
        return false;
    }
    return true;
}

async function initializeStudioGeneratorContext() {
    const authStatusMsg = document.getElementById("authStatusMsg");
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const btnGenerate = document.getElementById("btnGenerate");
    
    if (dropZone) dropZone.style.pointerEvents = "none";
    if (fileInput) fileInput.disabled = true;
    updateGeneratorActionState();
    
    if (!window.studioAuth) {
        if (authStatusMsg) {
            authStatusMsg.textContent = "Error interno: El módulo de autenticación no está disponible.";
            authStatusMsg.style.color = "var(--danger)";
            authStatusMsg.setAttribute("role", "alert");
            authStatusMsg.setAttribute("aria-live", "assertive");
        }
        return;
    }
    
    const session = await window.studioAuth.requireSession();
    if (!session) return;
    
    currentStudioSession = { user: { id: session.user.id } };
    
    try {
        const db = window.studioAuth.db;
        if (!db) throw new Error("No database client");
        
        const { data: studio, error } = await db
            .from("studios")
            .select("id, name")
            .eq("user_id", session.user.id)
            .single();
            
        if (error) throw error;
        
        if (!studio || !studio.id) {
            if (authStatusMsg) {
                authStatusMsg.textContent = "No se encontró un estudio asociado a esta cuenta.";
                authStatusMsg.style.color = "var(--danger)";
                authStatusMsg.setAttribute("role", "alert");
                authStatusMsg.setAttribute("aria-live", "assertive");
            }
            return;
        }
        
        currentStudioContext = {
            id: String(studio.id),
            name: String(studio.name || "").trim().substring(0, 120)
        };
        studioContextReady = true;
        
        if (authStatusMsg) {
            authStatusMsg.textContent = `Estudio activo: ${currentStudioContext.name}`;
            authStatusMsg.style.color = "var(--success)";
            authStatusMsg.setAttribute("role", "status");
            authStatusMsg.setAttribute("aria-live", "polite");
        }
        
        requestedDraftId = readRequestedDraftId();
        if (requestedDraftId) {
            await recoverStudioDraftContext();
        }
        
        if (dropZone) dropZone.style.pointerEvents = "auto";
        if (fileInput) fileInput.disabled = false;
        
        updateGeneratorActionState();
        
    } catch (err) {
        console.error("Error validando el estudio:", err);
        if (authStatusMsg) {
            authStatusMsg.textContent = "Error al validar la configuración del estudio.";
            authStatusMsg.style.color = "var(--danger)";
            authStatusMsg.setAttribute("role", "alert");
            authStatusMsg.setAttribute("aria-live", "assertive");
        }
        updateGeneratorActionState();
    }
}

document.addEventListener("DOMContentLoaded", initializeStudioGeneratorContext);

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

function inspectConfigurationComplexity(value) {
    let depthCount = 0;
    let nodeCount = 0;
    let tooDeep = false;
    let tooManyNodes = false;

    function traverse(obj, currentDepth) {
        if (tooDeep || tooManyNodes) return;
        if (currentDepth > 20) {
            tooDeep = true;
            return;
        }
        if (obj && typeof obj === "object") {
            const keys = Object.keys(obj);
            nodeCount += keys.length;
            if (nodeCount > 5000) {
                tooManyNodes = true;
                return;
            }
            for (let i = 0; i < keys.length; i++) {
                traverse(obj[keys[i]], currentDepth + 1);
            }
        }
    }
    traverse(value, 1);
    return { tooDeep, tooManyNodes };
}

function containsDangerousConfigurationKeys(value) {
    if (!value || typeof value !== "object") return false;
    let dangerous = false;
    function traverse(obj) {
        if (dangerous) return;
        if (obj && typeof obj === "object") {
            const keys = Object.keys(obj);
            if (keys.includes("__proto__") || keys.includes("prototype") || keys.includes("constructor")) {
                dangerous = true;
                return;
            }
            for (let i = 0; i < keys.length; i++) {
                traverse(obj[keys[i]]);
            }
        }
    }
    traverse(value);
    return dangerous;
}

function validateLoadedConfigurationStructure(data) {
    const result = { errors: [], warnings: [] };
    
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        result.errors.push("data no es objeto plano.");
        return result;
    }
    
    if (!data.meta || typeof data.meta !== "object" || Array.isArray(data.meta)) {
        result.errors.push("falta meta o no es objeto.");
    }
    if (!data.template || typeof data.template !== "object" || Array.isArray(data.template)) {
        result.errors.push("falta template o no es objeto.");
    } else {
        const tid = String(data.template.id || "").trim();
        const tname = String(data.template.name || "").trim();
        if (!tid && !tname) result.errors.push("template.id y template.name están ambos ausentes o vacíos.");
        if ("id" in data.template && typeof data.template.id !== "string") result.errors.push("template.id existe y no es string.");
        if ("name" in data.template && typeof data.template.name !== "string") result.errors.push("template.name existe y no es string.");
        if (!("level" in data.template)) result.warnings.push("template.level no existe.");
    }
    
    if (!data.event || typeof data.event !== "object" || Array.isArray(data.event)) {
        result.errors.push("falta event o no es objeto.");
    } else {
        if (typeof data.event.primaryName !== "string") {
            result.errors.push("event.primaryName no es string.");
        } else {
            const pname = data.event.primaryName.trim();
            if (pname === "") result.errors.push("event.primaryName vacío después de trim.");
            if (pname.length > 200) result.errors.push("event.primaryName supera 200 caracteres.");
        }
        if ("type" in data.event) {
            if (typeof data.event.type !== "string") result.errors.push("event.type existe y no es string.");
            else if (data.event.type.length > 100) result.errors.push("event.type supera 100 caracteres.");
        }
        if (!("secondaryName" in data.event)) result.warnings.push("event.secondaryName no existe.");
        if (!("dateText" in data.event)) result.warnings.push("event.dateText no existe.");
    }
    
    if (!data.visual || typeof data.visual !== "object" || Array.isArray(data.visual)) {
        result.errors.push("falta visual o no es objeto.");
    } else {
        if ("palette" in data.visual && typeof data.visual.palette !== "string") result.errors.push("visual.palette existe y no es string.");
        if ("typography" in data.visual && typeof data.visual.typography !== "string") result.errors.push("visual.typography existe y no es string.");
        
        if (!("typography" in data.visual)) result.warnings.push("visual.typography no existe.");
        if (!("handwritten" in data.visual)) result.warnings.push("visual.handwritten no existe.");
    }
    
    return result;
}

function clearLoadedConfigurationUI(options = {}) {
    const showUploadCard = options.showUploadCard !== false;
    
    loadedConfig = null;
    const grid = document.getElementById("summaryGrid");
    if (grid) grid.replaceChildren();
    
    const summaryCard = document.getElementById("summaryCard");
    if (summaryCard) summaryCard.style.display = "none";
    
    const generateCard = document.getElementById("generateCard");
    if (generateCard) generateCard.style.display = "none";
    
    const resultCard = document.getElementById("resultCard");
    if (resultCard) resultCard.style.display = "none";
    
    const errorEl = document.getElementById("errorMsg");
    if (errorEl) {
        errorEl.textContent = "";
        errorEl.style.display = "none";
    }
    
    const warningEl = document.getElementById("warningMsg");
    if (warningEl) {
        warningEl.textContent = "";
        warningEl.style.display = "none";
    }
    
    const uploadCard = document.getElementById("uploadCard");
    if (uploadCard) {
        uploadCard.style.display = showUploadCard ? "block" : "none";
    }
    
    if (showUploadCard) {
        const fileInput = document.getElementById("fileInput");
        if (fileInput) fileInput.value = "";
    }
    
    updateGeneratorActionState();
    updateConfigurationBackupButtonState();
}

function createSafeSummaryValue(value, maxLength = 160) {
    if (value === null || value === undefined || typeof value === "object" || typeof value === "function") {
        return "—";
    }
    const type = typeof value;
    if (type !== "string" && type !== "number" && type !== "boolean") {
        return "—";
    }
    const str = String(value).trim();
    if (str === "") return "—";
    if (str.length > maxLength) return str.substring(0, maxLength);
    return str;
}

function createSummaryItem(label, value) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "sum-item";
    
    const labelDiv = document.createElement("div");
    labelDiv.className = "sum-label";
    labelDiv.textContent = label;
    
    const valueDiv = document.createElement("div");
    valueDiv.className = "sum-value";
    valueDiv.textContent = value;
    
    itemDiv.appendChild(labelDiv);
    itemDiv.appendChild(valueDiv);
    
    return itemDiv;
}

function showErrorAndClear(msg) {
    clearLoadedConfigurationUI();
    const el = document.getElementById("errorMsg");
    if (el) {
        el.textContent = msg;
        el.style.display = "block";
    }
}

function createWorkingConfiguration(parsedData) {
    if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
        throw new Error("Configuración no es un objeto válido");
    }
    const workingCopy = JSON.parse(JSON.stringify(parsedData));
    delete workingCopy._backup;
    return workingCopy;
}

function handleFile(file) {
    if (!enforceStudioReady()) return;
    
    if (!/\.json$/i.test(file.name)) {
        showErrorAndClear("Selecciona un archivo .json válido.");
        return;
    }
    
    const allowedMime = ["application/json", "text/json", "text/plain", ""];
    if (!allowedMime.includes(file.type)) {
        showErrorAndClear("El archivo seleccionado no tiene un formato compatible.");
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        showErrorAndClear("El archivo de configuración supera el tamaño permitido.");
        return;
    }
    
    const reader = new FileReader();
    reader.onerror = () => {
        showErrorAndClear("No fue posible leer el archivo seleccionado.");
    };
    reader.onload = (e) => {
        let data;
        try {
            data = JSON.parse(e.target.result);
        } catch {
            showErrorAndClear("Error al parsear el archivo JSON. Verifica que el archivo no esté corrupto.");
            return;
        }
        
        const complexity = inspectConfigurationComplexity(data);
        if (complexity.tooDeep) {
            showErrorAndClear("La configuración contiene una estructura demasiado profunda.");
            return;
        }
        if (complexity.tooManyNodes) {
            showErrorAndClear("La configuración contiene demasiados elementos.");
            return;
        }
        
        if (containsDangerousConfigurationKeys(data)) {
            showErrorAndClear("La configuración contiene propiedades no permitidas.");
            return;
        }
        
        const structuralValidation = validateLoadedConfigurationStructure(data);
        if (structuralValidation.errors.length > 0) {
            console.error("Errores estructurales:", structuralValidation.errors);
            showErrorAndClear("El archivo no parece ser una configuración Invitta válida.");
            return;
        }
        
        try {
            const workingConfig = createWorkingConfiguration(data);
            clearLoadedConfigurationUI({ showUploadCard: false });
            loadedConfig = workingConfig;
            
            if (structuralValidation.warnings.length > 0) {
                let warningEl = document.getElementById("warningMsg");
                if (!warningEl) {
                    warningEl = document.createElement("div");
                    warningEl.id = "warningMsg";
                    warningEl.style.color = "#f0ad4e";
                    warningEl.style.marginTop = "10px";
                    warningEl.style.marginBottom = "10px";
                    const sumCard = document.getElementById("summaryCard");
                    if (sumCard) sumCard.insertBefore(warningEl, document.getElementById("summaryGrid"));
                }
                warningEl.textContent = "La configuración se cargó con advertencias: " + structuralValidation.warnings.join(" | ");
                warningEl.style.display = "block";
            }
            
            renderSummary(workingConfig);
            updateGeneratorActionState();
            updateConfigurationBackupButtonState();
        } catch (err) {
            console.error("Error al procesar configuración:", err);
            showErrorAndClear("Error al procesar la configuración.");
        }
    };
    reader.readAsText(file);
}

function showError(msg) {
    showErrorAndClear(msg);
}

function renderSummary(data) {
    document.getElementById("uploadCard").style.display = "none";

    const items = [
        { label: "Nombre principal",  value: createSafeSummaryValue(data.event.primaryName, 160) },
        { label: "Nombre secundario", value: createSafeSummaryValue(data.event.secondaryName, 160) },
        { label: "Tipo de evento",    value: createSafeSummaryValue(data.event.type, 80) },
        { label: "Paquete",           value: createSafeSummaryValue(data.event.packageLevel, 80) },
        { label: "Plantilla",         value: createSafeSummaryValue(data.template.name || data.template.id, 120) },
        { label: "Nivel",             value: createSafeSummaryValue(data.template.level, 80) },
        { label: "Paleta",            value: createSafeSummaryValue(data.visual.palette, 80) },
        { label: "Tipografía",        value: createSafeSummaryValue(data.visual.typography, 120) },
        { label: "Handwritten",       value: createSafeSummaryValue(data.visual.handwritten, 120) },
        { label: "Fecha",             value: createSafeSummaryValue(data.event.dateText, 120) },
        { label: "Generado el",       value: createSafeSummaryValue(new Date().toLocaleDateString("es-MX", { dateStyle: "long" }), 80) }
    ];

    const grid = document.getElementById("summaryGrid");
    grid.replaceChildren();
    
    for (let i = 0; i < items.length; i++) {
        grid.appendChild(createSummaryItem(items[i].label, items[i].value));
    }

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
      let lastFocusedElement = null;
      
      const images = Array.from(galleryItems).map(btn => ({
         src: btn.querySelector('img').src,
         alt: btn.querySelector('img').alt
      }));
      
      if(images.length <= 1) {
         lbPrev.style.display = 'none';
         lbNext.style.display = 'none';
      }
      
      function getFocusableElements() {
          return Array.from(lightbox.querySelectorAll('button')).filter(b => b.style.display !== 'none');
      }
      
      function openLightbox(index) {
         if (lightbox.hidden) {
             lastFocusedElement = document.activeElement;
         }
         currentIndex = index;
         lbImage.src = images[currentIndex].src;
         lbImage.alt = images[currentIndex].alt;
         lightbox.hidden = false;
         document.body.style.overflow = 'hidden';
         lbClose.focus();
      }
      
      function closeLightbox() {
         lightbox.hidden = true;
         document.body.style.overflow = '';
         lbImage.src = '';
         if(lastFocusedElement) {
             lastFocusedElement.focus();
             lastFocusedElement = null;
         }
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
            if(e.key === 'Escape') {
                closeLightbox();
                return;
            }
            if(e.key === 'ArrowRight' && images.length > 1) {
                showNext();
                return;
            }
            if(e.key === 'ArrowLeft' && images.length > 1) {
                showPrev();
                return;
            }
            if(e.key === 'Tab') {
                const focusable = getFocusableElements();
                if(focusable.length === 0) {
                    e.preventDefault();
                    return;
                }
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                
                if(e.shiftKey) {
                    if(document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if(document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
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
function createSafePublicationSlug(data) {
    function normalize(str) {
        if (!str || typeof str !== "string") return "";
        let s = str.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
            .replace(/[^a-z0-9-]/g, "-") 
            .replace(/-+/g, "-") 
            .replace(/^-+|-+$/g, ""); 
            
        s = s.substring(0, 80);
        s = s.replace(/^-+|-+$/g, "");
        return s;
    }

    let slug = "";
    
    if (data.meta && data.meta.slug) {
        let metaSlug = normalize(data.meta.slug);
        if (metaSlug.length > 0 && /[a-z0-9]/.test(metaSlug)) {
            slug = metaSlug;
        }
    }
    
    if (!slug && data.event) {
        const pNameStr = data.event.primaryName || "";
        const sNameStr = data.event.secondaryName || "";
        const type = data.event.type === "boda" ? "boda" : "xv";
        
        let pName = normalize(pNameStr);
        let sName = normalize(sNameStr);
        
        const pValid = pName.length > 0 && /[a-z0-9]/.test(pName);
        const sValid = sName.length > 0 && /[a-z0-9]/.test(sName);
        
        if (pValid) {
            let raw = "";
            if (type === "boda") {
                if (sValid) {
                    raw = `${pName}-y-${sName}-boda`;
                } else {
                    raw = `${pName}-boda`;
                }
            } else {
                raw = `${pName}-xv`;
            }
            slug = normalize(raw);
        }
    }
    
    if (!slug) {
        slug = "evento-invitta";
    }
    
    const reserved = ["admin", "administracion", "api", "assets", "dashboard", "login", "checkin", "host", "index", "invitacion", "invitacion-final", "recursos", "supabase", "null", "undefined"];
    
    if (reserved.includes(slug)) {
        slug += "-evento";
        slug = normalize(slug);
        if (!slug) slug = "evento-invitta";
    }
    
    return slug;
}

function buildPublicationManifest(data, media, studio, slug) {
    return {
        schemaVersion: "1.0",
        generatedBy: "Invitta",
        generatedAt: new Date().toISOString(),
        slug: slug,
        htmlFilename: `${slug}.html`,
        event: {
            type: data.event?.type || "",
            primaryName: data.event?.primaryName || "",
            secondaryName: data.event?.secondaryName || "",
            dateText: data.event?.dateText || ""
        },
        template: {
            id: data.template?.id || "",
            name: data.template?.name || "",
            level: data.template?.level || ""
        },
        media: {
            hasHeroImage: !!(media && media.heroImage),
            galleryCount: (media && media.gallery) ? media.gallery.length : 0,
            hasMusic: !!(media && media.music),
            hasStudioLogo: !!(media && media.studioLogo)
        },
        studio: {
            name: studio?.name || "",
            hasWhatsapp: !!(studio && studio.whatsapp),
            hasWebsite: !!(studio && studio.website)
        }
    };
}

function downloadPublicationManifest() {
    if (!enforceStudioReady()) return;
    if (!currentPublicationManifest || !currentPublicationSlug) {
        const msgEl = document.getElementById("previewStatusMsg");
        if (msgEl) {
            msgEl.textContent = "Error: El manifiesto no está disponible para descargar.";
            msgEl.style.display = "block";
            msgEl.style.color = "#d9534f";
        }
        return;
    }
    
    const blob = new Blob([JSON.stringify(currentPublicationManifest, null, 2)], { type: "application/json;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `invitta-publicacion-${currentPublicationSlug}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function normalizeISODate(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    const date = new Date(`${trimmed}T00:00:00Z`);
    if (isNaN(date.getTime())) return null;
    const parts = trimmed.split("-").map(Number);
    if (date.getUTCFullYear() !== parts[0] || (date.getUTCMonth() + 1) !== parts[1] || date.getUTCDate() !== parts[2]) return null;
    return trimmed;
}

function normalizeTime(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) return null;
    const parts = trimmed.split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parts[2] ? parseInt(parts[2], 10) : 0;
    if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;
    return trimmed;
}

function buildStudioInvitationPayload(data, media, studio, slug) {
    const isBoda = data.event?.type === "boda";
    const pName = data.event?.primaryName || "";
    const sName = data.event?.secondaryName || "";
    
    let honoree_name = pName;
    if (isBoda && sName) {
        honoree_name = `${pName} & ${sName}`;
    }
    
    let title = data.meta?.title || "";
    if (!title) {
        title = isBoda ? `Boda de ${honoree_name}` : `XV Años de ${honoree_name}`;
    }
    
    let godparents = [];
    if (Array.isArray(data.family?.godparents)) {
        godparents = data.family.godparents
            .filter(g => g && g.name && typeof g.name === 'string' && g.name.trim() !== '')
            .map(g => ({
                role: String(g.role || ""),
                name: String(g.name)
            }))
            .slice(0, 20);
    }
    
    function safeHex(val) {
        if (typeof val === 'string' && /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(val)) {
            return val;
        }
        return "";
    }
    
    let gallery_urls = [];
    if (media.gallery && Array.isArray(media.gallery)) {
        gallery_urls = media.gallery
            .map(g => g.url)
            .filter(url => safeHttpsUrl(url))
            .slice(0, 10);
    }
    
    let itinerary = [];
    if (Array.isArray(data.itinerary)) {
        itinerary = data.itinerary
            .filter(i => i && i.title)
            .map(i => ({
                time: String(i.time || ""),
                title: String(i.title).replace(/<[^>]*>?/gm, '')
            }))
            .slice(0, 30);
    }
    
    return {
        title: title,
        slug: slug,
        event_type: isBoda ? "boda" : "xv",
        honoree_name: honoree_name,
        event_date: normalizeISODate(data.event?.date),
        event_time: normalizeTime(data.event?.time),
        welcome_text: data.event?.welcomeText || data.event?.quote || "",
        father_name: data.family?.father || null,
        mother_name: data.family?.mother || null,
        instagram_hashtag: data.event?.hashtag || null,
        thank_you_title: data.event?.thankYouTitle || "",
        thank_you_message: data.event?.thankYouMessage || "",
        thank_you_signature: data.event?.thankYouSignature || null,
        hashtag_section_title: data.event?.hashtagTitle || "",
        hashtag_section_message: data.event?.hashtagMessage || "",
        godparents: godparents,
        font_preset: data.visual?.typography || "",
        visual_theme: data.visual?.palette || "",
        color_primary: safeHex(data.visual?.customPalette?.accent),
        color_secondary: safeHex(data.visual?.customPalette?.bg),
        ceremony_name: data.locations?.ceremony?.name || "",
        ceremony_address: data.locations?.ceremony?.address || "",
        ceremony_map_url: safeHttpsUrl(data.locations?.ceremony?.mapUrl) || "",
        reception_name: data.locations?.reception?.name || "",
        reception_address: data.locations?.reception?.address || "",
        reception_map_url: safeHttpsUrl(data.locations?.reception?.mapUrl) || "",
        gift_table_url: safeHttpsUrl(data.registry?.url) || "",
        dress_code: data.dressCode?.text || "",
        whatsapp_number: data.rsvp?.whatsapp || "",
        published: false,
        studio_name: studio.name || "",
        studio_logo_url: media.studioLogo || "",
        music_player_brand_enabled: false,
        studio_whatsapp: studio.whatsapp || "",
        studio_cta_enabled: !!(studio.whatsapp),
        studio_cta_text: "",
        studio_cta_message: "",
        link_builder_enabled: false,
        link_builder_pin: "",
        link_builder_title: "",
        link_builder_message: "",
        gallery_urls: gallery_urls,
        itinerary: itinerary,
        background_image_url: "",
        music_title: media.music?.title || null,
        music_artist: null,
        template_id: data.template?.id || null,
        main_photo_url: media.heroImage || "",
        music_url: media.music?.url || ""
    };
}

function validateStudioInvitationPayload(payload) {
    const errors = [];
    const warnings = [];
    
    if (!payload.slug) errors.push("Falta el slug.");
    if (payload.slug !== currentPublicationSlug) errors.push("El slug no coincide con la publicación actual.");
    if (payload.event_type !== "xv" && payload.event_type !== "boda") errors.push("Tipo de evento inválido.");
    if (!payload.honoree_name) errors.push("Falta el nombre del festejado.");
    if (payload.published !== false) errors.push("El payload no puede estar marcado como publicado.");
    if (Array.isArray(payload.gallery_urls) && payload.gallery_urls.length > 10) errors.push("La galería excede 10 elementos.");
    
    if (payload.event_date !== null && normalizeISODate(payload.event_date) === null) {
        errors.push("event_date debe ser una fecha ISO válida (YYYY-MM-DD) o null.");
    }
    if (payload.event_time !== null && normalizeTime(payload.event_time) === null) {
        errors.push("event_time debe ser una hora válida (HH:MM o HH:MM:SS) o null.");
    }
    
    const mediaKeys = ['main_photo_url', 'music_url', 'studio_logo_url', 'ceremony_map_url', 'reception_map_url', 'gift_table_url'];
    mediaKeys.forEach(k => {
        if (payload[k] && !safeHttpsUrl(payload[k])) {
            errors.push(`URL no segura detectada en ${k}.`);
        }
    });
    
    if (payload.gallery_urls) {
        payload.gallery_urls.forEach(url => {
            if (url && !safeHttpsUrl(url)) errors.push("URL no segura detectada en la galería.");
        });
    }
    
    const forbidden = ['studio_id', 'user_id', 'id', 'token', 'access_token', 'refresh_token', 'finalHTML'];
    forbidden.forEach(k => {
        if (k in payload) errors.push(`Campo prohibido detectado: ${k}.`);
    });
    
    if (!payload.main_photo_url) warnings.push("Sin portada.");
    if (!payload.gallery_urls || payload.gallery_urls.length === 0) warnings.push("Sin galería.");
    if (!payload.music_url) warnings.push("Sin música.");
    if (!payload.ceremony_name) warnings.push("Sin ceremonia.");
    if (!payload.reception_name) warnings.push("Sin recepción.");
    if (!payload.studio_name) warnings.push("Sin nombre de estudio.");
    if (!payload.template_id) warnings.push("Sin template_id.");
    
    return { errors, warnings };
}

function downloadStudioInvitationPayload() {
    if (!enforceStudioReady()) return;
    if (!currentStudioPayload || !currentPublicationSlug) {
        const msgEl = document.getElementById("previewStatusMsg");
        if (msgEl) {
            msgEl.textContent = "Error: El payload de Studio no está disponible para descargar.";
            msgEl.style.display = "block";
            msgEl.style.color = "#d9534f";
        }
        return;
    }
    
    const blob = new Blob([JSON.stringify(currentStudioPayload, null, 2)], { type: "application/json;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `invitta-studio-payload-${currentPublicationSlug}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function validateInvitationForPreview(data, media, studio) {
    const errors = [];
    const warnings = [];

    if (!data.event) errors.push("Faltan los datos del evento.");
    else if (!data.event.primaryName) errors.push("Falta el nombre principal del evento.");

    if (!data.template) errors.push("Faltan los datos de la plantilla.");
    else if (!data.template.id) errors.push("Falta el identificador de la plantilla (template.id).");

    if (!data.visual) errors.push("Faltan los datos visuales.");
    if (!finalHTML) errors.push("No se pudo generar el HTML final.");

    if (!media.heroImage) warnings.push("Falta imagen de portada.");
    if (!media.gallery || media.gallery.length === 0) warnings.push("Falta galería de fotografías.");
    if (!media.music) warnings.push("Falta música de fondo.");
    if (!media.studioLogo) warnings.push("Falta logotipo del estudio.");
    
    if (!studio.name) warnings.push("Falta nombre del estudio.");
    if (!studio.whatsapp) warnings.push("Falta WhatsApp del estudio.");

    return { errors, warnings };
}

function openPreview() {
    if (!enforceStudioReady()) return;
    if (!finalHTML) return;
    
    if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        previewBlobUrl = null;
    }
    
    const blob = new Blob([finalHTML], { type: "text/html;charset=utf-8" });
    previewBlobUrl = URL.createObjectURL(blob);
    const currentUrl = previewBlobUrl;
    
    const newWindow = window.open(currentUrl, "_blank");
    const statusMsg = document.getElementById("previewStatusMsg");
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
        URL.revokeObjectURL(currentUrl);
        if (previewBlobUrl === currentUrl) previewBlobUrl = null;
        
        if (statusMsg) {
            statusMsg.textContent = "El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes e inténtalo de nuevo.";
            statusMsg.style.display = "block";
            statusMsg.style.color = "#d9534f";
        }
        return;
    } 
    
    if (statusMsg) {
        statusMsg.style.display = "none";
    }
    
    setTimeout(() => {
        URL.revokeObjectURL(currentUrl);
        if (previewBlobUrl === currentUrl) {
            previewBlobUrl = null;
        }
    }, 45000);
}

function generateInvitation() {
    if (!enforceStudioReady()) return;
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

    currentPublicationSlug = createSafePublicationSlug(d);
    currentPublicationManifest = buildPublicationManifest(d, media, studio, currentPublicationSlug);
    currentStudioPayload = buildStudioInvitationPayload(d, media, studio, currentPublicationSlug);

    const msgEl = document.getElementById("authStatusMsg");

    if (draftRecoveryReady && recoveredStudioDraft) {
        if (currentPublicationSlug === recoveredStudioDraft.slug && currentStudioPayload.slug === recoveredStudioDraft.slug) {
            if (recoveredStudioDraft.published === false) {
                // Caso A
                createdStudioDraft = {
                    id: recoveredStudioDraft.id,
                    slug: recoveredStudioDraft.slug
                };
                publishedStudioInvitation = null;
                lastSavedDraftPayloadFingerprint = createDraftPayloadFingerprint(buildDraftInsertPayload());
                draftPayloadDirty = false;
                if (msgEl) {
                    msgEl.textContent = "Borrador recuperado correctamente. Puedes actualizarlo o publicarlo.";
                    msgEl.style.color = "var(--success)";
                }
            } else {
                // Caso B
                createdStudioDraft = {
                    id: recoveredStudioDraft.id,
                    slug: recoveredStudioDraft.slug
                };
                publishedStudioInvitation = {
                    id: recoveredStudioDraft.id,
                    slug: recoveredStudioDraft.slug,
                    published: true
                };
                lastSavedDraftPayloadFingerprint = null;
                draftPayloadDirty = false;
                if (msgEl) {
                    msgEl.textContent = "Esta invitación ya está publicada. Para modificarla utiliza el editor de Studio.";
                    msgEl.style.color = "var(--success)";
                }
            }
        } else {
            // Caso C
            createdStudioDraft = null;
            publishedStudioInvitation = null;
            if (msgEl) {
                msgEl.textContent = "El archivo cargado no corresponde a la invitación recuperada.";
                msgEl.style.color = "var(--danger)";
            }
        }
    } else {
        if (publishedStudioInvitation) {
            if (currentPublicationSlug !== publishedStudioInvitation.slug) {
                createdStudioDraft = null;
                publishedStudioInvitation = null;
                lastSavedDraftPayloadFingerprint = null;
                draftPayloadDirty = false;
                publishConfirmationArmed = false;
            } else {
                draftPayloadDirty = false;
            }
        } else if (createdStudioDraft) {
            if (currentPublicationSlug !== createdStudioDraft.slug) {
                createdStudioDraft = null;
                lastSavedDraftPayloadFingerprint = null;
                draftPayloadDirty = false;
                publishConfirmationArmed = false;
            } else {
                const currentFingerprint = createDraftPayloadFingerprint(buildDraftInsertPayload());
                draftPayloadDirty = (currentFingerprint !== lastSavedDraftPayloadFingerprint);
            }
        } else {
            draftPayloadDirty = false;
        }
    }

    // Validate
    const validation = validateInvitationForPreview(d, media, studio);
    const studioValidation = validateStudioInvitationPayload(currentStudioPayload);

    // Show result
    document.getElementById("generateCard").style.display = "none";
    const resultCard = document.getElementById("resultCard");
    resultCard.style.display = "block";

    const successMsg = document.getElementById("successMsg");
    successMsg.textContent = `✅ Invitación generada (${(finalHTML.length / 1024).toFixed(1)} KB) — Layout: ${design.layout}`;
    successMsg.style.display = "block";

    document.getElementById("codePreview").textContent =
        finalHTML.split("\n").slice(0, 80).join("\n") + "\n\n... (archivo completo disponible al descargar)";

    let controlsContainer = document.getElementById("previewControlsContainer");
    if (!controlsContainer) {
        controlsContainer = document.createElement("div");
        controlsContainer.id = "previewControlsContainer";
        controlsContainer.style.marginTop = "20px";
        resultCard.appendChild(controlsContainer);
    }
    
    controlsContainer.textContent = ""; 
    
    if (validation.errors.length > 0) {
        const errDiv = document.createElement("div");
        errDiv.style.color = "#d9534f";
        errDiv.style.marginBottom = "10px";
        errDiv.textContent = "Errores bloqueantes: " + validation.errors.join(" | ");
        controlsContainer.appendChild(errDiv);
    } else {
        if (validation.warnings.length > 0) {
            const warnDiv = document.createElement("div");
            warnDiv.style.color = "#f0ad4e";
            warnDiv.style.marginBottom = "10px";
            warnDiv.textContent = "Advertencias: " + validation.warnings.join(" | ");
            controlsContainer.appendChild(warnDiv);
        }
        
        const previewBtn = document.createElement("button");
        previewBtn.type = "button";
        previewBtn.id = "btnPreviewInvitation";
        previewBtn.className = "btn";
        previewBtn.style.marginTop = "10px";
        previewBtn.textContent = "Vista previa completa";
        previewBtn.ariaLabel = "Abrir vista previa completa en una nueva pestaña";
        previewBtn.addEventListener("click", openPreview);
        
        const downloadManifestBtn = document.createElement("button");
        downloadManifestBtn.type = "button";
        downloadManifestBtn.id = "btnDownloadManifest";
        downloadManifestBtn.className = "btn";
        downloadManifestBtn.style.marginTop = "10px";
        downloadManifestBtn.style.marginLeft = "10px";
        downloadManifestBtn.textContent = "Descargar manifiesto";
        downloadManifestBtn.ariaLabel = "Descargar el manifiesto de publicación del evento";
        downloadManifestBtn.addEventListener("click", downloadPublicationManifest);
        
        const downloadConfigBackupBtn = document.createElement("button");
        downloadConfigBackupBtn.type = "button";
        downloadConfigBackupBtn.id = "btnDownloadConfigurationBackup";
        downloadConfigBackupBtn.className = "btn";
        downloadConfigBackupBtn.style.marginTop = "10px";
        downloadConfigBackupBtn.style.marginLeft = "10px";
        downloadConfigBackupBtn.textContent = "Descargar respaldo de configuración";
        downloadConfigBackupBtn.ariaLabel = "Descargar respaldo de la configuración de esta invitación";
        downloadConfigBackupBtn.addEventListener("click", downloadConfigurationBackup);
        
        const statusMsg = document.createElement("div");
        statusMsg.id = "previewStatusMsg";
        statusMsg.style.marginTop = "10px";
        statusMsg.style.fontSize = "0.9rem";
        statusMsg.style.display = "none";
        
        const configBackupStatusMsg = document.createElement("div");
        configBackupStatusMsg.id = "configurationBackupStatusMsg";
        configBackupStatusMsg.style.marginTop = "10px";
        configBackupStatusMsg.style.fontSize = "0.9rem";
        configBackupStatusMsg.style.display = "none";
        
        controlsContainer.appendChild(previewBtn);
        controlsContainer.appendChild(downloadManifestBtn);
        controlsContainer.appendChild(downloadConfigBackupBtn);
        
        updateConfigurationBackupButtonState();
        
        if (studioValidation.errors.length > 0) {
            const stuErrDiv = document.createElement("div");
            stuErrDiv.style.color = "#d9534f";
            stuErrDiv.style.marginTop = "10px";
            stuErrDiv.textContent = `Errores Studio (${studioValidation.errors.length}): ` + studioValidation.errors.join(" | ");
            controlsContainer.appendChild(stuErrDiv);
        } else {
            const downloadStudioBtn = document.createElement("button");
            downloadStudioBtn.type = "button";
            downloadStudioBtn.id = "btnDownloadStudioPayload";
            downloadStudioBtn.className = "btn";
            downloadStudioBtn.style.marginTop = "10px";
            downloadStudioBtn.style.marginLeft = "10px";
            downloadStudioBtn.textContent = "Descargar payload Studio";
            downloadStudioBtn.ariaLabel = "Descargar el payload de Invitta Studio";
            downloadStudioBtn.addEventListener("click", downloadStudioInvitationPayload);
            controlsContainer.appendChild(downloadStudioBtn);
            
            if (isStudioGeneratorReady() && currentStudioPayload) {
                if (publishedStudioInvitation) {
                    const msgEl = document.createElement("div");
                    msgEl.style.marginTop = "10px";
                    msgEl.style.color = "var(--success)";
                    msgEl.textContent = "Esta invitación ya fue publicada. Para modificarla utiliza el editor de Studio.";
                    
                    const aPublic = document.createElement("a");
                    aPublic.href = `/invitacion.html?slug=${encodeURIComponent(publishedStudioInvitation.slug)}`;
                    aPublic.target = "_blank";
                    aPublic.rel = "noopener noreferrer";
                    aPublic.textContent = "Ver invitación publicada";
                    aPublic.style.display = "block";
                    aPublic.style.marginTop = "8px";
                    aPublic.style.color = "var(--accent)";
                    aPublic.style.fontWeight = "500";
                    aPublic.style.textDecoration = "none";

                    const linkDash = document.createElement("a");
                    linkDash.href = `/administracion/studio-dashboard.html`;
                    linkDash.textContent = "Ir al panel de Studio";
                    linkDash.style.display = "block";
                    linkDash.style.marginTop = "8px";
                    linkDash.style.color = "var(--text)";
                    linkDash.style.fontWeight = "500";
                    linkDash.style.textDecoration = "none";
                    
                    msgEl.appendChild(document.createElement("br"));
                    msgEl.appendChild(aPublic);
                    msgEl.appendChild(linkDash);
                    
                    controlsContainer.appendChild(msgEl);
                } else {
                    const btnDraft = document.createElement("button");
                    btnDraft.type = "button";
                    btnDraft.id = "btnCreateStudioDraft";
                    btnDraft.className = "btn";
                    btnDraft.style.marginTop = "10px";
                    btnDraft.style.marginLeft = "10px";
                    btnDraft.textContent = "Crear borrador en Invitta Studio";
                    btnDraft.ariaLabel = "Crear borrador de la invitación en Invitta Studio";
                    btnDraft.addEventListener("click", createStudioInvitationDraft);
                    controlsContainer.appendChild(btnDraft);
                    
                    const btnUpdate = document.createElement("button");
                    btnUpdate.type = "button";
                    btnUpdate.id = "btnUpdateStudioDraft";
                    btnUpdate.className = "btn";
                    btnUpdate.style.marginTop = "10px";
                    btnUpdate.style.marginLeft = "10px";
                    btnUpdate.textContent = "Actualizar borrador en Invitta Studio";
                    btnUpdate.ariaLabel = "Actualizar el borrador de la invitación en Invitta Studio";
                    btnUpdate.addEventListener("click", updateStudioInvitationDraft);
                    controlsContainer.appendChild(btnUpdate);

                    const btnPublish = document.createElement("button");
                    btnPublish.type = "button";
                    btnPublish.id = "btnPublishStudioInvitation";
                    btnPublish.className = "btn";
                    btnPublish.style.marginTop = "10px";
                    btnPublish.style.marginLeft = "10px";
                    btnPublish.textContent = "Publicar invitación";
                    btnPublish.ariaLabel = "Publicar invitación de Invitta Studio";
                    btnPublish.addEventListener("click", preparePublishConfirmation);
                    controlsContainer.appendChild(btnPublish);
                    
                    const draftStatus = document.createElement("div");
                    draftStatus.id = "studioDraftStatusMsg";
                    draftStatus.style.marginTop = "10px";
                    draftStatus.style.fontSize = "0.9rem";
                    controlsContainer.appendChild(draftStatus);
                    
                    const publishStatus = document.createElement("div");
                    publishStatus.id = "studioPublishStatusMsg";
                    publishStatus.style.marginTop = "10px";
                    publishStatus.style.fontSize = "0.9rem";
                    controlsContainer.appendChild(publishStatus);

                    const confirmPanel = document.createElement("div");
                    confirmPanel.id = "publishConfirmationPanel";
                    confirmPanel.style.display = "none";
                    confirmPanel.style.marginTop = "15px";
                    confirmPanel.style.padding = "15px";
                    confirmPanel.style.border = "1px solid var(--border)";
                    confirmPanel.style.borderRadius = "8px";
                    confirmPanel.style.backgroundColor = "var(--bg-secondary)";
                    
                    const confirmText = document.createElement("p");
                    confirmText.style.margin = "0 0 10px 0";
                    confirmText.style.fontSize = "0.95rem";
                    confirmText.textContent = "Al publicar, la invitación quedará disponible mediante su enlace público. Verifica que la información y las fotografías sean correctas.";
                    confirmPanel.appendChild(confirmText);
                    
                    const btnGroup = document.createElement("div");
                    btnGroup.setAttribute("role", "group");
                    btnGroup.setAttribute("aria-label", "Confirmación de publicación");
                    
                    const btnConfirm = document.createElement("button");
                    btnConfirm.type = "button";
                    btnConfirm.id = "btnConfirmPublishStudioInvitation";
                    btnConfirm.className = "btn";
                    btnConfirm.textContent = "Sí, publicar invitación";
                    btnConfirm.addEventListener("click", publishStudioInvitation);
                    
                    const btnCancel = document.createElement("button");
                    btnCancel.type = "button";
                    btnCancel.id = "btnCancelPublishStudioInvitation";
                    btnCancel.className = "btn";
                    btnCancel.style.marginLeft = "10px";
                    btnCancel.textContent = "Cancelar";
                    btnCancel.addEventListener("click", cancelPublishConfirmation);
                    
                    btnGroup.appendChild(btnConfirm);
                    btnGroup.appendChild(btnCancel);
                    confirmPanel.appendChild(btnGroup);
                    controlsContainer.appendChild(confirmPanel);
                    
                    updateDraftCreationButtonState();
                    updateDraftUpdateButtonState();
                    updateDraftPublishButtonState();
    updateConfigurationBackupButtonState();
                }
            }
            
            appendCancelDraftRecoveryButton(controlsContainer);
            
            if (studioValidation.warnings.length > 0) {
                const stuWarnDiv = document.createElement("div");
                stuWarnDiv.style.color = "#f0ad4e";
                stuWarnDiv.style.marginTop = "10px";
                stuWarnDiv.textContent = `Advertencias Studio (${studioValidation.warnings.length}): ` + studioValidation.warnings.join(" | ");
                controlsContainer.appendChild(stuWarnDiv);
            }
        }
        
        controlsContainer.appendChild(statusMsg);
        controlsContainer.appendChild(configBackupStatusMsg);
        
        const filesInfo = document.createElement("div");
        filesInfo.style.marginTop = "15px";
        filesInfo.style.fontSize = "0.85rem";
        filesInfo.style.color = "#666";
        filesInfo.textContent = `Archivo HTML: ${currentPublicationSlug}.html | Manifiesto: invitta-publicacion-${currentPublicationSlug}.json | Payload Studio: invitta-studio-payload-${currentPublicationSlug}.json`;
        controlsContainer.appendChild(filesInfo);
    }

    resultCard.scrollIntoView({ behavior: "smooth" });
}

// ─────────────────────────────────────────────
// DOWNLOAD
// ─────────────────────────────────────────────
function downloadFinal() {
    if (!enforceStudioReady()) return;
    if (!finalHTML) return;
    const blob = new Blob([finalHTML], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = currentPublicationSlug ? `${currentPublicationSlug}.html` : "evento-invitta.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
