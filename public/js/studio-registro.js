(function () {
  "use strict";

  const form = document.getElementById("register-form");
  const submitButton = document.getElementById("register-submit");
  const errorAlert = document.getElementById("register-error");
  const successAlert = document.getElementById("register-success");

  function showAlert(element, message) {
    errorAlert.style.display = "none";
    successAlert.style.display = "none";
    element.textContent = message;
    element.style.display = "block";
  }

  function setLoading(loading) {
    submitButton.disabled = loading;
    submitButton.textContent = loading ? "Creando cuenta..." : "Crear cuenta";
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const studioName = document.getElementById("studio-name").value.trim();
    const fullName = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const passwordConfirmation = document.getElementById("password-confirmation").value;

    if (!studioName || !fullName || !email) {
      showAlert(errorAlert, "Completa todos los campos para continuar.");
      return;
    }
    if (password.length < 8) {
      showAlert(errorAlert, "La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== passwordConfirmation) {
      showAlert(errorAlert, "Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await window.studioAuth.signUpStudio({
        studioName,
        fullName,
        email,
        password
      });
      if (error) throw error;

      form.hidden = true;
      showAlert(
        successAlert,
        "Cuenta registrada. Revisa tu correo y abre el enlace de confirmación para entrar a Invitta Studio."
      );
    } catch (error) {
      const message = error?.message || "No fue posible crear la cuenta. Intenta de nuevo.";
      showAlert(errorAlert, /rate limit/i.test(message)
        ? "Se enviaron varios correos recientemente. Espera unos minutos e intenta de nuevo."
        : message);
    } finally {
      setLoading(false);
    }
  });
})();

