(function () {
  'use strict';

  let activeEvent = null;
  let guests = [];
  let currentSearch = '';
  let currentFilter = 'all';

  const $ = (id) => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[char]));
  }

  function normalizeStatus(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/_/g, ' ')
      .trim();
  }

  function isConfirmedGuest(guest) {
    const status = normalizeStatus(guest?.estado);
    return status.includes('confirmado') || status.includes('confirmada');
  }

  function isPendingGuest(guest) {
    return normalizeStatus(guest?.estado).includes('pendiente');
  }

  function isDeclinedGuest(guest) {
    const status = normalizeStatus(guest?.estado);
    return status.includes('no asistir') || status.includes('no asiste') || status.includes('no asistira');
  }

  function isCheckedInGuest(guest) {
    const value = guest?.checked_in ?? guest?.qr_status;
    if (typeof value === 'string') {
      const normalized = normalizeStatus(value);
      return Boolean(normalized) && !['false', 'no', '0', 'pendiente'].includes(normalized);
    }
    return Boolean(value);
  }

  function formatEventDate(value) {
    if (!value) return 'Fecha por definir';
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(value));
  }

  function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = String(value);
  }

  function getGuestName(guest) {
    return guest?.nombre || '';
  }

  function getGuestFamily(guest) {
    return guest?.familia || '-';
  }

  function getGuestTable(guest) {
    return guest?.mesa || '-';
  }

  function getAssignedPasses(guest) {
    return Number(guest?.pases_asignados ?? 0);
  }

  function getConfirmedPasses(guest) {
    return Number(guest?.pases_confirmados ?? 0);
  }

  function getActiveEvent() {
    if (window.InvittiaEventsService?.getActiveEvent) {
      return window.InvittiaEventsService.getActiveEvent();
    }

    const supabase = window.InvittiaSupabase.getClient();
    return supabase
      .from('eventos')
      .select('id, nombre, fecha_evento, estado')
      .eq('estado', 'activo')
      .order('fecha_evento', { ascending: true })
      .limit(1)
      .then(({ data, error }) => {
        if (error) throw error;
        return data && data.length ? data[0] : null;
      });
  }

  async function loadGuests() {
    if (!activeEvent?.id) {
      guests = [];
      return;
    }

    const supabase = window.InvittiaSupabase.getClient();
    const { data, error } = await supabase
      .from('invitados')
      .select('id, evento_id, nombre, familia, telefono, email, mesa, pases_asignados, pases_confirmados, estado, qr_status, checked_in, checked_in_at')
      .eq('evento_id', activeEvent.id)
      .order('nombre', { ascending: true });

    if (error) throw error;
    guests = Array.isArray(data) ? data : [];
  }

  function getMetrics() {
    const confirmed = guests.filter(isConfirmedGuest);
    const checkedIn = guests.filter(isCheckedInGuest);

    return {
      total: guests.length,
      confirmed: confirmed.length,
      pending: guests.filter(isPendingGuest).length,
      declined: guests.filter(isDeclinedGuest).length,
      passes: guests.reduce((sum, guest) => sum + getConfirmedPasses(guest), 0),
      checkedIn: checkedIn.length,
      pendingEntry: confirmed.filter((guest) => !isCheckedInGuest(guest)).length
    };
  }

  function renderEventHeader() {
    if (!activeEvent) {
      setText('eventTitle', 'Sin evento activo');
      setText('eventDate', 'Fecha por definir');
      setText('eventState', 'No hay evento activo');
      setText('eventSummary', 'Cuando exista un evento activo, aquí aparecerá el estado del anfitrión.');
      return;
    }

    const metrics = getMetrics();
    setText('eventTitle', activeEvent.nombre || 'Evento');
    setText('eventDate', formatEventDate(activeEvent.fecha_evento));
    setText('eventState', 'Solo lectura');
    setText('eventSummary', `${metrics.confirmed} confirmados, ${metrics.checkedIn} ya ingresaron y ${metrics.pendingEntry} pendientes de ingresar.`);
  }

  function renderMetrics() {
    const metrics = getMetrics();
    setText('metricTotal', metrics.total);
    setText('metricConfirmed', metrics.confirmed);
    setText('metricPending', metrics.pending);
    setText('metricDeclined', metrics.declined);
    setText('metricPasses', metrics.passes);
    setText('metricCheckedIn', metrics.checkedIn);
    setText('metricPendingEntry', metrics.pendingEntry);
  }

  function getStatusClass(guest) {
    if (isConfirmedGuest(guest)) return 'conf';
    if (isDeclinedGuest(guest)) return 'no';
    return 'pend';
  }

  function getStatusIcon(guest) {
    if (isConfirmedGuest(guest)) return 'fa-check';
    if (isDeclinedGuest(guest)) return 'fa-xmark';
    return 'fa-clock';
  }

  function applyFilters() {
    const search = normalizeStatus(currentSearch);

    return guests.filter((guest) => {
      const matchesSearch = !search
        || normalizeStatus(getGuestName(guest)).includes(search)
        || normalizeStatus(getGuestFamily(guest)).includes(search)
        || normalizeStatus(getGuestTable(guest)).includes(search);

      if (!matchesSearch) return false;
      if (currentFilter === 'confirmed') return isConfirmedGuest(guest);
      if (currentFilter === 'pending') return isPendingGuest(guest);
      if (currentFilter === 'declined') return isDeclinedGuest(guest);
      if (currentFilter === 'checked-in') return isCheckedInGuest(guest);
      if (currentFilter === 'pending-entry') return isConfirmedGuest(guest) && !isCheckedInGuest(guest);
      return true;
    });
  }

  function renderGuestList() {
    const list = $('guestList');
    const emptyState = $('emptyState');
    if (!list) return;

    const filteredGuests = applyFilters();
    list.innerHTML = filteredGuests.map((guest) => {
      const checkedIn = isCheckedInGuest(guest);
      const checkedInAt = formatDateTime(guest?.checked_in_at);

      return `
        <article class="guest-card">
          <div class="guest-card-header">
            <div>
              <div class="guest-name">${escapeHtml(getGuestName(guest) || 'Invitado sin nombre')}</div>
              <div class="guest-family">${escapeHtml(getGuestFamily(guest))}</div>
            </div>
            <span class="status-badge ${getStatusClass(guest)}"><i class="fa-solid ${getStatusIcon(guest)}"></i> ${escapeHtml(guest?.estado || 'Pendiente')}</span>
          </div>
          <div class="guest-details">
            <div class="detail-item"><span class="detail-label">Mesa</span><span class="detail-value">${escapeHtml(getGuestTable(guest))}</span></div>
            <div class="detail-item"><span class="detail-label">Pases</span><span class="detail-value">${escapeHtml(getConfirmedPasses(guest))} / ${escapeHtml(getAssignedPasses(guest))}</span></div>
            <div class="detail-item"><span class="detail-label">Check-in</span><span class="detail-value">${checkedIn ? 'Sí' : 'No'}</span></div>
            <div class="detail-item"><span class="detail-label">Hora de ingreso</span><span class="detail-value">${escapeHtml(checkedInAt || '-')}</span></div>
          </div>
        </article>`;
    }).join('');

    if (emptyState) emptyState.classList.toggle('hidden', filteredGuests.length > 0);
  }

  function renderAll() {
    renderEventHeader();
    renderMetrics();
    renderGuestList();
  }

  async function refreshData() {
    const refreshBtn = $('refreshBtn');
    if (refreshBtn) refreshBtn.disabled = true;

    try {
      activeEvent = await getActiveEvent();
      await loadGuests();
      renderAll();
    } catch (error) {
      console.error('[Invitta Host] No se pudo cargar el panel:', error);
      alert(error.message || 'No se pudo cargar el panel del anfitrión.');
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  function showAccessDenied() {
    $('accessDenied')?.style.setProperty('display', 'block');
    $('hostPanel')?.classList.add('hidden');
  }

  function bindEvents() {
    $('searchInput')?.addEventListener('input', (event) => {
      currentSearch = event.target.value || '';
      renderGuestList();
    });

    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
        currentFilter = event.currentTarget.getAttribute('data-filter') || 'all';
        renderGuestList();
      });
    });

    $('refreshBtn')?.addEventListener('click', refreshData);
    $('logoutBtn')?.addEventListener('click', async () => {
      try { await window.InvittiaAuth.signOut(); } catch (error) { console.error(error); }
    });
  }

  async function init() {
    const session = await window.InvittiaAuth.requireSession();
    if (!session) return;

    const roleInfo = await window.InvittiaAuth.getCurrentUserRole();
    if (!['owner', 'admin'].includes(roleInfo.role)) {
      showAccessDenied();
      return;
    }

    bindEvents();
    await refreshData();
  }

  init().catch((error) => {
    console.error('[Invitta Host] Error al iniciar:', error);
    showAccessDenied();
  });
})();
