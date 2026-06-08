# Invittia Deployment

## Despliegue en Vercel

1. Subir el proyecto a un repositorio privado o publico en GitHub.
2. Entrar a Vercel e importar el repositorio.
3. Configurar el proyecto como sitio estatico. No se requiere build command si se sirve el HTML directamente.
4. Verificar que las rutas estaticas funcionen:
   - `/index.html`
   - `/administracion/login.html`
   - `/administracion/dashboard.html`
   - `/administracion/checkin.html`
   - `/assets/js/env.js`
5. Configurar el dominio de Vercel o dominio personalizado.
6. En Supabase Authentication, configurar Site URL con el dominio de produccion.
7. En Supabase Authentication, agregar Redirect URLs:
   - `https://TU-DOMINIO.vercel.app/administracion/login.html`
   - `https://TU-DOMINIO.vercel.app/administracion/dashboard.html`
   - `https://TU-DOMINIO.vercel.app/administracion/checkin.html`
8. Revisar que `assets/js/env.js` tenga solo valores publicos:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` o publishable key
9. Probar login con un usuario real de Supabase Auth.
10. Probar dashboard:
   - carga del evento activo
   - carga de invitados
   - crear, editar y eliminar invitado
   - generacion visual de QR
11. Probar check-in:
   - `/administracion/checkin.html?token=TOKEN_REAL`
   - busqueda manual
   - confirmar entrada
   - validacion de duplicados

## Advertencias de Produccion

- No usar `service_role`, secret keys, private keys ni `sb_secret` en frontend.
- El QR de produccion debe apuntar al dominio de Vercel o dominio personalizado, no a `127.0.0.1`.
- La camara para escaneo QR requiere HTTPS; debe probarse en Vercel o un dominio con TLS.
- Mantener RLS activo en Supabase.
- Si se cambia el dominio, revisar Redirect URLs en Supabase Auth.

## Variables Publicas

El frontend usa `assets/js/env.js` para configuracion publica del navegador:

```js
window.INVITTIA_ENV = {
  SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
  SUPABASE_ANON_KEY: "TU-PUBLISHABLE-KEY"
};
```

`assets/js/env.example.js` debe mantenerse con placeholders para documentar el formato sin exponer valores productivos sensibles.
