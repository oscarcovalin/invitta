const fs = require('fs');
const templateEngine = require('./template-engine.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n🧪 Testing Collaborative Album Security, Upload Lock & Bride Private Gallery...\n");

// 1. Generación de HTML
const config = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
const html = templateEngine.generateHTML(config, 'vino');

// 2. Elementos del Candado de Subida (Guest Upload Protection)
assert(html.includes('id="albumColaborativo"'), 'Contains albumColaborativo section');
assert(html.includes('id="albumLockBlock"'), 'Contains albumLockBlock (Upload protection for unauthorized users)');
assert(html.includes('id="inputAlbumUnlockCode"'), 'Contains inputAlbumUnlockCode for folio/access code');
assert(html.includes('id="btnUnlockAlbumUpload"'), 'Contains btnUnlockAlbumUpload');
assert(html.includes('id="albumUnlockError"'), 'Contains albumUnlockError feedback');

// 3. Elementos del Buzón de Subida (Drop-Box de Fotos)
assert(html.includes('id="albumUploadBlock"'), 'Contains albumUploadBlock');
assert(html.includes('id="labelAlbumGuestName"'), 'Contains labelAlbumGuestName for authorized guest display');
assert(html.includes('id="albumDropzone"'), 'Contains albumDropzone for touch/camera photo selection');
assert(html.includes('id="inputAlbumPhotos"'), 'Contains inputAlbumPhotos file input');
assert(html.includes('id="albumSelectedPreviews"'), 'Contains albumSelectedPreviews container');
assert(html.includes('id="inputAlbumDedication"'), 'Contains inputAlbumDedication for optional wishes/message');
assert(html.includes('id="btnSubmitAlbumPhotos"'), 'Contains btnSubmitAlbumPhotos to deposit in memory capsule');

// 4. Elementos del Bloque de Éxito
assert(html.includes('id="albumSuccessBlock"'), 'Contains albumSuccessBlock with confirmation message');
assert(html.includes('id="btnUploadMoreAlbumPhotos"'), 'Contains btnUploadMoreAlbumPhotos');

// 5. Candado y Modal de Visualización Exclusivo de los Novios (Bride Private Gallery)
assert(html.includes('id="btnOpenBrideGalleryModal"'), 'Contains btnOpenBrideGalleryModal (Bride exclusive entry trigger)');
assert(html.includes('id="modalBrideGallery"'), 'Contains modalBrideGallery container');
assert(html.includes('id="brideGalleryLockView"'), 'Contains brideGalleryLockView requiring master PIN');
assert(html.includes('id="inputBrideMasterPin"'), 'Contains inputBrideMasterPin for PIN verification');
assert(html.includes('id="btnUnlockBrideGallery"'), 'Contains btnUnlockBrideGallery button');
assert(html.includes('id="brideGalleryContentView"'), 'Contains brideGalleryContentView (Private mosaic)');
assert(html.includes('id="brideGalleryGrid"'), 'Contains brideGalleryGrid for loaded photos');
assert(html.includes('id="btnDownloadAllBridePhotos"'), 'Contains btnDownloadAllBridePhotos button');

// 6. Integración del Script de Seguridad
assert(html.includes('initSecureCollaborativeAlbum'), 'Contains initSecureCollaborativeAlbum controller logic');
assert(html.includes('invitta_album_photos_db'), 'Uses invitta_album_photos_db for secure client-side storage');

// 7. Verificación en invitacion.html
const inviteHtml = fs.readFileSync('./invitacion.html', 'utf-8');
assert(inviteHtml.includes('albumLockBlock'), 'invitacion.html contains albumLockBlock');
assert(inviteHtml.includes('modalBrideGallery'), 'invitacion.html contains modalBrideGallery');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
