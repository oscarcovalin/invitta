/**
 * studio-auth.js
 * Manejo de autenticación para Invitta Studio MVP
 */

(function () {
  "use strict";

  const SUPABASE_URL = (window.INVITTIA_ENV && window.INVITTIA_ENV.SUPABASE_URL) || "";
  const SUPABASE_KEY = (window.INVITTIA_ENV && window.INVITTIA_ENV.SUPABASE_ANON_KEY) || "";

  let db;
  try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    console.error("Error al inicializar Supabase Auth:", e);
    return;
  }

  // Objeto global de autenticación para Studio
  window.studioAuth = {
    db: db,
    
    // Iniciar sesión
    login: async function(email, password) {
      const { data, error } = await db.auth.signInWithPassword({
        email: email,
        password: password,
      });
      return { data, error };
    },

    // Cerrar sesión
    logout: async function() {
      await db.auth.signOut();
      window.location.href = "/administracion/studio-login.html";
    },

    // Obtener sesión actual
    getSession: async function() {
      const { data, error } = await db.auth.getSession();
      return data.session;
    },

    // Resuelve un Studio válido incluso si la base aún no tiene la RPC más nueva.
    resolveStudioContext: async function(preferredStudioId) {
      const selectPreferredStudio = (studios) => {
        const list = Array.isArray(studios) ? studios.filter(Boolean) : [];
        return list.find((studio) => studio.studio_id === preferredStudioId) || list[0] || null;
      };

      let latestError = null;

      try {
        const { data, error } = await db.rpc("list_invitta_studios");
        const studio = selectPreferredStudio(data);
        if (!error && studio) return { studio, error: null };
        latestError = error || latestError;
      } catch (error) {
        latestError = error;
      }

      try {
        const { data, error } = await db.rpc("current_invitta_studio");
        const legacyStudio = Array.isArray(data) ? data[0] : null;
        if (!error && legacyStudio) {
          return {
            studio: {
              studio_id: legacyStudio.id,
              studio_name: legacyStudio.name,
              studio_role: "owner"
            },
            error: null
          };
        }
        latestError = error || latestError;
      } catch (error) {
        latestError = error;
      }

      try {
        const session = await this.getSession();
        if (session?.user?.id) {
          const { data, error } = await db
            .from("studios")
            .select("id, name")
            .eq("user_id", session.user.id)
            .limit(1);
          const legacyStudio = Array.isArray(data) ? data[0] : null;
          if (!error && legacyStudio) {
            return {
              studio: {
                studio_id: legacyStudio.id,
                studio_name: legacyStudio.name,
                studio_role: "owner"
              },
              error: null
            };
          }
          latestError = error || latestError;
        }
      } catch (error) {
        latestError = error;
      }

      return { studio: null, error: latestError };
    },

    // Proteger ruta (Redirigir si no hay sesión)
    requireSession: async function() {
      const session = await this.getSession();
      if (!session) {
        window.location.href = "/administracion/studio-login.html";
        return null;
      }
      return session;
    },

    // Redirigir si ya hay sesión (Para la página de login)
    redirectIfSession: async function() {
      const session = await this.getSession();
      if (session) {
        window.location.href = "/administracion/studio-dashboard.html";
        return true;
      }
      return false;
    }
  };
})();
