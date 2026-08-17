(function () {
    function getEventIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get("event_id") || params.get("evento") || window.InvittiaSupabase.config.defaultEventId || "";
    }

    async function getActiveEvent() {
        const supabase = window.InvittiaSupabase.getClient();
        const eventId = getEventIdFromUrl();

        let query = supabase
            .from("eventos")
            .select("id, cliente_id, nombre, tipo, slug, fecha_evento, ubicacion, config, theme, estado")
            .eq("estado", "activo")
            .order("fecha_evento", { ascending: true })
            .limit(1);

        if (eventId) {
            query = supabase
                .from("eventos")
                .select("id, cliente_id, nombre, tipo, slug, fecha_evento, ubicacion, config, theme, estado")
                .eq("id", eventId)
                .limit(1);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data && data.length ? data[0] : null;
    }

    window.InvittiaEventsService = {
        getActiveEvent
    };
})();

