(function () {
  "use strict";

  var data = window.INVITATION_DATA;
  if (!data || !data.templateId) return;

  var templateId = data.templateId;
  var rendererTemplateId = data.rendererTemplateId || templateId;
  var isWedding = data.eventType === "boda";
  var isMilestoneBirthday = data.eventType === "cumpleanos" && /(?:^|\D)50(?:\D|$)/.test(clean(data.eventTitle));
  var applying = false;
  var vipAccessRetryCount = 0;
  var imageSequence = 0;
  var typographyScaledElements = new Set();
  var typographyOriginalFontSizes = new WeakMap();
  var typographyResizeTimer = 0;

  var typographyRoleOrder = ["body", "labels", "cardTitle", "sectionTitle", "mainTitle", "guestName", "closingName", "coverName"];
  var typographyRoleSelectors = {
    body: "p:not(.hero__secret),li,blockquote,.font-body,.font-sans,.inv-card-copy,.inv-section-copy,[data-invitta-font-role='body']",
    labels: ".eyebrow,label,button,input,select,textarea,.button,.btn,.hero__date,.inv-hero-date,.inv-card-label,.inv-card-time,.inv-timeline-time,.timeline__time,.dress-code__label,.hashtag,[data-invitta-font-role='label']",
    cardTitle: "h3,h4,h5,h6,.inv-card-title,.inv-timeline-title,.timeline__title,.card__title,[data-invitta-font-role='card-title']",
    sectionTitle: "h2,.inv-section-title,.section-title,.subtitle,[data-invitta-font-role='section-title']",
    mainTitle: "h1,.font-display,.hero-title,.inv-hero-title,.inv-main-title,.cover-title,.main-title,[data-invitta-font-role='main-title'],[data-invitta-font-role='title']",
    guestName: "#guest-name,#inv-guest-name,.inv-pass-name,.guest-name,[data-invitta-font-role='guest-name']",
    closingName: "#thank-you-signature,.inv-thank-you-signature,[data-invitta-font-role='closing-name']",
    coverName: ".hero__name,#celebrant-name,.inv-hero-name,.couple-names,.couple-name,.honoree-name,[data-invitta-font-role='cover-name'],[data-invitta-font-role='name']"
  };

  function typographyScaleFor(target) {
    var value = data.typographyRoles && data.typographyRoles[target]
      ? Number(data.typographyRoles[target].scale)
      : 1;
    return Number.isFinite(value) ? Math.min(1.5, Math.max(.75, value)) : 1;
  }

  function restoreTypographyScale(element) {
    var original = typographyOriginalFontSizes.get(element);
    if (!original) return;
    if (original.value) element.style.setProperty("font-size", original.value, original.priority);
    else element.style.removeProperty("font-size");
  }

  function applyTypographyScales(refresh) {
    if (refresh) {
      typographyScaledElements.forEach(restoreTypographyScale);
      typographyScaledElements.clear();
    }

    var elementScales = new Map();
    typographyRoleOrder.forEach(function(target) {
      var scale = typographyScaleFor(target);
      document.querySelectorAll(typographyRoleSelectors[target]).forEach(function(element) {
        elementScales.set(element, scale);
      });
    });

    elementScales.forEach(function(scale, element) {
      if (typographyScaledElements.has(element)) return;
      typographyOriginalFontSizes.set(element, {
        value: element.style.getPropertyValue("font-size"),
        priority: element.style.getPropertyPriority("font-size")
      });
      var baseSize = Number.parseFloat(getComputedStyle(element).fontSize);
      if (!Number.isFinite(baseSize)) return;
      element.style.setProperty("font-size", (baseSize * scale).toFixed(2) + "px", "important");
      typographyScaledElements.add(element);
    });
  }

  var defaults = {
    "xv-elegance-basic": {
      names: ["Ana Camila Zavala", "Ana Camila"],
      parents: ["Susana Almazán Bernal", "César Roberto Zavala"],
      godparents: ["Diana Almanza García", "Enrique O'Farrill Zúñiga"],
      dates: ["12 Diciembre 2026"],
      ceremonyTime: ["3:00 P.M."],
      receptionTime: ["9:00 P.M."]
    },
    "xv-rose-gold-premium": {
      names: ["Mary Carmen Arevalo", "Mary Carmen"],
      parents: ["José Ángel Arévalo G.", "Luisa María Saavedra D."],
      godparents: ["Julio Arévalo G.", "Martha Caballero H."],
      dates: ["28 Noviembre 2026", "28 · Noviembre · 2026"],
      ceremonyTime: ["6:00 P.M.", "18:00 P.M."],
      receptionTime: ["8:00 P.M.", "20:00 P.M."]
    },
    "xv-champagne-rose-vip": {
      names: ["Ana Camila Zavala Almazán", "Ana Camila Zavala", "Ana Camila"],
      parents: ["Susana Almazán Bernal", "César Roberto Zavala"],
      godparents: ["Diana Almanza García", "Enrique O'Farrill Zúñiga"],
      dates: ["12 Diciembre 2026"],
      ceremonyTime: ["3:00 P.M."],
      receptionTime: ["9:00 P.M."]
    },
    "boda-classic-basic": {
      names: ["Mariana & Diego"],
      parents: ["Susana Almazán Bernal", "César Roberto Zavala"],
      godparents: ["Diana Almanza García", "Enrique O'Farrill Zúñiga"],
      dates: ["12 Diciembre 2026"],
      ceremonyTime: ["3:00 P.M."],
      receptionTime: ["9:00 P.M."]
    },
    "boda-golden-romance-premium": {
      names: ["Mariana & Diego"],
      parents: ["Susana Almazán Bernal", "César Roberto Zavala"],
      godparents: ["Diana Almanza García", "Enrique O'Farrill Zúñiga"],
      dates: ["12 Diciembre 2026", "12 · Diciembre · 2026"],
      ceremonyTime: ["3:00 P.M."],
      receptionTime: ["9:00 P.M."]
    },
    "boda-midnight-gold-vip": {
      names: ["Ana Camila & Carlos Zavala & González", "Ana Camila & Carlos", "Ana Camila"],
      parents: ["Susana Almazán Bernal", "César Roberto Zavala"],
      godparents: ["Patricia & Alejandro Farrera"],
      dates: ["12 Diciembre 2026"],
      ceremonyTime: ["3:00 P.M."],
      receptionTime: ["9:00 P.M."]
    }
  }[rendererTemplateId] || {};

  function clean(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function parseDate(value) {
    if (!value) return null;
    var date = new Date(value + (value.length === 10 ? "T12:00:00" : ""));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function capitalize(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
  }

  function dateFormats(value) {
    var date = parseDate(value);
    if (!date) return null;
    var month = capitalize(new Intl.DateTimeFormat("es-MX", { month: "long" }).format(date));
    var weekday = capitalize(new Intl.DateTimeFormat("es-MX", { weekday: "long" }).format(date));
    var day = date.getDate();
    var year = date.getFullYear();
    var deadline = new Date(date.getTime());
    deadline.setDate(deadline.getDate() - 7);
    return {
      long: day + " " + month + " " + year,
      dotted: day + " · " + month + " · " + year,
      eventLine: weekday + " " + day + " de " + month,
      day: String(day),
      month: month,
      year: String(year),
      deadline: new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(deadline)
    };
  }

  function formatTime(value) {
    var match = String(value || "").match(/(\d{1,2}):(\d{2})/);
    if (!match) return clean(value);
    var hours = Number(match[1]);
    var minutes = match[2];
    var suffix = hours >= 12 ? "P.M." : "A.M.";
    var hour12 = hours % 12 || 12;
    return hour12 + ":" + minutes + " " + suffix;
  }

  function addReplacement(list, from, to) {
    from = clean(from);
    to = clean(to);
    if (from && to && from !== to) list.push([from, to]);
  }

  function addExactReplacement(list, from, to) {
    from = clean(from);
    to = clean(to);
    if (from && to && from !== to) list.push([from, to, true]);
  }

  function personNameParts(value) {
    var words = clean(value).split(/\s+/).filter(Boolean);
    return {
      first: words[0] || "",
      middle: words.length > 2 ? words.slice(1, -1).join(" ") : (words[1] || ""),
      last: words.length > 2 ? words[words.length - 1] : "",
      firstTwo: words.slice(0, Math.min(2, words.length)).join(" "),
      remainder: words.slice(Math.min(2, words.length)).join(" "),
      given: words.length > 1 ? words.slice(0, -1).join(" ") : (words[0] || ""),
      surname: words.length > 1 ? words[words.length - 1] : ""
    };
  }

  function addHeroNameReplacements(list, name) {
    if (isWedding) {
      var couple = clean(name).split(/\s*(?:&|\by\b)\s*/i).filter(Boolean);
      var bride = personNameParts(couple[0] || name);
      var groom = personNameParts(couple[1] || "");
      addExactReplacement(list, "Mariana", bride.given || bride.first);
      addExactReplacement(list, "Diego", groom.given || groom.first);
      addExactReplacement(list, "Ana Camila", bride.given || bride.first);
      addExactReplacement(list, "& Carlos", groom.given ? "& " + groom.given : "");
      addExactReplacement(list, "Zavala & González", [bride.surname, groom.surname].filter(Boolean).join(" & "));
      return;
    }

    var parts = personNameParts(name);
    if (templateId === "xv-elegance-basic") {
      addExactReplacement(list, "Ana", parts.first);
      addExactReplacement(list, "Camila", parts.middle);
      addExactReplacement(list, "Zavala", parts.last);
    } else if (templateId === "xv-rose-gold-premium") {
      addExactReplacement(list, "Mary", parts.first);
      addExactReplacement(list, "Carmen", [parts.middle, parts.last].filter(Boolean).join(" "));
    } else if (templateId === "xv-champagne-rose-vip") {
      addExactReplacement(list, "Ana Camila", parts.firstTwo || parts.first);
      addExactReplacement(list, "Zavala Almazán", parts.remainder || parts.last);
    }
  }

  function buildReplacements() {
    var list = [];
    var name = clean(data.celebrantName);
    var parents = Array.isArray(data.parents) ? data.parents.filter(Boolean) : [];
    var godparents = Array.isArray(data.godparents) ? data.godparents.filter(function (item) { return item && item.name; }) : [];
    var ceremony = data.ceremony || {};
    var reception = data.reception || {};
    var formats = dateFormats(data.eventDate);

    (defaults.names || []).forEach(function (item) { addReplacement(list, item, name); });
    addHeroNameReplacements(list, name);
    (defaults.parents || []).forEach(function (item, index) { addReplacement(list, item, parents[index] || parents[0]); });
    (defaults.godparents || []).forEach(function (item, index) {
      addReplacement(list, item, (godparents[index] || godparents[0] || {}).name);
    });

    addReplacement(list, "Nuestra Boda", data.eventTitle);
    addReplacement(list, "Mis Quince Años", data.eventTitle);
    addReplacement(list, "Parroquia Sagrado Corazón de Jesús", ceremony.name);
    addReplacement(list, "Santuario del Sagrado Corazón", ceremony.name);
    addReplacement(list, "Cantabria Salón de Eventos", reception.name);
    addReplacement(list, "Blv. Calle 20 de Noviembre y Av. Melchor Ocampo, Col. Pacífico", ceremony.address);
    addReplacement(list, "Blv. Calle 20 de Noviembre y Av. Melchor Ocampo Col. Pacífico, C.P. 31030 Chihuahua, Chihuahua.", ceremony.address);
    addReplacement(list, "Blv. Col. Sierra Magisterial #6103 esq. con Tejas, Col. Los Ángeles", reception.address);
    addReplacement(list, "Blv. Col. Sierra Magisterial #6103 esq. con Tejas Col. Los Ángeles, C.P. 31380 Chihuahua, Chihuahua.", reception.address);
    addReplacement(list, "FORMAL", data.dressCode);

    if (formats) {
      (defaults.dates || []).forEach(function (item) {
        addReplacement(list, item, item.indexOf("·") >= 0 ? formats.dotted : formats.long);
      });
      addReplacement(list, "Sábado 12 de Diciembre", formats.eventLine);
      addReplacement(list, "Sábado 28 de Noviembre", formats.eventLine);
      addReplacement(list, "15 de Noviembre de 2026", formats.deadline);
      addReplacement(list, "20 de Noviembre, 2026", formats.deadline);
      addReplacement(list, "21 de Noviembre, 2026", formats.deadline);
    }

    (defaults.ceremonyTime || []).forEach(function (item) { addReplacement(list, item, formatTime(ceremony.time || data.eventTime)); });
    (defaults.receptionTime || []).forEach(function (item) { addReplacement(list, item, formatTime(reception.time)); });
    addReplacement(list, '"Hay momentos inolvidables que se atesoran en el corazón para siempre, por esa razón, quiero que compartas conmigo este día tan especial..."', data.quote);
    addReplacement(list, '"Dos corazones que latieron por separado, hoy se unen para siempre. Queremos que seas parte de este día tan especial..."', data.quote);
    addReplacement(list, '"Dos corazones que latieron por separado, hoy se unen para siempre. Queremos que compartas con nosotros este día tan especial..."', data.quote);

    addReplacement(list, "Con cariño", data.thankYouTitle);
    addReplacement(list, "Familia Zavala Almazán", data.thankYouSignature);
    addReplacement(list, "Comparte el momento", data.hashtagSectionTitle);
    addReplacement(list, "Comparte tus fotos y recuerdos de esta celebración", data.hashtagSectionMessage);
    addReplacement(list, "#MisXV", data.instagramHashtag);
    addReplacement(list, "Invitta Digital Atelier", data.studioName);

    var defaultItinerary = [
      ["16:00 P.M.", "Sesión Fotográfica de Gala"],
      ["17:00 P.M.", "Ceremonia de Acción de Gracias"],
      ["19:00 P.M.", "Bienvenida y Cóctel"],
      ["20:30 P.M.", "Vals de Gala & Brindis"],
      ["21:00 P.M.", "Banquete de Honor"],
      ["22:30 P.M.", "Gran Apertura de Pista"]
    ];
    (data.itinerary || []).slice(0, defaultItinerary.length).forEach(function (item, index) {
      addReplacement(list, defaultItinerary[index][0], formatTime(item.time));
      addReplacement(list, defaultItinerary[index][1], item.title);
    });

    return list.sort(function (a, b) { return b[0].length - a[0].length; });
  }

  var replacements = buildReplacements();

  function replaceText(root) {
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      var parentName = node.parentElement ? node.parentElement.tagName : "";
      if (parentName === "SCRIPT" || parentName === "STYLE" || parentName === "TEXTAREA") continue;
      var value = node.nodeValue;
      replacements.forEach(function (pair) {
        if (pair[2]) {
          if (value.trim() === pair[0]) value = value.replace(pair[0], pair[1]);
          return;
        }
        value = value.split(pair[0]).join(pair[1]);
      });
      if (value !== node.nodeValue) node.nodeValue = value;
    }
  }

  function isPhotoUrl(url) {
    return /\.(?:png|jpe?g|webp)(?:\?|$)/i.test(url || "") && !/(logo|icon|qr|section_bg|wedding_bg)/i.test(url || "");
  }

  function isHeroPhoto(element, original) {
    if (/hero|cover|portada|principal/i.test(original || "")) return true;
    if (!element || !element.closest) return false;
    return Boolean(element.closest(
      "#hero, [id*='hero' i], [id*='cover' i], [id*='portada' i], " +
      "[class*='hero' i], [class*='cover' i], [class*='portada' i]"
    ));
  }

  function choosePhoto(original, element) {
    var gallery = data.galleryUrls || [];
    if (isHeroPhoto(element, original) && data.mainPhotoUrl) return data.mainPhotoUrl;
    if (!gallery.length) return data.mainPhotoUrl || "";
    var chosen = gallery[imageSequence % gallery.length];
    imageSequence += 1;
    return chosen;
  }

  function applyImages() {
    imageSequence = 0;
    Array.from(document.images).forEach(function (image) {
      if (image.dataset.invittaPersonalized === "true") return;
      var original = image.currentSrc || image.src;
      if (!isPhotoUrl(original)) return;
      var replacement = choosePhoto(original, image);
      if (!replacement) return;
      image.dataset.invittaPersonalized = "true";
      image.src = replacement;
      image.removeAttribute("srcset");
    });

    Array.from(document.querySelectorAll("[style]"))
      .filter(function (element) { return isPhotoUrl(element.style.backgroundImage); })
      .forEach(function (element) {
        if (element.dataset.invittaPersonalized === "true") return;
        var replacement = choosePhoto(element.style.backgroundImage, element);
        if (!replacement) return;
        element.dataset.invittaPersonalized = "true";
        element.style.backgroundImage = 'url("' + replacement.replace(/"/g, "") + '")';
      });
  }

  function applySectionBackgrounds() {
    var backgrounds = data.sectionBackgrounds || {};
    var sections = {
      hero: "#hero",
      family: "#family",
      locations: "#locations",
      gallery: "#gallery",
      rsvp: "#rsvp"
    };

    Object.keys(sections).forEach(function (key) {
      var url = clean(backgrounds[key]);
      if (!url) return;
      if (isMilestoneBirthday && key === "hero") return;
      document.querySelectorAll(sections[key]).forEach(function (section) {
        if (section.dataset.invittaSectionBackground === url) return;
        var isGenericRenderer = rendererTemplateId === "evento-general-basic";
        var veil = key === "hero"
          ? "linear-gradient(rgba(20,16,14,.42),rgba(20,16,14,.42))"
          : isMilestoneBirthday
            ? "linear-gradient(rgba(4,12,29,.42),rgba(4,12,29,.52))"
          : isGenericRenderer && key === "rsvp"
            ? "linear-gradient(rgba(250,249,247,.48),rgba(250,249,247,.48))"
            : "linear-gradient(rgba(250,249,247,.86),rgba(250,249,247,.86))";
        section.style.setProperty("background-image", veil + ',url("' + url.replace(/"/g, "") + '")', "important");
        section.style.setProperty("background-size", isMilestoneBirthday && window.innerWidth <= 760 ? "auto 132%" : "cover", "important");
        section.style.setProperty("background-position", "center", "important");
        section.style.setProperty("background-repeat", "no-repeat", "important");
        section.dataset.invittaPersonalized = "true";
        section.dataset.invittaSectionBackground = url;
      });
    });
  }

  function applyAudio() {
    if (!data.musicUrl) return;
    document.querySelectorAll("audio").forEach(function (audio) {
      if (audio.dataset.invittaPersonalized === "true") return;
      audio.dataset.invittaPersonalized = "true";
      audio.src = data.musicUrl;
      audio.load();
    });
  }

  function applyOptionalContent() {
    var selectorValues = [
      ["[id*='music-title' i], [class*='music-title' i], [data-music-title]", data.musicTitle],
      ["[id*='music-artist' i], [class*='music-artist' i], [data-music-artist]", data.musicArtist],
      ["[id*='thank-you-title' i], [class*='thank-you-title' i]", data.thankYouTitle],
      ["[id*='thank-you-message' i], [class*='thank-you-message' i]", data.thankYouMessage],
      ["[id*='thank-you-signature' i], [class*='thank-you-signature' i]", data.thankYouSignature],
      ["[id*='share-title' i], [class*='share-title' i]", data.hashtagSectionTitle],
      ["[id*='share-message' i], [class*='share-message' i]", data.hashtagSectionMessage],
      ["[id*='share-hashtag' i], [class*='share-hashtag' i]", data.instagramHashtag]
    ];

    selectorValues.forEach(function (entry) {
      if (!clean(entry[1])) return;
      document.querySelectorAll(entry[0]).forEach(function (element) {
        if (element.children.length === 0 && element.textContent !== entry[1]) {
          element.textContent = entry[1];
        }
      });
    });
  }

  function applyLinks() {
    var mapButtons = Array.from(document.querySelectorAll("a, button")).filter(function (element) {
      return /C[ÓO]MO LLEGAR/.test(element.textContent || "");
    });
    [data.ceremony && data.ceremony.mapUrl, data.reception && data.reception.mapUrl].forEach(function (url, index) {
      var button = mapButtons[index];
      if (!button || !url) return;
      button.dataset.invittaUrl = url;
      if (button.tagName === "A") button.href = url;
    });

    if (data.giftTableUrl) {
      Array.from(document.querySelectorAll("a, button")).filter(function (element) {
        return /VER (?:MESA|ENLACE)/.test(element.textContent || "");
      }).forEach(function (element) {
        element.dataset.invittaUrl = data.giftTableUrl;
        if (element.tagName === "A") element.href = data.giftTableUrl;
      });
    }
  }

  function setControlledValue(input, value) {
    if (!input || !value || input.dataset.invittaPrefilled === "true") return;
    var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, value);
    input.dataset.invittaPrefilled = "true";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function applyGuestData() {
    if (data.guestName) {
      var nameInput = Array.from(document.querySelectorAll("input")).find(function (input) {
        return /nombre/i.test(input.placeholder || "") && input.type !== "search";
      });
      setControlledValue(nameInput, data.guestName);
    }

    document.querySelectorAll("select").forEach(function (select) {
      Array.from(select.options).forEach(function (option) {
        var match = String(option.value || option.textContent || "").match(/\d+/);
        var amount = match ? Number(match[0]) : 0;
        if (amount > Number(data.passes || 1)) option.remove();
      });
    });
  }

  function ensureVipAccessStyles() {
    if (document.getElementById("invitta-vip-access-styles")) return;
    var style = document.createElement("style");
    style.id = "invitta-vip-access-styles";
    style.textContent = [
      ".invitta-vip-access{width:min(92%,560px);margin:72px auto;padding:0 20px;box-sizing:border-box;text-align:center}",
      ".invitta-vip-access-card{position:relative;overflow:hidden;padding:42px 28px;border:1px solid rgba(155,118,83,.32);background:#fffdf9;box-shadow:0 20px 55px rgba(45,34,28,.1)}",
      ".invitta-vip-access-card:before{content:'';position:absolute;inset:12px;border:1px solid rgba(155,118,83,.15);pointer-events:none}",
      ".invitta-vip-access-kicker{margin:0 0 12px;font:600 11px/1.2 var(--font-sans,Arial,sans-serif);letter-spacing:.24em;text-transform:uppercase;color:var(--invitta-primary,#9b7653)}",
      ".invitta-vip-access-title{margin:0;font:400 clamp(30px,7vw,46px)/1.05 var(--font-display,Georgia,serif);color:var(--text-color,#2e2722)}",
      ".invitta-vip-access-name{margin:12px 0 24px;font:400 18px/1.4 var(--font-display,Georgia,serif);color:var(--text-color,#2e2722)}",
      ".invitta-vip-access-qr{display:flex;width:210px;max-width:72vw;aspect-ratio:1;margin:0 auto;padding:12px;align-items:center;justify-content:center;background:#fff;border:1px solid rgba(64,49,38,.13);box-sizing:border-box}",
      ".invitta-vip-access-qr img,.invitta-vip-access-qr canvas{display:block!important;width:100%!important;height:100%!important}",
      ".invitta-vip-access-meta{display:flex;justify-content:center;gap:28px;margin:24px 0 0;font:600 12px/1.4 var(--font-sans,Arial,sans-serif);letter-spacing:.14em;text-transform:uppercase;color:var(--text-color,#2e2722)}",
      ".invitta-vip-access-note{margin:18px auto 0;max-width:320px;font:400 12px/1.7 var(--font-sans,Arial,sans-serif);letter-spacing:.04em;color:var(--text-muted,#756b64)}",
      ".invitta-vip-access.is-dark .invitta-vip-access-card{background:#171214;border-color:rgba(214,178,86,.42);box-shadow:0 24px 60px rgba(0,0,0,.32)}",
      ".invitta-vip-access.is-dark .invitta-vip-access-title,.invitta-vip-access.is-dark .invitta-vip-access-name,.invitta-vip-access.is-dark .invitta-vip-access-meta{color:#f7f0e6}",
      ".invitta-vip-access.is-dark .invitta-vip-access-note{color:#c9bfb5}",
      "@media(max-width:640px){.invitta-vip-access{margin:54px auto;padding:0 14px}.invitta-vip-access-card{padding:36px 20px}.invitta-vip-access-meta{gap:18px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function applyVipAccessPass() {
    var isVip = data.qrAccessEnabled === true || String(templateId || "").endsWith("-vip");
    if (!isVip || !data.guestToken || !data.guestName) return;
    if (typeof window.QRCode !== "function") {
      if (vipAccessRetryCount < 30) {
        vipAccessRetryCount += 1;
        window.setTimeout(applyVipAccessPass, 100);
      }
      return;
    }
    if (document.querySelector("[data-invitta-vip-access]")) return;

    ensureVipAccessStyles();
    var checkinUrl = new URL("/administracion/checkin.html", document.baseURI);
    checkinUrl.searchParams.set("token", data.guestToken);

    var section = document.createElement("section");
    section.className = "invitta-vip-access" + (String(templateId).includes("midnight") ? " is-dark" : "");
    section.dataset.invittaVipAccess = "true";
    section.setAttribute("aria-label", "Pase de acceso VIP");
    section.innerHTML = '<div class="invitta-vip-access-card">' +
      '<p class="invitta-vip-access-kicker">Acceso exclusivo</p>' +
      '<h2 class="invitta-vip-access-title">Pase VIP</h2>' +
      '<p class="invitta-vip-access-name"></p>' +
      '<div class="invitta-vip-access-qr" aria-label="Codigo QR personal de acceso"></div>' +
      '<div class="invitta-vip-access-meta"><span class="invitta-vip-passes"></span><span class="invitta-vip-table"></span></div>' +
      '<p class="invitta-vip-access-note">Presenta este codigo en la entrada. Es personal y solo puede validarse una vez.</p>' +
      '</div>';

    section.querySelector(".invitta-vip-access-name").textContent = data.guestName;
    section.querySelector(".invitta-vip-passes").textContent = (data.passes || 1) + " pase(s)";
    section.querySelector(".invitta-vip-table").textContent = data.table ? "Mesa " + data.table : "Mesa por asignar";
    new window.QRCode(section.querySelector(".invitta-vip-access-qr"), {
      text: checkinUrl.toString(),
      width: 186,
      height: 186,
      colorDark: "#171411",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.H
    });

    var anchor = document.querySelector("section#rsvp, section[id*='rsvp'], section[id*='confirm']");
    if (!anchor) {
      var rsvpAction = Array.from(document.querySelectorAll("a, button")).find(function (element) {
        return /CONFIRMAR|WHATSAPP|RSVP/i.test(element.textContent || "") && element.closest("section");
      });
      anchor = rsvpAction && rsvpAction.closest("section");
    }
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(section, anchor);
    } else {
      var footer = document.querySelector("footer");
      (footer && footer.parentNode ? footer.parentNode : document.body).insertBefore(section, footer || null);
    }
  }

  function applyConfirmationContacts() {
    var phones = Array.isArray(data.confirmationPhones)
      ? data.confirmationPhones.filter(Boolean).slice(0, 2)
      : [data.whatsapp].filter(Boolean);
    if (!phones.length) return;

    var whatsappActions = Array.from(document.querySelectorAll("a, button")).filter(function (element) {
      return /WHATSAPP/i.test(element.textContent || "");
    });

    whatsappActions.forEach(function (element) {
      if (!element.dataset.invittaPhone) element.dataset.invittaPhone = phones[0];
    });

    if (phones.length < 2 || !whatsappActions.length || document.querySelector("[data-invitta-secondary-contact]")) return;

    var primary = whatsappActions[whatsappActions.length - 1];
    var secondary = primary.cloneNode(true);
    secondary.removeAttribute("id");
    secondary.dataset.invittaPhone = phones[1];
    secondary.dataset.invittaSecondaryContact = "true";
    secondary.setAttribute("aria-label", "Confirmar con el segundo contacto");
    secondary.textContent = "CONFIRMAR CON SEGUNDO CONTACTO";
    primary.insertAdjacentElement("afterend", secondary);
  }

  function confirmationMessage() {
    var guest = data.guestName || "Invitado";
    var table = data.table ? "\nMesa: " + data.table : "";
    return "Hola, confirmo mi asistencia.\nInvitado: " + guest + "\nPases asignados: " + (data.passes || 1) + table;
  }

  function selectedPasses() {
    var selected = Array.from(document.querySelectorAll("select")).find(function (select) {
      return select.offsetParent !== null && /\d+/.test(String(select.value || ""));
    });
    var parsed = Number(selected && String(selected.value).match(/\d+/)?.[0]);
    var limit = Math.max(1, Number(data.passes || 1));
    return Math.max(1, Math.min(Number.isFinite(parsed) && parsed > 0 ? parsed : limit, limit));
  }

  function reportRsvp(attending) {
    if (!data.guestToken || window.parent === window) return;
    window.parent.postMessage({
      type: "invitta:rsvp",
      attending: attending,
      confirmedPasses: attending ? selectedPasses() : 0,
      message: ""
    }, "*");
  }

  function hideLegacyGuestAdmin() {
    try {
      window.localStorage.removeItem("invitta_rsvps");
      Object.keys(window.localStorage).forEach(function (key) {
        if (/^rsvp_/i.test(key)) window.localStorage.removeItem(key);
      });
    } catch (error) {
      // Storage can be unavailable in privacy mode.
    }

    document.querySelectorAll("a, button").forEach(function (element) {
      if (/^(ADMIN|PANEL DE (CONTROL|INVITADOS)|BUZ[OÓ]N RSVP|BUZ[OÓ]N DE CONFIRMACIONES|INGRESAR AL PANEL)$/i.test((element.textContent || "").trim())) {
        element.style.display = "none";
      }
    });
  }

  function installClickBridge() {
    document.addEventListener("click", function (event) {
      var target = event.target.closest("a, button");
      if (!target) return;

      if (target.dataset.invittaUrl) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.open(target.dataset.invittaUrl, "_blank", "noopener");
        return;
      }

      var confirmationPhone = target.dataset.invittaPhone || data.whatsapp;
      if (/WHATSAPP|SEGUNDO CONTACTO/i.test(target.textContent || "") && confirmationPhone) {
        event.preventDefault();
        event.stopImmediatePropagation();
        reportRsvp(true);
        window.open("https://wa.me/" + confirmationPhone + "?text=" + encodeURIComponent(confirmationMessage()), "_blank", "noopener");
        return;
      }

      if (/NO ASISTIR|NO PODR|DECLINAR/i.test(target.textContent || "")) {
        reportRsvp(false);
      }
    }, true);
  }

  function applyThemeHooks() {
    var root = document.documentElement;
    var palettePresets = {
      champagne: {
        surface: "#F7F0E7",
        card: "#FFFDFC",
        title: "#40362E",
        body: "#66594F",
        accent: "#B99654"
      },
      rose: {
        surface: "#FAF0F0",
        card: "#FFFDFD",
        title: "#704853",
        body: "#725C63",
        accent: "#C88A97"
      },
      sage: {
        surface: "#F1F3EC",
        card: "#FEFEFC",
        title: "#405144",
        body: "#5D665B",
        accent: "#718067"
      },
      emerald: {
        surface: "#F0F4EF",
        card: "#FCFDFC",
        title: "#1F493B",
        body: "#475C52",
        accent: "#1E6A52"
      },
      midnight: {
        surface: "#1C1920",
        card: "#28232B",
        title: "#F6EAD2",
        body: "#DDD2C5",
        accent: "#C5A355"
      },
      "terracotta-sand": {
        surface: "#F4E6D8",
        card: "#FFF8F0",
        title: "#512F28",
        body: "#74564A",
        accent: "#D26345"
      },
      "plum-olive": {
        surface: "#EEEBDD",
        card: "#F8F5EC",
        title: "#3D1831",
        body: "#5F5C42",
        accent: "#7A7D45"
      },
      "opal-blue": {
        surface: "#EAF2F4",
        card: "#F8FAFC",
        title: "#263B5B",
        body: "#59697B",
        accent: "#8B79A8"
      },
      "emerald-jewel": {
        surface: "#E8EFEA",
        card: "#F8F7F0",
        title: "#0E3B31",
        body: "#3F5B52",
        accent: "#C19A3C"
      },
      "celestial-navy": {
        surface: "#0C1630",
        card: "#142345",
        title: "#F5EBD5",
        body: "#C9D1E2",
        accent: "#D6AF4B"
      }
    };
    var palette = palettePresets[data.palettePreset];

    if (palette) {
      root.dataset.invittaPalette = data.palettePreset;
      root.style.setProperty("--invitta-surface", palette.surface);
      root.style.setProperty("--invitta-card", palette.card);
      root.style.setProperty("--invitta-title", palette.title);
      root.style.setProperty("--invitta-body", palette.body);
      root.style.setProperty("--invitta-accent", palette.accent);
      root.style.setProperty("--color-background", palette.surface);
      root.style.setProperty("--color-paper", palette.surface);
      root.style.setProperty("--color-surface", palette.card);
      root.style.setProperty("--color-ink", palette.title);
      root.style.setProperty("--color-primary", palette.accent);
      root.style.setProperty("--color-sage", palette.accent);
    } else {
      delete root.dataset.invittaPalette;
    }

    if (data.colorPrimary && !palette) {
      root.style.setProperty("--invitta-primary", data.colorPrimary);
      root.style.setProperty("--color-primary", data.colorPrimary);
      root.style.setProperty("--color-sage", data.colorPrimary);
      root.style.setProperty("--primary-color", data.colorPrimary);
      root.style.setProperty("--accent-color", data.colorPrimary);
    }
    if (data.colorSecondary && !palette) {
      root.style.setProperty("--invitta-secondary", data.colorSecondary);
      root.style.setProperty("--secondary-color", data.colorSecondary);
      root.style.setProperty("--color-outline-variant", data.colorSecondary);
    }

    var fontPresets = {
      classic: {
        display: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
        body: '"Montserrat", "Hanken Grotesk", Arial, sans-serif'
      },
      romantic: {
        display: '"Great Vibes", "Cormorant Garamond", cursive',
        body: '"Montserrat", "Hanken Grotesk", Arial, sans-serif'
      },
      editorial: {
        display: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
        body: '"Hanken Grotesk", "Montserrat", Arial, sans-serif'
      },
      minimal: {
        display: '"Montserrat", "Hanken Grotesk", Arial, sans-serif',
        body: '"Montserrat", "Hanken Grotesk", Arial, sans-serif'
      },
      luxury: {
        display: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
        body: '"Hanken Grotesk", "Montserrat", Arial, sans-serif'
      },
      signature: {
        display: '"Allura", "Great Vibes", cursive',
        body: '"Cormorant Garamond", Georgia, serif'
      },
      couture: {
        display: '"Parisienne", "Great Vibes", cursive',
        body: '"Montserrat", "Hanken Grotesk", Arial, sans-serif'
      },
      custom: {
        display: '"InvittaCustom", "Cormorant Garamond", Georgia, serif',
        body: '"Montserrat", "Hanken Grotesk", Arial, sans-serif'
      }
    };
    var basePreset = data.fontPreset === "custom" ? "classic" : data.fontPreset;
    var fonts = fontPresets[basePreset] || fontPresets.classic;
    root.style.setProperty("--font-display", fonts.display);
    root.style.setProperty("--font-serif", fonts.display);
    root.style.setProperty("--font-primary", fonts.display);
    root.style.setProperty("--font-sans", fonts.body);
    root.style.setProperty("--font-secondary", fonts.body);

    var roleConfig = data.typographyRoles || {};
    var needsSignatureFonts = basePreset === "signature" || basePreset === "couture" || typographyRoleOrder.some(function(role) {
      var source = roleConfig[role] && roleConfig[role].font;
      return source === "signature" || source === "couture";
    });
    if (needsSignatureFonts && !document.getElementById("invitta-signature-fonts")) {
      var fontLink = document.createElement("link");
      fontLink.id = "invitta-signature-fonts";
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Allura&family=Parisienne&display=swap";
      document.head.appendChild(fontLink);
    }

    var typographyFonts = Array.isArray(data.typographyFonts) ? data.typographyFonts.slice(0, 4) : [];
    if (!typographyFonts.length && data.customFontUrl) {
      typographyFonts = [{ id: "font-legacy-custom", name: data.customFontName || "Tipografía personalizada", url: data.customFontUrl }];
    }
    var customFontFamilies = typographyFonts.reduce(function(map, font) {
      var safeId = String(font.id || "").replace(/[^A-Za-z0-9_-]/g, "");
      if (safeId && font.url) map[font.id] = "InvittaUserFont_" + safeId;
      return map;
    }, {});
    if (typographyFonts.length) {
      var customFontStyle = document.getElementById("invitta-custom-font-face");
      if (!customFontStyle) {
        customFontStyle = document.createElement("style");
        customFontStyle.id = "invitta-custom-font-face";
        document.head.appendChild(customFontStyle);
      }
      customFontStyle.textContent = typographyFonts.map(function(font) {
        var family = customFontFamilies[font.id];
        if (!family) return "";
        var extension = font.url.split("?")[0].split(".").pop().toLowerCase();
        var format = extension === "woff2" ? "woff2" : extension === "woff" ? "woff" : extension === "otf" ? "opentype" : "truetype";
        return '@font-face{font-family:"' + family + '";src:url(' + JSON.stringify(font.url) + ') format("' + format + '");font-style:normal;font-weight:400;font-display:swap;}';
      }).join("");
    }

    var typographyRoleStyle = document.getElementById("invitta-typography-roles");
    if (!typographyRoleStyle) {
      typographyRoleStyle = document.createElement("style");
      typographyRoleStyle.id = "invitta-typography-roles";
      document.head.appendChild(typographyRoleStyle);
    }
    typographyRoleStyle.textContent = typographyRoleOrder.map(function(role) {
      var source = roleConfig[role] && roleConfig[role].font || "inherit";
      var customFamily = customFontFamilies[source] || (source === "custom" && typographyFonts[0] ? customFontFamilies[typographyFonts[0].id] : "");
      var selected = customFamily
        ? { display: '"' + customFamily + '", "Cormorant Garamond", Georgia, serif', body: '"' + customFamily + '", "Montserrat", Arial, sans-serif' }
        : (source === "inherit" ? fonts : fontPresets[source]);
      if (!selected) selected = fonts;
      var family = role === "body" || role === "labels" ? selected.body : selected.display;
      var scopedSelectors = typographyRoleSelectors[role].split(",").map(function(selector) {
        return "html body " + selector;
      }).join(",");
      return scopedSelectors + "{font-family:" + family + "!important;}";
    }).join("");

    if (data.titleColor) root.style.setProperty("--invitta-title", data.titleColor);
    if (data.bodyColor) root.style.setProperty("--invitta-body", data.bodyColor);
    if (data.accentColor) {
      root.style.setProperty("--invitta-accent", data.accentColor);
      root.style.setProperty("--invitta-primary", data.accentColor);
      root.style.setProperty("--color-primary", data.accentColor);
      root.style.setProperty("--color-sage", data.accentColor);
      root.style.setProperty("--primary-color", data.accentColor);
      root.style.setProperty("--accent-color", data.accentColor);
    }

    var existingStyle = document.getElementById("invitta-visual-customization");
    if (existingStyle) existingStyle.remove();

    if (!palette && !data.titleColor && !data.bodyColor && !data.accentColor) return;

    var style = document.createElement("style");
    style.id = "invitta-visual-customization";
    style.textContent = [
      "html[data-invitta-palette] body{background:var(--invitta-surface)!important;color:var(--invitta-body)!important}",
      "html[data-invitta-palette] [class*='bg-paper'],html[data-invitta-palette] [class*='bg-cream'],html[data-invitta-palette] [class*='bg-ivory']{background-color:var(--invitta-card)!important}",
      "h1,h2,h3,.font-display,.font-serif{color:var(--invitta-title)!important}",
      "p,.font-sans,.font-body{color:var(--invitta-body)!important}",
      "[class*='text-sage'],[class*='text-gold'],[class*='text-accent']{color:var(--invitta-accent)!important}",
      "[class*='border-sage'],[class*='border-gold'],[class*='border-accent']{border-color:var(--invitta-accent)!important}",
      "[class*='bg-sage'],[class*='bg-gold'],[class*='bg-accent']{background-color:var(--invitta-accent)!important}",
      "h1,h2,h3,.font-display,.font-serif{font-family:var(--font-display),var(--font-serif),Georgia,serif!important}",
      "body,button,input,select,textarea,.font-sans,.font-body{font-family:var(--font-sans),var(--font-secondary),Arial,sans-serif}"
    ].join("");
    document.head.appendChild(style);
  }

  function applyAll() {
    if (applying || !document.body) return;
    applying = true;
    replaceText(document.body);
    applyImages();
    applySectionBackgrounds();
    applyAudio();
    applyOptionalContent();
    applyLinks();
    applyGuestData();
    applyVipAccessPass();
    applyConfirmationContacts();
    applyTypographyScales(false);
    hideLegacyGuestAdmin();
    applying = false;
  }

  applyThemeHooks();
  applyTypographyScales(true);
  installClickBridge();
  applyAll();

  var observer = new MutationObserver(function () {
    window.requestAnimationFrame(applyAll);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("load", applyAll);
  window.addEventListener("resize", function() {
    window.clearTimeout(typographyResizeTimer);
    typographyResizeTimer = window.setTimeout(function() { applyTypographyScales(true); }, 140);
  }, { passive: true });
  window.setTimeout(applyAll, 500);
  window.setTimeout(applyAll, 1500);
})();
