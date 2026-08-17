(function () {
    const GUEST_SELECT = "id, evento_id, nombre, familia, email, telefono, mesa, pases_asignados, pases_confirmados, estado, notas, confirmed_at";
    const VALID_STATUSES = ["Confirmado", "Pendiente", "No asistira"];

    function formatDate(value) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toISOString().slice(0, 10);
    }

    function normalizeStatus(status) {
        if (!status) return "Pendiente";
        if (String(status).toLowerCase().includes("no asistir")) return "No asistira";
        return status;
    }

    function toOptionalText(value) {
        const text = String(value ?? "").trim();
        return text || null;
    }

    function toNonNegativeInteger(value, fallback) {
        const number = Number.parseInt(value, 10);
        if (Number.isNaN(number) || number < 0) return fallback;
        return number;
    }

    function normalizePayload(input, eventId) {
        if (!eventId) {
            throw new Error("No hay evento activo para operar invitados.");
        }

        const nombre = String(input.nombre ?? input.name ?? "").trim();
        if (!nombre) {
            throw new Error("El nombre del invitado es obligatorio.");
        }

        const estado = normalizeStatus(input.estado ?? input.status ?? "Pendiente");
        if (!VALID_STATUSES.includes(estado)) {
            throw new Error("Estado RSVP no valido.");
        }

        const pasesAsignados = toNonNegativeInteger(input.pases_asignados ?? input.passesAssigned, 1);
        const pasesConfirmados = toNonNegativeInteger(input.pases_confirmados ?? input.passesConfirmed, 0);

        return {
            evento_id: eventId,
            nombre,
            familia: toOptionalText(input.familia ?? input.family),
            email: toOptionalText(input.email),
            telefono: toOptionalText(input.telefono ?? input.phone),
            mesa: toOptionalText(input.mesa ?? input.table),
            pases_asignados: pasesAsignados,
            pases_confirmados: pasesConfirmados,
            estado,
            notas: toOptionalText(input.notas ?? input.notes),
            confirmed_at: estado === "Confirmado" ? (input.confirmed_at || new Date().toISOString()) : null
        };
    }

    function mapGuest(row) {
        return {
            id: row.id,
            eventId: row.evento_id,
            qr_id: row.id,
            name: row.nombre || "",
            family: row.familia || "",
            status: normalizeStatus(row.estado),
            companions: Number(row.pases_confirmados || row.pases_asignados || 0),
            passesAssigned: Number(row.pases_asignados || 0),
            passesConfirmed: Number(row.pases_confirmados || 0),
            table: row.mesa || "-",
            email: row.email || "-",
            phone: row.telefono || "-",
            notes: row.notas || "-",
            date: formatDate(row.confirmed_at)
        };
    }

    async function getActiveGuests(eventId) {
        if (!eventId) {
            throw new Error("No hay evento activo para cargar invitados.");
        }

        const supabase = window.InvittiaSupabase.getClient();

        const { data, error } = await supabase
            .from("invitados")
            .select(GUEST_SELECT)
            .eq("evento_id", eventId);

        if (error) {
            console.error("[Invittia ERROR] Error cargando invitados:", error);
            throw error;
        }
        return (data || []).map(mapGuest);
    }

    async function getGuestsByEvent(eventId) {
        return getActiveGuests(eventId);
    }

    async function createGuest(eventId, input) {
        const supabase = window.InvittiaSupabase.getClient();
        const payload = normalizePayload(input, eventId);
        const { data, error } = await supabase
            .from("invitados")
            .insert(payload)
            .select(GUEST_SELECT)
            .single();

        if (error) throw error;
        return mapGuest(data);
    }

    async function updateGuest(eventId, guestId, input) {
        if (!guestId) {
            throw new Error("Falta el invitado a editar.");
        }

        const supabase = window.InvittiaSupabase.getClient();
        const payload = normalizePayload(input, eventId);
        delete payload.evento_id;

        const { data, error } = await supabase
            .from("invitados")
            .update(payload)
            .eq("id", guestId)
            .eq("evento_id", eventId)
            .select(GUEST_SELECT)
            .single();

        if (error) throw error;
        return mapGuest(data);
    }

    async function deleteGuest(eventId, guestId) {
        if (!eventId) {
            throw new Error("No hay evento activo para eliminar invitados.");
        }

        if (!guestId) {
            throw new Error("Falta el invitado a eliminar.");
        }

        const supabase = window.InvittiaSupabase.getClient();
        const { error } = await supabase
            .from("invitados")
            .delete()
            .eq("id", guestId)
            .eq("evento_id", eventId);

        if (error) throw error;
        return true;
    }

    window.InvittiaGuestsService = {
        getActiveGuests,
        getGuestsByEvent,
        createGuest,
        updateGuest,
        deleteGuest
    };
})();
