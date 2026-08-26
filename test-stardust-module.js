const fs = require('fs');
const path = require('path');
const TemplateEngine = require('./template-engine.js');

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

console.log("\n🧪 Testing 'Polvo de Estrellas' (Stardust Transition & Fullscreen Light Mode)...");

// 1. Check TemplateEngine defaults
assert(!!TemplateEngine.defaultConfig.stardust, 'TemplateEngine.defaultConfig has stardust property');
assert(TemplateEngine.defaultConfig.stardust.enabled === true, 'stardust.enabled is true by default');
assert(TemplateEngine.defaultConfig.stardust.title === 'Polvo de Estrellas', 'stardust.title is Polvo de Estrellas');
assert(TemplateEngine.defaultConfig.stardust.buttonText.includes('Encender mi Luz'), 'stardust.buttonText contains Encender mi Luz');

// 2. Check generated HTML structure
const html = TemplateEngine.generateHTML(TemplateEngine.defaultConfig);
assert(html.includes('id="stardustTransition"'), 'Generated HTML includes stardustTransition container');
assert(html.includes('id="stardustTransitionCanvas"'), 'Generated HTML includes stardustTransitionCanvas');
assert(html.includes('id="btnOpenStardustLight"'), 'Generated HTML includes btnOpenStardustLight');
assert(html.includes('id="stardustFullScreenOverlay"'), 'Generated HTML includes stardustFullScreenOverlay modal');
assert(html.includes('id="stardustFullCanvas"'), 'Generated HTML includes stardustFullCanvas for sparklers');
assert(html.includes('id="btnCloseStardust"'), 'Generated HTML includes btnCloseStardust');
assert(html.includes('initStardust'), 'Generated HTML includes initStardust script');

// 3. Check transition position (must be between ceremonyCard and receptionCard)
const ceremonyIdx = html.indexOf('id="ceremonyCard"');
const stardustIdx = html.indexOf('id="stardustTransition"');
const receptionIdx = html.indexOf('id="receptionCard"');

assert(ceremonyIdx !== -1, 'Found ceremonyCard in HTML');
assert(stardustIdx !== -1, 'Found stardustTransition in HTML');
assert(receptionIdx !== -1, 'Found receptionCard in HTML');
assert(ceremonyIdx < stardustIdx && stardustIdx < receptionIdx, 'stardustTransition is positioned between ceremonyCard and receptionCard');

// 4. Check invitacion-estudio.html form controls
const estudioHtml = fs.readFileSync(path.join(__dirname, 'invitacion-estudio.html'), 'utf-8');
assert(estudioHtml.includes('id="checkStardustEnabled"'), 'invitacion-estudio.html has checkStardustEnabled');
assert(estudioHtml.includes('id="inputStardustTitle"'), 'invitacion-estudio.html has inputStardustTitle');
assert(estudioHtml.includes('id="inputStardustSubtitle"'), 'invitacion-estudio.html has inputStardustSubtitle');
assert(estudioHtml.includes('id="inputStardustTime"'), 'invitacion-estudio.html has inputStardustTime');
assert(estudioHtml.includes('id="inputStardustBtnText"'), 'invitacion-estudio.html has inputStardustBtnText');
assert(estudioHtml.includes('id="inputStardustText"'), 'invitacion-estudio.html has inputStardustText');

// 5. Check app.js integration
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
assert(appJs.includes('checkStardustEnabled'), 'app.js manages checkStardustEnabled in section toggles');
assert(appJs.includes('inputStardustTitle'), 'app.js manages inputStardustTitle binding');
assert(appJs.includes('stardust.buttonText'), 'app.js manages stardust.buttonText binding');

// 6. Check invitacion.html
const invitacionHtml = fs.readFileSync(path.join(__dirname, 'invitacion.html'), 'utf-8');
assert(invitacionHtml.includes('id="stardustTransition"'), 'invitacion.html has stardustTransition');
assert(invitacionHtml.includes('id="stardustFullScreenOverlay"'), 'invitacion.html has stardustFullScreenOverlay');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
