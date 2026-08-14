(function () {
  "use strict";

  var data = window.INVITATION_DATA || {
    eventType: "cumpleanos",
    eventTitle: "Mi cumpleaños",
    celebrantName: "Luis",
    eventDate: "2026-12-12",
    eventTime: "18:00",
    quote: "Hay momentos que merecen celebrarse con las personas que más queremos."
  };

  function text(id, value) {
    var element = document.getElementById(id);
    if (element && value) element.textContent = value;
  }

  function show(id, visible) {
    var element = document.getElementById(id);
    if (element) element.hidden = !visible;
  }

  function clean(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function formatDate(value) {
    if (!value) return "Próximamente";
    var date = new Date(value + (String(value).length === 10 ? "T12:00:00" : ""));
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
  }

  function formatTime(value) {
    var match = String(value || "").match(/(\d{1,2}):(\d{2})/);
    if (!match) return clean(value);
    var hour = Number(match[1]);
    return (hour % 12 || 12) + ":" + match[2] + " " + (hour >= 12 ? "p. m." : "a. m.");
  }

  function itineraryParts(item) {
    var rawTime = clean(item && item.time);
    var rawTitle = clean(item && item.title) || "Actividad";
    if (!rawTime) {
      var embeddedTime = rawTitle.match(/^(\d{1,2}:\d{2})\s*(?:[-–—·|]\s*)?(.+)$/);
      if (embeddedTime) {
        rawTime = embeddedTime[1];
        rawTitle = clean(embeddedTime[2]) || "Actividad";
      }
    }
    return { rawTime: rawTime, time: formatTime(rawTime), title: rawTitle };
  }

  function capitalize(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
  }

  function renderMilestoneDate(dateValue, timeValue) {
    var container = document.getElementById("event-date");
    if (!container || !dateValue) return false;
    var date = new Date(dateValue + (String(dateValue).length === 10 ? "T12:00:00" : ""));
    if (Number.isNaN(date.getTime())) return false;

    var weekday = document.createElement("span");
    weekday.className = "hero__date-weekday";
    weekday.textContent = capitalize(new Intl.DateTimeFormat("es-MX", { weekday: "long" }).format(date));

    var calendar = document.createElement("span");
    calendar.className = "hero__date-calendar";
    var month = document.createElement("span");
    month.textContent = capitalize(new Intl.DateTimeFormat("es-MX", { month: "long" }).format(date));
    var day = document.createElement("strong");
    day.textContent = String(date.getDate());
    calendar.append(month, day);

    container.replaceChildren(weekday, calendar);
    var timeMatch = String(timeValue || "").match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      var hour = Number(timeMatch[1]);
      var time = document.createElement("span");
      time.className = "hero__date-time";
      time.textContent = (hour % 12 || 12) + (timeMatch[2] === "00" ? "" : ":" + timeMatch[2]) + (hour >= 12 ? "pm" : "am");
      container.appendChild(time);
    }
    return true;
  }

  function eventKind(type) {
    return ({
      cumpleanos: "Una vuelta más al sol",
      bautizo: "Un día lleno de luz",
      otro: "Una fecha para celebrar"
    })[type] || "Una fecha para celebrar";
  }

  function selectedTemplateId() {
    var queryTemplateId = "";
    try {
      queryTemplateId = new URLSearchParams(window.location.search).get("template") || "";
    } catch (error) {}
    return clean(data.templateId || window.INVITTA_TEMPLATE_ID || queryTemplateId);
  }

  function milestoneAge() {
    if (selectedTemplateId() === "cumpleanos-50-sorpresa") return "50";
    if (data.eventType !== "cumpleanos") return "";
    var match = clean(data.eventTitle).match(/(?:^|\D)(50)(?:\D|$)/);
    return match ? match[1] : "";
  }

  function renderPeople() {
    var people = [];
    (data.parents || []).forEach(function (name) { if (name) people.push(name); });
    (data.godparents || []).forEach(function (person) { if (person && person.name) people.push(person.name); });
    if (!people.length) return;
    var container = document.getElementById("special-people");
    people.forEach(function (name) {
      var item = document.createElement("p");
      item.textContent = name;
      container.appendChild(item);
    });
    container.hidden = false;
  }

  function renderLocations() {
    var ceremony = data.ceremony || {};
    var reception = data.reception || {};
    var celebration = {
      name: reception.name,
      address: reception.address,
      mapUrl: reception.mapUrl,
      time: clean(reception.time) || clean(data.eventTime)
    };
    var locations = [];

    // The general event time is also exposed as ceremony.time for legacy
    // invitations. A ceremony only exists when it has actual location data.
    if (clean(ceremony.name) || clean(ceremony.address) || clean(ceremony.mapUrl)) {
      locations.push({ label: "Ceremonia", value: ceremony });
    }

    if (clean(celebration.name) || clean(celebration.address) || clean(celebration.mapUrl) || clean(celebration.time)) {
      locations.push({ label: "Celebración", value: celebration });
    }

    if (!locations.length) {
      locations.push({ label: "Evento", value: { name: "Lugar por confirmar", time: data.eventTime } });
    }

    var container = document.getElementById("location-cards");
    locations.forEach(function (entry) {
      var card = document.createElement("article");
      card.className = "card";
      var heading = document.createElement("p");
      heading.className = "eyebrow";
      heading.textContent = entry.label;
      card.appendChild(heading);
      if (entry.value.name) {
        var title = document.createElement("h3");
        title.textContent = entry.value.name;
        card.appendChild(title);
      }
      var timeValue = formatTime(entry.value.time);
      if (timeValue) {
        var eventTime = document.createElement("p");
        eventTime.className = "card__time";
        eventTime.textContent = timeValue;
        card.appendChild(eventTime);
      }
      if (entry.value.address) {
        var address = document.createElement("p");
        address.className = "card__address";
        address.textContent = entry.value.address;
        card.appendChild(address);
      }
      if (entry.value.mapUrl) {
        var link = document.createElement("a");
        link.className = "button button--outline";
        link.href = entry.value.mapUrl;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "Cómo llegar";
        card.appendChild(link);
      }
      container.appendChild(card);
    });
  }

  function renderItinerary() {
    var items = Array.isArray(data.itinerary) ? data.itinerary : [];
    if (!items.length) return;
    var container = document.getElementById("itinerary-items");
    items.forEach(function (item, index) {
      var parts = itineraryParts(item);
      var row = document.createElement("div");
      row.className = "timeline__item";
      row.dataset.index = String(index + 1).padStart(2, "0");
      if (!parts.time) row.classList.add("timeline__item--no-time");
      var time = document.createElement("time");
      time.className = "timeline__time";
      time.dateTime = parts.rawTime;
      time.textContent = parts.time;
      var title = document.createElement("span");
      title.className = "timeline__title";
      title.textContent = parts.title;
      if (parts.time) row.appendChild(time);
      row.appendChild(title);
      container.appendChild(row);
    });
    show("itinerary", true);
  }

  function renderGallery() {
    var urls = (data.galleryUrls || []).filter(Boolean);
    if (data.mainPhotoUrl && urls.indexOf(data.mainPhotoUrl) === -1) urls.unshift(data.mainPhotoUrl);
    if (!urls.length) return;
    var grid = document.getElementById("gallery-grid");
    urls.slice(0, 6).forEach(function (url, index) {
      var image = document.createElement("img");
      image.src = url;
      image.alt = "Recuerdo " + (index + 1);
      image.loading = "lazy";
      image.dataset.invittaPersonalized = "true";
      grid.appendChild(image);
    });
    show("gallery", true);
  }

  function renderGuest() {
    if (data.guestName) {
      text("guest-name", data.guestName);
      text("guest-details", (data.passes || 1) + " pase(s)" + (data.table ? " · Mesa " + data.table : ""));
      show("guest-card", true);
    }
    var limit = Math.max(1, Number(data.passes || 1));
    var select = document.getElementById("passes-select");
    for (var index = 1; index <= limit; index += 1) {
      var option = document.createElement("option");
      option.value = String(index);
      option.textContent = index + (index === 1 ? " persona" : " personas");
      select.appendChild(option);
    }
    select.value = String(limit);
    show("passes-label", Boolean(data.guestName));
    show("confirm-button", Boolean(data.whatsapp || (data.confirmationPhones || []).length));
  }

  function renderMusic() {
    document.body.classList.toggle("has-music-player", Boolean(data.musicUrl));
    if (!data.musicUrl) return;
    var audio = document.getElementById("event-music");
    var player = document.getElementById("music-player");
    var toggle = document.getElementById("music-toggle");
    var icon = document.getElementById("music-icon");
    var action = document.getElementById("music-action");
    var title = document.getElementById("music-track-title");
    var artist = document.getElementById("music-track-artist");

    audio.src = data.musicUrl;
    audio.dataset.invittaPersonalized = "true";
    title.textContent = clean(data.musicTitle) || "Música del evento";
    if (clean(data.musicArtist)) {
      artist.textContent = data.musicArtist;
      artist.hidden = false;
    }
    player.hidden = false;

    function updateState(isPlaying) {
      toggle.setAttribute("aria-pressed", String(isPlaying));
      toggle.setAttribute("aria-label", isPlaying ? "Pausar música" : "Activar música");
      icon.textContent = isPlaying ? "‖" : "▶";
      action.textContent = isPlaying ? "Pausar" : "Activar música";
    }

    toggle.addEventListener("click", function () {
      if (audio.paused) {
        audio.play().then(function () { updateState(true); }).catch(function () { updateState(false); });
      } else {
        audio.pause();
        updateState(false);
      }
    });
    audio.addEventListener("pause", function () { updateState(false); });
    audio.addEventListener("play", function () { updateState(true); });
  }

  function renderStudioCta() {
    if (data.studioCtaEnabled === false) return;
    var phone = clean(data.studioWhatsapp).replace(/\D/g, "") || "525566790073";
    if (!phone) return;
    var textValue = clean(data.studioCtaText) || "Solicitar informes";
    var message = clean(data.studioCtaMessage) || "Hola Invitta, vi esta invitación digital y me interesa pedir informes para crear una similar.";
    var link = document.getElementById("studio-cta-link");
    if (!link) return;
    link.textContent = textValue;
    link.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
    show("studio-cta", true);
  }

  function installParallax() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var targets = Array.from(document.querySelectorAll("#hero, #family, #locations, #gallery, #registry, #rsvp, .closing"));
    var scheduled = false;

    function update() {
      scheduled = false;
      var viewportHeight = Math.max(window.innerHeight, 1);
      var isMobile = window.innerWidth <= 760;
      var backgroundMaxShift = isMobile ? 96 : 56;
      var layerMaxShift = isMobile ? 62 : 50;
      var contentMaxShift = isMobile ? 14 : 10;

      targets.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        if (!rect.height) return;
        var distance = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
        var progress = Math.max(-1.25, Math.min(1.25, distance));
        var backgroundShift = Math.round(progress * -backgroundMaxShift);
        var layerShift = Math.round(progress * layerMaxShift);
        var contentShift = Math.round(progress * -contentMaxShift);

        section.style.setProperty("--parallax-bg-shift", backgroundShift + "px");
        section.style.setProperty("--parallax-layer-shift", layerShift + "px");
        section.style.setProperty("--parallax-content-shift", contentShift + "px");

        if (section.dataset.invittaSectionBackground) {
          section.style.setProperty("background-position", "center calc(50% + " + Math.round(backgroundShift * .9) + "px)", "important");
        }
      });
    }

    function schedule() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.setTimeout(schedule, 0);
    window.setTimeout(schedule, 600);
  }

  function installInternalNavigation() {
    document.querySelectorAll('.hero__links a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        var targetId = link.getAttribute("href");
        var target = targetId ? document.querySelector(targetId) : null;
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  var milestone = milestoneAge();
  if (milestone) {
    document.body.classList.add("theme-milestone-50");
    text("hero-secret", "Shhh…");
    show("hero-secret", true);
    text("hero-milestone", milestone);
    show("hero-milestone", true);
  }
  text("event-kind", milestone ? "¡Es una sorpresa!" : eventKind(data.eventType));
  var displayEventTitle = clean(data.eventTitle);
  if (selectedTemplateId() === "cumpleanos-50-sorpresa") {
    displayEventTitle = "Aniversario";
  } else if (milestone) {
    displayEventTitle = displayEventTitle.replace(/(?:^|\s)50(?:\s|$)/, " ").trim() || "Aniversario";
  }
  text("event-title", displayEventTitle);
  text("celebrant-name", data.celebrantName);
  text("section-mark", clean(data.celebrantName).charAt(0).toUpperCase());
  if (!milestone || !renderMilestoneDate(data.eventDate, data.eventTime)) {
    text("event-date", formatDate(data.eventDate) + (data.eventTime ? " · " + formatTime(data.eventTime) : ""));
  }
  text("welcome-text", data.quote);
  text("thank-you-title", data.thankYouTitle);
  if (clean(data.thankYouMessage)) {
    text("thank-you-message", data.thankYouMessage);
    show("thank-you-message", true);
  }
  text("thank-you-signature", data.thankYouSignature);
  text("hashtag", data.instagramHashtag);

  var selectedHeroBackground = clean(data.sectionBackgrounds && data.sectionBackgrounds.hero);
  var heroImage = selectedHeroBackground || data.mainPhotoUrl;
  if (heroImage) {
    var hero = document.getElementById("hero-photo");
    hero.style.backgroundImage = 'url("' + heroImage.replace(/"/g, "") + '")';
    hero.dataset.invittaPersonalized = "true";
    if (selectedHeroBackground) hero.dataset.invittaSectionBackground = selectedHeroBackground;
  }
  if (data.giftTableUrl) {
    document.getElementById("gift-link").href = data.giftTableUrl;
    show("registry", true);
  }
  renderPeople();
  renderLocations();
  renderItinerary();
  renderGallery();
  renderGuest();
  renderMusic();
  renderStudioCta();
  installInternalNavigation();
  installParallax();
})();
