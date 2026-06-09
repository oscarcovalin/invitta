# Invittia - Variables de entorno

La arquitectura actual es HTML/CSS/JS estático, por lo que Vercel no inyecta variables de entorno automáticamente en el navegador sin un proceso de build. Para Fase 1 se usa un archivo runtime:

```txt
assets/js/env.js
```

Variables necesarias:

```js
window.INVITTIA_ENV = {
  SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
  SUPABASE_ANON_KEY: "TU_SUPABASE_ANON_KEY",
  INVITTIA_APP_URL: "https://tu-dominio.vercel.app",
  INVITTIA_DEFAULT_EVENT_ID: ""
};
```

Notas:

- `SUPABASE_URL` y `SUPABASE_ANON_KEY` son públicas y seguras para el navegador cuando RLS está activo.
- No colocar `SUPABASE_SERVICE_ROLE_KEY` en archivos públicos.
- `INVITTIA_DEFAULT_EVENT_ID` es opcional. Si está vacío, el dashboard carga el primer evento visible para el usuario autenticado.
- Para Vercel, subir `assets/js/env.js` con los valores del entorno correspondiente.

