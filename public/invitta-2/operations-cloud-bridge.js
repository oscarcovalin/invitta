/**
 * Opt-in Supabase persistence for the existing seating and guest modules.
 * The visual engines remain local-first and are not rewritten here.
 */
(function () {
  'use strict';

  const projectId = new URLSearchParams(window.location.search).get('cloudProject');
  if (!projectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId)) return;

  const config = window.INVITTA2_CLOUD_CONFIG;
  if (!config || !window.supabase || typeof planner === 'undefined' || typeof gm === 'undefined') return;

  const state = {
    client: window.supabase.createClient(config.url, config.publishableKey),
    project: null,
    version: 0,
    applying: false,
    saving: false,
    saveTimer: null,
    active: false
  };

  function cloneSeatingState() {
    return {
      guests: JSON.parse(JSON.stringify(planner.state.guests || [])),
      tables: JSON.parse(JSON.stringify(planner.state.tables || []))
    };
  }

  function cloneGuestState() {
    const value = JSON.parse(JSON.stringify(gm.state || {}));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function createStatusBar() {
    const bar = document.createElement('aside');
    bar.id = 'operationsCloudStatus';
    bar.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:100000;display:flex;align-items:center;gap:10px;max-width:min(440px,calc(100vw - 36px));padding:10px 12px;border:1px solid rgba(163,128,71,.45);border-radius:14px;background:rgba(18,20,24,.96);box-shadow:0 16px 45px rgba(0,0,0,.38);color:#f5f0e6;font:600 11px Plus Jakarta Sans,sans-serif';

    const dot = document.createElement('span');
    dot.dataset.cloudDot = '';
    dot.style.cssText = 'width:8px;height:8px;border-radius:999px;background:#a38047;flex:none';

    const label = document.createElement('span');
    label.dataset.cloudLabel = '';
    label.style.cssText = 'flex:1;line-height:1.35';
    label.textContent = 'Consultando Mesas en nube…';

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.cloudAction = '';
    button.hidden = true;
    button.style.cssText = 'border:1px solid rgba(212,175,55,.55);border-radius:9px;padding:7px 10px;background:#a38047;color:white;font:700 10px Plus Jakarta Sans,sans-serif;cursor:pointer;white-space:nowrap';

    bar.append(dot, label, button);
    document.body.appendChild(bar);
    button.addEventListener('click', handleAction);
    return bar;
  }

  const statusBar = createStatusBar();

  function setStatus(message, tone = 'idle', action = null) {
    const colors = { idle: '#a38047', ready: '#10b981', saving: '#f59e0b', error: '#fb7185', locked: '#9ca3af' };
    statusBar.querySelector('[data-cloud-label]').textContent = message;
    statusBar.querySelector('[data-cloud-dot]').style.background = colors[tone] || colors.idle;
    const button = statusBar.querySelector('[data-cloud-action]');
    button.hidden = !action;
    button.textContent = action ? action.label : '';
    button.dataset.mode = action ? action.mode : '';
  }

  function validRemoteState(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function applyRemoteState(record) {
    if (!validRemoteState(record.seating_state) || !validRemoteState(record.guest_state)) {
      throw new Error('El estado de nube no tiene un formato válido.');
    }

    state.applying = true;
    try {
      planner.state = {
        guests: Array.isArray(record.seating_state.guests) ? record.seating_state.guests : [],
        tables: Array.isArray(record.seating_state.tables) ? record.seating_state.tables : [],
        draggedItem: null
      };
      gm.state = record.guest_state;
      planner.savePersistedState();
      gm.saveState();
      planner.render();
      if (typeof updateFooterStats === 'function') updateFooterStats();
      state.version = Number(record.version) || 1;
      state.active = true;
    } finally {
      state.applying = false;
    }
  }

  async function initialize() {
    try {
      const { data: sessionData, error: sessionError } = await state.client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setStatus('Inicia sesión en el Studio para conectar estas Mesas.', 'locked');
        return;
      }

      const { data: authData, error: authError } = await state.client.auth.getUser();
      if (authError || !authData.user) throw authError || new Error('Sesión no válida');

      const { data: project, error: projectError } = await state.client
        .from('invitation_projects')
        .select('id,name,status')
        .eq('id', projectId)
        .single();
      if (projectError) throw projectError;
      state.project = project;

      const { data: record, error: operationsError } = await state.client
        .from('invitation_operations')
        .select('project_id,seating_state,guest_state,version,updated_at')
        .eq('project_id', projectId)
        .maybeSingle();
      if (operationsError) throw operationsError;

      if (record) {
        applyRemoteState(record);
        const readOnly = project.status === 'archived';
        setStatus(
          `${project.name} · Mesas nube v${state.version}${readOnly ? ' · Solo lectura' : ''}`,
          readOnly ? 'locked' : 'ready',
          readOnly ? null : { mode: 'save', label: 'Guardar ahora' }
        );
        return;
      }

      if (project.status === 'archived') {
        setStatus(`${project.name} · Archivada sin datos de Mesas`, 'locked');
        return;
      }

      setStatus(
        `${project.name} · Mesas aún locales`,
        'idle',
        { mode: 'activate', label: 'Activar nube' }
      );
    } catch (error) {
      console.error('No fue posible conectar Mesas con Invitta Cloud:', error);
      setStatus('No se pudo conectar Mesas con la nube.', 'error', { mode: 'retry', label: 'Reintentar' });
    }
  }

  async function saveOperations(expectedVersion = state.version) {
    if (state.saving || !state.project || state.project.status === 'archived') return false;
    state.saving = true;
    setStatus(`${state.project.name} · Guardando Mesas…`, 'saving');

    try {
      const { data, error } = await state.client.rpc('save_invitation_operations', {
        p_project_id: projectId,
        p_expected_version: expectedVersion,
        p_seating_state: cloneSeatingState(),
        p_guest_state: cloneGuestState()
      });
      if (error) throw error;

      state.version = Number(data.version) || expectedVersion + 1;
      state.active = true;
      setStatus(`${state.project.name} · Mesas nube v${state.version}`, 'ready', { mode: 'save', label: 'Guardar ahora' });
      return true;
    } catch (error) {
      console.error('No fue posible guardar Mesas en la nube:', error);
      const conflict = error && (error.code === '40001' || /version conflict/i.test(error.message || ''));
      setStatus(
        conflict ? 'Otra pestaña guardó cambios. Recarga antes de continuar.' : 'Error al guardar Mesas en la nube.',
        'error',
        conflict ? { mode: 'reload', label: 'Recargar' } : { mode: 'save', label: 'Reintentar' }
      );
      return false;
    } finally {
      state.saving = false;
    }
  }

  function scheduleSave() {
    if (!state.active || state.applying || state.project?.status === 'archived') return;
    clearTimeout(state.saveTimer);
    setStatus(`${state.project.name} · Cambios pendientes…`, 'saving', { mode: 'save', label: 'Guardar ahora' });
    state.saveTimer = setTimeout(() => saveOperations(), 1200);
  }

  async function handleAction(event) {
    const mode = event.currentTarget.dataset.mode;
    if (mode === 'activate') {
      const accepted = window.confirm(
        `Vas a copiar a “${state.project.name}” el estado actual de Mesas e invitados.\n\n` +
        'Confirma únicamente si ya reemplazaste los datos de demostración.'
      );
      if (accepted) await saveOperations(0);
    } else if (mode === 'save') {
      clearTimeout(state.saveTimer);
      await saveOperations();
    } else if (mode === 'reload') {
      window.location.reload();
    } else if (mode === 'retry') {
      await initialize();
    }
  }

  window.addEventListener('seating:updated', scheduleSave);
  window.addEventListener('guests:updated', scheduleSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && state.active) {
      clearTimeout(state.saveTimer);
      saveOperations();
    }
  });

  initialize();
})();
