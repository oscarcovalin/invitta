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
        signIn,
        signOut
    };
})();

