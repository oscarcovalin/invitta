const templateEngine = require('./template-engine.js');

// 1. Test Metallic Gold Foil
const configMetallicGold = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configMetallicGold.typography.titleEffect = 'metallic';
configMetallicGold.typography.titleMetallicPreset = 'gold';
const htmlGold = templateEngine.generateHTML(configMetallicGold, 'vino');

console.log('--- TEST 1: METALLIC GOLD ---');
console.log('Contains title-styled-metallic:', htmlGold.includes('title-styled-metallic'));
console.log('Contains rich gold gradient in :root:', htmlGold.includes('#875700'));

// 2. Test Metallic Rose Gold Foil
const configMetallicRose = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configMetallicRose.typography.titleEffect = 'metallic';
configMetallicRose.typography.titleMetallicPreset = 'rosegold';
const htmlRose = templateEngine.generateHTML(configMetallicRose, 'rosa');

console.log('--- TEST 2: METALLIC ROSE GOLD ---');
console.log('Contains rich rose gold gradient:', htmlRose.includes('#782635'));

// 3. Test Solid Color
const configSolid = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configSolid.typography.titleEffect = 'solid';
configSolid.typography.titleSolidColor = '#163c2b';
const htmlSolid = templateEngine.generateHTML(configSolid, 'esmeralda');

console.log('--- TEST 3: SOLID COLOR ---');
console.log('Contains title-styled-solid:', htmlSolid.includes('title-styled-solid'));
console.log('Contains --title-solid-color: #163c2b:', htmlSolid.includes('--title-solid-color: #163c2b'));
