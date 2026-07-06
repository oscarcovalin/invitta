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

  let currentGeneratedLink = "";
  let invitationData = null;

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

    invitationData = data;

    if (invitationData.link_builder_enabled === false) {
      disabledState.classList.remove("hidden");
      if (statusState) statusState.style.display = "none";
      return;
    }

    if (statusState) statusState.style.display = "none";
    
    dynamicTitle.textContent = invitationData.link_builder_title || "Generador de enlace";
    dynamicMessage.textContent = invitationData.link_builder_message || "Crea un pase rápido para invitados de último momento.";

    const pin = String(invitationData.link_builder_pin || "").trim();
    
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

  unlockLinkBuilderButton.addEventListener("click", () => {
    unlockLinkBuilder();
  });

  linkBuilderPinInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      unlockLinkBuilder();
    }
  });

  function unlockLinkBuilder() {
    const input = document.getElementById("linkBuilderPinInput");
    const errorBox = document.getElementById("linkBuilderPinError");

    const typedPin = String(input?.value || "").trim();
    const realPin = String(invitationData?.link_builder_pin || "").trim();

    console.log("PIN validation:", {
      typedPin,
      realPin,
      isMatch: typedPin === realPin
    });

    if (!realPin) {
      if (errorBox) {
        errorBox.textContent = "No hay PIN configurado.";
        errorBox.classList.remove("hidden");
      }
      return;
    }

    if (!typedPin) {
      if (errorBox) {
        errorBox.textContent = "Ingresa el PIN.";
        errorBox.classList.remove("hidden");
      }
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

  function buildInvitationLink() {
    const baseUrl = `${window.location.origin}/invitacion.html`;

    const name = document.getElementById("guestName")?.value.trim();
    const passes = document.getElementById("guestPasses")?.value.trim();
    const table = document.getElementById("guestTable")?.value.trim();

    const urlParams = new URLSearchParams();
    urlParams.set("slug", slug);

    if (name) urlParams.set("n", name);
    if (passes) urlParams.set("p", passes);
    if (table) urlParams.set("m", table);

    return `${baseUrl}?${urlParams.toString()}`;
  }

  function normalizePhone(value) {
    return String(value || "").replace(/[^\d]/g, "");
  }

  generateLinkButton.addEventListener("click", () => {
    const name = document.getElementById("guestName").value.trim();
    if (!name) {
      alert("Por favor, ingresa el nombre o familia.");
      return;
    }

    currentGeneratedLink = buildInvitationLink();
    
    generatedLinkOutput.textContent = currentGeneratedLink;
    generatedLinkOutput.style.display = "block";

    copyLinkButton.style.display = "inline-block";
    openInvitationButton.style.display = "inline-block";
    
    const whatsapp = document.getElementById("guestWhatsapp").value.trim();
    if (normalizePhone(whatsapp)) {
      sendWhatsappButton.style.display = "inline-block";
    } else {
      sendWhatsappButton.style.display = "none";
    }
  });

  copyLinkButton.addEventListener("click", async () => {
    if (!currentGeneratedLink) return;
    try {
      await navigator.clipboard.writeText(currentGeneratedLink);
      alert("Enlace copiado al portapapeles.");
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = currentGeneratedLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Enlace copiado al portapapeles (fallback).");
    }
  });

  openInvitationButton.addEventListener("click", () => {
    if (!currentGeneratedLink) return;
    const previewLink = `${currentGeneratedLink}&v=preview-${Date.now()}`;
    window.open(previewLink, "_blank");
  });

  sendWhatsappButton.addEventListener("click", () => {
    if (!currentGeneratedLink) return;
    const whatsapp = document.getElementById("guestWhatsapp").value.trim();
    const phone = normalizePhone(whatsapp);
    
    if (!phone) {
      alert("Agrega un WhatsApp para enviar el enlace.");
      return;
    }

    const message = `Hola, te compartimos tu pase personalizado para el evento:\n${currentGeneratedLink}`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  });
}
