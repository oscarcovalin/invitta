const templateEngine = require('./template-engine.js');

console.log('--- TEST 1: LINE ART SVGS FOR XV CHOREOGRAPHY & CROWN ---');
console.log('Has choreography lineArt SVG:', typeof templateEngine.itineraryLineArt.choreography === 'string' && templateEngine.itineraryLineArt.choreography.length > 50);
console.log('Has crown lineArt SVG:', typeof templateEngine.itineraryLineArt.crown === 'string' && templateEngine.itineraryLineArt.crown.length > 50);

console.log('\n--- TEST 2: XV AÑOS ITINERARY WITH CHOREOGRAPHY STEP ---');
const configXv = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configXv.eventType = 'xv';
configXv.name = 'Valentina';
configXv.eyebrow = 'Mis XV años';
configXv.itinerary = [
  { icon: 'church', label: 'Misa de Acción de Gracias', time: '5:00 p.m.' },
  { icon: 'toast', label: 'Recepción & Bienvenida', time: '7:00 p.m.' },
  { icon: 'dinner', label: 'Banquete de Gala', time: '8:30 p.m.' },
  { icon: 'dance', label: 'Vals Principal', time: '9:30 p.m.' },
  { icon: 'choreography', label: 'Coreografías & Baile Sorpresa', time: '10:15 p.m.' },
  { icon: 'cake', label: 'Pastel & Brindis', time: '11:00 p.m.' }
];

const htmlXv = templateEngine.generateHTML(configXv, 'rosa');

console.log('Contains Coreografías step label:', htmlXv.includes('Coreografías & Baile Sorpresa'));
console.log('Contains 10:15 p.m. time:', htmlXv.includes('10:15 p.m.'));
console.log('Contains Programa section:', htmlXv.includes('id="itinerario"'));
console.log('Contains Timeline rows (6 steps):', (htmlXv.match(/data-step-idx=/g) || []).length === 6);
