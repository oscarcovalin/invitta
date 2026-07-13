/**
 * studio-dashboard.js
 * Lógica del dashboard de Invitta Studio
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Proteger ruta
  const session = await window.studioAuth.requireSession();
  if (!session) return;

  const db = window.studioAuth.db;
  let currentStudioId = null;

  // Manejar Logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await window.studioAuth.logout();
  });

  function createBadge(text, classNames, extraStyles = {}) {
    const span = document.createElement("span");
    span.textContent = text;
    span.className = classNames;
    for (const [key, val] of Object.entries(extraStyles)) {
      span.style[key] = val;
    }
    return span;
  }

  function countArrayValues(value, max) {
    if (!value) return 0;
    let arr = [];
    if (Array.isArray(value)) {
      arr = value;
    } else if (typeof value === "string") {
      try {
        const p = JSON.parse(value);
        arr = Array.isArray(p) ? p : [];
      } catch {
        return 0;
      }
    }
    const count = arr.filter(Boolean).length;
    return Math.min(count, max);
  }

  function formatInvitationDate(value) {
    if (!value) return "Sin fecha";
    const strVal = String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(strVal)) return "Sin fecha";
    
    const parts = strVal.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    if (year < 1900 || year > 2200) return "Sin fecha";
    if (month < 1 || month > 12) return "Sin fecha";
    if (day < 1 || day > 31) return "Sin fecha";
    
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return "Sin fecha";
    
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
      return "Sin fecha";
    }
    
    return d.toLocaleDateString("es-MX");
  }

  function buildPublicInvitationPath(safeSlug) {
    return `/invitacion.html?slug=${encodeURIComponent(safeSlug)}`;
  }

  function setCopyButtonFeedback(btn, baseLink) {
    btn.addEventListener("click", () => {
      const originalText = btn.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(baseLink).then(() => {
          btn.textContent = "¡Copiado!";
          setTimeout(() => btn.textContent = originalText, 2000);
        }).catch(err => {
          console.error("Error al copiar:", err);
          btn.textContent = "No se pudo copiar";
          setTimeout(() => btn.textContent = originalText, 2000);
        });
      } else {
        console.error("Clipboard API no disponible");
        btn.textContent = "No se pudo copiar";
        setTimeout(() => btn.textContent = originalText, 2000);
      }
    });
  }

  function createInvitationItem(inv) {
    const item = document.createElement("div");
    item.className = "invitation-item";

    // Info container
    const infoDiv = document.createElement("div");
    infoDiv.className = "invitation-item-info";

    const h3 = document.createElement("h3");
    const safeTitle = String(inv.title || "Sin título").trim().slice(0, 200);
    h3.appendChild(document.createTextNode(safeTitle + " "));

    // Status badge
    if (inv.published === true) {
      h3.appendChild(createBadge("Publicada", "badge badge-published"));
    } else {
      h3.appendChild(createBadge("Borrador", "badge badge-draft"));
    }
    h3.appendChild(document.createTextNode(" "));

    // Media badges
    if (inv.main_photo_url) {
      h3.appendChild(createBadge("📷 Foto", "badge badge-media badge-photo"));
      h3.appendChild(document.createTextNode(" "));
    }
    if (inv.music_url) {
      h3.appendChild(createBadge("🎵 Música", "badge badge-media badge-music"));
      h3.appendChild(document.createTextNode(" "));
    }

    
    if (inv.template_id && TEMPLATE_NAMES[inv.template_id]) {
      h3.appendChild(createBadge("🎨 " + TEMPLATE_NAMES[inv.template_id], "badge badge-media"));
      h3.appendChild(document.createTextNode(" "));
    }
    const galleryCount = countArrayValues(inv.gallery_urls, 10);

    if (galleryCount > 0) {
      h3.appendChild(createBadge(`🖼️ Galería ${galleryCount}`, "badge badge-media badge-gallery"));
      h3.appendChild(document.createTextNode(" "));
    }

    const timelineCount = countArrayValues(inv.itinerary, 30);
    if (timelineCount > 0) {
      h3.appendChild(createBadge(`⏱️ Timeline ${timelineCount}`, "badge badge-media badge-timeline", {
        background: "#e0f2fe", color: "#0369a1", borderColor: "#7dd3fc"
      }));
      h3.appendChild(document.createTextNode(" "));
    }

    const fontNames = {
      classic: "Clásica Elegante",
      romantic: "Romántica Script",
      editorial: "Editorial Fine Art",
      minimal: "Moderna Minimal",
      luxury: "Luxury Dramática"
    };
    const fontName = fontNames[inv.font_preset] || "Clásica Elegante";
    h3.appendChild(createBadge(`✨ ${fontName}`, "badge badge-media badge-font", {
      background: "#f3e8ff", color: "#6b21a8", borderColor: "#d8b4fe"
    }));

    infoDiv.appendChild(h3);

    const safeEventType = String(inv.event_type || "-").trim().slice(0, 100);
    const safeSlug = String(inv.slug || "").trim().slice(0, 160);
    const dateStr = formatInvitationDate(inv.event_date);

    const p = document.createElement("p");
    
    const strongEvent = document.createElement("strong");
    strongEvent.textContent = "Evento: ";
    p.appendChild(strongEvent);
    p.appendChild(document.createTextNode(safeEventType + " | "));

    const strongDate = document.createElement("strong");
    strongDate.textContent = "Fecha: ";
    p.appendChild(strongDate);
    p.appendChild(document.createTextNode(dateStr + " | "));

    const strongSlug = document.createElement("strong");
    strongSlug.textContent = "Slug: ";
    p.appendChild(strongSlug);
    p.appendChild(document.createTextNode(safeSlug));

    infoDiv.appendChild(p);
    item.appendChild(infoDiv);

    // Actions container
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "invitation-item-actions";

    const baseLink = window.location.origin + buildPublicInvitationPath(safeSlug);
    
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "btn btn-secondary btn-small copy-btn";
    copyBtn.textContent = "Copiar Link Base";
    
    const demoBtn = document.createElement("a");
    demoBtn.className = "btn btn-secondary btn-small";
    
    if (!safeSlug) {
      copyBtn.disabled = true;
      demoBtn.textContent = "Demo no disponible";
    } else {
      demoBtn.textContent = "Ver Demo";
      demoBtn.target = "_blank";
      demoBtn.rel = "noopener noreferrer";
      demoBtn.href = `${buildPublicInvitationPath(safeSlug)}&n=Familia%20Garcia&p=4&m=5`;
      setCopyButtonFeedback(copyBtn, baseLink);
    }
    
    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(document.createTextNode(" "));
    actionsDiv.appendChild(demoBtn);
    actionsDiv.appendChild(document.createTextNode(" "));

    if (inv.id) {
      const editBtn = document.createElement("a");
      editBtn.className = "btn btn-primary btn-small";
      editBtn.textContent = "Editar";
      editBtn.href = `/administracion/studio-invitacion-form.html?id=${encodeURIComponent(String(inv.id))}`;
      actionsDiv.appendChild(editBtn);
      
      actionsDiv.appendChild(document.createTextNode(" "));
      
      const resumeBtn = document.createElement("a");
      resumeBtn.className = "btn btn-secondary btn-small";
      resumeBtn.textContent = "Continuar en generador";
      resumeBtn.href = `/administracion/generar-invitacion.html?draft=${encodeURIComponent(String(inv.id))}`;
      actionsDiv.appendChild(resumeBtn);
    } else {
      const editDisabled = document.createElement("span");
      editDisabled.className = "btn btn-primary btn-small";
      editDisabled.textContent = "Editar no disponible";
      editDisabled.style.opacity = "0.6";
      editDisabled.style.cursor = "not-allowed";
      actionsDiv.appendChild(editDisabled);
    }

    item.appendChild(actionsDiv);
    return item;
  }

  // 1. Cargar datos del estudio
  async function loadStudioData() {
    const { data: studio, error } = await db
      .from("studios")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error || !studio) {
      document.getElementById("studio-name").textContent = "Estudio no encontrado";
      console.error("Error cargando estudio:", error);
      return;
    }

    currentStudioId = studio.id;
    document.getElementById("studio-name").textContent = String(studio.name || "Mi Estudio").trim().slice(0, 120);
    
    // Guardar studio_id en localStorage para usarlo en el form más fácilmente
    localStorage.setItem("invitta_studio_id", currentStudioId);

    // 2. Cargar invitaciones
    await loadInvitations();
  }

  // 2. Cargar invitaciones del estudio
  async function loadInvitations() {
    const loadingMsg = document.getElementById("loading-msg");
    const emptyMsg = document.getElementById("empty-msg");
    const listContainer = document.getElementById("invitation-list");

    loadingMsg.style.display = "block";
    loadingMsg.setAttribute("role", "status");
    loadingMsg.setAttribute("aria-live", "polite");
    loadingMsg.textContent = "Cargando invitaciones...";
    
    emptyMsg.style.display = "none";
    listContainer.replaceChildren();

    const { data: invitations, error } = await db
      .from("studio_invitations")
      .select("id, title, slug, event_type, event_date, published, main_photo_url, music_url, gallery_urls, font_preset, itinerary")
      .eq("studio_id", currentStudioId)
      .order("created_at", { ascending: false });

    loadingMsg.style.display = "none";

    if (error) {
      console.error("Error cargando invitaciones:", error);
      emptyMsg.textContent = "No fue posible cargar tus invitaciones. Intenta nuevamente.";
      emptyMsg.className = "alert";
      emptyMsg.style.display = "block";
      emptyMsg.setAttribute("role", "alert");
      emptyMsg.setAttribute("aria-live", "assertive");
      return;
    }

    if (!invitations || invitations.length === 0) {
      emptyMsg.textContent = "No tienes invitaciones creadas. ¡Empieza creando una!";
      emptyMsg.className = "alert";
      emptyMsg.style.display = "block";
      emptyMsg.setAttribute("role", "status");
      emptyMsg.setAttribute("aria-live", "polite");
      return;
    }

    // Renderizar
    invitations.forEach(inv => {
      const item = createInvitationItem(inv);
      listContainer.appendChild(item);
    });
  }

  // Iniciar
  loadStudioData();
});
