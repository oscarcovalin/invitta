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

// 1. Check invitacion-estudio.html (Original Studio Invitation Generator) exists
const studioHtml = fs.readFileSync(path.join(__dirname, 'invitacion-estudio.html'), 'utf8');
assert(studioHtml.includes('Invitta Studio'), 'invitacion-estudio.html contains main title');
assert(studioHtml.includes('template-engine.js') && studioHtml.includes('app.js'), 'Connects to template-engine.js and app.js');
assert(studioHtml.includes('selectEventType'), 'Contains event type switcher');
assert(studioHtml.includes('groupWeddingNames'), 'Contains dual names for wedding');
assert(studioHtml.includes('btnExportHtml'), 'Contains export HTML button');

// 2. Check portal.html contains link to invitacion-estudio.html
const portalHtml = fs.readFileSync(path.join(__dirname, 'portal.html'), 'utf8');
assert(portalHtml.includes('invitacion-estudio.html'), 'portal.html links to invitacion-estudio.html');
assert(portalHtml.includes('Estudio de Invitación Digital'), 'portal.html contains original studio card');

// 3. Check index.html contains link to invitacion-estudio.html
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert(indexHtml.includes('invitacion-estudio.html'), 'index.html sidebar links to invitacion-estudio.html');

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
