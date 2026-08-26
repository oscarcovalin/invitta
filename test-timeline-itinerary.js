const templateEngine = require('./template-engine.js');

const config = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
const html = templateEngine.generateHTML(config, 'vino');

console.log('HTML length:', html.length);
console.log('Has Programa header:', html.includes('Programa'));
console.log('Has timeline track line:', html.includes('timeline-track-line'));
console.log('Has timeline heart nodes:', html.includes('timeline-heart-node'));
console.log('Has timeline step row:', html.includes('timeline-step-row'));
console.log('Has GSAP timeline animation:', html.includes("document.querySelectorAll('.timeline-step-row')"));
console.log('Has LineArt SVGs:', html.includes('itineraryLineArt') || html.includes('timeline-icon-wrap'));
