/**
 * invitation-public.js
 * Invitta Studio - Página pública de invitación
 *
 * URL: /invitacion.html?slug=paola-xv&n=Familia+Garcia&p=4&m=5
 * Tabla: studio_invitations (SELECT anon, published = true)
 *
 * Solo lectura. No modifica tablas. No requiere autenticación.
 *
 * NOTA: Este script se carga al final del <body>, por lo que el DOM ya
 * está listo. No se usa DOMContentLoaded para evitar que el evento
 * ya haya disparado antes de que se registre el listener.
 */

import { supabase as db } from './api/supabase-client.js';

(function () {
  "use strict";

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Supabase ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  // Supabase importado desde module
  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Parámetros de URL ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  var params    = new URLSearchParams(window.location.search);
  var slug      = params.get("slug") || "";
  var studioPreview = params.get("preview") === "studio";
  var guestName = sanitize(params.get("n") || "");
  var maxPasses = clampInt(params.get("p"), 1, 20);
  var tableNum  = sanitize(params.get("m") || "");
  var guestToken = sanitize(params.get("g") || "");

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Iniciar ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  if (!slug) {
    showError("No se encontro el slug de la invitacion.");
  } else {
    loadInvitation();
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Carga ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  async function loadInvitation() {
    try {
      // console.log("slug recibido:", slug);

      if (studioPreview) {
        var sessionResult = await db.auth.getSession();
        var session = sessionResult.data && sessionResult.data.session;

        if (sessionResult.error || !session) {
          showError("La vista previa requiere una sesion activa de Invitta Studio.");
          return;
        }
      }

      var query = db
        .from("studio_invitations")
        .select("*")
        .eq("slug", slug);

      if (!studioPreview) {
        query = query.eq("published", true);
      }

      var result = await query.maybeSingle();

      var data  = result.data;
      var error = result.error;

      // console.log("data invitación:", data);
      // console.log("error Supabase:", error);

      if (error) {
        console.error("Error real de Supabase:", error);
        showError("Error al consultar la invitacion.");
        return;
      }

      if (!data) {
        showError(studioPreview
          ? "No se pudo cargar este borrador con la sesion actual."
          : "Invitacion no encontrada o no publicada.");
        return;
      }

      if (!studioPreview && data.expires_at) {
        var expirationTime = Date.parse(data.expires_at);
        if (Number.isFinite(expirationTime) && expirationTime <= Date.now()) {
          showError("Esta invitacion ya no esta disponible.");
          return;
        }
      }

      if (guestToken) {
        var guestResult = await db.rpc("get_public_invitation_guest", {
          invitation_slug: slug,
          guest_token: guestToken
        });
        if (guestResult.error || !guestResult.data) {
          console.error("Enlace personalizado no valido:", guestResult.error);
          showError("Este enlace personalizado no es valido o ya no esta disponible.");
          return;
        }

        var guestData = guestResult.data;
        guestName = sanitize([guestData.name, guestData.family].filter(Boolean).join(" "));
        maxPasses = clampInt(guestData.passes, 1, 20);
        tableNum = sanitize(guestData.table || "");
      }
      // console.log("Antes de renderInvitation");
      try {
        renderInvitation(data);
      } catch (renderError) {
        showInvitationError(renderError);
        return;
      }
      // console.log("Despues de renderInvitation");

    } catch (err) {
      console.error("Error real en loadInvitation:", err);
      showInvitationError(err);
    }
  }

  function normalizeVisualTheme(value) {
    const allowedThemes = [
      "rose-floral",
      "gold-marble",
      "elegant-lavender",
      "black-luxury",
      "classic-champagne"
    ];
    if (!value || !allowedThemes.includes(value)) {
      return "rose-floral";
    }
    return value;
  }

  function applyVisualTheme(invitation) {
    const visualTheme = normalizeVisualTheme(invitation.visual_theme);
    document.body.classList.remove(
      "theme-rose-floral",
      "theme-gold-marble",
      "theme-elegant-lavender",
      "theme-black-luxury",
      "theme-classic-champagne"
    );
    document.body.classList.add(`theme-${visualTheme}`);
  }

  
  function getSectionIcon(type) {
    const icons = {
      parents: '<svg viewBox="0 0 24 24"><path d="M12 22c4-4 8-8 8-13A6 6 0 0 0 4 9c0 5 4 9 8 13z"/><path d="M12 22V12"/><path d="M12 12c-2-2-4-3-4-3s2 1 4 3z"/><path d="M12 12c2-2 4-3 4-3s-2 1-4 3z"/></svg>',
      ceremony: '<svg viewBox="0 0 24 24"><path d="M12 3L4 9v12h16V9l-8-6z"/><path d="M12 11v10"/><path d="M9 16h6"/></svg>',
      'inv-pass-block': getSectionIcon('pass'),
      'inv-rsvp-block': getSectionIcon('rsvp'),
      'inv-music-player': getSectionIcon('music')
    };

    for (const id in map) {
      const el = document.getElementById(id);
      if (el) {
        const iconContainer = el.querySelector('.inv-card-icon, .inv-section-icon, .music-icon');
        if (iconContainer) {
          iconContainer.innerHTML = map[id];
        }
      }
    }
    
    // Fallback for general cards that don't have these specific IDs but have the classes
    document.querySelectorAll('.inv-card-icon, .inv-section-icon').forEach(container => {
        if(!container.innerHTML.includes('<svg')) {
           container.innerHTML = getSectionIcon('parents');
        }
    });
  }

  
  function getPremiumSectionIcon(type) {
    const icons = {
      parents: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 13c2.5-1.8 3.6-3.8 2.8-5.2C14 6.4 12.6 6.5 12 8c-.6-1.5-2-1.6-2.8-.2C8.4 9.2 9.5 11.2 12 13Z"/>
  <path d="M12 13c-2.8.5-5 .1-5.7-1.4-.7-1.5.2-2.7 1.8-2.6"/>
  <path d="M12 13c2.8.5 5 .1 5.7-1.4.7-1.5-.2-2.7-1.8-2.6"/>
  <path d="M12 13v7"/>
  <path d="M12 17c-2.2 0-3.8 1-5 3"/>
  <path d="M12 17c2.2 0 3.8 1 5 3"/>
</svg>`,
      ceremony: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 3v4"/>
  <path d="M10.5 5h3"/>
  <path d="M5.5 21V10.5L12 6l6.5 4.5V21"/>
  <path d="M9 21v-5a3 3 0 0 1 6 0v5"/>
  <path d="M5.5 13.5h13"/>
</svg>`,
      reception: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M8 3h4v5a4 4 0 0 1-8 0V3h4"/>
  <path d="M8 12v7"/>
  <path d="M5.5 19h5"/>
  <path d="M16 3h4v5a4 4 0 0 1-8 0V3h4"/>
  <path d="M16 12v7"/>
  <path d="M13.5 19h5"/>
</svg>`,
      itinerary: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M16.5 14.5A6.5 6.5 0 0 1 9.5 5a7.5 7.5 0 1 0 7 9.5Z"/>
  <path d="M18.5 4.5l.5 1.4 1.5.5-1.5.5-.5 1.4-.5-1.4-1.5-.5 1.5-.5.5-1.4Z"/>
</svg>`,
      dresscode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M9 3h6"/>
  <path d="M10 3c0 2-1 3.5-3 5l2 4-2 9h10l-2-9 2-4c-2-1.5-3-3-3-5"/>
  <path d="M9 12h6"/>
</svg>`,
      gifts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M4 10h16v10H4z"/>
  <path d="M3 7h18v3H3z"/>
  <path d="M12 7v13"/>
  <path d="M12 7s-4.5.2-4.5-2.2C7.5 3.6 8.4 3 9.4 3 11.2 3 12 7 12 7Z"/>
  <path d="M12 7s4.5.2 4.5-2.2C16.5 3.6 15.6 3 14.6 3 12.8 3 12 7 12 7Z"/>
</svg>`,
      hashtag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M9 4 7 20"/>
  <path d="M17 4l-2 16"/>
  <path d="M4 9h16"/>
  <path d="M3 15h16"/>
  <path d="M19 5l.5 1.4 1.5.5-1.5.5L19 9l-.5-1.6-1.5-.5 1.5-.5L19 5Z"/>
</svg>`,
      pass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5v-2Z"/>
  <path d="M10 8.5h4"/>
  <path d="M9 12h6"/>
  <path d="M10 15.5h4"/>
</svg>`,
      rsvp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 20s-7-4.2-8.8-8.2C1.8 8.7 3.6 6 6.6 6c1.7 0 3 1 3.9 2.2C11.4 7 12.7 6 14.4 6c3 0 4.8 2.7 3.4 5.8C16 15.8 12 20 12 20Z"/>
  <path d="m9.5 12.2 1.6 1.6 3.4-3.6"/>
</svg>`,
      music: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 3l1.4 5.1L18.5 10l-5.1 1.9L12 17l-1.4-5.1L5.5 10l5.1-1.9L12 3Z"/>
  <path d="M19 16l.6 2.1L22 19l-2.4.9L19 22l-.6-2.1L16 19l2.4-.9L19 16Z"/>
</svg>`, // music icon requested not explicitly, using default or something similar if needed
      default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 3l1.4 5.1L18.5 10l-5.1 1.9L12 17l-1.4-5.1L5.5 10l5.1-1.9L12 3Z"/>
  <path d="M19 16l.6 2.1L22 19l-2.4.9L19 22l-.6-2.1L16 19l2.4-.9L19 16Z"/>
</svg>`
    };
    return icons[type] || icons.default;
  }

  function injectPremiumIcons() {
    const map = {
      'inv-parents-block': getPremiumSectionIcon('parents'),
      'inv-ceremony-block': getPremiumSectionIcon('ceremony'),
      'inv-reception-block': getPremiumSectionIcon('reception'),
      'inv-itinerary-section': getPremiumSectionIcon('itinerary'),
      'inv-dresscode-block': getPremiumSectionIcon('dresscode'),
      'inv-gifts-block': getPremiumSectionIcon('gifts'),
      'inv-hashtag-block': getPremiumSectionIcon('hashtag'),
      'inv-pass-section': getPremiumSectionIcon('pass'),
      'inv-wa-block': getPremiumSectionIcon('rsvp')
    };

    for (const id in map) {
      const el = document.getElementById(id);
      if (el) {
        const iconContainer = el.querySelector('.inv-card-icon, .inv-section-icon');
        if (iconContainer) {
          iconContainer.innerHTML = map[id];
        }
      }
    }
  }
  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Renderizado ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
function hasMojibake(value) {
  return /[íÃ¢Ã†¢Ã…]/.test(String(value || ""));
}

function stripMojibake(value) {
  return String(value || "")
    .replace(/[íÃ†¢Ã…]+/g, "")
    .replace(/-/g, "-")
    .replace(/Ã¢â‚¬â€/g, "-")
    .replace(/Ã¢â‚¬¢/g, "·")
    
    .replace(/\s+/g, " ")
    .trim();
}

function formatHeroDateFromRaw(value) {
  if (!value) return "";

  const raw = String(value).trim();

  // Si viene como YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [year, month, day] = raw.slice(0, 10).split("-");
    const months = [
      "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
      "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
    ];

    const monthIndex = Number(month) - 1;
    const monthLabel = months[monthIndex] || month;

    return `${Number(day)} ${monthLabel} ${year}`;
  }

  return stripMojibake(raw);
}

function formatHeroTimeFromRaw(value) {
  if (!value) return "";

  const raw = stripMojibake(value);

  // Si viene como HH:mm o HH:mm:ss
  const match = raw.match(/^(\d{1,2}):(\d{2})/);

  if (match) {
    let hour = Number(match[1]);
    const minutes = match[2];
    const suffix = hour >= 12 ? "P.M." : "A.M.";
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${minutes} ${suffix}`;
  }

  return raw;
}

function buildCleanHeroDateTime(invitation) {
  const rawDate =
    invitation.event_date ||
    invitation.date ||
    invitation.fecha_evento ||
    "";

  const rawTime =
    invitation.event_time ||
    invitation.time ||
    invitation.hora_evento ||
    "";

  const dateText = formatHeroDateFromRaw(rawDate);
  const timeText = formatHeroTimeFromRaw(rawTime);

  const result = [dateText, timeText].filter(Boolean).join(" · ");

  return stripMojibake(result);
}

function cleanHeroDateTimeFallback(value) {
  return String(value || "")
    .replace(/íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬¢/g, "·")
    .replace(/íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€š¢/g, "·")
    .replace(/í¢Ã¢â€š¬¢/g, "·")
    .replace(/íâ€š·/g, "·")
    .replace(/·/g, "·")
    .replace(/Ã¢â‚¬¢/g, "·")
    .replace(/[íÃ†¢Ã…]+/g, "")
    
    .replace(/\s*·\s*/g, " · ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderInvitation(inv) {
    var template = PUBLIC_TEMPLATE_MANIFEST[inv.template_id];
    if (template) {
        renderPublicDemoTemplate(inv, template);
        return;
    }

    renderDefaultTemplate(inv);
}

var PUBLIC_TEMPLATE_MANIFEST = {
    "xv-elegance-basic": { id: "xv-elegance-basic", path: "/demos/xv-elegance/index.html", kind: "xv" },
    "xv-rose-gold-premium": { id: "xv-rose-gold-premium", path: "/demos/xv-premium-2/index.html", kind: "xv" },
    "xv-champagne-rose-vip": { id: "xv-champagne-rose-vip", path: "/demos/xv-vip-3/index.html", kind: "xv" },
    "boda-classic-basic": { id: "boda-classic-basic", path: "/demos/boda-classic-basic/index.html", kind: "boda" },
    "cumpleanos-general-basic": { id: "cumpleanos-general-basic", path: "/demos/evento-general-basic/index.html", kind: "cumpleanos", rendererTemplateId: "evento-general-basic" },
    "cumpleanos-50-sorpresa": { id: "cumpleanos-50-sorpresa", path: "/demos/evento-general-basic/index.html", kind: "cumpleanos", rendererTemplateId: "evento-general-basic" },
    "bautizo-general-basic": { id: "bautizo-general-basic", path: "/demos/evento-general-basic/index.html", kind: "bautizo", rendererTemplateId: "evento-general-basic" },
    "otro-general-basic": { id: "otro-general-basic", path: "/demos/evento-general-basic/index.html", kind: "otro", rendererTemplateId: "evento-general-basic" },
    "boda-golden-romance-premium": { id: "boda-golden-romance-premium", path: "/demos/boda-golden-romance-premium/index.html", kind: "boda" },
    "boda-midnight-gold-vip": { id: "boda-midnight-gold-vip", path: "/demos/boda-premium-1/index.html", kind: "boda" }
};

function cleanString(val, maxLength) {
    if (!val || typeof val !== 'string') return "";
    var clean = val.trim();
    if (maxLength && clean.length > maxLength) {
        clean = clean.substring(0, maxLength);
    }
    return clean;
}

function normalizeStringArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(function(v) { return cleanString(v, 120); }).filter(Boolean);
    if (typeof val === 'string') {
        try {
            var parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed.map(function(v) { return cleanString(v, 120); }).filter(Boolean);
        } catch(e) {}
        return [cleanString(val, 120)].filter(Boolean);
    }
    return [];
}

function normalizeGodparents(val) {
    if (!val) return [];
    if (Array.isArray(val)) {
        return val.map(function(item) {
            if (typeof item === 'string') return { role: "Padrinos", name: cleanString(item, 120) };
            if (typeof item === 'object' && item !== null) {
                return { 
                    role: cleanString(item.role || "Padrinos", 60), 
                    name: cleanString(item.name || "", 120) 
                };
            }
            return null;
        }).filter(function(item) { return item && item.name; });
    }
    if (typeof val === 'string') {
        try {
            var parsed = JSON.parse(val);
            return normalizeGodparents(parsed);
        } catch(e) {
            return [{ role: "Padrinos", name: cleanString(val, 120) }];
        }
    }
    return [];
}

function safeHttpsUrl(val) {
    if (!val || typeof val !== 'string') return "";
    var clean = val.trim();
    if (clean.startsWith('https://')) return clean;
    if (clean.startsWith('http://')) return clean.replace('http://', 'https://');
    return "";
}

function normalizeGalleryUrls(val) {
    var arr = normalizeStringArray(val);
    return arr.map(safeHttpsUrl).filter(Boolean);
}

function normalizeItineraryData(val) {
    if (!val) return [];
    var arr = [];
    if (Array.isArray(val)) arr = val;
    else if (typeof val === 'string') {
        try { arr = JSON.parse(val); } catch(e) { return []; }
    }
    if (!Array.isArray(arr)) return [];
    return arr.map(function(item) {
        if (typeof item !== 'object' || !item) return null;
        return {
            time: cleanString(item.time, 60),
            title: cleanString(item.title, 120),
            description: cleanString(item.description, 200),
            iconName: cleanString(item.iconName || item.icon || "", 60)
        };
    }).filter(function(item) { return item && item.title; });
}

function cleanWhatsApp(val) {
    if (!val) return "";
    var digits = String(val).replace(/\D/g, '');
    return (digits.length >= 10 && digits.length <= 15) ? digits : "";
}

function normalizeGiftOptions(inv) {
    if (!inv || typeof inv !== "object") return [];

    var rawOptions = inv.gift_options;
    if (typeof rawOptions === "string") {
        try {
            rawOptions = JSON.parse(rawOptions);
        } catch(e) {
            rawOptions = [];
        }
    }

    var optionsList = Array.isArray(rawOptions) ? rawOptions : [];
    var normalized = [];

    for (var i = 0; i < optionsList.length; i++) {
        var opt = optionsList[i];
        if (!opt || typeof opt !== "object") continue;
        if (opt.enabled === false) continue;

        var type = opt.type === "bank" ? "bank" : "registry";
        var id = cleanString(opt.id, 50) || ("gift-" + (normalized.length + 1));

        if (type === "registry") {
            var title = cleanString(opt.title, 120);
            var safeUrl = safeHttpsUrl(cleanString(opt.url, 500));
            var description = cleanString(opt.description, 300);

            // Ignorar registry sin title y sin url válida
            if (!title && !safeUrl) continue;

            normalized.push({
                id: id,
                type: "registry",
                enabled: true,
                title: title || "Mesa de regalos",
                url: safeUrl || "",
                description: description
            });
        } else if (type === "bank") {
            var bank = cleanString(opt.bank, 120);
            var holder = cleanString(opt.holder, 160);
            var clabe = cleanString(opt.clabe, 50);
            var account = cleanString(opt.account, 50);
            var note = cleanString(opt.note, 300);
            var bankTitle = cleanString(opt.title, 120) || "Transferencia / Depósito";

            // Ignorar bank sin bank, holder, clabe ni account
            if (!bank && !holder && !clabe && !account) continue;

            normalized.push({
                id: id,
                type: "bank",
                enabled: true,
                title: bankTitle,
                bank: bank,
                holder: holder,
                clabe: clabe,
                account: account,
                note: note
            });
        }

        if (normalized.length >= 3) break;
    }

    // Si inv.gift_options viene vacío pero existe inv.gift_table_url legacy segura:
    if (normalized.length === 0) {
        var legacyUrl = safeHttpsUrl(cleanString(inv.gift_table_url, 500));
        if (legacyUrl) {
            normalized.push({
                id: "gift-1",
                type: "registry",
                enabled: true,
                title: "Mesa de regalos",
                url: legacyUrl,
                description: ""
            });
        }
    }

    return normalized.slice(0, 3);
}

function resolveGiftTableUrl(inv, giftOptions) {
    if (inv && inv.gift_table_url) {
        var safeLegacy = safeHttpsUrl(inv.gift_table_url);
        if (safeLegacy) return safeLegacy;
    }
    var options = giftOptions || normalizeGiftOptions(inv);
    var firstRegistry = options.find(function(o) {
        return o && o.type === "registry" && o.url;
    });
    if (firstRegistry && firstRegistry.url) {
        return safeHttpsUrl(firstRegistry.url) || "";
    }
    return "";
}

function normalizeCustomFontTargets(val) {
    var allowed = ["titles", "subtitles", "names", "body"];
    var targets = normalizeStringArray(val).filter(function(target) {
        return allowed.indexOf(target) !== -1;
    });
    return targets.length ? targets : ["titles", "subtitles", "names"];
}

function normalizeTypographyScales(val) {
    var scales = { titles: 1, subtitles: 1, names: 1, body: 1 };
    normalizeStringArray(val).forEach(function(token) {
        var match = String(token || "").match(/^scale:(titles|subtitles|names|body):(\d{2,3})$/);
        if (!match) return;
        var percent = Math.min(150, Math.max(75, Number(match[2]) || 100));
        scales[match[1]] = percent / 100;
    });
    return scales;
}

function normalizeTypographyFontLibrary(value, targetTokens, legacyUrl, legacyName) {
    var parsed = value;
    if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
    }
    if (!Array.isArray(parsed) || !parsed.length) {
        var libraryToken = normalizeStringArray(targetTokens).find(function(token) {
            return String(token || "").indexOf("typography-library:v1:") === 0;
        });
        if (libraryToken) {
            try { parsed = JSON.parse(decodeURIComponent(libraryToken.slice("typography-library:v1:".length))); }
            catch (e) { parsed = []; }
        }
    }
    var fonts = (Array.isArray(parsed) ? parsed : []).map(function(font, index) {
        if (!font || typeof font !== "object") return null;
        var id = cleanString(font.id, 60).replace(/[^A-Za-z0-9_-]/g, "");
        var url = safeHttpsUrl(font.url);
        if (!id || !url) return null;
        return { id: id, name: cleanString(font.name, 80) || ("Tipografía " + (index + 1)), url: url };
    }).filter(Boolean).slice(0, 4);
    var safeLegacyUrl = safeHttpsUrl(legacyUrl);
    if (!fonts.length && safeLegacyUrl) {
        fonts.push({ id: "font-legacy-custom", name: cleanString(legacyName, 80) || "Tipografía personalizada", url: safeLegacyUrl });
    }
    return fonts;
}

function normalizeTypographyRoles(val, fontLibrary) {
    var roles = ["coverName", "closingName", "mainTitle", "sectionTitle", "cardTitle", "guestName", "body", "labels"];
    var sources = ["inherit", "classic", "romantic", "editorial", "minimal", "luxury", "signature", "couture", "custom"]
        .concat((fontLibrary || []).map(function(font) { return font.id; }));
    var result = roles.reduce(function(config, role) {
        config[role] = { font: "inherit", scale: 1 };
        return config;
    }, {});
    var tokens = normalizeStringArray(val);
    var hasRoleTokens = tokens.indexOf("typography:v1") !== -1 || tokens.indexOf("typography:v2") !== -1;

    tokens.forEach(function(token) {
        var fontMatch = String(token || "").match(/^typeface:v[12]:([A-Za-z]+):([A-Za-z0-9_-]+)$/);
        if (fontMatch && roles.indexOf(fontMatch[1]) !== -1 && sources.indexOf(fontMatch[2]) !== -1) {
            result[fontMatch[1]].font = fontMatch[2] === "custom" && fontLibrary && fontLibrary[0]
                ? fontLibrary[0].id
                : fontMatch[2];
            hasRoleTokens = true;
            return;
        }
        var scaleMatch = String(token || "").match(/^type-scale:v[12]:([A-Za-z]+):(\d{2,3})$/);
        if (scaleMatch && roles.indexOf(scaleMatch[1]) !== -1) {
            result[scaleMatch[1]].scale = Math.min(150, Math.max(75, Number(scaleMatch[2]) || 100)) / 100;
            hasRoleTokens = true;
        }
    });

    if (hasRoleTokens) return result;

    // Compatibilidad con las invitaciones guardadas antes del modelo por funciones.
    var legacyTargets = normalizeCustomFontTargets(tokens);
    var legacyScales = normalizeTypographyScales(tokens);
    var legacyFont = fontLibrary && fontLibrary[0] ? fontLibrary[0].id : "custom";
    if (legacyTargets.indexOf("titles") !== -1) result.mainTitle.font = legacyFont;
    if (legacyTargets.indexOf("subtitles") !== -1) {
        result.sectionTitle.font = legacyFont;
        result.cardTitle.font = legacyFont;
    }
    if (legacyTargets.indexOf("names") !== -1) {
        result.coverName.font = legacyFont;
        result.closingName.font = legacyFont;
    }
    if (legacyTargets.indexOf("body") !== -1) result.body.font = legacyFont;
    result.mainTitle.scale = legacyScales.titles;
    result.sectionTitle.scale = legacyScales.subtitles;
    result.cardTitle.scale = legacyScales.subtitles;
    result.coverName.scale = legacyScales.names;
    result.body.scale = legacyScales.body;
    return result;
}

// Las invitaciones creadas antes del catálogo conservan el renderer clásico.
// Aplicamos aquí la misma asignación por función para que no pierdan las
// tipografías personalizadas al permanecer sin template_id.
function applyLegacyTypography(inv) {
    var fonts = normalizeTypographyFontLibrary(
        inv.typography_fonts,
        inv.custom_font_targets,
        inv.custom_font_url,
        inv.custom_font_name
    );
    var roles = normalizeTypographyRoles(inv.custom_font_targets, fonts);
    var fontFamilies = fonts.reduce(function(result, font) {
        var safeId = String(font.id || "").replace(/[^A-Za-z0-9_-]/g, "");
        if (safeId && font.url) result[font.id] = "InvittaLegacyFont_" + safeId;
        return result;
    }, {});

    var customFaces = document.getElementById("invitta-legacy-custom-font-faces");
    if (!customFaces) {
        customFaces = document.createElement("style");
        customFaces.id = "invitta-legacy-custom-font-faces";
        document.head.appendChild(customFaces);
    }
    customFaces.textContent = fonts.map(function(font) {
        var family = fontFamilies[font.id];
        if (!family) return "";
        var ext = font.url.split("?")[0].split(".").pop().toLowerCase();
        var format = ext === "woff2" ? "woff2" : ext === "woff" ? "woff" : ext === "otf" ? "opentype" : "truetype";
        return '@font-face{font-family:"' + family + '";src:url(' + JSON.stringify(font.url) + ') format("' + format + '");font-style:normal;font-weight:400;font-display:swap;}';
    }).join("");

    var presets = {
        classic: '"Cormorant Garamond", Georgia, serif',
        romantic: '"Great Vibes", "Cormorant Garamond", cursive',
        editorial: '"Playfair Display", Georgia, serif',
        minimal: '"Montserrat", Arial, sans-serif',
        luxury: '"Playfair Display", Georgia, serif',
        signature: '"Allura", "Great Vibes", cursive',
        couture: '"Parisienne", "Great Vibes", cursive'
    };
    var selectors = {
        coverName: "#inv-honoree",
        closingName: "#inv-thank-you-signature",
        mainTitle: "#inv-title",
        sectionTitle: ".inv-section-title,.inv-thank-you-title,.inv-share-title,.inv-event-card h2,.inv-timeline-alt-title",
        cardTitle: ".inv-event-card h3,.inv-event-card h4,.inv-timeline-alt-title,.inv-venue-name",
        guestName: "#inv-guest-name",
        body: "#inv-welcome,#inv-thank-you-message,#inv-share-message,.inv-venue-address,.inv-dresscode-text,.inv-godparents-list,.inv-parents-list",
        labels: ".inv-eyebrow,#inv-hero-date,.inv-ticket-field-label,.inv-ticket-field-value,.inv-premium-button,.inv-select,#inv-music-title,#inv-music-artist"
    };
    var style = document.getElementById("invitta-legacy-typography-roles");
    if (!style) {
        style = document.createElement("style");
        style.id = "invitta-legacy-typography-roles";
        document.head.appendChild(style);
    }
    style.textContent = Object.keys(selectors).map(function(role) {
        var setting = roles[role] || { font: "inherit", scale: 1 };
        var source = setting.font || "inherit";
        var family = fontFamilies[source] || presets[source] || "";
        if (!family || source === "inherit") return "";
        var fontStack = fontFamilies[source]
            ? '"' + family + '", "Cormorant Garamond", Georgia, serif'
            : family;
        return selectors[role] + "{font-family:" + fontStack + "!important;}";
    }).join("");

    Object.keys(selectors).forEach(function(role) {
        var scale = Number(roles[role] && roles[role].scale) || 1;
        if (scale === 1) return;
        document.querySelectorAll(selectors[role]).forEach(function(element) {
            var size = parseFloat(window.getComputedStyle(element).fontSize);
            if (Number.isFinite(size)) element.style.setProperty("font-size", (size * scale) + "px", "important");
        });
    });
}

function normalizeHexColor(val) {
    var color = cleanString(val, 20);
    return /^#[0-9a-f]{6}$/i.test(color) ? color : "";
}

function normalizeSectionBackgrounds(val) {
    var allowed = ["hero", "family", "locations", "gallery", "rsvp"];
    var parsed = val;
    if (typeof val === "string") {
        try { parsed = JSON.parse(val); } catch(e) { return {}; }
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return allowed.reduce(function(result, key) {
        var url = safeHttpsUrl(parsed[key]);
        if (url) result[key] = url;
        return result;
    }, {});
}

function normalizeConfirmationPhones(val) {
    return String(val || "")
        .split(/[|,;\n]+/)
        .map(cleanWhatsApp)
        .filter(Boolean)
        .slice(0, 2);
}

function findReceptionTime(inv) {
    if (inv.reception_time) return cleanString(inv.reception_time, 60);

    var itinerary = normalizeItineraryData(inv.itinerary);
    var receptionItem = itinerary.find(function(item) {
        return /recepci|bienvenida|c[oó]ctel|sal[oó]n/i.test(item.title || "");
    });
    return receptionItem ? receptionItem.time : "";
}

function buildPublicTemplateData(inv, template) {
    var parents = (inv.father_name || inv.mother_name)
        ? [cleanString(inv.father_name, 120), cleanString(inv.mother_name, 120)].filter(Boolean)
        : normalizeStringArray(inv.parents);
    var confirmationPhones = normalizeConfirmationPhones(inv.whatsapp_number);
    var typographyFonts = normalizeTypographyFontLibrary(
        inv.typography_fonts,
        inv.custom_font_targets,
        inv.custom_font_url,
        inv.custom_font_name
    );
    var giftOptions = normalizeGiftOptions(inv);
    var giftTableUrl = resolveGiftTableUrl(inv, giftOptions);

    return {
        templateId: template.id,
        rendererTemplateId: template.rendererTemplateId || template.id,
        eventType: cleanString(inv.event_type, 30) || template.kind,
        eventTitle: cleanString(inv.title || inv.event_title, 120) || ({
            boda: "Nuestra Boda",
            xv: "Mis Quince Años",
            cumpleanos: "Mi Cumpleaños",
            bautizo: "Mi Bautizo",
            otro: "Nuestro Evento"
        }[template.kind] || "Nuestro Evento"),
        celebrantName: cleanString(inv.honoree_name || inv.celebrant_name, 160) || "Nombre",
        eventDate: cleanString(inv.event_date, 60),
        eventTime: cleanString(inv.event_time || inv.ceremony_time, 60),
        quote: cleanString(inv.welcome_text || inv.quote, 800),
        parents: parents,
        godparents: normalizeGodparents(inv.godparents),
        ceremony: {
            name: cleanString(inv.ceremony_name, 160),
            time: cleanString(inv.ceremony_time || inv.event_time, 60),
            address: cleanString(inv.ceremony_address, 320),
            mapUrl: safeHttpsUrl(inv.ceremony_map_url || inv.ceremony_url)
        },
        reception: {
            name: cleanString(inv.reception_name, 160),
            time: findReceptionTime(inv),
            address: cleanString(inv.reception_address, 320),
            mapUrl: safeHttpsUrl(inv.reception_map_url || inv.reception_url)
        },
        itinerary: normalizeItineraryData(inv.itinerary),
        confirmationPhones: confirmationPhones,
        whatsapp: confirmationPhones[0] || cleanWhatsApp(inv.studio_whatsapp),
        guestName: cleanString(guestName, 120),
        passes: maxPasses,
        table: cleanString(tableNum, 30),
        invitationSlug: slug,
        guestToken: guestToken,
        qrAccessEnabled: template.id.endsWith("-vip"),
        mainPhotoUrl: safeHttpsUrl(inv.main_photo_url),
        galleryUrls: normalizeGalleryUrls(inv.gallery_urls),
        musicUrl: safeHttpsUrl(inv.music_url),
        musicTitle: cleanString(inv.music_title, 120),
        musicArtist: cleanString(inv.music_artist, 120),
        dressCode: cleanString(inv.dress_code, 120),
        giftOptions: giftOptions,
        giftTableUrl: giftTableUrl,
        instagramHashtag: cleanString(inv.instagram_hashtag, 120),
        thankYouTitle: cleanString(inv.thank_you_title, 160),
        thankYouMessage: cleanString(inv.thank_you_message, 600),
        thankYouSignature: cleanString(inv.thank_you_signature, 160),
        hashtagSectionTitle: cleanString(inv.hashtag_section_title, 160),
        hashtagSectionMessage: cleanString(inv.hashtag_section_message, 600),
        colorPrimary: normalizeHexColor(inv.color_primary),
        colorSecondary: normalizeHexColor(inv.color_secondary),
        palettePreset: cleanString(inv.palette_preset, 40) || "original",
        titleColor: normalizeHexColor(inv.title_color),
        bodyColor: normalizeHexColor(inv.body_color),
        accentColor: normalizeHexColor(inv.accent_color),
        fontPreset: cleanString(inv.font_preset, 40),
        customFontUrl: safeHttpsUrl(inv.custom_font_url),
        customFontName: cleanString(inv.custom_font_name, 80),
        typographyFonts: typographyFonts,
        customFontTargets: normalizeCustomFontTargets(inv.custom_font_targets),
        typographyScales: normalizeTypographyScales(inv.custom_font_targets),
        typographyRoles: normalizeTypographyRoles(inv.custom_font_targets, typographyFonts),
        visualTheme: cleanString(inv.visual_theme, 60),
        sectionBackgrounds: normalizeSectionBackgrounds(inv.section_backgrounds),
        backgroundImageUrl: safeHttpsUrl(inv.background_image_url),
        bgEnabled: Boolean(inv.bg_enabled),
        bgOverlayEnabled: inv.bg_overlay_enabled !== false,
        bgOverlayColor: normalizeHexColor(inv.bg_overlay_color) || "#000000",
        bgOverlayOpacity: Number(inv.bg_overlay_opacity ?? 0.35),
        bgPosition: cleanString(inv.bg_position, 20) || "center",
        bgSize: cleanString(inv.bg_size, 20) || "cover",
        bgBlur: Number(inv.bg_blur ?? 0),
        bgScope: cleanString(inv.bg_scope, 20) || "all",
        studioName: cleanString(inv.studio_name, 120),
        studioLogoUrl: safeHttpsUrl(inv.studio_logo_url),
        studioWhatsapp: cleanWhatsApp(inv.studio_whatsapp),
        studioCtaEnabled: inv.studio_cta_enabled !== false,
        studioCtaText: cleanString(inv.studio_cta_text, 120),
        studioCtaMessage: cleanString(inv.studio_cta_message, 500)
    };
}

function resolveTemplateAssetUrl(value, basePath) {
    if (!value || typeof value !== "string") return value;

    var trimmed = value.trim();

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:") ||
        trimmed.startsWith("blob:") ||
        trimmed.startsWith("mailto:") ||
        trimmed.startsWith("tel:") ||
        trimmed.startsWith("#")
    ) {
        return value;
    }

    if (trimmed.startsWith("/demos/")) {
        return value;
    }

    if (
        trimmed.startsWith("./") ||
        trimmed.startsWith("../") ||
        trimmed.startsWith("assets/") ||
        trimmed.startsWith("shared/") ||
        trimmed === "favicon.ico"
    ) {
        var normalizedBase = basePath.endsWith("/") ? basePath : basePath + "/";
        var resolved = new URL(trimmed, window.location.origin + normalizedBase);
        return resolved.pathname + resolved.search + resolved.hash;
    }

    return value;
}

function addTemplateBridge(html, templatePath, templateData) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, "text/html");
    var basePath = templatePath.slice(0, templatePath.lastIndexOf("/") + 1);
    var base = doc.createElement("base");
    base.href = basePath;
    doc.head.insertBefore(base, doc.head.firstChild);

    doc.querySelectorAll("script[src], link[href], img[src], source[src], video[src], audio[src]").forEach(function(el) {
        if (el.hasAttribute("src")) {
            el.setAttribute("src", resolveTemplateAssetUrl(el.getAttribute("src"), basePath));
        }
        if (el.hasAttribute("href")) {
            el.setAttribute("href", resolveTemplateAssetUrl(el.getAttribute("href"), basePath));
        }
    });

    doc.querySelectorAll("img[srcset], source[srcset]").forEach(function(el) {
        if (el.hasAttribute("srcset")) {
            var srcset = el.getAttribute("srcset");
            var rewritten = srcset.split(",").map(function(part) {
                var trimmed = part.trim();
                if (!trimmed) return "";
                var spaceIndex = trimmed.indexOf(" ");
                if (spaceIndex === -1) {
                    return resolveTemplateAssetUrl(trimmed, basePath);
                } else {
                    var url = trimmed.slice(0, spaceIndex);
                    var descriptor = trimmed.slice(spaceIndex);
                    return resolveTemplateAssetUrl(url, basePath) + descriptor;
                }
            }).join(", ");
            el.setAttribute("srcset", rewritten);
        }
    });

    var bootstrap = doc.createElement("script");
    var serializedData = JSON.stringify(templateData || {}).replace(/</g, "\\u003c");
    bootstrap.textContent = "window.INVITATION_DATA = " + serializedData + ";" +
        "window.INVITTA_TEMPLATE_ID = window.INVITATION_DATA.templateId;";
    doc.head.insertBefore(bootstrap, doc.head.children[1] || null);

    var qrLibrary = doc.createElement("script");
    qrLibrary.src = "/assets/vendor/qrcode.min.js";
    qrLibrary.defer = true;
    doc.body.appendChild(qrLibrary);

    var bridge = doc.createElement("script");
    bridge.src = "/demos/shared/public-personalization.js?v=rfc032-034-hotfix-20260820";
    bridge.defer = true;
    doc.body.appendChild(bridge);

    return "<!doctype html>\n" + doc.documentElement.outerHTML;
}

function renderPublicDemoTemplate(inv, template) {
    var loader = document.getElementById("inv-loader");
    if (loader) loader.style.display = "none";
    var content = document.getElementById("inv-content");
    if (content) content.style.display = "none";
    var musicPlayer = document.getElementById("inv-music-player");
    if (musicPlayer) musicPlayer.style.display = "none";

    setInvitationDocumentTitle(inv);
    var oldCss = document.querySelector('link[href="css/invitacion.css"]');
    if (oldCss) oldCss.disabled = true;

    document.documentElement.classList.add("inv-demo-host");
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    var publicTemplateData = buildPublicTemplateData(inv, template);
    window.INVITATION_DATA = publicTemplateData;

    var frame = document.createElement("iframe");
    frame.id = "inv-public-template-frame";
    frame.title = cleanString(inv.title, 120) || "Invitación digital";
    frame.setAttribute("allow", "autoplay; clipboard-write; fullscreen");
    frame.style.cssText = "display:block;width:100%;height:100dvh;border:0;background:#fff;";
    document.body.appendChild(frame);

    async function handleTemplateRsvp(event) {
        if (event.source !== frame.contentWindow || !guestToken) return;
        if (!event.data || event.data.type !== "invitta:rsvp") return;

        var payload = event.data;
        var result = await db.rpc("submit_public_invitation_rsvp", {
            invitation_slug: slug,
            guest_token: guestToken,
            attending: payload.attending !== false,
            confirmed_passes: clampInt(payload.confirmedPasses, 0, maxPasses),
            guest_message: cleanString(payload.message, 1000) || null
        });

        frame.contentWindow.postMessage({
            type: "invitta:rsvp-result",
            ok: !result.error,
            error: result.error ? "No se pudo registrar la confirmacion." : ""
        }, "*");
    }

    window.addEventListener("message", handleTemplateRsvp);

    fetch(template.path, { cache: "no-store" })
        .then(function(response) {
            if (!response.ok) throw new Error("Template HTTP " + response.status);
            return response.text();
        })
        .then(function(html) {
            frame.srcdoc = addTemplateBridge(html, template.path, publicTemplateData);
        })
        .catch(function(err) {
            console.error("Error cargando el template público:", err);
            frame.remove();
            if (oldCss) oldCss.disabled = false;
            document.body.style.overflow = "";
            showError("No se pudo cargar la plantilla.");
        });
}

function renderRoseGoldPremium(inv) {
    // 1. Ocultar loader y el default layout
    var loader = document.getElementById("inv-loader");
    if (loader) loader.style.display = "none";
    var content = document.getElementById("inv-content");
    if (content) content.style.display = "none";
    
    // Si habia un footer/music genérico, ocultarlo
    var musicPlayer = document.getElementById("inv-music-player");
    if (musicPlayer) musicPlayer.style.display = "none";

    // 2. Setear title y limpiar CSS conflictivos
    setInvitationDocumentTitle(inv);
    var oldCss = document.querySelector('link[href="css/invitacion.css"]');
    if (oldCss) oldCss.disabled = true;

    // 3. Crear contenedor root para React
    var root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);

    // 4. Preparar window.INVITATION_DATA con la estructura que el app parcheada espera
    window.INVITATION_DATA = {
        eventTitle: cleanString(inv.event_title || inv.title, 120) || "Mis XV Años",
        celebrantName: cleanString(inv.honoree_name || inv.celebrant_name, 120) || "Nombre",
        celebrantLastName: "",
        eventDate: cleanString(inv.event_date, 60) || "",
        parents: (inv.father_name || inv.mother_name) 
            ? [cleanString(inv.father_name, 120), cleanString(inv.mother_name, 120)].filter(Boolean)
            : normalizeStringArray(inv.parents),
        godparents: normalizeGodparents(inv.godparents),
        quote: cleanString(inv.quote, 500) || "",
        ceremony: {
            name: cleanString(inv.ceremony_name, 120) || "",
            time: inv.ceremony_time ? cleanString(formatHeroTimeFromRaw(inv.ceremony_time), 60) : "",
            address: cleanString(inv.ceremony_address, 255) || "",
            mapUrl: safeHttpsUrl(inv.ceremony_map_url || inv.ceremony_url) || "#"
        },
        reception: {
            name: cleanString(inv.reception_name, 120) || "",
            time: inv.reception_time ? cleanString(formatHeroTimeFromRaw(inv.reception_time), 60) : "",
            address: cleanString(inv.reception_address, 255) || "",
            mapUrl: safeHttpsUrl(inv.reception_map_url || inv.reception_url) || "#"
        },
        itinerary: normalizeItineraryData(inv.itinerary),
        whatsapp: normalizeConfirmationPhones(inv.whatsapp_number)[0] || cleanWhatsApp(inv.studio_whatsapp) || "",
        guestName: cleanString(guestName, 120),
        passes: maxPasses,
        table: cleanString(tableNum, 30),
        giftOptions: normalizeGiftOptions(inv),
        giftTableUrl: resolveGiftTableUrl(inv),
        mainPhotoUrl: safeHttpsUrl(inv.main_photo_url) || "",
        galleryUrls: normalizeGalleryUrls(inv.gallery_urls),
        musicUrl: safeHttpsUrl(inv.music_url) || "",
        musicTitle: cleanString(inv.music_title, 120) || ""
    };

    // 4. Inyectar CSS de la build de React
    // Obtenemos los nombres de archivo correctos cargando dinámicamente index.html
    fetch('/demos/xv-premium-2/index.html')
        .then(res => res.text())
        .then(html => {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            
            // Inyectar CSS
            var links = doc.querySelectorAll('link[rel="stylesheet"]');
            links.forEach(function(link) {
                var newLink = document.createElement("link");
                newLink.rel = "stylesheet";
                newLink.href = "/demos/xv-premium-2/" + link.getAttribute("href").replace('./', '');
                document.head.appendChild(newLink);
            });

            // Inyectar JS
            var scripts = doc.querySelectorAll('script[type="module"]');
            scripts.forEach(function(script) {
                var newScript = document.createElement("script");
                newScript.type = "module";
                newScript.src = "/demos/xv-premium-2/" + script.getAttribute("src").replace('./', '');
                document.body.appendChild(newScript);
            });
        })
        .catch(function(err) {
            console.error("Error cargando el template XV Rose Gold:", err);
            showError("No se pudo cargar la plantilla.");
        });
}

function renderDefaultTemplate(inv) {
    applyVisualTheme(inv);
    injectPremiumIcons();

    /* 1. Mostrar contenido */
    var loader  = document.getElementById("inv-loader");
    var errBox  = document.getElementById("inv-error");
    var content = document.getElementById("inv-content");

    if (loader)  loader.style.display  = "none";
    if (errBox)  { errBox.style.display = "none"; errBox.textContent = ""; }
    if (content) content.style.display  = "block";

    /* 2. Tema de color y Tipografía */
    var legacyPrimary = inv.color_primary || inv.title_color || publicTemplateData.primaryColor || "#C9A46A";
    var legacySecondary = inv.color_secondary || inv.body_color || publicTemplateData.secondaryColor || "#F7E7D7";
    // Mapeamos los legacy (primary = accent = 10, secondary = background = 60/30) al nuevo sistema 60-30-10
    // Asumimos secondary (claro) como 60 y primary (oscuro) como 10
    applyTheme(legacySecondary, null, legacyPrimary, null);

    var allowedPresets = ["classic", "romantic", "editorial", "minimal", "luxury", "signature", "couture"];
    var preset = inv.font_preset;
    if (!allowedPresets.includes(preset)) preset = "classic";
    document.body.className = document.body.className.replace(/font-preset-\S+/g, "").trim();
    document.body.classList.add("font-preset-" + preset);



    /* 3. Hero: título, honoree, fecha */
    var heroHeading = resolveHeroHeading(inv.title, inv.honoree_name, inv.event_type);
    setText("inv-title", heroHeading.title);
    setText("inv-honoree", heroHeading.honoree);
    fitHeroTitleSingleLine();
    fitHeroHonoreeSingleLine();

    // Fecha formateada en el hero (Limpia)
    var heroDateTime = buildCleanHeroDateTime(inv);
    if (heroDateTime) {
      var heroDate = document.getElementById("inv-hero-date");
      if (heroDate) {
        heroDate.textContent = heroDateTime;
        heroDate.style.display = "";
      }
    }

    /* 4. Fecha larga en card */
    var timeStr = formatTime(inv.event_time);
    setText("inv-date", formatDate(inv.event_date));
    toggle("inv-time-block", !!timeStr);
    setText("inv-time", timeStr);

    /* 5. Datos del invitado (ticket) */
    setText("inv-guest-name", guestName || "Estimado Invitado");
    setText("inv-pases",      String(maxPasses));
    setText("inv-mesa",       tableNum  || "¢íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬");
    toggle("inv-mesa-block",  !!tableNum);

    // Fecha corta en ticket
    var ticketDate = document.getElementById("inv-ticket-date");
    if (ticketDate) {
      ticketDate.textContent = formatDateShort(inv.event_date) || "¢íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬";
    }

    /* 6. Selector de confirmación */
    buildPassSelector(maxPasses);

    /* 7. Mensaje de bienvenida */
    toggle("inv-welcome-block", !!inv.welcome_text);
    setText("inv-welcome", inv.welcome_text || "");

    /* Padres y Padrinos */
    var hasParents = inv.father_name || inv.mother_name;
    var hasGodparents = inv.godparents && inv.godparents.length > 0;
    toggle("inv-parents-block", hasParents || hasGodparents);
    
    if (inv.father_name) {
      setText("inv-father-name", inv.father_name);
      show("inv-father-name");
    } else {
      hide("inv-father-name");
    }
    if (inv.mother_name) {
      setText("inv-mother-name", inv.mother_name);
      show("inv-mother-name");
    } else {
      hide("inv-mother-name");
    }

    if (hasGodparents) {
      show("inv-godparents-wrapper");
      var gpList = document.getElementById("inv-godparents-list");
      if (gpList) {
        gpList.innerHTML = "";
        inv.godparents.forEach(function(gp) {
          var godparentName = typeof gp === "string" ? gp : (gp && gp.name);
          if (!godparentName) return;

          var li = document.createElement("li");
          var nameDiv = document.createElement("div");
          nameDiv.className = "inv-godparent-name";
          nameDiv.textContent = godparentName;
          li.appendChild(nameDiv);
          gpList.appendChild(li);
        });
      }
    } else {
      hide("inv-godparents-wrapper");
    }

    /* Itinerario */
    renderItinerary(inv.itinerary);

    /* Cierre y agradecimiento */
    renderThankYouClosing(inv);
    renderShareSection(inv);

    /* 8. Ceremonia */
    var hasCeremony = !!(inv.ceremony_name || inv.ceremony_address);
    toggle("inv-ceremony-block", hasCeremony);
    if (hasCeremony) {
      setText("inv-ceremony-name",    inv.ceremony_name    || "Ceremonia");
      setText("inv-ceremony-address", inv.ceremony_address || "");
      if (inv.ceremony_map_url) {
        setHref("inv-ceremony-map-btn", inv.ceremony_map_url);
        show("inv-ceremony-map-btn");
      } else {
        hide("inv-ceremony-map-btn");
      }
    }

    /* 9. Recepción */
    var hasReception = !!(inv.reception_name || inv.reception_address);
    toggle("inv-reception-block", hasReception);
    if (hasReception) {
      setText("inv-reception-name",    inv.reception_name    || "Recepción");
      setText("inv-reception-address", inv.reception_address || "");
      if (inv.reception_map_url) {
        setHref("inv-reception-map-btn", inv.reception_map_url);
        show("inv-reception-map-btn");
      } else {
        hide("inv-reception-map-btn");
      }
    }

    /* 10. Dress code */
    toggle("inv-dresscode-block", !!inv.dress_code);
    setText("inv-dresscode", inv.dress_code || "");

    /* 11. Mesa de regalos */
    toggle("inv-gifts-block", !!inv.gift_table_url);
    if (inv.gift_table_url) {
      setHref("inv-gifts-link", inv.gift_table_url);
    }

    /* 12. WhatsApp */
    buildWhatsAppButton(inv);

    /* 13. Titulo de pestana */
    setInvitationDocumentTitle(inv);

    /* 14. Foto principal (hero) */
    renderMainPhoto(inv.main_photo_url);

    /* 15. Cuenta regresiva */
    setupCountdown(inv.event_date, inv.event_time);

    /* 16. Música */
    // Set custom background if exists
    if (inv.background_image_url) {
      document.body.style.backgroundImage = `url('${inv.background_image_url}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.classList.add("has-custom-bg");
    }

    if (typeof setupCalendarButton === "function") {
      setupCalendarButton(inv);
    }

    // console.log("music_url:", inv.music_url);
    // console.log("music_url:", inv.music_url);
    setupMusicPlayer(inv);

    /* 17. Galería */
    renderGallery(normalizeGalleryUrls(inv.gallery_urls));

    /* 18. Footer CTA */
    const footer = document.querySelector('.inv-footer');
    if (footer) {
      const ctaHtml = renderStudioFooterCta(inv);
      if (ctaHtml) {
        footer.insertAdjacentHTML('beforeend', ctaHtml);
      }
    }

    setTimeout(() => {
      setupMomentImageOrientation();
      setupMomentsParallax();
    }, 500);


    /* 19. Limpieza de elementos legacy de audio en el contenido */
    document.querySelectorAll("#inv-content audio, #inv-content [id*='music'], #inv-content [class*='music']").forEach((el) => {
      if (el.id !== "inv-music-player") {
        // console.warn("Removing legacy inline music element:", el);
        el.remove();
      }
    });
    applyLegacyTypography(inv);
    requestAnimationFrame(() => {
      setupSafeSectionReveal();
    });
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Foto principal (hero) ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  function renderMainPhoto(url) {
    var heroBg   = document.getElementById("inv-hero-bg");
    var heroImg  = document.getElementById("inv-hero-img");
    var hero     = document.getElementById("inv-hero");

    if (!url || !heroBg || !heroImg) return;

    heroImg.src              = url;
    heroBg.style.display     = "block";
    if (hero) hero.classList.add("inv-hero--has-photo");
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Calendar Button ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  function formatCalendarLocalDate(date) {
    function pad(value) {
      return String(value).padStart(2, "0");
    }

    return date.getFullYear()
      + pad(date.getMonth() + 1)
      + pad(date.getDate())
      + "T"
      + pad(date.getHours())
      + pad(date.getMinutes())
      + pad(date.getSeconds());
  }

  function escapeICalendarText(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  function getInvitationCalendarTitle(inv) {
    var heading = resolveHeroHeading(
      inv.event_title || inv.title,
      inv.honoree_name || inv.celebrant_name,
      inv.event_type
    );
    var parts = [heading.title, heading.honoree].filter(Boolean);

    return parts.join(" - ") || "Evento Invitta";
  }

  function setupCalendarButton(inv) {
    var calendarWrap = document.getElementById("inv-calendar-wrapper");
    var calendarBtn = document.getElementById("inv-calendar-btn");

    if (!inv.event_date || !calendarWrap || !calendarBtn) return;

    var startDate = new Date(inv.event_date + "T" + (inv.event_time || "00:00"));
    if (Number.isNaN(startDate.getTime())) return;

    var endDate = new Date(startDate.getTime() + (5 * 60 * 60 * 1000));
    var startDateTime = formatCalendarLocalDate(startDate);
    var endDateTime = formatCalendarLocalDate(endDate);
    var title = getInvitationCalendarTitle(inv);
    var details = inv.welcome_text || "";
    var location = inv.ceremony_address || inv.reception_address || "";
    var timeZone = inv.time_zone || inv.timezone || "America/Mexico_City";
    var googleParams = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: startDateTime + "/" + endDateTime,
      details: details,
      location: location,
      ctz: timeZone
    });
    var googleCalendarUrl = "https://calendar.google.com/calendar/render?" + googleParams.toString();
    var isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      || window.matchMedia("(pointer: coarse)").matches;

    calendarBtn.href = googleCalendarUrl;
    calendarBtn.onclick = null;

    if (isMobileDevice) {
      calendarBtn.removeAttribute("target");
      calendarBtn.onclick = function(event) {
        event.preventDefault();

        var uidSource = String(inv.slug || title || "evento-invitta")
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-+|-+$/g, "");
        var nowUtc = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
        var invitationUrl = window.location.href.split("#")[0];
        var calendarContent = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Invitta Studio//Invitacion//ES",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          "BEGIN:VEVENT",
          "UID:" + (uidSource || "evento-invitta") + "@invitta.vercel.app",
          "DTSTAMP:" + nowUtc,
          "DTSTART;TZID=" + timeZone + ":" + startDateTime,
          "DTEND;TZID=" + timeZone + ":" + endDateTime,
          "SUMMARY:" + escapeICalendarText(title),
          "DESCRIPTION:" + escapeICalendarText(details),
          "LOCATION:" + escapeICalendarText(location),
          "URL:" + escapeICalendarText(invitationUrl),
          "END:VEVENT",
          "END:VCALENDAR"
        ].join("\r\n");
        var calendarBlob = new Blob([calendarContent], { type: "text/calendar;charset=utf-8" });
        var calendarObjectUrl = URL.createObjectURL(calendarBlob);
        var downloadLink = document.createElement("a");

        downloadLink.href = calendarObjectUrl;
        downloadLink.download = (uidSource || "evento-invitta") + ".ics";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(function() {
          URL.revokeObjectURL(calendarObjectUrl);
        }, 3000);
      };
    } else {
      calendarBtn.setAttribute("target", "_blank");
    }

    calendarWrap.style.display = "block";
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Reproductor de música fijo ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  let invitationAudio = null;
  let isMusicPlaying = false;

  function decodeMojibakePass(value) {
    const windows1252Bytes = {
      "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85,
      "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a,
      "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92,
      "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
      "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c,
      "ž": 0x9e, "Ÿ": 0x9f
    };
    const bytes = [];

    for (const character of String(value || "")) {
      const code = character.charCodeAt(0);
      if (code <= 0xff) {
        bytes.push(code);
      } else if (Object.prototype.hasOwnProperty.call(windows1252Bytes, character)) {
        bytes.push(windows1252Bytes[character]);
      } else {
        return value;
      }
    }

    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
  }

  function repairMojibake(value) {
    let repaired = String(value || "");

    for (let pass = 0; pass < 4 && /[ÃâðÆÅ]/.test(repaired); pass += 1) {
      try {
        const candidate = decodeMojibakePass(repaired);
        const currentMarkers = (repaired.match(/[ÃâðÆÅ]/g) || []).length;
        const candidateMarkers = (candidate.match(/[ÃâðÆÅ]/g) || []).length;
        if (candidate === repaired || candidateMarkers >= currentMarkers) break;
        repaired = candidate;
      } catch (_error) {
        break;
      }
    }

    return repaired;
  }

  function setInvitationDocumentTitle(invitation) {
    const eventTitle = repairMojibake(invitation.event_title || invitation.title || "");
    const honoreeName = repairMojibake(invitation.honoree_name || invitation.celebrant_name || "");
    const heading = resolveHeroHeading(eventTitle, honoreeName, invitation.event_type);
    const cleanParts = [heading.title, heading.honoree]
      .map((part) => repairMojibake(part).replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const pageTitle = cleanParts.join(" - ") || "Invitaci\u00f3n Digital";

    document.title = pageTitle + " - Invitta";
  }

  function cleanMusicTitle(value) {
    return repairMojibake(value)
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanMusicFileName(filename) {
    if (!filename) return "";
    const decoded = decodeURIComponent(filename);
    return cleanMusicTitle(decoded
      .replace(/\.(mp3|m4a|wav|ogg)$/i, "")
      .replace(/^\d+[-_]/, ""));
  }

  function getMusicTitle(invitation) {
    if (invitation.music_title && invitation.music_title.trim()) {
      return cleanMusicTitle(invitation.music_title);
    }

    if (invitation.music_url) {
      try {
        const url = new URL(invitation.music_url);
        const filename = url.pathname.split("/").pop() || "";
        return cleanMusicFileName(filename) || "Música del evento";
      } catch (e) {
        const filename = invitation.music_url.split("/").pop() || "";
        return cleanMusicFileName(filename) || "Música del evento";
      }
    }

    return "Música del evento";
  }

  function getLegacyMusicDisplayTitle(invitation) {
    const musicTitle = getMusicTitle(invitation);
    const musicArtist = cleanMusicTitle(invitation.music_artist);

    if (musicArtist && musicTitle && musicTitle !== "Música del evento") {
      return `${musicArtist} íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡íÆ’Ã†â€™· ${musicTitle}`;
    }

    return musicArtist || musicTitle;
  }

  function getMusicDisplayTitle(invitation) {
    const defaultTitle = "Música del evento";
    const musicArtist = cleanMusicTitle(invitation.music_artist);
    let musicTitle = cleanMusicTitle(invitation.music_title);

    if (!musicTitle && invitation.music_url) {
      try {
        const url = new URL(invitation.music_url);
        musicTitle = cleanMusicFileName(url.pathname.split("/").pop() || "");
      } catch (_error) {
        musicTitle = cleanMusicFileName(invitation.music_url.split("/").pop() || "");
      }
    }

    musicTitle = musicTitle || defaultTitle;

    if (musicArtist && musicTitle !== defaultTitle) {
      return `${musicArtist} · ${musicTitle}`;
    }

    return musicArtist || musicTitle;
  }

  function forceMusicPlayerStyles(player) {
    if (!player) return;
  
    player.style.setProperty("position", "fixed", "important");
    player.style.setProperty("left", "0", "important");
    player.style.setProperty("right", "0", "important");
    player.style.setProperty("bottom", "0", "important");
    player.style.setProperty("z-index", "99999", "important");
    player.style.setProperty("display", "flex", "important");
    player.style.setProperty("align-items", "center", "important");
    player.style.setProperty("justify-content", "space-between", "important");
    player.style.setProperty("gap", "1rem", "important");
    player.style.setProperty("min-height", "78px", "important");
    player.style.setProperty("width", "100%", "important");
    player.style.setProperty("box-sizing", "border-box", "important");
    player.style.setProperty("padding", "0.8rem 1rem calc(0.8rem + env(safe-area-inset-bottom))", "important");
    player.style.setProperty("background", "rgba(7, 7, 7, 0.97)", "important");
    player.style.setProperty("color", "#fff", "important");
    player.style.setProperty("box-shadow", "0 -14px 28px rgba(0,0,0,.28)", "important");
  }
  
  function forceMusicPlayerChildStyles() {
    const left = document.querySelector("#inv-music-player .inv-music-left");
    const logo = document.querySelector("#inv-music-player .inv-music-logo");
    const logoText = document.querySelector("#inv-music-player .inv-music-logo span");
    const meta = document.querySelector("#inv-music-player .inv-music-meta");
    const title = document.querySelector("#inv-music-title");
    const artist = document.querySelector("#inv-music-artist");
    const toggle = document.querySelector("#inv-music-toggle");
  
    if (left) {
      left.style.setProperty("display", "flex", "important");
      left.style.setProperty("align-items", "center", "important");
      left.style.setProperty("gap", "0.85rem", "important");
      left.style.setProperty("min-width", "0", "important");
      left.style.setProperty("flex", "1", "important");
    }
  
    if (logo) {
      logo.style.setProperty("width", "56px", "important");
      logo.style.setProperty("height", "56px", "important");
      logo.style.setProperty("border-radius", "999px", "important");
      logo.style.setProperty("border", "1px solid rgba(212, 181, 122, 0.65)", "important");
      logo.style.setProperty("display", "grid", "important");
      logo.style.setProperty("place-items", "center", "important");
      logo.style.setProperty("color", "#d4b57a", "important");
      logo.style.setProperty("flex", "0 0 auto", "important");
      logo.style.setProperty("background", "rgba(255,255,255,0.03)", "important");
    }
  
    if (logoText) {
      logoText.style.setProperty("font-size", "1.35rem", "important");
      logoText.style.setProperty("line-height", "1", "important");
      logoText.style.setProperty("color", "#d4b57a", "important");
    }
  
    if (meta) {
      meta.style.setProperty("min-width", "0", "important");
      meta.style.setProperty("text-align", "left", "important");
    }
  
    if (title) {
      title.style.setProperty("margin", "0", "important");
      title.style.setProperty("color", "#fff", "important");
      title.style.setProperty("font-size", "1rem", "important");
      title.style.setProperty("line-height", "1.2", "important");
      title.style.setProperty("white-space", "nowrap", "important");
      title.style.setProperty("overflow", "hidden", "important");
      title.style.setProperty("text-overflow", "ellipsis", "important");
    }
  
    if (artist) {
      artist.style.setProperty("display", "block", "important");
      artist.style.setProperty("margin-top", "0.15rem", "important");
      artist.style.setProperty("color", "rgba(255,255,255,0.82)", "important");
      artist.style.setProperty("font-size", "0.82rem", "important");
      artist.style.setProperty("line-height", "1.2", "important");
      artist.style.setProperty("white-space", "nowrap", "important");
      artist.style.setProperty("overflow", "hidden", "important");
      artist.style.setProperty("text-overflow", "ellipsis", "important");
    }
  
    if (toggle) {
      toggle.style.setProperty("width", "58px", "important");
      toggle.style.setProperty("height", "58px", "important");
      toggle.style.setProperty("border", "none", "important");
      toggle.style.setProperty("background", "transparent", "important");
      toggle.style.setProperty("color", "#fff", "important");
      toggle.style.setProperty("font-size", "2rem", "important");
      toggle.style.setProperty("display", "grid", "important");
      toggle.style.setProperty("place-items", "center", "important");
      toggle.style.setProperty("cursor", "pointer", "important");
      toggle.style.setProperty("flex", "0 0 auto", "important");
      toggle.style.setProperty("padding", "0", "important");
      toggle.style.setProperty("margin", "0", "important");
    }
  }

  function escapeHtml(unsafe) {
    return (unsafe || "").toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getStudioInitials(name) {
    const clean = String(name || "Invitta Studio").trim();
    if (!clean) return "IS";
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function isValidLogoUrl(value) {
    const url = String(value || "").trim();

    if (!url) return false;
    if (url.includes("URL_DEL_LOGO_AQUI")) return false;
    if (url === "#") return false;
    if (url.toLowerCase() === "null") return false;
    if (url.toLowerCase() === "undefined") return false;

    return true;
  }

  function renderMusicPlayerBrand(invitation) {
    const enabled = invitation.music_player_brand_enabled !== false;
    const studioName = invitation.studio_name || "Invitta Studio";
    const logoUrl = invitation.studio_logo_url || invitation.logo_url || "";

    if (!enabled) {
      return "";
    }

    if (isValidLogoUrl(logoUrl)) {
      return `
        <div class="inv-music-brand" aria-label="${escapeHtml(studioName)}">
          <img
            class="inv-music-brand-logo"
            src="${escapeHtml(logoUrl)}"
            alt="${escapeHtml(studioName)}"
            loading="lazy"
            onerror="this.closest('.inv-music-brand')?.classList.add('is-logo-error'); this.remove();"
          >
        </div>
      `;
    }

    return `
      <div class="inv-music-brand inv-music-brand-fallback" aria-label="${escapeHtml(studioName)}">
        <span>${escapeHtml(getStudioInitials(studioName))}</span>
      </div>
    `;
  }

  function getPlayIconSvg() {
    return `
      <svg class="inv-music-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 5.5v13l10-6.5-10-6.5z" fill="currentColor"></path>
      </svg>
    `;
  }

  function getPauseIconSvg() {
    return `
      <svg class="inv-music-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 5h2.8v14H8z" fill="currentColor"></path>
        <path d="M13.2 5H16v14h-2.8z" fill="currentColor"></path>
      </svg>
    `;
  }

  function normalizePhoneNumber(value) {
    return String(value || "")
      .replace(/[^\d]/g, "");
  }

  function buildStudioWhatsappUrl(invitation) {
    const phone = normalizePhoneNumber(invitation.studio_whatsapp);
    if (!phone) return "";
    const message = invitation.studio_cta_message
      || "Hola, vi esta invitaci³n digital y me interesa contratar una para mi evento.";
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  function renderStudioFooterCta(invitation) {
    const enabled = invitation.studio_cta_enabled !== false;
    const url = buildStudioWhatsappUrl(invitation);

    if (!enabled || !url) return "";

    const text = invitation.studio_cta_text || "Quiero una invitaci³n as­";

    return `
      <a
        class="inv-footer-cta"
        href="${escapeHtml(url)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="${escapeHtml(text)}"
      >
        ${escapeHtml(text)}
      </a>
    `;
  }

  function setupMusicPlayer(invitation) {
    const player = document.getElementById("inv-music-player");
    const toggle = document.getElementById("inv-music-toggle");
    const title = document.getElementById("inv-music-title");
    const artist = document.getElementById("inv-music-artist");

    if (!player || !toggle) {
      // console.warn("Music player DOM missing");
      return;
    }

    if (!invitation.music_url) {
      player.style.display = "none";
      document.body.classList.remove("has-music-player");
      return;
    }

    if (player.parentElement && player.parentElement.id === "inv-content") {
      document.body.appendChild(player);
    }

    player.style.setProperty("display", "flex", "important");
    forceMusicPlayerStyles(player);
    forceMusicPlayerChildStyles();
    
    const logoContainer = player.querySelector(".inv-music-logo, .inv-music-brand, .inv-music-brand-fallback");
    if (logoContainer) {
      const brandHtml = renderMusicPlayerBrand(invitation);
      if (brandHtml) {
        logoContainer.outerHTML = brandHtml;
      } else {
        logoContainer.style.display = "none";
      }
    }
    
    document.body.classList.add("has-music-player");

    // console.log("Music player computed display:", window.getComputedStyle(player).display);
    // console.log("Music player position:", window.getComputedStyle(player).position);
    // console.log("Music player bottom:", window.getComputedStyle(player).bottom);

    if (title) title.textContent = getMusicDisplayTitle(invitation);
    if (artist) artist.textContent = "";

    if (invitationAudio) {
      invitationAudio.pause();
      invitationAudio = null;
    }

    invitationAudio = new Audio(invitation.music_url);
    invitationAudio.preload = "auto";
    invitationAudio.loop = true;
    invitationAudio.volume = 0.85;

    isMusicPlaying = false;
    toggle.innerHTML = getPlayIconSvg();
    toggle.disabled = false;

    toggle.onclick = async () => {
      try {
        if (!isMusicPlaying) {
          await invitationAudio.play();
          isMusicPlaying = true;
          toggle.innerHTML = getPauseIconSvg();
          toggle.setAttribute("aria-label", "Pausar mºsica");
        } else {
          invitationAudio.pause();
          isMusicPlaying = false;
          toggle.innerHTML = getPlayIconSvg();
          toggle.setAttribute("aria-label", "Reproducir mºsica");
        }
      } catch (err) {
        console.error("Error reproduciendo mºsica:", err);
        alert("No se pudo reproducir la mºsica. Verifica que el archivo sea compatible.");
      }
    };
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Cuenta regresiva ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  function setupCountdown(eventDate, eventTime) {
    var section = document.getElementById("inv-countdown-section");
    if (!section || !eventDate) {
      if (section) section.style.display = "none";
      return;
    }

    var dateParts = eventDate.split("-").map(Number);
    var timeParts = (eventTime || "00:00").split(":").map(Number);
    var year      = dateParts[0];
    var month     = dateParts[1];
    var day       = dateParts[2];
    var hours     = timeParts[0] || 0;
    var minutes   = timeParts[1] || 0;

    var targetDate = new Date(year, month - 1, day, hours, minutes, 0);

    function updateCountdown() {
      var now  = new Date();
      var diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        section.innerHTML = "<p class='inv-countdown-today'>🎉 Hoy es el gran día 🎉</p>";
        clearInterval(timer);
        return;
      }

      var totalSeconds = Math.floor(diff / 1000);
      var days         = Math.floor(totalSeconds / (60 * 60 * 24));
      var hoursLeft    = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
      var minutesLeft  = Math.floor((totalSeconds % (60 * 60)) / 60);
      var secondsLeft  = totalSeconds % 60;

      var dEl = document.getElementById("cd-days");
      var hEl = document.getElementById("cd-hours");
      var mEl = document.getElementById("cd-minutes");
      var sEl = document.getElementById("cd-seconds");

      if (dEl) dEl.textContent = days;
      if (hEl) hEl.textContent = String(hoursLeft).padStart(2, "0");
      if (mEl) mEl.textContent = String(minutesLeft).padStart(2, "0");
      if (sEl) sEl.textContent = String(secondsLeft).padStart(2, "0");
    }

    section.style.display = "";
    updateCountdown();
    var timer = setInterval(updateCountdown, 1000);
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Galería ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */

  /** Normaliza gallery_urls: array | JSON string | null ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬ íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’¢í¢Ã¢â€š¬Ã…¾íâ€š¢ string[] */
  function normalizeGalleryUrls(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).slice(0, 10);
    try {
      var parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 10) : [];
    } catch (e) { return []; }
  }

  /** Renderiza la galería como momentos fullscreen cinematográficos. */
  function renderGallery(urls) {
    var section = document.getElementById("inv-gallery-section");
    var container = document.getElementById("inv-gallery");
    if (!section || !container) return;

    if (!urls || urls.length === 0) {
      section.style.display = "none";
      return;
    }

    section.className = "inv-section inv-moments-section";
    section.style.display = "";

    var header = section.querySelector(".inv-gallery-header, .inv-moments-header");
    if (header) {
      header.className = "inv-moments-header reveal-on-scroll";
    }

    var kicker = section.querySelector(".inv-eyebrow-text");
    if (kicker) {
      kicker.textContent = "Recuerdos";
      kicker.classList.add("inv-section-kicker");
    }

    var title = section.querySelector(".inv-gallery-title");
    if (title) {
      title.classList.add("inv-section-title");
    }

    container.className = "inv-moments-stack";
    container.innerHTML = "";

    urls.forEach(function (url) {
      var frame = document.createElement("figure");
      frame.className = "inv-moment-frame reveal-on-scroll";
      frame.setAttribute("role", "listitem");

      var img = document.createElement("img");
      img.className = "inv-moment-image";
      img.src = url;
      img.alt = "Momento especial";
      img.loading = "lazy";
      img.decoding = "async";
      img.dataset.invittaPersonalized = "true";
      img.dataset.invittaPersonalizedSrc = url;

      var backdrop = document.createElement("img");
      backdrop.className = "inv-moment-backdrop";
      backdrop.src = url;
      backdrop.alt = "";
      backdrop.setAttribute("aria-hidden", "true");
      backdrop.loading = "lazy";
      backdrop.decoding = "async";
      backdrop.dataset.invittaPersonalized = "true";
      backdrop.dataset.invittaPersonalizedSrc = url;

      frame.append(backdrop, img);
      container.appendChild(frame);
    });
  }

  function setupMomentImageOrientation() {
    document.querySelectorAll(".inv-moment-image").forEach((img) => {
      function setOrientation() {
        var isLandscape = img.naturalWidth >= img.naturalHeight;
        var frame = img.closest(".inv-moment-frame");
        img.classList.toggle("is-landscape", isLandscape);
        img.classList.toggle("is-portrait", !isLandscape);
        if (frame) {
          frame.classList.toggle("is-landscape", isLandscape);
          frame.classList.toggle("is-portrait", !isLandscape);
        }
      }

      if (img.complete) {
        setOrientation();
      } else {
        img.addEventListener("load", setOrientation, { once: true });
      }
    });
  }

  function setupMomentsParallax() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const images = Array.from(document.querySelectorAll(".inv-moment-image"));

    if (!images.length) return;

    const moments = images.map((img, index) => ({
      img,
      frame: img.closest(".inv-moment-frame"),
      backdrop: img.closest(".inv-moment-frame")?.querySelector(".inv-moment-backdrop"),
      direction: index % 2 === 0 ? 1 : -1,
      current: null,
      target: null
    })).filter((moment) => moment.frame);

    let animationFrame = 0;
    let lastFrameTime = 0;

    function updateTargets() {
      const viewportHeight = window.innerHeight;
      const isMobile = window.innerWidth <= 640;
      const foregroundRange = isMobile ? 90 : 120;
      const horizontalRange = isMobile ? 14 : 20;
      const backdropRange = isMobile ? -170 : -230;

      moments.forEach((moment) => {
        const rect = moment.frame.getBoundingClientRect();

        if (rect.bottom < -viewportHeight * 0.25 || rect.top > viewportHeight * 1.25) return;

        const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
        const clamped = Math.max(0, Math.min(1, progress));
        const eased = clamped * clamped * (3 - 2 * clamped);
        const centered = eased - 0.5;

        moment.target = {
          foregroundX: centered * horizontalRange * moment.direction,
          foregroundY: centered * foregroundRange,
          foregroundScale: 1.025 + eased * 0.035,
          backdropX: centered * horizontalRange * -1.8 * moment.direction,
          backdropY: centered * backdropRange
        };

        if (!moment.current) {
          moment.current = { ...moment.target };
        }
      });
    }

    function renderMotion(timestamp) {
      let needsAnotherFrame = false;
      const elapsed = lastFrameTime ? Math.min(timestamp - lastFrameTime, 64) : 16.7;
      const smoothing = 1 - Math.exp(-elapsed / 210);
      lastFrameTime = timestamp;

      moments.forEach((moment) => {
        if (!moment.current || !moment.target) return;

        Object.keys(moment.current).forEach((key) => {
          const difference = moment.target[key] - moment.current[key];
          moment.current[key] += difference * smoothing;
          if (Math.abs(difference) > 0.02) needsAnotherFrame = true;
        });

        moment.img.style.setProperty("--moment-foreground-x", `${moment.current.foregroundX.toFixed(2)}px`);
        moment.img.style.setProperty("--moment-foreground-y", `${moment.current.foregroundY.toFixed(2)}px`);
        moment.img.style.setProperty("--moment-foreground-scale", moment.current.foregroundScale.toFixed(4));

        if (moment.backdrop) {
          moment.backdrop.style.setProperty("--moment-backdrop-x", `${moment.current.backdropX.toFixed(2)}px`);
          moment.backdrop.style.setProperty("--moment-backdrop-y", `${moment.current.backdropY.toFixed(2)}px`);
        }
      });

      if (needsAnotherFrame) {
        animationFrame = window.requestAnimationFrame(renderMotion);
      } else {
        animationFrame = 0;
        lastFrameTime = 0;
      }
    }

    function requestMotionUpdate() {
      updateTargets();
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(renderMotion);
      }
    }

    updateTargets();
    animationFrame = window.requestAnimationFrame(renderMotion);
    window.addEventListener("scroll", requestMotionUpdate, { passive: true });
    window.addEventListener("resize", requestMotionUpdate);
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Selector de pases ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  function buildPassSelector(max) {
    var sel = document.getElementById("inv-confirm-pases");
    if (!sel) return;
    sel.innerHTML = "";
    for (var i = 1; i <= max; i++) {
      var opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i === 1 ? "1 persona" : i + " personas";
      sel.appendChild(opt);
    }
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ WhatsApp ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  function buildWhatsAppButton(inv) {
    var phones = normalizeConfirmationPhones(inv.whatsapp_number);

    if (!phones.length) {
      var studioPhone = (inv.studio_whatsapp || "").replace(/\D/g, "");
      if (studioPhone.length >= 10 && studioPhone.length <= 15) phones.push(studioPhone);
    }

    if (!phones.length) {
      hide("inv-wa-block");
      return;
    }
    show("inv-wa-block");

    var primaryButton = document.getElementById("inv-btn-confirm") || document.getElementById("inv-wa-btn");
    var secondaryButton = document.getElementById("inv-btn-confirm-secondary");
    var primaryLabel = document.getElementById("inv-confirm-primary-label");
    var secondaryLabel = document.getElementById("inv-confirm-secondary-label");
    if (!primaryButton) return;

    async function openConfirmation(phone) {
      var selected = (document.getElementById("inv-confirm-pases") || {}).value || maxPasses;
      var title    = inv.title || "el evento";
      var mesa     = tableNum ? "\nMesa: " + tableNum : "";

      var msg =
        "Hola, confirmo mi asistencia al evento " + title + ".\n\n" +
        "Invitado: " + (guestName || "Invitado") + "\n" +
        "Pases confirmados: " + selected + "\n" +
        "Pases asignados: " + maxPasses +
        mesa;

      if (guestToken) {
        var rsvpResult = await db.rpc("submit_public_invitation_rsvp", {
          invitation_slug: slug,
          guest_token: guestToken,
          attending: true,
          confirmed_passes: clampInt(selected, 1, maxPasses),
          guest_message: null
        });
        if (rsvpResult.error) {
          console.error("No se pudo registrar la confirmacion:", rsvpResult.error);
        }
      }

      window.open(
        "https://wa.me/" + phone + "?text=" + encodeURIComponent(msg),
        "_blank",
        "noopener,noreferrer"
      );
    }

    primaryButton.onclick = function () { openConfirmation(phones[0]); };
    primaryButton.setAttribute("aria-label", "Confirmar por WhatsApp al contacto principal");
    if (primaryLabel) primaryLabel.textContent = "Confirmar \u00b7 +" + phones[0];

    if (secondaryButton && phones[1]) {
      secondaryButton.hidden = false;
      secondaryButton.style.display = "";
      secondaryButton.onclick = function () { openConfirmation(phones[1]); };
      if (secondaryLabel) secondaryLabel.textContent = "Confirmar \u00b7 +" + phones[1];
    } else if (secondaryButton) {
      secondaryButton.hidden = true;
      secondaryButton.style.display = "none";
      secondaryButton.onclick = null;
    }
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ showError ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  function showInvitationError(error) {
    console.error("Invitation render error:", error);

    const root = document.getElementById("invitationRoot") || document.body;
    const errorMessage = error instanceof Error ? error.message : String(error || "");
    let publicMessage = "No se pudo cargar la invitaci\u00f3n. Intenta de nuevo m\u00e1s tarde.";

    if (errorMessage === "La vista previa requiere una sesion activa de Invitta Studio.") {
      publicMessage = "Inicia sesi\u00f3n en Invitta Studio y vuelve a abrir la vista previa.";
    } else if (errorMessage === "No se pudo cargar este borrador con la sesion actual.") {
      publicMessage = "Este borrador no est\u00e1 disponible para la sesi\u00f3n actual.";
    } else if (errorMessage === "Invitacion no encontrada o no publicada.") {
      publicMessage = "Esta invitaci\u00f3n a\u00fan no est\u00e1 publicada o el enlace no es correcto.";
    }

    root.innerHTML = `
      <main class="inv-error-shell">
        <section class="inv-error-card">
          <h1>No pudimos abrirla</h1>
          <p>${escapeHtml(publicMessage)}</p>
          <p style="margin-top:20px; font-size:12px; color:#888; font-family:monospace; word-break:break-all;">Error técnico: ${escapeHtml(errorMessage)}</p>
        </section>
      </main>
    `;
  }

  function showError(message) {
    showInvitationError(message instanceof Error ? message : new Error(message || "Invitation render error"));
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Tema de colores ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  function applyTheme(color60, color30, color10, textColor) {
    var root = document.documentElement;
    
    var fallbackBg = color60 || "#ffffff";

    // Auto-calculate text color contrast if not provided
    var fallbackText = textColor;
    if (!fallbackText) {
      var hex = fallbackBg.replace("#", "");
      if (hex.length === 3) hex = hex.split('').map(function(c) { return c + c; }).join('');
      var r = parseInt(hex.substr(0,2), 16) || 255;
      var g = parseInt(hex.substr(2,2), 16) || 255;
      var b = parseInt(hex.substr(4,2), 16) || 255;
      var yiq = ((r*299)+(g*587)+(b*114))/1000;
      fallbackText = (yiq >= 128) ? "#2e2722" : "#fdfbf7"; // Dark text for light bg, light text for dark bg
    }

    // Regla 60-30-10 (Nuevas variables)
    if (color60) root.style.setProperty("--inv-60", color60);
    if (color30) root.style.setProperty("--inv-30", color30);
    if (color10) root.style.setProperty("--inv-10", color10);
    
    // Siempre settear el texto para evitar defaults invisibles
    root.style.setProperty("--inv-text", fallbackText);

    // Compatibilidad hacia atras con plantillas antiguas (usan 2 o 4 colores)
    var fallbackPrimary = color10 || color60 || "#cb1823"; // 10 es el acento (primary antiguo)
    var fallbackSecondary = color30 || "#ece5cf";

    root.style.setProperty("--inv-primary",        fallbackPrimary);
    root.style.setProperty("--inv-primary-light",  hexAlpha(fallbackPrimary, 0.12));
    root.style.setProperty("--inv-primary-border", hexAlpha(fallbackPrimary, 0.30));
    root.style.setProperty("--inv-secondary",      fallbackSecondary);
    root.style.setProperty("--inv-bg",             fallbackBg);
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Helpers DOM ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  function setText(id, val) {
    var e = document.getElementById(id);
    if (e) e.textContent = String(val);
  }

  function setHref(id, href) {
    var e = document.getElementById(id);
    if (e) e.href = href;
  }

  function show(id) {
    var e = document.getElementById(id);
    if (e) e.style.display = "";
  }

  function hide(id) {
    var e = document.getElementById(id);
    if (e) e.style.display = "none";
  }

  function toggle(id, cond) {
    var e = document.getElementById(id);
    if (e) e.style.display = cond ? "" : "none";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function textWithFallback(value, fallback) {
    const clean = String(value || "").trim();
    return clean || fallback;
  }

  function renderThankYouClosing(inv) {
    const section = document.getElementById("inv-thank-you-section");
    if (!section) return;

    setText("inv-thank-you-title", textWithFallback(inv.thank_you_title, "Con cariño"));
    setText("inv-thank-you-message", textWithFallback(inv.thank_you_message, "Gracias por ser parte de mis XV años"));

    const signature = String(inv.thank_you_signature || "").trim();
    const signatureEl = document.getElementById("inv-thank-you-signature");
    if (signatureEl) {
      signatureEl.textContent = signature;
      signatureEl.style.display = signature ? "" : "none";
    }

    show("inv-thank-you-section");
  }

  function renderShareSection(inv) {
    const hashtag = String(inv.instagram_hashtag || "").trim();
    if (!hashtag) {
      hide("inv-hashtag-block");
      return;
    }

    setText("inv-share-title", textWithFallback(inv.hashtag_section_title, "Comparte el momento"));
    setText("inv-hashtag", hashtag);
    setText("inv-share-message", textWithFallback(inv.hashtag_section_message, "Usa el hashtag en tus fotos y videos para que no se pierda ningún recuerdo."));
    show("inv-hashtag-block");
  }

  function normalizeItinerary(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter(item => item && (item.title || item.time));
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.filter(item => item && (item.title || item.time))
          : [];
      } catch (err) {
        // console.warn("No se pudo parsear itinerary:", err, value);
        return [];
      }
    }
    return [];
  }

  function getTimelineAltIcon(label = "") {
    const text = String(label || "").toLowerCase();

    if (text.includes("ceremonia") || text.includes("iglesia")) {
      return getPremiumSectionIcon ? getPremiumSectionIcon("ceremony") : "⛪";
    }

    if (text.includes("recepción") || text.includes("recepcion")) {
      return getPremiumSectionIcon ? getPremiumSectionIcon("reception") : "🥂";
    }

    if (text.includes("cena") || text.includes("banquete")) {
      return getPremiumSectionIcon ? getPremiumSectionIcon("gifts") : "🍽️";
    }

    if (text.includes("vals") || text.includes("baile") || text.includes("fiesta") || text.includes("musica")) {
      return getPremiumSectionIcon ? getPremiumSectionIcon("music") : "🎵";
    }

    return getPremiumSectionIcon ? getPremiumSectionIcon("itinerary") : "🕒";
  }

  function renderItinerary(value) {
    const section = document.getElementById("inv-itinerary-section");
    if (!section) return;

    const items = normalizeItinerary(value);

    if (!items.length) {
      section.style.display = "none";
      section.innerHTML = "";
      return;
    }

    section.className = "inv-section inv-night-timeline inv-timeline-alt-section reveal-on-scroll";
    section.style.setProperty("display", "block", "important");
    section.style.setProperty("visibility", "visible", "important");

    const itemsHtml = items.map((item, index) => {
      const eventTitle = item.title || "";
      const icon = getTimelineAltIcon(eventTitle);
      const isLeft = index % 2 === 0;
      const rowClass = isLeft ? "is-left" : "is-right";
      const timeHtml = item.time ? `<p class="inv-timeline-alt-time">${escapeHtml(item.time)}</p>` : "";

      if (isLeft) {
        return `
          <article class="inv-timeline-alt-row ${rowClass}">
            <div class="inv-timeline-alt-side inv-timeline-alt-content">
              ${timeHtml}
              <p class="inv-timeline-alt-event">${escapeHtml(eventTitle)}</p>
            </div>
            <div class="inv-timeline-alt-dot-wrap">
              <span class="inv-timeline-alt-dot"></span>
            </div>
            <div class="inv-timeline-alt-side inv-timeline-alt-icon">
              ${icon}
            </div>
          </article>
        `;
      } else {
        return `
          <article class="inv-timeline-alt-row ${rowClass}">
            <div class="inv-timeline-alt-side inv-timeline-alt-icon">
              ${icon}
            </div>
            <div class="inv-timeline-alt-dot-wrap">
              <span class="inv-timeline-alt-dot"></span>
            </div>
            <div class="inv-timeline-alt-side inv-timeline-alt-content">
              ${timeHtml}
              <p class="inv-timeline-alt-event">${escapeHtml(eventTitle)}</p>
            </div>
          </article>
        `;
      }
    }).join("");

    section.innerHTML = `
      <div class="inv-timeline-alt-card">
        <div class="inv-timeline-alt-header">
          <p class="inv-timeline-alt-kicker">Itinerario</p>
          <h2 class="inv-timeline-alt-title">Momentos de la Noche</h2>
        </div>
        <div class="inv-timeline-alt-list">
          <div class="inv-timeline-alt-line"></div>
          ${itemsHtml}
        </div>
      </div>
    `;
  }
  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Helpers texto / números ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  function sanitize(str) {
    return String(str || "").trim().slice(0, 200);
  }

  function clampInt(val, min, max) {
    var n = parseInt(val, 10);
    return isNaN(n) ? min : Math.min(Math.max(n, min), max);
  }

  function parseLocalDate(dateString) {
    if (!dateString) return null;
    var parts = dateString.split("-").map(Number);
    if (!parts[0] || !parts[1] || !parts[2]) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  /** Fecha larga: "sábado, 14 de febrero de 2026" */
  function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      return parseLocalDate(dateStr).toLocaleDateString("es-MX", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    } catch (e) { return dateStr; }
  }

  /** Fecha corta: "14 Feb 2026" */
  function formatDateShort(dateStr) {
    if (!dateStr) return "";
    try {
      return parseLocalDate(dateStr).toLocaleDateString("es-MX", {
        day: "numeric", month: "short", year: "numeric"
      });
    } catch (e) { return dateStr; }
  }

  function formatTime(timeStr) {
    if (!timeStr) return "";
    try {
      var parts = timeStr.split(":");
      var d = new Date();
      d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0);
      return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return timeStr; }
  }

  /* ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ Color helper ¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬¢íÆ’Ã†â€™íâ€š¢íÆ’¢íâ€š¬íÆ’Ã†â€™íâ€š¢íÆ’¢í¢Ã¢â‚¬Å¡¬íâ€¦¡¬ */
  function hexAlpha(hex, a) {
    var h = hex || "#C9A46A";
    var r = parseInt(h.slice(1, 3), 16) || 0;
    var g = parseInt(h.slice(3, 5), 16) || 0;
    var b = parseInt(h.slice(5, 7), 16) || 0;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

})();

function setupSectionIconReveal() {
  const icons = Array.from(document.querySelectorAll(".inv-section-icon"))
    .filter((icon) => {
      const style = window.getComputedStyle(icon);
      return style.display !== "none" && style.visibility !== "hidden";
    });

  if (!icons.length) return;

  icons.forEach((icon) => {
    icon.classList.remove("icon-visible");
  });

  function revealIcons() {
    const triggerPoint = window.innerHeight * 0.9;

    icons.forEach((icon) => {
      if (icon.classList.contains("icon-visible")) return;

      const rect = icon.getBoundingClientRect();

      if (rect.top < triggerPoint && rect.bottom > 0) {
        icon.classList.add("icon-visible");
      }
    });
  }

  setTimeout(revealIcons, 300);
  window.addEventListener("scroll", revealIcons, { passive: true });
  window.addEventListener("resize", revealIcons);

  setTimeout(() => {
    document.querySelectorAll(".inv-section-icon").forEach((icon) => {
      const rect = icon.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        icon.classList.add("icon-visible");
      }
    });
  }, 1200);
}
function getSafeRevealSections() {
  const selectors = [
    "#inv-countdown-section",
    "#inv-parents-block",
    "#inv-welcome-block",
    ".inv-moments-header",
    "#inv-ceremony-block",
    "#inv-reception-block",
    "#inv-itinerary-section",
    "#inv-dresscode-block",
    "#inv-gifts-block",
    "#inv-pass-section",
    "#inv-wa-block",
    "#inv-thank-you-section",
    "#inv-hashtag-block",
    ".inv-section-card:not(.inv-moment-frame):not(.inv-gallery-item)"
  ];

  return Array.from(new Set(document.querySelectorAll(selectors.join(",")))).filter((element) => {
    if (!element) return false;
    if (element.closest(".inv-hero")) return false;
    if (element.closest(".inv-music-player")) return false;
    if (element.classList.contains("inv-music-player")) return false;
    return true;
  });
}

function setupSafeSectionReveal() {
  const sections = getSafeRevealSections();

  if (!sections.length) return;

  sections.forEach((section) => {
    section.removeAttribute("data-safe-reveal-complete");
    section.classList.remove("inv-safe-visible");
    section.classList.add("inv-safe-reveal");
  });

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("inv-safe-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("inv-safe-visible");
        entry.target.setAttribute("data-safe-reveal-complete", "true");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -10% 0px"
    }
  );

  sections.forEach((section) => observer.observe(section));
}
function setupRevealAnimations() {
  setupSafeSectionReveal();
}

function getInvitationRevealSections() {
  const selectors = [
    "#inv-countdown-section",
    "#inv-parents-block",
    "#inv-welcome-block",
    "#inv-ceremony-block",
    "#inv-reception-block",
    "#inv-dresscode-block",
    "#inv-gifts-block",
    "#inv-pass-section",
    "#inv-wa-block",
    "#inv-thank-you-section",
    "#inv-hashtag-block",
    ".inv-parents-card",
    ".inv-welcome-block",
    ".inv-event-card",
    ".inv-section-card",
    ".inv-pass-card",
    ".inv-rsvp-card",
    ".inv-thanks-card",
    ".inv-thank-you-card",
    ".inv-share-card",
    ".inv-share-section",
    ".inv-timeline-alt-section",
    ".inv-moments-header",
    ".inv-moment-frame",
    ".inv-gallery-item"
  ];

  return Array.from(document.querySelectorAll(selectors.join(",")))
    .filter((element) => {
      if (!element) return false;
      if (element.closest(".inv-hero")) return false;
      if (element.closest(".inv-music-player")) return false;
      if (element.classList.contains("inv-music-player")) return false;
      if (isSlowRevealProblemElement(element)) return false;
      return true;
    });
}

function isTunedRevealElement(element) {
  return element.matches(
    ".inv-moment-frame, .inv-gallery-item, .inv-moments-header, .inv-timeline-alt-section, .inv-share-section, .inv-share-card, #inv-hashtag-block"
  );
}

function prepareRegularRevealElement(element) {
  if (isTunedRevealElement(element)) return;

  element.style.opacity = "0";
  element.style.transform = "translate3d(0, 76px, 0) scale(0.955)";
  element.style.transition = "opacity 3200ms cubic-bezier(0.22, 0, 0.16, 1), transform 2600ms cubic-bezier(0.16, 1, 0.3, 1)";
  element.style.willChange = "opacity, transform";
}

function showRegularRevealElement(element) {
  if (isTunedRevealElement(element)) return;

  element.style.opacity = "1";
  element.style.transform = "translate3d(0, 0, 0) scale(1)";
}

function getSlowRevealProblemSections() {
  const selectors = [
    "#inv-parents-block",
    "#inv-welcome-block",
    "#inv-ceremony-block",
    "#inv-reception-block",
    "#inv-dresscode-block",
    "#inv-gifts-block",
    "#inv-pass-section",
    "#inv-pass-block",
    "#inv-wa-block",
    "#inv-rsvp-block"
  ];

  return Array.from(new Set(document.querySelectorAll(selectors.join(","))))
    .filter((element) => {
      if (!element) return false;
      if (element.closest(".inv-hero")) return false;
      if (element.closest(".inv-music-player")) return false;
      if (element.classList.contains("inv-music-player")) return false;
      return true;
    });
}

function isSlowRevealProblemElement(element) {
  const selector = "#inv-parents-block, #inv-welcome-block, #inv-ceremony-block, #inv-reception-block, #inv-dresscode-block, #inv-gifts-block, #inv-pass-section, #inv-pass-block, #inv-wa-block, #inv-rsvp-block";
  return element.matches(selector) || Boolean(element.closest(selector));
}

function setupSlowRevealForProblemSections() {
  const sections = getSlowRevealProblemSections();

  if (!sections.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    sections.forEach((section) => {
      section.style.setProperty("opacity", "1", "important");
      section.style.setProperty("transform", "none", "important");
      section.style.setProperty("transition", "none", "important");
    });
    return;
  }

  sections.forEach((section) => {
    section.style.setProperty("opacity", "0", "important");
    section.style.setProperty("transform", "translate3d(0, 74px, 0) scale(0.955)", "important");
    section.style.setProperty("transition", "opacity 1550ms cubic-bezier(0.22, 1, 0.36, 1), transform 1550ms cubic-bezier(0.16, 1, 0.3, 1)", "important");
    section.style.setProperty("will-change", "opacity, transform");
  });

  function showSection(section) {
    section.style.setProperty("opacity", "1", "important");
    section.style.setProperty("transform", "translate3d(0, 0, 0) scale(1)", "important");
  }

  if (!("IntersectionObserver" in window)) {
    sections.forEach(showSection);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        showSection(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -18% 0px"
    }
  );

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      sections.forEach((section) => {
        observer.observe(section);
      });
    });
  });

  setTimeout(() => {
    sections.forEach((section) => {
      const style = window.getComputedStyle(section);
      if (style.display === "none" || style.visibility === "hidden") return;

      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.82 && rect.bottom > 0) {
        showSection(section);
      }
    });
  }, 900);
}

function setupRevealOnScroll() {
  const sections = getInvitationRevealSections();

  // console.log("Scroll fade sections:", sections.length);

  if (!sections.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  sections.forEach((section) => {
    section.classList.add("inv-scroll-fade");
    section.classList.remove("inv-scroll-visible");
    prepareRegularRevealElement(section);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    sections.forEach((section) => {
      section.classList.add("inv-scroll-visible");
      showRegularRevealElement(section);
    });
    return;
  }

  document.body.classList.add("inv-reveal-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("inv-scroll-visible");
        showRegularRevealElement(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.22,
      rootMargin: "0px 0px -14% 0px"
    }
  );

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      sections.forEach((section) => {
        observer.observe(section);
      });
    });
  });
}

function fitHeroTitleSingleLine() {
  const title = document.getElementById("inv-title");
  const content = title ? title.closest(".inv-hero-content") : null;
  if (!title || !content) return;

  title.style.whiteSpace = "nowrap";
  title.style.maxWidth = "100%";
  title.style.fontSize = "";

  const maxSize = parseFloat(window.getComputedStyle(title).fontSize) || 96;
  const minSize = 18;
  let low = minSize;
  let high = maxSize;

  for (let i = 0; i < 12; i += 1) {
    const mid = (low + high) / 2;
    title.style.fontSize = mid + "px";

    if (title.scrollWidth <= content.clientWidth) {
      low = mid;
    } else {
      high = mid;
    }
  }

  title.style.fontSize = low + "px";

  if (title.scrollWidth > content.clientWidth + 1) {
    title.style.whiteSpace = "normal";
    title.style.overflowWrap = "anywhere";
    title.style.textWrap = "balance";
  }
}

function fitHeroHonoreeSingleLine() {
  const honoree = document.getElementById("inv-honoree");
  const content = honoree ? honoree.closest(".inv-hero-content") : null;
  if (!honoree || !content) return;

  honoree.style.whiteSpace = "nowrap";
  honoree.style.maxWidth = "100%";
  honoree.style.fontSize = "";

  const maxSize = parseFloat(window.getComputedStyle(honoree).fontSize) || 32;
  const minSize = 18;
  let low = minSize;
  let high = maxSize;

  for (let i = 0; i < 12; i += 1) {
    const mid = (low + high) / 2;
    honoree.style.fontSize = mid + "px";

    if (honoree.scrollWidth <= content.clientWidth) {
      low = mid;
    } else {
      high = mid;
    }
  }

  honoree.style.fontSize = low + "px";

  if (honoree.scrollWidth > content.clientWidth + 1) {
    honoree.style.whiteSpace = "normal";
    honoree.style.overflowWrap = "anywhere";
    honoree.style.textWrap = "balance";
  }
}

function toSmartTitleCase(str) {
  if (!str) return "";
  if (str === str.toUpperCase() && /[A-Z]/.test(str)) {
    if (str.includes("XV") || str.includes("BODA") || str.includes("BAUTIZO") || str.includes("AÑOS")) {
      return str;
    }
    return str.toLowerCase().replace(/\b\p{L}/gu, (char) => char.toUpperCase());
  }
  return str;
}

function resolveHeroHeading(title, honoreeName, eventType) {
  const rawTitle = String(title || "").trim();
  let honoree = String(honoreeName || "").trim();
  let eventTitle = rawTitle;

  if (!honoree && (!eventType || String(eventType).toLowerCase() === "xv")) {
    const legacyTitle = rawTitle.match(/^(.*?\b(?:XV|15)\s+A(?:\u00f1|n)os)(?:\s+de)?\s+(.+)$/i);

    if (legacyTitle) {
      eventTitle = legacyTitle[1].trim();
      honoree = legacyTitle[2].trim();
    }
  }

  // Corregir nombres que vengan todos en mayúsculas desde la BD
  eventTitle = toSmartTitleCase(eventTitle);
  honoree = toSmartTitleCase(honoree);

  return {
    title: buildHeroEventTitle(eventTitle, honoree),
    honoree
  };
}

function buildHeroEventTitle(title, honoreeName) {
  const fallback = "Mis XV Años";
  const rawTitle = String(title || "").trim();
  const honoree = String(honoreeName || "").trim();

  if (!rawTitle) return fallback;
  if (!honoree) return rawTitle;

  const escapedName = honoree.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let cleanTitle = rawTitle
    .replace(new RegExp("\\s+(de|para)\\s+" + escapedName + "\\s*$", "i"), "")
    .replace(new RegExp("\\s+" + escapedName + "\\s*$", "i"), "")
    .trim();

  if (/^xv\s+a(?:\u00f1|n)os$/i.test(cleanTitle)) {
    cleanTitle = "Mis XV Años";
  }

  return cleanTitle || fallback;
}

window.addEventListener("resize", () => {
  window.requestAnimationFrame(() => {
    fitHeroTitleSingleLine();
    fitHeroHonoreeSingleLine();
  });
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    window.requestAnimationFrame(() => {
      fitHeroTitleSingleLine();
      fitHeroHonoreeSingleLine();
    });
  });
}
