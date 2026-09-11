# Documentación Invitta 1.0 (Legacy)

## Invitación Activa: Keiry-XV

Esta es una de las invitaciones legacy críticas que se mantiene activa en el sistema actual y tiene requerimientos estrictos para su correcto funcionamiento.

- **URL Pública**: [https://invitta.vercel.app/invitacion.html?slugeKeiry-XV](https://invitta.vercel.app/invitacion.html?slug=Keiry-XV)
- **Tabla en Supabase**: `studio_invitations`

### Campos Críticos en Supabase

Para que el motor de invitaciones renderice visualmente los datos desde Supabase de forma correcta, el registro en la base de datos debe cumplir con las siguientes reglas:

- `slug` = `Keiry-XV` *(El motor soporta variaciones case-insensitive, pero este es el canónico)*
- `published` = `true` *(Si es false, mostrará mensaje de que la invitación no está publicada)*
- `expires_at` = `NULL` o fecha futura *(Si la fecha pasó, denegará el acceso**
- `template_id` = `xv-rose-gold-premium` *(**CRÍTICO**: Si este campo es `null` o incorrecto, el motor JS fallará al intentar renderizar la plantilla y provocará problemas visuales graves o una pantalla estática, aunque la URL responda 200 OK).*

### Mecanismo de Emergencia (Fallback Local)

Debido a la posible inestabilidad o agotamiento de recursos en Supabase, se implementó un mecanismo de fallback local robusto exclusivo para esta invitación:

1. Si la función Serverless (`api/invitation-meta.js`) sufre un timeout de Supabase (3.5s), abortará la solicitud externa para evitar devolver un 504 a nivel de Vercel y entregará el HTML fuente.
2. El cliente ejecutará el motor JS (`main-invitation.js`), intentará cargar la invitación de la BD. Si falla por timeout o error, identificará si el slug es `keiry-xv`.
3. Si lo es, descargará de inmediato el archivo de respaldo:
   `/data/legacy-invitations/keiry-xv.json`
4. Este JSON estático (que incluye `template_id = "xv-rose-gold-premium"`) garantiza que la invitación renderice para el invitado, asegurando cero interrupciones en el servicio.

## Verificaciones Mantenimiento

Para asegurar que todo funciona antes de cualquier despliegue importante, ejecuta el script de validación especializado:

```bash
node scripts/check-keiry-slug.js
```