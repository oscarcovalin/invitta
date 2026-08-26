const templateEngine = require('./template-engine.js');

const config = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
config.typography.customScriptFile = 'data:font/ttf;base64,AAEAAAASAQA...TESTFONT';
config.typography.customScriptFileName = 'MiFuenteManuscrita.ttf';

const html = templateEngine.generateHTML(config, 'vino');

console.log('Generated HTML length:', html.length);
console.log('Contains @font-face LocalCustomScript:', html.includes('LocalCustomScript'));
console.log('Contains custom font data URL:', html.includes('data:font/ttf;base64,AAEAAAASAQA...TESTFONT'));
console.log('Uses LocalCustomScript in var(--font-script):', html.includes("--font-script: 'LocalCustomScript', cursive;"));
