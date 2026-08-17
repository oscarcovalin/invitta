# Fase 7Y — QA integral del generador

## Entorno revisado
Revisión estática de código.
Inspección de diffs.
Ausencia de pruebas automatizadas.
Ausencia de credenciales o sesión Supabase.
Ausencia de pruebas reales en dos pestañas.
Ausencia de prueba móvil real.
Ausencia de prueba en producción.

## Commit base
236d197acd3dd3b109487c6125a32a8ae6fa713b

## Archivos revisados
`assets/js/generar-invitacion-app.js`

## Matriz de pruebas

| Categ. | ID | Escenario | Resultado Esperado | Tipo | Estado | Observaciones |
|---|---|---|---|---|---|---|
| 1. Inicialización | 1 | Usuario sin sesión | Navegación a login | ESTÁTICA | PASS ESTÁTICA | Flujo presente en código; ejecución funcional no realizada. |
| 1. Inicialización | 2 | Sesión válida | Inicializa generador | FUNCIONAL | BLOQUEADA | Prueba bloqueada por falta de entorno autenticado. |
| 1. Inicialización | 3 | Estudio no encontrado | Operación bloqueada | FUNCIONAL | BLOQUEADA | Prueba bloqueada por falta de entorno autenticado. |
| 1. Inicialización | 4 | ID usuario inválido | Operación bloqueada | ESTÁTICA | PASS ESTÁTICA | Validación presente en código. |
| 1. Inicialización | 5 | ID estudio ausente | Operación bloqueada | ESTÁTICA | PASS ESTÁTICA | Validación presente en código. |
| 1. Inicialización | 6 | Suscripción auth única | Solo 1 listener auth | ESTÁTICA | PASS ESTÁTICA | Comprobado un solo registro en el código. |
| 1. Inicialización | 7 | Listener pagehide | Solo 1 listener | ESTÁTICA | PASS ESTÁTICA | Comprobado un solo registro en el código. |
| 1. Inicialización | 8 | Listener beforeunload | Solo 1 listener | ESTÁTICA | PASS ESTÁTICA | Comprobado un solo registro en el código. |
| 1. Inicialización | 9 | Controles habilitados a tiempo | Tras inicialización | ESTÁTICA | PASS ESTÁTICA | Modificación del DOM ocurre post-init. |
| 2. Carga JSON | 10 | Carga JSON válido | Configuración cargada | FUNCIONAL | BLOQUEADA | Sin ejecución en navegador. |
| 2. Carga JSON | 11 | Extensión .JSON mayúsculas | Aceptado | ESTÁTICA | PASS ESTÁTICA | RegEx incluye `i` flag validado estáticamente. |
| 3. Seguridad JSON | 12 | Evitar inyección en resumen | Resumen seguro | ESTÁTICA | PASS ESTÁTICA | Uso exclusivo de `textContent` en resumen. |
| 4. Generación | 13 | Generación portada | Elemento HTML válido | FUNCIONAL | BLOQUEADA | Sin renderizado real verificado. |
| 4. Generación | 14 | Generación con acentos | Renderizado correcto | FUNCIONAL | BLOQUEADA | Sin renderizado real verificado. |
| 5. Descargas | 15 | Descarga HTML | Archivo generado seguro | FUNCIONAL | BLOQUEADA | Descarga real no realizada. |
| 5. Descargas | 16 | Descarga Manifiesto | Sin datos internos | ESTÁTICA | PASS ESTÁTICA | Exclusión de internal fields en código. |
| 5. Descargas | 17 | Descarga Paquete | Generado correctamente | FUNCIONAL | BLOQUEADA | Creación de zip no ejecutada. |
| 5. Descargas | 18 | Descarga Respaldo JSON | Limpio de internal fields | ESTÁTICA | PASS ESTÁTICA | Campos de sistema filtrados en código. |
| 6. Creación | 19 | Creación de borrador | Inserta un borrador | ESTÁTICA | PASS ESTÁTICA | Consulta INSERT inspeccionada estáticamente. |
| 7. Recuperación | 20 | Recuperar borrador | Carga datos de DB | FUNCIONAL | BLOQUEADA | Prueba bloqueada por falta de entorno autenticado y DB. |
| 7. Recuperación | 21 | Recuperación cancelada | Borra estados draft | ESTÁTICA | PASS ESTÁTICA | Limpieza de variables en `cancelDraftRecovery` correcta. |
| 8. Actualización | 22 | Actualización borrador | Modifica borrador | ESTÁTICA | PASS ESTÁTICA | Filtro UPDATE validado en código. |
| 9. Concurrencia | 23 | Conflicto detectado | Bloquea actualización | ESTÁTICA | PASS ESTÁTICA | Mecanismo de validación optimista en código. |
| 9. Concurrencia | 24 | Conflicto 2 Pestañas | Conserva local | FUNCIONAL | BLOQUEADA | Prueba funcional en dos pestañas no realizada. |
| 10. Publicación | 25 | Publicar | published = true | ESTÁTICA | PASS ESTÁTICA | UPDATE a published=true en código validado. |
| 11. Expiración de sesión| 26 | Expiración de sesión | Muestra panel modal | ESTÁTICA | PASS ESTÁTICA | Funciones de panel y bloqueo detectados en código. |
| 12. Cambios sin guardar| 27 | Cambios sin guardar | Activa beforeunload | ESTÁTICA | PASS ESTÁTICA | Condicional en listener documentado. |
| 13. Seguridad XSS | 28 | innerHTML prohibido | createElement usado | ESTÁTICA | PASS ESTÁTICA | No se detectan inyecciones `innerHTML`. |
| 13. Seguridad XSS | 29 | Evaluación dinámica | eval ausente | ESTÁTICA | PASS ESTÁTICA | `eval` / `Function` no hallados. |
| 14. Accesibilidad | 30 | Modales y diálogos | roles ARIA | ESTÁTICA | PASS ESTÁTICA | Atributos definidos por código. |
| 15. Responsive | 31 | Diseño móvil | Visualización correcta | FUNCIONAL | BLOQUEADA | Prueba en dispositivo o emulador no realizada. |
| 16. Consola | 32 | Errores limpios | Ausencia de crash | FUNCIONAL | BLOQUEADA | No se corrió el flujo en browser. |
| 17. Red | 33 | Fallo de conexión | Captura de error | FUNCIONAL | BLOQUEADA | Prueba de conectividad simulada pendiente. |
| 18. Producción | 34 | Despliegue en prod | Todo funcional | FUNCIONAL | BLOQUEADA | No se verificó ambiente producción en Vercel. |

## Evidencia disponible
- **Commit base:** 236d197acd3dd3b109487c6125a32a8ae6fa713b
- **Archivos inspeccionados:** `assets/js/generar-invitacion-app.js`
- **Comandos ejecutados:** Búsqueda mediante `Select-String` y lectura directa del AST en PowerShell de las funciones clave: `removeInternalBackupFields`, `isStudioAuthenticationError`, `cancelDraftRecovery`, y chequeo de listeners (`beforeunload`, `pagehide`).
- **Resultados de búsquedas estáticas:** 
  - Ausencia de `eval(`, `innerHTML =` (con inputs no controlados), múltiples `beforeunload`.
  - Presencia y filtrado de consultas a supabase `.from("studio_invitations")` verificadas.

## Fallos encontrados

* **Fallo 1 (Severidad: DEFENSA EN PROFUNDIDAD):** La función `removeInternalBackupFields` no incluía en su lista de exclusión `forbidden` a las nuevas variables globales introducidas en la Fase 7W y 7X (`initialStudioUserId`, `draftConflictDetected`, `knownDraftUpdatedAt`, `studioSessionInvalidated`).
  * **Causa:** Estas variables operan en el estado global (y no necesariamente como propiedades directas de `loadedConfig`), pero para evitar la mínima posibilidad de fugas de estado interno si estos valores se anidaran, se omitieron previamente de la lista.
  * **Corrección:** Se añadió una capa de defensa explícita sumándolos a `forbidden` en `removeInternalBackupFields()`.

## Regresiones descartadas
Ninguna (la revisión se limitó al código estático y no ejecutó los flujos en vivo, por lo que no se han descartado o confirmado regresiones en ejecución).

## Riesgos pendientes
* Falta de prueba funcional autenticada.
* Falta de prueba con Supabase real.
* Falta de prueba de dos pestañas.
* Falta de prueba con dos usuarios.
* Falta de prueba móvil.
* Falta de prueba en producción.
* Falta de automatización de regresión.
* Tamaño y complejidad del archivo `generar-invitacion-app.js`.

## Resultado final
La revisión estática no encontró bloqueadores evidentes en los mecanismos de seguridad, concurrencia y sesión. Las pruebas funcionales con Supabase, dos pestañas, expiración de sesión y producción permanecen bloqueadas o pendientes.

## Recomendación de liberación
**APTO CON OBSERVACIONES**

## Resumen numérico
* **Total de pruebas:** 34
* **PASS ESTÁTICA:** 21
* **PASS FUNCIONAL:** 0
* **FAIL:** 0
* **BLOQUEADAS:** 13
