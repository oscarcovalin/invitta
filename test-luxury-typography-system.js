const assert = require('assert');
const TemplateEngine = require('./template-engine.js');

console.log('\n=== TESTING LUXURY TYPOGRAPHIC SYSTEM (INVITTA STUDIO) ===\n');

const config = JSON.parse(JSON.stringify(TemplateEngine.defaultConfig));
config.photos = {
  hero: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200'
};

const html = TemplateEngine.generateHTML(config, 'vino');

// 1. FUENTES: Cormorant Garamond (Serif), Inter (Sans), Parisienne (Script)
assert(html.includes('Cormorant+Garamond'), 'Google Fonts includes Cormorant Garamond');
assert(html.includes('Inter:wght'), 'Google Fonts includes Inter');
assert(html.includes('Parisienne'), 'Google Fonts includes Parisienne');

// 2. TAILWIND TOKENS
assert(html.includes('"display-lg": ["var(--font-display)", "\'Cormorant Garamond\'", "serif"]'), 'Tailwind display-lg uses Cormorant Garamond');
assert(html.includes('"body-lg": ["var(--font-body)", "\'Inter\'", "sans-serif"]'), 'Tailwind body-lg uses Inter');
assert(html.includes('"label-caps": ["var(--font-body)", "\'Inter\'", "sans-serif"]'), 'Tailwind label-caps uses Inter');
assert(html.includes('"script-accent": ["var(--font-script)", "\'Parisienne\'", "cursive"]'), 'Tailwind script-accent uses Parisienne');

// 3. ESCALA HERO NAMES (Serif, 44-56px, Light/Regular, NUNCA BOLD)
const brideNameMatch = html.match(/<h1[^>]*id="heroBrideName"[^>]*>/);
assert(brideNameMatch, 'heroBrideName exists');
assert(brideNameMatch[0].includes('font-display-lg'), 'Hero bride name uses font-display-lg (Serif)');
assert(brideNameMatch[0].includes('font-light'), 'Hero bride name uses font-light');
assert(!brideNameMatch[0].includes('font-bold'), 'Hero bride name is NEVER bold');

const groomNameMatch = html.match(/<h1[^>]*id="heroGroomName"[^>]*>/);
assert(groomNameMatch, 'heroGroomName exists');
assert(groomNameMatch[0].includes('font-display-lg'), 'Hero groom name uses font-display-lg (Serif)');
assert(groomNameMatch[0].includes('font-light'), 'Hero groom name uses font-light');
assert(!groomNameMatch[0].includes('font-bold'), 'Hero groom name is NEVER bold');

// 4. PALABRA DE ACENTO SCRIPT (Parisienne, 32-40px, máx 1-2 palabras)
const connectorMatch = html.match(/<span[^>]*id="heroNameConnector"[^>]*>([\s\S]*?)<\/span>/);
assert(connectorMatch, 'heroNameConnector exists');
assert(connectorMatch[0].includes('font-script'), 'Connector uses font-script');
assert(connectorMatch[0].includes('hero-connector-scaled'), 'Connector uses hero-connector-scaled');
assert(connectorMatch[1].trim() === '&', 'Connector has clean &');

// 5. NÚMERO DE FECHA (Serif 44-56px Light)
const dateDayMatch = html.match(/<span[^>]*id="heroDateDay"[^>]*>/);
assert(dateDayMatch, 'heroDateDay exists');
assert(dateDayMatch[0].includes('font-display-lg'), 'Date day number uses font-display-lg');
assert(dateDayMatch[0].includes('font-light'), 'Date day number uses font-light');

// 6. LABELS & EYEBROWS (Sans 11-14px Medium MAYÚSCULAS tracking +2 a +3px)
const eyebrowMatch = html.match(/<p[^>]*id="heroEyebrow"[^>]*>/);
assert(eyebrowMatch, 'heroEyebrow exists');
assert(eyebrowMatch[0].includes('font-label-caps'), 'Eyebrow uses font-label-caps (Inter)');
assert(eyebrowMatch[0].includes('uppercase'), 'Eyebrow is uppercase');
assert(eyebrowMatch[0].includes('font-medium'), 'Eyebrow uses font-medium');

// 7. CUERPO / SUBCOPY (Sans 13-16px Regular sin tracking extra)
const welcomeMsgMatch = html.match(/<p[^>]*id="welcomeMessage"[^>]*>/);
assert(welcomeMsgMatch, 'welcomeMessage exists');
assert(welcomeMsgMatch[0].includes('font-body-lg'), 'Welcome message uses font-body-lg');
assert(welcomeMsgMatch[0].includes('font-normal'), 'Welcome message uses font-normal');

// 8. BOTONES / CTA (Sans 11-12px Medium MAYÚSCULAS tracking +3px)
const rsvpSubmitMatch = html.match(/<button[^>]*id="rsvpSubmit"[^>]*>/);
assert(rsvpSubmitMatch, 'rsvpSubmit exists');
assert(rsvpSubmitMatch[0].includes('uppercase'), 'RSVP submit button is uppercase');
assert(rsvpSubmitMatch[0].includes('tracking-'), 'RSVP submit button has tracking');

// 9. PALETA CÁLIDA PAPEL/CREMA Y ONYX
assert(html.includes('--champagne: #FAF8F5'), 'Champagne variable is warm paper cream #FAF8F5');
assert(html.includes('--onyx: #1E1E1E'), 'Onyx variable is deep charcoal #1E1E1E');
assert(html.includes('--gold: #A38047'), 'Gold variable is satin antique gold #A38047');

// 10. SIN GLOW O SOMBRAS PESADAS EN HERO
assert(!brideNameMatch[0].includes('drop-shadow-'), 'Hero bride name has no artificial drop-shadow');
assert(!groomNameMatch[0].includes('drop-shadow-'), 'Hero groom name has no artificial drop-shadow');

console.log('✅ ALL 10 LUXURY TYPOGRAPHY SYSTEM RULES FULLY VERIFIED PASSING!\n');
