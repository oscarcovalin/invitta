const templateEngine = require('./template-engine.js');

// 1. Test Default Configuration with Music Player
const configDefault = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
const htmlDefault = templateEngine.generateHTML(configDefault, 'vino');

console.log('--- TEST 1: DEFAULT DISCRETE MUSIC PLAYER ---');
console.log('Contains musicPlayer element:', htmlDefault.includes('id="musicPlayer"'));
console.log('Music player is visible (not hidden):', htmlDefault.includes('fixed right-4 bottom-20 z-40 flex'));
console.log('Contains audio tag with src:', htmlDefault.includes('id="musicAudio" loop preload="auto" src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3"'));
console.log('Contains animated eq-bars:', htmlDefault.includes('class="eq-bar'));
console.log('Contains song title:', htmlDefault.includes('A Thousand Years (Acústico)'));

// 2. Test Disabled Music Player
const configDisabled = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configDisabled.music.enabled = false;
const htmlDisabled = templateEngine.generateHTML(configDisabled, 'vino');

console.log('\n--- TEST 2: DISABLED MUSIC PLAYER ---');
console.log('Music player is hidden when enabled:false:', htmlDisabled.includes('fixed right-4 bottom-20 z-40 hidden'));
