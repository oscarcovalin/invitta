/**
 * Fase 7I.1 — Gestor interno de recursos multimedia para Invitta.
 * Lee invitta-configuracion.json y agrega propiedades `media` y `studio` mediante URLs HTTPS.
 * Sin dependencias, sin Supabase, 100% local.
 */

"use strict";

let loadedConfig = null;
let galleryData = [];
let finalConfigJSON = null;

const MAX_GALLERY_IMAGES = 10;

// ─────────────────────────────────────────────
// INITIALIZATION
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

// ─────────────────────────────────────────────
// FILE HANDLING
// ─────────────────────────────────────────────
function handleFile(file) {
    hideError();
    hideWarning();
    
    if (!file.name.endsWith(".json")) {
        showError("Selecciona un archivo .json válido.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.meta || !data.template || !data.event || !data.visual) {
                showError("El archivo no parece ser una configuración Invitta válida.");
                return;
            }
            
            // Si ya traía media/studio, lo inicializamos
            loadedConfig = data;
            
            if (data.media?.gallery && Array.isArray(data.media.gallery)) {
                galleryData = [...data.media.gallery].slice(0, MAX_GALLERY_IMAGES);
            }
            
            prefillForms(data);
            renderSummary(data);
            renderGallery();
            
            document.getElementById("uploadCard").style.display = "none";
            document.getElementById("mainWorkspace").classList.remove("hidden");
            
        } catch (err) {
            showError("Error al parsear el archivo JSON. Verifica que el archivo no esté corrupto.");
            console.error(err);
        }
    };
    reader.readAsText(file);
}

function prefillForms(data) {
    if (data.media) {
        document.getElementById("heroImageUrl").value = data.media.heroImage || "";
        document.getElementById("musicUrl").value = data.media.music?.url || "";
        document.getElementById("musicTitle").value = data.media.music?.title || "";
        document.getElementById("musicAutoplay").checked = !!data.media.music?.autoplay;
        document.getElementById("studioLogoUrl").value = data.media.studioLogo || "";
    }
    
    if (data.studio) {
        document.getElementById("studioName").value = data.studio.name || "";
        document.getElementById("studioWhatsapp").value = data.studio.whatsapp || "";
        document.getElementById("studioWebsite").value = data.studio.website || "";
    }
}

function renderSummary(data) {
    const items = [
        { label: "Nombre del evento", value: data.event.primaryName + (data.event.secondaryName ? ` & ${data.event.secondaryName}` : "") },
        { label: "Tipo de evento",    value: data.event.type },
        { label: "Paquete",           value: data.event.packageLevel },
        { label: "Plantilla",         value: data.template.name || data.template.id || "—" },
        { label: "Fecha",             value: data.event.dateText || "—" },
        { label: "Paleta",            value: data.visual.palette }
    ];

    const grid = document.getElementById("summaryGrid");
    grid.innerHTML = items.map(i => `
        <div class="sum-item">
            <div class="sum-label">${escapeHTML(i.label)}</div>
            <div class="sum-value">${escapeHTML(i.value || "—")}</div>
        </div>`).join("");
}

// ─────────────────────────────────────────────
// SECURITY HELPERS
// ─────────────────────────────────────────────
function escapeHTML(val) {
    if (val === null || val === undefined) return "";
    return String(val)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function safeHttpsUrl(val) {
    if (!val || typeof val !== "string") return null;
    const trimmed = val.trim();
    // Debe empezar explícitamente con https://
    if (/^https:\/\//i.test(trimmed)) return trimmed;
    return null;
}

function cleanWhatsApp(number) {
    return String(number || "").replace(/\D/g, "");
}

function showError(msg) {
    const el = document.getElementById("errorMsg");
    el.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${escapeHTML(msg)}`;
    el.style.display = "block";
    el.scrollIntoView({ behavior: "smooth" });
}
function hideError() {
    document.getElementById("errorMsg").style.display = "none";
}

function showWarning(msg) {
    const el = document.getElementById("warningMsg");
    el.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${escapeHTML(msg)}`;
    el.style.display = "block";
}
function hideWarning() {
    document.getElementById("warningMsg").style.display = "none";
}

// ─────────────────────────────────────────────
// PREVIEW HELPERS
// ─────────────────────────────────────────────
function testHeroImage() {
    hideError();
    const url = safeHttpsUrl(document.getElementById("heroImageUrl").value);
    const container = document.getElementById("heroImagePreviewContainer");
    const img = document.getElementById("heroImagePreview");
    
    if (!url) {
        container.style.display = "none";
        if (document.getElementById("heroImageUrl").value.trim() !== "") {
            showError("URL de portada inválida. Debe ser HTTPS.");
        }
        return;
    }
    
    img.onerror = () => { showError("No se pudo cargar la imagen de portada. Verifica la URL."); container.style.display = "none"; };
    img.onload = () => { container.style.display = "block"; };
    img.src = url;
}

function testStudioLogo() {
    hideError();
    const url = safeHttpsUrl(document.getElementById("studioLogoUrl").value);
    const container = document.getElementById("studioLogoPreviewContainer");
    const img = document.getElementById("studioLogoPreview");
    
    if (!url) {
        container.style.display = "none";
        if (document.getElementById("studioLogoUrl").value.trim() !== "") {
            showError("URL de logotipo inválida. Debe ser HTTPS.");
        }
        return;
    }
    
    img.onerror = () => { showError("No se pudo cargar el logotipo. Verifica la URL."); container.style.display = "none"; };
    img.onload = () => { container.style.display = "block"; };
    img.src = url;
}

function testAudio() {
    hideError();
    const url = safeHttpsUrl(document.getElementById("musicUrl").value);
    const container = document.getElementById("audioPreviewContainer");
    const audio = document.getElementById("audioPreview");
    
    if (!url) {
        container.style.display = "none";
        audio.pause();
        if (document.getElementById("musicUrl").value.trim() !== "") {
            showError("URL de música inválida. Debe ser HTTPS.");
        }
        return;
    }
    
    audio.onerror = () => { showError("No se pudo cargar o reproducir el archivo de audio. Verifica la URL."); container.style.display = "none"; };
    audio.src = url;
    container.style.display = "block";
    audio.play().catch(e => {
        // Puede fallar si el navegador bloquea autoplay sin interacción reciente, pero le mostramos el reproductor.
        console.warn("Reproducción automática bloqueada para preview.", e);
    });
}

function testGalleryImage(index) {
    const input = document.getElementById(`gal_url_${index}`);
    const img = document.getElementById(`gal_thumb_${index}`);
    const url = safeHttpsUrl(input.value);
    
    if (!url) {
        img.style.display = "none";
        return;
    }
    
    img.onerror = () => { img.style.display = "none"; };
    img.onload = () => { img.style.display = "block"; };
    img.src = url;
    
    // Update internal state
    galleryData[index].url = url;
}

// ─────────────────────────────────────────────
// GALLERY MANAGEMENT
// ─────────────────────────────────────────────
function renderGallery() {
    const list = document.getElementById("galleryList");
    const btnAdd = document.getElementById("btnAddGallery");
    const limitMsg = document.getElementById("galleryLimitMsg");
    
    list.innerHTML = "";
    
    galleryData.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "gallery-item";
        
        const safeUrl = escapeHTML(item.url || "");
        const safeAlt = escapeHTML(item.alt || "");
        
        const isAuto = item.orientation === "auto" || !item.orientation ? "selected" : "";
        const isVert = item.orientation === "vertical" ? "selected" : "";
        const isHorz = item.orientation === "horizontal" ? "selected" : "";
        const isQuad = item.orientation === "cuadrada" ? "selected" : "";

        div.innerHTML = `
            <img id="gal_thumb_${index}" class="gallery-img-thumb" src="${safeUrl ? safeUrl : ''}" alt="Miniatura" style="${safeUrl ? 'display:block' : 'display:none'}">
            
            <div class="gallery-item-content">
                <div class="input-group">
                    <input type="url" id="gal_url_${index}" class="form-control" placeholder="URL HTTPS de la imagen" value="${safeUrl}" onchange="testGalleryImage(${index}); updateGalleryState(${index})">
                    <button type="button" class="btn btn-outline btn-icon" onclick="testGalleryImage(${index})" title="Probar imagen"><i class="fa-solid fa-eye"></i></button>
                </div>
                
                <div class="gallery-controls">
                    <input type="text" id="gal_alt_${index}" class="form-control" placeholder="Texto descriptivo (alt)" value="${safeAlt}" onchange="updateGalleryState(${index})">
                    <select id="gal_orient_${index}" onchange="updateGalleryState(${index})">
                        <option value="auto" ${isAuto}>Auto</option>
                        <option value="vertical" ${isVert}>Vertical</option>
                        <option value="horizontal" ${isHorz}>Horizontal</option>
                        <option value="cuadrada" ${isQuad}>Cuadrada</option>
                    </select>
                </div>
            </div>
            
            <div class="gallery-item-actions">
                <button type="button" class="btn btn-icon" onclick="moveGalleryItem(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Subir"><i class="fa-solid fa-arrow-up"></i></button>
                <button type="button" class="btn btn-icon" onclick="moveGalleryItem(${index}, 1)" ${index === galleryData.length - 1 ? 'disabled' : ''} title="Bajar"><i class="fa-solid fa-arrow-down"></i></button>
                <button type="button" class="btn btn-icon danger" onclick="removeGalleryItem(${index})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        
        list.appendChild(div);
    });
    
    if (galleryData.length >= MAX_GALLERY_IMAGES) {
        btnAdd.classList.add("hidden");
        limitMsg.classList.remove("hidden");
    } else {
        btnAdd.classList.remove("hidden");
        limitMsg.classList.add("hidden");
    }
}

function updateGalleryState(index) {
    if (!galleryData[index]) return;
    const urlInput = document.getElementById(`gal_url_${index}`);
    const altInput = document.getElementById(`gal_alt_${index}`);
    const orientInput = document.getElementById(`gal_orient_${index}`);
    
    galleryData[index].url = urlInput.value.trim();
    galleryData[index].alt = altInput.value.trim();
    galleryData[index].orientation = orientInput.value;
}

function addGalleryItem() {
    if (galleryData.length >= MAX_GALLERY_IMAGES) return;
    galleryData.push({ url: "", alt: "", orientation: "auto" });
    renderGallery();
}

function removeGalleryItem(index) {
    galleryData.splice(index, 1);
    renderGallery();
}

function moveGalleryItem(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= galleryData.length) return;
    
    // Forzamos guardar el estado actual antes de mover
    for(let i=0; i<galleryData.length; i++) {
        updateGalleryState(i);
    }
    
    const temp = galleryData[index];
    galleryData[index] = galleryData[newIndex];
    galleryData[newIndex] = temp;
    
    renderGallery();
}

// ─────────────────────────────────────────────
// GENERATION
// ─────────────────────────────────────────────
function generateMediaConfig() {
    hideError();
    hideWarning();
    
    if (!loadedConfig) return;
    
    // Forzamos actualización de la galería
    for(let i=0; i<galleryData.length; i++) {
        updateGalleryState(i);
    }

    // --- Recolección de datos y Validación ---
    
    // Portada
    const rawHero = document.getElementById("heroImageUrl").value;
    const heroUrl = safeHttpsUrl(rawHero);
    if (rawHero && !heroUrl) { showError("La URL de la imagen principal no es una URL HTTPS válida."); return; }
    
    // Música
    const rawMusic = document.getElementById("musicUrl").value;
    const musicUrl = safeHttpsUrl(rawMusic);
    if (rawMusic && !musicUrl) { showError("La URL de la música no es una URL HTTPS válida."); return; }
    const musicTitle = document.getElementById("musicTitle").value.trim();
    const musicAutoplay = document.getElementById("musicAutoplay").checked;

    // Estudio
    const studioName = document.getElementById("studioName").value.trim();
    const studioWhatsapp = cleanWhatsApp(document.getElementById("studioWhatsapp").value);
    
    const rawWebsite = document.getElementById("studioWebsite").value;
    const studioWebsite = safeHttpsUrl(rawWebsite);
    if (rawWebsite && !studioWebsite) { showError("La URL del sitio web del estudio no es una URL HTTPS válida."); return; }
    
    const rawLogo = document.getElementById("studioLogoUrl").value;
    const studioLogoUrl = safeHttpsUrl(rawLogo);
    if (rawLogo && !studioLogoUrl) { showError("La URL del logotipo del estudio no es una URL HTTPS válida."); return; }

    // Galería
    const finalGallery = [];
    for (let i = 0; i < galleryData.length; i++) {
        const item = galleryData[i];
        if (!item.url) continue; // Ignoramos los que están en blanco
        
        const cleanUrl = safeHttpsUrl(item.url);
        if (!cleanUrl) {
            showError(`La imagen de la galería en la posición ${i+1} no es una URL HTTPS válida.`);
            return;
        }
        
        finalGallery.push({
            url: cleanUrl,
            alt: item.alt,
            orientation: item.orientation
        });
    }

    // --- Advertencias ---
    let warnings = [];
    if (!heroUrl) warnings.push("Sin imagen principal.");
    if (finalGallery.length === 0) warnings.push("Sin galería.");
    if (!musicUrl) warnings.push("Sin música.");
    if (!studioLogoUrl) warnings.push("Sin logo del estudio.");
    
    if (warnings.length > 0) {
        showWarning("Atención, la configuración se generó con advertencias: " + warnings.join(" | "));
    }

    // --- Construcción del objeto final ---
    // Deep clone para no modificar el original cargado en memoria directamente (aunque aquí da igual porque lo vamos a descargar)
    const newConfig = JSON.parse(JSON.stringify(loadedConfig));
    
    // Actualizar meta
    if (!newConfig.meta) newConfig.meta = {};
    newConfig.meta.mediaEnrichedAt = new Date().toISOString();
    
    // Inyectar media
    newConfig.media = {
        heroImage: heroUrl || "",
        gallery: finalGallery,
        music: {
            url: musicUrl || "",
            title: musicTitle || "",
            autoplay: musicAutoplay
        },
        studioLogo: studioLogoUrl || ""
    };
    
    // Inyectar studio
    newConfig.studio = {
        name: studioName || "",
        whatsapp: studioWhatsapp || "",
        website: studioWebsite || ""
    };
    
    // Generar string para preview y descarga
    const resultObj = { media: newConfig.media, studio: newConfig.studio };
    document.getElementById("codePreview").textContent = JSON.stringify(resultObj, null, 2);
    
    finalConfigJSON = JSON.stringify(newConfig, null, 2);
    document.getElementById("resultContainer").classList.remove("hidden");
    
    document.getElementById("resultContainer").scrollIntoView({ behavior: "smooth" });
}

function downloadMediaConfig() {
    if (!finalConfigJSON) return;
    
    const blob = new Blob([finalConfigJSON], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    a.href = url;
    a.download = "invitta-configuracion-media.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}
