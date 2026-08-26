const templateEngine = require('./template-engine.js');
const decorAssets = require('./decor-assets.js');

const customConfig = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
customConfig.name = 'Sofía & Alejandro';
customConfig.eyebrow = 'Nuestra Boda';
customConfig.story.title = 'Nuestra Historia de Amor';
customConfig.story.text = 'Nos conocimos hace 6 años y desde entonces supimos que nuestro destino era caminar juntos.';
customConfig.instagram.hashtag = '#BodaSofiayAle';
customConfig.dressCode.title = 'Rigurosa Etiqueta';
customConfig.ceremony.wazeUrl = 'https://waze.com/ul?q=Parroquia';

const html = templateEngine.generateHTML(customConfig, 'vino', null, decorAssets);

console.log('HTML length:', html.length);
console.log('Has VIP Banner element:', html.includes('id="vipBanner"'));
console.log('Has Story Section:', html.includes('id="storySection"'));
console.log('Has Story Text:', html.includes('Nos conocimos hace 6 años'));
console.log('Has Instagram Section:', html.includes('id="instagramSection"'));
console.log('Has Hashtag:', html.includes('#BodaSofiayAle'));
console.log('Has Google Calendar Link:', html.includes('id="btnGoogleCalendar"'));
console.log('Has Apple/Outlook .ICS button:', html.includes('id="btnCalendar"'));
console.log('Has Waze link for Ceremony:', html.includes('id="ceremonyWaze"'));
console.log('Has QR Pass wrapper:', html.includes('id="qrContainer"'));
console.log('Has Allowed Tickets Hint:', html.includes('id="allowedTicketsHint"'));
console.log('Has Gold Foil Class:', html.includes('class="gold-foil"'));
