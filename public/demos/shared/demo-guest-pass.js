(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var renderAttempts = 0;
  var observer = null;

  function clean(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function firstParam(keys) {
    for (var index = 0; index < keys.length; index += 1) {
      var value = clean(params.get(keys[index]));
      if (value) return value;
    }
    return "";
  }

  function clampPasses(value) {
    var parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return 4;
    return Math.min(20, Math.max(1, parsed));
  }

  function guestData() {
    var invitation = window.INVITATION_DATA || {};
    return {
      name: clean(invitation.guestName) || firstParam(["n", "nombre"]) || "Familia García",
      passes: clampPasses(invitation.passes || firstParam(["p", "pases"])),
      table: clean(String(invitation.table || "")) || firstParam(["m", "mesa"]) || "5",
      token: clean(invitation.guestToken),
      qrEnabled: invitation.qrAccessEnabled === true,
      isStudioInvitation: Boolean(invitation.invitationSlug || invitation.studioInvitationId)
    };
  }

  function isVipDemo() {
    return /(?:xv-vip-3|boda-premium-1)/i.test(window.location.pathname);
  }

  function findRsvpSection() {
    var direct = document.querySelector(
      "section#rsvp, section[id*='rsvp' i], section[id*='confirm' i], " +
      "[data-section='rsvp'], [data-section='confirmation']"
    );
    if (direct) return direct;

    var action = Array.from(document.querySelectorAll("a, button")).find(function (element) {
      return /CONFIRMAR|ASISTENCIA|WHATSAPP|RSVP/i.test(element.textContent || "") &&
        element.closest("section");
    });
    return action ? action.closest("section") : null;
  }

  function ensureStyles() {
    if (document.getElementById("invitta-demo-guest-pass-styles")) return;

    var style = document.createElement("style");
    style.id = "invitta-demo-guest-pass-styles";
    style.textContent = [
      ".invitta-demo-pass{width:min(92%,640px);margin:clamp(48px,8vw,88px) auto;padding:0 20px;box-sizing:border-box;text-align:center}",
      ".invitta-demo-pass-card{position:relative;overflow:hidden;padding:clamp(36px,7vw,58px) clamp(24px,6vw,48px);border:1px solid color-mix(in srgb,var(--invitta-accent,var(--color-sage,#a78168)) 34%,transparent);background:var(--invitta-card,var(--color-paper,#fffdf9));box-shadow:0 22px 60px rgba(43,34,29,.09);color:var(--invitta-title,var(--color-ink,#2d2723))}",
      ".invitta-demo-pass-card:before{content:'';position:absolute;inset:12px;border:1px solid color-mix(in srgb,var(--invitta-accent,var(--color-sage,#a78168)) 16%,transparent);pointer-events:none}",
      ".invitta-demo-pass-kicker{margin:0 0 13px;font:600 10px/1.3 var(--font-sans,var(--font-secondary),Arial,sans-serif);letter-spacing:.28em;text-transform:uppercase;color:var(--invitta-accent,var(--color-sage,#9b7653))}",
      ".invitta-demo-pass-title{margin:0;font:400 clamp(30px,7vw,48px)/1.04 var(--font-display,var(--font-primary),Georgia,serif);color:var(--invitta-title,var(--color-ink,#2d2723))}",
      ".invitta-demo-pass-name{margin:20px auto 0;max-width:480px;font:400 clamp(22px,5.5vw,34px)/1.18 var(--font-display,var(--font-primary),Georgia,serif);text-wrap:balance;color:var(--invitta-title,var(--color-ink,#2d2723))}",
      ".invitta-demo-pass-divider{display:flex;align-items:center;justify-content:center;gap:12px;margin:24px auto;width:min(220px,70%);color:var(--invitta-accent,var(--color-sage,#9b7653))}",
      ".invitta-demo-pass-divider:before,.invitta-demo-pass-divider:after{content:'';height:1px;flex:1;background:currentColor;opacity:.35}",
      ".invitta-demo-pass-divider span{width:6px;height:6px;border:1px solid currentColor;transform:rotate(45deg)}",
      ".invitta-demo-pass-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:360px;margin:0 auto}",
      ".invitta-demo-pass-meta div{padding:14px 10px;border-top:1px solid color-mix(in srgb,var(--invitta-accent,var(--color-sage,#a78168)) 24%,transparent)}",
      ".invitta-demo-pass-label{display:block;margin:0 0 6px;font:600 9px/1.2 var(--font-sans,var(--font-secondary),Arial,sans-serif);letter-spacing:.2em;text-transform:uppercase;color:var(--invitta-accent,var(--color-sage,#9b7653))}",
      ".invitta-demo-pass-value{display:block;font:400 18px/1.3 var(--font-display,var(--font-primary),Georgia,serif);color:var(--invitta-title,var(--color-ink,#2d2723))}",
      ".invitta-demo-pass-note{margin:22px auto 0;max-width:380px;font:400 11px/1.65 var(--font-sans,var(--font-secondary),Arial,sans-serif);letter-spacing:.04em;color:var(--invitta-body,var(--color-on-surface-variant,#766b64))}",
      "html[data-invitta-demo-pass-dark] .invitta-demo-pass-card{background:#171315;border-color:rgba(213,176,82,.38);box-shadow:0 26px 68px rgba(0,0,0,.3)}",
      "html[data-invitta-demo-pass-dark] .invitta-demo-pass-title,html[data-invitta-demo-pass-dark] .invitta-demo-pass-name,html[data-invitta-demo-pass-dark] .invitta-demo-pass-value{color:#f8f0e4}",
      "html[data-invitta-demo-pass-dark] .invitta-demo-pass-note{color:#c9beb2}",
      "@media(max-width:640px){.invitta-demo-pass{width:100%;margin:48px auto;padding:0 16px}.invitta-demo-pass-card{padding:38px 22px}.invitta-demo-pass-meta{gap:8px}.invitta-demo-pass-name{font-size:clamp(22px,7vw,30px)}}"
    ].join("");
    document.head.appendChild(style);
  }

  function insertSection(section, anchor) {
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(section, anchor);
      return;
    }

    var footer = document.querySelector("footer");
    var parent = footer && footer.parentNode ? footer.parentNode : document.body;
    parent.insertBefore(section, footer || null);
  }

  function buildPass(data) {
    var section = document.createElement("section");
    section.className = "invitta-demo-pass";
    section.dataset.invittaDemoPass = "true";
    section.setAttribute("aria-label", "Pase personalizado");
    section.innerHTML = [
      '<div class="invitta-demo-pass-card">',
      '<p class="invitta-demo-pass-kicker">Invitación personal</p>',
      '<h2 class="invitta-demo-pass-title">Pase personalizado</h2>',
      '<p class="invitta-demo-pass-name"></p>',
      '<div class="invitta-demo-pass-divider" aria-hidden="true"><span></span></div>',
      '<div class="invitta-demo-pass-meta">',
      '<div><span class="invitta-demo-pass-label">Pases</span><strong class="invitta-demo-pass-value invitta-demo-pass-passes"></strong></div>',
      '<div><span class="invitta-demo-pass-label">Mesa</span><strong class="invitta-demo-pass-value invitta-demo-pass-table"></strong></div>',
      "</div>",
      '<p class="invitta-demo-pass-note">Este pase cambia automáticamente con los datos enviados en el enlace de cada invitado.</p>',
      "</div>"
    ].join("");

    section.querySelector(".invitta-demo-pass-name").textContent = data.name;
    section.querySelector(".invitta-demo-pass-passes").textContent = String(data.passes);
    section.querySelector(".invitta-demo-pass-table").textContent = data.table || "Por asignar";
    return section;
  }

  function limitRsvpOptions(data, anchor) {
    var scope = anchor || document;
    var selects = Array.from(scope.querySelectorAll("select")).filter(function (select) {
      var context = (select.name || "") + " " + (select.id || "") + " " +
        ((select.closest("label, form, fieldset, section") || {}).textContent || "");
      return /pase|persona|asistente|invitado|guest/i.test(context) ||
        Array.from(select.options).some(function (option) {
          return /^\s*\d+\s*(?:persona|pase|asistente)?s?\s*$/i.test(option.textContent || "");
        });
    });

    selects.forEach(function (select) {
      Array.from(select.options).forEach(function (option) {
        var match = String(option.value || option.textContent || "").match(/\d+/);
        if (match && Number(match[0]) > data.passes) option.remove();
      });

      if (Number.parseInt(select.value, 10) > data.passes) {
        select.value = String(data.passes);
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  function fillGuestInputs(data, anchor) {
    var scope = anchor || document;
    Array.from(scope.querySelectorAll("input")).forEach(function (input) {
      var context = [
        input.name,
        input.id,
        input.placeholder,
        input.getAttribute("aria-label")
      ].filter(Boolean).join(" ");
      if (!input.value && /nombre|familia|invitado|guest/i.test(context)) {
        input.value = data.name;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  function removeDuplicateLocationCalendarLinks() {
    Array.from(document.querySelectorAll('a[href*="calendar.google.com"]')).forEach(function (link) {
      var actions = link.parentElement;
      var insideEventDetails = Boolean(link.closest(
        '#details, #event-details, #locations, [data-event-details]'
      ));
      var nextToDirections = actions && /c[oó]mo llegar|ubicaci[oó]n|maps/i.test(
        actions.textContent || ""
      );

      if (insideEventDetails || nextToDirections) {
        link.remove();
      }
    });
  }

  function render() {
    if (!document.body) return false;

    removeDuplicateLocationCalendarLinks();

    var data = guestData();
    var anchor = findRsvpSection();
    if (!anchor && renderAttempts < 80) return false;

    // The public invitation has no guest identity. Rendering a placeholder
    // pass there suggests that a shared QR could grant admission. Only a
    // personalized URL containing the persisted guest token may show a pass.
    if (data.isStudioInvitation && !data.token) return true;

    limitRsvpOptions(data, anchor);
    fillGuestInputs(data, anchor);

    if (data.token && (data.qrEnabled || isVipDemo())) return true;
    if (document.querySelector("[data-invitta-demo-pass]")) return true;

    ensureStyles();
    if (isVipDemo()) document.documentElement.dataset.invittaDemoPassDark = "true";
    insertSection(buildPass(data), anchor);
    return true;
  }

  function scheduleRender() {
    window.requestAnimationFrame(function () {
      renderAttempts += 1;
      if (render() && observer) {
        observer.disconnect();
        observer = null;
      }
    });
  }

  observer = new MutationObserver(scheduleRender);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  var calendarCleanupObserver = new MutationObserver(removeDuplicateLocationCalendarLinks);
  calendarCleanupObserver.observe(document.documentElement, { childList: true, subtree: true });

  scheduleRender();
  window.addEventListener("load", scheduleRender);
  window.setTimeout(scheduleRender, 500);
  window.setTimeout(scheduleRender, 1500);
})();
