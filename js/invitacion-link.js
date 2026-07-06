document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  const generateLinkButton = document.getElementById("generateLinkButton");
  const copyLinkButton = document.getElementById("copyLinkButton");
  const openInvitationButton = document.getElementById("openInvitationButton");
  const sendWhatsappButton = document.getElementById("sendWhatsappButton");
  const generatedLinkOutput = document.getElementById("generatedLinkOutput");
  
  const disabledState = document.getElementById("disabledState");
  const pinState = document.getElementById("pinState");
  const builderState = document.getElementById("builderState");
  const dynamicTitle = document.getElementById("dynamicTitle");
  const dynamicMessage = document.getElementById("dynamicMessage");
  
  const linkBuilderPinInput = document.getElementById("linkBuilderPinInput");
  const linkBuilderPinError = document.getElementById("linkBuilderPinError");
  const unlockLinkBuilderButton = document.getElementById("unlockLinkBuilderButton");

  let currentGeneratedLink = "";
  let invitationData = null;

  if (!slug) {
    document.getElementById("errorMessage").style.display = "block";
    return;
  }

  // Initialize Supabase if available in global
  if (!window.supabaseClient) {
    if (window.env && window.env.SUPABASE_URL && window.env.SUPABASE_ANON_KEY) {
      window.supabaseClient = supabase.createClient(window.env.SUPABASE_URL, window.env.SUPABASE_ANON_KEY);
    }
  }
  
  const sb = window.supabaseClient;

  if (!sb) {
    console.error("Supabase client not initialized.");
    return;
  }

  async function init() {
    try {
      const { data, error } = await sb
        .from("studio_invitations")
        .select("slug, event_title, quinceanera_name, link_builder_enabled, link_builder_pin, link_builder_title, link_builder_message")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        document.getElementById("errorMessage").textContent = "No se encontró la invitación.";
        document.getElementById("errorMessage").style.display = "block";
        return;
      }

      invitationData = data;

      if (invitationData.link_builder_enabled === false) {
        disabledState.classList.remove("hidden");
        return;
      }

      dynamicTitle.textContent = invitationData.link_builder_title || "Generador de enlace";
      dynamicMessage.textContent = invitationData.link_builder_message || "Crea un pase rápido para invitados de último momento.";

      const requiredPin = invitationData.link_builder_pin;
      
      if (requiredPin) {
        const isUnlocked = sessionStorage.getItem(`linkBuilderUnlocked:${slug}`);
        if (isUnlocked === "true") {
          builderState.classList.remove("hidden");
        } else {
          pinState.classList.remove("hidden");
        }
      } else {
        builderState.classList.remove("hidden");
      }

    } catch (err) {
      console.error(err);
      document.getElementById("errorMessage").textContent = "Error de conexión.";
      document.getElementById("errorMessage").style.display = "block";
    }
  }
  
  init();

  unlockLinkBuilderButton.addEventListener("click", () => {
    const inputPin = linkBuilderPinInput.value;
    if (inputPin === invitationData.link_builder_pin) {
      sessionStorage.setItem(`linkBuilderUnlocked:${slug}`, "true");
      pinState.classList.add("hidden");
      builderState.classList.remove("hidden");
      linkBuilderPinError.classList.add("hidden");
    } else {
      linkBuilderPinError.classList.remove("hidden");
    }
  });

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
});
