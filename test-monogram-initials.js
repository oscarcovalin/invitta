const templateEngine = require('./template-engine.js');

// 1. Test Default Wedding Monogram (Catalina & Julián)
const configDefault = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
const htmlDefault = templateEngine.generateHTML(configDefault, 'vino');

console.log('--- TEST 1: DEFAULT WEDDING MONOGRAM (C & J) ---');
console.log('Contains headerMonogram element:', htmlDefault.includes('id="headerMonogram"'));
console.log('Contains "C & J" monogram in header:', htmlDefault.includes('C & J'));

// 2. Test Wedding with connector "+"
const configPlus = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configPlus.nameConnector = '+';
const htmlPlus = templateEngine.generateHTML(configPlus, 'vino');

console.log('\n--- TEST 2: WEDDING MONOGRAM WITH PLUS (C + J) ---');
console.log('Contains "C + J" monogram in header:', htmlPlus.includes('C + J'));

// 3. Test XV Años (Valentina)
const configXv = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configXv.eventType = 'xv';
configXv.name = 'Valentina';
const htmlXv = templateEngine.generateHTML(configXv, 'rosa');

console.log('\n--- TEST 3: XV AÑOS MONOGRAM (V) ---');
console.log('Contains "V" monogram in header:', htmlXv.includes('id="headerMonogram" class="min-w-[34px] px-2 h-[34px] rounded-full border border-antique-gold flex items-center justify-center text-antique-gold font-script text-lg tracking-wide font-normal shadow-sm bg-white/20" style="font-family: var(--font-script);">\n        V\n      </div>'));

// 4. Test Custom Monogram
const configCustom = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configCustom.monogram = 'C 🤍 J';
const htmlCustom = templateEngine.generateHTML(configCustom, 'vino');

console.log('\n--- TEST 4: CUSTOM MONOGRAM ---');
console.log('Contains custom monogram "C 🤍 J":', htmlCustom.includes('C 🤍 J'));
