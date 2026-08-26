const templateEngine = require('./template-engine.js');

// 1. Test GSAP multi-plane elements are present in base HTML (no illustrations)
const configBase = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
const htmlBase = templateEngine.generateHTML(configBase, 'vino');

console.log('--- TEST 1: BASE HTML — GSAP PARALLAX INFRASTRUCTURE ---');
console.log('parallaxBgHero wrapper present:', htmlBase.includes('id="parallaxBgHero"'));
console.log('Hero section is overflow-visible:', htmlBase.includes('overflow: visible'));
console.log('illustrationBridgeHero present:', htmlBase.includes('id="illustrationBridgeHero"'));
console.log('illustrationBridgeFamily present:', htmlBase.includes('id="illustrationBridgeFamily"'));
console.log('Hero bridge is hidden by default:', htmlBase.includes('"illustrationBridgeHero"\n      class="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none will-change-transform hidden"'));
console.log('GSAP parallaxBgHero animation present:', htmlBase.includes("getElementById('parallaxBgHero')"));
console.log('GSAP illBridgeHero animation present:', htmlBase.includes("getElementById('illustrationBridgeHero')"));
console.log('GSAP illBridgeFamily animation present:', htmlBase.includes("getElementById('illustrationBridgeFamily')"));
console.log('GSAP scrub: 1.5 present:', htmlBase.includes('scrub: 1.5'));
console.log('Countdown has adaptive padding class (default pt-2):', htmlBase.includes('pt-2 sm:pt-4 pb-20'));

// 2. Test Hero illustration active
const configIllHero = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configIllHero.illustrations = {
  hero: { enabled: true, image: 'https://example.com/alice-illustration.png', widthPct: 85, overlapPct: 50 },
  family: { enabled: false, image: '', widthPct: 82, overlapPct: 50 }
};
const htmlIllHero = templateEngine.generateHTML(configIllHero, 'vino');

console.log('\n--- TEST 2: HERO ILLUSTRATION ACTIVE ---');
console.log('Hero bridge shows image URL:', htmlIllHero.includes('alice-illustration.png'));
console.log('Hero bridge NOT hidden:', !htmlIllHero.includes('"illustrationBridgeHero"\n      class="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none will-change-transform hidden"'));
console.log('Countdown gets extra top padding:', htmlIllHero.includes('pt-[160px]'));
console.log('Width is 85%:', htmlIllHero.includes('width: 85%'));
console.log('Bottom offset for 50% overlap (25px equiv):', htmlIllHero.includes('bottom: -25%'));

// 3. Test Family illustration active
const configIllFamily = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configIllFamily.illustrations = {
  hero: { enabled: false, image: '', widthPct: 85, overlapPct: 50 },
  family: { enabled: true, image: 'https://example.com/cards-illustration.png', widthPct: 82, overlapPct: 50 }
};
const htmlIllFamily = templateEngine.generateHTML(configIllFamily, 'vino');

console.log('\n--- TEST 3: FAMILY ILLUSTRATION ACTIVE ---');
console.log('Family bridge shows image URL:', htmlIllFamily.includes('cards-illustration.png'));
console.log('Details section gets extra top padding:', htmlIllFamily.includes('pt-[140px]'));
console.log('Family width is 82%:', htmlIllFamily.includes('width: 82%'));
console.log('Family section is overflow visible:', htmlIllFamily.includes('id="family" class="py-20 px-margin-mobile bg-emerald-dark text-center border-y border-antique-gold/30 relative" style="overflow: visible;"'));

// 4. Test both illustrations active simultaneously
const configBothIll = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configBothIll.illustrations = {
  hero: { enabled: true, image: 'https://example.com/alice.png', widthPct: 90, overlapPct: 60 },
  family: { enabled: true, image: 'https://example.com/cards.png', widthPct: 75, overlapPct: 40 }
};
const htmlBoth = templateEngine.generateHTML(configBothIll, 'vino');

console.log('\n--- TEST 4: BOTH ILLUSTRATIONS ACTIVE ---');
console.log('Both images present:', htmlBoth.includes('alice.png') && htmlBoth.includes('cards.png'));
console.log('Hero gets extra padding:', htmlBoth.includes('pt-[160px]'));
console.log('Details gets extra padding:', htmlBoth.includes('pt-[140px]'));
console.log('Hero width 90%:', htmlBoth.includes('width: 90%'));
console.log('Family width 75%:', htmlBoth.includes('width: 75%'));
// 60% overlap / 2 = 30%, so -30%
console.log('Hero bottom offset for 60% overlap (-30%):', htmlBoth.includes('bottom: -30%'));
// 40% overlap / 2 = 20%, so -20%
console.log('Family bottom offset for 40% overlap (-20%):', htmlBoth.includes('bottom: -20%'));

// 5. Section order still intact
const idxHero = htmlBoth.indexOf('id="hero"');
const idxCountdown = htmlBoth.indexOf('id="countdownSection"');
const idxFamily = htmlBoth.indexOf('id="family"');
const idxDetails = htmlBoth.indexOf('id="details"');
console.log('\n--- TEST 5: SECTION ORDER PRESERVED ---');
console.log('Hero before Countdown:', idxHero < idxCountdown);
console.log('Countdown before Family:', idxCountdown < idxFamily);
console.log('Family before Details:', idxFamily < idxDetails);
