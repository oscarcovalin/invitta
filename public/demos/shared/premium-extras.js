(function () {
  "use strict";

  var data = window.INVITATION_DATA || {};
  var rendererId = String(data.rendererTemplateId || data.templateId || "").trim();
  if (rendererId !== "boda-golden-romance-premium") return;

  function clean(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function visibleSection(key) {
    return !data.sectionVisibility || data.sectionVisibility[key] !== false;
  }

  function safeExternalUrl(value) {
    var source = clean(value);
    if (!source) return "";
    try {
      var url = new URL(source, window.location.href);
      return /^(?:https?):$/.test(url.protocol) ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function element(tagName, className, text) {
    var node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildHeader(kicker, title, description) {
    var header = element("header", "invitta-extra__header");
    header.appendChild(element("span", "invitta-extra__kicker", kicker));
    header.appendChild(element("h2", "invitta-extra__title", title));
    if (description) header.appendChild(element("p", "invitta-extra__description", description));
    return header;
  }

  function albumPhotoCard(photo) {
    var figure = element("figure", "invitta-extra__photo");
    var imageUrl = safeExternalUrl(photo && (photo.src || photo.url));
    if (!imageUrl) return null;

    var image = element("img", "invitta-extra__photo-image");
    image.src = imageUrl;
    image.alt = "Fotografía compartida por " + (clean(photo.guestName) || "un invitado");
    image.loading = "lazy";
    figure.appendChild(image);

    var caption = element("figcaption", "invitta-extra__photo-caption");
    caption.appendChild(element("strong", "", clean(photo.guestName) || "Invitado"));
    var message = clean(photo.message);
    if (message) caption.appendChild(element("span", "", message));
    figure.appendChild(caption);
    return figure;
  }

  function renderAlbumPhotos(container, photos) {
    container.replaceChildren();
    var validPhotos = Array.isArray(photos) ? photos.map(albumPhotoCard).filter(Boolean) : [];
    if (!validPhotos.length) {
      container.appendChild(element("p", "invitta-extra__empty", "Aún no hay fotos compartidas."));
      return;
    }
    validPhotos.forEach(function (photo) { container.appendChild(photo); });
  }

  function buildAlbum() {
    if (data.sharedAlbumEnabled !== true || !visibleSection("album")) return null;
    if (document.getElementById("collaborative-album")) return null;

    var section = element("section", "invitta-premium-extra invitta-premium-extra--album");
    section.id = "collaborative-album";
    section.appendChild(buildHeader(
      "Recuerdos compartidos",
      "Álbum Colaborativo",
      "Comparte tus fotografías y conserva los mejores momentos de esta celebración."
    ));

    var layout = element("div", "invitta-extra__album-layout");
    var upload = element("div", "invitta-extra__panel");
    upload.appendChild(element("h3", "invitta-extra__subtitle", "Comparte desde tu pase"));

    var canUpload = Boolean(clean(data.invitationSlug) && clean(data.guestToken));
    upload.appendChild(element(
      "p",
      "invitta-extra__copy",
      canUpload
        ? "Elige una fotografía para publicarla en el álbum de los novios."
        : "Abre el enlace personalizado que recibiste como invitado para subir una fotografía."
    ));

    var gallery = element("div", "invitta-extra__photo-grid");
    gallery.setAttribute("aria-live", "polite");
    gallery.appendChild(element("p", "invitta-extra__empty", "Cargando recuerdos compartidos…"));

    if (canUpload) {
      var controls = element("div", "invitta-extra__controls");
      var fileLabel = element("label", "invitta-extra__field-label", "Fotografía");
      var file = element("input", "invitta-extra__file");
      file.type = "file";
      file.accept = "image/jpeg,image/png,image/webp";
      fileLabel.appendChild(file);

      var messageLabel = element("label", "invitta-extra__field-label", "Dedicatoria opcional");
      var message = element("input", "invitta-extra__input");
      message.type = "text";
      message.maxLength = 280;
      message.placeholder = "Escribe un mensaje para los novios";
      messageLabel.appendChild(message);

      var publish = element("button", "invitta-extra__button", "Publicar fotografía");
      publish.type = "button";
      publish.disabled = true;
      var status = element("p", "invitta-extra__status", "");
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");

      file.addEventListener("change", function () {
        publish.disabled = !(file.files && file.files[0]);
        status.textContent = "";
      });

      publish.addEventListener("click", async function () {
        var selected = file.files && file.files[0];
        if (!selected) return;
        publish.disabled = true;
        publish.textContent = "Publicando…";
        status.textContent = "";
        try {
          var fileBase64 = await new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () { resolve(String(reader.result || "")); };
            reader.onerror = function () { reject(new Error("No fue posible leer la fotografía.")); };
            reader.readAsDataURL(selected);
          });
          var response = await fetch("/api/shared-album", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: data.invitationSlug,
              guestToken: data.guestToken,
              guestName: clean(data.guestName) || "Invitado",
              message: clean(message.value),
              mimeType: selected.type,
              fileBase64: fileBase64
            })
          });
          var payload = await response.json();
          if (!response.ok) throw new Error(payload.error || "No fue posible publicar la fotografía.");
          var currentCards = Array.from(gallery.querySelectorAll(".invitta-extra__photo"));
          var card = albumPhotoCard(payload.photo || {});
          if (card) {
            if (!currentCards.length) gallery.replaceChildren();
            gallery.prepend(card);
          }
          file.value = "";
          message.value = "";
          status.textContent = "Fotografía publicada correctamente.";
        } catch (error) {
          status.textContent = error && error.message ? error.message : "No fue posible publicar la fotografía.";
        } finally {
          publish.textContent = "Publicar fotografía";
          publish.disabled = !(file.files && file.files[0]);
        }
      });

      controls.append(fileLabel, messageLabel, publish, status);
      upload.appendChild(controls);
    } else {
      var accessNote = element("div", "invitta-extra__access-note");
      accessNote.setAttribute("aria-label", "La invitación personalizada es el acceso al álbum");
      var camera = element("span", "invitta-extra__camera", "📷");
      camera.setAttribute("aria-hidden", "true");
      accessNote.appendChild(camera);
      accessNote.appendChild(element("strong", "", "Tu invitación es tu acceso"));
      upload.appendChild(accessNote);
    }

    layout.append(upload, gallery);
    section.appendChild(layout);

    var slug = clean(data.invitationSlug);
    if (slug) {
      fetch("/api/shared-album?slug=" + encodeURIComponent(slug))
        .then(function (response) { return response.ok ? response.json() : { photos: [] }; })
        .then(function (payload) { renderAlbumPhotos(gallery, payload.photos); })
        .catch(function () { renderAlbumPhotos(gallery, []); });
    } else {
      renderAlbumPhotos(gallery, []);
    }
    return section;
  }

  function buildLodging() {
    if (!visibleSection("lodging") || document.getElementById("lodging")) return null;
    var hotels = Array.isArray(data.lodgingOptions)
      ? data.lodgingOptions.filter(function (hotel) { return hotel && clean(hotel.name); })
      : [];
    if (!hotels.length) return null;

    var section = element("section", "invitta-premium-extra invitta-premium-extra--lodging");
    section.id = "lodging";
    section.appendChild(buildHeader("Hospedaje", "Sugerencias de Hospedaje", "Opciones recomendadas para disfrutar el evento con tranquilidad."));
    var grid = element("div", "invitta-extra__hotel-grid");

    hotels.forEach(function (hotel) {
      var card = element("article", "invitta-extra__hotel");
      card.appendChild(element("h3", "invitta-extra__subtitle", clean(hotel.name)));
      var address = clean(hotel.address);
      if (address) card.appendChild(element("p", "invitta-extra__hotel-detail", address));
      var phone = clean(hotel.phone);
      if (phone) {
        var phoneLink = element("a", "invitta-extra__hotel-link", phone);
        phoneLink.href = "tel:" + phone.replace(/[^0-9+]/g, "");
        card.appendChild(phoneLink);
      }
      var mapsUrl = safeExternalUrl(hotel.mapsUrl || hotel.mapUrl || hotel.map_url);
      if (mapsUrl) {
        var mapLink = element("a", "invitta-extra__hotel-link invitta-extra__hotel-link--map", "Cómo llegar ↗");
        mapLink.href = mapsUrl;
        mapLink.target = "_blank";
        mapLink.rel = "noopener noreferrer";
        card.appendChild(mapLink);
      }
      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  function mount() {
    var album = buildAlbum();
    var lodging = buildLodging();
    if (!album && !lodging) return;
    var footer = document.querySelector("footer");
    var parent = footer && footer.parentNode ? footer.parentNode : document.body;
    [album, lodging].filter(Boolean).forEach(function (section) {
      parent.insertBefore(section, footer || null);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
