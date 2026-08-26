const fs = require('fs');
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

console.log("\n🧪 Testing Role-Based Access Control & Planner Permissions in Invitta 2.0...\n");

const gm = new GuestManager();

// 1. PIN Maestro de Seguridad
assert(gm.getMasterPin() === '2027', 'Default Master PIN is 2027');
assert(gm.verifyMasterPin('2027') === true, 'Verifies valid Master PIN 2027');
assert(gm.verifyMasterPin('0000') === false, 'Rejects invalid Master PIN 0000');

assert(gm.setMasterPin('4567') === true, 'Successfully updates Master PIN to 4567');
assert(gm.verifyMasterPin('4567') === true, 'Verifies updated Master PIN 4567');
gm.setMasterPin('2027'); // Restore default

// 2. Roles y Detección
assert(gm.getCurrentRole('admin') === 'admin', 'Identifies Admin / Novios role');
assert(gm.getCurrentRole('planner') === 'planner', 'Identifies Planner / Organizador role');
assert(gm.getCurrentRole('hostess') === 'hostess', 'Identifies Hostess role');
assert(gm.getCurrentRole('catering') === 'catering', 'Identifies Catering role');

// 3. Matriz de Permisos
// Admin
assert(gm.canPerformAction('edit_invitation_design', 'admin') === true, 'Admin CAN edit invitation design');
assert(gm.canPerformAction('reset_database', 'admin') === true, 'Admin CAN reset database');
assert(gm.canPerformAction('manage_tables', 'admin') === true, 'Admin CAN manage tables');
assert(gm.canPerformAction('view_timeline', 'admin') === true, 'Admin CAN view timeline');

// Planner (Organizador) - Operativo Limitado
assert(gm.canPerformAction('edit_invitation_design', 'planner') === false, 'Planner CANNOT edit invitation design (Protected)');
assert(gm.canPerformAction('reset_database', 'planner') === false, 'Planner CANNOT reset database (Protected)');
assert(gm.canPerformAction('manage_tables', 'planner') === true, 'Planner CAN manage tables & layout');
assert(gm.canPerformAction('view_timeline', 'planner') === true, 'Planner CAN view and follow timeline');
assert(gm.canPerformAction('view_catering', 'planner') === true, 'Planner CAN view catering sheet');
assert(gm.canPerformAction('scan_access_qr', 'planner') === true, 'Planner CAN scan access QR');
assert(gm.canPerformAction('create_emergency_pass', 'planner') === true, 'Planner CAN create emergency passes');

// Hostess
assert(gm.canPerformAction('scan_access_qr', 'hostess') === true, 'Hostess CAN scan access QR');
assert(gm.canPerformAction('manage_tables', 'hostess') === false, 'Hostess CANNOT edit floor plan tables');
assert(gm.canPerformAction('edit_invitation_design', 'hostess') === false, 'Hostess CANNOT edit invitation');

// Catering
assert(gm.canPerformAction('view_catering', 'catering') === true, 'Catering CAN view catering tactical sheet');
assert(gm.canPerformAction('manage_tables', 'catering') === false, 'Catering CANNOT edit floor plan');

// 4. Generación de Enlaces de Delegación
const links = gm.getDelegationLinks('http://localhost:3000/');
assert(links.planner.url.includes('role=planner'), `Planner link has ?role=planner (${links.planner.url})`);
assert(links.hostess.url.includes('scanner-acceso.html'), `Hostess link leads to scanner-acceso.html (${links.hostess.url})`);
assert(links.emergency.url.includes('generador-emergencia.html'), `Emergency link leads to generador-emergencia.html (${links.emergency.url})`);
assert(links.catering.url.includes('catering-tactical-sheet.html'), `Catering link leads to tactical sheet (${links.catering.url})`);

// 5. Integración en index.html y portal.html
const indexHtml = fs.readFileSync('./index.html', 'utf-8');
assert(indexHtml.includes('badgeRoleAdmin'), 'index.html contains badgeRoleAdmin');
assert(indexHtml.includes('badgeRolePlanner'), 'index.html contains badgeRolePlanner');
assert(indexHtml.includes('sidebarPrivateBrideLinks'), 'index.html contains sidebarPrivateBrideLinks');
assert(indexHtml.includes('modalShareAccess'), 'index.html contains modalShareAccess');
assert(indexHtml.includes('modalUnlockAdmin'), 'index.html contains modalUnlockAdmin');
assert(indexHtml.includes('applyRoleInterface'), 'index.html has applyRoleInterface function');

const portalHtml = fs.readFileSync('./portal.html', 'utf-8');
assert(portalHtml.includes('index.html?role=planner'), 'portal.html contains direct card for Wedding Planner (?role=planner)');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
