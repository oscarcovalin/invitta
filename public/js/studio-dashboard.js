/**
 * studio-dashboard.js
 * LÃ³gica del dashboard de Invitta Studio
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Proteger ruta
  const session = await window.studioAuth.requireSession();
  if (!session) return;

  const db = window.studioAuth.db;
  let currentStudioId = null;
  let isCurrentStudioManager = false;
  const salesRequestsLink = document.getElementById("sales-requests-link");
  const salesRequestCount = document.getElementById("sales-request-count");

  loadNewSalesRequestCount();

  // Manejar Logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await window.studioAuth.logout();
  });

  async function loadNewSalesRequestCount() {
    if (!salesRequestsLink || !salesRequestCount) return;

    try {
      const { data: isSalesOperator, error: roleError } = await db
        .rpc("is_invitta_sales_operator");

      if (roleError || !isSalesOperator) {
        salesRequestsLink.hidden = true;
        return;
      }

      const { count, error } = await db
        .from("invitation_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");

      if (error || !count) return;

      salesRequestCount.textContent = count > 99 ? "99+" : String(count);
      salesRequestCount.hidden = false;
      salesRequestsLink.setAttribute("aria-label", `Solicitudes (${count} nuevas)`);
    } catch (error) {
      salesRequestsLink.hidden = true;
      console.warn("No se pudo cargar el contador de solicitudes:", error);
    }
  }

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

  function buildShareInvitationPath(safeSlug) {
    const params = new URLSearchParams({
      slug: safeSlug,
      v: `share-${Date.now()}`
    });
    return `/invitacion.html?${params.toString()}`;
  }

  function buildStudioPreviewPath(safeSlug) {
    const params = new URLSearchParams({
      slug: safeSlug,
      n: "Familia Garcia",
      p: "4",
      m: "5",
      preview: "studio",
      v: `preview-${Date.now()}`
    });
    return `/invitacion.html?${params.toString()}`;
  }

  function setCopyButtonFeedback(btn, getLink) {
    btn.addEventListener("click", () => {
      const originalText = btn.textContent;
      const link = typeof getLink === "function" ? getLink() : getLink;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          btn.textContent = "Â¡Copiado!";
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

  
  const TEMPLATE_NAMES = (window.InvittaTemplateCatalog && window.InvittaTemplateCatalog.TEMPLATE_NAMES) 
    ? window.InvittaTemplateCatalog.TEMPLATE_NAMES 
    : {
        "xv-elegance-basic": "Ã‰lÃ©gance XV",
        "xv-rose-gold-premium": "Rose Gold XV",
        "xv-champagne-rose-vip": "Champagne Rose VIP",
        "boda-classic-basic": "Classic Wedding",
        "boda-golden-romance-premium": "Golden Romance",
        "boda-midnight-gold-vip": "Midnight Gold Wedding"
      };

  function createInvitationItem(inv) {
    const item = document.createElement("article");
    item.className = "studio-invitation-card";

    const headerDiv = document.createElement("div");
    headerDiv.className = "card-header";

    const h3 = document.createElement("h3");
    h3.className = "card-title";
    const safeTitle = String(inv.title || "Sin título").trim().slice(0, 200);
    h3.textContent = safeTitle;

    headerDiv.appendChild(h3);
    item.appendChild(headerDiv);

    const safeSlug = String(inv.slug || "").trim().slice(0, 160);
    if (safeSlug) {
      const slugSpan = document.createElement("span");
      slugSpan.className = "card-slug";
      slugSpan.textContent = "/" + safeSlug;
      item.appendChild(slugSpan);
    }

    const badgesDiv = document.createElement("div");
    badgesDiv.className = "card-badges";

    if (inv.published === true) {
      const badge = document.createElement("span");
      badge.className = "card-badge published";
      badge.textContent = "Publicada";
      badgesDiv.appendChild(badge);
    } else {
      const badge = document.createElement("span");
      badge.className = "card-badge draft";
      badge.textContent = "Borrador";
      badgesDiv.appendChild(badge);
    }

    if (inv.main_photo_url) {
      const badge = document.createElement("span");
      badge.className = "card-badge";
      badge.textContent = "📷 Foto";
      badgesDiv.appendChild(badge);
    }
    
    if (inv.music_url) {
      const badge = document.createElement("span");
      badge.className = "card-badge";
      badge.textContent = "🎵 Música";
      badgesDiv.appendChild(badge);
    }

    if (inv.template_id && TEMPLATE_NAMES[inv.template_id]) {
      const badge = document.createElement("span");
      badge.className = "card-badge";
      badge.textContent = "✨ " + TEMPLATE_NAMES[inv.template_id];
      badgesDiv.appendChild(badge);
    }

    const galleryCount = countArrayValues(inv.gallery_urls, 10);
    if (galleryCount > 0) {
      const badge = document.createElement("span");
      badge.className = "card-badge";
      badge.textContent = "🖼️ Galería " + galleryCount;
      badgesDiv.appendChild(badge);
    }

    const timelineCount = countArrayValues(inv.itinerary, 30);
    if (timelineCount > 0) {
      const badge = document.createElement("span");
      badge.className = "card-badge";
      badge.textContent = "⏱️ Timeline " + timelineCount;
      badgesDiv.appendChild(badge);
    }

    item.appendChild(badgesDiv);

    const infoDiv = document.createElement("div");
    infoDiv.className = "card-info";
    
    const safeEventType = String(inv.event_type || "-").trim().slice(0, 100);
    const dateStr = formatInvitationDate(inv.event_date);

    const pEvent = document.createElement("p");
    const strongEvent = document.createElement("strong");
    strongEvent.textContent = "Evento: ";
    pEvent.appendChild(strongEvent);
    pEvent.appendChild(document.createTextNode(safeEventType));
    infoDiv.appendChild(pEvent);

    const pDate = document.createElement("p");
    const strongDate = document.createElement("strong");
    strongDate.textContent = "Fecha: ";
    pDate.appendChild(strongDate);
    pDate.appendChild(document.createTextNode(dateStr));
    infoDiv.appendChild(pDate);

    if (inv.published && inv.expires_at) {
      const expiration = new Date(inv.expires_at);
      if (!Number.isNaN(expiration.getTime())) {
        const pExp = document.createElement("p");
        const strongExp = document.createElement("strong");
        strongExp.textContent = "Vence: ";
        pExp.appendChild(strongExp);
        const expStr = expiration.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
        pExp.appendChild(document.createTextNode(expStr));
        infoDiv.appendChild(pExp);
      }
    }

    item.appendChild(infoDiv);

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "card-actions";

    const primaryActions = document.createElement("div");
    primaryActions.className = "card-actions-primary";

    if (inv.id) {
      const editBtn = document.createElement("a");
      editBtn.className = "btn-card btn-card-primary";
      editBtn.textContent = "Editar";
      editBtn.href = "/administracion/studio-invitacion-form.html?id=" + encodeURIComponent(String(inv.id));
      primaryActions.appendChild(editBtn);
    } else {
      const editDisabled = document.createElement("button");
      editDisabled.className = "btn-card btn-card-primary";
      editDisabled.textContent = "No disponible";
      editDisabled.disabled = true;
      primaryActions.appendChild(editDisabled);
    }

    const demoBtn = document.createElement("a");
    demoBtn.className = "btn-card btn-card-outline";
    if (!safeSlug) {
      demoBtn.textContent = "No disponible";
      demoBtn.disabled = true;
    } else {
      demoBtn.textContent = inv.published === true ? "Ver Demo" : "Vista previa";
      demoBtn.target = "_blank";
      demoBtn.rel = "noopener noreferrer";
      demoBtn.href = inv.published === true
        ? buildPublicInvitationPath(safeSlug) + "&n=Familia%20Garcia&p=4&m=5"
        : buildStudioPreviewPath(safeSlug);
    }
    primaryActions.appendChild(demoBtn);
    actionsDiv.appendChild(primaryActions);

    const secondaryActions = document.createElement("div");
    secondaryActions.className = "card-actions-secondary";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "btn-card btn-card-sub copy-btn";
    copyBtn.textContent = "Copiar Link";
    if (!safeSlug || inv.published !== true) {
      copyBtn.disabled = true;
      copyBtn.textContent = "Publica para copiar";
    } else {
      setCopyButtonFeedback(copyBtn, () => window.location.origin + buildShareInvitationPath(safeSlug));
    }
    secondaryActions.appendChild(copyBtn);

    if (inv.evento_id) {
      const guestsBtn = document.createElement("a");
      guestsBtn.className = "btn-card btn-card-sub";
      guestsBtn.textContent = "Invitados";
      guestsBtn.href = "/administracion/dashboard.html?event_id=" + encodeURIComponent(String(inv.evento_id));
      secondaryActions.appendChild(guestsBtn);

      if (isCurrentStudioManager && inv.id) {
        const clientAccessBtn = document.createElement("a");
        clientAccessBtn.className = "btn-card btn-card-sub";
        clientAccessBtn.textContent = "Acceso Cliente";
        clientAccessBtn.href = "/administracion/studio-invitacion-form.html?id=" + encodeURIComponent(String(inv.id)) + "#client-access";
        secondaryActions.appendChild(clientAccessBtn);
      }
    } else if (isCurrentStudioManager) {
      const prepareGuestsBtn = document.createElement("button");
      prepareGuestsBtn.type = "button";
      prepareGuestsBtn.className = "btn-card btn-card-sub";
      prepareGuestsBtn.textContent = "Preparar invitados";
      prepareGuestsBtn.addEventListener("click", async () => {
        prepareGuestsBtn.disabled = true;
        prepareGuestsBtn.textContent = "Preparando...";
        const { error } = await db.rpc("sync_studio_invitation_event", { target_invitation_id: inv.id });
        if (error) {
          console.error("Error al preparar:", error);
          prepareGuestsBtn.disabled = false;
          prepareGuestsBtn.textContent = "Preparar invitados";
          return;
        }
        await loadInvitations();
      });
      secondaryActions.appendChild(prepareGuestsBtn);
    }

    actionsDiv.appendChild(secondaryActions);
    item.appendChild(actionsDiv);

    return item;
  }

  // 1. Cargar datos del estudio
  async function loadStudioData() {
    const preferredStudioId = new URLSearchParams(window.location.search).get("studio_id")
      || localStorage.getItem("invitta_studio_id");
    const { studio, error } = await window.studioAuth.resolveStudioContext(preferredStudioId);

    if (error || !studio) {
      document.getElementById("studio-name").textContent = "Estudio no encontrado";
      console.error("Error cargando estudio:", error);
      const loadingMsg = document.getElementById("loading-msg");
      const emptyMsg = document.getElementById("empty-msg");
      if(loadingMsg) loadingMsg.style.display = "none";
      
      const h3 = emptyMsg.querySelector("h3");
      if(h3) h3.textContent = "No fue posible cargar el estudio.";
      const p = emptyMsg.querySelector("p");
      if(p) p.textContent = "Puedes volver a intentarlo o crear una invitación manualmente.";
      emptyMsg.style.display = "block";
      return;
    }

    currentStudioId = studio.studio_id;
    isCurrentStudioManager = ["owner", "manager"].includes(studio.studio_role);
    document.getElementById("studio-name").textContent = String(studio.studio_name || "Mi Estudio").trim().slice(0, 120);
    
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

    if(loadingMsg) loadingMsg.style.display = "block";
    if(emptyMsg) emptyMsg.style.display = "none";
    if(listContainer) listContainer.replaceChildren();

    let invitations = null;
    let error = null;
    try {
      const result = await db
        .from("studio_invitations")
        .select("id, title, slug, event_type, event_date, published, published_at, expires_at, main_photo_url, music_url, gallery_urls, font_preset, itinerary, template_id, evento_id")
        .eq("studio_id", currentStudioId)
        .order("created_at", { ascending: false });
      invitations = result.data;
      error = result.error;
    } catch (requestError) {
      error = requestError;
    } finally {
      if(loadingMsg) loadingMsg.style.display = "none";
    }

    if (error) {
      console.error("Error cargando invitaciones:", error);
      const h3 = emptyMsg.querySelector("h3");
      if(h3) h3.textContent = "No fue posible cargar tus invitaciones";
      const p = emptyMsg.querySelector("p");
      if(p) p.textContent = "Intenta recargar la página nuevamente.";
      if(emptyMsg) emptyMsg.style.display = "block";
      return;
    }

    // Calculo de KPIs
    if (invitations) {
      const elTotal = document.getElementById("kpi-total");
      const elPublished = document.getElementById("kpi-published");
      const elDrafts = document.getElementById("kpi-drafts");
      
      let publishedCount = 0;
      let draftCount = 0;
      invitations.forEach(inv => {
        if (inv.published) publishedCount++;
        else draftCount++;
      });
      
      if (elTotal) elTotal.textContent = invitations.length;
      if (elPublished) elPublished.textContent = publishedCount;
      if (elDrafts) elDrafts.textContent = draftCount;
    }

    if (!invitations || invitations.length === 0) {
      if(emptyMsg) emptyMsg.style.display = "block";
      return;
    }

    // Renderizar optimizado con DocumentFragment
    const fragment = document.createDocumentFragment();
    invitations.forEach(inv => {
      const item = createInvitationItem(inv);
      fragment.appendChild(item);
    });
    if(listContainer) listContainer.appendChild(fragment);
  }

  // Iniciar
  loadStudioData().catch((error) => {
    console.error("No se pudo iniciar el panel de estudio:", error);
    const loadingMsg = document.getElementById("loading-msg");
    if(loadingMsg) loadingMsg.style.display = "none";
    const emptyMsg = document.getElementById("empty-msg");
    if(emptyMsg) {
      const h3 = emptyMsg.querySelector("h3");
      if(h3) h3.textContent = "No fue posible iniciar el panel.";
      const p = emptyMsg.querySelector("p");
      if(p) p.textContent = "Intenta recargar la página.";
      emptyMsg.style.display = "block";
    }
  });
});





