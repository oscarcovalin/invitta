(function () {
    function formatEventDate(value) {
        if (!value) return "";
        const formatter = new Intl.DateTimeFormat("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
        return formatter.format(new Date(value));
    }

    function getInviteUrl(event) {
        if (event.config && event.config.inviteUrl) return event.config.inviteUrl;
        const baseUrl = window.InvittiaSupabase.config.appUrl || window.location.origin;
        return `${baseUrl.replace(/\/$/, "")}/demos/${event.slug}/`;
    }

    function getDisplayName(event) {
        if (event.config && event.config.displayName) return event.config.displayName;
        return event.nombre || "Invittia";
    }

    async function loadDashboard() {
        const session = await window.InvittiaAuth.requireSession();
        if (!session) return null;

        const activeEvent = await window.InvittiaEventsService.getActiveEvent();
        if (!activeEvent) {
            return { session, event: null, guests: [] };
        }

        const guests = await window.InvittiaGuestsService.getActiveGuests(activeEvent.id);
        return { session, event: activeEvent, guests };
    }

    window.InvittiaDashboardData = {
        loadDashboard,
        formatEventDate,
        getInviteUrl,
        getDisplayName
    };
})();
