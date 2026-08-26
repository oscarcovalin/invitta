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

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
