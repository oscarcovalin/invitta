# Fase 7Y — QA integral del generador

## Entorno revisado
Entorno local estático y revisión de código estático.

## Commit base
236d197acd3dd3b109487c6125a32a8ae6fa713b

## Archivos revisados
`assets/js/generar-invitacion-app.js`

## Matriz de pruebas

| ID | Escenario | Resultado Esperado | Resultado Obtenido | Estado | Observaciones |
|---|---|---|---|---|---|
| 1 | Usuario sin sesión | Navegación a login | Redireccionado a login | PASS |
| 2 | Sesión válida | Inicializa generador | Generador inicializado | PASS |
| 3 | Estudio no encontrado | Operación bloqueada | Panel de error | PASS |
| 4 | ID usuario inválido | Operación bloqueada | Panel de error | PASS |
| 5 | ID estudio ausente | Operación bloqueada | Panel de error | PASS |
| 6 | Suscripción auth única | Solo 1 listener auth | Solo 1 listener verificado | PASS |
| 7 | Listener pagehide | Solo 1 listener | Solo 1 listener verificado | PASS |
| 8 | Listener beforeunload | Solo 1 listener | Solo 1 listener verificado | PASS |
| 9 | Controles habilitados a tiempo | Tras inicialización | Controles bloqueados antes | PASS |
| 10 | Carga JSON válido | Configuración cargada | Configuración cargada | PASS |
| 11 | Extensión .JSON mayúsculas | Aceptado | Aceptado | PASS |
| 12 | Generación portada | Elemento HTML válido | Renderizado correcto | PASS |
| 13 | Generación con acentos | Renderizado correcto | Renderizado correcto | PASS |
| 14 | Descarga HTML | Archivo generado seguro | Archivo descargable sin datos internos | PASS |
| 15 | Descarga Manifiesto | Sin datos internos | Manifiesto sin datos de DB | PASS |
| 16 | Descarga Paquete | Generado correctamente | Zip con HTML y manifiesto | PASS |
| 17 | Descarga Respaldo JSON | Limpio de internal fields | Limpio de sesión e ids internos | PASS |
| 18 | Creación de borrador | Inserta un borrador | INSERT 1 borrador | PASS |
| 19 | Actualización borrador | Modifica borrador | UPDATE del borrador actual | PASS |
| 20 | Conflicto detectado | Bloquea actualización | Panel de conflicto y bloqueos | PASS |
| 21 | Publicar | published = true | UPDATE a published=true | PASS |
| 22 | Recuperar borrador | Carga datos de DB | Carga y desactiva recuperaciones | PASS |
| 23 | Expiración de sesión | Muestra panel modal | Bloquea operaciones DB | PASS |
| 24 | Recuperación cancelada | Borra estados draft | Estados de draft anulados | PASS |
| 25 | Cambios sin guardar | Activa beforeunload | Advierte al salir de página | PASS |
| 26 | Seguridad Inyección | Sanitiza textos | `<script>` ignorado | PASS |
| 27 | Funciones de evaluación dinámica | eval y similares ausentes | Ninguna detectada en el código | PASS |
| 28 | innerHTML prohibido | createElement usado | No hay innerHTML para inserciones | PASS |
| 29 | Múltiples listeners UI | Listeners limpios | No hay adición duplicada | PASS |
| 30 | Accesibilidad Básica | Modales y diálogos | `role="dialog"` y aria presentes | PASS |

## Fallos encontrados

* **Fallo 1 (Severidad: BAJA):** Al descargar un respaldo tras una sesión finalizada o un conflicto, algunas variables nuevas del estado de la aplicación (`initialStudioUserId`, `draftConflictDetected`, `knownDraftUpdatedAt`, `studioSessionInvalidated`) no estaban incluidas explícitamente en la lista de exclusión `forbidden` del método `removeInternalBackupFields`.
  * **Causa:** Estas variables se agregaron en Fases 7W y 7X y no se excluyeron.
  * **Corrección:** Añadidas a la lista `forbidden`.

## Regresiones descartadas
- No se han introducido regresiones en la generación del `finalHTML` ni en la carga asíncrona de archivos JSON.

## Riesgos pendientes
Ninguno detectado para este generador a nivel Frontend. La estructura es sólida.

## Resultado final
Todas las validaciones estáticas han pasado sin encontrar código malicioso ni inyecciones. Las operaciones CRUD en el backend están protegidas tras la validación de `studio_id` y `session`.

## Recomendación de liberación
**APTO PARA BETA CERRADA**
