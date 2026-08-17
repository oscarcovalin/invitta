(function () {
  "use strict";

  const title = document.getElementById("confirmation-title");
  const message = document.getElementById("confirmation-message");
  const loader = document.getElementById("confirmation-loader");
  const action = document.getElementById("confirmation-action");

  function showError(text) {
    title.textContent = "No pudimos confirmar tu cuenta";
    message.textContent = text;
    loader.hidden = true;
    action.hidden = false;
  }

  async function getConfirmedSession() {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errorCode = query.get("error_code") || hash.get("error_code");
    if (errorCode) {
      throw new Error(errorCode === "otp_expired"
        ? "El enlace venció o ya fue utilizado. Inicia sesión o solicita un registro nuevo."
        : "El enlace de confirmación no es válido.");
    }

    let session = await window.studioAuth.getSession();
    const code = query.get("code");
    if (!session && code) {
      const result = await window.studioAuth.db.auth.exchangeCodeForSession(code);
      if (result.error) throw result.error;
      session = result.data.session;
    }

    for (let attempt = 0; !session && attempt < 8; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      session = await window.studioAuth.getSession();
    }
    return session;
  }

  async function initialize() {
    try {
      const session = await getConfirmedSession();
      if (!session) throw new Error("No se encontró una sesión confirmada. Abre de nuevo el enlace más reciente de tu correo.");

      const { studio, error } = await window.studioAuth.provisionStudio();
      if (error) throw error;
      if (!studio?.studio_id) throw new Error("No fue posible crear el espacio de trabajo.");

      localStorage.setItem("invitta_studio_id", studio.studio_id);
      title.textContent = "Tu Studio está listo";
      message.textContent = `Bienvenido a ${studio.studio_name}. Te llevaremos al panel de administración.`;
      loader.hidden = true;

      setTimeout(function () {
        window.location.replace("/administracion/studio-dashboard.html");
      }, 900);
    } catch (error) {
      showError(error?.message || "No fue posible completar el registro.");
    }
  }

  initialize();
})();

