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

console.log("\n🧪 Testing Bilateral Floor Plan Layout (Top Presidencia + 50/50 Left & Right Wings)...");

const planner = new SeatingPlanner();

// Mock DOM container
const mockContainer = { innerHTML: '', querySelectorAll: () => [] };

// Test renderSingleTableHTML for imperial table
const imperialTable = planner.state.tables.find(t => t.type === 'imperial');
assert(!!imperialTable, 'Found Imperial Table');
const impHtml = planner.renderSingleTableHTML(imperialTable);
assert(impHtml.includes('MESA IMPERIAL') || impHtml.includes('Mesa Imperial'), 'Imperial table card rendered with title');
assert(impHtml.includes('table-card-dropzone'), 'Imperial table has dropzone class');

// Test renderSingleTableHTML for circular table
const circTable = planner.state.tables.find(t => t.type === 'circular');
assert(!!circTable, 'Found Circular Table');
const circHtml = planner.renderSingleTableHTML(circTable);
assert(circHtml.includes('rounded-full'), 'Circular table card rendered with rounded-full shape');
assert(circHtml.includes('table-card-dropzone'), 'Circular table has dropzone class');

// Test splitting logic: 1 Imperial + 4 Circular
const guestTables = planner.state.tables.filter(t => t.type !== 'imperial');
assert(guestTables.length >= 4, `Has ${guestTables.length} circular guest tables`);
const half = Math.ceil(guestTables.length / 2);
const left = guestTables.slice(0, half);
const right = guestTables.slice(half);

assert(left.length === 2, `Left wing has 2 tables (got ${left.length})`);
assert(right.length === 2, `Right wing has 2 tables (got ${right.length})`);

// Test when 10 circular tables exist
planner.setTotalTables(11, 8); // 1 imperial + 10 circular
const guestTables10 = planner.state.tables.filter(t => t.id !== 'tbl_imperial' && t.type !== 'imperial');
const half10 = Math.ceil(guestTables10.length / 2);
const left10 = guestTables10.slice(0, half10);
const right10 = guestTables10.slice(half10);

assert(left10.length === 5, `10 circular tables splits to 5 on Left Wing (got ${left10.length})`);
assert(right10.length === 5, `10 circular tables splits to 5 on Right Wing (got ${right10.length})`);

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
