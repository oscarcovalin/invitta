(function () {
    "use strict";

    const GUEST_SELECT = "id, evento_id, nombre, familia, telefono, email, mesa, pases_asignados, pases_confirmados, estado, qr_token, qr_status, checked_in, checked_in_at";

    let session = null;
    let currentGuest = null;
    let currentToken = "";
    let activeEvent = null;
    let staffGuests = [];
    let staffSearch = "";
    let staffFilter = "all";
    let qrScanner = null;
    let scannerRunning = false;
    let checkinSource = "manual";

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

    async function insertCheckin(entry) {
        const supabase = window.InvittiaSupabase.getClient();
        const { error } = await supabase.from("checkins").insert(entry);
        if (error) throw error;
    }

    async function tryInsertInvalidCheckin(token) {
        try {
            await insertCheckin({
                qr_token: token,
                scanned_by: session.user.id,
                status: "invalid",
                notes: "Token invalido desde pantalla manual"
            });
        } catch (error) {
            console.error("[Invittia Check-in] No se pudo insertar checkin invalid sin evento_id:", error);
        }
    }

    async function loadGuestByToken(token) {
        const supabase = window.InvittiaSupabase.getClient();
        const { data, error } = await supabase
            .from("invitados")
            .select(GUEST_SELECT)
            .eq("qr_token", token)
            .maybeSingle();

        return { data, error };
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
        const { data, error } = await supabase
            .from("invitados")
            .select(GUEST_SELECT)
            .eq("id", guestId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async function getActiveEvent() {
        if (window.InvittiaEventsService?.getActiveEvent) {
            return window.InvittiaEventsService.getActiveEvent();
        }

        const supabase = window.InvittiaSupabase.getClient();
        const { data, error } = await supabase
            .from("eventos")
            .select("id, nombre, fecha_evento, estado")
            .eq("estado", "activo")
            .order("fecha_evento", { ascending: true })
            .limit(1);

        if (error) throw error;
        return data && data.length ? data[0] : null;
    }

    async function loadStaffGuests() {
        const list = $("staffGuestList");
        const count = $("staffGuestCount");
        activeEvent = await getActiveEvent();

        if (!activeEvent?.id) {
            if (count) count.textContent = "No hay evento activo accesible.";
            if (list) list.innerHTML = "";
            return;
        }

        const supabase = window.InvittiaSupabase.getClient();
        const { data, error } = await supabase
            .from("invitados")
            .select(GUEST_SELECT)
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
                checkinSource = "manual";
                confirmGuestEntry(guest)
                    .catch((error) => {
                        console.error("[Invittia Check-in] Error en check-in manual:", error);
                        setState("error", "Error de check-in", "No se pudo confirmar la entrada.");
                    })
                    .finally(() => {
                        checkinSource = "manual";
                        button.disabled = false;
                    });
            });
        });
    }

    function renderGuestStatus(guest) {
        currentGuest = guest;
        showGuest(guest);

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

        setState("valid", "Pase valido", "Revisa los datos antes de confirmar la entrada.");
        showConfirmButton();
    }

    async function confirmGuestEntry(guest) {
        if (!guest) {
            setState("error", "Invitado invalido", "Selecciona un invitado valido para confirmar.");
            return null;
        }
        if (!guest.id) {
            setState("error", "Invitado invalido", "El invitado seleccionado no tiene un identificador valido.");
            return null;
        }
        if (!guest.evento_id) {
            setState("error", "Invitado invalido", "El invitado seleccionado no esta asociado a un evento.");
            return null;
        }
        if (!session?.user?.id) {
            setState("error", "Sesion no valida", "Inicia sesion de nuevo para confirmar entradas.");
            return null;
        }

        const supabase = window.InvittiaSupabase.getClient();
        const { data: currentGuestRecord, error: currentError } = await supabase
            .from("invitados")
            .select("id, evento_id, qr_token, qr_status, checked_in, checked_in_at")
            .eq("id", guest.id)
            .maybeSingle();

        if (currentError) {
            console.error("[Invittia Check-in] Error releyendo invitado:", currentError);
            setState("error", "Error de check-in", "No se pudo validar el estado actual del invitado.");
            return null;
        }

        if (!currentGuestRecord) {
            setState("error", "Invitado no encontrado", "Invitado no encontrado.");
            return null;
        }

        if (currentGuestRecord.checked_in === true || currentGuestRecord.qr_status === "used") {
            setState("warning", checkinSource === "qr" ? "QR ya utilizado" : "Ya ingreso", "Ya ingreso.");
            hideConfirmButton();
            await loadStaffGuests();
            return currentGuestRecord;
        }

        const { data: updatedGuest, error: updateError } = await supabase
            .from("invitados")
            .update({
                checked_in: true,
                checked_in_at: new Date().toISOString(),
                checked_in_by: session.user.id,
                qr_status: "used"
            })
            .eq("id", currentGuestRecord.id)
            .eq("evento_id", currentGuestRecord.evento_id)
            .select(GUEST_SELECT)
            .maybeSingle();

        if (updateError) {
            console.error("[Invittia Check-in] Error actualizando invitado:", updateError);
            setState("error", "Error de check-in", "No se pudo confirmar la entrada.");
            return null;
        }

        if (!updatedGuest) {
            setState("error", "Error de check-in", "No se pudo confirmar la entrada del invitado.");
            return null;
        }

        try {
            await insertCheckin({
                evento_id: updatedGuest.evento_id,
                invitado_id: updatedGuest.id,
                qr_token: updatedGuest.qr_token,
                scanned_by: session.user.id,
                status: "valid",
                notes: checkinSource === "qr" ? "Check-in confirmado desde QR" : "Check-in confirmado desde busqueda manual"
            });
        } catch (checkinError) {
            console.error("[Invittia Check-in] Entrada actualizada, pero fallo el registro en checkins:", checkinError);
            setState("warning", "Entrada confirmada", "La entrada quedo confirmada, pero no se pudo guardar el registro de auditoria.");
            currentGuest = updatedGuest;
            showGuest(updatedGuest);
            hideConfirmButton();
            await loadStaffGuests();
            return updatedGuest;
        }

        currentGuest = updatedGuest;
        showGuest(updatedGuest);
        setState("valid", "Ya ingreso", "Ya ingreso.");
        hideConfirmButton();
        await loadStaffGuests();
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

            if (guestHasEntered(latestGuest)) {
                currentGuest = latestGuest;
                showGuest(latestGuest);
                setState("warning", "QR ya utilizado", "Este pase ya fue registrado previamente.");
                hideConfirmButton();
                await loadStaffGuests();
                return;
            }

            checkinSource = "qr";
            await confirmGuestEntry(latestGuest);
        } catch (error) {
            console.error("[Invittia Check-in] Error confirmando entrada:", error);
            setState("error", "Error de check-in", "No se pudo confirmar la entrada.");
        } finally {
            checkinSource = "manual";
            if (button) button.disabled = false;
        }
    }

    async function init() {
        const access = await window.InvittiaAuth.requireRole(["owner", "admin", "staff"]);
        if (!access) return;
        session = access.session;

        await loadStaffGuests();

        currentToken = new URLSearchParams(window.location.search).get("token") || "";
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
