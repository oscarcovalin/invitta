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

  function getGuestToken(guest) {
    return String(guest.qrToken || guest.qr_token || '').trim();
  }

  function isVipEvent() {
    const config = activeEvent?.config || {};
    return config.qrAccessEnabled === true
      || config.packageTier === 'vip'
      || String(config.templateId || '').endsWith('-vip');
  }

  function updateVipAccessControls() {
    const button = $('vipCheckinButton');
    if (!button) return;
    button.hidden = !isVipEvent();
    if (isVipEvent() && activeEvent?.id) {
      button.href = `/administracion/checkin.html?event_id=${encodeURIComponent(activeEvent.id)}`;
    }
  }

  function getGuestInvitationUrl(guest) {
    const token = getGuestToken(guest);
    if (!activeEvent?.slug || !token) return '';
    const url = new URL('/invitacion.html', window.location.origin);
    url.searchParams.set('slug', activeEvent.slug);
    url.searchParams.set('g', token);
    return url.toString();
  }

  async function copyGuestInvitation() {
    if (!selectedGuest) return;
    const url = getGuestInvitationUrl(selectedGuest);
    if (!url) {
      alert('No hay un enlace personalizado disponible para este invitado.');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('Enlace personalizado copiado.');
    } catch (error) {
      console.error('[Invitta] No se pudo copiar el enlace:', error);
      alert('No se pudo copiar el enlace personalizado.');
    }
  }

  async function attachGuestQrTokens() {
    if (!activeEvent?.id || !guests.length) return;

    const supabase = window.InvittiaSupabase.getClient();
    const { data, error } = await supabase
      .from('invitados')
      .select('id, qr_token')
      .eq('evento_id', activeEvent.id);

    if (error) {
      console.error('[Invitta QR] No se pudieron cargar qr_token de invitados', error);
      return;
    }

    const tokensByGuestId = new Map((data || []).map((row) => [String(row.id), row.qr_token]));
    guests = guests.map((guest) => ({
      ...guest,
      qr_token: guest.qr_token || tokensByGuestId.get(String(guest.id)) || ''
    }));
  }

  function showQrUnavailable(guest) {
    setText('qrName', getGuestName(guest) || 'QR no disponible');
    const qrDetails = $('qrDetails');
    if (qrDetails) qrDetails.textContent = 'No hay un token QR disponible para este invitado.';
    const qrImage = $('qrImage');
    if (qrImage) {
      qrImage.style.backgroundImage = '';
      qrImage.style.display = 'none';
    }
    $('qrModal')?.classList.add('active');
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
    updateVipAccessControls();
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
          <td>${isVipEvent()
            ? (getGuestToken(g) ? `<button class="qr-btn" type="button" data-action="view-qr" data-guest-id="${escapeHtml(g.id)}">Ver QR</button>` : '<span style="color:#A09A94;font-size:0.85rem;">No disp.</span>')
            : '<span style="color:#A09A94;font-size:0.85rem;">Solo VIP</span>'}</td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('tr').forEach((row) => {
      row.addEventListener('click', () => {
        const guest = guests.find((g) => String(g.id) === String(row.dataset.guestId));
        if (guest) openDrawer(guest);
      });

      row.querySelector('.qr-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        const guestId = event.currentTarget.getAttribute('data-guest-id') || row.dataset.guestId;
        const guest = guests.find((g) => String(g.id) === String(guestId));
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

  function getGuestCheckIn(g) {
    const value = g?.checkedIn ?? g?.checked_in ?? g?.checkin ?? g?.check_in ?? g?.ingreso ?? getGuestCheckInTime(g);
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      if (!normalized || ['false', 'no', '0'].includes(normalized)) return 'No';
      return 'Sí';
    }
    return value ? 'Sí' : 'No';
  }

  function getGuestCheckInTime(g) {
    return g?.checkedInAt ?? g?.checked_in_at ?? g?.checkin_at ?? g?.check_in_at ?? g?.ingreso_at ?? g?.hora_ingreso ?? '';
  }

  function escapeCsvValue(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  function downloadCsv(filename, headers, rows) {
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function sortGuestsByTableAndName(list) {
    return [...list].sort((a, b) => {
      const tableA = getGuestTable(a);
      const tableB = getGuestTable(b);
      const numericA = Number(tableA);
      const numericB = Number(tableB);
      const bothNumeric = Number.isFinite(numericA) && Number.isFinite(numericB);
      const tableCompare = bothNumeric
        ? numericA - numericB
        : String(tableA).localeCompare(String(tableB), 'es', { numeric: true, sensitivity: 'base' });

      if (tableCompare !== 0) return tableCompare;
      return getGuestName(a).localeCompare(getGuestName(b), 'es', { sensitivity: 'base' });
    });
  }

  const exportDefinitions = {
    complete: {
      filename: 'invitta-lista-completa.csv',
      headers: ['Nombre', 'Familia', 'Teléfono', 'Email', 'Mesa', 'Pases asignados', 'Pases confirmados', 'Estado RSVP', 'Check-in', 'Hora de ingreso'],
      getRows: () => guests.map((g) => [
        getGuestName(g),
        getGuestFamily(g),
        getGuestPhone(g),
        getGuestEmail(g),
        getGuestTable(g),
        getGuestAssigned(g),
        getGuestConfirmed(g),
        getGuestStatus(g),
        getGuestCheckIn(g),
        getGuestCheckInTime(g)
      ])
    },
    access: {
      filename: 'invitta-lista-acceso.csv',
      headers: ['Nombre', 'Familia', 'Mesa', 'Pases confirmados', 'Check-in', 'Hora de ingreso'],
      getRows: () => guests.map((g) => [
        getGuestName(g),
        getGuestFamily(g),
        getGuestTable(g),
        getGuestConfirmed(g),
        getGuestCheckIn(g),
        getGuestCheckInTime(g)
      ])
    },
    tables: {
      filename: 'invitta-lista-por-mesa.csv',
      headers: ['Mesa', 'Nombre', 'Familia', 'Pases confirmados', 'Estado RSVP', 'Check-in'],
      getRows: () => sortGuestsByTableAndName(guests).map((g) => [
        getGuestTable(g),
        getGuestName(g),
        getGuestFamily(g),
        getGuestConfirmed(g),
        getGuestStatus(g),
        getGuestCheckIn(g)
      ])
    },
    confirmed: {
      filename: 'invitta-confirmados.csv',
      headers: ['Nombre', 'Familia', 'Teléfono', 'Mesa', 'Pases confirmados', 'Check-in'],
      getRows: () => guests.filter(isConfirmed).map((g) => [
        getGuestName(g),
        getGuestFamily(g),
        getGuestPhone(g),
        getGuestTable(g),
        getGuestConfirmed(g),
        getGuestCheckIn(g)
      ])
    },
    pending: {
      filename: 'invitta-pendientes.csv',
      headers: ['Nombre', 'Familia', 'Teléfono', 'Mesa', 'Pases asignados', 'Estado RSVP'],
      getRows: () => guests.filter(isPending).map((g) => [
        getGuestName(g),
        getGuestFamily(g),
        getGuestPhone(g),
        getGuestTable(g),
        getGuestAssigned(g),
        getGuestStatus(g)
      ])
    }
  };

  function exportGuestsCsv(exportType) {
    const definition = exportDefinitions[exportType];
    if (!definition) return;

    const rows = definition.getRows();
    if (!rows.length) {
      alert('No hay invitados para exportar en esta lista.');
      return;
    }

    downloadCsv(definition.filename, definition.headers, rows);
  }

  function getQrImageUrl(guest) {
    if (!isVipEvent()) return null;
    const token = getGuestToken(guest);
    if (!token) {
      console.error('[Invitta QR] Invitado sin qr_token', guest);
      return null;
    }

    const checkinUrl = `${window.location.origin}/administracion/checkin.html?event_id=${encodeURIComponent(activeEvent.id)}&token=${encodeURIComponent(token)}`;
    return { token, checkinUrl };
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
      imageEl.style.backgroundImage = '';
      // QRCode can finish appending its image asynchronously. Render into a
      // fresh, isolated mount so a repeated click cannot append a second QR
      // over the one already visible in the modal.
      const qrMount = document.createElement('div');
      qrMount.className = 'qr-render-target';
      qrMount.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
      imageEl.replaceChildren(qrMount);
      imageEl.style.display = 'block';
      if (typeof window.QRCode !== 'function') {
        console.error('[Invitta QR] La libreria local de QR no esta disponible.');
        imageEl.style.display = 'none';
        return null;
      }
      const qrSize = Math.max(120, Math.min(220, imageEl.clientWidth || 220));
      try {
        new window.QRCode(qrMount, {
          text: qr.checkinUrl,
          width: qrSize,
          height: qrSize,
          colorDark: '#171411',
          colorLight: '#ffffff',
          // Medium correction reliably fits the authenticated invitation URL.
          correctLevel: window.QRCode.CorrectLevel.M
        });
      } catch (error) {
        console.error('[Invitta QR] No fue posible generar el codigo QR.', error);
        imageEl.innerHTML = '';
        imageEl.style.display = 'none';
        return null;
      }
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
    if (!isVipEvent()) {
      alert('El pase QR y el control de acceso estan disponibles solo en invitaciones VIP.');
      return;
    }
    const qr = renderQrImage(guest, 'qrImage');
    if (!qr) {
      showQrUnavailable(guest);
      return;
    }

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
    const drawerQr = document.querySelector('.drawer-qr');
    if (drawerQr) drawerQr.hidden = !isVipEvent();
    if (isVipEvent()) renderQrImage(g, 'dwQrImg', 'dwQrId');
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
    if (!activeEvent) {
      throw new Error('No se encontro el evento solicitado o tu cuenta no tiene acceso.');
    }
    guests = Array.isArray(dashboard?.guests) ? dashboard.guests : [];
    await attachGuestQrTokens();
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
    document.querySelectorAll('[data-export-type]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        exportGuestsCsv(event.currentTarget.getAttribute('data-export-type'));
      });
    });
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
    const requestedEventId = new URLSearchParams(window.location.search).get("event_id");
    const access = await window.InvittiaAuth.requireRole(["owner", "admin"], {
      eventId: requestedEventId,
      staffRedirect: "/administracion/checkin.html",
      signOutOnMissingRole: true
    });
    $('copyGuestInvitationBtn')?.addEventListener('click', copyGuestInvitation);
    if (!access) return;

    const dashboard = await window.InvittiaDashboardData.loadDashboard();
    activeEvent = dashboard?.event || null;
    if (!activeEvent) {
      throw new Error('No se encontro el evento solicitado o tu cuenta no tiene acceso.');
    }
    guests = Array.isArray(dashboard?.guests) ? dashboard.guests : [];
    await attachGuestQrTokens();
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
