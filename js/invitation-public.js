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
    setupMusicPlayer(inv);

    /* 17. Galería */
    renderGallery(normalizeGalleryUrls(inv.gallery_urls));
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
  var invitationAudio = null;
  var isPlaying       = false;

  function setupMusicPlayer(inv) {
    var player = document.getElementById("inv-music-player");
    var toggleBtn = document.getElementById("inv-music-toggle");
    var titleEl = document.getElementById("inv-music-title");
    var artistEl = document.getElementById("inv-music-artist");

    if (!inv.music_url || !player) {
      if (player) player.style.display = "none";
      return;
    }

    invitationAudio         = new Audio(inv.music_url);
    invitationAudio.preload = "auto";
    invitationAudio.loop    = true;
    invitationAudio.volume  = 0.8;

    if (titleEl) titleEl.textContent = inv.music_title || "Música del evento";
    if (artistEl) artistEl.textContent = inv.music_artist || "";

    player.style.display = "flex";
    document.body.classList.add("has-music-player");

    function toggleAudio() {
      try {
        if (!isPlaying) {
          var playPromise = invitationAudio.play();
          if (playPromise !== undefined) {
            playPromise.then(function() {
              isPlaying = true;
              syncUI(true);
            }).catch(function(err) {
              console.log("Audio play blocked", err);
            });
          }
        } else {
          invitationAudio.pause();
          isPlaying = false;
          syncUI(false);
        }
      } catch (err) {
        console.error("Error toggling audio:", err);
      }
    }

    function syncUI(playing) {
      if (playing) {
        if (toggleBtn) toggleBtn.textContent = "❚❚";
      } else {
        if (toggleBtn) toggleBtn.textContent = "▶";
      }
    }

    if (toggleBtn) toggleBtn.addEventListener("click", toggleAudio);

    invitationAudio.addEventListener("ended", function () {
      isPlaying = false;
      syncUI(false);
    });

    invitationAudio.addEventListener("error", function (event) {
      console.error("Error cargando audio:", event, "URL:", inv.music_url);
    });
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

    // IntersectionObserver para fade-in suave al hacer scroll
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      container.querySelectorAll(".inv-gallery-item").forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback sin IntersectionObserver
      container.querySelectorAll(".inv-gallery-item").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
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
      } catch {
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

    if (!items.length) {
      section.style.display = "none";
      container.innerHTML = "";
      return;
    }

    section.style.display = "block";

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
