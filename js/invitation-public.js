/**
 * invitation-public.js
 * Invitta Studio — Página pública de invitación
 *
 * URL: /invitacion.html?slug=paola-xv&n=Familia+Garcia&p=4&m=5
 * Tabla: studio_invitations (SELECT anon, published = true)
 *
 * Solo lectura. No modifica tablas. No requiere autenticación.
 *
 * NOTA: Este script se carga al final del <body>, por lo que el DOM ya
 * está listo. No se usa DOMContentLoaded para evitar que el evento
 * ya haya disparado antes de que se registre el listener.
 */

(function () {
  "use strict";

  /* ─── Supabase ────────────────────────────────────────────────────── */
  const SUPABASE_URL = (window.INVITTIA_ENV && window.INVITTIA_ENV.SUPABASE_URL)    || "";
  const SUPABASE_KEY = (window.INVITTIA_ENV && window.INVITTIA_ENV.SUPABASE_ANON_KEY) || "";

  let db;
  try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    console.error("Error al inicializar Supabase:", e);
    showError("No se pudo inicializar la conexión. Recarga la página.");
    return;
  }

  /* ─── Parámetros de URL ───────────────────────────────────────────── */
  var params    = new URLSearchParams(window.location.search);
  var slug      = params.get("slug") || "";
  var guestName = sanitize(params.get("n") || "");
  var maxPasses = clampInt(params.get("p"), 1, 20);
  var tableNum  = sanitize(params.get("m") || "");

  /* ─── Iniciar ────────────────────────────────────────────────────── */
  if (!slug) {
    showError("No se encontró el slug de la invitación.");
  } else {
    loadInvitation();
  }

  /* ─── Carga ───────────────────────────────────────────────────────── */
  async function loadInvitation() {
    try {
      console.log("slug recibido:", slug);

      var result = await db
        .from("studio_invitations")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      var data  = result.data;
      var error = result.error;

      console.log("data invitación:", data);
      console.log("error Supabase:", error);

      if (error) {
        console.error("Error real de Supabase:", error);
        showError("Error al consultar la invitación.");
        return;
      }

      if (!data) {
        showError("Invitación no encontrada o no publicada.");
        return;
      }

      console.log("Antes de renderInvitation");
      renderInvitation(data);
      console.log("Después de renderInvitation");

    } catch (err) {
      console.error("Error real en loadInvitation:", err);
      showError("Ocurrió un error al cargar la invitación. Revisa la consola.");
    }
  }

  /* ─── Renderizado ─────────────────────────────────────────────────── */
  function renderInvitation(inv) {
    /* 1. Mostrar contenido */
    var loader  = document.getElementById("inv-loader");
    var errBox  = document.getElementById("inv-error");
    var content = document.getElementById("inv-content");

    if (loader)  loader.style.display  = "none";
    if (errBox)  { errBox.style.display = "none"; errBox.textContent = ""; }
    if (content) content.style.display  = "block";

    /* 2. Tema de color y Tipografía */
    applyTheme(inv.color_primary || "#C9A46A", inv.color_secondary || "#F7E7D7");

    var allowedPresets = ["classic", "romantic", "editorial", "minimal", "luxury"];
    var preset = inv.font_preset;
    if (!allowedPresets.includes(preset)) preset = "classic";
    document.body.classList.add("font-preset-" + preset);

    /* 3. Hero: título, honoree, fecha */
    setText("inv-title",   inv.title        || "Invitación");
    setText("inv-honoree", inv.honoree_name || "");

    // Fecha formateada en el hero
    var heroDateStr = formatDateShort(inv.event_date);
    var timeStr     = formatTime(inv.event_time);
    if (heroDateStr) {
      var heroDate = document.getElementById("inv-hero-date");
      if (heroDate) {
        heroDate.textContent = timeStr ? heroDateStr + "  ·  " + timeStr : heroDateStr;
        heroDate.style.display = "";
      }
    }

    /* 4. Fecha larga en card */
    setText("inv-date", formatDate(inv.event_date));
    toggle("inv-time-block", !!timeStr);
    setText("inv-time", timeStr);

    /* 5. Datos del invitado (ticket) */
    setText("inv-guest-name", guestName || "Estimado Invitado");
    setText("inv-pases",      String(maxPasses));
    setText("inv-mesa",       tableNum  || "—");
    toggle("inv-mesa-block",  !!tableNum);

    // Fecha corta en ticket
    var ticketDate = document.getElementById("inv-ticket-date");
    if (ticketDate) {
      ticketDate.textContent = formatDateShort(inv.event_date) || "—";
    }

    /* 6. Selector de confirmación */
    buildPassSelector(maxPasses);

    /* 7. Mensaje de bienvenida */
    toggle("inv-welcome-block", !!inv.welcome_text);
    setText("inv-welcome", inv.welcome_text || "");

    /* Padres y Padrinos */
    var hasParents = inv.father_name || inv.mother_name;
    var hasGodparents = inv.godparents && inv.godparents.length > 0;
    toggle("inv-parents-block", hasParents || hasGodparents);
    
    if (inv.father_name) {
      setText("inv-father-name", inv.father_name);
      show("inv-father-name");
    } else {
      hide("inv-father-name");
    }
    if (inv.mother_name) {
      setText("inv-mother-name", inv.mother_name);
      show("inv-mother-name");
    } else {
      hide("inv-mother-name");
    }

    if (hasGodparents) {
      show("inv-godparents-wrapper");
      var gpList = document.getElementById("inv-godparents-list");
      if (gpList) {
        gpList.innerHTML = "";
        inv.godparents.forEach(function(gp) {
          var li = document.createElement("li");
          var roleDiv = document.createElement("div");
          roleDiv.className = "inv-godparent-role";
          roleDiv.textContent = gp.role || "Padrinos";
          var nameDiv = document.createElement("div");
          nameDiv.className = "inv-godparent-name";
          nameDiv.textContent = gp.name;
          li.appendChild(roleDiv);
          li.appendChild(nameDiv);
          gpList.appendChild(li);
        });
      }
    } else {
      hide("inv-godparents-wrapper");
    }

    /* Itinerario */
    renderItinerary(inv.itinerary);

    /* Hashtag */
    toggle("inv-hashtag-block", !!inv.instagram_hashtag);
    setText("inv-hashtag", inv.instagram_hashtag || "");

    /* 8. Ceremonia */
    var hasCeremony = !!(inv.ceremony_name || inv.ceremony_address);
    toggle("inv-ceremony-block", hasCeremony);
    if (hasCeremony) {
      setText("inv-ceremony-name",    inv.ceremony_name    || "Ceremonia");
      setText("inv-ceremony-address", inv.ceremony_address || "");
      if (inv.ceremony_map_url) {
        setHref("inv-ceremony-map-btn", inv.ceremony_map_url);
        show("inv-ceremony-map-btn");
      } else {
        hide("inv-ceremony-map-btn");
      }
    }

    /* 9. Recepción */
    var hasReception = !!(inv.reception_name || inv.reception_address);
    toggle("inv-reception-block", hasReception);
    if (hasReception) {
      setText("inv-reception-name",    inv.reception_name    || "Recepción");
      setText("inv-reception-address", inv.reception_address || "");
      if (inv.reception_map_url) {
        setHref("inv-reception-map-btn", inv.reception_map_url);
        show("inv-reception-map-btn");
      } else {
        hide("inv-reception-map-btn");
      }
    }

    /* 10. Dress code */
    toggle("inv-dresscode-block", !!inv.dress_code);
    setText("inv-dresscode", inv.dress_code || "");

    /* 11. Mesa de regalos */
    toggle("inv-gifts-block", !!inv.gift_table_url);
    if (inv.gift_table_url) {
      setHref("inv-gifts-link", inv.gift_table_url);
    }

    /* 12. WhatsApp */
    buildWhatsAppButton(inv);

    /* 13. Título de pestaña */
    document.title = (inv.title || "Invitación Digital") + " · Invitta";

    /* 14. Foto principal (hero) */
    renderMainPhoto(inv.main_photo_url);

    /* 15. Cuenta regresiva */
    setupCountdown(inv.event_date, inv.event_time);

    /* 16. Música */
    // Set custom background if exists
    if (inv.background_image_url) {
      document.body.style.backgroundImage = `url('${inv.background_image_url}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.classList.add("has-custom-bg");
    }

    if (typeof setupCalendarButton === "function") {
      setupCalendarButton(inv);
    }

    console.log("music_url:", inv.music_url);
      console.log("music_url:", inv.music_url);
    setupMusicPlayer(inv);

    /* 17. Galería */
    renderGallery(normalizeGalleryUrls(inv.gallery_urls));


    /* 19. Limpieza de elementos legacy de audio en el contenido */
    document.querySelectorAll("#inv-content audio, #inv-content [id*='music'], #inv-content [class*='music']").forEach((el) => {
      if (el.id !== "inv-music-player") {
        console.warn("Removing legacy inline music element:", el);
        el.remove();
      }
    });

    setTimeout(() => {
      setupRevealAnimations();
    }, 400);
  }

  /* ─── Foto principal (hero) ──────────────────────────────────────── */
  function renderMainPhoto(url) {
    var heroBg   = document.getElementById("inv-hero-bg");
    var heroImg  = document.getElementById("inv-hero-img");
    var hero     = document.getElementById("inv-hero");

    if (!url || !heroBg || !heroImg) return;

    heroImg.src              = url;
    heroBg.style.display     = "block";
    if (hero) hero.classList.add("inv-hero--has-photo");
  }

  /* ─── Calendar Button ────────────────────────────── */
  function setupCalendarButton(inv) {
    var calendarWrap = document.getElementById("inv-calendar-wrapper");
    var calendarBtn = document.getElementById("inv-calendar-btn");
    
    if (!inv.event_date || !calendarWrap || !calendarBtn) return;
    
    var dateStr = inv.event_date.replace(/-/g, "");
    var timeStr = inv.event_time ? inv.event_time.replace(/:/g, "") + "00" : "000000";
    var startDateTime = dateStr + "T" + timeStr;
    var endDate = new Date(inv.event_date + "T" + (inv.event_time || "00:00"));
    endDate.setHours(endDate.getHours() + 5);
    var endDateTime = endDate.toISOString().replace(/[-:]/g, "").split(".")[0];
    
    var title = encodeURIComponent(inv.title || "Evento");
    var details = encodeURIComponent(inv.welcome_text || "");
    var location = encodeURIComponent(inv.ceremony_address || inv.reception_address || "");
    
    var googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
    calendarBtn.href = googleCalendarUrl;
    calendarWrap.style.display = "block";
  }

  /* ─── Reproductor de música fijo ────────────────────────────── */
  let invitationAudio = null;
  let isMusicPlaying = false;

  function cleanMusicFileName(filename) {
    if (!filename) return "";
    const decoded = decodeURIComponent(filename);
    return decoded
      .replace(/\.(mp3|m4a|wav|ogg)$/i, "")
      .replace(/^\d+[-_]/, "")
      .trim();
  }

  function getMusicTitle(invitation) {
    if (invitation.music_title && invitation.music_title.trim()) {
      return invitation.music_title.trim();
    }

    if (invitation.music_url) {
      try {
        const url = new URL(invitation.music_url);
        const filename = url.pathname.split("/").pop() || "";
        return cleanMusicFileName(filename) || "Música del evento";
      } catch (e) {
        const filename = invitation.music_url.split("/").pop() || "";
        return cleanMusicFileName(filename) || "Música del evento";
      }
    }

    return "Música del evento";
  }

  function forceMusicPlayerStyles(player) {
    if (!player) return;
  
    player.style.setProperty("position", "fixed", "important");
    player.style.setProperty("left", "0", "important");
    player.style.setProperty("right", "0", "important");
    player.style.setProperty("bottom", "0", "important");
    player.style.setProperty("z-index", "99999", "important");
    player.style.setProperty("display", "flex", "important");
    player.style.setProperty("align-items", "center", "important");
    player.style.setProperty("justify-content", "space-between", "important");
    player.style.setProperty("gap", "1rem", "important");
    player.style.setProperty("min-height", "78px", "important");
    player.style.setProperty("width", "100%", "important");
    player.style.setProperty("box-sizing", "border-box", "important");
    player.style.setProperty("padding", "0.8rem 1rem calc(0.8rem + env(safe-area-inset-bottom))", "important");
    player.style.setProperty("background", "rgba(7, 7, 7, 0.97)", "important");
    player.style.setProperty("color", "#fff", "important");
    player.style.setProperty("box-shadow", "0 -14px 28px rgba(0,0,0,.28)", "important");
  }
  
  function forceMusicPlayerChildStyles() {
    const left = document.querySelector("#inv-music-player .inv-music-left");
    const logo = document.querySelector("#inv-music-player .inv-music-logo");
    const logoText = document.querySelector("#inv-music-player .inv-music-logo span");
    const meta = document.querySelector("#inv-music-player .inv-music-meta");
    const title = document.querySelector("#inv-music-title");
    const artist = document.querySelector("#inv-music-artist");
    const toggle = document.querySelector("#inv-music-toggle");
  
    if (left) {
      left.style.setProperty("display", "flex", "important");
      left.style.setProperty("align-items", "center", "important");
      left.style.setProperty("gap", "0.85rem", "important");
      left.style.setProperty("min-width", "0", "important");
      left.style.setProperty("flex", "1", "important");
    }
  
    if (logo) {
      logo.style.setProperty("width", "56px", "important");
      logo.style.setProperty("height", "56px", "important");
      logo.style.setProperty("border-radius", "999px", "important");
      logo.style.setProperty("border", "1px solid rgba(212, 181, 122, 0.65)", "important");
      logo.style.setProperty("display", "grid", "important");
      logo.style.setProperty("place-items", "center", "important");
      logo.style.setProperty("color", "#d4b57a", "important");
      logo.style.setProperty("flex", "0 0 auto", "important");
      logo.style.setProperty("background", "rgba(255,255,255,0.03)", "important");
    }
  
    if (logoText) {
      logoText.style.setProperty("font-size", "1.35rem", "important");
      logoText.style.setProperty("line-height", "1", "important");
      logoText.style.setProperty("color", "#d4b57a", "important");
    }
  
    if (meta) {
      meta.style.setProperty("min-width", "0", "important");
      meta.style.setProperty("text-align", "left", "important");
    }
  
    if (title) {
      title.style.setProperty("margin", "0", "important");
      title.style.setProperty("color", "#fff", "important");
      title.style.setProperty("font-size", "1rem", "important");
      title.style.setProperty("line-height", "1.2", "important");
      title.style.setProperty("white-space", "nowrap", "important");
      title.style.setProperty("overflow", "hidden", "important");
      title.style.setProperty("text-overflow", "ellipsis", "important");
    }
  
    if (artist) {
      artist.style.setProperty("display", "block", "important");
      artist.style.setProperty("margin-top", "0.15rem", "important");
      artist.style.setProperty("color", "rgba(255,255,255,0.82)", "important");
      artist.style.setProperty("font-size", "0.82rem", "important");
      artist.style.setProperty("line-height", "1.2", "important");
      artist.style.setProperty("white-space", "nowrap", "important");
      artist.style.setProperty("overflow", "hidden", "important");
      artist.style.setProperty("text-overflow", "ellipsis", "important");
    }
  
    if (toggle) {
      toggle.style.setProperty("width", "58px", "important");
      toggle.style.setProperty("height", "58px", "important");
      toggle.style.setProperty("border", "none", "important");
      toggle.style.setProperty("background", "transparent", "important");
      toggle.style.setProperty("color", "#fff", "important");
      toggle.style.setProperty("font-size", "2rem", "important");
      toggle.style.setProperty("display", "grid", "important");
      toggle.style.setProperty("place-items", "center", "important");
      toggle.style.setProperty("cursor", "pointer", "important");
      toggle.style.setProperty("flex", "0 0 auto", "important");
      toggle.style.setProperty("padding", "0", "important");
      toggle.style.setProperty("margin", "0", "important");
    }
  }

  function setupMusicPlayer(invitation) {
    const player = document.getElementById("inv-music-player");
    const toggle = document.getElementById("inv-music-toggle");
    const title = document.getElementById("inv-music-title");
    const artist = document.getElementById("inv-music-artist");

    if (!player || !toggle) {
      console.warn("Music player DOM missing");
      return;
    }

    if (!invitation.music_url) {
      player.style.display = "none";
      document.body.classList.remove("has-music-player");
      return;
    }

    if (player.parentElement && player.parentElement.id === "inv-content") {
      document.body.appendChild(player);
    }

    player.style.setProperty("display", "flex", "important");
    forceMusicPlayerStyles(player);
    forceMusicPlayerChildStyles();
    document.body.classList.add("has-music-player");

    console.log("Music player computed display:", window.getComputedStyle(player).display);
    console.log("Music player position:", window.getComputedStyle(player).position);
    console.log("Music player bottom:", window.getComputedStyle(player).bottom);

    if (title) title.textContent = getMusicTitle(invitation);
    if (artist) artist.textContent = invitation.music_artist ? `~ ${invitation.music_artist} ~` : "";

    if (invitationAudio) {
      invitationAudio.pause();
      invitationAudio = null;
    }

    invitationAudio = new Audio(invitation.music_url);
    invitationAudio.preload = "auto";
    invitationAudio.loop = true;
    invitationAudio.volume = 0.85;

    isMusicPlaying = false;
    toggle.innerHTML = '<span class="inv-play-icon">▶</span>';
    toggle.disabled = false;

    toggle.onclick = async () => {
      try {
        if (!isMusicPlaying) {
          await invitationAudio.play();
          isMusicPlaying = true;
          toggle.innerHTML = '<span class="inv-play-icon">❚❚</span>';
          toggle.setAttribute("aria-label", "Pausar música");
        } else {
          invitationAudio.pause();
          isMusicPlaying = false;
          toggle.innerHTML = '<span class="inv-play-icon">▶</span>';
          toggle.setAttribute("aria-label", "Reproducir música");
        }
      } catch (err) {
        console.error("Error reproduciendo música:", err);
        alert("No se pudo reproducir la música. Verifica que el archivo sea compatible.");
      }
    };
  }

  /* ─── Cuenta regresiva ────────────────────────────── */
  function setupCountdown(eventDate, eventTime) {
    var section = document.getElementById("inv-countdown-section");
    if (!section || !eventDate) {
      if (section) section.style.display = "none";
      return;
    }

    var dateParts = eventDate.split("-").map(Number);
    var timeParts = (eventTime || "00:00").split(":").map(Number);
    var year      = dateParts[0];
    var month     = dateParts[1];
    var day       = dateParts[2];
    var hours     = timeParts[0] || 0;
    var minutes   = timeParts[1] || 0;

    var targetDate = new Date(year, month - 1, day, hours, minutes, 0);

    function updateCountdown() {
      var now  = new Date();
      var diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        section.innerHTML = "<p class='inv-countdown-today'>✨ Hoy es el gran día ✨</p>";
        clearInterval(timer);
        return;
      }

      var totalSeconds = Math.floor(diff / 1000);
      var days         = Math.floor(totalSeconds / (60 * 60 * 24));
      var hoursLeft    = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
      var minutesLeft  = Math.floor((totalSeconds % (60 * 60)) / 60);
      var secondsLeft  = totalSeconds % 60;

      var dEl = document.getElementById("cd-days");
      var hEl = document.getElementById("cd-hours");
      var mEl = document.getElementById("cd-minutes");
      var sEl = document.getElementById("cd-seconds");

      if (dEl) dEl.textContent = days;
      if (hEl) hEl.textContent = String(hoursLeft).padStart(2, "0");
      if (mEl) mEl.textContent = String(minutesLeft).padStart(2, "0");
      if (sEl) sEl.textContent = String(secondsLeft).padStart(2, "0");
    }

    section.style.display = "";
    updateCountdown();
    var timer = setInterval(updateCountdown, 1000);
  }

  /* ─── Galería ────────────────────────────────── */

  /** Normaliza gallery_urls: array | JSON string | null → string[] */
  function normalizeGalleryUrls(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).slice(0, 10);
    try {
      var parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 10) : [];
    } catch (e) { return []; }
  }

  /** Renderiza la galería de fotos con efecto scroll editorial */
  function renderGallery(urls) {
    var section   = document.getElementById("inv-gallery-section");
    var container = document.getElementById("inv-gallery");
    if (!section || !container) return;

    if (!urls || urls.length === 0) {
      section.style.display = "none";
      return;
    }

    section.style.display = "";
    container.innerHTML   = "";

    urls.forEach(function (url, index) {
      var item = document.createElement("div");
      item.className   = "inv-gallery-item " + (index % 2 === 0 ? "is-left" : "is-right");
      item.setAttribute("role", "listitem");

      var img       = document.createElement("img");
      img.src       = url;
      img.alt       = "Fotografía del evento";
      img.loading   = "lazy";
      img.decoding  = "async";

      var caption   = document.createElement("div");
      caption.className = "inv-gallery-caption";
      caption.setAttribute("aria-hidden", "true");

      item.appendChild(img);
      item.appendChild(caption);
      container.appendChild(item);
    });


  }

  /* ─── Selector de pases ───────────────────────────────────────────── */
  function buildPassSelector(max) {
    var sel = document.getElementById("inv-confirm-pases");
    if (!sel) return;
    sel.innerHTML = "";
    for (var i = 1; i <= max; i++) {
      var opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i === 1 ? "1 persona" : i + " personas";
      sel.appendChild(opt);
    }
  }

  /* ─── WhatsApp ────────────────────────────────────────────────────── */
  function buildWhatsAppButton(inv) {
    var phone = (inv.whatsapp_number || "").replace(/\D/g, "");
    if (!phone) {
      hide("inv-wa-block");
      return;
    }
    show("inv-wa-block");

    var btn = document.getElementById("inv-wa-btn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var selected = (document.getElementById("inv-confirm-pases") || {}).value || maxPasses;
      var title    = inv.title || "el evento";
      var mesa     = tableNum ? "\nMesa: " + tableNum : "";

      var msg =
        "Hola, confirmo mi asistencia al evento " + title + ".\n\n" +
        "Invitado: " + (guestName || "Invitado") + "\n" +
        "Pases confirmados: " + selected + "\n" +
        "Pases asignados: " + maxPasses +
        mesa;

      window.open(
        "https://wa.me/" + phone + "?text=" + encodeURIComponent(msg),
        "_blank",
        "noopener,noreferrer"
      );
    });
  }

  /* ─── showError ───────────────────────────────────────────────────── */
  function showError(message) {
    console.trace("showError llamado con:", message);
    var loader  = document.getElementById("inv-loader");
    var content = document.getElementById("inv-content");
    var errBox  = document.getElementById("inv-error");
    if (loader)  loader.style.display  = "none";
    if (content) content.style.display = "none";
    if (errBox) {
      errBox.textContent   = message;
      errBox.style.display = "block";
    }
  }

  /* ─── Tema de colores ─────────────────────────────────────────────── */
  function applyTheme(primary, secondary) {
    var root = document.documentElement;
    root.style.setProperty("--inv-primary",        primary);
    root.style.setProperty("--inv-primary-light",  hexAlpha(primary, 0.12));
    root.style.setProperty("--inv-primary-border", hexAlpha(primary, 0.30));
    root.style.setProperty("--inv-secondary",      secondary);
  }

  /* ─── Helpers DOM ─────────────────────────────────────────────────── */
  function setText(id, val) {
    var e = document.getElementById(id);
    if (e) e.textContent = String(val);
  }

  function setHref(id, href) {
    var e = document.getElementById(id);
    if (e) e.href = href;
  }

  function show(id) {
    var e = document.getElementById(id);
    if (e) e.style.display = "";
  }

  function hide(id) {
    var e = document.getElementById(id);
    if (e) e.style.display = "none";
  }

  function toggle(id, cond) {
    var e = document.getElementById(id);
    if (e) e.style.display = cond ? "" : "none";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeItinerary(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter(item => item && (item.title || item.time));
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.filter(item => item && (item.title || item.time))
          : [];
      } catch (err) {
        console.warn("No se pudo parsear itinerary:", err, value);
        return [];
      }
    }
    return [];
  }

  function renderItinerary(value) {
    const section = document.getElementById("inv-itinerary-section");
    const container = document.getElementById("inv-itinerary");

    if (!section || !container) return;

    const items = normalizeItinerary(value);
    console.log("itinerary raw:", value);
    console.log("itinerary normalized:", items);

    if (!items.length) {
      section.style.display = "none";
      container.innerHTML = "";
      return;
    }

    section.style.setProperty("display", "block", "important");
    section.style.setProperty("visibility", "visible", "important");
    section.style.setProperty("opacity", "1", "important");

    container.innerHTML = items.map((item, index) => `
      <div class="inv-timeline-item">
        <div class="inv-timeline-marker">
          <span>${String(index + 1).padStart(2, "0")}</span>
        </div>
        <div class="inv-timeline-content">
          ${item.time ? `<p class="inv-timeline-time">${escapeHtml(item.time)}</p>` : ""}
          <h3>${escapeHtml(item.title || "")}</h3>
        </div>
      </div>
    `).join("");

    console.log("Timeline section display:", window.getComputedStyle(section).display);
    console.log("Timeline section visibility:", window.getComputedStyle(section).visibility);
    console.log("Timeline container HTML:", container.innerHTML);
    console.log("Timeline section:", document.getElementById("inv-itinerary-section"));
    console.log("Timeline items count:", document.querySelectorAll(".inv-timeline-item").length);
  }

  /* ─── Helpers texto / números ─────────────────────────────────────── */
  function sanitize(str) {
    return String(str || "").trim().slice(0, 200);
  }

  function clampInt(val, min, max) {
    var n = parseInt(val, 10);
    return isNaN(n) ? min : Math.min(Math.max(n, min), max);
  }

  function parseLocalDate(dateString) {
    if (!dateString) return null;
    var parts = dateString.split("-").map(Number);
    if (!parts[0] || !parts[1] || !parts[2]) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  /** Fecha larga: "sábado, 14 de febrero de 2026" */
  function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      return parseLocalDate(dateStr).toLocaleDateString("es-MX", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    } catch (e) { return dateStr; }
  }

  /** Fecha corta: "14 Feb 2026" */
  function formatDateShort(dateStr) {
    if (!dateStr) return "";
    try {
      return parseLocalDate(dateStr).toLocaleDateString("es-MX", {
        day: "numeric", month: "short", year: "numeric"
      });
    } catch (e) { return dateStr; }
  }

  function formatTime(timeStr) {
    if (!timeStr) return "";
    try {
      var parts = timeStr.split(":");
      var d = new Date();
      d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0);
      return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return timeStr; }
  }

  /* ─── Color helper ────────────────────────────────────────────────── */
  function hexAlpha(hex, a) {
    var h = hex || "#C9A46A";
    var r = parseInt(h.slice(1, 3), 16) || 0;
    var g = parseInt(h.slice(3, 5), 16) || 0;
    var b = parseInt(h.slice(5, 7), 16) || 0;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

})();

function setupRevealAnimations() {
  console.log("setupRevealAnimations classic rose subtle mode");

  const selectors = [
    ".inv-hero-content",
    ".inv-countdown-section",
    "#inv-countdown-section",
    "#inv-parents-block",
    "#inv-welcome-block",
    ".inv-gallery-item",
    "#inv-ceremony-block",
    "#inv-reception-block",
    "#inv-itinerary-section",
    "#inv-dresscode-block",
    "#inv-gifts-block",
    "#inv-hashtag-block",
    "#inv-pass-section",
    "#inv-rsvp-section",
    "#inv-wa-block"
  ];

  const elements = Array.from(document.querySelectorAll(selectors.join(",")))
    .filter((el) => {
      const style = window.getComputedStyle(el);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !el.closest("#inv-music-player")
      );
    });

  if (!elements.length) return;

  elements.forEach((el, index) => {
    el.dataset.revealed = "false";
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    el.style.willChange = "opacity, transform";
    el.dataset.revealDelay = String(Math.min(index * 60, 240));
  });

  function animateElement(el) {
    if (!el || el.dataset.revealed === "true") return;

    el.dataset.revealed = "true";

    const delay = Number(el.dataset.revealDelay || 0);

    el.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      {
        duration: 760,
        delay,
        easing: "ease-out",
        fill: "forwards"
      }
    );

    const icon = el.querySelector(".inv-card-icon");
    if (icon) {
      icon.animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        {
          duration: 700,
          delay: delay + 90,
          easing: "ease-out",
          fill: "forwards"
        }
      );
    }

    setTimeout(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      el.style.willChange = "auto";
    }, 820 + delay);
  }

  function checkReveal() {
    const triggerPoint = window.innerHeight * 0.92;

    elements.forEach((el) => {
      if (el.dataset.revealed === "true") return;

      const rect = el.getBoundingClientRect();

      if (rect.top < triggerPoint && rect.bottom > 0) {
        animateElement(el);
      }
    });
  }

  setTimeout(checkReveal, 200);
  window.addEventListener("scroll", checkReveal, { passive: true });
  window.addEventListener("resize", checkReveal);
}
