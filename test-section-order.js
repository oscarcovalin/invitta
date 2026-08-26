const templateEngine = require('./template-engine.js');

const config = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
config.photos.gallery = ["https://images.unsplash.com/photo-1519741497674-611481863552"];

const html = templateEngine.generateHTML(config, 'vino');

const order = [
  { id: 'id="hero"', name: '1. Evento & Protagonista' },
  { id: 'id="countdownSection"', name: '2. Cuenta Regresiva' },
  { id: 'id="family"', name: '3. Familia y Padrinos' },
  { id: 'id="details"', name: '4. Ubicaciones (Dónde y Cuándo)' },
  { id: 'id="dresscode"', name: '5. Dress Code' },
  { id: 'id="galeria"', name: '6. Galería Fotográfica' },
  { id: 'id="giftregistry"', name: '7. Mesa de Regalos' },
  { id: 'id="itinerario"', name: '8. Programa / Itinerario' },
  { id: 'id="instagramSection"', name: '9. Hashtag / Instagram' },
  { id: 'id="rsvp"', name: '10. Confirmación / RSVP' },
  { id: '<footer', name: '11. Footer' }
];

console.log('--- TEST SECTION ORDER ---');
let lastIdx = -1;
let passed = true;

order.forEach(section => {
  const currentIdx = html.indexOf(section.id);
  const found = currentIdx !== -1;
  const inOrder = currentIdx > lastIdx;
  console.log(`${section.name}: index=${currentIdx}, found=${found}, inOrder=${inOrder}`);
  if (!found || !inOrder) passed = false;
  lastIdx = currentIdx;
});

console.log('\nFinal Order Verification:', passed ? '✅ ALL IN EXACT SPECIFIED ORDER' : '❌ ORDER MISMATCH');
