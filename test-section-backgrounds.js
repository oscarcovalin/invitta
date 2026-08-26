const templateEngine = require('./template-engine.js');

// 1. Test Custom Section Backgrounds
const config = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
config.sectionBackgrounds = {
  family: { image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1200', opacity: 0.35 },
  details: { image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200', opacity: 0.40 },
  dressCode: { image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200', opacity: 0.20 },
  gallery: { image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200', opacity: 0.15 },
  giftRegistry: { image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1200', opacity: 0.28 },
  itinerary: { image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200', opacity: 0.33 },
  sharedAlbum: { image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200', opacity: 0.22 },
  instagram: { image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200', opacity: 0.18 },
  rsvp: { image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1200', opacity: 0.45 }
};

const html = templateEngine.generateHTML(config, 'vino');

console.log('--- TEST SECTION BACKGROUNDS WITH OPACITY ---');
console.log('Family section has background & opacity 0.35:', html.includes('style="opacity: 0.35;"'));
console.log('Details section has background & opacity 0.4:', html.includes('style="opacity: 0.4;"'));
console.log('DressCode section has background & opacity 0.2:', html.includes('style="opacity: 0.2;"'));
console.log('Itinerary section has background & opacity 0.33:', html.includes('style="opacity: 0.33;"'));
console.log('Shared Album has background & opacity 0.22:', html.includes('style="opacity: 0.22;"'));
console.log('RSVP section has background & opacity 0.45:', html.includes('style="opacity: 0.45;"'));
console.log('Contains background images in CSS:', html.includes('background-image: url(\'https://images.unsplash.com/photo-1518895949257-7621c3c786d7'));

// 2. Test Empty Backgrounds
const emptyConfig = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
emptyConfig.sectionBackgrounds = {};
const emptyHtml = templateEngine.generateHTML(emptyConfig, 'vino');

console.log('\n--- TEST EMPTY SECTION BACKGROUNDS ---');
// family is now overflow-visible (to allow illustration bridging), not overflow-hidden
console.log('Family section has overflow-visible for illustration bridge:', emptyHtml.includes('id="family" class="py-20 px-margin-mobile bg-emerald-dark text-center border-y border-antique-gold/30 relative" style="overflow: visible;"'));
