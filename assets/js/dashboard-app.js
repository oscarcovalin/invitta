(function () {
  'use strict';

  let guests = [];
  let activeEvent = null;
  let currentFilter = 'all';
  let currentSearch = '';
  let statsChart = null;
  let selectedGuest = null;
  let editingGuestId = null;

  const $ = (id) => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[char]));
  }

  function normalizeStatus(value) {
    const normalized = String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/_/g, ' ')
      .trim();

    if (normalized.includes('confirmado') || normalized.includes('confirmada')) return 'confirmado';
    if (normalized.includes('pendiente')) return 'pendiente';
    if (normalized.includes('no asistir') || normalized.includes('no asiste') || normalized.includes('no asistira')) return 'no_asistira';
    return normalized;
  }

  function getGuestStatus(g) { return g?.status ?? g?.estado ?? 'Pendiente'; }
  function getGuestName(g) { return g?.name ?? g?.nombre ?? ''; }
  function getGuestFamily(g) { return g?.family ?? g?.familia ?? ''; }
  function getGuestCompanions(g) { return Number(g?.companions ?? g?.pases_confirmados ?? g?.pases_asignados ?? 0); }
  function getGuestTable(g) { return g?.table ?? g?.mesa ?? '-'; }
  function getGuestEmail(g) { return g?.email ?? '-'; }
  function getGuestPhone(g) { return g?.phone ?? g?.telefono ?? '-'; }
  function getGuestNotes(g) { return g?.notes ?? g?.notas ?? '-'; }
  function getGuestAssigned(g) { return Number(g?.passesAssigned ?? g?.pases_asignados ?? getGuestCompanions(g)); }
  function getGuestConfirmed(g) { return Number(g?.passesConfirmed ?? g?.pases_confirmados ?? 0); }

  function isConfirmed(g) { return normalizeStatus(getGuestStatus(g)) === 'confirmado'; }
  function isPending(g) { return normalizeStatus(getGuestStatus(g)) === 'pendiente'; }
  function isDeclined(g) { return normalizeStatus(getGuestStatus(g)) === 'no_asistira'; }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = String(value);
  }

  function formatEventDate(value) {
    if (window.InvittiaDashboardData?.formatEventDate) {
      return window.InvittiaDashboardData.formatEventDate(value);
    }
    return value || 'Fecha por definir';
  }

  function updateEventSummary() {
    if (!activeEvent) return;
    const displayName = window.InvittiaDashboardData.getDisplayName(activeEvent);
    setText('eventTitle', activeEvent.nombre || displayName || 'Evento');
    setText('profileName', displayName || activeEvent.nombre || 'Invittia');
    setText('eventDate', formatEventDate(activeEvent.fecha_evento) || 'Fecha por definir');
    const inviteUrl = $('inviteUrl');
    if (inviteUrl) inviteUrl.value = window.InvittiaDashboardData.getInviteUrl(activeEvent);
  }

  function getStats() {
    const total = guests.length;
    const confirmed = guests.filter(isConfirmed).length;
    const pending = guests.filter(isPending).length;
    const declined = guests.filter(isDeclined).length;
    const companions = guests.reduce((sum, g) => sum + getGuestCompanions(g), 0);
    const tables = new Set(guests.map(getGuestTable).filter((t) => t && t !== '-')).size;
    return { total, confirmed, pending, declined, companions, tables };
  }

  function updateMetrics() {
    const stats = getStats();
    setText('count-total', stats.total);
    setText('count-conf', stats.confirmed);
    setText('count-pend', stats.pending);
    setText('count-no', stats.declined);
    setText('count-companions', stats.companions);
    setText('count-tables', stats.tables);
    setText('eventTotalMeta', `${stats.total} Invitados`);
    setText('eventConfirmedMeta', `${stats.confirmed} Confirmados`);
  }

  function getStatusClass(g) {
    if (isConfirmed(g)) return 'conf';
    if (isPending(g)) return 'pend';
    if (isDeclined(g)) return 'no';
    return 'pend';
  }

  function getStatusIcon(g) {
    if (isConfirmed(g)) return 'fa-check';
    if (isPending(g)) return 'fa-clock';
    return 'fa-xmark';
  }

  function getFilteredGuests() {
    const search = currentSearch.toLowerCase().trim();
    return guests.filter((g) => {
      const matchesFilter = currentFilter === 'all' || normalizeStatus(getGuestStatus(g)) === normalizeStatus(currentFilter);
      const matchesSearch = !search ||
        getGuestName(g).toLowerCase().includes(search) ||
        getGuestFamily(g).toLowerCase().includes(search);
      return matchesFilter && matchesSearch;
    });
  }

  function renderTable() {
    const tbody = $('tableBody');
    const emptyState = $('emptyState');
    if (!tbody) return;

    const rows = getFilteredGuests();
    tbody.innerHTML = rows.map((g) => {
      const status = getGuestStatus(g);
      return `
        <tr data-guest-id="${escapeHtml(g.id)}">
          <td>
            <div class="guest-name">${escapeHtml(getGuestName(g))}</div>
            <div class="guest-family">${escapeHtml(getGuestFamily(g))}</div>
          </td>
          <td><span class="status-badge ${getStatusClass(g)}"><i class="fa-solid ${getStatusIcon(g)}"></i> ${escapeHtml(status)}</span></td>
          <td>${escapeHtml(getGuestCompanions(g))}</td>
          <td>${escapeHtml(getGuestTable(g))}</td>
          <td>${isConfirmed(g) ? '<button class="qr-btn" type="button">Ver QR</button>' : '<span style="color:#A09A94;font-size:0.85rem;">No disp.</span>'}</td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('tr').forEach((row) => {
      row.addEventListener('click', () => {
        const guest = guests.find((g) => String(g.id) === String(row.dataset.guestId));
        if (guest) openDrawer(guest);
      });

      row.querySelector('.qr-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        const guest = guests.find((g) => String(g.id) === String(row.dataset.guestId));
        if (guest) openQrModal(guest);
      });
    });

    if (emptyState) emptyState.style.display = rows.length ? 'none' : 'block';
  }

  function updateChart() {
    const stats = getStats();
    const canvas = $('statsChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const data = [stats.confirmed, stats.pending, stats.declined];

    if (statsChart) {
      statsChart.data.datasets[0].data = data;
      statsChart.update();
      return;
    }

    statsChart = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Confirmados', 'Pendientes', 'No asistirán'],
        datasets: [{ data, backgroundColor: ['#4CAF50', '#FF9800', '#E53935'], borderWidth: 0 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: { legend: { position: 'right' } }
      }
    });
  }

  function refreshDashboard() {
    updateMetrics();
    renderTable();
    updateChart();
  }

  function exportGuestsCsv() {
    const headers = ['Nombre', 'Familia', 'Estado', 'Acompañantes', 'Mesa', 'Email', 'Teléfono', 'Notas'];
    const rows = guests.map((g) => [
      getGuestName(g), getGuestFamily(g), getGuestStatus(g), getGuestCompanions(g), getGuestTable(g), getGuestEmail(g), getGuestPhone(g), getGuestNotes(g)
    ]);
    const escapeCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'invitados.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function getQrImageUrl(guest) {
    const token = guest.qrToken || guest.qr_token;
    if (!token) {
      console.error('[Invitta QR] Invitado sin qr_token', guest);
      return null;
    }

    const checkinUrl = `${window.location.origin}/administracion/checkin.html?token=${encodeURIComponent(token)}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkinUrl)}`;

    console.log('[Invitta QR] token:', token);
    console.log('[Invitta QR] checkinUrl:', checkinUrl);
    console.log('[Invitta QR] qrImageUrl:', qrImageUrl);

    return { token, qrImageUrl };
  }

  function renderQrImage(guest, imageId, tokenId = null) {
    const qr = getQrImageUrl(guest);
    if (!qr) {
      const imageEl = $(imageId);
      if (imageEl) {
        imageEl.style.backgroundImage = '';
        imageEl.style.display = 'none';
      }
      if (tokenId) {
        const tokenEl = $(tokenId);
        if (tokenEl) {
          tokenEl.textContent = '';
          tokenEl.style.display = 'none';
        }
      }
      return null;
    }

    const imageEl = $(imageId);
    if (imageEl) {
      imageEl.style.backgroundImage = `url("${qr.qrImageUrl}")`;
      imageEl.style.display = 'block';
    }

    if (tokenId) {
      const tokenEl = $(tokenId);
      if (tokenEl) {
        tokenEl.textContent = qr.token;
        tokenEl.style.display = 'inline-block';
      }
    }

    return qr;
  }

  function openQrModal(guest) {
    const qr = renderQrImage(guest, 'qrImage');
    if (!qr) return;

    setText('qrName', getGuestName(guest));
    const qrDetails = $('qrDetails');
    if (qrDetails) {
      qrDetails.innerHTML = `Mesa ${escapeHtml(getGuestTable(guest))} &middot; ${escapeHtml(getGuestCompanions(guest))} Acompa&ntilde;ante(s)<br>${escapeHtml(qr.token)}`;
    }
    $('qrModal')?.classList.add('active');
  }

  function openDrawer(g) {
    selectedGuest = g;
    setText('dwName', getGuestName(g));
    setText('dwTable', getGuestTable(g));
    setText('dwCompanions', getGuestCompanions(g));
    setText('dwAssigned', getGuestAssigned(g));
    setText('dwConfirmed', getGuestConfirmed(g));
    setText('dwDate', g?.date ?? g?.confirmed_at ?? '-');
    setText('dwPhone', getGuestPhone(g));
    setText('dwEmail', getGuestEmail(g));
    setText('dwNotes', getGuestNotes(g));
    renderQrImage(g, 'dwQrImg', 'dwQrId');
    const dwStatus = $('dwStatus');
    if (dwStatus) {
      dwStatus.innerHTML = `<span class="status-badge ${getStatusClass(g)}"><i class="fa-solid ${getStatusIcon(g)}"></i> ${escapeHtml(getGuestStatus(g))}</span>`;
    }
    $('drawerOverlay')?.classList.add('active');
    $('guestDrawer')?.classList.add('active');
  }

  function closeDrawer() {
    selectedGuest = null;
    $('drawerOverlay')?.classList.remove('active');
    $('guestDrawer')?.classList.remove('active');
  }

  function switchTab(tabId, btnContext) {
    document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach((pane) => pane.classList.remove('active'));
    btnContext?.classList.add('active');
    $(`tab-${tabId}`)?.classList.add('active');
  }

  function copyUrl() {
    const input = $('inviteUrl');
    if (!input) return;
    input.select();
    document.execCommand('copy');
    alert('Enlace copiado al portapapeles.');
  }

  function setInputValue(id, value) {
    const input = $(id);
    if (input) input.value = value === '-' ? '' : String(value ?? '');
  }

  function fillGuestForm(g) {
    setInputValue('guestNameInput', getGuestName(g));
    setInputValue('guestFamilyInput', getGuestFamily(g));
    setInputValue('guestPhoneInput', getGuestPhone(g));
    setInputValue('guestEmailInput', getGuestEmail(g));
    setInputValue('guestTableInput', getGuestTable(g));
    setInputValue('guestAssignedInput', getGuestAssigned(g));
    setInputValue('guestConfirmedInput', getGuestConfirmed(g));
    setInputValue('guestStatusInput', getGuestStatus(g));
    setInputValue('guestNotesInput', getGuestNotes(g));
  }

  function openGuestForm(g = null) {
    resetGuestForm();
    editingGuestId = g?.id || null;
    if (g) fillGuestForm(g);
    $('guestFormModal')?.classList.add('active');
  }

  function closeGuestForm() {
    $('guestFormModal')?.classList.remove('active');
    editingGuestId = null;
  }

  function resetGuestForm() {
    const form = $('guestForm');
    if (form) form.reset();
    const assignedInput = $('guestAssignedInput');
    const confirmedInput = $('guestConfirmedInput');
    const statusInput = $('guestStatusInput');
    if (assignedInput) assignedInput.value = '1';
    if (confirmedInput) confirmedInput.value = '0';
    if (statusInput) statusInput.value = 'Pendiente';
  }

  function getInputValue(id) {
    return $(id)?.value?.trim() || '';
  }

  function getGuestFormPayload() {
    return {
      nombre: getInputValue('guestNameInput'),
      familia: getInputValue('guestFamilyInput'),
      telefono: getInputValue('guestPhoneInput'),
      email: getInputValue('guestEmailInput'),
      mesa: getInputValue('guestTableInput'),
      pases_asignados: getInputValue('guestAssignedInput'),
      pases_confirmados: getInputValue('guestConfirmedInput'),
      estado: $('guestStatusInput')?.value || 'Pendiente',
      notas: getInputValue('guestNotesInput')
    };
  }

  async function reloadDashboardData() {
    const dashboard = await window.InvittiaDashboardData.loadDashboard();
    activeEvent = dashboard?.event || null;
    guests = Array.isArray(dashboard?.guests) ? dashboard.guests : [];
    updateEventSummary();
    refreshDashboard();
  }

  async function handleGuestFormSubmit(event) {
    event.preventDefault();
    if (!activeEvent?.id) {
      alert('No hay evento activo para guardar invitados.');
      return;
    }
    if (editingGuestId === '') {
      alert('Falta el invitado a editar.');
      return;
    }

    const payload = getGuestFormPayload();
    if (!payload.nombre) {
      alert('El nombre del invitado es obligatorio.');
      return;
    }

    const submitBtn = $('guestFormSubmitBtn');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (editingGuestId) {
        await window.InvittiaGuestsService.updateGuest(activeEvent.id, editingGuestId, payload);
      } else {
        await window.InvittiaGuestsService.createGuest(activeEvent.id, payload);
      }
      closeGuestForm();
      resetGuestForm();
      await reloadDashboardData();
      closeDrawer();
    } catch (error) {
      console.error('[Invittia] Error guardando invitado:', error);
      alert(error.message || 'No se pudo crear el invitado.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async function handleDeleteGuest() {
    if (!activeEvent?.id) {
      alert('No hay evento activo para eliminar invitados.');
      return;
    }
    if (!selectedGuest?.id) {
      alert('No hay invitado seleccionado para eliminar.');
      return;
    }

    const confirmed = window.confirm(`¿Eliminar a ${getGuestName(selectedGuest)}?`);
    if (!confirmed) return;

    try {
      await window.InvittiaGuestsService.deleteGuest(activeEvent.id, selectedGuest.id);
      closeDrawer();
      await reloadDashboardData();
    } catch (error) {
      console.error('[Invittia] Error eliminando invitado:', error);
      alert(error.message || 'No se pudo eliminar el invitado.');
    }
  }

  function bindEvents() {
    $('searchInput')?.addEventListener('input', (event) => {
      currentSearch = event.target.value || '';
      renderTable();
    });
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
        currentFilter = event.currentTarget.getAttribute('data-filter') || 'all';
        renderTable();
      });
    });
    $('exportBtn')?.addEventListener('click', exportGuestsCsv);
    $('addGuestBtn')?.addEventListener('click', () => openGuestForm(null));
    $('editGuestBtn')?.addEventListener('click', () => {
      if (!selectedGuest) return;
      openGuestForm(selectedGuest);
    });
    $('guestFormCloseBtn')?.addEventListener('click', closeGuestForm);
    $('guestForm')?.addEventListener('submit', handleGuestFormSubmit);
    $('deleteGuestBtn')?.addEventListener('click', handleDeleteGuest);
    $('logoutBtn')?.addEventListener('click', async () => {
      try { await window.InvittiaAuth.signOut(); } catch (e) { console.error(e); }
    });
  }

  async function init() {
    const access = await window.InvittiaAuth.requireRole(["owner", "admin"], {
      staffRedirect: "/administracion/checkin.html",
      signOutOnMissingRole: true
    });
    if (!access) return;

    const dashboard = await window.InvittiaDashboardData.loadDashboard();
    activeEvent = dashboard?.event || null;
    guests = Array.isArray(dashboard?.guests) ? dashboard.guests : [];
    updateEventSummary();
    refreshDashboard();
    bindEvents();
  }

  window.switchTab = switchTab;
  window.copyUrl = copyUrl;
  window.closeDrawer = closeDrawer;
  window.closeQrModal = function () { $('qrModal')?.classList.remove('active'); };

  init().catch((error) => {
    console.error('[Invittia] Error al iniciar dashboard:', error);
    alert(error.message || 'No se pudo cargar el dashboard.');
  });
})();
