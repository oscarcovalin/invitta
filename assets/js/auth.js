(function () {
    async function getSession() {
        const supabase = window.InvittiaSupabase.getClient();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    }

    async function requireSession() {
        const session = await getSession();
        if (!session) {
            const next = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `login.html?next=${next}`;
            return null;
        }

        return session;
    }

    function pickHighestClienteUsuario(rows) {
        const list = rows || [];
        return list.find((row) => row.rol === "owner")
            || list.find((row) => row.rol === "admin")
            || list.find((row) => row.rol === "staff")
            || null;
    }

    async function getCurrentUserRole() {
        const session = await getSession();
        if (!session) {
            return { user: null, role: null, clienteUsuario: null };
        }

        const supabase = window.InvittiaSupabase.getClient();
        const { data, error } = await supabase
            .from("cliente_usuarios")
            .select("id, cliente_id, user_id, rol")
            .eq("user_id", session.user.id);

        if (error) throw error;

        const clienteUsuario = pickHighestClienteUsuario(data);
        if (!clienteUsuario) {
            console.error("[Invittia Auth] Usuario sin registro en cliente_usuarios:", session.user.id);
        }

        return {
            user: session.user,
            role: clienteUsuario ? clienteUsuario.rol : null,
            clienteUsuario
        };
    }

    async function requireRole(allowedRoles, options = {}) {
        const session = await requireSession();
        if (!session) return null;

        const roleInfo = await getCurrentUserRole();
        const role = roleInfo.role;

        if (!role) {
            const message = "Tu usuario no está asociado a ningún evento.";
            if (options.signOutOnMissingRole) {
                alert(message);
                await signOut();
                return null;
            }
            throw new Error(message);
        }

        if (allowedRoles.includes(role)) {
            return {
                session,
                role,
                user: roleInfo.user,
                clienteUsuario: roleInfo.clienteUsuario
            };
        }

        if (role === "staff" && options.staffRedirect) {
            window.location.href = options.staffRedirect;
            return null;
        }

        if ((role === "owner" || role === "admin") && options.adminRedirect) {
            window.location.href = options.adminRedirect;
            return null;
        }

        throw new Error("No tienes permiso para acceder a esta sección.");
    }

    async function signIn(email, password) {
        const supabase = window.InvittiaSupabase.getClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        const supabase = window.InvittiaSupabase.getClient();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = "login.html";
    }

    window.InvittiaAuth = {
        getSession,
        requireSession,
        getCurrentUserRole,
        requireRole,
        signIn,
        signOut
    };
})();
