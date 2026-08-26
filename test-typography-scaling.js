const templateEngine = require('./template-engine.js');

console.log('--- TEST 1: DEFAULT TYPOGRAPHY SCALING (1.0 / 100%) ---');
const configDefault = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
const htmlDefault = templateEngine.generateHTML(configDefault, 'vino');

console.log('Contains --scale-hero: 1:', htmlDefault.includes('--scale-hero: 1'));
console.log('Contains --scale-headings: 1:', htmlDefault.includes('--scale-headings: 1'));
console.log('Contains --scale-body: 1:', htmlDefault.includes('--scale-body: 1'));
console.log('Contains hero-name-scaled class:', htmlDefault.includes('hero-name-scaled'));
console.log('Contains hero-connector-scaled class:', htmlDefault.includes('hero-connector-scaled'));
console.log('Contains heading-script-scaled class:', htmlDefault.includes('heading-script-scaled'));

console.log('\n--- TEST 2: CUSTOM TYPOGRAPHY SCALING (125% Hero / 85% Headings / 110% Body) ---');
const configCustom = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configCustom.typography.scaleHero = 1.25;
configCustom.typography.scaleHeadings = 0.85;
configCustom.typography.scaleBody = 1.10;

const htmlCustom = templateEngine.generateHTML(configCustom, 'esmeralda');
console.log('Contains --scale-hero: 1.25:', htmlCustom.includes('--scale-hero: 1.25'));
console.log('Contains --scale-headings: 0.85:', htmlCustom.includes('--scale-headings: 0.85'));
console.log('Contains --scale-body: 1.1:', htmlCustom.includes('--scale-body: 1.1'));

console.log('\n--- TEST 3: GUARDRAIL CLAMPING BOUNDS ---');
const configExtreme = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configExtreme.typography.scaleHero = 5.0; // Should be clamped to 2.2
configExtreme.typography.scaleHeadings = 0.1; // Should be clamped to 0.5

const htmlExtreme = templateEngine.generateHTML(configExtreme, 'vino');
console.log('Clamps excessive scaleHero 5.0 to 2.2:', htmlExtreme.includes('--scale-hero: 2.2'));
console.log('Clamps tiny scaleHeadings 0.1 to 0.5:', htmlExtreme.includes('--scale-headings: 0.5'));
