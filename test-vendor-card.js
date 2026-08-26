const templateEngine = require('./template-engine.js');

console.log('--- TEST 1: DEFAULT DISCRETE VENDOR CARD ---');
const configDefault = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
const htmlDefault = templateEngine.generateHTML(configDefault, 'vino');

console.log('Contains vendorCard section:', htmlDefault.includes('id="vendorCard"'));
console.log('VendorCard is visible (not hidden):', !htmlDefault.includes('id="vendorCard"') || !htmlDefault.includes('id="vendorCard"\n  class="mt-12 pt-8 border-t border-antique-gold/20 max-w-sm mx-auto gsap-fade-up hidden"'));
console.log('Contains default badge text:', htmlDefault.includes('¿Deseas una invitación como esta?'));
console.log('Contains WhatsApp button:', htmlDefault.includes('id="btnVendorWhatsapp"'));
console.log('Contains WhatsApp wa.me link:', htmlDefault.includes('https://wa.me/5215512345678?text='));
console.log('Contains button text:', htmlDefault.includes('Solicitar Información por WhatsApp'));

console.log('\n--- TEST 2: CUSTOM VENDOR CARD ---');
const configCustom = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configCustom.vendorCard = {
  enabled: true,
  badge: '¿Próximo Evento en Puerta?',
  title: 'Cotiza tus Invitaciones Personalizadas',
  description: 'Contáctanos para paquetes exclusivos de Bodas y XV Años con diseño a medida.',
  whatsappNumber: '5219998887766',
  whatsappMessage: 'Hola, vi una invitación demo y quiero cotizar la mía por favor.',
  buttonText: 'Escribir por WhatsApp Ahora',
  showAgencyNote: true,
  agencyName: 'Studio Boutique Digital'
};
const htmlCustom = templateEngine.generateHTML(configCustom, 'vino');

console.log('Contains custom badge:', htmlCustom.includes('¿Próximo Evento en Puerta?'));
console.log('Contains custom phone in wa.me link:', htmlCustom.includes('https://wa.me/5219998887766?text='));
console.log('Contains custom button text:', htmlCustom.includes('Escribir por WhatsApp Ahora'));
console.log('Contains agency name:', htmlCustom.includes('Studio Boutique Digital'));

console.log('\n--- TEST 3: DISABLED VENDOR CARD ---');
const configDisabled = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configDisabled.vendorCard = { enabled: false };
const htmlDisabled = templateEngine.generateHTML(configDisabled, 'vino');
console.log('Vendor card has hidden class when disabled:', htmlDisabled.includes('id="vendorCard"') && htmlDisabled.includes('hidden'));

console.log('\n--- TEST 4: SECTION PLACEMENT & ORDER (BELOW LAST CARD / IN FOOTER) ---');
const idxRsvp = htmlDefault.indexOf('id="rsvp"');
const idxFooter = htmlDefault.indexOf('<footer');
const idxFooterNames = htmlDefault.indexOf('id="footerNames"');
const idxVendor = htmlDefault.indexOf('id="vendorCard"');
const idxFooterEnd = htmlDefault.indexOf('</footer>');

console.log('RSVP before Footer:', idxRsvp < idxFooter);
console.log('Footer starts before Vendor Card:', idxFooter < idxVendor);
console.log('Footer Names before Vendor Card:', idxFooterNames < idxVendor);
console.log('Vendor Card is inside Footer (before </footer>):', idxVendor < idxFooterEnd);
