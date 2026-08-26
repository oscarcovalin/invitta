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

console.log("\n🧪 Testing Enhanced SeatingPlanner with Haute-Couture Floor Plan...");

const planner = new SeatingPlanner();

// 1. Test Family Grouping
const grouped = planner.getGroupedUnassignedGuests();
const familyMartinez = grouped.find(g => g.type === 'family' && g.familyKey === 'martinez');
assert(!!familyMartinez, 'Familia Martínez is clustered as a family block');
assert(familyMartinez.members.length === 4, `Familia Martínez has 4 members (got ${familyMartinez.members.length})`);

// 2. Test Single VIP Detection
const vipSilva = planner.state.guests.find(g => g.name === 'Sr. Fernando Silva');
assert(vipSilva && vipSilva.vip === true, 'Sr. Fernando Silva has VIP badge');

// 3. Test Assigning Whole Family to Mesa 1
planner.assignFamilyGroupToTable(familyMartinez.members.map(m => m.id), 'tbl_1');
const table1Guests = planner.state.guests.filter(g => g.tableId === 'tbl_1');
assert(table1Guests.length === 4, 'Mesa 1 has all 4 members of Familia Martínez assigned in 1 action');

// 4. Test Overcapacity on Circular Table
// Mesa 1 capacity is 8. Let's assign 5 more guests (total 9 > 8)
const familyValenzuela = planner.state.guests.filter(g => g.familyKey === 'valenzuela');
planner.assignFamilyGroupToTable(familyValenzuela.map(m => m.id), 'tbl_1');
planner.assignGuestToTable('g_5', 'tbl_1'); // Andrés López
planner.assignGuestToTable('g_6', 'tbl_1'); // Laura López

const table1Seats = planner.state.guests.filter(g => g.tableId === 'tbl_1').length;
const table1 = planner.state.tables.find(t => t.id === 'tbl_1');
assert(table1Seats === 9, `Mesa 1 has 9 guests assigned`);
assert(table1Seats > table1.capacity, 'Mesa 1 is detected in overcapacity state without errors');

// 5. Test Adding a New Table Dynamically
const newTable = planner.addTable('Mesa de Terraza', 'circular', 10);
assert(newTable && newTable.capacity === 10, 'New table added dynamically with capacity 10');
assert(planner.state.tables.some(t => t.id === newTable.id), 'New table is in planner state');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
