const ScrollRsvpController = require('./scroll-rsvp-module/scroll-rsvp.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n🧪 Testing ScrollRsvpController (Parchment RSVP, URL Detection, Modes)...");

const controller = new ScrollRsvpController();

// 1. Personalized URL Detection for Camila Ortiz
const guest1 = controller.detectGuestFromUrl('camila_ortiz');
assert(controller.mode === 'personalized', 'Sets personalized mode for ?guest=camila_ortiz');
assert(controller.currentGuest.nombre === 'Camila Ortiz', 'Identifies Camila Ortiz');
assert(controller.currentGuest.pasesMax === 2, 'Allocates 2 max passes for Camila');
assert(controller.currentGuest.isCourt === true, 'Flags Camila as Court Member');

// 2. Personalized URL Detection for Familia Martínez
const guest2 = controller.detectGuestFromUrl('familia_martinez');
assert(controller.mode === 'personalized', 'Sets personalized mode for ?guest=familia_martinez');
assert(controller.currentGuest.pasesMax === 4, 'Allocates 4 max passes for Familia Martínez');

// 3. Open Mode (Without URL parameter)
const openGuest = controller.detectGuestFromUrl('');
assert(controller.mode === 'open', 'Sets open mode when no guest parameter is present');
assert(controller.currentGuest === null, 'currentGuest is null in open mode');
assert(controller.selectedPasses === 1, 'Default passes starts at 1 in open mode');

// 4. Dynamic URL Name Parameter (e.g. ?guest=Roberto%20Silva)
const dynamicGuest = controller.detectGuestFromUrl('Roberto Silva');
assert(controller.mode === 'personalized', 'Personalizes when full string name is passed in URL');
assert(controller.currentGuest.nombre === 'Roberto Silva', 'Decodes dynamic name from URL');

// 5. Option B Logistical Folio Generation (Mesa + Apellido + Pases)
controller.setPersonalizedMode(guest1); // Camila Ortiz (Court / Imperial)
const folioCamila = controller.generateLogisticalFolio(guest1.nombre, 2);
assert(folioCamila === 'MIMP-ORTIZ-2P', `Generates MIMP-ORTIZ-2P for Camila Ortiz (got ${folioCamila})`);

controller.setPersonalizedMode(guest2); // Familia Martínez
const folioMartinez = controller.generateLogisticalFolio(guest2.nombre, 4);
assert(folioMartinez.endsWith('-MARTINEZ-4P'), `Generates *-MARTINEZ-4P for Familia Martínez (got ${folioMartinez})`);

const customFolio = controller.generateLogisticalFolio('Dr. Carlos Valenzuela', 2);
assert(customFolio.includes('VALENZUELA-2P'), `Generates *-VALENZUELA-2P (got ${customFolio})`);

// 6. Verification of Pergamino Replacement in Invitación Digital
const fs = require('fs');
const html = fs.readFileSync('./invitacion.html', 'utf-8');

assert(html.includes('pergamino-container'), 'invitacion.html includes .pergamino-container luxury parchment card');
assert(html.includes('pergamino-ornament'), 'invitacion.html includes .pergamino-ornament royal ribbon');
assert(html.includes('id="contenedor-saludo"'), 'invitacion.html includes #contenedor-saludo dynamic greeting container');
assert(html.includes('id="campo-nombre-container"'), 'invitacion.html includes #campo-nombre-container');
assert(html.includes('id="nombre"'), 'invitacion.html includes #nombre');
assert(html.includes('id="asistencia"'), 'invitacion.html includes #asistencia');
assert(html.includes('id="pases"'), 'invitacion.html includes #pases');
assert(html.includes('id="dieta"'), 'invitacion.html includes #dieta select dropdown');
assert(html.includes('Menú Infantil'), 'invitacion.html includes Menú Infantil option');
assert(html.includes('Alergias'), 'invitacion.html includes Alergias option');
assert(html.includes('Vegano'), 'invitacion.html includes Vegano option');
assert(!html.includes('id="alergias"'), 'invitacion.html removed redundant #alergias text input');
assert(html.includes('id="rsvpSubmit"'), 'invitacion.html includes #rsvpSubmit button');
assert(html.includes('id="rsvpSuccess"'), 'invitacion.html includes #rsvpSuccess confirmation view');
assert(html.includes('pass-ticket-pergamino'), 'invitacion.html includes .pass-ticket-pergamino digital access ticket');
assert(html.includes('id="badgePassTable"'), 'invitacion.html includes #badgePassTable badge');
assert(html.includes('id="btnSharePassWhatsapp"'), 'invitacion.html includes #btnSharePassWhatsapp action');
assert(html.includes('id="btnDownloadPassImage"'), 'invitacion.html includes #btnDownloadPassImage action');
assert(html.includes('id="btnResetRsvp"'), 'invitacion.html includes #btnResetRsvp modifier button');
assert(html.includes('initRsvpPergamino'), 'invitacion.html includes initRsvpPergamino client-side execution script');

// 7. Verification of VIP Preview Simulator in invitacion-estudio.html
const studioHtml = fs.readFileSync('./invitacion-estudio.html', 'utf-8');
assert(studioHtml.includes('btn-simulate-vip'), 'invitacion-estudio.html contains btn-simulate-vip buttons');
assert(studioHtml.includes('Simulador de Vista Previa VIP'), 'invitacion-estudio.html contains VIP Preview Simulator');
assert(!studioHtml.includes('id="btnGenerateVipLink"'), 'invitacion-estudio.html removed redundant manual link generator');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
