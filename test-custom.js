const templateEngine = require('./template-engine.js');
const decorAssets = require('./decor-assets.js');

const customConfig = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
customConfig.name = 'Camila Sofía';
customConfig.typography.scriptFont = 'Great Vibes';
customConfig.typography.displayFont = 'Playfair Display';
customConfig.typography.bodyFont = 'Montserrat';
customConfig.decorations.floatingMascot.url = 'https://example.com/butterfly.png';
customConfig.decorations.floatingMascot.width = 120;
customConfig.decorations.cornerFloralFrame.enabled = false;
customConfig.sectionBackgrounds.welcomeBg = '#ffffff';

const html = templateEngine.generateHTML(customConfig, 'esmeralda', null, decorAssets);
console.log('Custom HTML generated length:', html.length);
console.log('Has Great Vibes:', html.includes('Great+Vibes'));
console.log('Has Playfair Display:', html.includes('Playfair+Display'));
console.log('Has Montserrat:', html.includes('Montserrat'));
console.log('Has Butterfly URL:', html.includes('https://example.com/butterfly.png'));
console.log('Has mascot width 120px:', html.includes('width:120px'));
console.log('Corner frame disabled:', !html.includes('id="heroLayerFrame"'));
console.log('Custom welcome background #ffffff applied:', html.includes('background:#ffffff;'));
