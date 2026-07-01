/**
 * invitation-public.js
 * Invitta Studio — Página pública de invitación
 *
 * Lee: ?slug=paola-xv&n=Familia+Garcia&p=4&m=5
 * Consulta: studio_invitations WHERE slug = :slug AND published = true
 * Renderiza la invitación con datos del evento y del invitado.
 *
 * NO modifica tablas. NO guarda datos. Solo lectura.
 */

(function () {
  "use strict";

  /* ─── Supabase ────────────────────────────────────────────────────── */
  const SUPABASE_URL   = window.INVITTIA_ENV?.SUPABASE_URL   || "";
  const SUPABASE_KEY   = window.INVITTIA_ENV?.SUPABASE_ANON_KEY || "";

  let db;
  try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    showError("No se pudo inicializar la conexión a la base de datos.");
    return;
  }

  /* ─── Parámetros de URL ───────────────────────────────────────────── */
  const params = new URLSearchParams(window.location.search);

  const slug  = params.get("slug") || "";
  const guest = sanitizeText(params.get("n") || "");
  const pases = clampInt(params.get("p"), 1, 20);
  const mesa  = sanitizeText(params.get("m") || "");

  console.log("slug recibido:", slug);

  /* ─── Arranque ────────────────────────────────────────────────────── */
  if (!slug) {
    showError("No se proporcionó un identificador de invitación (slug).");
    return;
  }

  init();

  /* ─── Flujo principal ─────────────────────────────────────────────── */
  async function init() {
    try {
      const inv = await fetchInvitation(slug);
      renderInvitation(inv);
    } catch (err) {
      showError(err.message || "No se pudo cargar la invitación.");
    }
  }

  async function fetchInvitation(slug) {
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
      throw new Error("Error al consultar Supabase: " + error.message);
    }
    if (!data) {
      throw new Error("Invitación no encontrada o no publicada.");
    }
    return data;
  }

  /* ─── Renderizado ─────────────────────────────────────────────────── */
  function renderInvitation(inv) {
    /* Colores dinámicos */
    applyTheme(inv.color_primary || "#C9A46A", inv.color_secondary || "#F7E7D7");

    /* Ocultar loader */
    hide("inv-loader");
    show("inv-content");

    /* ── Encabezado ── */
    setText("inv-title",       inv.title        || "");
    setText("inv-honoree",     inv.honoree_name || "");
    setText("inv-welcome",     inv.welcome_text || "");

    conditionalBlock("inv-welcome-block", !!inv.welcome_text);

    /* ── Fecha y hora ── */
    const dateStr = formatDate(inv.event_date);
    const timeStr = inv.event_time ? formatTime(inv.event_time) : "";
    setText("inv-date",  dateStr);
    setText("inv-time",  timeStr);
    conditionalBlock("inv-time-block", !!timeStr);

    /* ── Datos del invitado ── */
    setText("inv-guest-name", guest  || "Invitado");
    setText("inv-pases",      pases);
    setText("inv-mesa",       mesa   || "—");
    conditionalBlock("inv-mesa-block", !!mesa);

    /* ── Selector de confirmación ── */
    buildPasesSelector(pases);

    /* ── Ceremonia ── */
    const hasCeremony = inv.ceremony_name || inv.ceremony_address;
    conditionalBlock("inv-ceremony-block", !!hasCeremony);
    if (hasCeremony) {
      setText("inv-ceremony-name",    inv.ceremony_name    || "Ceremonia");
      setText("inv-ceremony-address", inv.ceremony_address || "");
      const mapUrl = inv.ceremony_map_url || "";
      if (mapUrl) {
        setAttr("inv-ceremony-map", "href", mapUrl);
        show("inv-ceremony-map-btn");
      } else {
        hide("inv-ceremony-map-btn");
      }
    }

    /* ── Recepción ── */
    const hasReception = inv.reception_name || inv.reception_address;
    conditionalBlock("inv-reception-block", !!hasReception);
    if (hasReception) {
      setText("inv-reception-name",    inv.reception_name    || "Recepción");
      setText("inv-reception-address", inv.reception_address || "");
      const mapUrl2 = inv.reception_map_url || "";
      if (mapUrl2) {
        setAttr("inv-reception-map", "href", mapUrl2);
        show("inv-reception-map-btn");
      } else {
        hide("inv-reception-map-btn");
      }
    }

    /* ── Mesa de regalos ── */
    conditionalBlock("inv-gifts-block", !!inv.gift_table_url);
    if (inv.gift_table_url) {
      setAttr("inv-gifts-link", "href", inv.gift_table_url);
    }

    /* ── Dress code ── */
    conditionalBlock("inv-dresscode-block", !!inv.dress_code);
    setText("inv-dresscode", inv.dress_code || "");

    /* ── Botón WhatsApp ── */
    buildWhatsAppButton(inv);

    /* ── Título de pestaña y meta ── */
    document.title = inv.title || "Invitación Digital · Invitta";
  }

  /* ─── Selector de pases ───────────────────────────────────────────── */
  function buildPasesSelector(max) {
    const sel = document.getElementById("inv-confirm-pases");
    if (!sel) return;
    sel.innerHTML = "";
    for (let i = 1; i <= max; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i === 1 ? "1 persona" : `${i} personas`;
      sel.appendChild(opt);
    }
  }

  /* ─── WhatsApp ────────────────────────────────────────────────────── */
  function buildWhatsAppButton(inv) {
    const btn = document.getElementById("inv-wa-btn");
    if (!btn) return;

    const phone = (inv.whatsapp_number || "").replace(/\D/g, "");
    if (!phone) {
      hide("inv-wa-block");
      return;
    }

    btn.addEventListener("click", function () {
      const selectedPases = document.getElementById("inv-confirm-pases")?.value || pases;
      const title   = inv.title       || "el evento";
      const gName   = guest           || "Invitado";
      const mesaStr = mesa ? `\nMesa: ${mesa}` : "";

      const msg =
        `Hola, confirmo mi asistencia al evento ${title}.\n\n` +
        `Invitado: ${gName}\n` +
        `Pases confirmados: ${selectedPases}\n` +
        `Pases asignados: ${pases}` +
        `${mesaStr}`;

      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    });
  }

  /* ─── Tema de colores ─────────────────────────────────────────────── */
  function applyTheme(primary, secondary) {
    const root = document.documentElement;
    root.style.setProperty("--inv-primary",         primary);
    root.style.setProperty("--inv-primary-light",   hexToRgba(primary, 0.12));
    root.style.setProperty("--inv-primary-border",  hexToRgba(primary, 0.35));
    root.style.setProperty("--inv-secondary",       secondary);
  }

  /* ─── Helpers DOM ─────────────────────────────────────────────────── */
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function setAttr(id, attr, value) {
    const el = document.getElementById(id);
    if (el) el.setAttribute(attr, value);
  }

  function show(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "";
  }

  function hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  }

  function conditionalBlock(id, condition) {
    condition ? show(id) : hide(id);
  }

  /* ─── Helpers de texto ────────────────────────────────────────────── */
  /* sanitizeText: seguro para usar con textContent (no necesita escape HTML) */
  function sanitizeText(str) {
    return String(str || "").trim().slice(0, 200);
  }

  function clampInt(val, min, max) {
    const n = parseInt(val, 10);
    if (isNaN(n)) return min;
    return Math.min(Math.max(n, min), max);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch { return dateStr; }
  }

  function formatTime(timeStr) {
    if (!timeStr) return "";
    // timeStr puede venir como "18:00:00" o "18:00"
    try {
      const [h, m] = timeStr.split(":");
      const d = new Date();
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
      return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    } catch { return timeStr; }
  }

  /* ─── Color helpers ───────────────────────────────────────────────── */
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /* ─── Error global ────────────────────────────────────────────────── */
  function showError(msg) {
    hide("inv-loader");
    hide("inv-content");
    const el = document.getElementById("inv-error");
    if (el) {
      el.textContent = msg;
      show("inv-error");
    }
  }

})();
