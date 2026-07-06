document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  const generateLinkButton = document.getElementById("generateLinkButton");
  const copyLinkButton = document.getElementById("copyLinkButton");
  const openInvitationButton = document.getElementById("openInvitationButton");
  const sendWhatsappButton = document.getElementById("sendWhatsappButton");
  const generatedLinkOutput = document.getElementById("generatedLinkOutput");
  
  let currentGeneratedLink = "";

  if (!slug) {
    document.getElementById("errorMessage").style.display = "block";
    document.getElementById("builderForm").style.display = "none";
    return;
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
});
