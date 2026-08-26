const SeatingPlanner = require('./seating-module/seating-planner.js');

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

console.log("\n🧪 Testing SeatingPlanner (Drag & Drop, Family Blocks, Auto-Scaling)...");

const planner = new SeatingPlanner();

// 1. Test Family Key Extraction
const key1 = planner.extractFamilyKey("Elena de Martínez");
const key2 = planner.extractFamilyKey("Roberto Martínez");
const key3 = planner.extractFamilyKey("Valeria Martínez");
assert(key1 === "martinez", `Elena de Martínez key extracted as martinez (got ${key1})`);
assert(key2 === "martinez", `Roberto Martínez key extracted as martinez (got ${key2})`);
assert(key3 === "martinez", `Valeria Martínez key extracted as martinez (got ${key3})`);
assert(key1 === key2 && key2 === key3, 'All Martínez family members share identical family key');

const key4 = planner.extractFamilyKey("Sofía de Valenzuela");
const key5 = planner.extractFamilyKey("Dr. Carlos Valenzuela");
assert(key4 === key5, 'Sofía de Valenzuela and Dr. Carlos Valenzuela match family key');

// 2. Test Family Grouping
const grouped = planner.getGroupedUnassignedGuests();
const familyMartinez = grouped.find(g => g.type === 'family' && g.familyKey === 'martinez');
assert(!!familyMartinez, 'Familia Martínez is clustered into a single family group');
assert(familyMartinez.members.length === 3, 'Familia Martínez has 3 members');
assert(familyMartinez.totalPases === 3, 'Familia Martínez has 3 total passes');

// 3. Test Moving Family Block to Table in 1 Action
planner.assignFamilyGroupToTable(familyMartinez.members, 'tbl_2');
const table2Guests = planner.state.guests.filter(g => g.tableId === 'tbl_2');
assert(table2Guests.length === 3, 'Table 2 now has all 3 family members assigned simultaneously');
assert(table2Guests.some(g => g.name === 'Elena de Martínez'), 'Elena is in Table 2');
assert(table2Guests.some(g => g.name === 'Roberto Martínez'), 'Roberto is in Table 2');
assert(table2Guests.some(g => g.name === 'Valeria Martínez'), 'Valeria is in Table 2');

// 4. Test Overcapacity without Blocking
const table2 = planner.state.tables.find(t => t.id === 'tbl_2'); // capacity = 6
// Assign additional guests to exceed capacity (3 + 2 + 2 = 7 > 6)
planner.assignGuestToTable('g_6', 'tbl_2'); // Camila Ortiz (2 pases)
planner.assignGuestToTable('g_7', 'tbl_2'); // Diego Fuentes (2 pases)
const table2Seats = planner.state.guests.filter(g => g.tableId === 'tbl_2').reduce((acc, g) => acc + g.pases, 0);

assert(table2Seats === 7, `Table 2 has 7 seats occupied (capacity is ${table2.capacity})`);
assert(table2Seats > table2.capacity, 'Table 2 is in overcapacity state without throwing errors');

// 5. Test Unassigning Guest
planner.unassignGuest('g_6');
const updatedSeats = planner.state.guests.filter(g => g.tableId === 'tbl_2').reduce((acc, g) => acc + g.pases, 0);
assert(updatedSeats === 5, 'After unassigning Camila, Table 2 returns under capacity (5 seats)');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
