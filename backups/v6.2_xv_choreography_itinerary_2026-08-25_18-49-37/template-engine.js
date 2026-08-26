/**
 * Template Engine para Invitaciones Digitales de Alta Gama (XV Años & Bodas)
 * Versión 4.9: Orden de Secciones Estructurado según Solicitud del Usuario:
 * 1. Evento & Protagonista (Portada, Nombres, Mensaje / Cita)
 * 2. Cuenta Regresiva (Fecha, Cápsula de Cristal, Frase Emotiva, Calendarios)
 * 3. Familia y Padrinos (Bendición, Padres Novia/Novio, Padrinos, Corte de Honor)
 * 4. Ubicaciones (Dónde & Cuándo: Ceremonia y Recepción con Maps y Waze)
 * 5. Dress Code (Código de Vestimenta & Paleta de Colores)
 * 6. Galería Fotográfica (Galería Continua sin Separadores y sin Recortes)
 * 7. Mesa de Regalos (Tiendas, Transferencia Bancaria CLABE, Lluvia de Sobres)
 * 8. Programa (Itinerario con Timeline Zig-Zag Animada con Nodos de Corazón)
 * 9. Hashtag (Instagram: Comparte tus Recuerdos & Copiar Hashtag)
 * 10. Confirmación / RSVP (Formulario, Pases VIP, Código QR de Acceso)
 * 11. Footer (Con Amor, Nombres y Pie de Página)
 */

function hexToRgba(hex, alpha = 0.55) {
  if (!hex) return `rgba(18, 18, 20, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(18, 18, 20, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getSectionBg(config, key, defaultOpacity = 0.35) {
  const bgs = (config && config.sectionBackgrounds) || {};
  const item = bgs[key];
  if (!item) return { image: "", opacity: defaultOpacity };
  if (typeof item === 'string') return { image: item, opacity: defaultOpacity };
  return {
    image: item.image || "",
    opacity: typeof item.opacity === 'number' ? item.opacity : defaultOpacity
  };
}

const TemplateEngine = {
  fontPresets: {
    script: [
      { name: "Great Vibes", family: "'Great Vibes', cursive", google: "Great+Vibes" },
      { name: "Alex Brush", family: "'Alex Brush', cursive", google: "Alex+Brush" },
      { name: "Allura", family: "'Allura', cursive", google: "Allura" },
      { name: "Pinyon Script", family: "'Pinyon Script', cursive", google: "Pinyon+Script" },
      { name: "Playfair Display", family: "'Playfair Display', serif", google: "Playfair+Display:ital,wght@0,400;1,400;1,600" },
      { name: "Cinzel Decorative", family: "'Cinzel Decorative', cursive", google: "Cinzel+Decorative:wght@700" },
      { name: "MonteCarlo", family: "'MonteCarlo', cursive", google: "MonteCarlo" },
      { name: "Parisienne", family: "'Parisienne', cursive", google: "Parisienne" }
    ],
    display: [
      { name: "Cinzel", family: "'Cinzel', serif", google: "Cinzel:wght@400;600;700;800" },
      { name: "Playfair Display", family: "'Playfair Display', serif", google: "Playfair+Display:ital,wght@0,600;0,700;1,600" },
      { name: "Bodoni Moda", family: "'Bodoni Moda', serif", google: "Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900" },
      { name: "Cormorant Garamond", family: "'Cormorant Garamond', serif", google: "Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500" },
      { name: "Cardo", family: "'Cardo', serif", google: "Cardo:ital,wght@0,400;0,700;1,400" }
    ],
    body: [
      { name: "Source Serif 4", family: "'Source Serif 4', serif", google: "Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400" },
      { name: "Lora", family: "'Lora', serif", google: "Lora:ital,wght@0,400;0,500;0,600;1,400;1,500" },
      { name: "Cormorant", family: "'Cormorant', serif", google: "Cormorant:ital,wght@0,400;0,600;1,400" },
      { name: "Work Sans", family: "'Work Sans', sans-serif", google: "Work+Sans:wght@400;500;600;700" }
    ]
  },

  backgroundPresets: [
    {
      id: "roses",
      name: "Rosas Blancas & Marfil (Como la Muestra)",
      url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: "silk",
      name: "Seda & Textura Marfil",
      url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: "bokeh",
      name: "Destellos Dorados & Bokeh",
      url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: "botanical",
      name: "Acuarela Botánica Suave",
      url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop"
    }
  ],

  defaultThemes: {
    vino: {
      "wine-900": "#163c2b", "wine-700": "#163c2b", "wine-500": "#24583f",
      "blush-100": "#f5f3ef", "blush-200": "#eae8e4", "cream": "#f7f6ec",
      "gold-300": "#EAB479", "gold-500": "#A56E0E", "gold-700": "#7f5300",
      "ink-900": "#0d130e", "ink-700": "#222222",
      "rose-600": "#A56E0E", "text-cream": "#f7f6ec"
    },
    rosa: {
      "wine-900": "#3d0b26", "wine-700": "#6e1f46", "wine-500": "#8e325d",
      "blush-100": "#fdf2f5", "blush-200": "#fbe3eb", "cream": "#fdf8f5",
      "gold-300": "#f2ccd7", "gold-500": "#d694ab", "gold-700": "#ab6781",
      "ink-900": "#210d13", "ink-700": "#2f171c",
      "rose-600": "#b34469", "text-cream": "#fcf0f3"
    },
    esmeralda: {
      "wine-900": "#0b2118", "wine-700": "#163c2b", "wine-500": "#24583f",
      "blush-100": "#f1f6ed", "blush-200": "#e1ebd8", "cream": "#f7f6ec",
      "gold-300": "#dccf96", "gold-500": "#A56E0E", "gold-700": "#7f5300",
      "ink-900": "#0d130e", "ink-700": "#182219",
      "rose-600": "#163c2b", "text-cream": "#f7f6ec"
    },
    medianoche: {
      "wine-900": "#0a1120", "wine-700": "#15243d", "wine-500": "#243c5e",
      "blush-100": "#edf1f7", "blush-200": "#dae2ef", "cream": "#f5f6f9",
      "gold-300": "#cdd3e0", "gold-500": "#a0abc2", "gold-700": "#727e99",
      "ink-900": "#080b11", "ink-700": "#121722",
      "rose-600": "#43649e", "text-cream": "#eff1f6"
    },
    atardecer: {
      "wine-900": "#3d1c0e", "wine-700": "#6b3319", "wine-500": "#914a27",
      "blush-100": "#faf1e6", "blush-200": "#f5e1cb", "cream": "#fdf8f0",
      "gold-300": "#ebb987", "gold-500": "#d19256", "gold-700": "#9e6c3a",
      "ink-900": "#1c0d05", "ink-700": "#2b160b",
      "rose-600": "#b85f2e", "text-cream": "#faeee2"
    }
  },

  defaultConfig: {
    eventType: "boda",
    name: "Catalina & Julián",
    brideName: "Catalina",
    groomName: "Julián",
    nameConnector: "&", // '&', '+', 'y', o personalizado
    monogram: "", // Iniciales personalizadas para el sello del header (ej: 'C & J', 'CJ', 'V')
    eyebrow: "Nuestra Boda",
    welcomeMessage: "Tenemos el honor de invitarte a celebrar el inicio de nuestra nueva vida juntos. Tu presencia es el mejor regalo que podríamos recibir en este día tan especial.",
    eventDateISO: "2027-03-20T16:00:00",
    timezoneOffset: "-06:00",
    eventDateLabel: "20 de Marzo, 2027",
    eventDateShort: "20 · Marzo · 2027",
    eventDurationHours: 6,
    countdownPhrase: "Para casarme con el amor de mi vida",
    countdownStyle: {
      bgColor: "#121214",
      opacity: 0.55,
      textColor: "#ffffff"
    },
    quote: "El amor no se mira, se siente, y aún más cuando ella está junto a ti.",
    blessingIntro: "Con la bendición de nuestros padres",
    
    mother: "Elena de Martínez",
    father: "Roberto Martínez",
    brideMother: "Elena de Martínez",
    brideFather: "Roberto Martínez",
    groomMother: "María de Morales",
    groomFather: "Carlos Morales",

    godmother: "Ana de López",
    godfather: "Javier López",
    court: ["Camila Ortiz", "Renata Vega", "Diego Fuentes", "Emiliano Cruz", "Ximena Paredes"],

    story: {
      enabled: true,
      title: "Nuestra Historia",
      subtitle: "Un camino lleno de momentos inolvidables",
      text: "Dicen que los mejores momentos de la vida llegan sin planearse. Desde el primer instante supimos que este día llegaría, y hoy queremos compartir la magia de nuestra historia con quienes más amamos.",
      photo: ""
    },

    instagram: {
      enabled: true,
      hashtag: "#BodaCatalinayJulian",
      text: "Comparte tus fotos y momentos especiales con nosotros en Instagram usando nuestro hashtag oficial."
    },

    sharedAlbum: {
      enabled: true,
      title: "Álbum Colaborativo",
      subtitle: "Comparte tus Fotos y Videos",
      description: "¡Ayúdanos a capturar cada momento! Sube aquí todas las fotos y videos que tomes durante nuestro gran día usando tu código personalizado de invitado.",
      accessCode: "BODA2027",
      albumUrl: "https://photos.google.com"
    },

    typography: {
      scriptFont: "Great Vibes",
      displayFont: "Cinzel",
      bodyFont: "Source Serif 4",
      customScript: "",
      customDisplay: "",
      customBody: "",
      customScriptFile: "",
      customScriptFileName: "",
      customDisplayFile: "",
      customDisplayFileName: "",
      customBodyFile: "",
      customBodyFileName: "",
      
      // Efecto de Títulos (Metálico o Sólido)
      titleEffect: "metallic", // 'metallic' o 'solid'
      titleMetallicPreset: "gold", // 'gold', 'rosegold', 'silver', 'bronze', 'custom'
      titleCustomMetallic: "",
      titleSolidColor: "#ffffff",

      // Escala y Proporciones Tipográficas Controladas (1.0 = 100%)
      scaleHero: 1.0,      // Portada / Nombres Principales (0.80 - 1.30)
      scaleHeadings: 1.0,  // Títulos de Secciones (0.80 - 1.25)
      scaleBody: 1.0       // Textos de Lectura & Cuerpo (0.85 - 1.20)
    },

    decorations: {
      floatingMascot: { enabled: false, url: "", width: 104 },
      cornerFloralFrame: { enabled: false, url: "" },
      goldenVine: { enabled: false },
      welcomeFrame: { enabled: false, url: "" },
      flourishDividers: { enabled: true }
    },

    sectionBackgrounds: {
      family: { image: "", opacity: 0.35 },
      details: { image: "", opacity: 0.30 },
      dressCode: { image: "", opacity: 0.25 },
      gallery: { image: "", opacity: 0.25 },
      giftRegistry: { image: "", opacity: 0.25 },
      itinerary: { image: "", opacity: 0.30 },
      sharedAlbum: { image: "", opacity: 0.30 },
      instagram: { image: "", opacity: 0.25 },
      rsvp: { image: "", opacity: 0.35 }
    },

    ceremony: {
      venue: "Parroquia San Rafael",
      address: "Av. de las Rosas 123, Col. Centro",
      time: "4:00 PM",
      mapsUrl: "https://maps.google.com/?q=Parroquia+San+Rafael",
      wazeUrl: "https://waze.com/ul?q=Parroquia+San+Rafael"
    },
    reception: {
      venue: "Jardín Las Magnolias",
      address: "Camino Real 456, Valle Alto",
      time: "6:30 PM",
      mapsUrl: "https://maps.google.com/?q=Jardín+Las+Magnolias",
      wazeUrl: "https://waze.com/ul?q=Jardín+Las+Magnolias"
    },

    itinerary: [
      { icon: "church", label: "Ceremonia Religiosa", time: "18:00 hrs" },
      { icon: "rings",  label: "Boda Civil",           time: "19:00 hrs" },
      { icon: "toast",  label: "Recepción",            time: "20:00 hrs" },
      { icon: "dinner", label: "Cena",                 time: "20:30 hrs" },
      { icon: "dance",  label: "Todo mundo a bailar",  time: "21:30 hrs" },
      { icon: "car",    label: "Fin del evento",       time: "2:00 hrs" }
    ],

    dressCode: {
      title: "Formal",
      description: "Sugerimos tonos cálidos y neutros. Por favor, reserven el color blanco y perla para la novia.",
      colorsEnabled: true,
      colorPalette: [
        { name: "Negro Ónix", hex: "#1b1c1a" },
        { name: "Marrón Cálido", hex: "#514536" },
        { name: "Tierra Suave", hex: "#7f5624" },
        { name: "Arena Champagne", hex: "#d5c4b1" }
      ],
      reservedColorsNote: "Colores blanco y perla estrictamente reservados para la novia."
    },

    giftRegistry: {
      enabled: true,
      intro: "El mejor regalo es tu presencia, pero si deseas tener un detalle con nosotros, te sugerimos nuestras mesas de regalos o transferencia bancaria.",
      stores: [
        { name: "Liverpool", url: "https://www.liverpool.com.mx", code: "#12345678" },
        { name: "Amazon", url: "https://www.amazon.com.mx", code: "Mesa Catalina & Julián" }
      ],
      bank: {
        bankName: "BBVA",
        holder: "Catalina Martínez Ruiz",
        clabe: "0121 8001 2345 6789 01"
      },
      envelopeNote: "Agradecemos de corazón tu muestra de cariño en nuestra tradicional lluvia de sobres."
    },

    photos: {
      hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuAW__AHZ8__AeO-8geq_rACRvd89nSVY-g-aWGINTw7Bb3vY4BIanHsIVp5lwcRLZOLkei6_hGQ4P64mC2_6NVGDClxFvok9a49qUwtEsXaURlkL0vCPGXEVTr_sOXFYzj7kMM1tS1toTgeNWwlgEvOeFjFlNcXJqOXsixEtcM3rAWs5mzWZx_RcwLxmAwni9OsL_0QwgNXt6jq6UTsNus7SDrMVIDPYi72b0jrBGwgNbfCLM9lG6JM",
      saveTheDate: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmfoTsh27k1L3TGdBgr3eB3wVklkukCMeb_D9D0x9bsC1orG7P5zdmOQYAWy6ItrFikXfoaCslUtH8jxsbSM1IA749IkYVpnCbWh3oxo_VMxj-GFJN29YBv2-UKvHUmzDUZTrEvVrROpsdHRNkHI6dEkN62delZNZKrGT3pqy9CpcQ8a4v4_6kTMx4WFLE9qI4sklEEGe5u3W8mxLA69-LNIu3SMlCbEOV13lWSC1PSPT97HzZVgs6",
      portrait: "",
      gallery: []
    },

    rsvpDeadlineLabel: "Por favor, haznos saber si podrás acompañarnos antes del 20 de Febrero.",
    footerText: "Catalina & Julián",
    whatsappNumber: "5215512345678",
    defaultPassCount: 2,

    music: {
      enabled: true,
      url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
      title: "A Thousand Years (Acústico)"
    },

    // ─── Multi-Plano Parallax ──────────────────────────────────────────────
    // Ilustraciones PNG con fondo transparente que "flotan" entre secciones.
    // La ilustración del Hero aparece al 50% hacia abajo del borde inferior,
    // bridging el Hero (foto real) con la sección de Cuenta Regresiva.
    // La ilustración de Familia bridgea la sección oscura con Ubicaciones.
    illustrations: {
      hero: {
        enabled: false,
        image: "",      // URL o base64 de PNG con fondo transparente
        widthPct: 85,   // ancho como % del contenedor (60–100)
        overlapPct: 50  // cuánto % de la imagen cae FUERA del Hero hacia abajo
      },
      family: {
        enabled: false,
        image: "",
        widthPct: 82,
        overlapPct: 50
      }
    }
  },

  itineraryLineArt: {
    church: `
      <svg viewBox="0 0 64 64" class="w-14 h-14 text-antique-gold mx-auto transition-transform hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <path d="M32 5v7M29 8h6"/>
        <path d="M32 12l-13 11v33h26V23L32 12z"/>
        <path d="M19 31l-11 8v16h11V31zM45 31l11 8v16H45V31z"/>
        <path d="M28 56V41a4 4 0 0 1 8 0v15"/>
        <circle cx="32" cy="24" r="3.2"/>
        <path d="M6 56h52"/>
        <path d="M32 46v10" stroke-dasharray="2 2"/>
      </svg>
    `,
    rings: `
      <svg viewBox="0 0 64 64" class="w-14 h-14 text-antique-gold mx-auto transition-transform hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="26" cy="38" rx="14" ry="14"/>
        <ellipse cx="38" cy="38" rx="14" ry="14"/>
        <path d="M38 24l-3-8h6l-3 8z"/>
        <path d="M35 16l3-4 3 4"/>
        <path d="M38 12v-3M32 14l-2-2M44 14l2-2"/>
      </svg>
    `,
    toast: `
      <svg viewBox="0 0 64 64" class="w-14 h-14 text-antique-gold mx-auto transition-transform hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <g transform="translate(4, 0)">
          <path d="M22 14c-4 0-7 3-6 10l1.5 10c.8 2.5 3 4 5.5 4h1c2.5 0 4.7-1.5 5.5-4l1.5-10c1-7-2-10-6-10h-2.5z" transform="rotate(-14 22 24)"/>
          <path d="M34 14c4 0 7 3 6 10l-1.5 10c-.8 2.5-3 4-5.5 4h-1c-2.5 0-4.7-1.5-5.5-4L26.5 24c-1-7 2-10 6-10H34z" transform="rotate(14 34 24)"/>
          <path d="M18 42l-3 12M10 54h10M38 42l3 12M36 54h10"/>
          <circle cx="28" cy="12" r="1.2" fill="currentColor"/>
          <circle cx="25" cy="17" r="0.9" fill="currentColor"/>
          <circle cx="31" cy="19" r="0.9" fill="currentColor"/>
        </g>
      </svg>
    `,
    dinner: `
      <svg viewBox="0 0 64 64" class="w-14 h-14 text-antique-gold mx-auto transition-transform hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 43h40a2 2 0 0 1 2 2v2H10v-2a2 2 0 0 1 2-2z"/>
        <path d="M16 43c0-11 7-17 16-17s16 6 16 17H16z"/>
        <circle cx="32" cy="22" r="2.5"/>
        <path d="M8 51h48"/>
        <path d="M25 35c2-2 4.5-3 7-3s5 1 7 3"/>
      </svg>
    `,
    dance: `
      <svg viewBox="0 0 64 64" class="w-14 h-14 text-antique-gold mx-auto transition-transform hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 28c4 8 8 16 14 18l18 4c2 .5 4-1 4-3l-2-2c-4-4-10-8-14-10l-12-8-8 1z"/>
        <path d="M15 28v20"/>
        <path d="M38 13v12M46 9v12M38 13l8-4"/>
        <circle cx="36" cy="25" r="2.2" fill="currentColor"/>
        <circle cx="44" cy="21" r="2.2" fill="currentColor"/>
        <path d="M50 17c1-1 2-2 3-1"/>
      </svg>
    `,
    car: `
      <svg viewBox="0 0 64 64" class="w-14 h-14 text-antique-gold mx-auto transition-transform hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 44h44l4-8-10-10H24l-8 10-6 2v6z"/>
        <path d="M24 26l-6 10h14V26h-8zM36 26v10h10l-4-10h-6z"/>
        <circle cx="20" cy="46" r="4.5"/>
        <circle cx="48" cy="46" r="4.5"/>
        <path d="M4 46h11M25 46h18M53 46h7"/>
        <path d="M25 18c4-4 12-4 17 0" stroke-dasharray="2 2"/>
      </svg>
    `,
    cake: `
      <svg viewBox="0 0 64 64" class="w-14 h-14 text-antique-gold mx-auto transition-transform hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <rect x="14" y="40" width="36" height="14" rx="2"/>
        <rect x="20" y="28" width="24" height="12" rx="2"/>
        <rect x="26" y="18" width="12" height="10" rx="2"/>
        <path d="M10 54h44"/>
        <path d="M32 12v6M30 14h4"/>
      </svg>
    `,
    photo: `
      <svg viewBox="0 0 64 64" class="w-14 h-14 text-antique-gold mx-auto transition-transform hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <rect x="12" y="20" width="40" height="30" rx="4"/>
        <path d="M24 20l3-5h10l3 5H24z"/>
        <circle cx="32" cy="35" r="8"/>
        <circle cx="44" cy="26" r="2" fill="currentColor"/>
      </svg>
    `,
    choreography: `
      <svg viewBox="0 0 64 64" class="w-14 h-14 text-antique-gold mx-auto transition-transform hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="32" cy="13" r="3"/>
        <path d="M27 10l5-3 5 3"/>
        <path d="M24 22c3-2 13-2 16 0"/>
        <path d="M25 23l-7 5-4-3M39 23l7 5 4-3"/>
        <path d="M28 23v6c0 1 1 2 4 2s4-1 4-2v-6"/>
        <path d="M28 31c-5 8-13 16-16 23h40c-3-7-11-15-16-23"/>
        <path d="M23 39c4 3 14 3 18 0"/>
        <path d="M18 47c7 4 21 4 28 0"/>
        <path d="M12 16l2 2m-2 0l2-2M50 16l2 2m-2 0l2-2"/>
        <circle cx="14" cy="28" r="1.5" fill="currentColor"/>
        <path d="M15.5 28v-8l6-2v8"/>
        <circle cx="21.5" cy="26" r="1.5" fill="currentColor"/>
      </svg>
    `,
    crown: `
      <svg viewBox="0 0 64 64" class="w-14 h-14 text-antique-gold mx-auto transition-transform hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 46h40l4-22-12 8-12-16-12 16-12-8 4 22z"/>
        <path d="M12 46v4h40v-4"/>
        <circle cx="12" cy="24" r="2" fill="currentColor"/>
        <circle cx="24" cy="32" r="1.5" fill="currentColor"/>
        <circle cx="32" cy="16" r="2.5" fill="currentColor"/>
        <circle cx="40" cy="32" r="1.5" fill="currentColor"/>
        <circle cx="52" cy="24" r="2" fill="currentColor"/>
        <path d="M22 41c5 3 15 3 20 0"/>
      </svg>
    `
  },

  resolveTypography(config) {
    const typo = config.typography || this.defaultConfig.typography;
    const fontsToLoad = new Set();
    let localFontFaces = "";

    // 1. Script Font
    let scriptFamily = "'Great Vibes', cursive";
    if (typo.customScriptFile && typo.customScriptFile.trim()) {
      localFontFaces += `
        @font-face {
          font-family: 'LocalCustomScript';
          src: url('${typo.customScriptFile}');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      scriptFamily = "'LocalCustomScript', cursive";
    } else if (typo.customScript && typo.customScript.trim()) {
      const name = typo.customScript.trim();
      scriptFamily = `'${name}', cursive`;
      fontsToLoad.add(name.replace(/\s+/g, '+'));
    } else {
      const preset = this.fontPresets.script.find(f => f.name === typo.scriptFont) || this.fontPresets.script[0];
      scriptFamily = preset.family;
      fontsToLoad.add(preset.google);
    }

    // 2. Display Font
    let displayFamily = "'Cinzel', serif";
    if (typo.customDisplayFile && typo.customDisplayFile.trim()) {
      localFontFaces += `
        @font-face {
          font-family: 'LocalCustomDisplay';
          src: url('${typo.customDisplayFile}');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      displayFamily = "'LocalCustomDisplay', serif";
    } else if (typo.customDisplay && typo.customDisplay.trim()) {
      const name = typo.customDisplay.trim();
      displayFamily = `'${name}', serif`;
      fontsToLoad.add(name.replace(/\s+/g, '+'));
    } else {
      const preset = this.fontPresets.display.find(f => f.name === typo.displayFont) || this.fontPresets.display[0];
      displayFamily = preset.family;
      fontsToLoad.add(preset.google);
    }

    // 3. Body Font
    let bodyFamily = "'Source Serif 4', serif";
    if (typo.customBodyFile && typo.customBodyFile.trim()) {
      localFontFaces += `
        @font-face {
          font-family: 'LocalCustomBody';
          src: url('${typo.customBodyFile}');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      bodyFamily = "'LocalCustomBody', serif";
    } else if (typo.customBody && typo.customBody.trim()) {
      const name = typo.customBody.trim();
      bodyFamily = `'${name}', serif`;
      fontsToLoad.add(name.replace(/\s+/g, '+'));
    } else {
      const preset = this.fontPresets.body.find(f => f.name === typo.bodyFont) || this.fontPresets.body[0];
      bodyFamily = preset.family;
      fontsToLoad.add(preset.google);
    }

    fontsToLoad.add("Great+Vibes");
    fontsToLoad.add("Alex+Brush");
    fontsToLoad.add("Allura");
    fontsToLoad.add("Pinyon+Script");
    fontsToLoad.add("Work+Sans:wght@400;500;600;700");
    fontsToLoad.add("Cinzel:wght@400;600;700");
    fontsToLoad.add("Playfair+Display:ital,wght@0,400;1,400;1,600");
    fontsToLoad.add("Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400");

    const fontFamiliesParam = Array.from(fontsToLoad).map(f => `family=${f}`).join('&');
    const googleFontsUrl = `https://fonts.googleapis.com/css2?${fontFamiliesParam}&display=swap`;

    // 4. Resolve Title Effect (Metallic Foil Gradient vs Solid Color)
    const titleEffect = typo.titleEffect || 'metallic';
    const titleMetallicPreset = typo.titleMetallicPreset || 'gold';
    const titleSolidColor = typo.titleSolidColor || '#ffffff';

    let metallicGradient = "linear-gradient(135deg, #875700 0%, #cf9c30 22%, #fff1ba 45%, #946000 68%, #e2b244 88%, #6a3e00 100%)";
    if (titleMetallicPreset === 'rosegold') {
      metallicGradient = "linear-gradient(135deg, #782635 0%, #ba586b 25%, #ffd1d9 48%, #8e3546 70%, #d47789 90%, #5e1c27 100%)";
    } else if (titleMetallicPreset === 'silver') {
      metallicGradient = "linear-gradient(135deg, #2b303a 0%, #636e7b 25%, #ffffff 48%, #3a424e 70%, #8895a5 90%, #1f242c 100%)";
    } else if (titleMetallicPreset === 'bronze') {
      metallicGradient = "linear-gradient(135deg, #5c2400 0%, #a3480a 25%, #ffd2a6 48%, #753005 70%, #b85b14 90%, #451b00 100%)";
    } else if (titleMetallicPreset === 'custom' && typo.titleCustomMetallic) {
      metallicGradient = typo.titleCustomMetallic;
    }

    const titleEffectClass = titleEffect === 'metallic' ? 'title-styled-metallic' : 'title-styled-solid';

    return { 
      googleFontsUrl, 
      scriptFamily, 
      displayFamily, 
      bodyFamily, 
      localFontFaces, 
      titleEffect, 
      titleMetallicPreset, 
      metallicGradient, 
      titleSolidColor, 
      titleEffectClass 
    };
  },

  generateHTML(config, themeName = "vino", customTheme = null, decorAssets = {}) {
    const activeTheme = themeName === "custom" && customTheme ? customTheme : (this.defaultThemes[themeName] || this.defaultThemes.vino);
    const configJson = JSON.stringify(config, null, 2);

    const typo = this.resolveTypography(config);
    const isWedding = config.eventType === 'boda';

    const brideDisplayName = isWedding ? (config.brideName || "Catalina") : (config.name || "Valentina");
    const groomDisplayName = isWedding ? (config.groomName || "Julián") : "";
    const nameConnector = isWedding ? (config.nameConnector || "&") : "";
    const fullDisplayName = isWedding && groomDisplayName ? `${brideDisplayName} ${nameConnector} ${groomDisplayName}` : brideDisplayName;
    const safeTitle = (config.eyebrow || (isWedding ? "Nuestra Boda" : "Mis XV Años")) + " · " + fullDisplayName;

    const itinerarySteps = (config.itinerary || []).filter(s => s && s.label && s.label.trim());
    const titleEffectClass = typo.titleEffectClass;

    // Monograma / Iniciales del Header (Sello Circular Superior)
    const brideInitial = (brideDisplayName || "").trim().charAt(0).toUpperCase();
    const groomInitial = (groomDisplayName || "").trim().charAt(0).toUpperCase();
    let headerMonogram = (config.monogram || config.customInitials || "").trim();
    if (!headerMonogram) {
      if (isWedding && brideInitial && groomInitial) {
        const conn = (nameConnector === '+' || nameConnector === '&') ? nameConnector : '&';
        headerMonogram = `${brideInitial} ${conn} ${groomInitial}`;
      } else {
        headerMonogram = brideInitial || (config.name || "E").trim().charAt(0).toUpperCase() || "E";
      }
    }

    // Countdown Styling
    const countStyle = config.countdownStyle || this.defaultConfig.countdownStyle || {};
    const countBgHex = countStyle.bgColor || "#121214";
    const countOpacity = typeof countStyle.opacity === 'number' ? countStyle.opacity : 0.55;
    const countTextColor = countStyle.textColor || "#ffffff";
    const countRgbaBg = hexToRgba(countBgHex, countOpacity);

    // Music Configuration
    const musicConfig = config.music || this.defaultConfig.music || {};
    const hasMusic = musicConfig.enabled !== false && musicConfig.url && musicConfig.url.trim();

    // Multi-Plano Parallax Illustrations
    const illConfig = config.illustrations || this.defaultConfig.illustrations || {};
    const illHero   = illConfig.hero   || { enabled: false, image: '', widthPct: 85, overlapPct: 50 };
    const illFamily = illConfig.family || { enabled: false, image: '', widthPct: 82, overlapPct: 50 };
    const hasIllHero   = illHero.enabled !== false && illHero.image && illHero.image.trim();
    const hasIllFamily = illFamily.enabled !== false && illFamily.image && illFamily.image.trim();
    // Compute the negative bottom offset so that `overlapPct`% of the image hangs below the section
    const illHeroOffset   = `-${Math.round((illHero.overlapPct   || 50) / 2)}%`;
    const illFamilyOffset = `-${Math.round((illFamily.overlapPct || 50) / 2)}%`;
    // Extra top-padding for the section that receives the overlap
    const countdownPaddingTop = hasIllHero   ? 'pt-[160px] sm:pt-[180px]' : 'pt-2 sm:pt-4';
    const detailsPaddingTop   = hasIllFamily ? 'pt-[140px] sm:pt-[160px]' : 'pt-20';

    // ─── Fecha Tipográfica Desglosada (modelo editorial clásico) ──────────────
    // Produce: MES / DÍA-SEMANA | DÍA-NÚMERO | A LAS HH:MM
    const MESES_ES  = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const DIAS_ES   = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
    const MESES_EN  = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
    const DIAS_EN   = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

    let dateMonthName = '', dateDayOfWeek = '', dateDayNumber = '', dateTimeLabel = '';
    try {
      const rawISO = config.eventDateISO || '';
      if (rawISO) {
        // Parse without timezone conversion to avoid off-by-one
        const [datePart, timePart = '00:00'] = rawISO.split('T');
        const [y, m, d] = datePart.split('-').map(Number);
        const [hh, mm] = (timePart.replace(/[+-]\d{2}:\d{2}$/, '')).split(':').map(Number);
        // Use UTC date to avoid daylight-saving shift
        const dateObj = new Date(Date.UTC(y, m - 1, d));
        dateMonthName  = MESES_ES[m - 1] || '';
        dateDayOfWeek  = DIAS_ES[dateObj.getUTCDay()] || '';
        dateDayNumber  = String(d);
        // Format time
        if (!isNaN(hh)) {
          const ampm = hh >= 12 ? 'PM' : 'AM';
          const h12  = hh % 12 || 12;
          dateTimeLabel = `A LAS ${h12}:${String(mm).padStart(2,'0')} ${ampm}`;
        }
      }
    } catch(e) { /* keep empty fallbacks */ }

    // Fallback to eventDateLabel if ISO parsing failed
    if (!dateMonthName) dateMonthName  = '';
    if (!dateDayNumber) dateDayNumber  = config.eventDateShort || config.eventDateLabel || '';

    return `<!DOCTYPE html>
<html lang="es" class="scroll-smooth">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" name="viewport"/>
<title>${safeTitle}</title>

<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${config.welcomeMessage || ''}">
${config.photos && config.photos.hero ? `<meta property="og:image" content="${config.photos.hero}">` : ''}

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${typo.googleFontsUrl}" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>

<!-- Tailwind CSS CDN configurado con tokens Stitch -->
<script src="https://cdn.tailwindcss.com"></script>
<script id="tailwind-config">
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "champagne-cream": "${activeTheme['cream'] || '#f7f6ec'}",
        "antique-gold": "${activeTheme['gold-500'] || '#A56E0E'}",
        "soft-gold": "${activeTheme['gold-300'] || '#EAB479'}",
        "deep-onyx": "${activeTheme['ink-900'] || '#222222'}",
        "emerald-dark": "${activeTheme['wine-900'] || '#163c2b'}",
        "emerald-deep": "${activeTheme['ink-900'] || '#0d130e'}",
        "tertiary": "#5c5c5c",
        "surface": "${activeTheme['cream'] || '#f7f6ec'}",
        "surface-container": "${activeTheme['blush-100'] || '#f5f3ef'}",
        "error": "#ba1a1a"
      },
      fontFamily: {
        "display-lg": ["var(--font-display)", "Cinzel", "serif"],
        "script-accent": ["var(--font-script)", "'Great Vibes'", "'Alex Brush'", "'Allura'", "'Pinyon Script'", "cursive"],
        "body-lg": ["var(--font-body)", "Source Serif 4", "serif"],
        "label-caps": ["'Work Sans'", "sans-serif"]
      },
      spacing: {
        "margin-desktop": "120px",
        "gutter": "24px",
        "base": "8px",
        "section-gap": "80px",
        "content-gap": "24px",
        "margin-mobile": "20px"
      }
    }
  }
};
</script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

<style>
  ${typo.localFontFaces}

  :root {
    --champagne: ${activeTheme['cream'] || '#f7f6ec'};
    --gold: ${activeTheme['gold-500'] || '#A56E0E'};
    --gold-light: ${activeTheme['gold-300'] || '#EAB479'};
    --onyx: ${activeTheme['ink-900'] || '#222222'};
    --emerald: ${activeTheme['wine-900'] || '#163c2b'};
    --emerald-dark: ${activeTheme['ink-900'] || '#0d130e'};
    --font-script: ${typo.scriptFamily};
    --font-display: ${typo.displayFamily};
    --font-body: ${typo.bodyFamily};

    /* Títulos: Metálico Foil o Color Sólido */
    --title-gradient: ${typo.metallicGradient};
    --title-solid-color: ${typo.titleSolidColor};

    /* Escala Tipográfica Controlada y Proporcional (Rango amplio 0.5 a 2.0) */
    --scale-hero: ${Math.max(0.5, Math.min(2.2, Number((config.typography && config.typography.scaleHero) || 1.0)))};
    --scale-headings: ${Math.max(0.5, Math.min(2.0, Number((config.typography && config.typography.scaleHeadings) || 1.0)))};
    --scale-body: ${Math.max(0.7, Math.min(1.6, Number((config.typography && config.typography.scaleBody) || 1.0)))};

    /* Personalización de Cristal del Contador */
    --countdown-bg: ${countRgbaBg};
    --countdown-text: ${countTextColor};
  }

  @layer base {
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: var(--champagne);
      color: var(--onyx);
      font-family: var(--font-body);
      min-height: max(884px, 100dvh);
      overflow-x: hidden;
    }
    .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
    .pt-safe { padding-top: env(safe-area-inset-top); }
  }

  .font-script {
    font-family: var(--font-script) !important;
    line-height: 1.35 !important;
    overflow: visible !important;
  }

  /* Clases con Escala Tipográfica de Alto Impacto */
  .hero-name-scaled {
    font-size: calc(3.5rem * var(--scale-hero, 1.0)) !important;
    line-height: 1.25 !important;
  }
  @media (min-width: 640px) {
    .hero-name-scaled {
      font-size: calc(4.75rem * var(--scale-hero, 1.0)) !important;
    }
  }
  .hero-solo-name-scaled {
    font-size: calc(4.25rem * var(--scale-hero, 1.0)) !important;
    line-height: 1.25 !important;
  }
  @media (min-width: 640px) {
    .hero-solo-name-scaled {
      font-size: calc(5.5rem * var(--scale-hero, 1.0)) !important;
    }
  }
  .hero-connector-scaled {
    font-size: calc(2.25rem * var(--scale-hero, 1.0)) !important;
    line-height: 1.1 !important;
  }
  .heading-script-scaled {
    font-size: calc(3rem * var(--scale-headings, 1.0)) !important;
    line-height: 1.3 !important;
  }
  @media (min-width: 640px) {
    .heading-script-scaled {
      font-size: calc(3.75rem * var(--scale-headings, 1.0)) !important;
    }
  }
  .heading-display-scaled {
    font-size: calc(1.75rem * var(--scale-headings, 1.0)) !important;
  }
  .body-scaled {
    font-size: calc(1rem * var(--scale-body, 1.0)) !important;
  }

  /* Efectos para Títulos: Degradado Metálico Foil vs Color Sólido (Anti-Clipping Avanzado) */
  .title-styled-metallic {
    background: var(--title-gradient) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    color: transparent !important;
    display: inline-block;
    /* Generoso padding vertical y horizontal para que los trazos, remates, ascendentes y descendentes NUNCA se corten */
    padding-top: 0.2em !important;
    padding-bottom: 0.32em !important;
    padding-left: 0.15em !important;
    padding-right: 0.25em !important;
    /* Márgenes compensatorios para mantener alineación exacta */
    margin-top: -0.15em !important;
    margin-bottom: -0.22em !important;
    margin-left: -0.1em !important;
    margin-right: -0.15em !important;
    line-height: 1.35 !important;
    overflow: visible !important;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.75)) drop-shadow(0 4px 14px rgba(0, 0, 0, 0.45));
    -webkit-filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.75)) drop-shadow(0 4px 14px rgba(0, 0, 0, 0.45));
  }

  .title-styled-solid {
    color: var(--title-solid-color) !important;
    display: inline-block;
    padding-top: 0.12em !important;
    padding-bottom: 0.2em !important;
    padding-left: 0.1em !important;
    padding-right: 0.15em !important;
    line-height: 1.35 !important;
    overflow: visible !important;
  }

  /* ==================== SISTEMA COHERENTE DE BOTONES DE LUJO ==================== */
  .btn-luxury-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.375rem;
    border-radius: 9999px;
    background-color: var(--gold);
    color: #ffffff !important;
    font-family: 'Work Sans', sans-serif;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    box-shadow: 0 4px 14px rgba(165, 110, 14, 0.25);
    border: 1px solid var(--gold);
    transition: all 0.25s ease;
    cursor: pointer;
    text-decoration: none;
    line-height: 1.2;
  }

  .btn-luxury-primary:hover {
    background-color: #8c5d0b;
    border-color: #8c5d0b;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(165, 110, 14, 0.35);
  }

  .btn-luxury-primary:active {
    transform: translateY(0);
  }

  .btn-luxury-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.375rem;
    border-radius: 9999px;
    background-color: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: var(--gold) !important;
    border: 1px solid var(--gold);
    font-family: 'Work Sans', sans-serif;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.25s ease;
    cursor: pointer;
    text-decoration: none;
    line-height: 1.2;
  }

  .btn-luxury-secondary:hover {
    background-color: var(--gold);
    color: #ffffff !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(165, 110, 14, 0.25);
  }

  .btn-luxury-secondary:active {
    transform: translateY(0);
  }

  /* Variante secundaria para fondos oscuros (Emerald / Negro) */
  .btn-luxury-secondary-dark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.375rem;
    border-radius: 9999px;
    background-color: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #f7f6ec !important;
    border: 1px solid var(--gold);
    font-family: 'Work Sans', sans-serif;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.25s ease;
    cursor: pointer;
    text-decoration: none;
    line-height: 1.2;
  }

  .btn-luxury-secondary-dark:hover {
    background-color: var(--gold);
    color: #ffffff !important;
    transform: translateY(-1px);
  }

  /* Estilo Editorial de Alta Gama para el Contador */
  .frosted-glass-card {
    background: transparent;
    color: var(--countdown-text);
    border-top: 1px solid rgba(165, 110, 14, 0.35);
    border-bottom: 1px solid rgba(165, 110, 14, 0.35);
  }

  .frosted-glass-pill {
    background: transparent;
    color: var(--countdown-text);
  }

  /* Timeline vertical progress line */
  .timeline-track-line {
    position: absolute;
    top: 24px;
    bottom: 24px;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background: linear-gradient(to bottom, rgba(165,110,14,0.15) 0%, var(--gold) 15%, var(--gold) 85%, rgba(165,110,14,0.15) 100%);
  }

  /* Reproductor Discreto en Parte Inferior */
  .eq-bar {
    height: 3px;
    transition: height 180ms ease;
  }
  #musicPlayer.is-playing .eq-bar {
    animation: eqBounce 750ms ease-in-out infinite alternate;
  }
  #musicPlayer.is-playing .eq-bar:nth-child(1) { animation-delay: 0ms; }
  #musicPlayer.is-playing .eq-bar:nth-child(2) { animation-delay: 200ms; }
  #musicPlayer.is-playing .eq-bar:nth-child(3) { animation-delay: 400ms; }

  @keyframes eqBounce {
    0% { height: 3px; }
    100% { height: 14px; }
  }
</style>
</head>

<body class="bg-champagne-cream text-deep-onyx font-body-lg text-lg selection:bg-antique-gold/20">

<!-- ==================== HEADER SUPERIOR ==================== -->
<header class="fixed top-0 w-full z-50 bg-champagne-cream/85 backdrop-blur-xl border-b border-antique-gold/20 pt-safe transition-all duration-300">
  <div class="h-16 px-margin-mobile flex items-center justify-between max-w-4xl mx-auto">
    <div class="flex items-center gap-3">
      <div id="headerMonogram" class="min-w-[34px] px-2 h-[34px] rounded-full border border-antique-gold flex items-center justify-center text-antique-gold font-script ${headerMonogram.length > 2 ? 'text-sm sm:text-base tracking-normal' : 'text-lg tracking-wide'} font-normal shadow-sm bg-white/20" style="font-family: var(--font-script);">
        ${headerMonogram}
      </div>
      <span class="font-display-lg text-base tracking-widest text-antique-gold uppercase" id="headerTitle">
        ${config.eyebrow || (isWedding ? 'Nuestra Boda' : 'Mis XV Años')}
      </span>
    </div>
    
    <div class="flex items-center gap-2">
      <a href="#rsvp" class="btn-luxury-secondary text-[10px] px-4 py-1.5 shadow-sm">
        RSVP
      </a>
    </div>
  </div>
</header>

<!-- ==================== CONTENIDO PRINCIPAL ==================== -->
<main class="relative pt-16 min-h-screen pb-24">
<div class="flex flex-col w-full overflow-hidden relative">

  <!-- ==================== 1. EVENTO Y PROTAGONISTA(S) ==================== -->
  <!-- overflow-visible so the bridge illustration can overlap the next section -->
  <section id="hero" class="relative min-h-[68vh] sm:min-h-[72vh] flex flex-col items-center justify-center px-margin-mobile text-center pt-10 pb-6" style="overflow: visible;">
    <!-- Clip mask so the photo + overlays don't leak outside the section -->
    <div class="absolute inset-0 overflow-hidden z-0 rounded-none">
      <!-- CAPA 1: Fondo Foto (Parallax Rápido — se mueve 45% al hacer scroll) -->
      <div id="parallaxBgHero" class="absolute inset-0 scale-[1.55] origin-top will-change-transform">
        <div id="heroBgImg" class="w-full h-full bg-cover bg-center transition-all duration-700" style="background-image: url('${(config.photos && config.photos.hero) || ''}');"></div>
      </div>
      <!-- Overlay Multicapa de Contraste para Máxima Legibilidad -->
      <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-champagne-cream"></div>
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/40 via-transparent to-transparent"></div>
    </div>

    <!-- CAPA 3: Contenido (scroll normal, z-10) -->
    <div class="relative z-10 flex flex-col items-center gap-4 max-w-lg mx-auto gsap-scale-up w-full mt-2">
      
      <!-- VIP Guest Banner -->
      <div id="vipBanner" class="hidden flex-col items-center gap-0.5 px-6 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/30 shadow-lg mb-1">
        <span class="font-label-caps text-[9px] uppercase tracking-[0.3em] text-antique-gold font-semibold">Invitación Especial Para</span>
        <span id="vipGuestName" class="font-display-lg text-base text-white font-bold tracking-wide">Familia Invitada</span>
        <span id="vipGuestTickets" class="font-label-caps text-[10px] text-white/80 font-medium">2 Pases Reservados</span>
      </div>

      <!-- Eyebrow: NUESTRA BODA / MIS XV AÑOS -->
      <p id="heroEyebrow" class="font-label-caps text-xs sm:text-sm text-[#f7f6ec] tracking-[0.4em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] gsap-eyebrow font-semibold">
        ${config.eyebrow || (isWedding ? 'Nuestra Boda' : 'Mis XV Años')}
      </p>

      <!-- Nombres con Efecto de Títulos (Metálico o Sólido) -->
      ${isWedding && groomDisplayName ? `
      <div class="flex flex-col items-center my-0.5 gsap-title overflow-visible">
        <h1 class="font-script font-normal overflow-visible hero-name-scaled ${titleEffectClass}" id="heroBrideName" style="font-family: var(--font-script);">
          ${brideDisplayName}
        </h1>
        <span class="font-script text-white/95 my-0 font-normal leading-normal drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] select-none overflow-visible hero-connector-scaled" id="heroNameConnector" style="font-family: var(--font-script);">
          ${nameConnector}
        </span>
        <h1 class="font-script font-normal overflow-visible hero-name-scaled ${titleEffectClass}" id="heroGroomName" style="font-family: var(--font-script);">
          ${groomDisplayName}
        </h1>
      </div>` : `
      <h1 id="heroName" class="font-script font-normal my-2 gsap-title overflow-visible hero-solo-name-scaled ${titleEffectClass}" style="font-family: var(--font-script);">
        ${brideDisplayName}
      </h1>`}

      <!-- Frase / Cita de Bienvenida -->
      <div id="welcomeQuoteWrap" class="mt-1 max-w-[90%] mx-auto ${config.quote ? '' : 'hidden'}">
        <p id="welcomeQuote" class="font-script text-2xl sm:text-3xl md:text-4xl italic leading-relaxed text-[#f7f6ec] drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] font-normal">
          &ldquo;${config.quote || ''}&rdquo;
        </p>
      </div>

      <!-- Mensaje de Bienvenida -->
      <div id="welcomeMessageWrap" class="max-w-[460px] mx-auto mt-1 ${config.welcomeMessage ? '' : 'hidden'}">
        <p id="welcomeMessage" class="font-body-lg text-sm sm:text-base text-white/95 leading-relaxed font-light drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
          ${config.welcomeMessage || ''}
        </p>
      </div>

    </div>

    <!-- CAPA 2: Ilustración Puente Hero → Countdown (Parallax Medio) -->
    <!-- Se posiciona al borde inferior del Hero, superponiéndose con la sección siguiente -->
    <div id="illustrationBridgeHero"
      class="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none will-change-transform ${hasIllHero ? '' : 'hidden'}"
      style="bottom: ${illHeroOffset}; width: ${illHero.widthPct || 85}%; max-width: 420px;">
      <img src="${illHero.image || ''}" alt="Ilustración decorativa" class="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.35)]" loading="eager" />
    </div>
  </section>


  <!-- ==================== 1.1 HISTORIA DE AMOR / SEMBLANZA (OPCIONAL) ==================== -->
  <section id="storySection" class="py-10 px-margin-mobile text-center max-w-xl mx-auto ${(config.story && config.story.enabled !== false && (config.story.title || config.story.text)) ? '' : 'hidden'}">
    <div class="max-w-md mx-auto gsap-fade-up">
      <p class="font-label-caps text-xs text-antique-gold tracking-[0.3em] uppercase mb-2" id="storySubtitle">${(config.story && config.story.subtitle) || ''}</p>
      <h2 class="font-display-lg text-2xl sm:text-3xl text-deep-onyx mb-4" id="storyTitle">${(config.story && config.story.title) || 'Nuestra Historia'}</h2>
      <p class="font-body-lg text-sm sm:text-base text-deep-onyx/85 leading-relaxed" id="storyText">${(config.story && config.story.text) || ''}</p>
    </div>
  </section>

  <!-- ==================== 2. CUENTA REGRESIVA & CALENDARIO ==================== -->
  <!-- Top padding increases when an illustration bridge is active to receive the overlap -->
  <section id="countdownSection" class="${countdownPaddingTop} pb-20 px-margin-mobile text-center relative max-w-lg mx-auto gsap-fade-up">

    <!-- ╔══════════════════════════════════════════╗ -->
    <!-- ║  FECHA TIPOGRÁFICA ESTILO EDITORIAL      ║ -->
    <!-- ║        MAY                               ║ -->
    <!-- ║  SATURDAY  |  23  |  AT 4 PM             ║ -->
    <!-- ╚══════════════════════════════════════════╝ -->
    <div id="heroDateBlock" class="w-full max-w-[380px] mx-auto mt-4 sm:mt-6 mb-6 py-1 gsap-fade-up select-none">

      <!-- Nombre del Mes — centrado, espaciado clásico -->
      <p id="heroDateMonth" class="font-label-caps text-[11px] sm:text-[12px] tracking-[0.55em] uppercase font-semibold text-antique-gold mb-3 text-center">
        ${dateMonthName || (config.eventDateLabel || config.eventDateShort || '').split(' ').slice(-1)[0] || 'MARZO'}
      </p>

      <!-- Fila Principal: DÍA-SEMANA | NÚMERO-GRANDE | HORA -->
      <div class="flex items-center justify-center gap-0 w-full">

        <!-- Columna Izquierda: Día de la Semana -->
        <div class="flex-1 flex justify-end pr-4 sm:pr-5">
          <p id="heroDateWeekday" class="font-label-caps text-[10.5px] sm:text-[11.5px] tracking-[0.32em] uppercase font-medium text-deep-onyx/75 text-right leading-tight">
            ${dateDayOfWeek || 'VIERNES'}
          </p>
        </div>

        <!-- Separador vertical izquierdo -->
        <div class="w-px h-9 bg-antique-gold/50 flex-shrink-0"></div>

        <!-- Centro: Número del Día — grande y protagónico -->
        <div class="px-5 sm:px-6 flex-shrink-0">
          <span id="heroDateDay" class="font-display-lg text-5xl sm:text-6xl md:text-7xl font-normal leading-none tracking-tight text-deep-onyx tabular-nums drop-shadow-sm">
            ${dateDayNumber || '20'}
          </span>
        </div>

        <!-- Separador vertical derecho -->
        <div class="w-px h-9 bg-antique-gold/50 flex-shrink-0"></div>

        <!-- Columna Derecha: Hora -->
        <div class="flex-1 flex justify-start pl-4 sm:pl-5">
          <p id="heroDateTime" class="font-label-caps text-[10.5px] sm:text-[11.5px] tracking-[0.32em] uppercase font-medium text-deep-onyx/75 text-left leading-tight">
            ${dateTimeLabel || (config.ceremony && config.ceremony.time ? config.ceremony.time : '4:00 PM')}
          </p>
        </div>

      </div>
    </div>

    <!-- Divisor Delicado Editorial con Rombo Dorado -->
    <div class="flex items-center justify-center gap-3 w-full max-w-[280px] mx-auto my-7">
      <span class="flex-1 h-px bg-gradient-to-r from-transparent via-antique-gold/40 to-transparent"></span>
      <span class="text-antique-gold text-[10px] select-none opacity-80">✦</span>
      <span class="flex-1 h-px bg-gradient-to-l from-transparent via-antique-gold/40 to-transparent"></span>
    </div>

    <!-- ╔══════════════════════════════════════════╗ -->
    <!-- ║  CUENTA REGRESIVA EDITORIAL DE ALTA GAMA ║ -->
    <!-- ╚══════════════════════════════════════════╝ -->
    <div id="countdownWrapper" class="flex flex-col items-center w-full max-w-[420px] mx-auto select-none">
      
      <!-- Fila de Unidades Tipográficas Puras (Días · Horas · Minutos · Segundos) -->
      <div class="frosted-glass-card w-full py-4 px-1 sm:px-4 text-center">
        <div class="flex items-center justify-around w-full">
          
          <!-- Días -->
          <div class="flex-1 flex flex-col items-center">
            <span id="days" class="font-display-lg text-3xl sm:text-4xl md:text-5xl font-light tabular-nums leading-none tracking-tight text-deep-onyx" style="color: var(--countdown-text);">00</span>
            <span class="font-label-caps text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.25em] mt-2.5 font-medium text-antique-gold">Días</span>
          </div>

          <!-- Divisor Vertical Fino -->
          <div class="w-px h-9 bg-antique-gold/40 flex-shrink-0"></div>

          <!-- Horas -->
          <div class="flex-1 flex flex-col items-center">
            <span id="hours" class="font-display-lg text-3xl sm:text-4xl md:text-5xl font-light tabular-nums leading-none tracking-tight text-deep-onyx" style="color: var(--countdown-text);">00</span>
            <span class="font-label-caps text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.25em] mt-2.5 font-medium text-antique-gold">Horas</span>
          </div>

          <!-- Divisor Vertical Fino -->
          <div class="w-px h-9 bg-antique-gold/40 flex-shrink-0"></div>

          <!-- Minutos -->
          <div class="flex-1 flex flex-col items-center">
            <span id="minutes" class="font-display-lg text-3xl sm:text-4xl md:text-5xl font-light tabular-nums leading-none tracking-tight text-deep-onyx" style="color: var(--countdown-text);">00</span>
            <span class="font-label-caps text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.25em] mt-2.5 font-medium text-antique-gold">Minutos</span>
          </div>

          <!-- Divisor Vertical Fino -->
          <div class="w-px h-9 bg-antique-gold/40 flex-shrink-0"></div>

          <!-- Segundos -->
          <div class="flex-1 flex flex-col items-center">
            <span id="seconds" class="font-display-lg text-3xl sm:text-4xl md:text-5xl font-light tabular-nums leading-none tracking-tight text-deep-onyx" style="color: var(--countdown-text);">00</span>
            <span class="font-label-caps text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.25em] mt-2.5 font-medium text-antique-gold">Segundos</span>
          </div>

        </div>
      </div>

      <!-- Frase Emotiva Tipográfica y Caligráfica -->
      <div id="countdownPhraseWrap" class="mt-7 mb-2 text-center max-w-sm mx-auto ${(config.countdownPhrase || isWedding) ? '' : 'hidden'}">
        <div class="flex items-center justify-center gap-3">
          <span class="w-6 h-px bg-antique-gold/40 flex-shrink-0"></span>
          <p id="countdownPhrase" class="font-script text-2xl sm:text-3xl text-deep-onyx/85 italic leading-none font-normal" style="font-family: var(--font-script);">
            &ldquo;${config.countdownPhrase || (isWedding ? 'Para casarme con el amor de mi vida' : 'Para mi gran día')}&rdquo;
          </p>
          <span class="w-6 h-px bg-antique-gold/40 flex-shrink-0"></span>
        </div>
      </div>

      <!-- Botones de Calendario Ligeros y Refinados -->
      <div class="flex flex-wrap justify-center items-center gap-3 mt-7">
        <a id="btnGoogleCalendar" href="#" target="_blank" rel="noopener noreferrer" class="btn-luxury-secondary text-[11px] px-5 py-2">
          <span class="material-symbols-outlined text-[15px]">calendar_add_on</span>
          Google Calendar
        </a>
        <button type="button" id="btnCalendar" class="btn-luxury-secondary text-[11px] px-5 py-2">
          <span class="material-symbols-outlined text-[15px]">download</span>
          Apple / .ics
        </button>
      </div>

    </div>
  </section>


  <!-- Divider Line -->
  <div class="flex justify-center py-4 gsap-fade-up">
    <div class="w-24 h-[1px] bg-antique-gold/50"></div>
  </div>

  <!-- ==================== 3. FAMILIA & PADRINOS ==================== -->
  <!-- overflow-visible so the bridge illustration can overlap the next section -->
  <section id="family" class="py-20 px-margin-mobile bg-emerald-dark text-center border-y border-antique-gold/30 relative" style="overflow: visible;">
    <!-- Inner clip wrapper so the bg texture stays within the section -->
    ${(() => {
      const bg = getSectionBg(config, 'family', 0.35);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 overflow-hidden z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="max-w-2xl mx-auto relative z-10">
      <h2 id="blessingHeading" class="font-display-lg text-2xl sm:text-3xl text-[#f7f6ec] mb-14 px-4 gsap-title">
        ${config.blessingIntro || 'Con la bendición de nuestros padres'}
      </h2>

      <!-- Padres Boda (Dual) -->
      <div id="parentsWeddingGrid" class="${isWedding ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-2 gap-10 text-center gsap-stagger-container">
        <!-- Padres de la Novia -->
        <div id="brideParentsBlock" class="gsap-stagger-item ${(config.brideMother || config.brideFather) ? '' : 'hidden'}">
          <p class="font-label-caps text-[11px] text-antique-gold tracking-[0.3em] uppercase mb-4 gsap-eyebrow">Padres de la Novia</p>
          <div class="flex flex-col items-center">
            <p class="font-display-lg text-xl sm:text-2xl text-[#f7f6ec]">${config.brideFather || ''}</p>
            ${(config.brideFather && config.brideMother) ? `
            <span class="font-script text-2xl sm:text-3xl text-antique-gold my-[-2px] leading-none select-none" style="font-family: var(--font-script);">&amp;</span>
            ` : ''}
            <p class="font-display-lg text-xl sm:text-2xl text-[#f7f6ec]">${config.brideMother || ''}</p>
          </div>
        </div>

        <!-- Padres del Novio -->
        <div id="groomParentsBlock" class="gsap-stagger-item ${(config.groomMother || config.groomFather) ? '' : 'hidden'}">
          <p class="font-label-caps text-[11px] text-antique-gold tracking-[0.3em] uppercase mb-4 gsap-eyebrow">Padres del Novio</p>
          <div class="flex flex-col items-center">
            <p class="font-display-lg text-xl sm:text-2xl text-[#f7f6ec]">${config.groomFather || ''}</p>
            ${(config.groomFather && config.groomMother) ? `
            <span class="font-script text-2xl sm:text-3xl text-antique-gold my-[-2px] leading-none select-none" style="font-family: var(--font-script);">&amp;</span>
            ` : ''}
            <p class="font-display-lg text-xl sm:text-2xl text-[#f7f6ec]">${config.groomMother || ''}</p>
          </div>
        </div>
      </div>

      <!-- Padres XV (Single) -->
      <div id="parentsXvGrid" class="${!isWedding && (config.mother || config.father) ? 'block' : 'hidden'} gsap-stagger-item">
        <p class="font-label-caps text-[11px] text-antique-gold tracking-[0.3em] uppercase mb-4 gsap-eyebrow">Mis Padres</p>
        <div class="flex flex-col items-center">
          <p class="font-display-lg text-xl sm:text-2xl text-[#f7f6ec]">${config.father || ''}</p>
          ${(config.father && config.mother) ? `
          <span class="font-script text-2xl sm:text-3xl text-antique-gold my-[-2px] leading-none select-none" style="font-family: var(--font-script);">&amp;</span>
          ` : ''}
          <p class="font-display-lg text-xl sm:text-2xl text-[#f7f6ec]">${config.mother || ''}</p>
        </div>
      </div>

      <!-- Padrinos -->
      <div id="godparentsBlock" class="mt-12 gsap-stagger-item ${(config.godmother || config.godfather) ? '' : 'hidden'}">
        <p class="font-label-caps text-[11px] text-antique-gold tracking-[0.3em] uppercase mb-4 gsap-eyebrow" id="lblGodparentsSection">
          ${isWedding ? 'Padrinos de Velación' : 'Mis Padrinos'}
        </p>
        ${(config.godfather && config.godmother) ? `
        <div class="flex flex-col items-center">
          <p class="font-display-lg text-xl sm:text-2xl text-[#f7f6ec]">${config.godfather}</p>
          <span class="font-script text-2xl sm:text-3xl text-antique-gold my-[-2px] leading-none select-none" style="font-family: var(--font-script);">&amp;</span>
          <p class="font-display-lg text-xl sm:text-2xl text-[#f7f6ec]">${config.godmother}</p>
        </div>
        ` : `
        <p class="font-display-lg text-xl sm:text-2xl text-[#f7f6ec]">
          ${config.godfather || config.godmother || ''}
        </p>
        `}
      </div>

      <!-- Corte de Honor -->
      <div id="courtBlock" class="mt-10 gsap-stagger-item ${config.court && config.court.length ? '' : 'hidden'}">
        <p class="font-label-caps text-[11px] text-antique-gold tracking-[0.3em] uppercase mb-3 gsap-eyebrow" id="lblCourtSection">
          ${isWedding ? 'Damas de Honor & Best Men' : 'Corte de Honor'}
        </p>
        <div class="flex flex-wrap justify-center gap-2 text-sm text-[#f7f6ec]/90 max-w-lg mx-auto">
          ${(config.court || []).map(m => `<span>${m}</span>`).join('<span class="text-antique-gold">·</span>')}
        </div>
      </div>
    </div>

    <!-- CAPA 2: Ilustración Puente Familia → Ubicaciones (Parallax Medio) -->
    <div id="illustrationBridgeFamily"
      class="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none will-change-transform ${hasIllFamily ? '' : 'hidden'}"
      style="bottom: ${illFamilyOffset}; width: ${illFamily.widthPct || 82}%; max-width: 400px;">
      <img src="${illFamily.image || ''}" alt="Ilustración decorativa" class="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.35)]" loading="lazy" />
    </div>
  </section>

  <!-- ==================== 4. UBICACIONES (DÓNDE & CUÁNDO) ==================== -->
  <!-- Top padding increases when a family illustration bridge is active -->
  <section id="details" class="${detailsPaddingTop} pb-20 px-margin-mobile text-center max-w-3xl mx-auto relative overflow-hidden">
    ${(() => {
      const bg = getSectionBg(config, 'details', 0.30);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="relative z-10 w-full">
      <h2 class="font-display-lg text-3xl sm:text-4xl text-deep-onyx mb-16 gsap-title">Dónde y Cuándo</h2>

    <div class="space-y-16 max-w-lg mx-auto gsap-stagger-container">
      
      <!-- Ceremonia -->
      <div id="ceremonyCard" class="relative bg-white/50 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgba(165,110,14,0.08)] border border-antique-gold/50 gsap-stagger-item ${(config.ceremony && (config.ceremony.venue || config.ceremony.address)) ? '' : 'hidden'}">
        <div class="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-champagne-cream rounded-full flex items-center justify-center border border-antique-gold shadow-md">
          <span class="material-symbols-outlined text-antique-gold text-2xl">church</span>
        </div>
        <h3 class="font-display-lg text-2xl sm:text-3xl text-deep-onyx mb-2 mt-6 gsap-title">Ceremonia Religiosa</h3>
        <p class="font-label-caps text-[13px] text-antique-gold mb-4 tracking-widest">${(config.ceremony && config.ceremony.time) || ''}</p>
        <p class="font-body-lg text-deep-onyx font-semibold mb-1">${(config.ceremony && config.ceremony.venue) || ''}</p>
        <p class="font-body-lg text-sm text-tertiary mb-8">${(config.ceremony && config.ceremony.address) || ''}</p>
        
        <div class="flex flex-wrap justify-center items-center gap-3">
          <a id="ceremonyMap" class="btn-luxury-primary ${(config.ceremony && config.ceremony.mapsUrl) ? '' : 'hidden'}" href="${(config.ceremony && config.ceremony.mapsUrl) || '#'}" target="_blank" rel="noopener noreferrer">
            <span class="material-symbols-outlined text-[16px]">map</span>
            Google Maps
          </a>
          <a id="ceremonyWaze" class="btn-luxury-secondary ${(config.ceremony && config.ceremony.wazeUrl) ? '' : 'hidden'}" href="${(config.ceremony && config.ceremony.wazeUrl) || '#'}" target="_blank" rel="noopener noreferrer">
            <span class="material-symbols-outlined text-[16px]">navigation</span>
            Waze
          </a>
        </div>
      </div>

      <!-- Recepción -->
      <div id="receptionCard" class="relative bg-white/50 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgba(165,110,14,0.08)] border border-antique-gold/50 gsap-stagger-item ${(config.reception && (config.reception.venue || config.reception.address)) ? '' : 'hidden'}">
        <div class="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-champagne-cream rounded-full flex items-center justify-center border border-antique-gold shadow-md">
          <span class="material-symbols-outlined text-antique-gold text-2xl">celebration</span>
        </div>
        <h3 class="font-display-lg text-2xl sm:text-3xl text-deep-onyx mb-2 mt-6 gsap-title">Recepción</h3>
        <p class="font-label-caps text-[13px] text-antique-gold mb-4 tracking-widest">${(config.reception && config.reception.time) || ''}</p>
        <p class="font-body-lg text-deep-onyx font-semibold mb-1">${(config.reception && config.reception.venue) || ''}</p>
        <p class="font-body-lg text-sm text-tertiary mb-8">${(config.reception && config.reception.address) || ''}</p>

        <div class="flex flex-wrap justify-center items-center gap-3">
          <a id="receptionMap" class="btn-luxury-primary ${(config.reception && config.reception.mapsUrl) ? '' : 'hidden'}" href="${(config.reception && config.reception.mapsUrl) || '#'}" target="_blank" rel="noopener noreferrer">
            <span class="material-symbols-outlined text-[16px]">map</span>
            Google Maps
          </a>
          <a id="receptionWaze" class="btn-luxury-secondary ${(config.reception && config.reception.wazeUrl) ? '' : 'hidden'}" href="${(config.reception && config.reception.wazeUrl) || '#'}" target="_blank" rel="noopener noreferrer">
            <span class="material-symbols-outlined text-[16px]">navigation</span>
            Waze
          </a>
        </div>
      </div>

    </div>
    </div>
  </section>

  <!-- ==================== 5. DRESS CODE ==================== -->
  <section id="dresscode" class="py-20 px-margin-mobile bg-emerald-deep text-center border-y border-antique-gold/30 relative overflow-hidden ${(config.dressCode && (config.dressCode.title || config.dressCode.description)) ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'dressCode', 0.25);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="max-w-xl mx-auto relative z-10">
      <span class="material-symbols-outlined text-antique-gold text-[44px] mb-6 font-light gsap-fade-up">checkroom</span>
      <h2 id="dressTitle" class="font-display-lg text-3xl sm:text-4xl text-[#f7f6ec] mb-4 gsap-title">${(config.dressCode && config.dressCode.title) || 'Código de Vestimenta'}</h2>
      <p class="font-label-caps text-[13px] text-antique-gold tracking-[0.3em] uppercase mb-6 gsap-eyebrow">${(config.dressCode && config.dressCode.title) || 'Formal'}</p>
      <p id="dressDesc" class="font-body-lg text-[#f7f6ec]/85 mb-8 max-w-sm mx-auto leading-relaxed text-sm sm:text-base gsap-fade-up">${(config.dressCode && config.dressCode.description) || ''}</p>
      
      <div id="dressPaletteWrapper" class="flex flex-wrap justify-center items-center gap-4 sm:gap-6 gsap-fade-up ${(config.dressCode && config.dressCode.colorsEnabled !== false && config.dressCode.colorPalette && config.dressCode.colorPalette.length) ? '' : 'hidden'}">
        ${((config.dressCode && config.dressCode.colorPalette) || []).map(c => `
          <div class="flex flex-col items-center gap-2">
            <div class="w-10 h-10 rounded-full border border-antique-gold/60 shadow-md transition-transform hover:scale-110" style="background-color: ${c.hex};"></div>
            <span class="font-label-caps text-[9px] text-[#f7f6ec]/75 uppercase tracking-wider">${c.name}</span>
          </div>
        `).join('')}

        <div class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-error/50 shadow-md relative">
            <div class="absolute inset-0 border-2 border-error rounded-full opacity-60"></div>
            <div class="w-full h-[2px] bg-error absolute rotate-45 opacity-60"></div>
          </div>
          <span class="font-label-caps text-[9px] text-error uppercase tracking-wider">Blanco / Perla</span>
        </div>
      </div>

      <p class="text-xs text-[#f7f6ec]/60 italic mt-6 ${(config.dressCode && config.dressCode.reservedColorsNote) ? '' : 'hidden'}">
        ${(config.dressCode && config.dressCode.reservedColorsNote) || ''}
      </p>
    </div>
  </section>

  <!-- ==================== 6. GALERÍA FOTOGRÁFICA (SIN SEPARADORES & SIN RECORTES) ==================== -->
  <section id="galeria" class="py-16 px-margin-mobile max-w-xl mx-auto relative overflow-hidden ${(config.photos && config.photos.gallery && config.photos.gallery.length) ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'gallery', 0.25);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="relative z-10 w-full">
      <div class="text-center mb-8">
        <p class="font-label-caps text-xs text-antique-gold tracking-[0.3em] uppercase mb-2">Momentos Inolvidables</p>
        <h2 class="font-display-lg text-3xl text-deep-onyx">Galería de Recuerdos</h2>
      </div>
      
      <!-- Galería Continua Sin Separadores y Sin Recorte de Imágenes -->
      <div class="w-full rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-antique-gold/30 flex flex-col gap-0" id="galleryGrid">
        ${((config.photos && config.photos.gallery) || []).map((url, i) => url ? `
          <div class="w-full bg-black/5 overflow-hidden">
            <img src="${url}" alt="Foto ${i+1}" loading="lazy" class="w-full h-auto block object-contain transition-transform duration-700 hover:scale-[1.01]"/>
          </div>
        ` : '').join('')}
      </div>
    </div>
  </section>

  <!-- ==================== 7. MESA DE REGALOS & TRANSFERENCIA ==================== -->
  <section id="giftregistry" class="py-20 px-margin-mobile text-center max-w-xl mx-auto relative overflow-hidden ${config.giftRegistry && config.giftRegistry.enabled !== false ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'giftRegistry', 0.25);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="relative z-10 w-full">
      <h2 class="font-display-lg text-3xl text-deep-onyx mb-4 gsap-title">Mesa de Regalos</h2>
      <p id="giftIntro" class="font-body-lg text-tertiary mb-10 max-w-md mx-auto leading-relaxed text-sm sm:text-base gsap-fade-up">
        ${(config.giftRegistry && config.giftRegistry.intro) || 'El mejor regalo es tu presencia, pero si deseas tener un detalle con nosotros, te sugerimos nuestras opciones:'}
      </p>

      <!-- Tiendas -->
      <div class="flex flex-col gap-4 max-w-sm mx-auto gsap-stagger-container mb-8">
        ${((config.giftRegistry && config.giftRegistry.stores) || []).map(store => `
          <a class="bg-white/60 backdrop-blur-sm border border-antique-gold/40 p-5 flex items-center justify-between shadow-sm hover:bg-white/90 hover:shadow-md transition-all gsap-stagger-item rounded-2xl" href="${store.url || '#'}" target="_blank" rel="noopener noreferrer">
            <span class="font-label-caps text-xs text-deep-onyx uppercase tracking-widest font-semibold">${store.name}</span>
            <span class="flex items-center gap-1 font-body-lg text-sm text-antique-gold font-medium">
              ${store.code ? `<span>${store.code}</span>` : ''}
              <span class="material-symbols-outlined text-[18px]">open_in_new</span>
            </span>
          </a>
        `).join('')}
      </div>

      <!-- Datos Bancarios (CLABE) -->
      <div id="bankInfoCard" class="bg-white/70 backdrop-blur-sm border border-antique-gold/50 p-6 rounded-2xl max-w-sm mx-auto text-left shadow-sm ${(config.giftRegistry && config.giftRegistry.bank && config.giftRegistry.bank.clabe) ? '' : 'hidden'}">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-antique-gold text-[20px]">account_balance</span>
          <span class="font-label-caps text-xs text-antique-gold uppercase tracking-wider font-semibold">Transferencia Bancaria</span>
        </div>
        <p id="giftBankName" class="font-body-lg text-sm text-deep-onyx font-bold">${(config.giftRegistry && config.giftRegistry.bank && config.giftRegistry.bank.bankName) || 'Banco'}</p>
        <p id="giftBankHolder" class="font-body-lg text-xs text-tertiary mb-3">${(config.giftRegistry && config.giftRegistry.bank && config.giftRegistry.bank.holder) ? `Titular: ${config.giftRegistry.bank.holder}` : ''}</p>
        
        <div class="flex items-center justify-between gap-2 p-2.5 bg-champagne-cream rounded-full border border-antique-gold/30 px-4">
          <span id="clabeText" class="font-mono text-xs text-deep-onyx tracking-wider select-all">${(config.giftRegistry && config.giftRegistry.bank && config.giftRegistry.bank.clabe) || ''}</span>
          <button type="button" id="btnCopyClabe" class="btn-luxury-primary text-[10px] px-3.5 py-1 shadow-sm">
            Copiar
          </button>
        </div>
      </div>

      <p id="giftEnvelopeNote" class="font-body-lg text-xs text-tertiary/80 italic mt-6 ${(config.giftRegistry && config.giftRegistry.envelopeNote) ? '' : 'hidden'}">
        ${(config.giftRegistry && config.giftRegistry.envelopeNote) || ''}
      </p>
    </div>
  </section>

  <!-- ==================== 8. PROGRAMA / ITINERARIO ==================== -->
  <section id="itinerario" class="py-20 px-margin-mobile text-center max-w-2xl mx-auto relative overflow-hidden ${itinerarySteps.length ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'itinerary', 0.30);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="relative z-10 w-full">
      <div class="mb-14 gsap-fade-up overflow-visible">
        <h2 class="font-script font-normal mb-2 overflow-visible heading-script-scaled ${titleEffectClass}">Programa</h2>
        <p class="font-label-caps text-xs text-tertiary tracking-[0.3em] uppercase">Itinerario del Evento</p>
      </div>

      <!-- Contenedor Timeline Central -->
      <div class="relative max-w-xl mx-auto py-6" id="timelineContainer">
        <div class="timeline-track-line" id="timelineTrackLine"></div>

        <div class="space-y-12 sm:space-y-16 relative z-10" id="itineraryTimelineList">
          ${itinerarySteps.map((step, idx) => {
            const isEven = idx % 2 === 0;
            const lineArtSvg = TemplateEngine.itineraryLineArt[step.icon] || TemplateEngine.itineraryLineArt.toast;

            return `
            <div class="timeline-step-row flex items-center justify-between w-full" data-step-idx="${idx}">
              
              <div class="w-[42%] text-right flex items-center justify-end timeline-left-col">
                ${isEven ? `
                  <div class="timeline-icon-wrap p-2 flex justify-end">
                    ${lineArtSvg}
                  </div>
                ` : `
                  <div class="timeline-text-wrap pr-3">
                    <p class="font-label-caps text-xs sm:text-sm text-antique-gold font-semibold tracking-wider">${step.time || ''}</p>
                    <p class="font-display-lg text-base sm:text-lg text-deep-onyx font-bold mt-0.5 leading-snug">${step.label || ''}</p>
                  </div>
                `}
              </div>

              <div class="w-[16%] flex justify-center timeline-node-col">
                <div class="timeline-heart-node w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-champagne-cream border-2 border-antique-gold flex items-center justify-center text-antique-gold shadow-sm z-20">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" class="text-antique-gold">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              </div>

              <div class="w-[42%] text-left flex items-center justify-start timeline-right-col">
                ${isEven ? `
                  <div class="timeline-text-wrap pl-3">
                    <p class="font-label-caps text-xs sm:text-sm text-antique-gold font-semibold tracking-wider">${step.time || ''}</p>
                    <p class="font-display-lg text-base sm:text-lg text-deep-onyx font-bold mt-0.5 leading-snug">${step.label || ''}</p>
                  </div>
                ` : `
                  <div class="timeline-icon-wrap p-2 flex justify-start">
                    ${lineArtSvg}
                  </div>
                `}
              </div>

            </div>
            `;
          }).join('')}
        </div>

      </div>
    </div>
  </section>

  <!-- ==================== 8.1 ÁLBUM COLABORATIVO (DEBAJO DEL PROGRAMA) ==================== -->
  <section id="albumColaborativo" class="py-16 px-margin-mobile text-center max-w-xl mx-auto relative overflow-hidden ${(config.sharedAlbum && config.sharedAlbum.enabled !== false) ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'sharedAlbum', 0.30);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="bg-white/60 backdrop-blur-xl border border-antique-gold/40 p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgba(165,110,14,0.08)] relative z-10 overflow-hidden gsap-scale-up">
      
      <div class="w-16 h-16 bg-champagne-cream rounded-full flex items-center justify-center border border-antique-gold shadow-md mx-auto mb-4 text-antique-gold">
        <span class="material-symbols-outlined text-[30px]">add_photo_alternate</span>
      </div>

      <p class="font-label-caps text-xs text-antique-gold tracking-[0.3em] uppercase mb-2" id="albumSubtitle">
        ${(config.sharedAlbum && config.sharedAlbum.subtitle) || 'Recuerdos del Gran Día'}
      </p>

      <h3 class="font-display-lg text-2xl sm:text-3xl text-deep-onyx mb-3" id="albumTitle">
        ${(config.sharedAlbum && config.sharedAlbum.title) || 'Álbum Colaborativo'}
      </h3>

      <p class="font-body-lg text-sm sm:text-base text-tertiary leading-relaxed mb-6 max-w-md mx-auto" id="albumDescription">
        ${(config.sharedAlbum && config.sharedAlbum.description) || '¡Ayúdanos a capturar cada momento! Sube aquí todas las fotos y videos que tomes durante nuestro gran día usando tu código personalizado de invitado.'}
      </p>

      <!-- Tarjeta con Código Personalizado de Acceso -->
      <div class="bg-champagne-cream/90 border border-antique-gold/50 rounded-2xl p-4 sm:p-5 max-w-xs mx-auto mb-6 shadow-sm">
        <span class="font-label-caps text-[9px] uppercase tracking-[0.25em] text-antique-gold font-bold block mb-1">
          Tu Código de Acceso
        </span>
        <div class="flex items-center justify-between gap-2 mt-2 bg-white/80 rounded-full px-4 py-2 border border-antique-gold/30">
          <span id="albumAccessCode" class="font-mono text-sm sm:text-base font-bold text-deep-onyx tracking-widest select-all">
            ${(config.sharedAlbum && config.sharedAlbum.accessCode) || 'BODA2027'}
          </span>
          <button type="button" id="btnCopyAlbumCode" class="btn-luxury-primary text-[10px] px-3 py-1 shadow-sm flex items-center gap-1">
            <span class="material-symbols-outlined text-[13px]">content_copy</span>
            <span>Copiar</span>
          </button>
        </div>
      </div>

      <!-- Botón de Acción Principal -->
      <a id="btnOpenAlbum" href="${(config.sharedAlbum && config.sharedAlbum.albumUrl) || 'https://photos.google.com'}" target="_blank" rel="noopener noreferrer" class="btn-luxury-primary text-xs py-3.5 px-6 shadow-md inline-flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">cloud_upload</span>
        <span>Subir Fotos al Álbum</span>
      </a>

    </div>
  </section>

  <!-- ==================== 9. HASHTAG / INSTAGRAM ==================== -->
  <section id="instagramSection" class="py-16 px-margin-mobile bg-emerald-deep text-center border-y border-antique-gold/30 relative overflow-hidden ${(config.instagram && config.instagram.enabled !== false && config.instagram.hashtag) ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'instagram', 0.25);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="max-w-md mx-auto relative z-10">
      <span class="material-symbols-outlined text-antique-gold text-[40px] mb-4 font-light">photo_camera</span>
      <p class="font-label-caps text-xs text-antique-gold tracking-[0.3em] uppercase mb-2">Comparte tus Recuerdos</p>
      <h3 id="instagramHashtag" class="font-display-lg text-2xl sm:text-3xl text-[#f7f6ec] mb-4">${(config.instagram && config.instagram.hashtag) || ''}</h3>
      <p id="instagramText" class="font-body-lg text-xs sm:text-sm text-[#f7f6ec]/80 mb-6 leading-relaxed">${(config.instagram && config.instagram.text) || 'Usa nuestro hashtag oficial en tus publicaciones e historias de Instagram.'}</p>
      
      <button type="button" id="btnCopyHashtag" class="btn-luxury-secondary-dark">
        <span class="material-symbols-outlined text-[16px]">content_copy</span>
        Copiar Hashtag
      </button>
    </div>
  </section>

  <!-- ==================== 10. RSVP (CONFIRMACIÓN & QR PASS) ==================== -->
  <section id="rsvp" class="py-24 px-margin-mobile bg-emerald-dark text-center relative overflow-hidden border-t border-antique-gold/30">
    ${(() => {
      const bg = getSectionBg(config, 'rsvp', 0.35);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="relative z-10 max-w-md mx-auto gsap-scale-up overflow-visible">
      <h2 class="font-script mb-3 font-normal gsap-title overflow-visible heading-script-scaled ${titleEffectClass}">Confirma tu Asistencia</h2>
      <p id="rsvpDeadline" class="font-body-lg text-sm sm:text-base text-[#f7f6ec]/85 mb-8 gsap-fade-up">
        ${config.rsvpDeadlineLabel || 'Por favor, haznos saber si podrás acompañarnos.'}
      </p>

      <form id="rsvpForm" class="flex flex-col gap-6 text-left gsap-fade-up bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-antique-gold/40 shadow-xl" novalidate>
        
        <!-- Nombre -->
        <div class="flex flex-col gap-2">
          <label class="font-label-caps text-[11px] text-antique-gold uppercase tracking-[0.2em]">Nombre Completo</label>
          <input id="formGuestName" name="nombre" required class="w-full bg-white/15 border border-antique-gold/50 rounded-full px-5 py-3 font-body-lg text-[#f7f6ec] focus:outline-none focus:border-antique-gold transition-colors placeholder:text-[#f7f6ec]/40 text-sm" placeholder="Escribe tu nombre y apellidos" type="text"/>
        </div>

        <!-- Teléfono -->
        <div class="flex flex-col gap-2">
          <label class="font-label-caps text-[11px] text-antique-gold uppercase tracking-[0.2em]">Teléfono / WhatsApp</label>
          <input name="telefono" class="w-full bg-white/15 border border-antique-gold/50 rounded-full px-5 py-3 font-body-lg text-[#f7f6ec] focus:outline-none focus:border-antique-gold transition-colors placeholder:text-[#f7f6ec]/40 text-sm" placeholder="Para enviar recordatorios" type="tel"/>
        </div>

        <!-- Asistencia -->
        <div class="flex flex-col gap-3">
          <label class="font-label-caps text-[11px] text-antique-gold uppercase tracking-[0.2em]">¿Asistirás?</label>
          <div class="flex flex-col gap-2.5">
            <label class="flex items-center gap-3 cursor-pointer p-3 border border-antique-gold/40 rounded-xl bg-[#0d130e]/40 hover:bg-[#0d130e]/60 transition-colors">
              <input class="accent-antique-gold w-4 h-4" name="rsvp" value="si" checked type="radio"/>
              <span class="font-body-lg text-sm text-[#f7f6ec]">Sí, con mucho gusto asistiré</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer p-3 border border-antique-gold/40 rounded-xl bg-[#0d130e]/40 hover:bg-[#0d130e]/60 transition-colors">
              <input class="accent-antique-gold w-4 h-4" name="rsvp" value="no" type="radio"/>
              <span class="font-body-lg text-sm text-[#f7f6ec]">Lamentablemente no podré asistir</span>
            </label>
          </div>
        </div>

        <!-- Selector de Pases (Restringido por URL VIP) -->
        <div id="rsvpTicketsRow" class="flex items-center justify-between p-3.5 bg-[#0d130e]/40 border border-antique-gold/40 rounded-xl">
          <div>
            <span class="font-label-caps text-[11px] text-antique-gold uppercase tracking-wider block">Pases Autorizados</span>
            <span id="allowedTicketsHint" class="text-[11px] text-[#f7f6ec]/70">Máximo 2 personas</span>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" class="stepper__btn w-8 h-8 rounded-full border border-antique-gold bg-antique-gold/20 text-[#f7f6ec] flex items-center justify-center font-bold text-base hover:bg-antique-gold transition-colors" data-step="-1">-</button>
            <span id="guestCount" class="font-display-lg text-lg text-[#f7f6ec] font-bold tabular-nums min-w-[20px] text-center">1</span>
            <button type="button" class="stepper__btn w-8 h-8 rounded-full border border-antique-gold bg-antique-gold/20 text-[#f7f6ec] flex items-center justify-center font-bold text-base hover:bg-antique-gold transition-colors" data-step="1">+</button>
          </div>
        </div>

        <button type="submit" id="rsvpSubmit" class="btn-luxury-primary w-full py-4 text-xs tracking-[0.25em] shadow-[0_4px_20px_rgba(165,110,14,0.4)] mt-2">
          Confirmar Asistencia
        </button>
      </form>

      <!-- Pase de Acceso con Código QR -->
      <div id="rsvpSuccess" class="hidden mt-6 bg-white text-deep-onyx p-6 sm:p-8 rounded-2xl border-2 border-dashed border-antique-gold shadow-2xl max-w-sm mx-auto text-center">
        <span class="font-script text-3xl text-antique-gold block">Pase de Acceso</span>
        <span class="font-display-lg text-sm uppercase tracking-widest text-deep-onyx font-bold block mt-1" id="qrEventTitle">${safeTitle}</span>
        
        <hr class="border-t border-antique-gold/30 my-4"/>
        
        <p class="font-body-lg text-base font-bold text-deep-onyx" id="qrGuestName"></p>
        <p class="font-body-lg text-xs text-tertiary mt-1" id="qrGuestTickets"></p>
        
        <div id="qrContainer" class="flex justify-center my-4"></div>
        
        <p class="font-mono text-[10px] text-tertiary tracking-widest uppercase" id="qrFolio"></p>
        <p class="font-body-lg text-[11px] text-tertiary/80 mt-3">Presenta este código QR en la entrada del evento para validar tu ingreso.</p>
      </div>

    </div>
  </section>

</div>

<!-- ==================== 11. FOOTER ==================== -->
<footer class="py-16 px-margin-mobile text-center bg-emerald-deep border-t border-antique-gold/30">
  <p class="font-script font-normal mb-2 gsap-fade-up overflow-visible heading-script-scaled ${titleEffectClass}">Con amor,</p>
  <p class="font-display-lg text-lg text-[#f7f6ec] tracking-[0.25em] uppercase gsap-fade-up font-semibold" id="footerNames">
    ${fullDisplayName}
  </p>
  <p class="font-body-lg text-xs text-[#f7f6ec]/50 mt-4 tracking-wider" id="footerCustomText">
    ${config.footerText || ''}
  </p>
</footer>

<!-- ==================== REPRODUCTOR DE MÚSICA DISCRETO EN LA PARTE INFERIOR ==================== -->
<div id="musicPlayer" class="fixed right-4 bottom-20 z-40 ${hasMusic ? 'flex' : 'hidden'} items-center gap-2.5 px-3.5 py-2 bg-champagne-cream/95 backdrop-blur-xl border border-antique-gold/40 rounded-full shadow-[0_6px_25px_rgba(165,110,14,0.18)] cursor-pointer transition-all duration-300 hover:border-antique-gold hover:shadow-[0_8px_30px_rgba(165,110,14,0.28)]">
  <audio id="musicAudio" loop preload="auto" src="${musicConfig.url || ''}"></audio>
  
  <button id="musicToggle" type="button" aria-label="Música" class="w-7 h-7 rounded-full bg-antique-gold text-white flex items-center justify-center shadow-sm flex-shrink-0 transition-transform active:scale-90">
    <span id="musicIconPlay" class="material-symbols-outlined text-[15px]">play_arrow</span>
    <span id="musicIconPause" class="material-symbols-outlined text-[15px] hidden">pause</span>
  </button>
  
  <div id="musicEq" class="flex items-end gap-[3px] h-3.5 flex-shrink-0 px-0.5">
    <span class="eq-bar w-[2.5px] bg-antique-gold rounded-full" style="animation-delay:0ms;"></span>
    <span class="eq-bar w-[2.5px] bg-antique-gold rounded-full" style="animation-delay:200ms;"></span>
    <span class="eq-bar w-[2.5px] bg-antique-gold rounded-full" style="animation-delay:400ms;"></span>
  </div>
  
  <div class="flex flex-col text-left pr-1.5 overflow-hidden">
    <span id="musicStatus" class="font-label-caps text-[8px] uppercase tracking-[0.2em] text-antique-gold font-bold leading-none">Música</span>
    <span id="musicTitle" class="font-label-caps text-[10px] text-deep-onyx uppercase tracking-wider max-w-[110px] sm:max-w-[130px] truncate font-medium mt-0.5">
      ${musicConfig.title || 'Canción de los Novios'}
    </span>
  </div>
</div>

</main>

<!-- ==================== BARRA DE NAVEGACIÓN INFERIOR MÓVIL ==================== -->
<nav class="fixed bottom-0 w-full z-50 bg-champagne-cream/90 backdrop-blur-xl pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-antique-gold/20">
  <div class="flex justify-around items-center h-16 max-w-md mx-auto px-4">
    <a href="#hero" class="flex flex-col items-center justify-center gap-1 text-antique-gold font-bold transition-colors">
      <span class="material-symbols-outlined text-[20px]">home</span>
      <span class="font-label-caps text-[9px] uppercase tracking-wider">Inicio</span>
    </a>
    <a href="#details" class="flex flex-col items-center justify-center gap-1 text-tertiary hover:text-antique-gold transition-colors">
      <span class="material-symbols-outlined text-[20px]">calendar_today</span>
      <span class="font-label-caps text-[9px] uppercase tracking-wider">Lugar</span>
    </a>
    <a href="#galeria" class="flex flex-col items-center justify-center gap-1 text-tertiary hover:text-antique-gold transition-colors">
      <span class="material-symbols-outlined text-[20px]">photo_library</span>
      <span class="font-label-caps text-[9px] uppercase tracking-wider">Galería</span>
    </a>
    <a href="#itinerario" class="flex flex-col items-center justify-center gap-1 text-tertiary hover:text-antique-gold transition-colors">
      <span class="material-symbols-outlined text-[20px]">schedule</span>
      <span class="font-label-caps text-[9px] uppercase tracking-wider">Programa</span>
    </a>
    <a href="#rsvp" class="flex flex-col items-center justify-center gap-1 text-tertiary hover:text-antique-gold transition-colors">
      <span class="material-symbols-outlined text-[20px]">mail</span>
      <span class="font-label-caps text-[9px] uppercase tracking-wider">RSVP</span>
    </a>
  </div>
</nav>

<!-- ==================== LOGICA JAVASCRIPT ==================== -->
<script>
const CONFIG = ${configJson};

const urlParams = new URLSearchParams(window.location.search);
const urlGuest = urlParams.get('invitado') || urlParams.get('guest');
const urlTickets = parseInt(urlParams.get('pases') || urlParams.get('tickets'), 10) || CONFIG.defaultPassCount || 2;
const isWedding = CONFIG.eventType === 'boda';

// 1. VIP Personalization
if(urlGuest && urlGuest.trim()){
  const vipBanner = document.getElementById('vipBanner');
  if(vipBanner){
    vipBanner.classList.remove('hidden');
    vipBanner.classList.add('flex');
    document.getElementById('vipGuestName').textContent = urlGuest;
    document.getElementById('vipGuestTickets').textContent = \`\${urlTickets} Pases Reservados\`;
    const formName = document.getElementById('formGuestName');
    if(formName) formName.value = urlGuest;
  }
}
const ticketsHint = document.getElementById('allowedTicketsHint');
if(ticketsHint) ticketsHint.textContent = \`Máximo \${urlTickets} personas\`;

// 2. Countdown Timer
if(CONFIG.eventDateISO){
  const isoString = CONFIG.eventDateISO + (CONFIG.timezoneOffset || "");
  const target = new Date(isoString).getTime() || new Date(CONFIG.eventDateISO).getTime();
  const elDays = document.getElementById("days");
  const elHours = document.getElementById("hours");
  const elMinutes = document.getElementById("minutes");
  const elSeconds = document.getElementById("seconds");

  const pad = n => String(n).padStart(2, '0');

  const updateCountdown = () => {
    const now = Date.now();
    const diff = Math.max(0, target - now);
    if(elDays) elDays.innerText = pad(Math.floor(diff / (1000 * 60 * 60 * 24)));
    if(elHours) elHours.innerText = pad(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    if(elMinutes) elMinutes.innerText = pad(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
    if(elSeconds) elSeconds.innerText = pad(Math.floor((diff % (1000 * 60)) / 1000));
  };
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Google Calendar URL
  const gStart = new Date(CONFIG.eventDateISO);
  const gEnd = new Date(gStart.getTime() + (CONFIG.eventDurationHours || 6) * 3600000);
  const pad2 = n => String(n).padStart(2,'0');
  const toGDate = d => d.getUTCFullYear() + pad2(d.getUTCMonth()+1) + pad2(d.getUTCDate()) + 'T' + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + '00Z';
  const gTitle = encodeURIComponent(\`\${CONFIG.eyebrow || 'Evento'} de \${isWedding ? (CONFIG.brideName + ' & ' + CONFIG.groomName) : (CONFIG.name || 'Invitación')}\`);
  const gLoc = encodeURIComponent(\`\${(CONFIG.ceremony && CONFIG.ceremony.venue) || ''}, \${(CONFIG.ceremony && CONFIG.ceremony.address) || ''}\`);
  const gDet = encodeURIComponent(CONFIG.quote || '');
  const gCalBtn = document.getElementById('btnGoogleCalendar');
  if(gCalBtn){
    gCalBtn.href = \`https://calendar.google.com/calendar/render?action=TEMPLATE&text=\${gTitle}&dates=\${toGDate(gStart)}/\${toGDate(gEnd)}&details=\${gDet}&location=\${gLoc}\`;
  }
}

// 3. Apple/Outlook .ICS Calendar Download
const btnIcs = document.getElementById('btnCalendar');
if(btnIcs){
  btnIcs.addEventListener('click', () => {
    const pad2 = n => String(n).padStart(2,'0');
    const toICSLocalDate = d => d.getFullYear() + pad2(d.getMonth()+1) + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + pad2(d.getMinutes()) + '00';
    const calcDisplayName = isWedding ? (\`\${CONFIG.brideName || ''} & \${CONFIG.groomName || ''}\`) : (CONFIG.name || 'Invitacion');
    const start = new Date(CONFIG.eventDateISO);
    const end = new Date(start.getTime() + (CONFIG.eventDurationHours || 6) * 3600000);
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Invitacion//ES', 'BEGIN:VEVENT',
      \`UID:\${Date.now()}@invitacion\`, \`DTSTAMP:\${toICSLocalDate(new Date())}\`, \`DTSTART:\${toICSLocalDate(start)}\`,
      \`DTEND:\${toICSLocalDate(end)}\`, \`SUMMARY:\${CONFIG.eyebrow || 'Evento'} de \${calcDisplayName}\`,
      \`LOCATION:\${(CONFIG.ceremony && CONFIG.ceremony.venue) || ''}, \${(CONFIG.ceremony && CONFIG.ceremony.address) || ''}\`, \`DESCRIPTION:\${CONFIG.quote || ''}\`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\\r\\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = \`Evento-\${calcDisplayName.replace(/\\s+/g,'-')}.ics\`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });
}

// 4. Copiar CLABE, Hashtag y Código de Álbum Colaborativo
const btnCopyClabe = document.getElementById('btnCopyClabe');
if(btnCopyClabe){
  btnCopyClabe.addEventListener('click', async () => {
    const clabeText = document.getElementById('clabeText').textContent.replace(/\s/g,'');
    try { await navigator.clipboard.writeText(clabeText); } catch(e){}
    btnCopyClabe.textContent = '¡Copiado!';
    setTimeout(() => { btnCopyClabe.textContent = 'Copiar'; }, 1800);
  });
}

const btnCopyHashtag = document.getElementById('btnCopyHashtag');
if(btnCopyHashtag){
  btnCopyHashtag.addEventListener('click', async () => {
    const tag = (CONFIG.instagram && CONFIG.instagram.hashtag) || '';
    try { await navigator.clipboard.writeText(tag); } catch(e){}
    btnCopyHashtag.textContent = '¡Hashtag Copiado!';
    setTimeout(() => { btnCopyHashtag.innerHTML = '<span class="material-symbols-outlined text-[16px]">content_copy</span> Copiar Hashtag'; }, 1800);
  });
}

// Código Personalizado para Álbum Colaborativo (por URL o por Config)
const urlAlbumCode = urlParams.get('codigo_album') || urlParams.get('album_code') || urlParams.get('pin') || urlParams.get('codigo');
const albumCodeEl = document.getElementById('albumAccessCode');
if (albumCodeEl) {
  if (urlAlbumCode && urlAlbumCode.trim()) {
    albumCodeEl.textContent = urlAlbumCode.trim();
  } else if (CONFIG.sharedAlbum && CONFIG.sharedAlbum.accessCode) {
    albumCodeEl.textContent = CONFIG.sharedAlbum.accessCode;
  }
}

const btnCopyAlbumCode = document.getElementById('btnCopyAlbumCode');
if (btnCopyAlbumCode) {
  btnCopyAlbumCode.addEventListener('click', async () => {
    const code = document.getElementById('albumAccessCode').textContent.trim();
    try { await navigator.clipboard.writeText(code); } catch(e){}
    const span = btnCopyAlbumCode.querySelector('span:last-child') || btnCopyAlbumCode;
    const prev = span.textContent;
    span.textContent = '¡Copiado!';
    setTimeout(() => { span.textContent = prev; }, 1800);
  });
}

// 5. Reproductor de Música Discreto
const musicPlayer = document.getElementById('musicPlayer');
const audio = document.getElementById('musicAudio');
const iconPlay = document.getElementById('musicIconPlay');
const iconPause = document.getElementById('musicIconPause');
const musicStatus = document.getElementById('musicStatus');

if (musicPlayer && audio) {
  const updatePlayerState = (isPlaying) => {
    if (isPlaying) {
      musicPlayer.classList.add('is-playing');
      if (iconPlay) iconPlay.classList.add('hidden');
      if (iconPause) iconPause.classList.remove('hidden');
      if (musicStatus) musicStatus.textContent = 'Sonando';
    } else {
      musicPlayer.classList.remove('is-playing');
      if (iconPlay) iconPlay.classList.remove('hidden');
      if (iconPause) iconPause.classList.add('hidden');
      if (musicStatus) musicStatus.textContent = 'Pausado';
    }
  };

  musicPlayer.addEventListener('click', (e) => {
    e.stopPropagation();
    if (audio.paused) {
      audio.play().then(() => updatePlayerState(true)).catch(() => {});
    } else {
      audio.pause();
      updatePlayerState(false);
    }
  });

  audio.addEventListener('play', () => updatePlayerState(true));
  audio.addEventListener('pause', () => updatePlayerState(false));
  audio.addEventListener('ended', () => updatePlayerState(false));
}

// 6. RSVP Stepper & QR Pass
let guestCount = Math.min(1, urlTickets);
const guestOut = document.getElementById('guestCount');
const ticketsRow = document.getElementById('rsvpTicketsRow');
if(guestOut) guestOut.textContent = guestCount;

document.querySelectorAll('.stepper__btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    guestCount = Math.min(urlTickets, Math.max(1, guestCount + parseInt(btn.dataset.step, 10)));
    if(guestOut) guestOut.textContent = guestCount;
  });
});

document.querySelectorAll('input[name="rsvp"]').forEach(r => {
  r.addEventListener('change', () => {
    if(r.value === 'no'){
      ticketsRow.style.opacity = '0.35';
      ticketsRow.style.pointerEvents = 'none';
    } else {
      ticketsRow.style.opacity = '1';
      ticketsRow.style.pointerEvents = 'auto';
    }
  });
});

const rsvpForm = document.getElementById('rsvpForm');
if(rsvpForm){
  rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!rsvpForm.checkValidity()){ rsvpForm.reportValidity(); return; }
    
    const data = new FormData(rsvpForm);
    const payload = {
      attend: data.get('rsvp'),
      nombre: data.get('nombre'),
      telefono: data.get('telefono'),
      pases: data.get('rsvp') === 'si' ? guestCount : 0
    };

    const folio = 'PASS-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const calcDisplayName = isWedding ? (\`\${CONFIG.brideName || ''} & \${CONFIG.groomName || ''}\`) : (CONFIG.name || 'Invitación');

    if(CONFIG.whatsappNumber && CONFIG.whatsappNumber.trim()){
      const attendLine = payload.attend === 'si' ? '✅ Sí, confirmamos nuestra asistencia' : '❌ No podremos asistir';
      const lines = [
        \`✨ *Confirmación · \${CONFIG.eyebrow || 'Boda'} de \${calcDisplayName}*\`,
        \`👤 *Titular:* \${payload.nombre}\`,
        \`💌 *Estado:* \${attendLine}\`
      ];
      if(payload.attend === 'si') {
        lines.push(\`🎟️ *Pases Confirmados:* \${payload.pases} de \${urlTickets}\`);
        lines.push(\`🔖 *Folio:* \${folio}\`);
      }
      const text = encodeURIComponent(lines.join('\\n'));
      const phone = CONFIG.whatsappNumber.replace(/[^\\d]/g, '');
      window.open(\`https://wa.me/\${phone}?text=\${text}\`, '_blank', 'noopener,noreferrer');
    }

    const submitBtn = document.getElementById('rsvpSubmit');
    if(submitBtn){
      submitBtn.disabled = true;
      submitBtn.textContent = 'Generando Pase...';
    }

    setTimeout(() => {
      rsvpForm.classList.add('hidden');
      const successBox = document.getElementById('rsvpSuccess');
      successBox.classList.remove('hidden');

      if(payload.attend === 'si'){
        document.getElementById('qrGuestName').textContent = payload.nombre;
        document.getElementById('qrGuestTickets').textContent = \`Pase autorizado para: \${payload.pases} persona(s)\`;
        document.getElementById('qrFolio').textContent = \`Folio: \${folio}\`;

        const qrData = JSON.stringify({
          folio: folio,
          evento: calcDisplayName,
          titular: payload.nombre,
          pases: payload.pases,
          fecha: CONFIG.eventDateShort
        });
        const qrContainer = document.getElementById('qrContainer');
        qrContainer.innerHTML = '';
        if(typeof QRCode !== 'undefined'){
          new QRCode(qrContainer, { text: qrData, width: 140, height: 140, colorDark: "#222222", colorLight: "#ffffff" });
        }
      } else {
        document.getElementById('qrGuestName').textContent = payload.nombre;
        document.getElementById('qrGuestTickets').textContent = 'Lamentamos que no puedas acompañarnos. ¡Gracias por avisarnos!';
        document.getElementById('qrContainer').innerHTML = '💌';
      }
    }, 600);
  });
}

// 7. GSAP Smooth Scroll Animations & Timeline Progress
document.addEventListener("DOMContentLoaded", () => {
  if(typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined'){
    gsap.registerPlugin(ScrollTrigger);

    // ─────────────────────────────────────────────────────────────────────────
    // MULTI-PLANO PARALLAX — Efecto Profundidad de Campo Premium
    // Capa 1: Fondo foto Hero → viaja a -30% (rápido, da profundidad)
    // Capa 2: Ilustración puente → viaja a -15% (medio, "flota" en primer plano)
    // scrub: 1.5 → lag físico que simula inercia real de cada capa
    // ─────────────────────────────────────────────────────────────────────────
    const heroSection = document.getElementById('hero');
    const parallaxBgHero = document.getElementById('parallaxBgHero');
    const illBridgeHero = document.getElementById('illustrationBridgeHero');
    const illBridgeFamily = document.getElementById('illustrationBridgeFamily');
    const familySection = document.getElementById('family');

    if (heroSection && parallaxBgHero) {
      // CAPA 1 — Fondo foto: viaje agresivo para profundidad real de campo
      gsap.to(parallaxBgHero, {
        yPercent: -45,
        ease: 'none',
        scrollTrigger: {
          trigger: heroSection,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8   // más responsivo → el movimiento se siente inmediato
        }
      });
    }

    if (heroSection && illBridgeHero && !illBridgeHero.classList.contains('hidden')) {
      // CAPA 2 — Ilustración puente Hero: plano intermedio bien marcado
      gsap.to(illBridgeHero, {
        yPercent: -25,  // 25% vs 45% del fondo → diferencia visual evidente
        ease: 'none',
        scrollTrigger: {
          trigger: heroSection,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8
        }
      });
    }

    if (familySection && illBridgeFamily && !illBridgeFamily.classList.contains('hidden')) {
      // CAPA 2 — Ilustración puente Familia: parallax marcado en transición oscura→clara
      gsap.to(illBridgeFamily, {
        yPercent: -25,
        ease: 'none',
        scrollTrigger: {
          trigger: familySection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8
        }
      });
    }

    // Entry animation for illustrations: más dramática (viene desde más abajo)
    [illBridgeHero, illBridgeFamily].forEach(el => {
      if (el && !el.classList.contains('hidden')) {
        gsap.fromTo(el,
          { opacity: 0, scale: 0.82, y: 70 },
          { opacity: 1, scale: 1, y: 0, duration: 1.6, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 98%', toggleActions: 'play none none reverse' }
          }
        );
      }
    });

    gsap.utils.toArray('.gsap-fade-up, .gsap-eyebrow').forEach(el => {
      gsap.fromTo(el, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 1.1, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" }
      });
    });

    gsap.utils.toArray('.gsap-scale-up, .gsap-title').forEach(el => {
      if(!el.classList.contains('gsap-stagger-item')){
        gsap.fromTo(el, { opacity: 0, y: 25, scale: 0.96 }, {
          opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" }
        });
      }
    });

    document.querySelectorAll('.timeline-step-row').forEach((row, i) => {
      const leftCol = row.querySelector('.timeline-left-col');
      const heartNode = row.querySelector('.timeline-heart-node');
      const rightCol = row.querySelector('.timeline-right-col');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: row,
          start: "top 82%",
          toggleActions: "play none none reverse"
        }
      });

      if(heartNode){
        tl.fromTo(heartNode, 
          { scale: 0, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2)" }
        );
      }

      if(leftCol){
        tl.fromTo(leftCol, 
          { x: -35, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.7, ease: "power2.out" }, 
          "-=0.4"
        );
      }

      if(rightCol){
        tl.fromTo(rightCol, 
          { x: 35, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.7, ease: "power2.out" }, 
          "-=0.6"
        );
      }
    });
  }
});
</script>
</body>
</html>`;
  }
};

if (typeof module !== "undefined") {
  module.exports = TemplateEngine;
}
