const assert = require('assert');
const TemplateEngine = require('./template-engine.js');

console.log('\n=== TESTING SEPARATION OF NAMES FONT (HERO & FOOTER SIGNATURE) ===\n');

// 1. Configuración por defecto
const configDefault = JSON.parse(JSON.stringify(TemplateEngine.defaultConfig));
const htmlDefault = TemplateEngine.generateHTML(configDefault, 'vino');

assert(htmlDefault.includes('--font-names:'), 'CSS root contains --font-names variable');
assert(htmlDefault.includes('--font-display:'), 'CSS root contains --font-display variable');
assert(htmlDefault.includes('--font-body:'), 'CSS root contains --font-body variable');

const brideDefault = htmlDefault.match(/<h1[^>]*id="heroBrideName"[^>]*>/);
assert(brideDefault && brideDefault[0].includes('var(--font-names'), 'heroBrideName uses --font-names');

const footerDefault = htmlDefault.match(/<p[^>]*id="footerNames"[^>]*>/);
assert(footerDefault && footerDefault[0].includes('var(--font-names'), 'footerNames uses --font-names');

console.log('✅ PASS 1: Default configuration binds Hero & Footer names to --font-names');

// 2. Cambio exclusivo de tipografía de nombres (ej: "Great Vibes" para los nombres, manteniendo Cormorant Garamond para títulos)
const configCustomNames = JSON.parse(JSON.stringify(TemplateEngine.defaultConfig));
configCustomNames.typography = {
  namesFont: "Great Vibes",
  displayFont: "Cormorant Garamond",
  bodyFont: "Inter",
  scriptFont: "Parisienne"
};

const htmlCustomNames = TemplateEngine.generateHTML(configCustomNames, 'vino');

// Verificar que --font-names es Great Vibes
assert(htmlCustomNames.includes("--font-names: 'Great Vibes', cursive"), '--font-names is Great Vibes');

// Verificar que --font-display sigue siendo Cormorant Garamond
assert(htmlCustomNames.includes("--font-display: 'Cormorant Garamond', serif"), '--font-display stays Cormorant Garamond');

// Verificar que la fuente de los nombres hero y footer usan --font-names
const brideCustom = htmlCustomNames.match(/<h1[^>]*id="heroBrideName"[^>]*>/);
assert(brideCustom && brideCustom[0].includes('var(--font-names'), 'heroBrideName uses --font-names');

const footerCustom = htmlCustomNames.match(/<p[^>]*id="footerNames"[^>]*>/);
assert(footerCustom && footerCustom[0].includes('var(--font-names'), 'footerNames uses --font-names');

// Verificar que los títulos de secciones permanecen intactos en font-display-lg (Cormorant Garamond)
const storyTitleMatch = htmlCustomNames.match(/<h2[^>]*id="storyTitle"[^>]*>/);
assert(storyTitleMatch && storyTitleMatch[0].includes('font-display-lg'), 'storyTitle keeps font-display-lg intact');

const dressTitleMatch = htmlCustomNames.match(/<h2[^>]*id="dressTitle"[^>]*>/);
assert(dressTitleMatch && dressTitleMatch[0].includes('font-display-lg'), 'dressTitle keeps font-display-lg intact');

const giftIntroMatch = htmlCustomNames.match(/<p[^>]*id="giftIntro"[^>]*>/);
assert(giftIntroMatch && giftIntroMatch[0].includes('font-display-lg'), 'giftIntro keeps font-display-lg intact');

const welcomeMessageMatch = htmlCustomNames.match(/<p[^>]*id="welcomeMessage"[^>]*>/);
assert(welcomeMessageMatch && welcomeMessageMatch[0].includes('font-display-lg'), 'welcomeMessage keeps font-display-lg intact');

console.log('✅ PASS 2: Custom Names Font changes ONLY Hero names and Footer signature without altering any other section');

// 3. Subida de archivo local personalizado para los nombres
const configLocalFile = JSON.parse(JSON.stringify(TemplateEngine.defaultConfig));
configLocalFile.typography = {
  customNamesFile: "data:font/woff2;base64,d09GMgABAAAAA...",
  customNamesFileName: "MiFuenteNovios.woff2",
  displayFont: "Cormorant Garamond",
  bodyFont: "Inter"
};

const htmlLocalFile = TemplateEngine.generateHTML(configLocalFile, 'vino');

assert(htmlLocalFile.includes("@font-face {\n          font-family: 'LocalCustomNames';"), 'Creates @font-face for LocalCustomNames');
assert(htmlLocalFile.includes("--font-names: 'LocalCustomNames', serif;"), '--font-names is LocalCustomNames');
assert(htmlLocalFile.includes("--font-display: 'Cormorant Garamond', serif;"), '--font-display is still Cormorant Garamond');

console.log('✅ PASS 3: Local custom font file applies ONLY to --font-names');

console.log('\n🎉 ALL NAMES FONT SEPARATION TESTS PASSED 100%!\n');
