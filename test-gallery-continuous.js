const templateEngine = require('./template-engine.js');

const config = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
config.photos.gallery = [
  "https://images.unsplash.com/photo-1519741497674-611481863552",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a"
];

const html = templateEngine.generateHTML(config, 'vino');

console.log('--- TEST GALLERY CONTINUOUS & UNCROPPED ---');
console.log('Contains gap-0 continuous layout:', html.includes('flex flex-col gap-0'));
console.log('Images have w-full h-auto block object-contain:', html.includes('w-full h-auto block object-contain'));
console.log('Does NOT contain fixed cropping height h-72:', !html.includes('h-72 group relative'));
