const templateEngine = require('./template-engine.js');

// 1. Test GSAP multi-plane elements are present in base HTML (no illustrations)
const configBase = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
const htmlBase = templateEngine.generateHTML(configBase, 'vino');

console.log('--- TEST 1: BASE HTML — GSAP PARALLAX INFRASTRUCTURE ---');
console.log('parallaxBgHero wrapper present:', htmlBase.includes('id="parallaxBgHero"'));
console.log('Hero section is overflow-visible:', htmlBase.includes('overflow: visible'));
console.log('illustrationBridgeHero present:', htmlBase.includes('id="illustrationBridgeHero"'));
console.log('illustrationBridgeFamily present:', htmlBase.includes('id="illustrationBridgeFamily"'));
console.log('Hero bridge is hidden by default:', htmlBase.includes('id="illustrationBridgeHero"') && htmlBase.includes('hidden'));
console.log('GSAP parallaxBgHero animation present:', htmlBase.includes("getElementById('parallaxBgHero')"));
console.log('GSAP illBridgeHero animation present:', htmlBase.includes("getElementById('illustrationBridgeHero')"));
console.log('GSAP illBridgeFamily animation present:', htmlBase.includes("getElementById('illustrationBridgeFamily')"));
console.log('Countdown has adaptive padding class (default pt-2):', htmlBase.includes('pt-2 sm:pt-4 pb-20'));

// 2. Test Hero illustration active with custom precision positioning
const configIllHero = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configIllHero.illustrations = {
  hero: { 
    enabled: true, 
    image: 'https://example.com/alice-illustration.png', 
    widthPct: 85, 
    maxWidth: 580,
    offsetY: -20,
    offsetX: 10,
    overlapPct: 50,
    alignX: 'center',
    parallaxSpeed: 30,
    extraPadding: 40
  },
  family: { enabled: false, image: '' }
};
const htmlIllHero = templateEngine.generateHTML(configIllHero, 'vino');

console.log('\n--- TEST 2: HERO ILLUSTRATION ACTIVE WITH PRECISION POSITIONING ---');
console.log('Hero bridge shows image URL:', htmlIllHero.includes('alice-illustration.png'));
console.log('Hero bridge NOT hidden:', !htmlIllHero.includes('id="illustrationBridgeHero"\n      class="absolute z-30 pointer-events-none will-change-transform hidden"'));
console.log('Hero bridge contains max-width 580px:', htmlIllHero.includes('max-width: 580px'));
console.log('Hero bridge contains bottom offset calc with offsetY -20px:', htmlIllHero.includes('bottom: calc(-25% + -20px)'));
console.log('Hero bridge contains offsetX calc +10px:', htmlIllHero.includes('left: calc(50% + 10px)'));
console.log('Countdown receives extraPadding 40px:', htmlIllHero.includes('pt-[calc(140px+40px)]'));
console.log('GSAP receives custom parallax speed 30%:', htmlIllHero.includes('const heroParallaxSpeed = 30'));

// 3. Test Family illustration active with left alignment
const configIllFamily = JSON.parse(JSON.stringify(templateEngine.defaultConfig));
configIllFamily.illustrations = {
  hero: { enabled: false, image: '' },
  family: { 
    enabled: true, 
    image: 'https://example.com/cards-illustration.png', 
    widthPct: 75, 
    maxWidth: 620,
    offsetY: 15,
    offsetX: -5,
    overlapPct: 40,
    alignX: 'left',
    parallaxSpeed: 20,
    extraPadding: 20
  }
};
const htmlIllFamily = templateEngine.generateHTML(configIllFamily, 'vino');

console.log('\n--- TEST 3: FAMILY ILLUSTRATION ACTIVE WITH LEFT ALIGNMENT ---');
console.log('Family bridge shows image URL:', htmlIllFamily.includes('cards-illustration.png'));
console.log('Details section gets extra top padding + 20px:', htmlIllFamily.includes('pt-[calc(130px+20px)]'));
console.log('Family width is 75% and max-width 620px:', htmlIllFamily.includes('width: 75%; max-width: 620px'));
console.log('Family left alignment applied:', htmlIllFamily.includes('left: calc(3% + -5px)'));
console.log('Family bottom offset for 40% overlap + 15px:', htmlIllFamily.includes('bottom: calc(-20% + 15px)'));

// 4. Section order still intact
const idxHero = htmlIllHero.indexOf('id="hero"');
const idxCountdown = htmlIllHero.indexOf('id="countdownSection"');
const idxFamily = htmlIllHero.indexOf('id="family"');
const idxDetails = htmlIllHero.indexOf('id="details"');
console.log('\n--- TEST 4: SECTION ORDER PRESERVED ---');
console.log('Hero before Countdown:', idxHero < idxCountdown);
console.log('Countdown before Family:', idxCountdown < idxFamily);
console.log('Family before Details:', idxFamily < idxDetails);
