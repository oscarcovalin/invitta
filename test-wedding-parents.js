const templateEngine = require('./template-engine.js');

const bodaConfig = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
bodaConfig.eventType = 'boda';
bodaConfig.brideName = 'Sofía';
bodaConfig.groomName = 'Alejandro';
bodaConfig.eyebrow = 'Nuestra Boda';
bodaConfig.brideMother = 'Gabriela Torres';
bodaConfig.brideFather = 'Fernando Medina';
bodaConfig.groomMother = 'Patricia Mendoza';
bodaConfig.groomFather = 'Ricardo Morales';

const htmlBoda = templateEngine.generateHTML(bodaConfig, 'vino');

console.log('Boda HTML length:', htmlBoda.length);
console.log('Has Bride & Groom name:', htmlBoda.includes('Sofía & Alejandro'));
console.log('Has Padres de la Novia:', htmlBoda.includes('Padres de la Novia'));
console.log('Has Padres del Novio:', htmlBoda.includes('Padres del Novio'));
console.log('Has Gabriela Torres:', htmlBoda.includes('Gabriela Torres'));
console.log('Has Ricardo Morales:', htmlBoda.includes('Ricardo Morales'));
console.log('Has Padrinos de Velación label:', htmlBoda.includes('Padrinos de Velación'));
console.log('Has Damas de Honor & Best Men label:', htmlBoda.includes('Damas de Honor & Best Men'));
