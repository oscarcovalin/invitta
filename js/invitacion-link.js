document.addEventListener("DOMContentLoaded", () => {
  try {
    initLinkBuilder();
  } catch (error) {
    console.error("Link builder init error:", error);
    showFatalError("No se pudo cargar el generador. Revisa la configuración.");
  }
});

function showFatalError(message) {
  const errorBox = document.getElementById("linkBuilderError");
  const statusState = document.getElementById("statusState");

  if (statusState) statusState.style.display = "none";
  hideBuilderForm();
  hidePinGate();

  if (errorBox) {
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
  }
}

function showPinGate() {
  document.getElementById("linkBuilderPinGate")?.classList.remove("hidden");
  document.getElementById("linkBuilderForm")?.classList.add("hidden");
}

function showBuilderForm() {
  document.getElementById("linkBuilderPinGate")?.classList.add("hidden");
  document.getElementById("linkBuilderForm")?.classList.remove("hidden");
}

function hideBuilderForm() {
  document.getElementById("linkBuilderForm")?.classList.add("hidden");
}

function hidePinGate() {
  document.getElementById("linkBuilderPinGate")?.classList.add("hidden");
}

function normalizePin(value) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .trim();
}

function getSupabaseClient() {
  if (window.supabaseClient) return window.supabaseClient;
  if (window.invittaSupabase) return window.invittaSupabase;
  if (window.sbClient) return window.sbClient;

  const env = window.INVITTIA_ENV || window.ENV || window.APP_CONFIG || window.__ENV__ || window.env || {};

  const url =
    window.SUPABASE_URL ||
    window.supabaseUrl ||
    window.INVITTA_SUPABASE_URL ||
    env.SUPABASE_URL ||
    env.supabaseUrl ||
    env.supabase_url;

  const key =
    window.SUPABASE_ANON_KEY ||
    window.supabaseAnonKey ||
    window.INVITTA_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.supabaseAnonKey ||
    env.supabase_anon_key;

  console.log("Link builder Supabase debug:", {
    hasSupabaseCdn: Boolean(window.supabase),
    hasUrl: Boolean(url),
    hasKey: Boolean(key),
    env
  });

  if (!window.supabase || !url || !key) {
    return null;
  }

  const client = window.supabase.createClient(url, key);
  window.linkBuilderSupabaseClient = client;
  return client;
}

async function initLinkBuilder() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (params.get("resetPin") === "1") {
    sessionStorage.removeItem(`linkBuilderUnlocked:${slug}`);
  }

  const generateLinkButton = document.getElementById("generateLinkButton");
  const copyLinkButton = document.getElementById("copyLinkButton");
  const openInvitationButton = document.getElementById("openInvitationButton");
  const sendWhatsappButton = document.getElementById("sendWhatsappButton");
  const generatedLinkOutput = document.getElementById("generatedLinkOutput");
  
  const disabledState = document.getElementById("disabledState");
  const statusState = document.getElementById("statusState");
  const dynamicTitle = document.getElementById("dynamicTitle");
  const dynamicMessage = document.getElementById("dynamicMessage");
  
  const linkBuilderPinInput = document.getElementById("linkBuilderPinInput");
  const linkBuilderPinError = document.getElementById("linkBuilderPinError");
  const unlockLinkBuilderButton = document.getElementById("unlockLinkBuilderButton");

  let generatedInvitationLink = "";
  let lastGeneratedPassData = null;
  let invitationConfig = null;

  if (!slug) {
    showFatalError("No se encontró el slug de la invitación.");
    return;
  }

  hideBuilderForm();
  hidePinGate();

  const supabase = getSupabaseClient();

  if (!supabase) {
    console.error("Link builder: Supabase client unavailable.");
    showFatalError("No se pudo cargar la configuración de acceso.");
    return;
  }

  function unlockLinkBuilder() {
    const input = document.getElementById("linkBuilderPinInput");
    const errorBox = document.getElementById("linkBuilderPinError");

    const typedPin = normalizePin(input?.value);
    const realPin = normalizePin(invitationConfig?.link_builder_pin);

    console.log("PIN validation debug:", {
      typedPin,
      realPin,
      typedLength: typedPin.length,
      realLength: realPin.length,
      isMatch: typedPin === realPin,
      invitationConfig
    });

    if (!realPin) {
      if (errorBox) {
        errorBox.textContent = "No hay PIN configurado para esta invitación.";
        errorBox.classList.remove("hidden");
      }
      return;
    }

    if (!typedPin) {
      if (errorBox) {
        errorBox.textContent = "Ingresa el PIN.";
        errorBox.classList.remove("hidden");
      }
      input?.focus();
      return;
    }

    if (typedPin !== realPin) {
      if (errorBox) {
        errorBox.textContent = "PIN incorrecto.";
        errorBox.classList.remove("hidden");
      }
      input?.focus();
      input?.select();
      return;
    }

    sessionStorage.setItem(`linkBuilderUnlocked:${slug}`, "true");

    if (errorBox) {
      errorBox.textContent = "";
      errorBox.classList.add("hidden");
    }

    showBuilderForm();
  }

  unlockLinkBuilderButton?.addEventListener("click", (event) => {
    event.preventDefault();
    unlockLinkBuilder();
  });

  linkBuilderPinInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      unlockLinkBuilder();
    }
  });

  try {
    const { data, error } = await supabase
      .from("studio_invitations")
      .select(`
        slug,
        link_builder_enabled,
        link_builder_pin,
        link_builder_title,
        link_builder_message
      `)
      .eq("slug", slug)
      .maybeSingle();

    console.log("Link builder config result:", { data, error });

    if (error) {
      console.error("Link builder config query error:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Invitation config not found");
    }

    invitationConfig = data;
    console.log("Loaded invitationConfig:", invitationConfig);
    console.log("Real PIN loaded:", invitationConfig.link_builder_pin);

    if (invitationConfig.link_builder_enabled === false) {
      disabledState.classList.remove("hidden");
      if (statusState) statusState.style.display = "none";
      return;
    }

    if (statusState) statusState.style.display = "none";
    
    dynamicTitle.textContent = invitationConfig.link_builder_title || "Generador de pase";
    dynamicMessage.textContent = invitationConfig.link_builder_message || "Crea un pase rápido para invitados de último momento.";

    const pin = String(invitationConfig.link_builder_pin || "").trim();
    
    if (sessionStorage.getItem(`linkBuilderUnlocked:${slug}`) === "true") {
      showBuilderForm();
      return;
    }

    if (pin) {
      showPinGate();
      return;
    }

    showBuilderForm();

    } catch (err) {
      console.error("Error al cargar la configuración:", err);
      showFatalError("Error de conexión al cargar la configuración.");
    }

  function buildInvitationLink() {
    const name = document.getElementById("guestName")?.value.trim();
    const passes = document.getElementById("guestPasses")?.value.trim();
    const table = document.getElementById("guestTable")?.value.trim();

    const params = new URLSearchParams();
    params.set("slug", slug);

    if (name) params.set("n", name);
    if (passes) params.set("p", passes);
    if (table) params.set("m", table);

    return `${window.location.origin}/invitacion.html?${params.toString()}`;
  }

  function normalizePhone(value) {
    return String(value || "").replace(/[^\d]/g, "");
  }

  function renderGeneratedQr(link) {
    const qrContainer = document.getElementById("generatedPassQr");

    if (!qrContainer) return;

    qrContainer.innerHTML = "";

    if (!window.QRCode) {
      qrContainer.textContent = "No se pudo generar el QR.";
      console.error("QRCode library not loaded.");
      return;
    }

    new QRCode(qrContainer, {
      text: link,
      width: 156,
      height: 156,
      colorDark: "#2f2520",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  function renderGeneratedPass({ name, passes, table, link }) {
    const card = document.getElementById("generatedPassCard");
    const nameEl = document.getElementById("generatedPassName");
    const passesEl = document.getElementById("generatedPassCount");
    const tableEl = document.getElementById("generatedPassTable");

    if (nameEl) nameEl.textContent = name || "Invitado";
    if (passesEl) passesEl.textContent = passes || "-";
    if (tableEl) tableEl.textContent = table || "-";

    renderGeneratedQr(link);

    card?.classList.remove("hidden");
  }

  function showGeneratedActions() {
    document.getElementById("generatedPassActions")?.classList.remove("hidden");

    ["copyLinkButton", "openInvitationButton", "downloadPassButton", "sendWhatsappButton"]
      .forEach((id) => {
        const button = document.getElementById(id);
        button?.removeAttribute("disabled");
        if (id === "sendWhatsappButton") {
           const whatsapp = document.getElementById("guestWhatsapp")?.value.trim();
           if (normalizePhone(whatsapp)) {
             button?.classList.remove("hidden");
             button.style.display = "inline-block";
           } else {
             button?.classList.add("hidden");
             button.style.display = "none";
           }
        } else {
          button?.classList.remove("hidden");
          if (button) button.style.display = "inline-block";
        }
      });
  }

  function generateEmergencyPass(event) {
    if (event) {
      event.preventDefault();
    }

    console.log("Generating emergency pass...");

    const nameInput = document.getElementById("guestName");
    const passesInput = document.getElementById("guestPasses");
    const tableInput = document.getElementById("guestTable");
    const output = document.getElementById("generatedLinkOutput");

    const name = nameInput?.value.trim();
    const passes = passesInput?.value.trim();
    const table = tableInput?.value.trim();

    if (!name) {
      alert("Ingresa el nombre o familia del invitado.");
      nameInput?.focus();
      return;
    }

    generatedInvitationLink = buildInvitationLink();

    lastGeneratedPassData = {
      name,
      passes,
      table,
      link: generatedInvitationLink
    };

    if (output) {
      output.textContent = generatedInvitationLink;
      output.style.display = "block";
      output.classList.remove("hidden");
    }

    renderGeneratedPass(lastGeneratedPassData);
    showGeneratedActions();

    console.log("Emergency pass generated:", lastGeneratedPassData);
  }

  async function downloadGeneratedPass() {
    const card = document.getElementById("generatedPassCard");

    if (!card || card.classList.contains("hidden")) {
      alert("Primero genera un pase.");
      return;
    }

    if (!window.html2canvas) {
      alert("No se pudo cargar la herramienta de descarga.");
      return;
    }

    const canvas = await html2canvas(card, {
      scale: 2,
      backgroundColor: null,
      useCORS: true
    });

    const safeName = String(lastGeneratedPassData?.name || "pase-emergencia")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

    const downloadLink = document.createElement("a");
    downloadLink.download = `${safeName || "pase-emergencia"}.png`;
    downloadLink.href = canvas.toDataURL("image/png");
    downloadLink.click();
  }

  async function copyGeneratedLink() {
    if (!generatedInvitationLink) {
      alert("Primero genera un pase.");
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedInvitationLink);
      alert("Enlace copiado.");
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = generatedInvitationLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      alert("Enlace copiado.");
    }
  }

  function openGeneratedInvitation() {
    if (!generatedInvitationLink) {
      alert("Primero genera un pase.");
      return;
    }

    const separator = generatedInvitationLink.includes("?") ? "&" : "?";
    window.open(`${generatedInvitationLink}${separator}v=preview-${Date.now()}`, "_blank", "noopener,noreferrer");
  }

  function sendGeneratedPassWhatsapp() {
    if (!generatedInvitationLink || !lastGeneratedPassData) {
      alert("Primero genera un pase.");
      return;
    }

    const phone = normalizePhone(document.getElementById("guestWhatsapp")?.value);

    if (!phone) {
      alert("Agrega un WhatsApp para enviar el pase.");
      return;
    }

    const { name, passes, table } = lastGeneratedPassData;

    const message = [
      "Hola, te compartimos tu pase personalizado para el evento:",
      "",
      `Nombre: ${name || "-"}`,
      `Pases: ${passes || "-"}`,
      `Mesa: ${table || "-"}`,
      "",
      generatedInvitationLink
    ].join("\n");

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  document.getElementById("generateLinkButton")
    ?.addEventListener("click", generateEmergencyPass);

  document.getElementById("copyLinkButton")
    ?.addEventListener("click", copyGeneratedLink);

  document.getElementById("openInvitationButton")
    ?.addEventListener("click", openGeneratedInvitation);

  document.getElementById("downloadPassButton")
    ?.addEventListener("click", downloadGeneratedPass);

  document.getElementById("sendWhatsappButton")
    ?.addEventListener("click", sendGeneratedPassWhatsapp);
}
