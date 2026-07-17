(function () {
    "use strict";

   const CHECKIN_GUEST_SELECT = "id, evento_id, nombre, familia, telefono, email, mesa, pases_asignados, pases_confirmados, estado, qr_token, qr_status, checked_in, checked_in_at, checked_in_by";

    let session = null;
    let currentGuest = null;
    let currentToken = "";
    let activeEvent = null;
    let staffGuests = [];
    let staffSearch = "";
    let staffFilter = "all";
    let qrScanner = null;
    let scannerRunning = false;

    const $ = (id) => document.getElementById(id);

    function setText(id, value) {
        const el = $(id);
        if (el) el.textContent = String(value ?? "-");
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char]));
    }

    function setState(kind, title, message) {
        const badge = $("statusBadge");
        if (badge) {
            badge.className = `status ${kind || ""}`.trim();
            badge.textContent = title;
        }
        setText("title", title);
        setText("message", message);
    }

    function setScannerStatus(message) {
        setText("scannerStatus", message);
    }

    function setScannerButtons(isRunning) {
        const startButton = $("startScannerBtn");
        const stopButton = $("stopScannerBtn");
        if (startButton) startButton.disabled = isRunning;
        if (stopButton) stopButton.disabled = !isRunning;
    }

    function showGuest(guest) {
        currentGuest = guest;
        const empty = $("guestDetailEmpty");
        const rows = $("guestDetailRows");
        if (empty) empty.hidden = true;
        if (rows) rows.hidden = false;
        setText("guestName", guest.nombre);
        setText("guestFamily", guest.familia || "-");
        setText("guestTable", guest.mesa || "-");
        setText("guestStatus", guest.estado || "-");
        setText("guestConfirmed", guest.pases_confirmados ?? 0);
        setText("guestAssigned", guest.pases_asignados ?? 0);
        setText("guestCheckedIn", isGuestCheckedIn(guest) ? "Si" : "No");
        setText("guestCheckedInAt", formatCheckedInAt(guest.checked_in_at));
    }

    function clearGuestDetail() {
        currentGuest = null;
        const empty = $("guestDetailEmpty");
        const rows = $("guestDetailRows");
        if (empty) {
            empty.hidden = false;
            empty.textContent = "Selecciona un invitado de la lista o busca por nombre.";
        }
        if (rows) rows.hidden = true;
    }

    function hideConfirmButton() {
        const button = $("confirmBtn");
        if (button) button.hidden = true;
    }

    function showConfirmButton() {
        const button = $("confirmBtn");
        if (button) button.hidden = false;
    }

    async function loadGuestByToken(token) {
        const supabase = window.InvittiaSupabase.getClient();
        let query = supabase
            .from("invitados")
            .select(CHECKIN_GUEST_SELECT)
            .eq("qr_token", token);

        if (activeEvent?.id) {
            query = query.eq("evento_id", activeEvent.id);
        }

        const { data, error } = await query.limit(1);

        return { data: Array.isArray(data) ? data[0] : null, error };
    }

    async function validateToken(token) {
        currentToken = token || "";
        if (!currentToken) {
            setState("error", "QR sin token valido", "El QR escaneado no contiene un token usable.");
            hideConfirmButton();
            return;
        }

        const { data: guest, error } = await loadGuestByToken(currentToken);
        if (error) {
            console.error("[Invittia Check-in] Error buscando invitado por token:", error);
            setState("error", "Error al validar QR", error.message || "No se pudo validar este QR.");
            hideConfirmButton();
            return;
        }

        if (!guest) {
            setState("error", "QR invalido", "No encontramos un invitado asociado a este token.");
            hideConfirmButton();
            return;
        }

        if (activeEvent?.id && guest.evento_id !== activeEvent.id) {
            setState("error", "QR de otro evento", "Este pase no pertenece al evento seleccionado.");
            hideConfirmButton();
            return;
        }

        renderGuestStatus(guest);
    }

    function extractToken(value) {
        const raw = String(value || "").trim();
        if (!raw) return "";

        try {
            const url = new URL(raw);
            return url.searchParams.get("token") || raw;
        } catch {
            return raw;
        }
    }

    async function stopScanner() {
        if (!qrScanner || !scannerRunning) {
            setScannerButtons(false);
            return;
        }

        try {
            await qrScanner.stop();
            await qrScanner.clear();
            setScannerStatus("Escaner detenido.");
        } catch (error) {
            console.error("[Invittia Check-in] Error deteniendo escaner:", error);
            setScannerStatus("No se pudo detener el escaner correctamente.");
        } finally {
            scannerRunning = false;
            setScannerButtons(false);
        }
    }

    async function startScanner() {
        if (typeof Html5Qrcode === "undefined") {
            setScannerStatus("No se pudo cargar la libreria del escaner.");
            return;
        }

        const reader = $("qrReader");
        if (!reader) return;

        if (!qrScanner) {
            qrScanner = new Html5Qrcode("qrReader");
        }

        try {
            setScannerStatus("Solicitando permiso de camara...");
            setScannerButtons(true);
            await qrScanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                async (decodedText) => {
                    await stopScanner();
                    const token = extractToken(decodedText);
                    if (!token) {
                        setState("error", "QR sin token valido", "El QR escaneado no contiene el parametro token.");
                        setScannerStatus("QR sin token valido.");
                        hideConfirmButton();
                        return;
                    }

                    setScannerStatus("QR detectado. Validando pase...");
                    await validateToken(token);
                },
                () => {}
            );
            scannerRunning = true;
            setScannerButtons(true);
            setScannerStatus("Escaner activo. Apunta la camara al QR.");
        } catch (error) {
            console.error("[Invittia Check-in] Error iniciando escaner:", error);
            scannerRunning = false;
            setScannerButtons(false);

            const message = String(error?.message || error || "").toLowerCase();
            if (message.includes("permission") || message.includes("notallowed") || message.includes("denied")) {
                setScannerStatus("Permiso de camara denegado. Habilitalo en el navegador.");
                return;
            }
            if (message.includes("notfound") || message.includes("no camera") || message.includes("overconstrained")) {
                setScannerStatus("No se encontro una camara disponible.");
                return;
            }
            setScannerStatus("No se pudo iniciar la camara.");
        }
    }

    async function loadGuestById(guestId) {
        const supabase = window.InvittiaSupabase.getClient();
        let query = supabase
            .from("invitados")
            .select(CHECKIN_GUEST_SELECT)
            .eq("id", guestId);

        if (activeEvent?.id) {
            query = query.eq("evento_id", activeEvent.id);
        }

        const { data, error } = await query.limit(1);

        if (error) throw error;
        return Array.isArray(data) ? data[0] : null;
    }

    async function getActiveEvent() {
        if (window.InvittiaEventsService?.getActiveEvent) {
            return window.InvittiaEventsService.getActiveEvent();
        }

        const supabase = window.InvittiaSupabase.getClient();
        const { data, error } = await supabase
            .from("eventos")
            .select("id, nombre, fecha_evento, estado, config")
            .eq("estado", "activo")
            .order("fecha_evento", { ascending: true })
            .limit(1);

        if (error) throw error;
        return data && data.length ? data[0] : null;
    }

    async function getEventById(eventId) {
        if (!eventId) return null;
        const supabase = window.InvittiaSupabase.getClient();
        const { data, error } = await supabase
            .from("eventos")
            .select("id, nombre, fecha_evento, estado, config")
            .eq("id", eventId)
            .limit(1);

        if (error) throw error;
        return data && data.length ? data[0] : null;
    }

    function isVipEvent(event) {
        const config = event?.config || {};
        return config.qrAccessEnabled === true
            || config.packageTier === "vip"
            || String(config.templateId || "").endsWith("-vip");
    }

    function showVipRequired() {
        document.querySelectorAll(".staff-section").forEach((section) => {
            section.hidden = true;
        });
        clearGuestDetail();
        hideConfirmButton();
        setState("warning", "Control de acceso VIP", "El escaner QR esta disponible unicamente para invitaciones VIP.");
    }

    async function loadStaffGuests() {
        const list = $("staffGuestList");
        const count = $("staffGuestCount");
        if (!activeEvent) activeEvent = await getActiveEvent();

        if (!activeEvent?.id) {
            if (count) count.textContent = "No hay evento activo accesible.";
            if (list) list.innerHTML = "";
            return;
        }

        const supabase = window.InvittiaSupabase.getClient();
        const { data, error } = await supabase
            .from("invitados")
            .select(CHECKIN_GUEST_SELECT)
            .eq("evento_id", activeEvent.id)
            .order("nombre", { ascending: true });

        if (error) throw error;
        staffGuests = data || [];
        renderStaffGuests();
    }

    function isGuestCheckedIn(guest) {
        return guest.checked_in === true || guest.qr_status === "used";
    }

    function guestHasEntered(guest) {
        return isGuestCheckedIn(guest);
    }

    function normalizeStatus(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function isConfirmedRsvp(guest) {
        const status = normalizeStatus(guest.estado);
        return status.includes("confirmado") || status.includes("confirmada");
    }

    function isPendingRsvp(guest) {
        return normalizeStatus(guest.estado).includes("pendiente");
    }

    function formatCheckedInAt(value) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function updateStaffMetrics() {
        const total = staffGuests.length;
        const checkedIn = staffGuests.filter(guestHasEntered).length;
        const pendingCheckin = total - checkedIn;
        const confirmedRsvp = staffGuests.filter(isConfirmedRsvp).length;
        const pendingRsvp = staffGuests.filter(isPendingRsvp).length;

        setText("staffTotalGuests", total);
        setText("staffCheckedIn", checkedIn);
        setText("staffPendingCheckin", pendingCheckin);
        setText("staffConfirmedRsvp", confirmedRsvp);
        setText("staffPendingRsvp", pendingRsvp);
    }

    function guestMatchesSearch(guest) {
        const search = staffSearch.toLowerCase().trim();
        if (!search) return true;
        return [
            guest.nombre,
            guest.familia,
            guest.telefono,
            guest.email,
            guest.mesa
        ].some((value) => String(value || "").toLowerCase().includes(search));
    }

    function guestMatchesFilter(guest) {
        if (staffFilter === "pending") return !guestHasEntered(guest);
        if (staffFilter === "checked") return guestHasEntered(guest);
        return true;
    }

    function sortStaffGuests(a, b) {
        const aEntered = guestHasEntered(a);
        const bEntered = guestHasEntered(b);
        if (aEntered !== bEntered) return aEntered ? 1 : -1;
        return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
    }

    function renderStaffGuests() {
        const list = $("staffGuestList");
        const count = $("staffGuestCount");
        if (!list) return;

        updateStaffMetrics();

        const filtered = staffGuests
            .filter(guestMatchesSearch)
            .filter(guestMatchesFilter)
            .sort(sortStaffGuests);
        if (count) {
            count.textContent = `${filtered.length} invitado(s)`;
        }

        if (!staffGuests.length) {
            list.innerHTML = '<div class="staff-status">No hay invitados para este evento.</div>';
            return;
        }

        if (!filtered.length) {
            list.innerHTML = '<div class="staff-status">No se encontraron invitados.</div>';
            return;
        }

        list.innerHTML = filtered.map((guest) => {
            const entered = guestHasEntered(guest);
            return `
                <article class="staff-guest" data-guest-id="${escapeHtml(guest.id)}">
                    <div class="staff-guest-header">
                        <div>
                            <div class="staff-name">${escapeHtml(guest.nombre)}</div>
                            <div class="staff-meta">${escapeHtml(guest.familia || "-")}</div>
                        </div>
                        <div class="staff-meta">Mesa ${escapeHtml(guest.mesa || "-")}</div>
                    </div>
                    <div class="staff-status">
                        Estado: ${escapeHtml(guest.estado || "-")}<br>
                        Pases: ${escapeHtml(guest.pases_confirmados ?? 0)} / ${escapeHtml(guest.pases_asignados ?? 0)}<br>
                        Check-in: ${entered ? "Si" : "No"}<br>
                        Hora de ingreso: ${escapeHtml(formatCheckedInAt(guest.checked_in_at))}
                    </div>
                    <div class="staff-actions">
                        ${entered
                            ? '<span class="entered-label">Ya ingresó</span>'
                            : '<button class="btn staff-btn" type="button" data-action="manual-checkin">Confirmar entrada</button>'}
                    </div>
                </article>`;
        }).join("");

        list.querySelectorAll("[data-guest-id]").forEach((card) => {
            card.addEventListener("click", () => {
                const guest = staffGuests.find((item) => String(item.id) === String(card.dataset.guestId));
                if (guest) showGuest(guest);
            });
        });

        list.querySelectorAll('[data-action="manual-checkin"]').forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                const card = button.closest("[data-guest-id]");
                const guest = staffGuests.find((item) => String(item.id) === String(card?.dataset.guestId));
                if (!guest) return;

                button.disabled = true;
                confirmGuestEntry(guest, "manual", "")
                    .catch((error) => {
                        console.error("[Invittia Check-in] Error en check-in manual:", error);
                        setState("error", "Error de check-in", "No se pudo confirmar la entrada.");
                    })
                    .finally(() => {
                        button.disabled = false;
                    });
            });
        });
    }

    function renderGuestStatus(guest) {
        currentGuest = guest;
        showGuest(guest);

        if (activeEvent?.id && guest.evento_id !== activeEvent.id) {
            setState("error", "QR de otro evento", "Este pase no pertenece al evento seleccionado.");
            hideConfirmButton();
            return;
        }

        if (guest.qr_status === "cancelled") {
            setState("error", "QR cancelado", "Este pase fue cancelado y no puede usarse.");
            hideConfirmButton();
            return;
        }

        if (guest.checked_in === true || guest.qr_status === "used") {
            setState("warning", "QR ya utilizado", "Este pase ya fue registrado previamente.");
            hideConfirmButton();
            return;
        }

        if (!isConfirmedRsvp(guest)) {
            setState("warning", "Asistencia no confirmada", "Este invitado aun no ha confirmado su asistencia.");
            hideConfirmButton();
            return;
        }

        setState("valid", "Pase valido", "Revisa los datos antes de confirmar la entrada.");
        showConfirmButton();
    }

    async function confirmGuestEntry(guest, method, token) {
        if (!guest) {
            setState("error", "Invitado invalido", "Selecciona un invitado valido para confirmar.");
            return null;
        }
        if (!activeEvent?.id || guest.evento_id !== activeEvent.id) {
            setState("error", "Evento no valido", "El invitado no pertenece al evento activo.");
            return null;
        }

        const supabase = window.InvittiaSupabase.getClient();
        const { data: result, error } = await supabase.rpc("check_in_vip_guest", {
            target_guest_id: guest.id,
            scanned_token: token || null,
            checkin_method: method === "qr" ? "qr" : "manual"
        });

        if (error) {
            console.error("[Invittia Check-in] Error confirmando entrada:", error);
            setState("error", "Error de check-in", error.message || "No se pudo confirmar la entrada.");
            return null;
        }

        if (!result?.ok) {
            const states = {
                duplicate: ["warning", "QR ya utilizado", "Este pase ya fue registrado previamente."],
                cancelled: ["error", "QR cancelado", "Este pase fue cancelado y no puede usarse."],
                not_confirmed: ["warning", "Asistencia no confirmada", "Este invitado aun no ha confirmado su asistencia."],
                invalid_token: ["error", "QR invalido", "El codigo no corresponde a este invitado."],
                vip_required: ["warning", "Control de acceso VIP", "Este evento no incluye control de acceso QR."],
                not_found: ["error", "Invitado no encontrado", "El invitado ya no existe."]
            };
            const state = states[result?.code] || ["error", "Acceso rechazado", "No se pudo confirmar la entrada."];
            setState(state[0], state[1], state[2]);
            const latestGuest = await loadGuestById(guest.id);
            if (latestGuest) showGuest(latestGuest);
            hideConfirmButton();
            await loadStaffGuests();
            return latestGuest;
        }

        const updatedGuest = await loadGuestById(guest.id);
        if (!updatedGuest) {
            setState("error", "Error de check-in", "No se pudo recargar el invitado.");
            return null;
        }

        currentGuest = updatedGuest;
        showGuest(updatedGuest);
        hideConfirmButton();
        await loadStaffGuests();
        setState("valid", "Entrada confirmada", "Entrada confirmada.");
        return updatedGuest;
    }

    async function confirmEntry() {
        if (!currentGuest || !currentGuest.id || !currentGuest.evento_id) {
            setState("error", "QR invalido", "No hay invitado valido para confirmar.");
            return;
        }

        const button = $("confirmBtn");
        if (button) button.disabled = true;

        try {
            const { data: latestGuest, error: tokenError } = await loadGuestByToken(currentToken);
            if (tokenError) {
                console.error("[Invittia Check-in] Error buscando invitado por token antes de confirmar:", tokenError);
                setState("error", "Error al validar QR", tokenError.message || "No se pudo validar este QR.");
                return;
            }

            if (!latestGuest) {
                setState("error", "QR invalido", "El invitado ya no existe.");
                return;
            }

            await confirmGuestEntry(latestGuest, "qr", currentToken);
        } catch (error) {
            console.error("[Invittia Check-in] Error confirmando entrada:", error);
            setState("error", "Error de check-in", "No se pudo confirmar la entrada.");
        } finally {
            if (button) button.disabled = false;
        }
    }

    async function init() {
        const access = await window.InvittiaAuth.requireRole(["owner", "admin", "staff"]);
        if (!access) return;
        session = access.session;

        const params = new URLSearchParams(window.location.search);
        currentToken = params.get("token") || "";
        const requestedEventId = params.get("event_id") || "";
        if (requestedEventId) {
            activeEvent = await getEventById(requestedEventId);
        }

        if (currentToken) {
            const { data: tokenGuest, error: tokenError } = await loadGuestByToken(currentToken);
            if (tokenError) throw tokenError;
            if (!tokenGuest) {
                setState("error", "QR invalido", "No encontramos un invitado asociado a este codigo.");
                hideConfirmButton();
                return;
            }
            if (!activeEvent) {
                activeEvent = await getEventById(tokenGuest.evento_id);
            }
        } else {
            activeEvent = await getActiveEvent();
        }

        if (!isVipEvent(activeEvent)) {
            showVipRequired();
            return;
        }

        await loadStaffGuests();

        if (!currentToken) {
            clearGuestDetail();
            setState("", "Busqueda manual", "Selecciona un invitado de la lista o busca por nombre.");
            hideConfirmButton();
            return;
        }

        await validateToken(currentToken);
    }

    $("confirmBtn")?.addEventListener("click", confirmEntry);
    $("startScannerBtn")?.addEventListener("click", startScanner);
    $("stopScannerBtn")?.addEventListener("click", stopScanner);
    $("staffSearchInput")?.addEventListener("input", (event) => {
        staffSearch = event.target.value || "";
        renderStaffGuests();
    });
    document.querySelectorAll("[data-staff-filter]").forEach((button) => {
        button.addEventListener("click", (event) => {
            document.querySelectorAll("[data-staff-filter]").forEach((item) => item.classList.remove("active"));
            event.currentTarget.classList.add("active");
            staffFilter = event.currentTarget.getAttribute("data-staff-filter") || "all";
            renderStaffGuests();
        });
    });

    init().catch((error) => {
        console.error("[Invittia Check-in] Error inicial:", error);
        setState("error", "Error de validacion", error.message || "No se pudo validar el QR.");
        hideConfirmButton();
    });
})();

