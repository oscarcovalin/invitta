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

async function initLinkBuilder() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

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

  // Initialize Supabase if available in global
  if (!window.supabaseClient) {
    if (window.env && window.env.SUPABASE_URL && window.env.SUPABASE_ANON_KEY) {
      window.supabaseClient = supabase.createClient(window.env.SUPABASE_URL, window.env.SUPABASE_ANON_KEY);
    }
  }
  
  const sb = window.supabaseClient;

  if (!sb) {
    console.error("Supabase client not initialized. Falling back to basic mode.");
    if (statusState) statusState.style.display = "none";
    showBuilderForm();
  } else {
    try {
      const { data, error } = await sb
        .from("studio_invitations")
        .select("slug, event_title, quinceanera_name, link_builder_enabled, link_builder_pin, link_builder_title, link_builder_message")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        showFatalError("No se encontró la invitación.");
        return;
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

      const requiredPin = invitationData.link_builder_pin;
      console.log("Link builder config:", invitationData);
      
      if (requiredPin) {
        const isUnlocked = sessionStorage.getItem(`linkBuilderUnlocked:${slug}`);
        if (isUnlocked === "true") {
          showBuilderForm();
        } else {
          showPinGate();
        }
      } else {
        showBuilderForm();
      }

    } catch (err) {
      console.error(err);
      showFatalError("Error de conexión. Mostrando generador básico.");
    }
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
    const inputPin = linkBuilderPinInput.value.trim();
    const realPin = invitationData ? String(invitationData.link_builder_pin || "").trim() : "";
    
    if (invitationData && inputPin === realPin) {
      sessionStorage.setItem(`linkBuilderUnlocked:${slug}`, "true");
      linkBuilderPinError.classList.add("hidden");
      showBuilderForm();
    } else {
      linkBuilderPinError.textContent = "PIN incorrecto.";
      linkBuilderPinError.classList.remove("hidden");
    }
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
