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

    async function redirectByRole() {
        const roleInfo = await window.InvittiaAuth.getCurrentUserRole();
        const role = roleInfo.role;

        if (!role) {
            throw new Error("Tu usuario no está asociado a ningún evento.");
        }

        if (role === "staff") {
            window.location.href = "checkin.html";
            return;
        }

        if (role === "owner" || role === "admin") {
            window.location.href = getNextUrl();
            return;
        }

        throw new Error("No tienes permiso para acceder a esta sección.");
    }

    async function redirectIfAuthenticated() {
        try {
            const session = await window.InvittiaAuth.getSession();
            if (session) {
                await redirectByRole();
            }
        } catch (error) {
            setError(error.message || "No se pudo validar la sesión.");
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearError();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            setError("Ingresa email y contraseña.");
            return;
        }

        try {
            setLoading(true);
            await window.InvittiaAuth.signIn(email, password);
            await redirectByRole();
        } catch (error) {
            setError(error.message || "No se pudo iniciar sesión.");
        } finally {
            setLoading(false);
        }
    });

    redirectIfAuthenticated();
})();
