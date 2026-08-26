const templateEngine = require('./template-engine.js');

// Configuración mínima con solo nombre y fecha
const minimalConfig = {
  name: "Camila",
  eyebrow: "Mis XV Años",
  eventDateISO: "2027-04-15T19:00:00",
  eventDateShort: "15 · Abril · 2027",
  story: { enabled: false, title: "", text: "", photo: "" },
  instagram: { enabled: false, hashtag: "" },
  court: [],
  mother: "",
  father: "",
  godmother: "",
  godfather: "",
  blessingIntro: "",
  ceremony: { venue: "", address: "" },
  reception: { venue: "Salón Real", address: "Av. Principal 100" },
  itinerary: [],
  giftRegistry: { enabled: false, stores: [], bank: { clabe: "" }, envelopeNote: "" },
  dressCode: { title: "", description: "", colorsEnabled: false, colorPalette: [] },
  music: { url: "" },
  photos: { hero: "", saveTheDate: "", portrait: "", gallery: [] }
};

const html = templateEngine.generateHTML(minimalConfig, 'esmeralda');

console.log('Minimal HTML Length:', html.length);
console.log('Story section is hidden:', html.includes('id="storySection"') && html.includes('hidden'));
console.log('Instagram section is hidden:', html.includes('id="instagramSection"') && html.includes('hidden'));
console.log('Gift registry section is hidden:', html.includes('id="giftregistry"') && html.includes('hidden'));
console.log('Itinerary section is hidden:', html.includes('id="itinerario"') && html.includes('hidden'));
