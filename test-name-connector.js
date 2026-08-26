const templateEngine = require('./template-engine.js');

// 1. Test Wedding with default '&'
const configAmp = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configAmp.eventType = 'boda';
configAmp.brideName = 'Catalina';
configAmp.groomName = 'Julián';
configAmp.nameConnector = '&';
const htmlAmp = templateEngine.generateHTML(configAmp, 'vino');

console.log('--- TEST 1: CONNECTOR & ---');
console.log('Hero contains connector "&":', htmlAmp.includes('id="heroNameConnector" style="font-family: var(--font-script);">\n          &'));
console.log('Safe title contains "Catalina & Julián":', htmlAmp.includes('Catalina &amp; Julián') || htmlAmp.includes('Catalina & Julián'));

// 2. Test Wedding with '+'
const configPlus = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configPlus.eventType = 'boda';
configPlus.nameConnector = '+';
const htmlPlus = templateEngine.generateHTML(configPlus, 'vino');

console.log('\n--- TEST 2: CONNECTOR + ---');
console.log('Hero contains connector "+":', htmlPlus.includes('id="heroNameConnector" style="font-family: var(--font-script);">\n          +'));

// 3. Test Wedding with 'y'
const configY = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configY.eventType = 'boda';
configY.nameConnector = 'y';
const htmlY = templateEngine.generateHTML(configY, 'vino');

console.log('\n--- TEST 3: CONNECTOR y ---');
console.log('Hero contains connector "y":', htmlY.includes('id="heroNameConnector" style="font-family: var(--font-script);">\n          y'));
console.log('Footer contains "Catalina y Julián":', htmlY.includes('Catalina y Julián'));
