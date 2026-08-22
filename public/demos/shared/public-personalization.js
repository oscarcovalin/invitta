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
    // A scale is only written when Studio has an explicit override. This
    // preserves native responsive typography at 100%, while making the
    // per-role size controls effective at 75–150%.
    typographyScaledElements.forEach(restoreTypographyScale);
    typographyScaledElements.clear();

    // A scale of 1 must be a true no-op. Writing an inline !important value
    // even at 1x freezes the native hierarchy of a template (especially
    // editorial titles) and prevents its responsive CSS from working.
    var hasOverrides = typographyRoleOrder.some(function(target) {
      return Math.abs(typographyScaleFor(target) - 1) > 0.001;
    });
    if (!hasOverrides) return;

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
    to = to === undefined || to === null ? "" : String(to).trim();
    if (from && from !== to) list.push([from, to]);
  }

  function addExactReplacement(list, from, to) {
    from = clean(from);
    to = to === undefined || to === null ? "" : String(to).trim();
    if (from && from !== to) list.push([from, to, true]);
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
      addExactReplacement(list, "Carlos", groom.given || groom.first); // Fix for split nodes
      addExactReplacement(list, "& Carlos", groom.given ? "& " + groom.given : ""); // Legacy
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
      addExactReplacement(list, "Carmen", parts.middle); // Handle split Carmen
      addExactReplacement(list, "Arevalo", parts.last); // In case it renders Arevalo
      addExactReplacement(list, "Mary Carmen", parts.firstTwo || parts.first);
    } else if (templateId === "xv-champagne-rose-vip") {
      addExactReplacement(list, "Ana", parts.first);
      addExactReplacement(list, "Camila", parts.middle);
      addExactReplacement(list, "Zavala", parts.last);
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

    // This bridge is only mounted by the public renderer. Keep replacement
    // data-bound: template demo copy is never a source of public invitation
    // data and an empty studio field must not revive a demo value.
    if (!isRealStudioInvitation()) return list;

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
      // Demo names are also present in testimonials, guest examples and
      // supporting copy. Only replace a complete, leaf editorial label;
      // substring replacement turns those unrelated places into duplicates.
      if (!node.parentElement || node.parentElement.children.length !== 0) continue;
      var value = node.nodeValue.trim();
      if (/^Hecho con amor para\s+(?:Mariana\s*&\s*Diego|Ana Camila\s*&\s*Carlos(?:\s+Zavala\s*&\s+Gonz[aá]lez)?|Ana Camila Zavala|Mary Carmen Arevalo)$/i.test(value)) {
        value = "Hecho con amor para " + clean(data.celebrantName);
      }
      replacements.forEach(function (pair) {
        if (value === pair[0]) value = pair[1];
      });
      if (value !== node.nodeValue.trim()) {
        node.nodeValue = value;
        if (node.parentElement) {
          node.parentElement.setAttribute("data-invitta-dynamic-text", "true");
          node.parentElement.style.setProperty("text-transform", "none", "important");
        }
      }
    }
  }

  function ensureFamilyTitleStyles() {
    if (document.getElementById("invitta-family-title-styles")) return;
    var style = document.createElement("style");
    style.id = "invitta-family-title-styles";
    style.textContent = [
      "[data-invitta-family-title] { display:block; margin-bottom:0.85rem; font-family:var(--font-sans, Arial, sans-serif) !important; font-size:clamp(10px, 2.4vw, 12px) !important; font-weight:600 !important; letter-spacing:0.28em !important; line-height:1.45 !important; text-transform:uppercase !important; }"
    ].join("\\n");
    document.head.appendChild(style);
  }

  function markFamilySectionTitles() {
    Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,.section-title,.inv-section-title")).forEach(function(element) {
      var label = clean(element.textContent).replace(/\\s+/g, " ");
      var kind = "";
      if (/^(?:padres(?: del| de la| de los)?|con la bendici[oó]n de nuestras familias)/i.test(label)) {
        kind = "parents";
      } else if (/^(?:nuestros? )?padrinos(?: de honor)?$/i.test(label)) {
        kind = "godparents";
      }
      if (!kind) return;
      element.dataset.invittaFamilyTitle = kind;
      if (!element.dataset.invittaFontRole) element.dataset.invittaFontRole = "section-title";
    });
  }

  function restoreCanonicalNameCasing() {
    var name = clean(data.celebrantName);
    if (!name) return;
    var parts = isWedding
      ? name.split(/\s*(?:&|\by\b)\s*/i).filter(Boolean)
      : [name];
    var canonical = [name].concat(parts);

    Array.from(document.querySelectorAll("[data-invitta-dynamic-text]")).forEach(function(element) {
      var visible = clean(element.textContent);
      var match = canonical.find(function(candidate) {
        return visible.toLocaleLowerCase() === candidate.toLocaleLowerCase();
      });
      if (match && visible !== match) element.textContent = match;
      if (/^Hecho con amor para\b/i.test(visible) && visible.toLocaleLowerCase().indexOf(parts[0].toLocaleLowerCase()) !== -1) {
        element.textContent = "Hecho con amor para " + name;
      }
    });
  }

  function applyCoverNameSizing() {
    if (!clean(data.celebrantName)) return;
    if (!document.getElementById("invitta-cover-name-sizing")) {
      var style = document.createElement("style");
      style.id = "invitta-cover-name-sizing";
      style.textContent = [
        "[data-invitta-cover-name-size]{font-size:clamp(2.8rem,13vw,6rem)!important;line-height:.92!important;letter-spacing:clamp(-.055em,-.02em,-.012em)!important;max-inline-size:calc(100vw - 2rem)!important;margin-inline:auto!important;overflow-wrap:anywhere!important;text-wrap:balance!important;}",
        "[data-invitta-cover-name-size] [data-invitta-cover-name-size]{font-size:inherit!important;line-height:inherit!important;letter-spacing:inherit!important;}",
        "@media(min-width:768px){[data-invitta-cover-name-size]{font-size:clamp(3.75rem,7.5vw,7.25rem)!important;max-inline-size:min(92vw,960px)!important;}}"
      ].join("");
      document.head.appendChild(style);
    }

    var fullName = clean(data.celebrantName);
    var nameParts = isWedding
      ? fullName.split(/\s*(?:&|\by\b)\s*/i).filter(Boolean)
      : [fullName];
    var structuralSelector = [
      ".hero__name", "#celebrant-name", ".inv-hero-name", ".couple-names", ".couple-name", ".honoree-name",
      "[data-invitta-font-role='cover-name']", "[data-invitta-font-role='name']"
    ].join(",");

    document.querySelectorAll(structuralSelector).forEach(function(element) {
      element.dataset.invittaCoverNameSize = "true";
      if (!element.dataset.invittaFontRole) element.dataset.invittaFontRole = "cover-name";
    });

    // A few React-based templates provide no stable class for the hero name.
    // Match only an exact celebrant/couple name in a display heading, so names
    // in parents, RSVP or the closing never inherit the cover scale.
    Array.from(document.querySelectorAll("h1,h2,h3,span")).forEach(function(element) {
      var visible = clean(element.textContent);
      var isExactFullName = visible.toLocaleLowerCase() === fullName.toLocaleLowerCase();
      var isHeroNamePart = nameParts.some(function(part) {
        return visible.toLocaleLowerCase() === clean(part).toLocaleLowerCase();
      }) && (element.tagName !== "SPAN" || element.closest("#hero,#cover,#portada,#inv-hero,[class*='hero'],[class*='cover']"));
      if (isExactFullName || isHeroNamePart) {
        element.dataset.invittaCoverNameSize = "true";
        if (!element.dataset.invittaFontRole) element.dataset.invittaFontRole = "cover-name";
      }
    });
  }

  function applyEditorialCoverMeta() {
    var name = clean(data.celebrantName);
    var formats = dateFormats(data.eventDate);
    if (!name || !formats) return;

    if (!document.getElementById("invitta-editorial-cover-meta")) {
      var style = document.createElement("style");
      style.id = "invitta-editorial-cover-meta";
      style.textContent = [
        "[data-invitta-editorial-event]{display:block!important;width:100%!important;align-self:center!important;margin-bottom:clamp(.65rem,3vw,1.1rem)!important;color:var(--inv-10,currentColor)!important;font-family:var(--font-sans,Arial,sans-serif)!important;font-size:clamp(.58rem,2.4vw,.76rem)!important;font-weight:600!important;letter-spacing:.24em!important;line-height:1.35!important;text-align:center!important;text-transform:uppercase!important;}",
        "[data-invitta-editorial-date]{display:block!important;width:100%!important;align-self:center!important;margin-top:clamp(.7rem,3vw,1.15rem)!important;color:var(--inv-10,currentColor)!important;font-family:var(--font-sans,Arial,sans-serif)!important;font-size:clamp(.58rem,2.4vw,.76rem)!important;font-weight:600!important;letter-spacing:.2em!important;line-height:1.45!important;text-align:center!important;text-transform:uppercase!important;}",
        "#hero #event-date,#cover #event-date,#portada #event-date,#inv-hero #event-date,.hero__date,.inv-hero-date{width:100%!important;align-self:center!important;text-align:center!important;}"
      ].join("\n");
      document.head.appendChild(style);
    }

    var coverName = Array.from(document.querySelectorAll("[data-invitta-cover-name-size]")).find(function(element) {
      return element.offsetParent !== null;
    });
    if (!coverName) return;
    var hero = coverName.closest("#hero,#cover,#portada,#inv-hero,[class*='hero'],[class*='cover']") || coverName.parentElement;
    if (!hero) return;

    var eventTitle = clean(data.eventTitle).toLocaleLowerCase();
    Array.from(hero.querySelectorAll("p,span,h1,h2,h3,h4")).forEach(function(element) {
      if (element.children.length !== 0) return;
      var value = clean(element.textContent).toLocaleLowerCase();
      if (value && (value === eventTitle || /^(?:mis quince a[nñ]os|nuestra boda|xv aniversario)$/i.test(value))) {
        element.dataset.invittaEditorialEvent = "true";
        if (!element.dataset.invittaFontRole) element.dataset.invittaFontRole = "main-title";
      }
    });

    var dateText = formats.dotted.toLocaleUpperCase("es-MX");
    var existingDate = Array.from(hero.querySelectorAll("#event-date,.hero__date,.inv-hero-date,[data-invitta-event-date],[data-invitta-editorial-date]")).find(function(element) {
      return element.offsetParent !== null;
    });
    if (existingDate) {
      existingDate.textContent = dateText;
      existingDate.dataset.invittaEditorialDate = "true";
      if (!existingDate.dataset.invittaFontRole) existingDate.dataset.invittaFontRole = "label";
      return;
    }

    // Some React templates omit a hero date entirely. Add only that missing
    // datum directly after the real name; never duplicate an existing date.
    var date = document.createElement("p");
    date.className = "invitta-editorial-cover-date";
    date.dataset.invittaEditorialDate = "true";
    date.dataset.invittaFontRole = "label";
    date.textContent = dateText;
    coverName.insertAdjacentElement("afterend", date);
  }

  function applyPlumNoirWeddingAdapter() {
    if (templateId !== "boda-midnight-gold-vip" || !isWedding) return;
    var couple = clean(data.celebrantName)
      .split(/\s*(?:&|\by\b)\s*/i)
      .map(function(part) { return part.trim(); })
      .filter(Boolean);
    if (couple.length < 2) return;

    // Midnight's source contains two hero name treatments. The compact one
    // duplicates the large editorial treatment on mobile, so the adapter
    // retains the latter and fills it from the two explicit wedding names.
    Array.from(document.querySelectorAll("h2")).forEach(function(heading) {
      if (/font-serif/.test(heading.className || "") && /text-2xl|text-3xl/.test(heading.className || "")) {
        var text = clean(heading.textContent);
        if (/^(?:Ana Camila\s*&\s*Carlos|Alicia\s+(?:&|y)\s+Gonzalo)$/i.test(text)) {
          heading.style.setProperty("display", "none", "important");
        }
      }
    });

    var editorialHeading = document.querySelector("h2.font-display");
    if (!editorialHeading) return;
    var pieces = Array.from(editorialHeading.querySelectorAll("span"));
    if (pieces[0]) pieces[0].textContent = couple[0];
    if (pieces[1]) pieces[1].textContent = "& " + couple[1];
    if (pieces[2]) {
      pieces[2].textContent = "";
      pieces[2].style.setProperty("display", "none", "important");
    }
  }

  function cleanRsvpMessageLabels() {
    // A legacy RSVP label interpolated the celebrant using a literal "$".
    // Limit the repair to the congratulation label so currency or other
    // meaningful symbols elsewhere in an invitation remain untouched.
    Array.from(document.querySelectorAll("label, p, span, h1, h2, h3, h4, h5, h6")).forEach(function(element) {
      if (element.children.length !== 0) return;
      var value = element.textContent || "";
      if (!/mensaje de felicitaci[oó]n/i.test(value) || value.indexOf("$") === -1) return;
      var corrected = value.replace(/\$\s*(?=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, "");
      if (corrected === value) return;
      element.textContent = corrected;
      element.setAttribute("data-invitta-dynamic-text", "true");
    });
  }

  function applyItineraryHeading() {
    // Keep each template's native heading class and editorial typography;
    // only replace its generic copy with the product-wide section name.
    Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span")).forEach(function(element) {
      if (element.children.length !== 0) return;
      if (clean(element.textContent) !== "PROGRAMACIÓN") return;
      element.textContent = "Minuto a Minuto";
      element.setAttribute("data-invitta-dynamic-text", "true");
    });
  }

  function normalizeLocationHeading() {
    // This is product copy, not a style override. Preserve each template's
    // own element, font and animation while keeping the section title
    // consistently capitalized across every invitation.
    Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span")).forEach(function(element) {
      if (element.children.length !== 0) return;
      if (clean(element.textContent).toLocaleLowerCase("es-MX") !== "¿dónde celebraremos?") return;
      element.textContent = "¿Dónde Celebraremos?";
      element.setAttribute("data-invitta-dynamic-text", "true");
    });
  }

  function hideSectionWithHeading(headingText) {
    var heading = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, span, p")).find(function (element) {
      return clean(element.textContent) === headingText;
    });
    var section = heading && heading.closest("section");
    if (section) section.style.setProperty("display", "none", "important");
  }

  function hideUnsupportedPlumNoirSamples() {
    // These modules ship with static demonstration records. Invitta has no
    // persisted data model for collaborative albums or lodging yet, therefore
    // they must not be published as event content.
    var collaborativeAlbum = document.getElementById("collaborative-album");
    if (collaborativeAlbum) collaborativeAlbum.style.setProperty("display", "none", "important");
    hideSectionWithHeading("Álbum Colaborativo");
    hideSectionWithHeading("Sugerencias de Hospedaje");

    if (templateId !== "boda-midnight-gold-vip") return;

    // The agenda is configurable in Studio. Without entries, avoid showing
    // the template's fictional schedule.
    if (!Array.isArray(data.itinerary) || data.itinerary.length === 0) {
      hideSectionWithHeading("PROGRAMACIÓN");
      hideSectionWithHeading("Minuto a Minuto");
    }
  }

  function isPhotoUrl(url) {
    return /\.(?:png|jpe?g|webp)(?:\?|$)/i.test(url || "") && !/(logo|icon|qr|section_bg|wedding_bg)/i.test(url || "");
  }

  function isGalleryContainer(element) {
    if (!element || !element.closest) return false;
    return Boolean(element.closest(
      "#gallery, [id*='gallery' i], [id*='galeria' i], [id*='galería' i], " +
      "[class*='gallery' i], [class*='galeria' i], [class*='galería' i], " +
      ".inv-moments-section, .inv-gallery-section, #inv-gallery-section, [id*='photo-grid' i]"
    ));
  }

  function isHeroMedia(element) {
    if (!element || !element.closest) return false;
    return Boolean(element.closest(
      "#hero, #cover, #portada, #inv-hero, .hero, .cover, .portada, " +
      ".inv-hero, .inv-hero-bg, [data-hero-img], [data-hero-bg]"
    ));
  }

  function isDemoHeroAsset(src) {
    if (!src || typeof src !== "string") return false;
    return /(classic-wedding-hero|golden-romance-hero|midnight-hero|royal-hero|champagne-hero|natasha-005)/i.test(src);
  }

  function isDemoGalleryAsset(src) {
    if (!src || typeof src !== "string") return false;
    return /(classic-wedding-gallery|golden-romance-gallery|midnight-gallery|royal-gallery|champagne-gallery|natasha-008|natasha-012|natasha-015|natasha-021)/i.test(src);
  }

  function getOriginalGalleryIndex(url) {
    if (!url || typeof url !== "string") return -1;
    var cleanUrl = url.split("?")[0].toLowerCase();
    var mClassic = cleanUrl.match(/classic-wedding-gallery-0(\d)/);
    if (mClassic) return parseInt(mClassic[1], 10) - 2;
    var mGolden = cleanUrl.match(/golden-romance-gallery-0(\d)/);
    if (mGolden) return parseInt(mGolden[1], 10) - 2;
    var mMidnight = cleanUrl.match(/midnight-gallery-(\d+)/);
    if (mMidnight) return parseInt(mMidnight[1], 10) - 2;
    var mRoyal = cleanUrl.match(/royal-gallery-0(\d)/);
    if (mRoyal) return parseInt(mRoyal[1], 10) - 1;
    var mChampagne = cleanUrl.match(/champagne-gallery-(\d+)/);
    if (mChampagne) return parseInt(mChampagne[1], 10) - 2;
    if (cleanUrl.indexOf("natasha-008") !== -1) return 0;
    if (cleanUrl.indexOf("natasha-012") !== -1) return 1;
    if (cleanUrl.indexOf("natasha-015") !== -1) return 2;
    if (cleanUrl.indexOf("natasha-021") !== -1) return 3;
    var mGeneric = cleanUrl.match(/gallery[-_]?0?(\d+)/);
    if (mGeneric) return parseInt(mGeneric[1], 10) - 1;
    return -1;
  }

  function getGallerySlotWrapper(img) {
    if (!img) return null;
    var wrapper = img.closest(".cursor-pointer, [role='listitem'], figure, li, [class*='gallery-item'], [class*='gallery-card'], [class*='moment']");
    if (wrapper && wrapper !== document.body && !wrapper.matches("#gallery, [id*='gallery' i], [id*='galeria' i], [id*='galería' i]")) {
      return wrapper;
    }
    if (img.parentElement && img.parentElement !== document.body && !img.parentElement.matches("#gallery, [id*='gallery' i], [id*='galeria' i], [id*='galería' i]")) {
      return img.parentElement;
    }
    return img;
  }

  function isDemoAudio(url) {
    if (!url || typeof url !== "string") return false;
    return /(what-a-wonderful-world|a-thousand-years|marry-you|SoundHelix|million-to-one|rose-gold|the-climb|\.mp3)/i.test(url);
  }

  function applyHeroImage() {
    var heroUrl = data.mainPhotoUrl;

    // 1. Reemplazar elementos <img> en la sección Hero / Portada
    var heroImages = Array.from(document.querySelectorAll(
      "#hero img, [id*='hero' i] img, [id*='cover' i] img, [id*='portada' i] img, " +
      "[class*='hero' i] img, [class*='cover' i] img, [class*='portada' i] img, " +
      ".hero img, .cover img, .inv-hero img, #inv-hero img, #inv-hero-img, [data-hero-img]"
    )).filter(function (img) {
      if (isGalleryContainer(img)) return false;
      var src = img.currentSrc || img.src || "";
      if (/(logo|icon|qr|section_bg|wedding_bg)/i.test(src)) return false;
      return true;
    });

    // Detectar también por asset de demo hero conocido
    Array.from(document.images).forEach(function (img) {
      if (isGalleryContainer(img)) return false;
      var src = img.dataset.invittaOriginalSrc || img.currentSrc || img.src || "";
      if (isDemoHeroAsset(src) && heroImages.indexOf(img) === -1) {
        heroImages.push(img);
      }
    });

    // 2. Reemplazar background-image en elementos Hero / Portada
    var heroBgElements = Array.from(document.querySelectorAll(
      "#hero, [id*='hero' i], [id*='cover' i], [id*='portada' i], " +
      "[class*='hero' i], [class*='cover' i], [class*='portada' i], " +
      ".hero, .cover, .inv-hero, .inv-hero-bg, #inv-hero, #inv-hero-bg, [data-hero-bg]"
    )).filter(function (el) {
      if (isGalleryContainer(el)) return false;
      return true;
    });

    if (heroUrl && typeof heroUrl === "string") {
      heroImages.forEach(function (img) {
        if (!img.dataset.invittaOriginalSrc) {
          img.dataset.invittaOriginalSrc = img.currentSrc || img.src;
        }
        img.dataset.invittaPersonalized = "true";
        img.dataset.invittaPersonalizedSrc = heroUrl;

        // Si está dentro de <picture>, actualizar los <source>
        if (img.parentElement && img.parentElement.tagName.toLowerCase() === "picture") {
          img.parentElement.querySelectorAll("source").forEach(function (sourceEl) {
            sourceEl.srcset = heroUrl;
          });
        }

        if (img.hasAttribute("srcset")) {
          img.removeAttribute("srcset");
        }
        if (img.src !== heroUrl) {
          img.src = heroUrl;
        }
        img.style.removeProperty("display");
      });

      heroBgElements.forEach(function (el) {
        var currentBg = el.style.backgroundImage || "";
        var isExplicitHeroBg = el.id === "inv-hero-bg" || el.classList.contains("inv-hero-bg") || el.hasAttribute("data-hero-bg");
        if (currentBg || isExplicitHeroBg) {
          if (currentBg && /(logo|icon|qr|pattern|overlay|section_bg|wedding_bg)/i.test(currentBg)) return;
          el.dataset.invittaPersonalized = "true";
          el.dataset.invittaPersonalizedSrc = heroUrl;
          el.style.backgroundImage = 'url("' + heroUrl.replace(/"/g, "") + '")';
          if (isExplicitHeroBg && el.style.display === "none") {
            el.style.display = "";
          }
        }
      });
    } else {
      // En invitaciones reales sin foto principal: ocultar los placeholders demo de portada
      heroImages.forEach(function (img) {
        var source = img.dataset.invittaOriginalSrc || img.currentSrc || img.src || "";
        if (isDemoHeroAsset(source)) {
          img.style.setProperty("display", "none", "important");
        }
      });

      heroBgElements.forEach(function (el) {
        var currentBg = el.style.backgroundImage || "";
        var isExplicitHeroBg = el.id === "inv-hero-bg" || el.classList.contains("inv-hero-bg") || el.hasAttribute("data-hero-bg");
        if (isExplicitHeroBg) {
          el.style.setProperty("display", "none", "important");
        } else if (currentBg && isDemoHeroAsset(currentBg)) {
          el.style.setProperty("background-image", "none", "important");
        }
      });
    }
  }

  function applyInternalEditorialImages() {
    // Eliminar imágenes de stock demo usadas como fondo en secciones internas
    Array.from(document.querySelectorAll("[style*='background-image']")).forEach(function (el) {
      if (isGalleryContainer(el)) return;
      if (isHeroMedia(el)) return;
      var bg = el.style.backgroundImage || "";
      if (isDemoGalleryAsset(bg) || isDemoHeroAsset(bg)) {
        el.style.setProperty("background-image", "none", "important");
      }
    });

    Array.from(document.images).forEach(function (img) {
      if (isGalleryContainer(img)) return;
      if (isHeroMedia(img)) return;
      var src = img.dataset.invittaOriginalSrc || img.currentSrc || img.src || "";
      if (isDemoGalleryAsset(src)) {
        // Hiding only the image leaves a framed, empty rectangle behind.
        // Hide the standalone editorial media block with it.
        var wrapper = img.closest(".cursor-zoom-in, .cursor-pointer, figure, .group, [class*='gallery-item']");
        if (wrapper && wrapper !== document.body) {
          wrapper.style.setProperty("display", "none", "important");
        } else {
          img.style.setProperty("display", "none", "important");
        }
      }
    });
  }

  function ensureGalleryStyles() {
    if (document.getElementById("invitta-gallery-styles")) return;
    var style = document.createElement("style");
    style.id = "invitta-gallery-styles";
    style.textContent = [
      ".invitta-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; width: 100%; max-width: 1200px; margin: 32px auto 0; padding: 0 16px; box-sizing: border-box; }",
      "@media (min-width: 640px) {",
      "  .invitta-gallery-grid[data-count='1'] { grid-template-columns: minmax(280px, 480px); justify-content: center; }",
      "  .invitta-gallery-grid[data-count='2'] { grid-template-columns: repeat(2, minmax(240px, 420px)); justify-content: center; }",
      "  .invitta-gallery-grid[data-count='3'] { grid-template-columns: repeat(3, 1fr); }",
      "  .invitta-gallery-grid[data-count='4'] { grid-template-columns: repeat(2, 1fr); }",
      "}",
      "@media (min-width: 1024px) {",
      "  .invitta-gallery-grid[data-count='4'] { grid-template-columns: repeat(4, 1fr); }",
      "}",
      ".invitta-gallery-item { position: relative; overflow: hidden; border-radius: 8px; background: var(--inv-30, rgba(0,0,0,0.05)); aspect-ratio: 4 / 5; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; }",
      ".invitta-gallery-item:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12); }",
      ".invitta-gallery-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }",
      ".invitta-gallery-item:hover .invitta-gallery-img { transform: scale(1.04); }"
    ].join("\n");
    document.head.appendChild(style);
  }

  function openGalleryLightbox(url) {
    var existing = document.getElementById("invitta-gallery-lightbox");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.id = "invitta-gallery-lightbox";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;cursor:pointer;";

    var img = document.createElement("img");
    img.src = url;
    img.style.cssText = "max-width:92vw;max-height:90vh;object-fit:contain;border-radius:6px;box-shadow:0 10px 40px rgba(0,0,0,0.5);cursor:default;";
    img.addEventListener("click", function(e) { e.stopPropagation(); });

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = "position:absolute;top:20px;right:24px;background:rgba(255,255,255,0.2);color:#fff;border:none;width:40px;height:40px;border-radius:50%;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;";
    closeBtn.addEventListener("click", function() { overlay.remove(); });

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    overlay.addEventListener("click", function() { overlay.remove(); });
    document.body.appendChild(overlay);
  }

  function applyGalleryImages() {
    if (!isRealStudioInvitation()) return;

    var rawGallery = Array.isArray(data.galleryUrls) ? data.galleryUrls.filter(Boolean) : [];
    var gallery = [];
    var seen = {};
    for (var i = 0; i < rawGallery.length; i++) {
      var u = String(rawGallery[i]).trim();
      if ((u.startsWith("http://") || u.startsWith("https://")) && !seen[u]) {
        seen[u] = true;
        gallery.push(u);
      }
    }

    var isPremium = false;
    if (templateId && /premium|vip|pro/i.test(templateId)) isPremium = true;
    if (data.planTier && /premium|vip|pro/i.test(data.planTier)) isPremium = true;
    if (data.tier && /premium|vip|pro/i.test(data.tier)) isPremium = true;
    var maxGalleryCount = isPremium ? 10 : 4;
    gallery = gallery.slice(0, maxGalleryCount);

    var gallerySections = Array.from(document.querySelectorAll(
      "#gallery, [id='gallery'], [id='galeria'], [id='galería'], " +
      ".inv-moments-section, .inv-gallery-section, #inv-gallery-section"
    ));
    var galleryNavs = Array.from(document.querySelectorAll("nav button, nav a, .inv-nav-button"));

    if (gallery.length === 0) {
      gallerySections.forEach(function (sec) {
        sec.style.setProperty("display", "none", "important");
        sec.hidden = true;
      });
      galleryNavs.forEach(function(btn) {
        var text = (btn.textContent || "").toLowerCase();
        var href = (btn.getAttribute("href") || "").toLowerCase();
        if (/galer[ií]a|fotos|recuerdos|book/i.test(text) || /#gallery|#galeria/i.test(href)) {
          btn.style.setProperty("display", "none", "important");
        }
      });
      return;
    }

    // Reuse the template's own slots. This retains each template's original
    // composition, parallax, lightbox and responsive behavior instead of
    // placing a generic Invitta grid over its gallery.
    Array.from(document.images).forEach(function(img) {
      // Some Élégance assets use a gallery-style filename for the cover photo.
      // The hero is owned exclusively by applyHeroImage(), never by gallery slots.
      if (isHeroMedia(img)) return;
      var original = img.dataset.invittaOriginalSrc || img.currentSrc || img.src || "";
      var index = getOriginalGalleryIndex(original);
      var gallerySlot = img.closest(".cursor-zoom-in, [class*='gallery-item'], figure, li");
      var belongsToGallery = Boolean(img.closest("#gallery, [id*='gallery' i], [id*='galeria' i], [id*='galería' i]"));

      // Some native lightboxes include the stock hero as their first gallery
      // slide. It must not become an additional gallery photograph.
      if (index < 0 && belongsToGallery && isDemoHeroAsset(original)) {
        if (gallerySlot) gallerySlot.style.setProperty("display", "none", "important");
        return;
      }
      if (index < 0) return;

      // Several templates reuse gallery assets as decorative backgrounds in
      // countdowns and editorial sections. They are not gallery slots: never
      // inject an uploaded event photo there, otherwise the same image leaks
      // into unrelated sections and appears duplicated.
      if (!belongsToGallery) return;

      // A native demo may have more slots than the client purchased or
      // uploaded. Hide the surplus slots instead of cycling their photos.
      if (belongsToGallery && index >= gallery.length) {
        if (gallerySlot) gallerySlot.style.setProperty("display", "none", "important");
        return;
      }

      var photoUrl = gallery[index];
      if (!img.dataset.invittaOriginalSrc) img.dataset.invittaOriginalSrc = original;
      img.dataset.invittaPersonalized = "true";
      img.dataset.invittaPersonalizedSrc = photoUrl;
      if (img.parentElement && img.parentElement.tagName.toLowerCase() === "picture") {
        img.parentElement.querySelectorAll("source").forEach(function(sourceEl) {
          sourceEl.srcset = photoUrl;
        });
      }
      img.removeAttribute("srcset");
      if (img.src !== photoUrl) img.src = photoUrl;
    });
    return;

    // Si no existe sección de galería en la plantilla y hay fotos reales, crear invitta-gallery-section
    if (gallerySections.length === 0 && gallery.length > 0) {
      var newSec = document.createElement("section");
      newSec.id = "inv-gallery-section";
      newSec.className = "section inv-gallery-section";

      var newInner = document.createElement("div");
      newInner.className = "section__inner max-w-5xl mx-auto text-center space-y-8";

      var kicker = document.createElement("p");
      kicker.className = "eyebrow text-sage text-xs tracking-widest uppercase font-semibold";
      kicker.textContent = "Momentos";
      newInner.appendChild(kicker);

      var title = document.createElement("h2");
      title.className = "font-serif text-3xl md:text-4xl text-ink font-light";
      title.textContent = "Galería de Fotos";
      newInner.appendChild(title);

      newSec.appendChild(newInner);

      var rsvpSec = document.querySelector("#rsvp, #gifts, #registry, footer");
      if (rsvpSec && rsvpSec.parentElement) {
        rsvpSec.parentElement.insertBefore(newSec, rsvpSec);
      } else {
        var targetContainer = document.querySelector("#inv-content, main, .main-content") || document.body;
        targetContainer.appendChild(newSec);
      }
      gallerySections = [newSec];
    }

    ensureGalleryStyles();
    gallerySections.forEach(function (sec) {
      sec.style.removeProperty("display");
      sec.hidden = false;
    });
    galleryNavs.forEach(function(btn) {
      var text = (btn.textContent || "").toLowerCase();
      var href = (btn.getAttribute("href") || "").toLowerCase();
      if (/galer[ií]a|fotos|recuerdos|book/i.test(text) || /#gallery|#galeria/i.test(href)) {
        btn.style.removeProperty("display");
      }
    });

    gallerySections.forEach(function (sec) {
      var demoItems = sec.querySelectorAll(".grid > *, .gallery > *, [class*='grid'] > *, [class*='gallery']:not(.invitta-gallery-grid)");
      demoItems.forEach(function (item) {
        if (item.closest && item.closest(".invitta-gallery-grid")) return;
        if (item.classList && (item.classList.contains("invitta-gallery-grid") || item.classList.contains("invitta-gallery-item"))) return;
        item.style.setProperty("display", "none", "important");
      });

      var grid = sec.querySelector(".invitta-gallery-grid");
      if (!grid) {
        grid = document.createElement("div");
        grid.className = "invitta-gallery-grid";
        // Tailwind arbitrary-value class names contain brackets, which must be
        // escaped in querySelector. An invalid selector here aborted the whole
        // personalization pass and left the native demo copy and media intact.
        var inner = sec.querySelector(".section__inner, .max-w-4xl, .max-w-5xl, .max-w-6xl, .max-w-\\[1500px\\], .max-w-\\[1600px\\], .container, .space-y-16") || sec;
        inner.appendChild(grid);
      }

      grid.dataset.count = String(gallery.length);

      var galleryKey = gallery.join("|");
      if (grid.dataset.invittaGalleryKey !== galleryKey) {
        grid.dataset.invittaGalleryKey = galleryKey;
        while (grid.firstChild) {
          grid.removeChild(grid.firstChild);
        }

        gallery.forEach(function (photoUrl, idx) {
          var item = document.createElement("div");
          item.className = "invitta-gallery-item";

          var img = document.createElement("img");
          img.className = "invitta-gallery-img";
          img.src = photoUrl;
          img.alt = "Foto de galería " + (idx + 1);
          img.loading = "lazy";
          img.decoding = "async";
          img.dataset.invittaPersonalized = "true";
          img.dataset.invittaGalleryIndex = String(idx);

          item.addEventListener("click", function () {
            openGalleryLightbox(photoUrl);
          });

          item.appendChild(img);
          grid.appendChild(item);
        });
      }
    });
  }

  var sectionAdapters = {
    "xv-elegance-basic": {
      family: ["#family"], locations: ["#locations"], itinerary: [], gallery: ["#gallery"], registry: ["#registry"], rsvp: ["#rsvp"], music: ["#music-player-container"]
    },
    "boda-classic-basic": {
      family: ["#family"], locations: ["#locations"], itinerary: [], gallery: ["#gallery"], registry: ["#registry"], rsvp: ["#rsvp"], music: ["#music-player-container"]
    },
    "xv-rose-gold-premium": {
      family: ["#honors"], locations: ["#details"], itinerary: ["#itinerary"], gallery: ["#gallery"], registry: ["#registry"], rsvp: ["#rsvp"], music: ["#music-player-bottom-bar"]
    },
    "xv-champagne-rose-vip": {
      family: ["#honors"], locations: ["#details"], itinerary: ["#itinerary"], gallery: ["#gallery"], registry: ["#registry"], rsvp: ["#rsvp"], music: ["#music-player-bottom-bar"]
    },
    "boda-golden-romance-premium": {
      family: ["#honors"], locations: ["#details"], itinerary: ["#itinerary"], gallery: ["#gallery"], registry: ["#registry"], rsvp: ["#rsvp"], music: ["#music-player-bottom-bar"]
    },
    "boda-midnight-gold-vip": {
      family: ["#honors"], locations: ["#details"], itinerary: ["#itinerary"], gallery: ["#gallery"], registry: ["#registry"], rsvp: ["#rsvp"], music: ["#music-player-bottom-bar"]
    },
    "cumpleanos-general-basic": {
      family: ["#family"], locations: ["#location-cards"], itinerary: ["#itinerary"], gallery: ["#gallery"], registry: ["#registry"], rsvp: ["#rsvp"], music: ["#music-player"]
    },
    "cumpleanos-50-sorpresa": {
      family: ["#family"], locations: ["#location-cards"], itinerary: ["#itinerary"], gallery: ["#gallery"], registry: ["#registry"], rsvp: ["#rsvp"], music: ["#music-player"]
    },
    "bautizo-general-basic": {
      family: ["#family"], locations: ["#location-cards"], itinerary: ["#itinerary"], gallery: ["#gallery"], registry: ["#registry"], rsvp: ["#rsvp"], music: ["#music-player"]
    },
    "otro-general-basic": {
      family: ["#family"], locations: ["#location-cards"], itinerary: ["#itinerary"], gallery: ["#gallery"], registry: ["#registry"], rsvp: ["#rsvp"], music: ["#music-player"]
    }
  };

  function applySectionVisibility() {
    if (!isRealStudioInvitation()) return;
    var visibility = data.sectionVisibility || {};
    var adapter = sectionAdapters[templateId] || {};
    Object.keys(adapter).forEach(function(key) {
      if (visibility[key] !== false) return;
      adapter[key].forEach(function(selector) {
        document.querySelectorAll(selector).forEach(function(section) {
          section.hidden = true;
          section.style.setProperty("display", "none", "important");
          section.dataset.invittaSectionHidden = "true";
        });
      });
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

  function ensureDynamicCasingStyles() {
    if (document.getElementById("invitta-dynamic-casing-style")) return;
    var style = document.createElement("style");
    style.id = "invitta-dynamic-casing-style";
    style.textContent = [
      "[data-invitta-dynamic-text], [data-personalized], ",
      ".hero__name, #celebrant-name, .inv-hero-name, .couple-names, .couple-name, .honoree-name, ",
      "#inv-title, #inv-hero-title, .inv-hero-title, .inv-main-title, ",
      "[data-invitta-font-role='cover-name'], [data-invitta-font-role='name'], ",
      "[data-invitta-font-role='main-title'], [data-invitta-font-role='title'] ",
      "{ text-transform: none !important; }"
    ].join("");
    document.head.appendChild(style);
  }

  function ensureMusicControlStyles() {
    var existing = document.getElementById("invitta-no-music-style");
    if (!data.musicUrl) {
      document.documentElement.setAttribute("data-invitta-no-music", "true");
      if (!existing) {
        var style = document.createElement("style");
        style.id = "invitta-no-music-style";
        style.textContent = [
          "#music-player-container, #music-player-bottom-bar, #inv-music-player, #music-player, ",
          "[id*='music-player' i], [class*='music-player' i], .music-bar, .music-floating-btn, ",
          "button[aria-label*='música' i], button[title*='música' i], button[aria-label*='musica' i], button[title*='musica' i], ",
          "[id*='music-toggle' i], [id*='music-mute' i], [id*='music-volume' i], [class*='music-toggle' i], ",
          "[class*='floating-music' i], [class*='audio-btn' i], [class*='sound-btn' i] ",
          "{ display: none !important; }"
        ].join("");
        document.head.appendChild(style);
      }
    } else {
      document.documentElement.removeAttribute("data-invitta-no-music");
      if (existing) existing.remove();
    }
  }

  function applyAudio() {
    ensureMusicControlStyles();

    var musicContainers = document.querySelectorAll(
      "#music-player-container, #music-player-bottom-bar, #inv-music-player, #music-player, " +
      "[id*='music-player' i], [class*='music-player' i], .music-bar, .music-floating-btn, " +
      "button[aria-label*='música' i], button[title*='música' i], button[aria-label*='musica' i], button[title*='musica' i], " +
      "[id*='music-toggle' i], [id*='music-mute' i], [id*='music-volume' i], [class*='music-toggle' i], " +
      "[class*='floating-music' i], [class*='audio-btn' i], [class*='sound-btn' i]"
    );

    if (!data.musicUrl) {
      document.querySelectorAll("audio").forEach(function (audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.src = "";
          audio.removeAttribute("src");
        } catch (e) {}
      });

      musicContainers.forEach(function (el) {
        el.style.setProperty("display", "none", "important");
      });
      document.body.classList.remove("has-music-player");
      return;
    }

    musicContainers.forEach(function (el) {
      el.style.removeProperty("display");
    });

    document.querySelectorAll("audio").forEach(function (audio) {
      if (audio.dataset.invittaPersonalized === "true" && audio.src === data.musicUrl) return;
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

  // A dress-code section belongs to the template.  Do not leave the template's
  // sample "FORMAL" content visible when the host has not supplied one.
  function applyDressCode() {
    var dressCode = clean(data.dressCode);
    var title = Array.from(document.querySelectorAll("span, p, h1, h2, h3, h4, h5, h6")).find(function (element) {
      return /C[ÓO]DIGO DE VESTIMENTA/i.test(clean(element.textContent));
    });
    if (!title) return;

    var section = title.closest("section");
    if (!dressCode) {
      if (section) section.style.setProperty("display", "none", "important");
      return;
    }

    if (section) section.style.removeProperty("display");
    if (!section) return;

    // The heading and its supporting copy retain their template classes. This
    // changes content only, preserving each template's editorial typography.
    var heading = section.querySelector("h1, h2, h3, h4, h5, h6");
    if (heading && heading.children.length === 0) {
      heading.textContent = dressCode;
      heading.setAttribute("data-invitta-dynamic-text", "true");
      heading.setAttribute("data-invitta-dress-code-title", "true");
      heading.style.setProperty("text-transform", "none", "important");
    }

    var leaves = Array.from(section.querySelectorAll("p, span, div")).filter(function (element) {
      return element.children.length === 0;
    });
    var detail = leaves.find(function (element) {
      return /^(?:traje|vestido|etiqueta|c[oó]ctel|cocktail)/i.test(clean(element.textContent));
    });
    var childrenMessage = leaves.find(function (element) {
      var value = clean(element.textContent);
      return /(niñ|n[ií]ñ|j[oó]venes|adultos)/i.test(value) && /(agradecemos|comprensi[oó]n|dedicado|evento)/i.test(value);
    });
    var childrenBadge = leaves.find(function (element) {
      return /^(?:✦\s*)?(?:evento\s+sin\s+niñ[oa]s|solo\s+adultos|no\s+niñ[oa]s)$/i.test(clean(element.textContent));
    });
    var detailsCopy = clean(data.dressCodeDetails);
    var childrenNote = clean(data.childrenNote);
    var childrenLabel = clean(data.childrenLabel);

    if (detail) {
      if (detailsCopy) {
        detail.textContent = detailsCopy;
        detail.setAttribute("data-invitta-dynamic-text", "true");
        detail.style.setProperty("text-transform", "none", "important");
        detail.style.removeProperty("display");
      } else {
        detail.style.setProperty("display", "none", "important");
      }
    }

    if (childrenMessage) {
      if (childrenNote) {
        childrenMessage.textContent = childrenNote;
        childrenMessage.setAttribute("data-invitta-dynamic-text", "true");
        childrenMessage.style.setProperty("text-transform", "none", "important");
        childrenMessage.style.removeProperty("display");
      } else {
        childrenMessage.style.setProperty("display", "none", "important");
      }
    }

    if (childrenBadge) {
      var badgeContainer = childrenBadge.parentElement;
      if (childrenLabel) {
        childrenBadge.textContent = childrenLabel;
        childrenBadge.setAttribute("data-invitta-dynamic-text", "true");
        childrenBadge.style.setProperty("text-transform", "none", "important");
        if (badgeContainer) badgeContainer.style.removeProperty("display");
      } else if (badgeContainer) {
        badgeContainer.style.setProperty("display", "none", "important");
      }
    }

    // When both optional children messages are absent, hide their shared
    // container so a decorative border or blank vertical gap cannot remain.
    if (!childrenNote && !childrenLabel && (childrenMessage || childrenBadge)) {
      var supportingCopy = (childrenMessage || childrenBadge).parentElement;
      if (supportingCopy) supportingCopy.style.setProperty("display", "none", "important");
    }
  }

  function locationCardFor(details, expression) {
    var heading = Array.from(details.querySelectorAll("h1, h2, h3, h4")).find(function(element) {
      return expression.test(clean(element.textContent));
    });
    if (!heading) return null;
    return heading.closest(".bg-paper, .card, article, [class*='border']") || heading.parentElement;
  }

  function applyLocationCard(card, location) {
    if (!card) return false;
    var hasContent = Boolean(location && (clean(location.name) || clean(location.address) || clean(location.mapUrl)));
    if (!hasContent) {
      card.style.setProperty("display", "none", "important");
      return false;
    }

    card.style.removeProperty("display");
    var name = card.querySelector("p.font-semibold, [data-invitta-location-name]");
    if (name) {
      if (clean(location.name)) {
        name.textContent = location.name;
        name.setAttribute("data-invitta-location-name", "true");
        name.setAttribute("data-invitta-dynamic-text", "true");
        name.style.removeProperty("display");
      } else {
        name.style.setProperty("display", "none", "important");
      }
    }
    var address = Array.from(card.querySelectorAll("p")).find(function(element) {
      return element !== name && (/opacity-|font-sans/.test(element.className || "") || element.querySelector("br"));
    });
    if (address) {
      if (clean(location.address)) {
        address.textContent = location.address;
        address.setAttribute("data-invitta-dynamic-text", "true");
        address.style.setProperty("white-space", "pre-line");
        address.style.removeProperty("display");
      } else {
        address.style.setProperty("display", "none", "important");
      }
    }
    var mapLink = Array.from(card.querySelectorAll("a, button")).find(function(element) {
      return /C[ÓO]MO LLEGAR/.test(element.textContent || "");
    });
    if (mapLink) {
      if (clean(location.mapUrl)) {
        if (mapLink.tagName === "A") mapLink.href = location.mapUrl;
        mapLink.dataset.invittaUrl = location.mapUrl;
        mapLink.style.removeProperty("display");
      } else {
        mapLink.style.setProperty("display", "none", "important");
      }
    }
    return true;
  }

  function applyLocationContent() {
    // Premium and VIP templates ship with two filled sample cards. A real
    // invitation must show only saved ceremony/reception data, never those
    // samples or their empty framed remnants.
    var details = document.getElementById("details");
    if (!details || !isRealStudioInvitation()) return;
    var ceremonyCard = locationCardFor(details, /ceremonia|iglesia/i);
    var receptionCard = locationCardFor(details, /recepci[oó]n|sal[oó]n/i);
    var hasCeremony = applyLocationCard(ceremonyCard, data.ceremony || {});
    var hasReception = applyLocationCard(receptionCard, data.reception || {});
    if (!hasCeremony && !hasReception && (ceremonyCard || receptionCard)) {
      details.style.setProperty("display", "none", "important");
    } else if (hasCeremony || hasReception) {
      details.style.removeProperty("display");
    }
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

  function ensureGiftOptionStyles() {
    if (document.getElementById("invitta-gift-options-styles")) return;
    var style = document.createElement("style");
    style.id = "invitta-gift-options-styles";
    style.textContent = [
      ".invitta-gift-options { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; width: 100%; max-width: 960px; margin: 28px auto 0; padding: 0 16px; box-sizing: border-box; }",
      ".invitta-gift-card { flex: 1 1 260px; max-width: 380px; min-width: 240px; background: var(--surface-container-low, #fffdf9); border: 1px solid var(--outline-variant, rgba(155, 118, 83, 0.25)); border-radius: 6px; padding: 24px 20px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); box-sizing: border-box; position: relative; transition: transform 0.2s, box-shadow 0.2s; }",
      ".invitta-gift-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); }",
      ".invitta-gift-icon { width: 44px; height: 44px; border-radius: 50%; background: rgba(155, 118, 83, 0.1); color: var(--invitta-primary, #9b7653); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }",
      ".invitta-gift-title { margin: 0 0 8px; font-family: var(--font-display, Georgia, serif); font-size: 1.2rem; font-weight: 500; color: var(--text-color, #2e2722); }",
      ".invitta-gift-description { margin: 0 0 16px; font-family: var(--font-sans, Arial, sans-serif); font-size: 0.85rem; color: var(--on-surface-variant, #666); line-height: 1.45; flex-grow: 1; }",
      ".invitta-gift-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; background: var(--invitta-primary, #2e2722); color: #ffffff !important; text-decoration: none; font-family: var(--font-sans, Arial, sans-serif); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 3px; border: none; cursor: pointer; transition: opacity 0.2s; margin-top: auto; }",
      ".invitta-gift-button:hover { opacity: 0.88; }",
      ".invitta-gift-bank-info { width: 100%; text-align: left; margin: 12px 0 16px; font-family: var(--font-sans, Arial, sans-serif); font-size: 0.8125rem; color: var(--text-color, #2e2722); }",
      ".invitta-gift-bank-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed rgba(155, 118, 83, 0.15); }",
      ".invitta-gift-bank-label { font-weight: 600; color: var(--on-surface-variant, #777); margin-right: 8px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }",
      ".invitta-gift-bank-val { font-family: monospace; font-weight: 500; color: var(--text-color, #2e2722); word-break: break-all; font-size: 0.8125rem; }",
      ".invitta-gift-copy-btn { background: transparent; border: 1px solid var(--outline-variant, #ccc); border-radius: 3px; padding: 2px 8px; font-size: 0.7rem; font-weight: 600; cursor: pointer; margin-left: 8px; color: var(--invitta-primary, #9b7653); transition: all 0.2s; flex-shrink: 0; }",
      ".invitta-gift-copy-btn:hover { background: var(--invitta-primary, #9b7653); color: #ffffff; }",
      ".invitta-gift-bank-note { margin-top: 10px; font-size: 0.8rem; font-style: italic; color: var(--on-surface-variant, #666); text-align: center; }"
    ].join("\n");
    document.head.appendChild(style);
  }

  function isRealStudioInvitation() {
    if (!window.INVITATION_DATA || !data) return false;
    if (data.invitationSlug || data.guestToken || data.studioInvitationId) return true;
    try {
      var search = window.location.search || "";
      if (window.parent && window.parent.location && window.parent.location.search) {
        search += " " + window.parent.location.search;
      }
      if (/[?&](?:slug|preview=studio|i)=/i.test(search)) return true;
    } catch (e) {}
    if (data.templateId && (data.eventTitle || data.celebrantName)) return true;
    return false;
  }

  function getGiftOptions() {
    var options = Array.isArray(data.giftOptions) ? data.giftOptions : [];
    var result = [];

    for (var i = 0; i < options.length; i++) {
      var opt = options[i];
      if (!opt || typeof opt !== "object") continue;
      if (opt.enabled === false) continue;

      var type = opt.type === "bank" ? "bank" : "registry";
      var id = clean(opt.id) || ("gift-" + (result.length + 1));

      if (type === "registry") {
        var title = clean(opt.title);
        var rawUrl = clean(opt.url);
        var safeUrl = (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) ? rawUrl : "";
        var description = clean(opt.description);

        if (!title && !safeUrl) continue;

        result.push({
          id: id,
          type: "registry",
          enabled: true,
          title: title || "Mesa de regalos",
          url: safeUrl,
          description: description
        });
      } else if (type === "bank") {
        var bank = clean(opt.bank);
        var holder = clean(opt.holder);
        var clabe = clean(opt.clabe);
        var account = clean(opt.account);
        var note = clean(opt.note);
        var bankTitle = clean(opt.title) || "Transferencia / Depósito";

        if (!bank && !holder && !clabe && !account) continue;

        result.push({
          id: id,
          type: "bank",
          enabled: true,
          title: bankTitle,
          bank: bank,
          holder: holder,
          clabe: clabe,
          account: account,
          note: note
        });
      }

      if (result.length >= 3) break;
    }

    if (result.length === 0) {
      var legacyUrl = clean(data.giftTableUrl);
      if (legacyUrl && (legacyUrl.startsWith("http://") || legacyUrl.startsWith("https://"))) {
        result.push({
          id: "gift-legacy",
          type: "registry",
          enabled: true,
          title: "Mesa de regalos",
          url: legacyUrl,
          description: ""
        });
      }
    }

    return result.slice(0, 3);
  }

  function createRegistryCard(opt) {
    var card = document.createElement("div");
    card.className = "invitta-gift-card invitta-gift-card--registry";

    var icon = document.createElement("div");
    icon.className = "invitta-gift-icon";
    icon.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>';
    card.appendChild(icon);

    var title = document.createElement("h3");
    title.className = "invitta-gift-title";
    title.textContent = opt.title || "Mesa de regalos";
    card.appendChild(title);

    if (opt.description) {
      var desc = document.createElement("p");
      desc.className = "invitta-gift-description";
      desc.textContent = opt.description;
      card.appendChild(desc);
    }

    if (opt.url && (opt.url.startsWith("http://") || opt.url.startsWith("https://"))) {
      var btn = document.createElement("a");
      btn.className = "invitta-gift-button";
      btn.href = opt.url;
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
      btn.textContent = "Ver mesa de regalos";
      card.appendChild(btn);
    }

    return card;
  }

  function createBankCard(opt) {
    var card = document.createElement("div");
    card.className = "invitta-gift-card invitta-gift-card--bank";

    var icon = document.createElement("div");
    icon.className = "invitta-gift-icon";
    icon.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>';
    card.appendChild(icon);

    var title = document.createElement("h3");
    title.className = "invitta-gift-title";
    title.textContent = opt.title || "Transferencia / Depósito";
    card.appendChild(title);

    var bankInfo = document.createElement("div");
    bankInfo.className = "invitta-gift-bank-info";

    function addRow(label, value, isCopyable) {
      if (!value) return;
      var row = document.createElement("div");
      row.className = "invitta-gift-bank-row";

      var labelEl = document.createElement("span");
      labelEl.className = "invitta-gift-bank-label";
      labelEl.textContent = label;
      row.appendChild(labelEl);

      var rightEl = document.createElement("div");
      rightEl.style.display = "flex";
      rightEl.style.alignItems = "center";

      var valEl = document.createElement("span");
      valEl.className = "invitta-gift-bank-val";
      valEl.textContent = value;
      rightEl.appendChild(valEl);

      if (isCopyable) {
        var copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "invitta-gift-copy-btn";
        copyBtn.textContent = "Copiar";
        copyBtn.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value).then(function() {
              copyBtn.textContent = "¡Copiado!";
              setTimeout(function() { copyBtn.textContent = "Copiar"; }, 2000);
            }).catch(function() {});
          } else {
            var tempInput = document.createElement("input");
            tempInput.value = value;
            document.body.appendChild(tempInput);
            tempInput.select();
            try {
              document.execCommand("copy");
              copyBtn.textContent = "¡Copiado!";
              setTimeout(function() { copyBtn.textContent = "Copiar"; }, 2000);
            } catch(err) {}
            document.body.removeChild(tempInput);
          }
        });
        rightEl.appendChild(copyBtn);
      }

      row.appendChild(rightEl);
      bankInfo.appendChild(row);
    }

    if (opt.bank) addRow("Banco", opt.bank, false);
    if (opt.holder) addRow("Titular", opt.holder, false);
    if (opt.clabe) addRow("CLABE", opt.clabe, true);
    if (opt.account) addRow("Cuenta", opt.account, true);

    card.appendChild(bankInfo);

    if (opt.note) {
      var note = document.createElement("p");
      note.className = "invitta-gift-bank-note";
      note.textContent = opt.note;
      card.appendChild(note);
    }

    return card;
  }

  function applyGiftOptions() {
    if (!isRealStudioInvitation()) return;

    ensureGiftOptionStyles();
    var options = getGiftOptions();

    var giftSections = Array.from(document.querySelectorAll("#registry, #gifts, #gift, #inv-gifts-block"));
    var giftModals = Array.from(document.querySelectorAll("#registry-modal-overlay, #registry-modal-container, [id*='registry-modal'], [class*='registry-modal']"));
    var giftNavs = Array.from(document.querySelectorAll("nav button, nav a, .inv-nav-button"));

    // Siempre ocultar modales demo
    giftModals.forEach(function(m) {
      if (m.closest && m.closest(".invitta-gift-options")) return;
      if (m.classList && m.classList.contains("invitta-gift-options")) return;
      m.style.setProperty("display", "none", "important");
    });

    if (options.length === 0) {
      giftSections.forEach(function(s) {
        s.style.setProperty("display", "none", "important");
        s.hidden = true;
      });
      giftNavs.forEach(function(btn) {
        var text = (btn.textContent || "").toLowerCase();
        var href = (btn.getAttribute("href") || "").toLowerCase();
        if (/regalos|registry|mesa de regalo/i.test(text) || /#registry|#gifts|#gift/i.test(href)) {
          btn.style.setProperty("display", "none", "important");
        }
      });
      return;
    }

    // Hay opciones reales: limpiar display:none anterior y mostrar secciones/navs
    giftSections.forEach(function(s) {
      s.style.removeProperty("display");
      s.hidden = false;
    });
    giftNavs.forEach(function(btn) {
      var text = (btn.textContent || "").toLowerCase();
      var href = (btn.getAttribute("href") || "").toLowerCase();
      if (/regalos|registry|mesa de regalo/i.test(text) || /#registry|#gifts|#gift/i.test(href)) {
        btn.style.removeProperty("display");
      }
    });

    var singleGiftLink = document.getElementById("gift-link");
    if (singleGiftLink && options.length === 1 && options[0].type === "registry") {
      singleGiftLink.href = options[0].url || "#";
      singleGiftLink.textContent = options[0].title ? ("Ver " + options[0].title) : "Ver mesa de regalos";
      if (!options[0].url) singleGiftLink.style.setProperty("display", "none", "important");
      else singleGiftLink.style.removeProperty("display");
      return;
    }

    giftSections.forEach(function(section) {
      // 1. Ocultar tarjetas demo existentes dentro de la sección excluyendo siempre invitta-gift-*
      var demoCards = section.querySelectorAll(".grid > *, article, [class*='grid'] > *, [class*='card']");
      demoCards.forEach(function(card) {
        if (card.closest && card.closest(".invitta-gift-options")) return;
        if (card.classList && (card.classList.contains("invitta-gift-options") || card.classList.contains("invitta-gift-card") || card.classList.contains("invitta-gift-button"))) return;
        card.style.setProperty("display", "none", "important");
      });

      if (singleGiftLink && (options.length > 1 || options[0].type === "bank")) {
        singleGiftLink.style.setProperty("display", "none", "important");
      }

      // 2. Comprobar si ya existe el contenedor real
      var container = section.querySelector(".invitta-gift-options");
      if (!container) {
        container = document.createElement("div");
        container.className = "invitta-gift-options";
        var inner = section.querySelector(".section__inner, .max-w-4xl, .max-w-5xl, .max-w-2xl, .container") || section;
        inner.appendChild(container);
      }

      // 3. Renderizar o actualizar solo las tarjetas reales
      var optionsKey = options.map(function(o) { return o.id + ":" + o.title + ":" + (o.url || o.clabe || ""); }).join("|");
      if (container.dataset.invittaOptionsKey !== optionsKey) {
        container.dataset.invittaOptionsKey = optionsKey;
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        options.forEach(function(opt) {
          if (opt.type === "bank") {
            container.appendChild(createBankCard(opt));
          } else {
            container.appendChild(createRegistryCard(opt));
          }
        });
      }
    });
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
      : [];
    // `whatsapp` already includes the studio number as a safe fallback in
    // buildPublicTemplateData().  Keep it when the event itself has no phone.
    if (!phones.length && data.whatsapp) phones = [data.whatsapp];
    if (!phones.length) return;

    var whatsappActions = Array.from(document.querySelectorAll("a, button")).filter(function (element) {
      return /WHATSAPP/i.test(element.textContent || "");
    });

    // Some native templates never included a WhatsApp action.  The public
    // bridge owns this single fallback so every invitation offers the same
    // confirmation route when an event has a confirmation number configured.
    var visibleWhatsappActions = whatsappActions.filter(function (element) {
      return !element.hidden && element.offsetParent !== null;
    });
    if (!visibleWhatsappActions.length && !document.querySelector("[data-invitta-generated-whatsapp]")) {
      var rsvpSection = document.querySelector("#rsvp, [data-invitta-rsvp], [data-rsvp], [id*='rsvp'], [id*='confirm'], [class*='rsvp'], [class*='confirm']");
      if (!rsvpSection) {
        var rsvpRadio = Array.from(document.querySelectorAll("input[type='radio']")).find(function (element) {
          return element.offsetParent !== null;
        });
        rsvpSection = rsvpRadio && (rsvpRadio.closest("form, section, article, [role='region'], [class*='rsvp'], [class*='confirm']") || rsvpRadio.parentElement);
      }
      if (!rsvpSection) {
        var rsvpTrigger = Array.from(document.querySelectorAll("a, button")).find(function (element) {
          return /CONFIRMAR|RSVP/i.test(element.textContent || "");
        });
        rsvpSection = rsvpTrigger && (rsvpTrigger.closest("form, section, article, [role='region'], [class*='rsvp'], [class*='confirm']") || rsvpTrigger.parentElement);
      }

      if (rsvpSection) {
        var generatedAction = document.createElement("button");
        generatedAction.type = "button";
        generatedAction.textContent = "CONFIRMAR POR WHATSAPP";
        generatedAction.dataset.invittaGeneratedWhatsapp = "true";
        generatedAction.dataset.invittaPhone = phones[0];
        generatedAction.setAttribute("aria-label", "Confirmar asistencia por WhatsApp");
        var actionHost = rsvpSection.querySelector("form") || rsvpSection;
        actionHost.appendChild(generatedAction);
        whatsappActions.push(generatedAction);
      }
    }

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

  function ensureActionAccessibilityStyles() {
    if (document.getElementById("invitta-action-accessibility")) return;
    var style = document.createElement("style");
    style.id = "invitta-action-accessibility";
    style.textContent = [
      "[data-invitta-primary-action]{background-color:var(--inv-30,#40362E)!important;border-color:var(--inv-10,#B99654)!important;color:var(--inv-60,#F7F0E7)!important;}",
      "[data-invitta-primary-action] *{color:inherit!important;}",
      "[data-invitta-primary-action]:hover,[data-invitta-primary-action]:focus-visible,[data-invitta-primary-action]:active,[data-invitta-primary-action][aria-pressed='true'],[data-invitta-primary-action][data-state='selected'],[data-invitta-primary-action].is-selected{background-color:var(--inv-30,#40362E)!important;border-color:var(--inv-10,#B99654)!important;color:var(--inv-60,#F7F0E7)!important;box-shadow:inset 0 0 0 2px var(--inv-10,#B99654);outline:2px solid var(--inv-10,#B99654)!important;outline-offset:3px;}",
      "[data-invitta-primary-action]:hover *,[data-invitta-primary-action]:focus-visible *,[data-invitta-primary-action]:active *,[data-invitta-primary-action][aria-pressed='true'] *,[data-invitta-primary-action][data-state='selected'] *{color:inherit!important;}",
      "[data-invitta-secondary-action]{background-color:transparent!important;border-color:var(--inv-10,#B99654)!important;color:var(--inv-30,#40362E)!important;}",
      "[data-invitta-secondary-action]:hover,[data-invitta-secondary-action]:focus-visible,[data-invitta-secondary-action]:active,[data-invitta-secondary-action][aria-pressed='true'],[data-invitta-secondary-action][data-state='selected'],[data-invitta-secondary-action].is-selected{background-color:var(--inv-30,#40362E)!important;border-color:var(--inv-10,#B99654)!important;color:var(--inv-60,#F7F0E7)!important;box-shadow:inset 0 0 0 2px var(--inv-10,#B99654);outline:2px solid var(--inv-10,#B99654)!important;outline-offset:3px;}",
      "[data-invitta-generated-whatsapp]{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-top:1rem!important;padding:.8rem 1.2rem!important;font:inherit!important;letter-spacing:.08em!important;}",
      "section#rsvp input[type='radio'],section[id*='rsvp'] input[type='radio'],section[id*='confirm'] input[type='radio']{accent-color:var(--inv-10,#B99654)!important;}",
      "section#rsvp input[type='radio']:focus-visible,section[id*='rsvp'] input[type='radio']:focus-visible,section[id*='confirm'] input[type='radio']:focus-visible{outline:2px solid var(--inv-10,#B99654)!important;outline-offset:3px;}"
    ].join("");
    document.head.appendChild(style);
  }

  function markAccessibleActions() {
    Array.from(document.querySelectorAll("a, button, input[type='submit'], input[type='button']")).forEach(function (element) {
      var label = (element.textContent || element.value || element.getAttribute("aria-label") || "").trim();
      var isPrimary = /AGREGAR\s+AL\s+CALENDARIO|CONFIRMAR|WHATSAPP|ENVIAR\s+(?:CONFIRMACI[OÓ]N|RESPUESTA)|S[IÍ],?\s*ASISTIR|ACEPTAR/i.test(label) ||
        (element.matches("form button[type='submit'], form input[type='submit']") && !/NO\s+ASISTIR|NO\s+PODR|DECLINAR|RECHAZAR/i.test(label));
      var isSecondary = /NO\s+ASISTIR|NO\s+PODR|DECLINAR|RECHAZAR/i.test(label);
      if (isPrimary) element.dataset.invittaPrimaryAction = "true";
      if (isSecondary) element.dataset.invittaSecondaryAction = "true";
    });
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
    var existingStyle = document.getElementById("invitta-visual-customization");
    if (existingStyle) existingStyle.remove();

    // A palette has exactly three semantic colors: 60% base, 30% readable
    // contrast and 10% accent. Native template CSS remains in charge of every
    // layout, photograph, parallax layer, animation and type treatment.
    var palettePresets = {
      champagne: { base: "#F7F0E7", support: "#40362E", accent: "#B99654" },
      rose: { base: "#FAF0F0", support: "#704853", accent: "#C88A97" },
      sage: { base: "#F1F3EC", support: "#405144", accent: "#718067" },
      emerald: { base: "#F0F4EF", support: "#1F493B", accent: "#1E6A52" },
      midnight: { base: "#1C1920", support: "#F6EAD2", accent: "#C5A355" },
      "terracotta-sand": { base: "#F4E6D8", support: "#512F28", accent: "#D26345" },
      "plum-olive": { base: "#EEEBDD", support: "#3D1831", accent: "#7A7D45" },
      "opal-blue": { base: "#EAF2F4", support: "#263B5B", accent: "#8B79A8" },
      "emerald-jewel": { base: "#E8EFEA", support: "#0E3B31", accent: "#C19A3C" },
      "celestial-navy": { base: "#0C1630", support: "#F5EBD5", accent: "#D6AF4B" }
    };
    var palette = palettePresets[data.palettePreset];
    var paletteVariables = [
      "--inv-60", "--inv-30", "--inv-10", "--inv-on-accent",
      "--color-background", "--color-paper", "--color-surface",
      "--color-surface-container-low", "--color-surface-container-lowest",
      "--color-ink", "--color-on-background", "--color-on-surface",
      "--color-on-surface-variant", "--color-primary", "--color-sage",
      "--color-champagne-gold", "--color-outline-variant",
      "--invitta-surface", "--invitta-card", "--invitta-title",
      "--invitta-body", "--invitta-accent", "--inv-button-text", "--inv-overlay"
    ];
    paletteVariables.forEach(function(name) { root.style.removeProperty(name); });
    delete root.dataset.invittaTheme;
    delete root.dataset.invittaPalette;
    if (!palette) return;

    function contrastRatio(first, second) {
      function channel(value) {
        value = value / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      }
      function luminance(hex) {
        var cleanHex = hex.replace("#", "");
        return (channel(parseInt(cleanHex.slice(0, 2), 16)) * 0.2126) +
          (channel(parseInt(cleanHex.slice(2, 4), 16)) * 0.7152) +
          (channel(parseInt(cleanHex.slice(4, 6), 16)) * 0.0722);
      }
      var one = luminance(first);
      var two = luminance(second);
      return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
    }

    var accentText = contrastRatio(palette.base, palette.accent) >= contrastRatio(palette.support, palette.accent)
      ? palette.base
      : palette.support;
    root.dataset.invittaPalette = data.palettePreset;
    root.style.setProperty("--inv-60", palette.base);
    root.style.setProperty("--inv-30", palette.support);
    root.style.setProperty("--inv-10", palette.accent);
    root.style.setProperty("--inv-on-accent", accentText);
    root.style.setProperty("--color-background", palette.base);
    root.style.setProperty("--color-paper", palette.base);
    root.style.setProperty("--color-surface", palette.base);
    root.style.setProperty("--color-surface-container-low", palette.base);
    root.style.setProperty("--color-surface-container-lowest", palette.base);
    root.style.setProperty("--color-ink", palette.support);
    root.style.setProperty("--color-on-background", palette.support);
    root.style.setProperty("--color-on-surface", palette.support);
    root.style.setProperty("--color-on-surface-variant", palette.support);
    root.style.setProperty("--color-primary", palette.accent);
    root.style.setProperty("--color-sage", palette.accent);
    root.style.setProperty("--color-champagne-gold", palette.accent);
    root.style.setProperty("--color-outline-variant", palette.accent);
    // The general-event renderer intentionally has its own semantic tokens.
    // Feed it the same three colors instead of leaving its fixed defaults.
    root.style.setProperty("--invitta-surface", palette.base);
    root.style.setProperty("--invitta-card", palette.base);
    root.style.setProperty("--invitta-title", palette.support);
    root.style.setProperty("--invitta-body", palette.support);
    root.style.setProperty("--invitta-accent", palette.accent);
    root.style.setProperty("--inv-button-text", accentText);
    root.style.setProperty("--inv-overlay", "rgba(0,0,0,0.28)");
    return;

    var palettePresets = {
      champagne: {
        surface: "#F7F0E7",
        card: "#FFFDFC",
        title: "#40362E",
        body: "#66594F",
        accent: "#B99654",
        onAccent: "#FFFFFF",
        overlay: "rgba(64,54,46,0.38)"
      },
      rose: {
        surface: "#FAF0F0",
        card: "#FFFDFD",
        title: "#704853",
        body: "#725C63",
        accent: "#C88A97",
        onAccent: "#FFFFFF",
        overlay: "rgba(112,72,83,0.32)"
      },
      sage: {
        surface: "#F1F3EC",
        card: "#FEFEFC",
        title: "#405144",
        body: "#5D665B",
        accent: "#718067",
        onAccent: "#FFFFFF",
        overlay: "rgba(64,81,68,0.30)"
      },
      emerald: {
        surface: "#F0F4EF",
        card: "#FCFDFC",
        title: "#1F493B",
        body: "#475C52",
        accent: "#1E6A52",
        onAccent: "#FFFFFF",
        overlay: "rgba(31,73,59,0.34)"
      },
      midnight: {
        surface: "#1C1920",
        card: "#28232B",
        title: "#F6EAD2",
        body: "#DDD2C5",
        accent: "#C5A355",
        onAccent: "#1C1920",
        overlay: "rgba(12,10,14,0.55)"
      },
      "terracotta-sand": {
        surface: "#F4E6D8",
        card: "#FFF8F0",
        title: "#512F28",
        body: "#74564A",
        accent: "#D26345",
        onAccent: "#FFFFFF",
        overlay: "rgba(81,47,40,0.32)"
      },
      "plum-olive": {
        surface: "#EEEBDD",
        card: "#F8F5EC",
        title: "#3D1831",
        body: "#5F5C42",
        accent: "#7A7D45",
        onAccent: "#FFFFFF",
        overlay: "rgba(61,24,49,0.30)"
      },
      "opal-blue": {
        surface: "#EAF2F4",
        card: "#F8FAFC",
        title: "#263B5B",
        body: "#59697B",
        accent: "#8B79A8",
        onAccent: "#FFFFFF",
        overlay: "rgba(38,59,91,0.30)"
      },
      "emerald-jewel": {
        surface: "#E8EFEA",
        card: "#F8F7F0",
        title: "#0E3B31",
        body: "#3F5B52",
        accent: "#C19A3C",
        onAccent: "#FFFFFF",
        overlay: "rgba(14,59,49,0.30)"
      },
      "celestial-navy": {
        surface: "#0C1630",
        card: "#142345",
        title: "#F5EBD5",
        body: "#C9D1E2",
        accent: "#D6AF4B",
        onAccent: "#0C1630",
        overlay: "rgba(6,10,22,0.58)"
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
      root.style.setProperty("--color-primary", palette.accent);
      root.style.setProperty("--color-sage", palette.accent);
      // Tokens 60/30/10 semánticos nuevos
      root.style.setProperty("--inv-on-accent", palette.onAccent || "#ffffff");
      root.style.setProperty("--inv-button-text", palette.onAccent || "#ffffff");
      root.style.setProperty("--inv-overlay", palette.overlay || "rgba(0,0,0,0.32)");
    } else {
      delete root.dataset.invittaPalette;
      // Fallback on-accent derivado de luminancia del acento manual
      var accentHex = (data.accentColor || data.colorPrimary || "#888888").replace("#", "");
      if (accentHex.length === 3) accentHex = accentHex.split("").map(function(c){ return c+c; }).join("");
      var ar = parseInt(accentHex.substr(0,2), 16) || 0;
      var ag = parseInt(accentHex.substr(2,2), 16) || 0;
      var ab = parseInt(accentHex.substr(4,2), 16) || 0;
      var accentYiq = ((ar*299)+(ag*587)+(ab*114))/1000;
      root.style.setProperty("--inv-on-accent", accentYiq >= 140 ? "#2e2722" : "#ffffff");
      root.style.setProperty("--inv-button-text", accentYiq >= 140 ? "#2e2722" : "#ffffff");
      root.style.setProperty("--inv-overlay", "rgba(0,0,0,0.28)");
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
        body: '"Montserrat", Arial, sans-serif'
      },
      couture: {
        display: '"Parisienne", "Great Vibes", cursive',
        body: '"Playfair Display", Georgia, serif'
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
    if (!document.getElementById("invitta-global-fonts")) {
      var fontLink = document.createElement("link");
      fontLink.id = "invitta-global-fonts";
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Great+Vibes&family=Inter:wght@100..900&family=Jost:ital,wght@0,100..900;1,100..900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=Parisienne&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Raleway:ital,wght@0,100..900;1,100..900&family=Sacramento&display=swap";
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

    // Regla 60-30-10 integrada con tokens semánticos
    var color60 = data.colorSecondary || (palette ? palette.surface : null) || "#FAF7F2";
    var color30 = (palette ? palette.card : null) || "#FFFFFF";
    var color10 = data.colorPrimary || data.accentColor || (palette ? palette.accent : null) || "#8A6D47";

    function getYiq(hexColor) {
      if (!hexColor) return 200;
      var h = String(hexColor).replace("#", "").trim();
      if (h.length === 3) h = h.split("").map(function(c) { return c + c; }).join("");
      if (h.length !== 6) return 200;
      var r = parseInt(h.substr(0, 2), 16) || 0;
      var g = parseInt(h.substr(2, 2), 16) || 0;
      var b = parseInt(h.substr(4, 2), 16) || 0;
      return ((r * 299) + (g * 587) + (b * 114)) / 1000;
    }

    var yiq60 = getYiq(color60);
    var yiq30 = getYiq(color30);
    var yiq10 = getYiq(color10);

    var is60Dark = yiq60 < 135;
    var is30Dark = yiq30 < 135;
    var is10Dark = yiq10 < 135;

    var textOn60 = (palette && palette.title) || data.titleColor || (is60Dark ? "#FAF6EE" : "#241F1A");
    var bodyOn60 = (palette && palette.body) || data.bodyColor || (is60Dark ? "#D8CFBE" : "#574E45");

    var cardBg = color30;
    var cardText = is30Dark ? "#FAF6EE" : "#241F1A";
    var cardMuted = is30Dark ? "rgba(250, 246, 238, 0.72)" : "rgba(36, 31, 26, 0.70)";
    var textOn30 = cardText;

    var onAccent = (palette && palette.onAccent) || (is10Dark ? "#FFFFFF" : "#1A1714");
    var overlay = (palette && palette.overlay) || (is60Dark ? "rgba(0, 0, 0, 0.65)" : "rgba(0, 0, 0, 0.42)");
    var cardBorder = is30Dark ? "rgba(255, 255, 255, 0.12)" : "rgba(138, 109, 71, 0.22)";
    var inputBorder = is30Dark ? "rgba(255, 255, 255, 0.25)" : "rgba(138, 109, 71, 0.35)";

    root.style.setProperty("--inv-60", color60);
    root.style.setProperty("--inv-30", color30);
    root.style.setProperty("--inv-10", color10);
    root.style.setProperty("--inv-text-on-60", textOn60);
    root.style.setProperty("--inv-body-on-60", bodyOn60);
    root.style.setProperty("--inv-text-on-30", textOn30);
    root.style.setProperty("--inv-card-bg", cardBg);
    root.style.setProperty("--inv-card-text", cardText);
    root.style.setProperty("--inv-card-muted", cardMuted);
    root.style.setProperty("--inv-on-accent", onAccent);
    root.style.setProperty("--inv-button-text", onAccent);
    root.style.setProperty("--inv-overlay", overlay);
    root.style.setProperty("--inv-card-border", cardBorder);
    root.style.setProperty("--inv-input-border", inputBorder);
    root.style.setProperty("--text-color", textOn60);

    existingStyle = document.getElementById("invitta-visual-customization");
    if (existingStyle) existingStyle.remove();

    // Recovery rule: tokens are data, not a second stylesheet. The previous
    // generic selectors recolored headers, body copy, cards, photos and music
    // players across unrelated template DOMs. Native template CSS remains the
    // single authority until a template-specific adapter opts into these tokens.
    delete root.dataset.invittaTheme;
    return;

    if (!palette && !data.titleColor && !data.bodyColor && !data.accentColor) return;

    root.dataset.invittaTheme = "active";
    var style = document.createElement("style");
    style.id = "invitta-visual-customization";
    style.textContent = [
      /* 60 — fondo dominante */
      "html[data-invitta-theme=\"active\"] body { background-color: var(--inv-60) !important; color: var(--inv-body-on-60) !important; }",

      /* Títulos principales sobre fondo 60 */
      "html[data-invitta-theme=\"active\"] h1:not(.text-paper):not(.text-white):not([class*='hero']):not(.card h1):not(.invitta-gift-title), html[data-invitta-theme=\"active\"] h2:not(.text-paper):not(.text-white):not([class*='hero']):not(.card h2), html[data-invitta-theme=\"active\"] h3:not(.text-paper):not(.text-white):not([class*='hero']):not(.card h3):not(.invitta-gift-title), html[data-invitta-theme=\"active\"] .font-display:not(.text-paper):not(.text-white):not([class*='hero']), html[data-invitta-theme=\"active\"] .font-serif:not(.text-paper):not(.text-white):not([class*='hero']):not(.card *) { color: var(--inv-text-on-60) !important; }",

      /* Párrafos sobre fondo 60 */
      "html[data-invitta-theme=\"active\"] p:not(.text-paper):not(.text-white):not([class*='hero']):not(.card p):not(.invitta-gift-card p), html[data-invitta-theme=\"active\"] .font-sans:not(.text-paper):not(.text-white):not([class*='hero']):not(.card *):not(.invitta-gift-card *) { color: var(--inv-body-on-60); }",

      /* 30 — Tarjetas y superficies secundarias (Dresscode, RSVP, Regalos, Itinerario, Padres, Mensajes, Countdown) */
      "html[data-invitta-theme=\"active\"] .bg-paper, html[data-invitta-theme=\"active\"] .bg-cream, html[data-invitta-theme=\"active\"] .bg-ivory, html[data-invitta-theme=\"active\"] .card, html[data-invitta-theme=\"active\"] .section-card, html[data-invitta-theme=\"active\"] [data-invitta-card], html[data-invitta-theme=\"active\"] .invitta-gift-card, html[data-invitta-theme=\"active\"] #rsvp .max-w-2xl, html[data-invitta-theme=\"active\"] .itinerary-card, html[data-invitta-theme=\"active\"] .timeline-item, html[data-invitta-theme=\"active\"] .dresscode-card, html[data-invitta-theme=\"active\"] .dresscode-item, html[data-invitta-theme=\"active\"] .family-card, html[data-invitta-theme=\"active\"] .parent-card, html[data-invitta-theme=\"active\"] .countdown-card { background-color: var(--inv-card-bg) !important; color: var(--inv-card-text) !important; border-color: var(--inv-card-border) !important; }",

      /* Títulos dentro de tarjetas */
      "html[data-invitta-theme=\"active\"] .card h1, html[data-invitta-theme=\"active\"] .card h2, html[data-invitta-theme=\"active\"] .card h3, html[data-invitta-theme=\"active\"] .card h4, html[data-invitta-theme=\"active\"] .invitta-gift-title, html[data-invitta-theme=\"active\"] .bg-paper h1, html[data-invitta-theme=\"active\"] .bg-paper h2, html[data-invitta-theme=\"active\"] .bg-paper h3, html[data-invitta-theme=\"active\"] .bg-paper h4, html[data-invitta-theme=\"active\"] #rsvp .max-w-2xl h2, html[data-invitta-theme=\"active\"] #rsvp .max-w-2xl h3 { color: var(--inv-card-text) !important; }",

      /* Texto secundario y párrafos en tarjetas */
      "html[data-invitta-theme=\"active\"] .card p, html[data-invitta-theme=\"active\"] .card span:not(.badge):not(.invitta-gift-icon):not([class*='icon']):not([class*='number']), html[data-invitta-theme=\"active\"] .invitta-gift-description, html[data-invitta-theme=\"active\"] .invitta-gift-bank-info, html[data-invitta-theme=\"active\"] .bg-paper p, html[data-invitta-theme=\"active\"] .bg-paper span:not(.badge):not([class*='icon']), html[data-invitta-theme=\"active\"] #rsvp .max-w-2xl p { color: var(--inv-card-muted) !important; }",

      /* 10 — Acentos y Realces */
      "html[data-invitta-theme=\"active\"] .text-sage, html[data-invitta-theme=\"active\"] .text-gold, html[data-invitta-theme=\"active\"] .text-accent, html[data-invitta-theme=\"active\"] .countdown-number, html[data-invitta-theme=\"active\"] [class*='countdown'] span, html[data-invitta-theme=\"active\"] .invitta-gift-icon, html[data-invitta-theme=\"active\"] [data-invitta-accent] { color: var(--inv-10) !important; }",
      "html[data-invitta-theme=\"active\"] .border-sage, html[data-invitta-theme=\"active\"] .border-gold, html[data-invitta-theme=\"active\"] .border-accent { border-color: var(--inv-10) !important; }",
      "html[data-invitta-theme=\"active\"] .bg-sage, html[data-invitta-theme=\"active\"] .bg-gold, html[data-invitta-theme=\"active\"] .bg-accent { background-color: var(--inv-10) !important; }",

      /* Botones */
      "html[data-invitta-theme=\"active\"] .button:not(.button--outline):not(.button--text), html[data-invitta-theme=\"active\"] button.btn-primary, html[data-invitta-theme=\"active\"] .btn-accent, html[data-invitta-theme=\"active\"] .invitta-gift-button { background-color: var(--inv-10) !important; border-color: var(--inv-10) !important; color: var(--inv-on-accent) !important; }",
      "html[data-invitta-theme=\"active\"] .button--outline, html[data-invitta-theme=\"active\"] .button--text { color: var(--inv-10) !important; border-color: var(--inv-10) !important; background-color: transparent !important; }",

      /* Inputs, Selects, Textareas y Placeholders */
      "html[data-invitta-theme=\"active\"] input:not([type='checkbox']):not([type='radio']):not([type='submit']), html[data-invitta-theme=\"active\"] select, html[data-invitta-theme=\"active\"] textarea { background-color: var(--inv-card-bg) !important; color: var(--inv-card-text) !important; border: 1px solid var(--inv-input-border) !important; }",
      "html[data-invitta-theme=\"active\"] input::placeholder, html[data-invitta-theme=\"active\"] textarea::placeholder { color: var(--inv-card-muted) !important; opacity: 0.75 !important; }",

      /* Texto sobre fotos / Hero Cover */
      "html[data-invitta-theme=\"active\"] .hero__cover::after, html[data-invitta-theme=\"active\"] [class*='hero'] [class*='overlay'], html[data-invitta-theme=\"active\"] .hero-cover-overlay { background: var(--inv-overlay) !important; }",
      "html[data-invitta-theme=\"active\"] [class*='hero'] h1, html[data-invitta-theme=\"active\"] [class*='hero'] h2, html[data-invitta-theme=\"active\"] [class*='hero'] p, html[data-invitta-theme=\"active\"] [class*='hero'] .hero__name, html[data-invitta-theme=\"active\"] [class*='hero'] [data-invitta-font-role='name'] { text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45); }",

      /* Reproductor de Música y Barra Inferior (Bottom Bar) */
      "html[data-invitta-theme=\"active\"] #invitta-audio-control, html[data-invitta-theme=\"active\"] .inv-music-dock, html[data-invitta-theme=\"active\"] .inv-bottom-bar, html[data-invitta-theme=\"active\"] nav.inv-bottom-nav { background-color: var(--inv-30) !important; color: var(--inv-card-text) !important; border-color: var(--inv-card-border) !important; }",
      "html[data-invitta-theme=\"active\"] #invitta-audio-control span, html[data-invitta-theme=\"active\"] #invitta-audio-control p, html[data-invitta-theme=\"active\"] .inv-music-dock span, html[data-invitta-theme=\"active\"] .inv-bottom-bar span, html[data-invitta-theme=\"active\"] nav.inv-bottom-nav span { color: var(--inv-card-text) !important; }",

      /* Tipografías */
      "html[data-invitta-theme=\"active\"] h1, html[data-invitta-theme=\"active\"] h2, html[data-invitta-theme=\"active\"] h3, html[data-invitta-theme=\"active\"] .font-display, html[data-invitta-theme=\"active\"] .font-serif { font-family: var(--font-display, var(--font-script, 'Georgia')), serif; }",
      "html[data-invitta-theme=\"active\"] body, html[data-invitta-theme=\"active\"] button, html[data-invitta-theme=\"active\"] input, html[data-invitta-theme=\"active\"] select, html[data-invitta-theme=\"active\"] textarea, html[data-invitta-theme=\"active\"] .font-sans, html[data-invitta-theme=\"active\"] .font-body { font-family: var(--font-sans, var(--font-secondary, 'Arial')), sans-serif; }",

      /* Nombre dinámico: respetar casing exacto del dashboard */
      "html[data-invitta-theme=\"active\"] .hero__name, html[data-invitta-theme=\"active\"] #celebrant-name, html[data-invitta-theme=\"active\"] .inv-hero-name, html[data-invitta-theme=\"active\"] .couple-names, html[data-invitta-theme=\"active\"] .couple-name, html[data-invitta-theme=\"active\"] .honoree-name, html[data-invitta-theme=\"active\"] [data-invitta-font-role='cover-name'], html[data-invitta-theme=\"active\"] [data-invitta-font-role='name'] { text-transform: none !important; }"
    ].join("\n");
    document.head.appendChild(style);
  }

  function applyCustomBackground(data) {
    if (!document.body) return;
    
    var root = document.documentElement;
    var hasBackground = data.bgEnabled === true && data.backgroundImageUrl;
    
    if (!hasBackground) {
      document.body.classList.remove("invitta-custom-bg");
      return;
    }
    
    var opacity = Number(data.bgOverlayOpacity);
    opacity = (isNaN(opacity) || opacity < 0) ? 0.35 : Math.min(opacity, 1);
    var imageOpacity = Number(data.bgImageOpacity);
    imageOpacity = (isNaN(imageOpacity) || imageOpacity < 0) ? 0.18 : Math.min(imageOpacity, 0.6);
    
    var blur = Number(data.bgBlur);
    blur = (isNaN(blur) || blur < 0) ? 0 : Math.min(blur, 20);
    
    var positionMap = { center: "center", top: "top", bottom: "bottom", left: "left", right: "right" };
    var position = positionMap[data.bgPosition] || "center";
    
    var sizeMap = { cover: "cover", contain: "contain", auto: "auto" };
    var size = sizeMap[data.bgSize] || "cover";
    
    var color = data.bgOverlayColor || "#000000";
    if (data.bgOverlayEnabled === false) {
      opacity = 0;
    }
    
    root.style.setProperty("--inv-custom-bg-image", "url('" + data.backgroundImageUrl + "')");
    root.style.setProperty("--inv-custom-bg-image-opacity", imageOpacity);
    root.style.setProperty("--inv-custom-bg-position", position);
    root.style.setProperty("--inv-custom-bg-size", size);
    root.style.setProperty("--inv-custom-bg-overlay-color", color);
    root.style.setProperty("--inv-custom-bg-overlay-opacity", opacity);
    root.style.setProperty("--inv-custom-bg-blur", blur + "px");
    
    document.body.classList.add("invitta-custom-bg");
    
    if (!document.getElementById("invitta-custom-background-style")) {
      var style = document.createElement("style");
      style.id = "invitta-custom-background-style";
      style.textContent = 
        "body.invitta-custom-bg { position:relative; isolation:isolate; background:transparent!important; }\n" +
        "body.invitta-custom-bg::before { content: ''; position: fixed; inset: -24px; z-index: 3; pointer-events: none; opacity:var(--inv-custom-bg-image-opacity); mix-blend-mode:multiply; " +
        "background-image: var(--inv-custom-bg-image); background-size: var(--inv-custom-bg-size); " +
        "background-position: var(--inv-custom-bg-position); background-repeat: no-repeat; " +
        "filter: blur(var(--inv-custom-bg-blur)); transform: scale(1.03); }\n" +
        "body.invitta-custom-bg::after { content: ''; position: fixed; inset: 0; z-index: 1; pointer-events: none; " +
        "background: var(--inv-custom-bg-overlay-color); opacity: var(--inv-custom-bg-overlay-opacity); }\n" +
        "body.invitta-custom-bg > * { position:relative; z-index:2; }\n" +
        "body.invitta-custom-bg #root,body.invitta-custom-bg #app,body.invitta-custom-bg #inv-content { background-color:transparent!important; }";
      document.head.appendChild(style);
    }
  }

  function applyTypographyRoleOverrides() {
    // Uploaded fonts are selected per text role in Studio. Keep those rules
    // separate from the global preset adapter so a custom font only changes
    // the zone chosen by the user and preserves each template's own layout.
    var roleConfig = data.typographyRoles || {};
    var typographyFonts = Array.isArray(data.typographyFonts) ? data.typographyFonts.slice(0, 4) : [];
    if (!typographyFonts.length && data.customFontUrl) {
      typographyFonts = [{ id: "font-legacy-custom", name: data.customFontName || "Tipografía personalizada", url: data.customFontUrl }];
    }

    var customFontFamilies = {};
    var fontFaces = typographyFonts.map(function(font) {
      if (!font || !font.url) return "";
      var safeId = String(font.id || "custom").replace(/[^A-Za-z0-9_-]/g, "");
      var family = "InvittaUserFont_" + (safeId || "custom");
      var extension = String(font.url).split("?")[0].split(".").pop().toLowerCase();
      var format = extension === "woff2" ? "woff2" : extension === "woff" ? "woff" : extension === "otf" ? "opentype" : "truetype";
      customFontFamilies[font.id] = family;
      return '@font-face{font-family:"' + family + '";src:url(' + JSON.stringify(font.url) + ') format("' + format + '");font-style:normal;font-weight:400;font-display:swap;}';
    }).filter(Boolean);

    var fontFaceStyle = document.getElementById("invitta-custom-font-face");
    if (!fontFaceStyle) {
      fontFaceStyle = document.createElement("style");
      fontFaceStyle.id = "invitta-custom-font-face";
      document.head.appendChild(fontFaceStyle);
    }
    fontFaceStyle.textContent = fontFaces.join("\n");

    var presets = {
      classic: { display: '"Cormorant Garamond", "Playfair Display", Georgia, serif', body: '"Montserrat", "Hanken Grotesk", Arial, sans-serif' },
      romantic: { display: '"Great Vibes", "Cormorant Garamond", cursive', body: '"Montserrat", "Hanken Grotesk", Arial, sans-serif' },
      editorial: { display: '"Playfair Display", "Cormorant Garamond", Georgia, serif', body: '"Hanken Grotesk", "Montserrat", Arial, sans-serif' },
      minimal: { display: '"Montserrat", "Hanken Grotesk", Arial, sans-serif', body: '"Montserrat", "Hanken Grotesk", Arial, sans-serif' },
      luxury: { display: '"Playfair Display", "Cormorant Garamond", Georgia, serif', body: '"Hanken Grotesk", "Montserrat", Arial, sans-serif' },
      signature: { display: '"Allura", "Great Vibes", cursive', body: '"Montserrat", Arial, sans-serif' },
      couture: { display: '"Parisienne", "Great Vibes", cursive', body: '"Playfair Display", Georgia, serif' }
    };
    var roleStyle = document.getElementById("invitta-typography-roles");
    if (!roleStyle) {
      roleStyle = document.createElement("style");
      roleStyle.id = "invitta-typography-roles";
      document.head.appendChild(roleStyle);
    }

    roleStyle.textContent = typographyRoleOrder.map(function(role) {
      var source = roleConfig[role] && roleConfig[role].font || "inherit";
      // Inherit intentionally emits no rule: the native template typography
      // remains authoritative until Studio has a concrete role selection.
      if (source === "inherit") return "";
      var customFamily = customFontFamilies[source] || (source === "custom" && typographyFonts[0] ? customFontFamilies[typographyFonts[0].id] : "");
      var selected = customFamily
        ? { display: '"' + customFamily + '", "Cormorant Garamond", Georgia, serif', body: '"' + customFamily + '", "Montserrat", Arial, sans-serif' }
        : presets[source];
      if (!selected || !typographyRoleSelectors[role]) return "";
      var family = role === "body" || role === "labels" ? selected.body : selected.display;
      var scopedSelectors = typographyRoleSelectors[role].split(",").map(function(selector) {
        return "html body " + selector.trim();
      }).join(",");
      return scopedSelectors + "{font-family:" + family + "!important;}";
    }).join("\n");
  }

  function applyTemplateTypography() {
    // Typography is an explicit Studio choice. The default "classic" keeps
    // the native design untouched; a selected preset changes families only,
    // never the template's responsive sizes, spacing, or motion.
    var root = document.documentElement;
    var style = document.getElementById("invitta-template-typography");
    if (style) style.remove();
    delete root.dataset.invittaFontPreset;

    var selectedPreset = data.fontPreset;
    if (!selectedPreset || selectedPreset === "classic") return;
    var presets = {
      romantic: { display: '"Great Vibes", "Cormorant Garamond", cursive', body: '"Montserrat", "Hanken Grotesk", Arial, sans-serif' },
      editorial: { display: '"Playfair Display", "Cormorant Garamond", Georgia, serif', body: '"Hanken Grotesk", "Montserrat", Arial, sans-serif' },
      minimal: { display: '"Montserrat", "Hanken Grotesk", Arial, sans-serif', body: '"Montserrat", "Hanken Grotesk", Arial, sans-serif' },
      luxury: { display: '"Playfair Display", "Cormorant Garamond", Georgia, serif', body: '"Hanken Grotesk", "Montserrat", Arial, sans-serif' },
      signature: { display: '"Allura", "Great Vibes", cursive', body: '"Montserrat", Arial, sans-serif' },
      couture: { display: '"Parisienne", "Great Vibes", cursive', body: '"Playfair Display", Georgia, serif' }
    };
    var fonts = presets[selectedPreset];
    if (selectedPreset === "custom") {
      var customFont = (Array.isArray(data.typographyFonts) && data.typographyFonts[0]) ||
        (data.customFontUrl ? { id: "legacy", url: data.customFontUrl } : null);
      if (customFont && customFont.url) {
        var safeId = String(customFont.id || "custom").replace(/[^A-Za-z0-9_-]/g, "");
        var family = "InvittaUserFont_" + (safeId || "custom");
        var extension = customFont.url.split("?")[0].split(".").pop().toLowerCase();
        var format = extension === "woff2" ? "woff2" : extension === "woff" ? "woff" : extension === "otf" ? "opentype" : "truetype";
        var customStyle = document.createElement("style");
        customStyle.textContent = '@font-face{font-family:"' + family + '";src:url(' + JSON.stringify(customFont.url) + ') format("' + format + '");font-style:normal;font-weight:400;font-display:swap;}';
        document.head.appendChild(customStyle);
        fonts = { display: '"' + family + '", "Cormorant Garamond", Georgia, serif', body: '"' + family + '", "Montserrat", Arial, sans-serif' };
      }
    }
    if (!fonts) return;

    root.dataset.invittaFontPreset = selectedPreset;
    root.style.setProperty("--font-display", fonts.display);
    root.style.setProperty("--font-serif", fonts.display);
    root.style.setProperty("--font-sans", fonts.body);
    var fontLink = document.getElementById("invitta-template-fonts");
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "invitta-template-fonts";
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Allura&family=Great+Vibes&family=Hanken+Grotesk:wght@400..700&family=Montserrat:wght@400..700&family=Parisienne&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap";
      document.head.appendChild(fontLink);
    }

    // Restrict the adapter to invitation content. In particular, it does not
    // touch the header, player controls, QR artwork or native layout helpers.
    var sections = "#hero,#cover,#portada,#inv-hero,#family,#honors,#details,#locations,#itinerary,#gallery,#registry,#rsvp";
    var headingSelectors = sections.split(",").map(function(section) {
      return section + " h1," + section + " h2," + section + " h3," + section + " .font-display," + section + " .font-serif";
    }).join(",");
    var bodySelectors = sections.split(",").map(function(section) {
      return section + " p," + section + " li," + section + " blockquote";
    }).join(",");
    style = document.createElement("style");
    style.id = "invitta-template-typography";
    style.textContent = headingSelectors + "{font-family:" + fonts.display + "!important;}" +
      bodySelectors + "{font-family:" + fonts.body + "!important;}";
    document.head.appendChild(style);
  }

  function applyTemplatePaletteAdapter() {
    // These are the few legacy premium/VIP surfaces that use literal utility
    // colors instead of the native tokens. Scope them tightly so palettes do
    // not overwrite imagery, parallax, animations, or ordinary template CSS.
    var existing = document.getElementById("invitta-template-palette-adapter");
    if (existing) existing.remove();
    if (!data.palettePreset) return;
    var style = document.createElement("style");
    style.id = "invitta-template-palette-adapter";
    style.textContent = [
      "html[data-invitta-palette] #itinerary{background-color:var(--inv-60)!important;color:var(--inv-30)!important;}",
      "html[data-invitta-palette] #itinerary h1,html[data-invitta-palette] #itinerary h2,html[data-invitta-palette] #itinerary h3,html[data-invitta-palette] #itinerary h4,html[data-invitta-palette] #itinerary p,html[data-invitta-palette] #itinerary li{color:var(--inv-30)!important;}",
      "html[data-invitta-palette] #itinerary .text-sage,html[data-invitta-palette] #itinerary .text-champagne-gold,html[data-invitta-palette] #itinerary .text-primary{color:var(--inv-10)!important;}",
      "html[data-invitta-palette] #itinerary .bg-paper,html[data-invitta-palette] #itinerary .bg-surface-container-low,html[data-invitta-palette] #itinerary .bg-surface-container-lowest{background-color:var(--inv-60)!important;}",
      "html[data-invitta-palette] #music-player-bottom-bar,html[data-invitta-palette] #music-player-container{background-color:var(--inv-60)!important;border-color:var(--inv-10)!important;color:var(--inv-30)!important;}",
      "html[data-invitta-palette] #music-player-bottom-bar p,html[data-invitta-palette] #music-player-bottom-bar span,html[data-invitta-palette] #music-player-bottom-bar button,html[data-invitta-palette] #music-player-container p,html[data-invitta-palette] #music-player-container span,html[data-invitta-palette] #music-player-container button{color:var(--inv-30)!important;}",
      "html[data-invitta-palette] #music-player-bottom-bar .text-sage,html[data-invitta-palette] #music-player-bottom-bar .text-champagne-gold,html[data-invitta-palette] #music-player-container .text-sage,html[data-invitta-palette] #music-player-container .text-champagne-gold{color:var(--inv-10)!important;}",
      "html[data-invitta-palette] #music-toggle-play-btn{background-color:var(--inv-30)!important;border-color:var(--inv-10)!important;color:var(--inv-60)!important;}",
      "html[data-invitta-palette] #music-toggle-play-btn>span{color:var(--inv-60)!important;}",
      "html[data-invitta-palette] #music-player-bottom-bar input,html[data-invitta-palette] #music-player-container input{accent-color:var(--inv-10)!important;}",
      "html[data-invitta-palette] #music-player{background-color:var(--inv-60)!important;border-color:var(--inv-10)!important;color:var(--inv-30)!important;}",
      "html[data-invitta-palette] #music-player .music-player__track span,html[data-invitta-palette] #music-player .music-player__toggle{color:var(--inv-10)!important;}",
      "html[data-invitta-palette] #music-player .music-player__track strong,html[data-invitta-palette] #music-player .music-player__track small{color:var(--inv-30)!important;}",
      "html[data-invitta-palette] #music-player .music-player__toggle{border-color:var(--inv-10)!important;}",
      "html[data-invitta-palette] #countdown{background-color:var(--inv-60)!important;color:var(--inv-30)!important;}",
      "html[data-invitta-palette] #countdown h1,html[data-invitta-palette] #countdown h2,html[data-invitta-palette] #countdown h3,html[data-invitta-palette] #countdown h4,html[data-invitta-palette] #countdown p,html[data-invitta-palette] #countdown span{color:var(--inv-30)!important;}",
      "html[data-invitta-palette] #countdown [class*='text-sage']{color:var(--inv-10)!important;}",
      "html[data-invitta-palette] #countdown [class*='bg-sage']{background-color:var(--inv-10)!important;}",
      "[data-invitta-dress-code-title]{font-size:clamp(1.75rem,8vw,3.25rem)!important;font-weight:400!important;letter-spacing:-.045em!important;line-height:1!important;max-width:none!important;margin-left:auto!important;margin-right:auto!important;white-space:nowrap!important;text-wrap:nowrap!important;}"
    ].join("");
    document.head.appendChild(style);
  }

  function applyAll() {
    if (applying || !document.body) return;
    applying = true;
    ensureDynamicCasingStyles();
    ensureMusicControlStyles();
    ensureActionAccessibilityStyles();
    replaceText(document.body);
    applyLocationContent();
    cleanRsvpMessageLabels();
    markFamilySectionTitles();
    applyHeroImage();
    applyGalleryImages();
    applyInternalEditorialImages();
    applySectionVisibility();
    applySectionBackgrounds();
    applyCustomBackground(data);
    applyAudio();
    applyOptionalContent();
    applyDressCode();
    applyGiftOptions();
    applyLinks();
    applyGuestData();
    applyVipAccessPass();
    applyConfirmationContacts();
    markAccessibleActions();
    hideLegacyGuestAdmin();
    restoreCanonicalNameCasing();
    applyPlumNoirWeddingAdapter();
    applyCoverNameSizing();
    applyEditorialCoverMeta();
    applyTypographyScales(false);
    hideUnsupportedPlumNoirSamples();
    applyItineraryHeading();
    normalizeLocationHeading();
    applying = false;
  }

  if (typeof HTMLAudioElement !== "undefined" && !window.__invittaAudioHooked) {
    window.__invittaAudioHooked = true;
    var origPlay = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function () {
      if (!data.musicUrl) {
        try {
          this.pause();
          this.currentTime = 0;
          this.src = "";
          this.removeAttribute("src");
        } catch (e) {}
        return Promise.resolve();
      }

      if (this.src && isDemoAudio(this.src) && this.src !== data.musicUrl) {
        this.src = data.musicUrl;
      }

      return origPlay.apply(this, arguments);
    };
  }

  ensureDynamicCasingStyles();
  ensureMusicControlStyles();
  applyThemeHooks();
  applyTemplatePaletteAdapter();
  applyTemplateTypography();
  applyTypographyRoleOverrides();
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
