const fs = require('fs');
const path = require('path');
const GuestManager = require('./guest-manager.js');

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

console.log("\n🧪 Testing Invitation Creator Module & Cross-Ecosystem Integration...");

// 1. Check crear-invitacion.html exists
const creatorHtml = fs.readFileSync(path.join(__dirname, 'crear-invitacion.html'), 'utf8');
assert(creatorHtml.includes('Creador de Invitación Digital'), 'crear-invitacion.html contains main title');
assert(creatorHtml.includes('inputBrideName') && creatorHtml.includes('inputGroomName'), 'Contains bride and groom input fields');
assert(creatorHtml.includes('inputMonogram') && creatorHtml.includes('inputEventDate'), 'Contains monogram and event date fields');
assert(creatorHtml.includes('inputCeremonyPlace') && creatorHtml.includes('inputReceptionPlace'), 'Contains venue input fields');
assert(creatorHtml.includes('inputDressCode') && creatorHtml.includes('inputRsvpDeadline'), 'Contains dress code and deadline fields');
assert(creatorHtml.includes('previewScrollCard') && creatorHtml.includes('previewCoupleNames'), 'Contains real-time live preview container');
assert(creatorHtml.includes('invitta_event_invitation_config'), 'Saves to invitta_event_invitation_config in localStorage');

// 2. Check portal.html contains link to crear-invitacion.html
const portalHtml = fs.readFileSync(path.join(__dirname, 'portal.html'), 'utf8');
assert(portalHtml.includes('crear-invitacion.html'), 'portal.html links to crear-invitacion.html');
assert(portalHtml.includes('Creador de Invitación Digital'), 'portal.html contains Creador de Invitación card');

// 3. Check index.html contains link to crear-invitacion.html
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert(indexHtml.includes('crear-invitacion.html'), 'index.html sidebar links to crear-invitacion.html');

// 4. Check scroll-rsvp-module/index.html reads invitta_event_invitation_config
const scrollHtml = fs.readFileSync(path.join(__dirname, 'scroll-rsvp-module/index.html'), 'utf8');
assert(scrollHtml.includes('invitta_event_invitation_config'), 'scroll-rsvp-module reads saved invitation config');
assert(scrollHtml.includes('guardarRespuestaEnStorage'), 'scroll-rsvp-module saves RSVP responses back to storage');

// 5. Test GuestManager with custom invitation config
const manager = new GuestManager();
assert(typeof manager.getWhatsAppLink === 'function', 'GuestManager generates WhatsApp link');
const guest = manager.state.guests[0];
const waLink = manager.getWhatsAppLink(guest);
assert((waLink.includes('wa.me') || waLink.includes('whatsapp.com')) && waLink.includes('text='), 'WhatsApp link generated with invitation data');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
