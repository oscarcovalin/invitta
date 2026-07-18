(function () {
    const requestPanel = document.getElementById("requestPanel");
    const passwordPanel = document.getElementById("passwordPanel");
    const requestForm = document.getElementById("requestForm");
    const passwordForm = document.getElementById("passwordForm");
    const notice = document.getElementById("notice");
    const requestButton = document.getElementById("requestButton");
    const passwordButton = document.getElementById("passwordButton");
    let recoveryReady = false;

    function setNotice(message, type) {
        notice.textContent = message;
        notice.className = `notice active ${type}`;
    }

    function clearNotice() {
        notice.textContent = "";
        notice.className = "notice";
    }

    function showPasswordForm() {
        recoveryReady = true;
        requestPanel.hidden = true;
        passwordPanel.hidden = false;
        clearNotice();
        document.getElementById("newPassword").focus();
    }

    function showRequestForm(message) {
        recoveryReady = false;
        passwordPanel.hidden = true;
        requestPanel.hidden = false;
        if (message) setNotice(message, "error");
    }

    function getRecoveryError() {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = hash.get("error_code");
        if (!code) return null;
        if (code === "otp_expired") {
            return "Este enlace ya vencio o fue reemplazado por uno mas reciente. Solicita uno nuevo.";
        }
        return "No fue posible validar este enlace. Solicita uno nuevo.";
    }

    function setLoading(button, loading, label) {
        button.disabled = loading;
        button.textContent = loading ? "Procesando..." : label;
    }

    async function initialize() {
        const recoveryError = getRecoveryError();
        if (recoveryError) {
            showRequestForm(recoveryError);
            return;
        }

        const hasRecoveryHash = window.location.hash.includes("type=recovery");
        const hasRecoveryCode = new URLSearchParams(window.location.search).has("code");
        if (!hasRecoveryHash && !hasRecoveryCode) return;

        const client = window.InvittiaSupabase.getClient();
        const { data, error } = await client.auth.getSession();
        if (error || !data.session) {
            showRequestForm("No fue posible validar este enlace. Solicita uno nuevo.");
            return;
        }
        showPasswordForm();
    }

    requestForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearNotice();
        const email = document.getElementById("email").value.trim();
        if (!email) {
            setNotice("Escribe tu correo para continuar.", "error");
            return;
        }

        try {
            setLoading(requestButton, true, "Enviar enlace de recuperacion");
            const client = window.InvittiaSupabase.getClient();
            const returnToStudio = new URLSearchParams(window.location.search).get("return") === "studio";
            const redirectTo = `${window.location.origin}/administracion/restablecer-contrasena.html${returnToStudio ? "?return=studio" : ""}`;
            const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
            if (error) throw error;
            setNotice("Revisa tu correo. Abre solo el enlace mas reciente para crear tu contrasena nueva.", "success");
        } catch (error) {
            setNotice(error.message || "No fue posible enviar el enlace. Intenta de nuevo.", "error");
        } finally {
            setLoading(requestButton, false, "Enviar enlace de recuperacion");
        }
    });

    passwordForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearNotice();
        const password = document.getElementById("newPassword").value;
        const confirmation = document.getElementById("confirmPassword").value;
        if (password.length < 8) {
            setNotice("La contrasena debe tener al menos 8 caracteres.", "error");
            return;
        }
        if (password !== confirmation) {
            setNotice("Las contrasenas no coinciden.", "error");
            return;
        }
        if (!recoveryReady) {
            showRequestForm("Solicita un enlace nuevo para cambiar tu contrasena.");
            return;
        }

        try {
            setLoading(passwordButton, true, "Guardar contrasena nueva");
            const client = window.InvittiaSupabase.getClient();
            const { error } = await client.auth.updateUser({ password });
            if (error) throw error;
            await client.auth.signOut();
            setNotice("Contrasena actualizada. Ya puedes iniciar sesion.", "success");
            passwordPanel.hidden = true;
            requestPanel.hidden = false;
            setTimeout(() => {
                const returnToStudio = new URLSearchParams(window.location.search).get("return") === "studio";
                window.location.href = returnToStudio ? "studio-login.html" : "login.html";
            }, 900);
        } catch (error) {
            setNotice(error.message || "No fue posible actualizar la contrasena.", "error");
        } finally {
            setLoading(passwordButton, false, "Guardar contrasena nueva");
        }
    });

    const client = window.InvittiaSupabase.getClient();
    client.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") showPasswordForm();
    });

    const returnToStudio = new URLSearchParams(window.location.search).get("return") === "studio";
    const backLink = document.querySelector(".back");
    if (returnToStudio && backLink) {
        backLink.href = "studio-login.html";
        backLink.textContent = "Volver a Invitta Studio";
    }

    initialize().catch(() => {
        showRequestForm("No fue posible preparar la recuperacion. Solicita un enlace nuevo.");
    });
})();
