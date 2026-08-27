const fs = require('fs');
const path = require('path');
const templateEngine = require('./template-engine.js');

let passedTests = 0;
let failedTests = 0;
const auditResults = {
  categories: {},
  summary: { total: 0, passed: 0, failed: 0 }
};

function runTest(category, testName, fn) {
  if (!auditResults.categories[category]) {
    auditResults.categories[category] = [];
  }
  try {
    fn();
    passedTests++;
    auditResults.categories[category].push({ name: testName, status: 'PASSED' });
  } catch (err) {
    failedTests++;
    auditResults.categories[category].push({ name: testName, status: 'FAILED', error: err.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log('====================================================');
console.log('🔍 INICIANDO AUDITORÍA INTEGRAL: INVITTA 2.0 BETA');
console.log('====================================================\n');

// 1. MOTOR DE PLANTILLAS Y CONFIGURACIONES BASE
runTest('1. Template Engine & Themes', 'defaultConfig contiene todas las propiedades requeridas', () => {
  const cfg = templateEngine.defaultConfig;
  assert(cfg.eventType, 'Falta eventType');
  assert(cfg.brideName && cfg.groomName, 'Faltan nombres de novios');
  assert(cfg.ceremony && cfg.reception, 'Faltan detalles de ceremonia o recepción');
  assert(cfg.itinerary && Array.isArray(cfg.itinerary), 'Falta itinerario como array');
  assert(cfg.dressCode && cfg.giftRegistry, 'Falta código de vestimenta o mesa de regalos');
  assert(cfg.sharedAlbum && cfg.sharedAlbum.accessCode, 'Falta configuración del álbum colaborativo');
  assert(cfg.whatsappNumber, 'Falta whatsappNumber');
  assert(cfg.whatsappHosts && Array.isArray(cfg.whatsappHosts), 'Falta whatsappHosts como array');
  assert(cfg.rsvpTitle, 'Falta rsvpTitle');
});

runTest('1. Template Engine & Themes', 'Todos los temas predeterminados compilan sin errores ni fugas de variables', () => {
  const themes = ['vino', 'esmeralda', 'medianoche', 'lavanda', 'oro'];
  themes.forEach(theme => {
    const html = templateEngine.generateHTML(templateEngine.defaultConfig, theme);
    assert(html.length > 50000, 'El HTML generado para el tema ' + theme + ' es demasiado corto');
    assert(html.includes('<!DOCTYPE html>'), 'El HTML de ' + theme + ' no contiene DOCTYPE válido');
    assert(!html.includes('>undefined<'), 'El HTML de ' + theme + ' contiene fuga de variable >undefined<');
    assert(!html.includes('src="undefined"'), 'El HTML de ' + theme + ' contiene src="undefined"');
    assert(!html.includes('href="undefined"'), 'El HTML de ' + theme + ' contiene href="undefined"');
  });
});

runTest('1. Template Engine & Themes', 'Soporte completo para Boda y XV Años con Mis Chambelanes', () => {
  const cfgBoda = Object.assign({}, templateEngine.defaultConfig, { eventType: 'boda' });
  const htmlBoda = templateEngine.generateHTML(cfgBoda, 'vino');
  assert(htmlBoda.includes('heroBrideName'), 'No renderiza nombres de boda');
  assert(htmlBoda.includes('Damas de Honor & Best Men'), 'No incluye Damas de Honor en boda');

  const cfgXv = Object.assign({}, templateEngine.defaultConfig, { eventType: 'xv', name: 'Valentina Martínez' });
  const htmlXv = templateEngine.generateHTML(cfgXv, 'vino');
  assert(htmlXv.includes('heroName'), 'No renderiza nombre de XV');
  assert(htmlXv.includes('Valentina Martínez'), 'No incluye el nombre de la quinceañera');
  assert(htmlXv.includes('Mis Chambelanes'), 'No incluye Mis Chambelanes en XV Años');
});

// 2. MÓDULO RSVP & PASES VIP PERGAMINO
runTest('2. Módulo RSVP & Pases', 'Estructura pergamino limpia sin campos obsoletos', () => {
  const html = templateEngine.generateHTML(templateEngine.defaultConfig, 'vino');
  assert(html.includes('id="pergaminoCard"'), 'Falta tarjeta pergaminoCard');
  assert(html.includes('id="tituloRsvpPergamino"'), 'Falta título dinámico de RSVP');
  assert(html.includes('id="nombre"'), 'Falta input #nombre');
  assert(html.includes('id="email"'), 'Falta input #email');
  assert(html.includes('id="asistencia"'), 'Falta select #asistencia');
  assert(html.includes('id="pases"'), 'Falta select #pases');
  assert(html.includes('id="dieta"'), 'Falta select #dieta');
  assert(!html.includes('id="alergias"'), 'Todavía existe el campo obsoleto #alergias');
  assert(html.includes('id="rsvpSubmit"'), 'Falta botón de envío #rsvpSubmit');
  assert(html.includes('id="rsvpSuccess"'), 'Falta vista de éxito #rsvpSuccess');
  assert(html.includes('id="passTicketPergamino"'), 'Falta boleto digital oficial');
});

runTest('2. Módulo RSVP & Pases', 'Multi-Anfitrión WhatsApp y Devolución de QR al Invitado', () => {
  const html = templateEngine.generateHTML(templateEngine.defaultConfig, 'vino');
  assert(html.includes('id="btnSharePassWhatsapp"'), 'Falta botón de notificar anfitrión');
  assert(html.includes('id="btnSendToMyWhatsapp"'), 'Falta botón de enviar a WhatsApp del invitado');
  assert(html.includes('id="btnDownloadPassImage"'), 'Falta botón de guardar/imprimir pase');
  assert(html.includes('id="multiHostWhatsappContainer"'), 'Falta contenedor de anfitriones secundarios');
  assert(html.includes('buildGuestMessageText'), 'Falta generador de mensaje para el invitado');
  assert(html.includes('buildHostMessageText'), 'Falta generador de mensaje para el anfitrión');
});

runTest('2. Módulo RSVP & Pases', 'Estilo responsivo para títulos largos vs RSVP', () => {
  const cfgLong = Object.assign({}, templateEngine.defaultConfig, { rsvpTitle: 'Confirmación de Asistencia' });
  const htmlLong = templateEngine.generateHTML(cfgLong, 'vino');
  assert(htmlLong.includes('rsvp-title-long'), 'No aplica rsvp-title-long a títulos extensos');

  const cfgShort = Object.assign({}, templateEngine.defaultConfig, { rsvpTitle: 'RSVP' });
  const htmlShort = templateEngine.generateHTML(cfgShort, 'vino');
  assert(htmlShort.includes('rsvp-title-short'), 'No aplica rsvp-title-short al título RSVP');
});

runTest('2. Módulo RSVP & Pases', 'Navegación fluida del botón superior RSVP', () => {
  const html = templateEngine.generateHTML(templateEngine.defaultConfig, 'vino');
  assert(html.includes('id="btnHeaderRsvp"'), 'Falta #btnHeaderRsvp en el header');
  assert(html.includes('scrollToSection'), 'Falta la función scrollToSection');
  assert(html.includes('window.scrollToSection'), 'scrollToSection no está expuesto globalmente');
});

// 3. ÁLBUM COLABORATIVO & CÁPSULA DE RECUERDOS
runTest('3. Álbum Colaborativo', 'Tarjeta motivacional con 3 últimas fotos de invitados', () => {
  const html = templateEngine.generateHTML(templateEngine.defaultConfig, 'vino');
  assert(html.includes('id="albumRecentPhotosCard"'), 'Falta la tarjeta de últimas fotos');
  assert(html.includes('id="albumRecentPhotosGrid"'), 'Falta la cuadrícula de fotos recientes');
  assert(html.includes('renderRecentGuestPhotos'), 'Falta la función de renderizado de fotos recientes');
});

runTest('3. Álbum Colaborativo', 'Seguridad anti-spam y PIN maestro de los novios', () => {
  const html = templateEngine.generateHTML(templateEngine.defaultConfig, 'vino');
  assert(html.includes('id="albumLockBlock"'), 'Falta candado de subida de invitados');
  assert(html.includes('id="modalBrideGallery"'), 'Falta modal de galería privada de novios');
  assert(html.includes('id="inputBrideMasterPin"'), 'Falta validación de PIN maestro');
});

// 4. POLVO DE ESTRELLAS (MOMENTO MÁGICO)
runTest('4. Polvo de Estrellas', 'Animación y pantalla completa interactiva', () => {
  const html = templateEngine.generateHTML(templateEngine.defaultConfig, 'vino');
  assert(html.includes('id="stardustTransitionCanvas"'), 'Falta canvas de transición');
  assert(html.includes('id="stardustFullScreenOverlay"'), 'Falta overlay a pantalla completa');
  assert(html.includes('id="stardustFullCanvas"'), 'Falta canvas de destellos mágicos');
  assert(html.includes('initStardust'), 'Falta función initStardust');
});

// 5. UBICACIONES & CALENDARIOS
runTest('5. Ubicaciones & Calendarios', 'Enlaces directos de Google Maps, Waze y archivos .ICS', () => {
  const html = templateEngine.generateHTML(templateEngine.defaultConfig, 'vino');
  assert(html.includes('maps.google.com'), 'Falta enlace a Google Maps');
  assert(html.includes('waze.com'), 'Falta enlace a Waze');
  assert(html.includes('id="btnCalendar"'), 'Falta botón de descarga .ICS');
  assert(html.includes('BEGIN:VCALENDAR'), 'Falta generador de archivo de calendario iCal');
});

// 6. PANEL DE CONTROL (INVIITTA ESTUDIO & APP.JS)
runTest('6. Panel Invitta Estudio', 'Integridad de archivos HTML y JS del Estudio con Multi-Host', () => {
  const studioHtml = fs.readFileSync(path.join(__dirname, 'invitacion-estudio.html'), 'utf-8');
  assert(studioHtml.includes('id="selectRsvpTitle"'), 'Estudio no tiene el selector de título RSVP');
  assert(studioHtml.includes('id="selectRsvpDay"'), 'Estudio no tiene el selector de día');
  assert(studioHtml.includes('id="selectRsvpMonth"'), 'Estudio no tiene el selector de mes');
  assert(studioHtml.includes('id="inputHostPhone1"'), 'Estudio no tiene inputHostPhone1');
  assert(studioHtml.includes('id="inputHostPhone2"'), 'Estudio no tiene inputHostPhone2');
  assert(studioHtml.includes('id="inputHostPhone3"'), 'Estudio no tiene inputHostPhone3');
  assert(studioHtml.includes('id="inputRsvpWebhook"'), 'Estudio no tiene inputRsvpWebhook');
  assert(!studioHtml.includes('btn-simulate-vip'), 'Estudio todavía contiene el simulador eliminado');

  const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert(appJs.includes('setupRsvpTitleControls'), 'app.js no contiene setupRsvpTitleControls');
  assert(appJs.includes('INVITTA_GUEST_CONFIRMED'), 'app.js no tiene receptor de confirmación en tiempo real');
  assert(!appJs.includes('setupVipPassGenerator'), 'app.js todavía tiene la función obsoleta setupVipPassGenerator');
});

// 7. PRUEBAS DE ECOSISTEMA PREEXISTENTES
const existingSuites = [
  'test-multi-host-rsvp.js',
  'test-scroll-rsvp.js',
  'test-album-security.js',
  'test-shared-album.js',
  'test-role-permissions.js',
  'test-access-control-suite.js',
  'test-stardust-engine.js',
  'test-seating-planner.js',
  'test-guest-manager.js',
  'test-section-order.js',
  'test-imperial-salon-config.js'
];

existingSuites.forEach(suiteFile => {
  runTest('7. Suites de Regresión', 'Ejecución de ' + suiteFile, () => {
    const cp = require('child_process');
    const out = cp.execSync('node ' + suiteFile, { cwd: __dirname }).toString();
    assert(!out.includes('FAILED') && !out.includes('❌'), 'Falló la suite ' + suiteFile);
  });
});

auditResults.summary.total = passedTests + failedTests;
auditResults.summary.passed = passedTests;
auditResults.summary.failed = failedTests;
const score = Math.round((passedTests / auditResults.summary.total) * 100);

console.log('\n====================================================');
console.log('📊 RESULTADOS DE LA AUDITORÍA: ' + passedTests + '/' + auditResults.summary.total + ' PRUEBAS SUPERADAS (' + score + '% DE EFICACIA)');
console.log('====================================================\n');

Object.keys(auditResults.categories).forEach(cat => {
  console.log('📌 ' + cat + ':');
  auditResults.categories[cat].forEach(t => {
    const icon = t.status === 'PASSED' ? '  ✅' : '  ❌';
    console.log(icon + ' ' + t.name + (t.error ? ' -> ERROR: ' + t.error : ''));
  });
  console.log('');
});

if (failedTests > 0) {
  console.error('❌ Auditoría fallida con ' + failedTests + ' errores.');
  process.exit(1);
} else {
  console.log('🎉 AUDITORÍA APROBADA AL 100% CON CERO ERRORES DETECTADOS.');
}
