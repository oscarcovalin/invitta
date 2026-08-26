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

console.log("\n🧪 Testing GuestManager (Invitta 2.0 Command Center Engine)...");

const gm = new GuestManager({ baseUrl: 'https://invitta.app/boda-catalina-julian' });

// 1. Initial State & Default Guests
assert(gm.state.guests.length >= 6, `Loaded ${gm.state.guests.length} default guests`);
assert(gm.state.tables.length > 0, `Loaded ${gm.state.tables.length} tables`);

// 2. Step 1: Dimensioning (120 guests @ 8 per table = 15 tables)
const dim8 = gm.setDimensioning(120, 8);
assert(dim8.requiredTables === 15, `120 guests @ 8 per table requires 15 tables (got ${dim8.requiredTables})`);
assert(dim8.totalCapacity === 120, 'Total capacity is 120');

// Dimensioning (150 guests @ 10 per table = 15 tables)
const dim10 = gm.setDimensioning(150, 10);
assert(dim10.requiredTables === 15, `150 guests @ 10 per table requires 15 tables (got ${dim10.requiredTables})`);

// Dimensioning (130 guests @ 12 per table = 11 tables)
const dim12 = gm.setDimensioning(130, 12);
assert(dim12.requiredTables === 11, `130 guests @ 12 per table requires 11 tables (got ${dim12.requiredTables})`);

// 3. Step 2: Add Guest
const newGuest = gm.addGuest({
  name: 'Alejandro Morales & Acompañante',
  passes: 2,
  role: 'friends',
  roleLabel: 'Amigos',
  phone: '+525588990011',
  email: 'alejandro@example.com'
});
assert(newGuest && newGuest.id.startsWith('g_'), 'New guest added with unique ID');
assert(gm.getGuest(newGuest.id).passes === 2, 'New guest has 2 passes');

// 4. Step 3: Auto-Distribute Guests
const distSummary = gm.autoDistributeGuests();
assert(distSummary.unassignedPasses === 0, `All guests assigned to tables (unassigned: ${distSummary.unassignedPasses})`);
assert(distSummary.totalPasses > 0, `Total passes tracked: ${distSummary.totalPasses}`);

// 5. Step 4: Dispatch Links & Templates
const martinez = gm.state.guests.find(g => g.familyKey === 'martinez');
assert(!!martinez, 'Found Familia Martínez');

const personalizedUrl = gm.getPersonalizedUrl(martinez);
assert(personalizedUrl.includes('invitacion.html') && personalizedUrl.includes('guest='), `Personalized URL generated: ${personalizedUrl}`);

const waLink = gm.getWhatsAppLink(martinez);
assert(waLink.includes('wa.me/525512345678') && waLink.includes('text='), 'WhatsApp link correctly formatted with phone and encoded invite message');

const waReminder = gm.getReminderWhatsAppLink(martinez);
assert(waReminder.includes('Recordatorio') || waReminder.includes('fecha%20l%C3%ADmite'), 'WhatsApp reminder message includes deadline and quick-confirm link');

const mailLink = gm.getEmailLink(martinez);
assert(mailLink.startsWith('mailto:carlos.martinez@example.com'), 'Email mailto link formatted properly');

// 6. Record RSVP Response
gm.recordRsvpResponse(martinez.id, {
  confirmed: true,
  confirmedPasses: 4,
  diet: 'none',
  notes: 'Asistiremos los 4'
});
assert(gm.getGuest(martinez.id).status === 'CONFIRMED', 'Guest status updated to CONFIRMED');
assert(gm.getGuest(martinez.id).confirmedPasses === 4, 'Confirmed passes recorded as 4');

// 7. Live Metrics
const metrics = gm.getMetrics();
assert(metrics.confirmedPasses >= 4, `Metrics count confirmed passes: ${metrics.confirmedPasses}`);
assert(Number(metrics.confirmedPercent) > 0, `Confirmed percent is ${metrics.confirmedPercent}%`);

// 8. Database Export & Import
const exportJson = gm.exportDataJson();
assert(exportJson.includes('guests') && exportJson.includes('tables'), 'JSON database exported successfully');

const freshGm = new GuestManager();
const imported = freshGm.importDataJson(exportJson);
assert(imported === true, 'JSON database imported successfully into new instance');
assert(freshGm.state.guests.length === gm.state.guests.length, 'Imported guest count matches exported count');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
