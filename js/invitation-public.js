/**
 * invitation-public.js
 * Invitta Studio â€” PÃ¡gina pÃºblica de invitaciÃ³n
 *
 * URL: /invitacion.html?slug=paola-xv&n=Familia+Garcia&p=4&m=5
 * Tabla: studio_invitations (SELECT anon, published = true)
 *
 * Solo lectura. No modifica tablas. No requiere autenticaciÃ³n.
 *
 * NOTA: Este script se carga al final del <body>, por lo que el DOM ya
 * estÃ¡ listo. No se usa DOMContentLoaded para evitar que el evento
 * ya haya disparado antes de que se registre el listener.
 */

(function () {
  "use strict";

  /* â”€â”€â”€ Supabase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const SUPABASE_URL = (window.INVITTIA_ENV && window.INVITTIA_ENV.SUPABASE_URL)    || "";
  const SUPABASE_KEY = (window.INVITTIA_ENV && window.INVITTIA_ENV.SUPABASE_ANON_KEY) || "";

  let db;
  try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    console.error("Error al inicializar Supabase:", e);
    showError("No se pudo inicializar la conexiÃ³n. Recarga la pÃ¡gina.");
    return;
  }

  /* â”€â”€â”€ ParÃ¡metros de URL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  var params    = new URLSearchParams(window.location.search);
  var slug      = params.get("slug") || "";
  var guestName = sanitize(params.get("n") || "");
  var maxPasses = clampInt(params.get("p"), 1, 20);
  var tableNum  = sanitize(params.get("m") || "");

  /* â”€â”€â”€ Iniciar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (!slug) {
    showError("No se encontrÃ³ el slug de la invitaciÃ³n.");
  } else {
    loadInvitation();
  }

  /* â”€â”€â”€ Carga â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

      console.log("data invitaciÃ³n:", data);
      console.log("error Supabase:", error);

      if (error) {
        console.error("Error real de Supabase:", error);
        showError("Error al consultar la invitaciÃ³n.");
        return;
      }

      if (!data) {
        showError("InvitaciÃ³n no encontrada o no publicada.");
        return;
      }

      console.log("Antes de renderInvitation");
      renderInvitation(data);
      console.log("DespuÃ©s de renderInvitation");

    } catch (err) {
      console.error("Error real en loadInvitation:", err);
      showError("OcurriÃ³ un error al cargar la invitaciÃ³n. Revisa la consola.");
    }
  }

  function normalizeVisualTheme(value) {
    const allowedThemes = [
      "rose-floral",
      "gold-marble",
      "elegant-lavender",
      "black-luxury",
      "classic-champagne"
    ];
    if (!value || !allowedThemes.includes(value)) {
      return "rose-floral";
    }
    return value;
  }

  function applyVisualTheme(invitation) {
    const visualTheme = normalizeVisualTheme(invitation.visual_theme);
    document.body.classList.remove(
      "theme-rose-floral",
      "theme-gold-marble",
      "theme-elegant-lavender",
      "theme-black-luxury",
      "theme-classic-champagne"
    );
    document.body.classList.add(`theme-${visualTheme}`);
  }

  
  function getSectionIcon(type) {
    const icons = {
      parents: '<svg viewBox="0 0 24 24"><path d="M12 22c4-4 8-8 8-13A6 6 0 0 0 4 9c0 5 4 9 8 13z"/><path d="M12 22V12"/><path d="M12 12c-2-2-4-3-4-3s2 1 4 3z"/><path d="M12 12c2-2 4-3 4-3s-2 1-4 3z"/></svg>',
      ceremony: '<svg viewBox="0 0 24 24"><path d="M12 3L4 9v12h16V9l-8-6z"/><path d="M12 11v10"/><path d="M9 16h6"/></svg>',
      reception: '<svg viewBox="0 0 24 24"><path d="M8 22h8"/><path d="M12 15v7"/><path d="M5 8c0 3.866 3.134 7 7 7s7-3.134 7-7"/><path d="M5 8V4h14v4"/></svg>',
      itinerary: '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
      dresscode: '<svg viewBox="0 0 24 24"><path d="M12 2C8 2 6 5 6 5l-2 4h16l-2-4s-2-3-6-3z"/><path d="M7 9l1 13h8l1-13"/></svg>',
      gifts: '<svg viewBox="0 0 24 24"><path d="M20 12v8H4v-8"/><path d="M4 12h16v-4H4v4z"/><path d="M12 8V4M8 4h8M12 12v10"/></svg>',
      hashtag: '<svg viewBox="0 0 24 24"><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3L8 21"/><path d="M16 3l-2 18"/></svg>',
      pass: '<svg viewBox="0 0 24 24"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/><path d="M22 7l-10 7L2 7"/><path d="M19 16v6"/><path d="M16 19h6"/></svg>',
      rsvp: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><path d="M9 12l2 2 4-4"/></svg>',
      music: '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'
    };
    return icons[type] || icons.parents;
  }

  function replaceSectionIcons() {
    const map = {
      'inv-parents-block': getSectionIcon('parents'),
      'inv-ceremony-section': getSectionIcon('ceremony'),
      'inv-reception-section': getSectionIcon('reception'),
      'inv-itinerary-section': getSectionIcon('itinerary'),
      'inv-dresscode-block': getSectionIcon('dresscode'),
      'inv-gifts-block': getSectionIcon('gifts'),
      'inv-hashtag-block': getSectionIcon('hashtag'),
      'inv-pass-block': getSectionIcon('pass'),
      'inv-rsvp-block': getSectionIcon('rsvp'),
      'inv-music-player': getSectionIcon('music')
    };

    for (const id in map) {
      const el = document.getElementById(id);
      if (el) {
        const iconContainer = el.querySelector('.inv-card-icon, .inv-section-icon, .music-icon');
        if (iconContainer) {
          iconContainer.innerHTML = map[id];
        }
      }
    }
    
    // Fallback for general cards that don't have these specific IDs but have the classes
    document.querySelectorAll('.inv-card-icon, .inv-section-icon').forEach(container => {
        if(!container.innerHTML.includes('<svg')) {
           container.innerHTML = getSectionIcon('parents');
        }
    });
  }

  
  function getPremiumSectionIcon(type) {
    const icons = {
      parents: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 13c2.5-1.8 3.6-3.8 2.8-5.2C14 6.4 12.6 6.5 12 8c-.6-1.5-2-1.6-2.8-.2C8.4 9.2 9.5 11.2 12 13Z"/>
  <path d="M12 13c-2.8.5-5 .1-5.7-1.4-.7-1.5.2-2.7 1.8-2.6"/>
  <path d="M12 13c2.8.5 5 .1 5.7-1.4.7-1.5-.2-2.7-1.8-2.6"/>
  <path d="M12 13v7"/>
  <path d="M12 17c-2.2 0-3.8 1-5 3"/>
  <path d="M12 17c2.2 0 3.8 1 5 3"/>
</svg>`,
      ceremony: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 3v4"/>
  <path d="M10.5 5h3"/>
  <path d="M5.5 21V10.5L12 6l6.5 4.5V21"/>
  <path d="M9 21v-5a3 3 0 0 1 6 0v5"/>
  <path d="M5.5 13.5h13"/>
</svg>`,
      reception: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M8 3h4v5a4 4 0 0 1-8 0V3h4"/>
  <path d="M8 12v7"/>
  <path d="M5.5 19h5"/>
  <path d="M16 3h4v5a4 4 0 0 1-8 0V3h4"/>
  <path d="M16 12v7"/>
  <path d="M13.5 19h5"/>
</svg>`,
      itinerary: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M16.5 14.5A6.5 6.5 0 0 1 9.5 5a7.5 7.5 0 1 0 7 9.5Z"/>
  <path d="M18.5 4.5l.5 1.4 1.5.5-1.5.5-.5 1.4-.5-1.4-1.5-.5 1.5-.5.5-1.4Z"/>
</svg>`,
      dresscode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M9 3h6"/>
  <path d="M10 3c0 2-1 3.5-3 5l2 4-2 9h10l-2-9 2-4c-2-1.5-3-3-3-5"/>
  <path d="M9 12h6"/>
</svg>`,
      gifts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M4 10h16v10H4z"/>
  <path d="M3 7h18v3H3z"/>
  <path d="M12 7v13"/>
  <path d="M12 7s-4.5.2-4.5-2.2C7.5 3.6 8.4 3 9.4 3 11.2 3 12 7 12 7Z"/>
  <path d="M12 7s4.5.2 4.5-2.2C16.5 3.6 15.6 3 14.6 3 12.8 3 12 7 12 7Z"/>
</svg>`,
      hashtag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M9 4 7 20"/>
  <path d="M17 4l-2 16"/>
  <path d="M4 9h16"/>
  <path d="M3 15h16"/>
  <path d="M19 5l.5 1.4 1.5.5-1.5.5L19 9l-.5-1.6-1.5-.5 1.5-.5L19 5Z"/>
</svg>`,
      pass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5v-2Z"/>
  <path d="M10 8.5h4"/>
  <path d="M9 12h6"/>
  <path d="M10 15.5h4"/>
</svg>`,
      rsvp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 20s-7-4.2-8.8-8.2C1.8 8.7 3.6 6 6.6 6c1.7 0 3 1 3.9 2.2C11.4 7 12.7 6 14.4 6c3 0 4.8 2.7 3.4 5.8C16 15.8 12 20 12 20Z"/>
  <path d="m9.5 12.2 1.6 1.6 3.4-3.6"/>
</svg>`,
      music: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 3l1.4 5.1L18.5 10l-5.1 1.9L12 17l-1.4-5.1L5.5 10l5.1-1.9L12 3Z"/>
  <path d="M19 16l.6 2.1L22 19l-2.4.9L19 22l-.6-2.1L16 19l2.4-.9L19 16Z"/>
</svg>`, // music icon requested not explicitly, using default or something similar if needed
      default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 3l1.4 5.1L18.5 10l-5.1 1.9L12 17l-1.4-5.1L5.5 10l5.1-1.9L12 3Z"/>
  <path d="M19 16l.6 2.1L22 19l-2.4.9L19 22l-.6-2.1L16 19l2.4-.9L19 16Z"/>
</svg>`
    };
    return icons[type] || icons.default;
  }

  function injectPremiumIcons() {
    const map = {
      'inv-parents-block': getPremiumSectionIcon('parents'),
      'inv-ceremony-block': getPremiumSectionIcon('ceremony'),
      'inv-reception-block': getPremiumSectionIcon('reception'),
      'inv-itinerary-section': getPremiumSectionIcon('itinerary'),
      'inv-dresscode-block': getPremiumSectionIcon('dresscode'),
      'inv-gifts-block': getPremiumSectionIcon('gifts'),
      'inv-hashtag-block': getPremiumSectionIcon('hashtag'),
      'inv-pass-section': getPremiumSectionIcon('pass'),
      'inv-wa-block': getPremiumSectionIcon('rsvp')
    };

    for (const id in map) {
      const el = document.getElementById(id);
      if (el) {
        const iconContainer = el.querySelector('.inv-card-icon, .inv-section-icon');
        if (iconContainer) {
          iconContainer.innerHTML = map[id];
        }
      }
    }
  }
  /* â”€â”€â”€ Renderizado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderInvitation(inv) {
    applyVisualTheme(inv);
    injectPremiumIcons();

    /* 1. Mostrar contenido */
    var loader  = document.getElementById("inv-loader");
    var errBox  = document.getElementById("inv-error");
    var content = document.getElementById("inv-content");

    if (loader)  loader.style.display  = "none";
    if (errBox)  { errBox.style.display = "none"; errBox.textContent = ""; }
    if (content) content.style.display  = "block";

    /* 2. Tema de color y TipografÃ­a */
    applyTheme(inv.color_primary || "#C9A46A", inv.color_secondary || "#F7E7D7");

    var allowedPresets = ["classic", "romantic", "editorial", "minimal", "luxury"];
    var preset = inv.font_preset;
    if (!allowedPresets.includes(preset)) preset = "classic";
    document.body.classList.add("font-preset-" + preset);



    /* 3. Hero: tÃ­tulo, honoree, fecha */
    setText("inv-title",   inv.title        || "InvitaciÃ³n");
    setText("inv-honoree", inv.honoree_name || "");

    // Fecha formateada en el hero
    var heroDateStr = formatDateShort(inv.event_date);
    var timeStr     = formatTime(inv.event_time);
    if (heroDateStr) {
      var heroDate = document.getElementById("inv-hero-date");
      if (heroDate) {
        heroDate.textContent = timeStr ? heroDateStr + "  Â·  " + timeStr : heroDateStr;
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
    setText("inv-mesa",       tableNum  || "â€”");
    toggle("inv-mesa-block",  !!tableNum);

    // Fecha corta en ticket
    var ticketDate = document.getElementById("inv-ticket-date");
    if (ticketDate) {
      ticketDate.textContent = formatDateShort(inv.event_date) || "â€”";
    }

    /* 6. Selector de confirmaciÃ³n */
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

    /* Cierre y agradecimiento */
    renderThankYouClosing(inv);
    renderShareSection(inv);

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

    /* 9. RecepciÃ³n */
    var hasReception = !!(inv.reception_name || inv.reception_address);
    toggle("inv-reception-block", hasReception);
    if (hasReception) {
      setText("inv-reception-name",    inv.reception_name    || "RecepciÃ³n");
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

    /* 13. TÃ­tulo de pestaÃ±a */
    document.title = (inv.title || "InvitaciÃ³n Digital") + " Â· Invitta";

    /* 14. Foto principal (hero) */
    renderMainPhoto(inv.main_photo_url);

    /* 15. Cuenta regresiva */
    setupCountdown(inv.event_date, inv.event_time);

    /* 16. MÃºsica */
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

    /* 17. GalerÃ­a */
    renderGallery(normalizeGalleryUrls(inv.gallery_urls));

    /* 18. Footer CTA */
    const footer = document.querySelector('.inv-footer');
    if (footer) {
      const ctaHtml = renderStudioFooterCta(inv);
      if (ctaHtml) {
        footer.insertAdjacentHTML('beforeend', ctaHtml);
      }
    }

    setTimeout(() => {
      setupMomentImageOrientation();
      setupMomentsParallax();
    }, 500);


    /* 19. Limpieza de elementos legacy de audio en el contenido */
    document.querySelectorAll("#inv-content audio, #inv-content [id*='music'], #inv-content [class*='music']").forEach((el) => {
      if (el.id !== "inv-music-player") {
        console.warn("Removing legacy inline music element:", el);
        el.remove();
      }
    });

    setTimeout(() => {
      if (typeof setupRevealAnimations === "function") {
        setupRevealAnimations();
      }

      setupSectionIconReveal();
    }, 400);
  }

  /* â”€â”€â”€ Foto principal (hero) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderMainPhoto(url) {
    var heroBg   = document.getElementById("inv-hero-bg");
    var heroImg  = document.getElementById("inv-hero-img");
    var hero     = document.getElementById("inv-hero");

    if (!url || !heroBg || !heroImg) return;

    heroImg.src              = url;
    heroBg.style.display     = "block";
    if (hero) hero.classList.add("inv-hero--has-photo");
  }

  /* â”€â”€â”€ Calendar Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* â”€â”€â”€ Reproductor de mÃºsica fijo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  let invitationAudio = null;
  let isMusicPlaying = false;

  function cleanMusicTitle(value) {
    return String(value || "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanMusicFileName(filename) {
    if (!filename) return "";
    const decoded = decodeURIComponent(filename);
    return cleanMusicTitle(decoded
      .replace(/\.(mp3|m4a|wav|ogg)$/i, "")
      .replace(/^\d+[-_]/, ""));
  }

  function getMusicTitle(invitation) {
    if (invitation.music_title && invitation.music_title.trim()) {
      return cleanMusicTitle(invitation.music_title);
    }

    if (invitation.music_url) {
      try {
        const url = new URL(invitation.music_url);
        const filename = url.pathname.split("/").pop() || "";
        return cleanMusicFileName(filename) || "MÃºsica del evento";
      } catch (e) {
        const filename = invitation.music_url.split("/").pop() || "";
        return cleanMusicFileName(filename) || "MÃºsica del evento";
      }
    }

    return "MÃºsica del evento";
  }

  function getMusicDisplayTitle(invitation) {
    const musicTitle = getMusicTitle(invitation);
    const musicArtist = cleanMusicTitle(invitation.music_artist);

    if (musicArtist && musicTitle && musicTitle !== "MÃºsica del evento") {
      return `${musicArtist} Â· ${musicTitle}`;
    }

    return musicArtist || musicTitle;
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

  function escapeHtml(unsafe) {
    return (unsafe || "").toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getStudioInitials(name) {
    const clean = String(name || "Invitta Studio").trim();
    if (!clean) return "IS";
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function renderMusicPlayerBrand(invitation) {
    const enabled = invitation.music_player_brand_enabled !== false;
    const studioName = invitation.studio_name || "Invitta Studio";
    const logoUrl = invitation.studio_logo_url || "";

    if (!enabled) {
      return "";
    }

    if (logoUrl) {
      return `
        <div class="inv-music-brand" aria-label="${escapeHtml(studioName)}">
          <img
            class="inv-music-brand-logo"
            src="${escapeHtml(logoUrl)}"
            alt="${escapeHtml(studioName)}"
            loading="lazy"
            onerror="this.closest('.inv-music-brand')?.classList.add('is-logo-error'); this.remove();"
          >
        </div>
      `;
    }

    return `
      <div class="inv-music-brand inv-music-brand-fallback" aria-label="${escapeHtml(studioName)}">
        <span>${escapeHtml(getStudioInitials(studioName))}</span>
      </div>
    `;
  }

  function getPlayIconSvg() {
    return `
      <svg class="inv-music-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 5.5v13l10-6.5-10-6.5z"></path>
      </svg>
    `;
  }

  function getPauseIconSvg() {
    return `
      <svg class="inv-music-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 5h2.8v14H8z"></path>
        <path d="M13.2 5H16v14h-2.8z"></path>
      </svg>
    `;
  }

  function normalizePhoneNumber(value) {
    return String(value || "")
      .replace(/[^\d]/g, "");
  }

  function buildStudioWhatsappUrl(invitation) {
    const phone = normalizePhoneNumber(invitation.studio_whatsapp);
    if (!phone) return "";
    const message = invitation.studio_cta_message
      || "Hola, vi esta invitación digital y me interesa contratar una para mi evento.";
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  function renderStudioFooterCta(invitation) {
    const enabled = invitation.studio_cta_enabled !== false;
    const url = buildStudioWhatsappUrl(invitation);

    if (!enabled || !url) return "";

    const text = invitation.studio_cta_text || "Quiero una invitación así";

    return `
      <a
        class="inv-footer-cta"
        href="${escapeHtml(url)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="${escapeHtml(text)}"
      >
        ${escapeHtml(text)}
      </a>
    `;
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
    
    const logoContainer = player.querySelector(".inv-music-logo, .inv-music-brand, .inv-music-brand-fallback");
    if (logoContainer) {
      const brandHtml = renderMusicPlayerBrand(invitation);
      if (brandHtml) {
        logoContainer.outerHTML = brandHtml;
      } else {
        logoContainer.style.display = "none";
      }
    }
    
    document.body.classList.add("has-music-player");

    console.log("Music player computed display:", window.getComputedStyle(player).display);
    console.log("Music player position:", window.getComputedStyle(player).position);
    console.log("Music player bottom:", window.getComputedStyle(player).bottom);

    if (title) title.textContent = getMusicDisplayTitle(invitation);
    if (artist) artist.textContent = "";

    if (invitationAudio) {
      invitationAudio.pause();
      invitationAudio = null;
    }

    invitationAudio = new Audio(invitation.music_url);
    invitationAudio.preload = "auto";
    invitationAudio.loop = true;
    invitationAudio.volume = 0.85;

    isMusicPlaying = false;
    toggle.innerHTML = getPlayIconSvg();
    toggle.disabled = false;

    toggle.onclick = async () => {
      try {
        if (!isMusicPlaying) {
          await invitationAudio.play();
          isMusicPlaying = true;
          toggle.innerHTML = getPauseIconSvg();
          toggle.setAttribute("aria-label", "Pausar música");
        } else {
          invitationAudio.pause();
          isMusicPlaying = false;
          toggle.innerHTML = getPlayIconSvg();
          toggle.setAttribute("aria-label", "Reproducir música");
        }
      } catch (err) {
        console.error("Error reproduciendo música:", err);
        alert("No se pudo reproducir la música. Verifica que el archivo sea compatible.");
      }
    };
  }

  /* â”€â”€â”€ Cuenta regresiva â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
        section.innerHTML = "<p class='inv-countdown-today'>âœ¨ Hoy es el gran dÃ­a âœ¨</p>";
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

  /* â”€â”€â”€ GalerÃ­a â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  /** Normaliza gallery_urls: array | JSON string | null â†’ string[] */
  function normalizeGalleryUrls(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).slice(0, 10);
    try {
      var parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 10) : [];
    } catch (e) { return []; }
  }

  /** Renderiza la galerÃ­a como momentos fullscreen cinematogrÃ¡ficos. */
  function renderGallery(urls) {
    var section = document.getElementById("inv-gallery-section");
    var container = document.getElementById("inv-gallery");
    if (!section || !container) return;

    if (!urls || urls.length === 0) {
      section.style.display = "none";
      return;
    }

    section.className = "inv-section inv-moments-section";
    section.style.display = "";

    var header = section.querySelector(".inv-gallery-header, .inv-moments-header");
    if (header) {
      header.className = "inv-moments-header reveal-on-scroll";
    }

    var kicker = section.querySelector(".inv-eyebrow-text");
    if (kicker) {
      kicker.textContent = "Recuerdos";
      kicker.classList.add("inv-section-kicker");
    }

    var title = section.querySelector(".inv-gallery-title");
    if (title) {
      title.classList.add("inv-section-title");
    }

    container.className = "inv-moments-stack";
    container.innerHTML = "";

    urls.forEach(function (url) {
      var frame = document.createElement("figure");
      frame.className = "inv-moment-frame reveal-on-scroll";
      frame.setAttribute("role", "listitem");

      var img = document.createElement("img");
      img.className = "inv-moment-image";
      img.src = url;
      img.alt = "Momento especial";
      img.loading = "lazy";
      img.decoding = "async";

      frame.appendChild(img);
      container.appendChild(frame);
    });
  }

  function setupMomentImageOrientation() {
    document.querySelectorAll(".inv-moment-image").forEach((img) => {
      function setOrientation() {
        img.classList.toggle("is-landscape", img.naturalWidth >= img.naturalHeight);
        img.classList.toggle("is-portrait", img.naturalHeight > img.naturalWidth);
      }

      if (img.complete) {
        setOrientation();
      } else {
        img.addEventListener("load", setOrientation, { once: true });
      }
    });
  }

  function setupMomentsParallax() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const images = Array.from(document.querySelectorAll(".inv-moment-image"));

    if (!images.length) return;

    let ticking = false;

    function updateParallax() {
      const viewportHeight = window.innerHeight;

      images.forEach((img) => {
        const frame = img.closest(".inv-moment-frame");
        if (!frame) return;

        const rect = frame.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > viewportHeight) return;

        const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
        const clamped = Math.max(0, Math.min(1, progress));

        const translate = (clamped - 0.5) * 28;

        img.style.transform = `translate3d(0, ${translate}px, 0) scale(1.06)`;
      });

      ticking = false;
    }

    function requestTick() {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    updateParallax();
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
  }

  /* â”€â”€â”€ Selector de pases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* â”€â”€â”€ WhatsApp â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* â”€â”€â”€ showError â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* â”€â”€â”€ Tema de colores â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function applyTheme(primary, secondary) {
    var root = document.documentElement;
    root.style.setProperty("--inv-primary",        primary);
    root.style.setProperty("--inv-primary-light",  hexAlpha(primary, 0.12));
    root.style.setProperty("--inv-primary-border", hexAlpha(primary, 0.30));
    root.style.setProperty("--inv-secondary",      secondary);
  }

  /* â”€â”€â”€ Helpers DOM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
  function textWithFallback(value, fallback) {
    const clean = String(value || "").trim();
    return clean || fallback;
  }

  function renderThankYouClosing(inv) {
    const section = document.getElementById("inv-thank-you-section");
    if (!section) return;

    setText("inv-thank-you-title", textWithFallback(inv.thank_you_title, "Con cariÃ±o"));
    setText("inv-thank-you-message", textWithFallback(inv.thank_you_message, "Gracias por ser parte de mis XV aÃ±os"));

    const signature = String(inv.thank_you_signature || "").trim();
    const signatureEl = document.getElementById("inv-thank-you-signature");
    if (signatureEl) {
      signatureEl.textContent = signature;
      signatureEl.style.display = signature ? "" : "none";
    }

    show("inv-thank-you-section");
  }

  function renderShareSection(inv) {
    const hashtag = String(inv.instagram_hashtag || "").trim();
    if (!hashtag) {
      hide("inv-hashtag-block");
      return;
    }

    setText("inv-share-title", textWithFallback(inv.hashtag_section_title, "Comparte el momento"));
    setText("inv-hashtag", hashtag);
    setText("inv-share-message", textWithFallback(inv.hashtag_section_message, "Usa el hashtag en tus fotos y videos para que no se pierda ningÃºn recuerdo."));
    show("inv-hashtag-block");
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

  function getTimelineAltIcon(label = "") {
    const text = String(label || "").toLowerCase();

    if (text.includes("ceremonia") || text.includes("iglesia")) {
      return getPremiumSectionIcon ? getPremiumSectionIcon("ceremony") : "âœ¦";
    }

    if (text.includes("recepciÃ³n") || text.includes("recepcion")) {
      return getPremiumSectionIcon ? getPremiumSectionIcon("reception") : "âœ¦";
    }

    if (text.includes("cena") || text.includes("banquete")) {
      return getPremiumSectionIcon ? getPremiumSectionIcon("gifts") : "âœ¦";
    }

    if (text.includes("vals") || text.includes("baile") || text.includes("fiesta") || text.includes("musica")) {
      return getPremiumSectionIcon ? getPremiumSectionIcon("music") : "âœ¦";
    }

    return getPremiumSectionIcon ? getPremiumSectionIcon("itinerary") : "âœ¦";
  }

  function renderItinerary(value) {
    const section = document.getElementById("inv-itinerary-section");
    if (!section) return;

    const items = normalizeItinerary(value);

    if (!items.length) {
      section.style.display = "none";
      section.innerHTML = "";
      return;
    }

    section.className = "inv-section inv-night-timeline inv-timeline-alt-section reveal-on-scroll";
    section.style.setProperty("display", "block", "important");
    section.style.setProperty("visibility", "visible", "important");

    const itemsHtml = items.map((item, index) => {
      const eventTitle = item.title || "";
      const icon = getTimelineAltIcon(eventTitle);
      const isLeft = index % 2 === 0;
      const rowClass = isLeft ? "is-left" : "is-right";
      const timeHtml = item.time ? `<p class="inv-timeline-alt-time">${escapeHtml(item.time)}</p>` : "";

      if (isLeft) {
        return `
          <article class="inv-timeline-alt-row ${rowClass}">
            <div class="inv-timeline-alt-side inv-timeline-alt-content">
              ${timeHtml}
              <p class="inv-timeline-alt-event">${escapeHtml(eventTitle)}</p>
            </div>
            <div class="inv-timeline-alt-dot-wrap">
              <span class="inv-timeline-alt-dot"></span>
            </div>
            <div class="inv-timeline-alt-side inv-timeline-alt-icon">
              ${icon}
            </div>
          </article>
        `;
      } else {
        return `
          <article class="inv-timeline-alt-row ${rowClass}">
            <div class="inv-timeline-alt-side inv-timeline-alt-icon">
              ${icon}
            </div>
            <div class="inv-timeline-alt-dot-wrap">
              <span class="inv-timeline-alt-dot"></span>
            </div>
            <div class="inv-timeline-alt-side inv-timeline-alt-content">
              ${timeHtml}
              <p class="inv-timeline-alt-event">${escapeHtml(eventTitle)}</p>
            </div>
          </article>
        `;
      }
    }).join("");

    section.innerHTML = `
      <div class="inv-timeline-alt-card">
        <div class="inv-timeline-alt-header">
          <p class="inv-timeline-alt-kicker">Itinerario</p>
          <h2 class="inv-timeline-alt-title">Momentos de la Noche</h2>
        </div>
        <div class="inv-timeline-alt-list">
          <div class="inv-timeline-alt-line"></div>
          ${itemsHtml}
        </div>
      </div>
    `;
  }
  /* â”€â”€â”€ Helpers texto / nÃºmeros â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /** Fecha larga: "sÃ¡bado, 14 de febrero de 2026" */
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

  /* â”€â”€â”€ Color helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function hexAlpha(hex, a) {
    var h = hex || "#C9A46A";
    var r = parseInt(h.slice(1, 3), 16) || 0;
    var g = parseInt(h.slice(3, 5), 16) || 0;
    var b = parseInt(h.slice(5, 7), 16) || 0;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

})();

function setupSectionIconReveal() {
  const icons = Array.from(document.querySelectorAll(".inv-section-icon"))
    .filter((icon) => {
      const style = window.getComputedStyle(icon);
      return style.display !== "none" && style.visibility !== "hidden";
    });

  if (!icons.length) return;

  icons.forEach((icon) => {
    icon.classList.remove("icon-visible");
  });

  function revealIcons() {
    const triggerPoint = window.innerHeight * 0.9;

    icons.forEach((icon) => {
      if (icon.classList.contains("icon-visible")) return;

      const rect = icon.getBoundingClientRect();

      if (rect.top < triggerPoint && rect.bottom > 0) {
        icon.classList.add("icon-visible");
      }
    });
  }

  setTimeout(revealIcons, 300);
  window.addEventListener("scroll", revealIcons, { passive: true });
  window.addEventListener("resize", revealIcons);

  setTimeout(() => {
    document.querySelectorAll(".inv-section-icon").forEach((icon) => {
      const rect = icon.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        icon.classList.add("icon-visible");
      }
    });
  }, 1200);
}
function setupRevealAnimations() {
  console.log("setupRevealAnimations classic rose subtle mode");

  setupRevealOnScroll();
}

function setupRevealOnScroll() {
  const elements = document.querySelectorAll(".reveal-on-scroll");
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  elements.forEach((element) => observer.observe(element));
}
