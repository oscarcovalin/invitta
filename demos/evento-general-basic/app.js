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

  function eventKind(type) {
    return ({
      cumpleanos: "Una vuelta más al sol",
      bautizo: "Un día lleno de luz",
      otro: "Una fecha para celebrar"
    })[type] || "Una fecha para celebrar";
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
      [formatTime(entry.value.time), entry.value.address].filter(Boolean).forEach(function (value) {
        var line = document.createElement("p");
        line.textContent = value;
        card.appendChild(line);
      });
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
    items.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "timeline__item";
      var time = document.createElement("time");
      time.textContent = formatTime(item.time);
      var title = document.createElement("span");
      title.textContent = item.title || "Actividad";
      row.append(time, title);
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

  text("event-kind", eventKind(data.eventType));
  text("event-title", data.eventTitle);
  text("celebrant-name", data.celebrantName);
  text("event-date", formatDate(data.eventDate) + (data.eventTime ? " · " + formatTime(data.eventTime) : ""));
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
})();
