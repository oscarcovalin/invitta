(function initInvittaCloudBridge() {
  'use strict';

  const config = window.INVITTA2_CLOUD_CONFIG || {};
  const sdk = window.supabase;
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const state = {
    client: null,
    session: null,
    projectId: null,
    designId: null,
    version: null,
    loadingProject: false
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function studio() {
    return window.InvittaStudio;
  }

  function notify(message) {
    if (studio() && typeof studio().notify === 'function') studio().notify(message);
  }

  function indicator() {
    return {
      root: document.getElementById('syncStatusIndicator'),
      text: document.getElementById('syncStatusText'),
      dot: document.querySelector('#syncStatusIndicator .sync-dot')
    };
  }

  function setCloudStatus(text, color, title) {
    const ui = indicator();
    if (ui.text) ui.text.textContent = text;
    if (ui.dot && color) ui.dot.style.backgroundColor = color;
    if (ui.root) {
      ui.root.title = title || text;
      ui.root.setAttribute('aria-label', title || text);
    }
  }

  function cloudProjectFromUrl() {
    const value = new URLSearchParams(window.location.search).get('cloudProject');
    return value && UUID_PATTERN.test(value) ? value : null;
  }

  function projectName(projectData) {
    const data = projectData.config || {};
    if (data.eventType === 'boda') {
      return `Boda ${data.brideName || 'Novia'} & ${data.groomName || 'Novio'}`;
    }
    return `${data.eventType === 'xv' ? 'XV Años' : 'Evento'} ${data.name || 'Sin nombre'}`;
  }

  function ensureModal() {
    let modal = document.getElementById('invittaCloudModal');
    if (modal) return modal;

    const style = document.createElement('style');
    style.textContent = `
      .invitta-cloud-modal{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(10,10,12,.72);backdrop-filter:blur(8px)}
      .invitta-cloud-modal.open{display:flex}
      .invitta-cloud-card{width:min(430px,100%);background:#fff;border:1px solid rgba(163,128,71,.35);border-radius:18px;box-shadow:0 28px 80px rgba(0,0,0,.35);padding:24px;font-family:'Plus Jakarta Sans',sans-serif;color:#202024}
      .invitta-cloud-card h2{margin:0 0 8px;font-family:'Bodoni Moda',serif;font-size:26px}
      .invitta-cloud-card p{margin:0 0 18px;color:#666;line-height:1.55;font-size:13px}
      .invitta-cloud-field{display:flex;flex-direction:column;gap:7px;margin:15px 0}
      .invitta-cloud-field label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      .invitta-cloud-field input{height:44px;border:1px solid #d7d2c8;border-radius:10px;padding:0 12px;font:inherit}
      .invitta-cloud-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap}
      .invitta-cloud-actions button{border:1px solid #c9b991;border-radius:10px;padding:10px 14px;background:#fff;font:700 12px 'Plus Jakarta Sans',sans-serif;cursor:pointer}
      .invitta-cloud-actions button.primary{background:#202024;color:#fff;border-color:#202024}
      .invitta-cloud-message{min-height:18px;margin-top:10px!important;color:#8a641e!important}
    `;
    document.head.appendChild(style);

    modal = document.createElement('div');
    modal.id = 'invittaCloudModal';
    modal.className = 'invitta-cloud-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'invittaCloudTitle');
    modal.innerHTML = `
      <section class="invitta-cloud-card">
        <h2 id="invittaCloudTitle">Invitta Cloud</h2>
        <p id="invittaCloudDescription">Conecta este Studio con el entorno independiente de Supabase. El diseño y la exportación no cambian.</p>
        <form id="invittaCloudLoginForm">
          <div class="invitta-cloud-field">
            <label for="invittaCloudEmail">Correo de acceso</label>
            <input id="invittaCloudEmail" type="email" autocomplete="email" required placeholder="tu@correo.com">
          </div>
          <p class="invitta-cloud-message" id="invittaCloudMessage" aria-live="polite"></p>
          <div class="invitta-cloud-actions">
            <button type="button" data-cloud-close>Cancelar</button>
            <button type="submit" class="primary">Enviar enlace de acceso</button>
          </div>
        </form>
        <div id="invittaCloudAccount" hidden>
          <p id="invittaCloudAccountText"></p>
          <div class="invitta-cloud-actions">
            <button type="button" id="invittaCloudSignOut">Cerrar sesión</button>
            <button type="button" class="primary" data-cloud-close>Continuar diseñando</button>
          </div>
        </div>
      </section>`;
    document.body.appendChild(modal);

    modal.querySelectorAll('[data-cloud-close]').forEach(button => {
      button.addEventListener('click', closeModal);
    });
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });
    modal.querySelector('#invittaCloudLoginForm').addEventListener('submit', requestMagicLink);
    modal.querySelector('#invittaCloudSignOut').addEventListener('click', signOut);
    return modal;
  }

  function refreshModal() {
    const modal = ensureModal();
    const form = modal.querySelector('#invittaCloudLoginForm');
    const account = modal.querySelector('#invittaCloudAccount');
    const accountText = modal.querySelector('#invittaCloudAccountText');
    const email = state.session && state.session.user ? state.session.user.email : '';
    form.hidden = Boolean(state.session);
    account.hidden = !state.session;
    if (accountText) {
      accountText.textContent = email
        ? `Conectado como ${email}. Los guardados se enviarán a invitta-2-dev.`
        : 'Sesión segura activa en invitta-2-dev.';
    }
  }

  function openModal() {
    const modal = ensureModal();
    refreshModal();
    modal.classList.add('open');
    const focusTarget = state.session
      ? modal.querySelector('[data-cloud-close].primary')
      : modal.querySelector('#invittaCloudEmail');
    if (focusTarget) focusTarget.focus();
  }

  function closeModal() {
    const modal = document.getElementById('invittaCloudModal');
    if (modal) modal.classList.remove('open');
  }

  async function requestMagicLink(event) {
    event.preventDefault();
    const modal = ensureModal();
    const emailInput = modal.querySelector('#invittaCloudEmail');
    const message = modal.querySelector('#invittaCloudMessage');
    const submit = event.submitter;
    const email = emailInput.value.trim();
    if (!email) return;

    submit.disabled = true;
    message.textContent = 'Enviando enlace seguro…';
    const redirectUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const { error } = await state.client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl, shouldCreateUser: true }
    });
    submit.disabled = false;
    message.textContent = error
      ? `No se pudo enviar: ${error.message}`
      : 'Revisa tu correo y abre el enlace de acceso en este navegador.';
  }

  async function signOut() {
    await state.client.auth.signOut();
    state.session = null;
    state.projectId = null;
    state.designId = null;
    state.version = null;
    setCloudStatus('Solo local', '#b7791f', 'Haz clic para conectar Invitta Cloud');
    refreshModal();
  }

  async function loadProject(projectId) {
    if (!state.session || state.loadingProject || !UUID_PATTERN.test(projectId)) return;
    state.loadingProject = true;
    setCloudStatus('Cargando nube…', '#b7791f', 'Cargando proyecto desde invitta-2-dev');

    try {
      const { data: project, error: projectError } = await state.client
        .from('invitation_projects')
        .select('id,name,event_type,status')
        .eq('id', projectId)
        .single();
      if (projectError) throw projectError;

      const { data: design, error: designError } = await state.client
        .from('invitation_designs')
        .select('id,project_id,config,theme_name,custom_theme,version,state')
        .eq('project_id', project.id)
        .single();
      if (designError) throw designError;

      state.projectId = project.id;
      state.designId = design.id;
      state.version = Number(design.version);
      studio().applyProject({
        projectId: project.id,
        config: design.config,
        themeName: design.theme_name,
        customTheme: design.custom_theme
      });
      setCloudStatus(`Nube v${state.version}`, '#1d8a55', `Proyecto ${project.name} conectado`);
      notify('Proyecto cargado desde Invitta Cloud');
    } catch (error) {
      console.error('Invitta Cloud load error:', error);
      setCloudStatus('Error de nube', '#b42318', 'No se pudo cargar el proyecto');
      notify(`No se pudo cargar desde la nube: ${error.message}`);
    } finally {
      state.loadingProject = false;
    }
  }

  function setProjectUrl(projectId) {
    const url = new URL(window.location.href);
    url.searchParams.delete('project');
    url.searchParams.delete('proj');
    url.searchParams.delete('id');
    url.searchParams.set('cloudProject', projectId);
    window.history.replaceState({}, '', url);
  }

  async function createCloudProject(projectData) {
    const userId = state.session.user.id;
    const { data: project, error: projectError } = await state.client
      .from('invitation_projects')
      .insert({
        owner_id: userId,
        name: projectName(projectData),
        event_type: projectData.config.eventType || 'otro',
        status: 'draft'
      })
      .select('id,name')
      .single();
    if (projectError) throw projectError;

    const { data: design, error: designError } = await state.client
      .from('invitation_designs')
      .insert({
        project_id: project.id,
        config: clone(projectData.config),
        theme_name: projectData.themeName || 'vino',
        custom_theme: clone(projectData.customTheme || {}),
        created_by: userId,
        updated_by: userId
      })
      .select('id,version')
      .single();
    if (designError) {
      await state.client.from('invitation_projects').delete().eq('id', project.id);
      throw designError;
    }

    state.projectId = project.id;
    state.designId = design.id;
    state.version = Number(design.version);
    setProjectUrl(project.id);
  }

  async function save(projectData) {
    if (!state.client) return false;
    if (!state.session) {
      openModal();
      setCloudStatus('Conectar nube', '#b7791f', 'Inicia sesión para guardar en invitta-2-dev');
      return true;
    }

    const button = document.getElementById('btnExportJson');
    if (button) button.disabled = true;
    setCloudStatus('Guardando…', '#b7791f', 'Guardando una nueva versión');

    try {
      if (!state.projectId || !state.designId) {
        await createCloudProject(projectData);
      } else {
        const { data, error } = await state.client.rpc('save_invitation_design', {
          p_design_id: state.designId,
          p_expected_version: state.version,
          p_config: clone(projectData.config),
          p_theme_name: projectData.themeName || 'vino',
          p_custom_theme: clone(projectData.customTheme || {})
        });
        if (error) throw error;
        state.version = Number(data.version);
      }

      setCloudStatus(`Nube v${state.version}`, '#1d8a55', 'Guardado verificado en invitta-2-dev');
      notify(`Proyecto guardado en la nube · versión ${state.version}`);
    } catch (error) {
      console.error('Invitta Cloud save error:', error);
      const conflict = error.code === '40001' || /version conflict/i.test(error.message || '');
      setCloudStatus(conflict ? 'Conflicto' : 'Error de nube', '#b42318', error.message);
      notify(conflict
        ? 'Existe una versión más reciente. Recarga antes de guardar.'
        : `No se pudo guardar en la nube: ${error.message}`);
    } finally {
      if (button) button.disabled = false;
    }
    return true;
  }

  async function initialize() {
    const ui = indicator();
    if (ui.root) {
      ui.root.tabIndex = 0;
      ui.root.setAttribute('role', 'button');
      ui.root.addEventListener('click', openModal);
      ui.root.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openModal();
        }
      });
    }

    if (!sdk || typeof sdk.createClient !== 'function' || !config.url || !config.publishableKey) {
      setCloudStatus('Solo local', '#b7791f', 'Invitta Cloud no está configurado');
      return;
    }

    state.client = sdk.createClient(config.url, config.publishableKey, {
      auth: {
        storageKey: 'invitta-2-dev-auth',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    const { data, error } = await state.client.auth.getSession();
    if (error) console.warn('Invitta Cloud session error:', error);
    state.session = data ? data.session : null;

    state.client.auth.onAuthStateChange((event, session) => {
      state.session = session;
      if (session) {
        setCloudStatus('Nube lista', '#1d8a55', 'Sesión activa en invitta-2-dev');
        const targetProject = cloudProjectFromUrl();
        if (targetProject && targetProject !== state.projectId) {
          window.setTimeout(() => loadProject(targetProject), 0);
        }
      } else {
        setCloudStatus('Solo local', '#b7791f', 'Haz clic para conectar Invitta Cloud');
      }
      refreshModal();
    });

    if (state.session) {
      setCloudStatus('Nube lista', '#1d8a55', 'Sesión activa en invitta-2-dev');
      const targetProject = cloudProjectFromUrl();
      if (targetProject) await loadProject(targetProject);
    } else {
      setCloudStatus('Solo local', '#b7791f', 'Haz clic para conectar Invitta Cloud');
      if (cloudProjectFromUrl()) openModal();
    }

    const saveButton = document.getElementById('btnExportJson');
    if (saveButton) saveButton.title = 'Guardar una versión segura en Invitta Cloud';
  }

  window.InvittaCloudBridge = Object.freeze({
    save,
    open: openModal,
    reload() {
      const targetProject = cloudProjectFromUrl() || state.projectId;
      return targetProject ? loadProject(targetProject) : Promise.resolve();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
