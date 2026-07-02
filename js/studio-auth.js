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
