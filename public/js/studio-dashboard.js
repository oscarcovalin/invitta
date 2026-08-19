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

  let allInvitations = [];
  const searchInput = document.getElementById("search-input");
  const statusFilter = document.getElementById("status-filter");
  const eventTypeFilter = document.getElementById("event-type-filter");
  const sortFilter = document.getElementById("sort-filter");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");
  const filtersContainer = document.getElementById("dashboard-filters");
  const filterResultsMsg = document.getElementById("filter-results-msg");

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
        const existingPlanesLink = document.getElementById("admin-planes-link");
        if (existingPlanesLink) existingPlanesLink.remove();
        return;
      }

      salesRequestsLink.hidden = false;

      // Enlace para operadores a administración de planes y créditos
      if (salesRequestsLink.parentNode && !document.getElementById("admin-planes-link")) {
        const adminPlanesLink = document.createElement("a");
        adminPlanesLink.id = "admin-planes-link";
        adminPlanesLink.href = "/administracion/studio-admin-planes.html";
        adminPlanesLink.className = "studio-nav-item";
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("viewBox", "0 0 24 24");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("d", "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z");
        svg.appendChild(path);
        
        adminPlanesLink.appendChild(svg);
        adminPlanesLink.appendChild(document.createTextNode("Planes y Créditos"));
        salesRequestsLink.parentNode.appendChild(adminPlanesLink);
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

  async function loadStudioCredits(studioId) {
    const kpiCredits = document.getElementById("kpi-credits");
    const kpiPlanInfo = document.getElementById("kpi-plan-info");
    const newInvitationBtn = document.getElementById("new-invitation-btn");
    const creditsAlert = document.getElementById("studio-credits-alert");

    if (!studioId || !kpiCredits) return;

    try {
      const { data, error } = await db
        .from("studios")
        .select("plan_tier, available_credits, used_credits")
        .eq("id", studioId)
        .single();

      if (error) {
        console.warn("No se pudieron consultar los créditos del estudio:", error);
        kpiCredits.textContent = "Créditos no disponibles";
        if (kpiPlanInfo) kpiPlanInfo.textContent = "Plan: - | Usados: -";
        return;
      }

      const available = typeof data?.available_credits === "number" ? data.available_credits : 0;
      const used = typeof data?.used_credits === "number" ? data.used_credits : 0;
      const plan = String(data?.plan_tier || "beta").trim();

      kpiCredits.textContent = String(available);
      if (kpiPlanInfo) {
        kpiPlanInfo.textContent = `Plan: ${plan} | Usados: ${used}`;
      }

      // Estados visuales de la tarjeta KPI según cantidad de créditos
      kpiCredits.classList.remove("kpi-success", "kpi-warning", "kpi-danger");
      if (available > 2) {
        kpiCredits.classList.add("kpi-success");
      } else if (available > 0) {
        kpiCredits.classList.add("kpi-warning");
      } else {
        kpiCredits.classList.add("kpi-danger");
      }

      // Deshabilitar visualmente el botón si no hay créditos disponibles
      if (newInvitationBtn) {
        if (available <= 0) {
          newInvitationBtn.classList.add("btn-disabled");
          newInvitationBtn.textContent = "Sin créditos";
          newInvitationBtn.setAttribute("aria-disabled", "true");
          newInvitationBtn.title = "No tienes créditos disponibles. Contacta a soporte para recargar.";
          newInvitationBtn.onclick = (e) => {
            e.preventDefault();
            alert("No tienes créditos disponibles para crear una nueva invitación. Contacta a soporte para recargar.");
          };

          if (creditsAlert) {
            creditsAlert.style.display = "flex";
          }
        } else {
          newInvitationBtn.classList.remove("btn-disabled");
          newInvitationBtn.textContent = "+ Nueva Invitación";
          newInvitationBtn.removeAttribute("aria-disabled");
          newInvitationBtn.removeAttribute("title");
          newInvitationBtn.onclick = null;
          if (creditsAlert) {
            creditsAlert.style.display = "none";
          }
        }
      }
    } catch (err) {
      console.warn("Error al consultar créditos:", err);
      if (kpiCredits) kpiCredits.textContent = "Créditos no disponibles";
      if (kpiPlanInfo) kpiPlanInfo.textContent = "Plan: - | Usados: -";
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

  function parseLocalDate(value) {
    if (!value) return new Date(NaN);
    const str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split("-").map(Number);
      return new Date(year, month - 1, day, 12, 0, 0);
    }
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
    }
    return d;
  }

  function getInvitationTimeStatus(inv) {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // normalizar a mediodía local
    const timeStatus = [];

    if (inv.event_date) {
      const evDate = parseLocalDate(inv.event_date);
      if (!Number.isNaN(evDate.getTime())) {
        const diffDays = Math.ceil((evDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          timeStatus.push({ text: "Evento vencido", type: "danger" });
        } else if (diffDays <= 30) {
          timeStatus.push({ text: "Evento próximo", type: "warning" });
        }
      }
    }

    if (inv.published && inv.expires_at) {
      const expDate = parseLocalDate(inv.expires_at);
      if (!Number.isNaN(expDate.getTime())) {
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          timeStatus.push({ text: "Publicación vencida", type: "danger" });
        } else if (diffDays <= 30) {
          timeStatus.push({ text: "Publicación por vencer", type: "warning" });
        }
      }
    }
    return timeStatus;
  }

  function getInvitationWarnings(inv) {
    const warnings = [];
    if (!inv.main_photo_url) warnings.push({ text: "Falta foto principal", type: "warning" });
    if (!inv.music_url) warnings.push({ text: "Falta música", type: "warning" });
    
    if (countArrayValues(inv.gallery_urls, 10) === 0) {
      warnings.push({ text: "Falta galería", type: "warning" });
    }

    if (!inv.event_date) warnings.push({ text: "Sin fecha de evento", type: "warning" });
    if (!inv.template_id) warnings.push({ text: "Sin plantilla clara", type: "warning" });
    if (!inv.evento_id) warnings.push({ text: "Invitados no preparados", type: "info" });

    return warnings;
  }

  function getInvitationHealth(inv) {
    const health = [];
    if (inv.published) {
      health.push({ text: "Publicada", type: "success" });
    } else {
      health.push({ text: "Borrador", type: "info" });
    }
    return health;
  }

  function createStatusPanel(inv) {
    const healthArr = getInvitationHealth(inv);
    const timeArr = getInvitationTimeStatus(inv);
    const warnArr = getInvitationWarnings(inv);

    const combined = [...healthArr, ...timeArr, ...warnArr];
    if (combined.length === 0) return null;

    const panel = document.createElement("div");
    panel.className = "card-health";

    const row = document.createElement("div");
    row.className = "card-health-row";

    const MAX_CHIPS = 3;
    let chipsToShow = combined.slice(0, MAX_CHIPS);
    let remaining = combined.length - MAX_CHIPS;

    chipsToShow.forEach(chip => {
      const span = document.createElement("span");
      span.className = "card-health-chip " + chip.type;
      span.textContent = chip.text;
      row.appendChild(span);
    });

    if (remaining > 0) {
      const span = document.createElement("span");
      span.className = "card-health-chip info";
      span.textContent = "+ " + remaining + " pendientes más";
      row.appendChild(span);
    }

    panel.appendChild(row);

    const nextStep = document.createElement("p");
    nextStep.className = "card-next-step";
    
    let nextText = "Siguiente paso: editar contenido";
    if (warnArr.some(w => w.text === "Invitados no preparados") && inv.published) {
      nextText = "Siguiente paso: preparar invitados";
    } else if (timeArr.some(t => t.type === "danger")) {
      nextText = "Revisar publicación";
    } else if (inv.published && warnArr.length === 0) {
      nextText = "Lista para compartir";
    } else if (!inv.published && warnArr.length === 0) {
      nextText = "Lista para publicar";
    }
    
    nextStep.textContent = nextText;
    panel.appendChild(nextStep);

    return panel;
  }

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
      const expiration = parseLocalDate(inv.expires_at);
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

    const statusPanel = createStatusPanel(inv);
    if (statusPanel) {
      item.appendChild(statusPanel);
    }

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

    // Cargar créditos y plan del estudio
    await loadStudioCredits(currentStudioId);

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
        .select("id, title, slug, event_type, event_date, published, published_at, expires_at, main_photo_url, music_url, gallery_urls, font_preset, itinerary, template_id, evento_id, created_at")
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

    allInvitations = invitations || [];
    initializeFilters(allInvitations);
    renderInvitations(allInvitations, false);
  }

  function initializeFilters(invs) {
    if (invs.length === 0) {
      if (filtersContainer) filtersContainer.style.display = "none";
      return;
    }
    if (filtersContainer) filtersContainer.style.display = "flex";

    if (eventTypeFilter) {
      const types = new Set();
      invs.forEach(inv => {
        if (inv.event_type) {
          types.add(inv.event_type.trim());
        }
      });
      
      while (eventTypeFilter.options.length > 1) {
        eventTypeFilter.remove(1);
      }
      
      const sortedTypes = Array.from(types).sort();
      sortedTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        eventTypeFilter.appendChild(option);
      });
    }

    if (!filtersContainer.dataset.initialized) {
      if (searchInput) searchInput.addEventListener("input", applyFilters);
      if (statusFilter) statusFilter.addEventListener("change", applyFilters);
      if (eventTypeFilter) eventTypeFilter.addEventListener("change", applyFilters);
      if (sortFilter) sortFilter.addEventListener("change", applyFilters);
      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", () => {
          if (searchInput) searchInput.value = "";
          if (statusFilter) statusFilter.value = "all";
          if (eventTypeFilter) eventTypeFilter.value = "all";
          if (sortFilter) sortFilter.value = "recent";
          applyFilters();
        });
      }
      filtersContainer.dataset.initialized = "true";
    }
  }

  function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const statusVal = statusFilter ? statusFilter.value : "all";
    const typeVal = eventTypeFilter ? eventTypeFilter.value : "all";
    const sortVal = sortFilter ? sortFilter.value : "recent";

    const filtered = allInvitations.filter(inv => {
      let matchesSearch = true;
      if (searchTerm) {
        const title = (inv.title || "").toLowerCase();
        const slug = (inv.slug || "").toLowerCase();
        const eventType = (inv.event_type || "").toLowerCase();
        matchesSearch = title.includes(searchTerm) || slug.includes(searchTerm) || eventType.includes(searchTerm);
      }

      let matchesStatus = true;
      if (statusVal === "published") matchesStatus = inv.published === true;
      else if (statusVal === "draft") matchesStatus = inv.published !== true;

      let matchesType = true;
      if (typeVal !== "all") {
        matchesType = (inv.event_type || "").trim() === typeVal;
      }

      return matchesSearch && matchesStatus && matchesType;
    });

    const sorted = filtered.slice().sort((a, b) => {
      if (sortVal === "oldest") {
        if (a.created_at && b.created_at) return new Date(a.created_at) - new Date(b.created_at);
        return 0;
      } else if (sortVal === "date-asc") {
        if (!a.event_date) return 1;
        if (!b.event_date) return -1;
        const da = parseLocalDate(a.event_date);
        const db = parseLocalDate(b.event_date);
        return da - db;
      } else if (sortVal === "date-desc") {
        if (!a.event_date) return 1;
        if (!b.event_date) return -1;
        const da = parseLocalDate(a.event_date);
        const db = parseLocalDate(b.event_date);
        return db - da;
      } else if (sortVal === "a-z") {
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return titleA.localeCompare(titleB);
      } else if (sortVal === "z-a") {
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return titleB.localeCompare(titleA);
      } else if (sortVal === "published-first") {
        if (a.published === b.published) return 0;
        return a.published ? -1 : 1;
      } else if (sortVal === "drafts-first") {
        if (a.published === b.published) return 0;
        return a.published ? 1 : -1;
      }
      
      // recent (default)
      if (a.created_at && b.created_at) return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });

    renderInvitations(sorted, true);
  }

  function renderInvitations(invitationsToRender, isFiltering = false) {
    const listContainer = document.getElementById("invitation-list");
    const emptyMsg = document.getElementById("empty-msg");
    
    if (listContainer) listContainer.replaceChildren();

    if (invitationsToRender.length === 0) {
      if (emptyMsg) {
        const h3 = emptyMsg.querySelector("h3");
        const p = emptyMsg.querySelector("p");
        if (isFiltering) {
          if (h3) h3.textContent = "No encontramos invitaciones con esos filtros.";
          if (p) p.textContent = "Intenta con otros términos o estados.";
        } else {
          if (h3) h3.textContent = "No tienes invitaciones creadas";
          if (p) p.textContent = "Empieza ahora y diseña tu primer evento.";
        }
        emptyMsg.style.display = "block";
      }
      if (filterResultsMsg) filterResultsMsg.style.display = "none";
      return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";

    if (isFiltering && filterResultsMsg) {
      filterResultsMsg.textContent = `Mostrando ${invitationsToRender.length} de ${allInvitations.length} invitaciones.`;
      filterResultsMsg.style.display = "block";
    } else if (filterResultsMsg) {
      filterResultsMsg.style.display = "none";
    }

    const fragment = document.createDocumentFragment();
    invitationsToRender.forEach(inv => {
      const item = createInvitationItem(inv);
      fragment.appendChild(item);
    });
    if (listContainer) listContainer.appendChild(fragment);
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





