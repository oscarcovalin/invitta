const templateEngine = require('./template-engine.js');

// 1. Test Default Configuration with Collaborative Album
const configDefault = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
const htmlDefault = templateEngine.generateHTML(configDefault, 'vino');

console.log('--- TEST 1: SHARED COLLABORATIVE ALBUM ---');
console.log('Contains albumColaborativo section:', htmlDefault.includes('id="albumColaborativo"'));
console.log('Contains albumLockBlock:', htmlDefault.includes('id="albumLockBlock"'));
console.log('Contains access code "BODA2027":', htmlDefault.includes('BODA2027'));
console.log('Contains btnUnlockAlbumUpload:', htmlDefault.includes('id="btnUnlockAlbumUpload"'));
console.log('Contains albumUploadBlock:', htmlDefault.includes('id="albumUploadBlock"'));
console.log('Contains albumRecentPhotosCard:', htmlDefault.includes('id="albumRecentPhotosCard"'));
console.log('Contains albumRecentPhotosGrid:', htmlDefault.includes('id="albumRecentPhotosGrid"'));
console.log('Contains modalBrideGallery:', htmlDefault.includes('id="modalBrideGallery"'));

const idxItinerario = htmlDefault.indexOf('id="itinerario"');
const idxAlbum = htmlDefault.indexOf('id="albumColaborativo"');
const idxHashtag = htmlDefault.indexOf('id="instagramSection"');

console.log('Itinerario index:', idxItinerario);
console.log('Album index:', idxAlbum);
console.log('Hashtag index:', idxHashtag);
console.log('Album is placed beneath Itinerario:', idxItinerario < idxAlbum && idxAlbum < idxHashtag);

// 2. Test Disabled Album
const configDisabled = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configDisabled.sharedAlbum.enabled = false;
const htmlDisabled = templateEngine.generateHTML(configDisabled, 'vino');

console.log('\n--- TEST 2: DISABLED SHARED ALBUM ---');
console.log('Album is hidden when enabled:false:', htmlDisabled.includes('id="albumColaborativo"') && htmlDisabled.includes('hidden'));
