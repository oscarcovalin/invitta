/**
 * invitation-public.js
 * Invitta Studio — Página pública de invitación
 *
 * URL esperada: /invitacion.html?slug=paola-xv&n=Familia+Garcia&p=4&m=5
 * Tabla:        studio_invitations (SELECT anon, published = true)
 *
 * Solo lectura. No modifica tablas. No requiere autenticación.
 */

(function () {
  "use strict";

  /* ─── Supabase client ─────────────────────────────────────────────── */
  const SUPABASE_URL = window.INVITTIA_ENV?.SUPABASE_URL   || "";
  const SUPABASE_KEY = window.INVITTIA_ENV?.SUPABASE_ANON_KEY || "";

  let db;
  try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    showError("No se pudo inicializar la conexión. Recarga la página.");
    return;
  }

  /* ─── Parámetros de URL ───────────────────────────────────────────── */
  const params   = new URLSearchParams(window.location.search);
  const slug      = params.get("slug") || "";
  const guestName = sanitize(params.get("n") || "");
  const maxPasses = clampInt(params.get("p"), 1, 20);
  const tableNum  = sanitize(params.get("m") || "");

  /* ─── Arranque ────────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function () {
    if (!slug) {
      showError("No se encontró el identificador de la invitación.");
      return;
    }
    loadInvitation();
  });

  /* ─── Carga ───────────────────────────────────────────────────────── */
  async function loadInvitation() {
    const { data, error } = await db
      .from("studio_invitations")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    console.log("slug recibido:", slug);
    console.log("data invitación:", data);
    console.log("error Supabase:", error);

    if (error) {
      showError("Error al cargar la invitación: " + error.message);
      return;
    }

    if (!data) {
      showError("Invitación no encontrada o no publicada.");
      return;
    }

    renderInvitation(data);
  }

  /* ─── Renderizado ─────────────────────────────────────────────────── */
  function renderInvitation(inv) {
    /* 1. Ocultar loader y error; mostrar contenido */
    el("inv-loader").style.display  = "none";
    el("inv-error").style.display   = "none";
    el("inv-error").textContent     = "";
    el("inv-content").style.display = "block";

    /* 2. Tema de color */
    applyTheme(inv.color_primary || "#C9A46A", inv.color_secondary || "#F7E7D7");

    /* 3. Encabezado */
    setText("inv-title",   inv.title        || "Invitación");
    setText("inv-honoree", inv.honoree_name || "");
    setText("inv-welcome", inv.welcome_text || "");
    toggle("inv-welcome-block", !!inv.welcome_text);

    /* 4. Fecha y hora */
    setText("inv-date", formatDate(inv.event_date));
    const timeStr = formatTime(inv.event_time);
    setText("inv-time", timeStr);
    toggle("inv-time-block", !!timeStr);

    /* 5. Datos del invitado */
    setText("inv-guest-name", guestName || "Invitado");
    setText("inv-pases",      String(maxPasses));
    setText("inv-mesa",       tableNum  || "—");
    toggle("inv-mesa-block",  !!tableNum);

    /* 6. Selector de confirmación */
    buildPassSelector(maxPasses);

    /* 7. Ceremonia */
    const hasCeremony = !!(inv.ceremony_name || inv.ceremony_address);
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

    /* 8. Recepción */
    const hasReception = !!(inv.reception_name || inv.reception_address);
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

    /* 9. Dress code */
    toggle("inv-dresscode-block", !!inv.dress_code);
    setText("inv-dresscode", inv.dress_code || "");

    /* 10. Mesa de regalos */
    toggle("inv-gifts-block", !!inv.gift_table_url);
    if (inv.gift_table_url) {
      setHref("inv-gifts-link", inv.gift_table_url);
    }

    /* 11. WhatsApp */
    buildWhatsAppButton(inv);

    /* 12. Título de pestaña */
    document.title = (inv.title || "Invitación Digital") + " · Invitta";
  }

  /* ─── Selector de pases ───────────────────────────────────────────── */
  function buildPassSelector(max) {
    const sel = el("inv-confirm-pases");
    if (!sel) return;
    sel.innerHTML = "";
    for (let i = 1; i <= max; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i === 1 ? "1 persona" : i + " personas";
      sel.appendChild(opt);
    }
  }

  /* ─── Botón WhatsApp ──────────────────────────────────────────────── */
  function buildWhatsAppButton(inv) {
    const phone = (inv.whatsapp_number || "").replace(/\D/g, "");
    if (!phone) {
      hide("inv-wa-block");
      return;
    }
    show("inv-wa-block");

    const btn = el("inv-wa-btn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      const selected = el("inv-confirm-pases")?.value || maxPasses;
      const title    = inv.title || "el evento";
      const mesa     = tableNum ? "\nMesa: " + tableNum : "";

      const msg =
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

  /* ─── Tema de colores ─────────────────────────────────────────────── */
  function applyTheme(primary, secondary) {
    const root = document.documentElement;
    root.style.setProperty("--inv-primary",        primary);
    root.style.setProperty("--inv-primary-light",  hexAlpha(primary, 0.12));
    root.style.setProperty("--inv-primary-border", hexAlpha(primary, 0.35));
    root.style.setProperty("--inv-secondary",      secondary);
  }

  /* ─── showError ───────────────────────────────────────────────────── */
  function showError(msg) {
    const loader  = el("inv-loader");
    const content = el("inv-content");
    const errBox  = el("inv-error");

    if (loader)  loader.style.display  = "none";
    if (content) content.style.display = "none";
    if (errBox) {
      errBox.textContent     = msg;
      errBox.style.display   = "block";
    }
  }

  /* ─── Helpers DOM ─────────────────────────────────────────────────── */
  function el(id)            { return document.getElementById(id); }
  function setText(id, val)  { const e = el(id); if (e) e.textContent = String(val); }
  function setHref(id, href) { const e = el(id); if (e) e.href = href; }
  function show(id)          { const e = el(id); if (e) e.style.display = ""; }
  function hide(id)          { const e = el(id); if (e) e.style.display = "none"; }
  function toggle(id, show_) { show_ ? show(id) : hide(id); }

  /* ─── Helpers texto / números ─────────────────────────────────────── */
  function sanitize(str) {
    return String(str || "").trim().slice(0, 200);
  }

  function clampInt(val, min, max) {
    const n = parseInt(val, 10);
    return isNaN(n) ? min : Math.min(Math.max(n, min), max);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("es-MX", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    } catch { return dateStr; }
  }

  function formatTime(timeStr) {
    if (!timeStr) return "";
    try {
      const [h, m] = timeStr.split(":");
      const d = new Date();
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
      return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    } catch { return timeStr; }
  }

  /* ─── Color helper ────────────────────────────────────────────────── */
  function hexAlpha(hex, a) {
    const r = parseInt((hex || "#000000").slice(1, 3), 16) || 0;
    const g = parseInt((hex || "#000000").slice(3, 5), 16) || 0;
    const b = parseInt((hex || "#000000").slice(5, 7), 16) || 0;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

})();
