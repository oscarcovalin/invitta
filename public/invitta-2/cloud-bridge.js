(function initInvittaCloudBridge() {
  'use strict';

  const config = window.INVITTA2_CLOUD_CONFIG || {};
  const sdk = window.supabase;
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const MAGIC_LINK_COOLDOWN_MS = 60 * 1000;
  const magicLinkCooldownKey = `${config.authStorageKey || 'invitta-2-dev-auth'}:magic-link-requested-at`;
  const state = {
    client: null,
    session: null,
    projectId: null,
    designId: null,
    version: null,
    identity: null,
    projectStatus: null,
    loadingProject: false,
    cooldownTimer: null,
    pendingEmail: ''
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

  function studioRedirectUrl() {
    const fallback = `${window.location.origin}${window.location.pathname}`;
    const url = new URL(config.studioPublicBaseUrl || fallback, window.location.origin);
    const projectId = cloudProjectFromUrl();
    if (projectId) url.searchParams.set('cloudProject', projectId);
    return url.toString();
  }

  function magicLinkCooldownRemaining() {
    const requestedAt = Number(window.localStorage.getItem(magicLinkCooldownKey) || 0);
    return Math.max(0, MAGIC_LINK_COOLDOWN_MS - (Date.now() - requestedAt));
  }

  function refreshMagicLinkCooldown() {
    const modal = document.getElementById('invittaCloudModal');
    if (!modal || state.session) return;
    const submit = modal.querySelector('#invittaCloudSubmit');
    const resend = modal.querySelector('#invittaCloudResend');
    const message = modal.querySelector('#invittaCloudMessage');
    const remaining = magicLinkCooldownRemaining();
    if (!submit || !message) return;

    if (state.cooldownTimer) window.clearTimeout(state.cooldownTimer);
    if (!remaining) {
      if (state.pendingEmail && resend) resend.disabled = false;
      else submit.disabled = false;
      return;
    }

    if (state.pendingEmail && resend) resend.disabled = true;
    else submit.disabled = true;
    if (!state.pendingEmail || !modal.querySelector('#invittaCloudCode')?.value) {
      message.textContent = `Código enviado. Espera ${Math.ceil(remaining / 1000)} s antes de solicitar otro.`;
    }
    state.cooldownTimer = window.setTimeout(refreshMagicLinkCooldown, Math.min(1000, remaining));
  }

  function authCallbackError() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const code = hash.get('error_code');
    if (!code) return '';
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    if (code === 'otp_expired') return 'El enlace de acceso ya venció o fue usado. Solicita uno nuevo desde este Studio publicado.';
    return 'No se pudo completar el acceso. Solicita un enlace nuevo desde este Studio publicado.';
  }

  function projectName(projectData) {
    const data = projectData.config || {};
    if (data.eventType === 'boda') {
      return `Boda ${data.brideName || 'Novia'} & ${data.groomName || 'Novio'}`;
    }
    return `${data.eventType === 'xv' ? 'XV Años' : 'Evento'} ${data.name || 'Sin nombre'}`;
  }

  function normalizedEventType(value) {
    const allowed = ['boda', 'xv', 'bautizo', 'cumpleanos', 'corporativo', 'otro'];
    return allowed.includes(value) ? value : 'otro';
  }

  function projectIdentity(configValue) {
    const data = configValue || {};
    const eventType = normalizedEventType(data.eventType);
    const normalize = value => String(value || '').trim().toLocaleLowerCase('es-MX');
    if (eventType === 'boda') {
      return ['boda', normalize(data.brideName), normalize(data.groomName)].join('|');
    }
    return [eventType, normalize(data.name)].join('|');
  }

  function extensionForMime(mimeType) {
    const known = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'video/mp4': 'mp4',
      'video/webm': 'webm'
    };
    return known[mimeType] || 'bin';
  }

  async function sha256Hex(blob) {
    const digest = await window.crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('No se pudo leer el recurso'));
      reader.readAsDataURL(blob);
    });
  }

  async function mapConfigValues(value, transformString) {
    if (typeof value === 'string') return transformString(value);
    if (Array.isArray(value)) {
      return Promise.all(value.map(item => mapConfigValues(item, transformString)));
    }
    if (value && typeof value === 'object') {
      const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [
        key,
        await mapConfigValues(item, transformString)
      ]));
      return Object.fromEntries(entries);
    }
    return value;
  }

  async function prepareConfigForCloud(projectId, configValue) {
    const bucket = config.assetBucket;
    if (!bucket) return { config: clone(configValue), uploadedPaths: [] };
    const uploadedPaths = [];
    const cache = new Map();

    try {
      const cloudConfig = await mapConfigValues(configValue, async value => {
        if (!/^data:(image|audio|video)\/[a-z0-9.+-]+;base64,/i.test(value)) return value;
        if (cache.has(value)) return cache.get(value);

        const blob = await fetch(value).then(response => response.blob());
        const hash = await sha256Hex(blob);
        const path = `${projectId}/assets/${hash}.${extensionForMime(blob.type)}`;
        const reference = `storage://${bucket}/${path}`;
        const { error } = await state.client.storage.from(bucket).upload(path, blob, {
          contentType: blob.type || 'application/octet-stream',
          upsert: true
        });
        if (error) throw error;
        uploadedPaths.push(path);
        cache.set(value, reference);
        return reference;
      });
      return { config: cloudConfig, uploadedPaths };
    } catch (error) {
      if (uploadedPaths.length) {
        await state.client.storage.from(bucket).remove(uploadedPaths);
      }
      throw error;
    }
  }

  async function hydrateConfigFromCloud(configValue) {
    const bucket = config.assetBucket;
    if (!bucket) return clone(configValue);
    const prefix = `storage://${bucket}/`;
    const cache = new Map();

    return mapConfigValues(configValue, async value => {
      if (!value.startsWith(prefix)) return value;
      if (cache.has(value)) return cache.get(value);
      const path = value.slice(prefix.length);
      const { data, error } = await state.client.storage.from(bucket).download(path);
      if (error) throw error;
      const dataUrl = await blobToDataUrl(data);
      cache.set(value, dataUrl);
      return dataUrl;
    });
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
      .invitta-cloud-field input.invitta-cloud-code{letter-spacing:.3em;font-weight:800;text-align:center;font-size:18px}
      .invitta-cloud-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap}
      .invitta-cloud-actions button{border:1px solid #c9b991;border-radius:10px;padding:10px 14px;background:#fff;font:700 12px 'Plus Jakarta Sans',sans-serif;cursor:pointer}
      .invitta-cloud-actions button.primary{background:#202024;color:#fff;border-color:#202024}
      .invitta-cloud-message{min-height:18px;margin-top:10px!important;color:#8a641e!important}
      .invitta-cloud-projects{display:grid;gap:8px;margin:16px 0;max-height:220px;overflow:auto}
      .invitta-cloud-project{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:11px 12px;border:1px solid #e4ded2;border-radius:10px;background:#faf9f6;text-align:left;cursor:pointer}
      .invitta-cloud-project strong{display:block;font-size:12px;color:#202024}
      .invitta-cloud-project small{display:block;margin-top:3px;color:#777;font-size:10px}
      .invitta-cloud-project[disabled]{cursor:default;opacity:.62}
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
          <div class="invitta-cloud-field" id="invittaCloudCodeField" hidden>
            <label for="invittaCloudCode">Código de 6 dígitos</label>
            <input id="invittaCloudCode" class="invitta-cloud-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000">
          </div>
          <p class="invitta-cloud-message" id="invittaCloudMessage" aria-live="polite"></p>
          <div class="invitta-cloud-actions">
            <button type="button" data-cloud-close>Cancelar</button>
            <button type="button" id="invittaCloudResend" hidden>Reenviar código</button>
            <button type="submit" class="primary" id="invittaCloudSubmit">Enviar código de acceso</button>
          </div>
        </form>
        <div id="invittaCloudAccount" hidden>
          <p id="invittaCloudAccountText"></p>
          <div class="invitta-cloud-projects" id="invittaCloudProjects" aria-live="polite"></div>
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
    modal.querySelector('#invittaCloudLoginForm').addEventListener('submit', requestAccessCode);
    modal.querySelector('#invittaCloudResend').addEventListener('click', () => {
      const code = modal.querySelector('#invittaCloudCode');
      if (code) code.value = '';
      requestAccessCode();
    });
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
    if (state.session) loadProjectList();
  }

  function setAccessCodeStep(active) {
    const modal = ensureModal();
    const email = modal.querySelector('#invittaCloudEmail');
    const codeField = modal.querySelector('#invittaCloudCodeField');
    const code = modal.querySelector('#invittaCloudCode');
    const resend = modal.querySelector('#invittaCloudResend');
    const submit = modal.querySelector('#invittaCloudSubmit');
    if (!email || !codeField || !code || !resend || !submit) return;
    codeField.hidden = !active;
    email.readOnly = active;
    email.setAttribute('aria-readonly', String(active));
    resend.hidden = !active;
    submit.textContent = active ? 'Verificar código' : 'Enviar código de acceso';
    if (!active) {
      code.value = '';
      state.pendingEmail = '';
    }
  }

  async function loadProjectList() {
    const container = ensureModal().querySelector('#invittaCloudProjects');
    if (!container || !state.session) return;
    container.textContent = 'Cargando tus proyectos…';

    const { data, error } = await state.client
      .from('invitation_projects')
      .select('id,name,event_type,status,updated_at')
      .order('updated_at', { ascending: false });

    container.replaceChildren();
    if (error) {
      container.textContent = `No se pudieron cargar los proyectos: ${error.message}`;
      return;
    }
    if (!data || !data.length) {
      container.textContent = 'Todavía no hay proyectos guardados en la nube.';
      return;
    }

    data.forEach(project => {
      const button = document.createElement('button');
      const label = document.createElement('span');
      const name = document.createElement('strong');
      const detail = document.createElement('small');
      const current = project.id === state.projectId;
      button.type = 'button';
      button.className = 'invitta-cloud-project';
      button.disabled = current;
      name.textContent = project.name;
      detail.textContent = `${project.event_type.toUpperCase()} · ${project.status === 'archived' ? 'Archivado' : current ? 'Abierto' : 'Disponible'}`;
      label.append(name, detail);
      button.append(label);
      button.addEventListener('click', async () => {
        setProjectUrl(project.id);
        closeModal();
        await loadProject(project.id);
      });
      container.append(button);
    });
  }

  function openModal() {
    const modal = ensureModal();
    refreshModal();
    modal.classList.add('open');
    refreshMagicLinkCooldown();
    const focusTarget = state.session
      ? modal.querySelector('[data-cloud-close].primary')
      : state.pendingEmail ? modal.querySelector('#invittaCloudCode') : modal.querySelector('#invittaCloudEmail');
    if (focusTarget) focusTarget.focus();
  }

  function closeModal() {
    const modal = document.getElementById('invittaCloudModal');
    if (modal) modal.classList.remove('open');
  }

  async function requestAccessCode(event) {
    if (event) event.preventDefault();
    const modal = ensureModal();
    const emailInput = modal.querySelector('#invittaCloudEmail');
    const codeInput = modal.querySelector('#invittaCloudCode');
    const message = modal.querySelector('#invittaCloudMessage');
    const submit = modal.querySelector('#invittaCloudSubmit');
    const email = emailInput.value.trim();
    if (!email) return;

    const code = codeInput.value.trim();
    if (state.pendingEmail && code) {
      if (!/^\d{6}$/.test(code)) {
        message.textContent = 'Escribe el código de 6 dígitos que llegó a tu correo.';
        return;
      }
      submit.disabled = true;
      message.textContent = 'Verificando código…';
      const { data, error } = await state.client.auth.verifyOtp({ email: state.pendingEmail, token: code, type: 'email' });
      if (error || !data || !data.session) {
        submit.disabled = false;
        message.textContent = 'El código no es válido o ya venció. Solicita uno nuevo.';
        return;
      }
      state.session = data.session;
      setAccessCodeStep(false);
      message.textContent = '';
      setCloudStatus('Nube lista', '#1d8a55', 'Sesión activa en invitta-2-dev');
      refreshModal();
      const targetProject = cloudProjectFromUrl();
      if (targetProject) await loadProject(targetProject);
      return;
    }

    if (magicLinkCooldownRemaining()) {
      refreshMagicLinkCooldown();
      return;
    }

    submit.disabled = true;
    message.textContent = 'Enviando código seguro…';
    const { error } = await state.client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    if (error) {
      submit.disabled = false;
      const isRateLimit = /rate limit|too many|over_email_send_rate_limit/i.test(`${error.code || ''} ${error.message || ''}`);
      message.textContent = isRateLimit
        ? 'El correo integrado alcanzó su límite. Espera antes de intentarlo de nuevo; para uso continuo configuraremos SMTP propio.'
        : `No se pudo enviar: ${error.message}`;
      return;
    }

    window.localStorage.setItem(magicLinkCooldownKey, String(Date.now()));
    state.pendingEmail = email;
    setAccessCodeStep(true);
    message.textContent = 'Revisa tu correo y escribe aquí el código de 6 dígitos. El siguiente envío estará disponible en 60 s.';
    refreshMagicLinkCooldown();
    codeInput.focus();
  }

  async function signOut() {
    await state.client.auth.signOut();
    state.session = null;
    state.projectId = null;
    state.designId = null;
    state.version = null;
    state.identity = null;
    state.projectStatus = null;
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
      state.projectStatus = project.status;
      updateOperationalLinks(project.id);
      setCloudStatus('Cargando recursos…', '#b7791f', 'Recuperando recursos privados del proyecto');
      const hydratedConfig = await hydrateConfigFromCloud(design.config);
      state.identity = projectIdentity(hydratedConfig);
      studio().applyProject({
        projectId: project.id,
        config: hydratedConfig,
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
    updateOperationalLinks(projectId);
  }

  function updateOperationalLinks(projectId) {
    if (!UUID_PATTERN.test(projectId || '')) return;
    document.querySelectorAll('a[href^="organizador-mesas.html"]').forEach(link => {
      const target = new URL(link.getAttribute('href'), window.location.href);
      target.searchParams.set('cloudProject', projectId);
      link.setAttribute('href', `${target.pathname.split('/').pop()}${target.search}${target.hash}`);
    });
  }

  async function createCloudProject(projectData) {
    const userId = state.session.user.id;
    let prepared = null;
    const { data: project, error: projectError } = await state.client
      .from('invitation_projects')
      .insert({
        owner_id: userId,
        name: projectName(projectData),
        event_type: normalizedEventType(projectData.config.eventType),
        status: 'draft'
      })
      .select('id,name')
      .single();
    if (projectError) throw projectError;

    try {
      setCloudStatus('Guardando recursos…', '#b7791f', 'Protegiendo archivos en Storage privado');
      prepared = await prepareConfigForCloud(project.id, projectData.config);
    } catch (error) {
      await state.client.from('invitation_projects').delete().eq('id', project.id);
      throw error;
    }

    const { data: design, error: designError } = await state.client
      .from('invitation_designs')
      .insert({
        project_id: project.id,
        config: prepared.config,
        theme_name: projectData.themeName || 'vino',
        custom_theme: clone(projectData.customTheme || {}),
        created_by: userId,
        updated_by: userId
      })
      .select('id,version')
      .single();
    if (designError) {
      if (prepared.uploadedPaths.length) {
        await state.client.storage.from(config.assetBucket).remove(prepared.uploadedPaths);
      }
      await state.client.from('invitation_projects').delete().eq('id', project.id);
      throw designError;
    }

    state.projectId = project.id;
    state.designId = design.id;
    state.version = Number(design.version);
    state.identity = projectIdentity(projectData.config);
    state.projectStatus = 'draft';
    setProjectUrl(project.id);
  }

  async function save(projectData) {
    if (!state.client) return false;
    if (!state.session) {
      openModal();
      setCloudStatus('Conectar nube', '#b7791f', 'Inicia sesión para guardar en invitta-2-dev');
      return false;
    }

    const button = document.getElementById('btnExportJson');
    if (button) button.disabled = true;
    setCloudStatus('Guardando…', '#b7791f', 'Guardando una nueva versión');

    try {
      if (!state.projectId || !state.designId) {
        const createConfirmed = window.confirm(
          `Crear un proyecto nuevo en Invitta Cloud: “${projectName(projectData)}”?`
        );
        if (!createConfirmed) {
          setCloudStatus('Nube lista', '#1d8a55', 'Creación cancelada; no se guardaron cambios');
          notify('Creación de proyecto cancelada');
          return false;
        }
        await createCloudProject(projectData);
      } else if (state.projectStatus === 'archived') {
        const copyConfirmed = window.confirm(
          'Este proyecto está archivado. ¿Deseas guardar el diseño actual como un proyecto nuevo?'
        );
        if (!copyConfirmed) {
          setCloudStatus(`Nube v${state.version}`, '#1d8a55', 'Proyecto archivado; guardado cancelado');
          notify('El proyecto archivado no fue modificado');
          return false;
        }
        await createCloudProject(projectData);
      } else if (state.identity !== projectIdentity(projectData.config)) {
        const identityConfirmed = window.confirm(
          'Cambiaste el tipo de evento o sus protagonistas. ¿Guardar como un proyecto nuevo?'
        );
        if (!identityConfirmed) {
          setCloudStatus(`Nube v${state.version}`, '#1d8a55', 'Cambio de identidad cancelado');
          notify('El proyecto original no fue modificado');
          return false;
        }
        await createCloudProject(projectData);
      } else {
        setCloudStatus('Guardando recursos…', '#b7791f', 'Protegiendo archivos en Storage privado');
        const prepared = await prepareConfigForCloud(state.projectId, projectData.config);
        const { data, error } = await state.client.rpc('save_invitation_design', {
          p_design_id: state.designId,
          p_expected_version: state.version,
          p_config: prepared.config,
          p_theme_name: projectData.themeName || 'vino',
          p_custom_theme: clone(projectData.customTheme || {})
        });
        if (error) throw error;
        state.version = Number(data.version);
      }

      setCloudStatus(`Nube v${state.version}`, '#1d8a55', 'Guardado verificado en invitta-2-dev');
      notify(`Proyecto guardado en la nube · versión ${state.version}`);
      return true;
    } catch (error) {
      console.error('Invitta Cloud save error:', error);
      const conflict = error.code === '40001' || /version conflict/i.test(error.message || '');
      setCloudStatus(conflict ? 'Conflicto' : 'Error de nube', '#b42318', error.message);
      notify(conflict
        ? 'Existe una versión más reciente. Recarga antes de guardar.'
        : `No se pudo guardar en la nube: ${error.message}`);
      return false;
    } finally {
      if (button) button.disabled = false;
    }
  }

  function proposedSlug(project) {
    const configValue = project.config || {};
    const identity = configValue.eventType === 'boda'
      ? `${configValue.brideName || 'boda'} ${configValue.groomName || ''}`
      : `${configValue.eventType || 'evento'} ${configValue.name || ''}`;
    return identity.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'mi-evento';
  }

  async function publish() {
    if (!state.client || !state.session) {
      openModal();
      notify('Inicia sesión para publicar la invitación');
      return false;
    }
    try {
      const project = studio().getState();
      const saved = await save(project);
      if (!saved || !state.projectId || !state.designId || !window.TemplateEngine) {
        notify('No se publicó: primero hay que guardar el proyecto correctamente.');
        return false;
      }

      const slug = window.prompt('Elige el enlace público (solo minúsculas, números y guiones):', proposedSlug(project));
      if (!slug) return false;
      setCloudStatus('Publicando…', '#b7791f', 'Generando la invitación pública');
      const { data: published, error: publishError } = await state.client.rpc('publish_invitation_project', {
        p_project_id: state.projectId,
        p_slug: slug
      });
      if (publishError) throw publishError;
      const details = Array.isArray(published) ? published[0] : published;
      const html = window.TemplateEngine.generateHTML(project.config, project.themeName, project.customTheme, window.DECOR_ASSETS || {});
      const { error: uploadError } = await state.client.storage.from('invitta-2-published').upload(
        details.storage_path,
        new Blob([html], { type: 'text/html;charset=utf-8' }),
        { contentType: 'text/html;charset=utf-8', upsert: true }
      );
      if (uploadError) throw uploadError;
      const publicUrl = `${window.location.origin}/i/${encodeURIComponent(details.slug)}`;
      setCloudStatus('Publicada', '#1d8a55', 'Invitación publicada y lista para compartir');
      notify('Invitación publicada. Copia el enlace para compartirla.');
      window.prompt('Invitación publicada. Copia este enlace:', publicUrl);
      return true;
    } catch (error) {
      console.error('Invitta Cloud publish error:', error);
      setCloudStatus('Error al publicar', '#b42318', error.message || 'No se pudo publicar la invitación');
      notify(`No se pudo publicar: ${error.message || 'intenta de nuevo'}`);
      return false;
    }
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
        storageKey: config.authStorageKey || 'invitta-2-dev-auth',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    const callbackError = authCallbackError();

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
      if (cloudProjectFromUrl() || callbackError) {
        openModal();
        if (callbackError) {
          const message = ensureModal().querySelector('#invittaCloudMessage');
          if (message) message.textContent = callbackError;
        }
      }
    }

    const saveButton = document.getElementById('btnExportJson');
    if (saveButton) saveButton.title = 'Guardar una versión segura en Invitta Cloud';
  }

  window.InvittaCloudBridge = Object.freeze({
    save,
    publish,
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
