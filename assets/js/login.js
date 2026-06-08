(function () {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorBox = document.getElementById("loginError");
    const loginButton = document.getElementById("loginButton");

    function getNextUrl() {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        if (!next) return "dashboard.html";

        try {
            const nextUrl = new URL(next, window.location.origin);
            if (nextUrl.origin !== window.location.origin) return "dashboard.html";
            return nextUrl.pathname + nextUrl.search + nextUrl.hash;
        } catch (error) {
            return "dashboard.html";
        }
    }

    function setError(message) {
        errorBox.textContent = message;
        errorBox.classList.add("active");
    }

    function clearError() {
        errorBox.textContent = "";
        errorBox.classList.remove("active");
    }

    function setLoading(isLoading) {
        loginButton.disabled = isLoading;
        loginButton.textContent = isLoading ? "Validando..." : "Entrar al dashboard";
    }

    async function redirectIfAuthenticated() {
        try {
            const session = await window.InvittiaAuth.getSession();
            if (session) {
                window.location.href = getNextUrl();
            }
        } catch (error) {
            setError(error.message || "No se pudo validar la sesion.");
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearError();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            setError("Ingresa email y contrasena.");
            return;
        }

        try {
            setLoading(true);
            await window.InvittiaAuth.signIn(email, password);
            window.location.href = getNextUrl();
        } catch (error) {
            setError(error.message || "No se pudo iniciar sesion.");
        } finally {
            setLoading(false);
        }
    });

    redirectIfAuthenticated();
})();
