/**
 * Read-only Supabase adapter for the Portal project vault.
 * It deliberately keeps cloud metadata separate from the legacy local vault.
 */
(function () {
  'use strict';

  const state = {
    client: null,
    projects: [],
    status: 'idle',
    message: 'Nube pendiente'
  };

  function normalizeProject(project) {
    const design = Array.isArray(project.invitation_designs)
      ? project.invitation_designs[0]
      : project.invitation_designs;
    const eventType = project.event_type === 'boda' ? 'boda' : 'xv';
    const prefix = eventType === 'boda' ? /^Boda\s+/i : /^XV(?:\s+Años)?\s+/i;

    return {
      id: `cloud:${project.id}`,
      cloudProjectId: project.id,
      title: project.name,
      hosts: project.name.replace(prefix, '').trim() || project.name,
      eventType,
      status: project.status,
      version: Number(design && design.version) || 1,
      designState: (design && design.state) || 'draft',
      createdAt: project.created_at,
      lastModified: project.updated_at,
      source: 'cloud'
    };
  }

  async function load() {
    const config = window.INVITTA2_CLOUD_CONFIG;
    if (!config || !window.supabase || typeof window.supabase.createClient !== 'function') {
      state.status = 'unavailable';
      state.message = 'Nube no disponible';
      return [];
    }

    state.status = 'loading';
    state.message = 'Consultando nube…';

    try {
      state.client = state.client || window.supabase.createClient(config.url, config.publishableKey, {
        auth: {
          storageKey: config.authStorageKey || 'invitta-2-dev-auth',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      });
      const { data: sessionData, error: sessionError } = await state.client.auth.getSession();
      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        state.projects = [];
        state.status = 'signed-out';
        state.message = 'Abre el Studio para conectar la nube';
        return [];
      }

      const { data: authData, error: authError } = await state.client.auth.getUser();
      if (authError) throw authError;

      if (!authData.user) {
        state.projects = [];
        state.status = 'signed-out';
        state.message = 'Abre el Studio para conectar la nube';
        return [];
      }

      const { data, error } = await state.client
        .from('invitation_projects')
        .select('id,name,event_type,status,created_at,updated_at,invitation_designs(version,state)')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      state.projects = (data || []).map(normalizeProject);
      state.status = 'ready';
      state.message = `${state.projects.length} proyecto${state.projects.length === 1 ? '' : 's'} en nube`;
      return state.projects.slice();
    } catch (error) {
      console.error('No fue posible consultar la bóveda de nube:', error);
      state.projects = [];
      state.status = 'error';
      state.message = 'No se pudo consultar la nube';
      return [];
    }
  }

  window.InvittaCloudVault = Object.freeze({
    load,
    getAll: () => state.projects.slice(),
    getStatus: () => ({ status: state.status, message: state.message })
  });
})();
