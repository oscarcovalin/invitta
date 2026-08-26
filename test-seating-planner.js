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

console.log("\n🧪 Testing Enhanced SeatingPlanner with Haute-Couture Floor Plan & Auto-Distribution...");

const planner = new SeatingPlanner();

// 1. Test Family Grouping
const grouped = planner.getGroupedUnassignedGuests();
const familyMartinez = grouped.find(g => g.type === 'family' && g.familyKey === 'martinez');
assert(!!familyMartinez, 'Familia Martínez is clustered as a family block');
assert(familyMartinez.members.length === 4, `Familia Martínez has 4 members (got ${familyMartinez.members.length})`);

// 2. Test Single VIP Detection
const vipSilva = planner.state.guests.find(g => g.name === 'Sr. Fernando Silva');
assert(vipSilva && vipSilva.vip === true, 'Sr. Fernando Silva has VIP badge');

// 3. Test Capacity Setters (8, 10, 12)
planner.setCapacityAcrossTables(10);
assert(planner.state.tables.every(t => t.capacity === 10), 'All tables configured to 10 seats');

planner.setCapacityAcrossTables(12);
assert(planner.state.tables.every(t => t.capacity === 12), 'All tables configured to 12 seats');

planner.setCapacityAcrossTables(8);
assert(planner.state.tables.every(t => t.capacity === 8), 'All tables configured to 8 seats');

// 4. Test Total Tables Adjuster
planner.setTotalTables(6, 8);
assert(planner.state.tables.length === 6, 'Salón configured with 6 total tables');

// 5. Test Smart Auto-Distribution (Capacity = 8)
const res8 = planner.autoDistributeGuests({ capacity: 8 });
assert(res8.assignedGuests === res8.totalGuests, `All ${res8.totalGuests} guests assigned automatically`);
assert(res8.capacityPerTable === 8, 'Distributed with 8 seats per table');

// Verify Family Martínez was not split
const martinezGuests = planner.state.guests.filter(g => g.familyKey === 'martinez');
const martinezTableId = martinezGuests[0].tableId;
assert(martinezGuests.every(g => g.tableId === martinezTableId), 'Familia Martínez all seated together at the same table');

// 6. Test Smart Auto-Distribution (Capacity = 10)
const res10 = planner.autoDistributeGuests({ capacity: 10 });
assert(res10.assignedGuests === res10.totalGuests, `All ${res10.totalGuests} guests assigned automatically for 10-seater`);
assert(res10.capacityPerTable === 10, 'Distributed with 10 seats per table');

// 7. Test Smart Auto-Distribution (Capacity = 12)
const res12 = planner.autoDistributeGuests({ capacity: 12 });
assert(res12.assignedGuests === res12.totalGuests, `All ${res12.totalGuests} guests assigned automatically for 12-seater`);
assert(res12.capacityPerTable === 12, 'Distributed with 12 seats per table');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
