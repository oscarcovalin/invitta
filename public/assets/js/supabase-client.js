(function () {
    function getConfig() {
        const env = window.INVITTIA_ENV || {};
        return {
            url: env.SUPABASE_URL || "",
            anonKey: env.SUPABASE_ANON_KEY || "",
            appUrl: env.INVITTIA_APP_URL || window.location.origin,
            defaultEventId: env.INVITTIA_DEFAULT_EVENT_ID || ""
        };
    }

    function assertReady(config) {
        if (!window.supabase || !window.supabase.createClient) {
            throw new Error("Supabase JS no esta cargado. Revisa el CDN en el HTML.");
        }

        if (!config.url || !config.anonKey) {
            throw new Error("Faltan SUPABASE_URL o SUPABASE_ANON_KEY en assets/js/env.js.");
        }
    }

    const config = getConfig();
    let client = null;

    function getClient() {
        if (!client) {
            assertReady(config);
            client = window.supabase.createClient(config.url, config.anonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
        }

        return client;
    }

    window.InvittiaSupabase = {
        config,
        getClient
    };
})();

