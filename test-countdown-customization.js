const templateEngine = require('./template-engine.js');

// 1. Test Default Configuration
const configDefault = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
const htmlDefault = templateEngine.generateHTML(configDefault, 'vino');

console.log('--- TEST 1: DEFAULT SETTINGS ---');
console.log('Hero Date uses editorial block (heroDateBlock):', htmlDefault.includes('id="heroDateBlock"'));
console.log('Hero Date shows month name (MARZO):', htmlDefault.includes('MARZO'));
console.log('Hero Date shows day number (20):', htmlDefault.includes('id="heroDateDay"'));

console.log('Contains phrase "Para casarme con el amor de mi vida":', htmlDefault.includes('Para casarme con el amor de mi vida'));
console.log('Contains seconds element (seconds):', htmlDefault.includes('id="seconds"'));
console.log('Contains default rgba countdown bg (0.55):', htmlDefault.includes('rgba(18, 18, 20, 0.55)'));

// 2. Test Custom Countdown Style
const configCustom = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configCustom.countdownStyle = {
  bgColor: '#24583f',
  opacity: 0.85,
  textColor: '#f7f6ec'
};
configCustom.countdownPhrase = 'Para unir nuestras vidas por siempre';

const htmlCustom = templateEngine.generateHTML(configCustom, 'esmeralda');

console.log('\n--- TEST 2: CUSTOM COUNTER STYLE ---');
console.log('Contains custom phrase:', htmlCustom.includes('Para unir nuestras vidas por siempre'));
console.log('Contains computed rgba with #24583f (36, 88, 63, 0.85):', htmlCustom.includes('rgba(36, 88, 63, 0.85)'));
console.log('Contains text color #f7f6ec in :root:', htmlCustom.includes('--countdown-text: #f7f6ec'));
