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
        const rank = { owner: 0, admin: 1, staff: 2, cliente: 3 };
        return [...(rows || [])]
            .sort((left, right) => {
                const roleDifference = (rank[left.rol] ?? 99) - (rank[right.rol] ?? 99);
                if (roleDifference !== 0) return roleDifference;
                return String(left.cliente_id || "").localeCompare(String(right.cliente_id || ""));
            })[0] || null;
    }

    function getRequestedEventId() {
        return new URLSearchParams(window.location.search).get("event_id") || null;
    }

    function pickDashboardEvent(rows, targetEventId) {
        const rank = { owner: 0, admin: 1, staff: 2, cliente: 3 };
        const candidates = [...(rows || [])];
        if (targetEventId) {
            return candidates.find((row) => row.evento_id === targetEventId) || null;
        }
        return candidates.sort((left, right) => {
            const roleDifference = (rank[left.rol] ?? 99) - (rank[right.rol] ?? 99);
            if (roleDifference !== 0) return roleDifference;
            return String(left.evento_id || "").localeCompare(String(right.evento_id || ""));
        })[0] || null;
    }

    async function getCurrentUserRole(targetEventId = getRequestedEventId()) {
        const session = await getSession();
        if (!session) {
            return { user: null, role: null, eventoId: null, clienteUsuario: null };
        }

        const supabase = window.InvittiaSupabase.getClient();
        const { data: dashboardEvents, error: dashboardEventsError } = await supabase
            .rpc("current_user_dashboard_events");

        if (!dashboardEventsError) {
            const eventAccess = pickDashboardEvent(dashboardEvents, targetEventId);
            return {
                user: session.user,
                role: eventAccess ? eventAccess.rol : null,
                eventoId: eventAccess ? eventAccess.evento_id : null,
                clienteUsuario: null
            };
        }

        console.warn("[Invittia Auth] Event-scoped access unavailable; using legacy access.", dashboardEventsError);
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
            eventoId: targetEventId || null,
            clienteUsuario
        };
    }

    async function requireRole(allowedRoles, options = {}) {
        const session = await requireSession();
        if (!session) return null;

        const roleInfo = await getCurrentUserRole(options.eventId || getRequestedEventId());
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
                eventoId: roleInfo.eventoId,
                clienteUsuario: roleInfo.clienteUsuario
            };
        }

        if (role === "staff" && options.staffRedirect) {
            const redirect = new URL(options.staffRedirect, window.location.origin);
            if (roleInfo.eventoId && !redirect.searchParams.has("event_id")) {
                redirect.searchParams.set("event_id", roleInfo.eventoId);
            }
            window.location.href = redirect.pathname + redirect.search;
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
