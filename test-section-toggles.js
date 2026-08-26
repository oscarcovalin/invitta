const templateEngine = require('./template-engine.js');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

function isSectionHidden(html, sectionId) {
  const match = html.match(new RegExp(`<section[^>]*id="${sectionId}"[^>]*>`));
  if (!match) return true;
  const tagWithoutOverflow = match[0].replace(/overflow-hidden/g, '');
  return /\bhidden\b/.test(tagWithoutOverflow);
}

console.log('\n=== RUNNING SECTION TOGGLES & ADAPTIVE SPACING TESTS ===\n');

// Test 1: Default config has all primary sections visible (with gallery photos added)
{
  const config = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
  config.photos.gallery = ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'];
  const html = templateEngine.generateHTML(config, 'vino');
  
  assert(html.includes('id="countdownSection"'), 'Countdown section is rendered');
  assert(!isSectionHidden(html, 'countdownSection'), 'Countdown is visible by default');
  assert(html.includes('id="family"'), 'Family section is rendered');
  assert(!isSectionHidden(html, 'family'), 'Family is visible by default');
  assert(html.includes('id="details"'), 'Locations section is rendered');
  assert(!isSectionHidden(html, 'details'), 'Locations is visible by default');
  assert(html.includes('id="hospedaje"'), 'Lodging section is rendered');
  assert(!isSectionHidden(html, 'hospedaje'), 'Lodging is visible by default');
  assert(html.includes('id="dresscode"'), 'Dress code section is rendered');
  assert(!isSectionHidden(html, 'dresscode'), 'Dress code is visible by default');
  assert(html.includes('id="galeria"'), 'Gallery section is rendered');
  assert(!isSectionHidden(html, 'galeria'), 'Gallery is visible when photos are present');
  assert(html.includes('id="giftregistry"'), 'Gift registry section is rendered');
  assert(!isSectionHidden(html, 'giftregistry'), 'Gift registry is visible by default');
  assert(html.includes('id="itinerario"'), 'Itinerary section is rendered');
  assert(!isSectionHidden(html, 'itinerario'), 'Itinerary is visible by default');
  assert(html.includes('id="albumColaborativo"'), 'Shared album section is rendered');
  assert(!isSectionHidden(html, 'albumColaborativo'), 'Shared album is visible by default');
  assert(html.includes('id="instagramSection"'), 'Instagram section is rendered');
  assert(!isSectionHidden(html, 'instagramSection'), 'Instagram is visible by default');
  assert(html.includes('id="rsvp"'), 'RSVP section is rendered');
  assert(!isSectionHidden(html, 'rsvp'), 'RSVP is visible by default');
}

// Test 2: Disabling Countdown hides section and adapts family padding
{
  const config = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
  config.countdown = { enabled: false };
  config.countdownEnabled = false;
  const html = templateEngine.generateHTML(config, 'vino');

  assert(isSectionHidden(html, 'countdownSection'), 'Countdown has hidden class when disabled');
  assert(!html.includes('pt-[calc(130px+'), 'Family does not have parallax bridge padding when countdown is hidden');
}

// Test 3: Disabling Family hides section and adapts Locations padding
{
  const config = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
  config.family = { enabled: false };
  config.familyEnabled = false;
  const html = templateEngine.generateHTML(config, 'vino');

  assert(isSectionHidden(html, 'family'), 'Family has hidden class when disabled');
  assert(!html.includes('pt-[calc(130px+'), 'Locations does not have family parallax bridge padding when family is hidden');
}

// Test 4: Disabling Locations, Lodging, Dresscode, Gallery, GiftRegistry, Itinerary, SharedAlbum, Instagram, RSVP
{
  const config = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
  config.locationsEnabled = false;
  config.lodging = { enabled: false };
  config.dressCode = { enabled: false };
  config.photos = { galleryEnabled: false, gallery: [] };
  config.giftRegistry = { enabled: false };
  config.itineraryEnabled = false;
  config.sharedAlbum = { enabled: false };
  config.instagram = { enabled: false };
  config.rsvpEnabled = false;
  config.vendorCard = { enabled: false };

  const html = templateEngine.generateHTML(config, 'vino');

  assert(isSectionHidden(html, 'details'), 'Locations is hidden when disabled');
  assert(isSectionHidden(html, 'hospedaje'), 'Lodging is hidden when disabled');
  assert(isSectionHidden(html, 'dresscode'), 'Dresscode is hidden when disabled');
  assert(isSectionHidden(html, 'galeria'), 'Gallery is hidden when disabled');
  assert(isSectionHidden(html, 'giftregistry'), 'Gift registry is hidden when disabled');
  assert(isSectionHidden(html, 'itinerario'), 'Itinerary is hidden when disabled');
  assert(isSectionHidden(html, 'albumColaborativo'), 'Shared album is hidden when disabled');
  assert(isSectionHidden(html, 'instagramSection'), 'Instagram is hidden when disabled');
  assert(isSectionHidden(html, 'rsvp'), 'RSVP is hidden when disabled');
  assert(!html.includes('id="leadMagnetCard"'), 'Vendor card is omitted when disabled');
}

// Test 5: Re-enabling each section makes it cleanly visible without extra hidden class
{
  const config = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
  config.countdownEnabled = true;
  config.familyEnabled = true;
  config.locationsEnabled = true;
  config.lodging = { enabled: true, hotels: [{ name: 'Hotel 1', address: 'Direccion 1', mapsUrl: 'https://maps.google.com' }] };
  config.dressCode = { enabled: true, title: 'Formal Elegante', description: 'Vestimenta de gala' };
  config.photos = { galleryEnabled: true, gallery: ['https://images.unsplash.com/photo-1.jpg'] };
  config.giftRegistry = { enabled: true, intro: 'Agradecemos tu detalle' };
  config.itineraryEnabled = true;
  config.sharedAlbum = { enabled: true, title: 'Álbum Digital' };
  config.instagram = { enabled: true, hashtag: '#BodaTest' };
  config.rsvpEnabled = true;

  const html = templateEngine.generateHTML(config, 'vino');

  assert(!isSectionHidden(html, 'countdownSection'), 'Countdown is visible when re-enabled');
  assert(!isSectionHidden(html, 'family'), 'Family is visible when re-enabled');
  assert(!isSectionHidden(html, 'details'), 'Locations is visible when re-enabled');
  assert(!isSectionHidden(html, 'hospedaje'), 'Lodging is visible when re-enabled');
  assert(!isSectionHidden(html, 'dresscode'), 'Dresscode is visible when re-enabled');
  assert(!isSectionHidden(html, 'galeria'), 'Gallery is visible when re-enabled');
  assert(!isSectionHidden(html, 'giftregistry'), 'Gift registry is visible when re-enabled');
  assert(!isSectionHidden(html, 'itinerario'), 'Itinerary is visible when re-enabled');
  assert(!isSectionHidden(html, 'albumColaborativo'), 'Shared album is visible when re-enabled');
  assert(!isSectionHidden(html, 'instagramSection'), 'Instagram is visible when re-enabled');
  assert(!isSectionHidden(html, 'rsvp'), 'RSVP is visible when re-enabled');
}

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) {
  process.exit(1);
}

