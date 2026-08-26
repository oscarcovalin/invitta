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
    names: [
      { name: "Cormorant Garamond", family: "'Cormorant Garamond', serif", google: "Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500" },
      { name: "Playfair Display", family: "'Playfair Display', serif", google: "Playfair+Display:ital,wght@0,400;0,600;1,400" },
      { name: "Cinzel", family: "'Cinzel', serif", google: "Cinzel:wght@400;600;700" },
      { name: "Bodoni Moda", family: "'Bodoni Moda', serif", google: "Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400" },
      { name: "Cardo", family: "'Cardo', serif", google: "Cardo:ital,wght@0,400;0,700;1,400" },
      { name: "Parisienne", family: "'Parisienne', cursive", google: "Parisienne" },
      { name: "Alex Brush", family: "'Alex Brush', cursive", google: "Alex+Brush" },
      { name: "Great Vibes", family: "'Great Vibes', cursive", google: "Great+Vibes" },
      { name: "Pinyon Script", family: "'Pinyon Script', cursive", google: "Pinyon+Script" },
      { name: "Allura", family: "'Allura', cursive", google: "Allura" }
    ],
    script: [
      { name: "Parisienne", family: "'Parisienne', cursive", google: "Parisienne" },
      { name: "Alex Brush", family: "'Alex Brush', cursive", google: "Alex+Brush" },
      { name: "Great Vibes", family: "'Great Vibes', cursive", google: "Great+Vibes" },
      { name: "Allura", family: "'Allura', cursive", google: "Allura" },
      { name: "Pinyon Script", family: "'Pinyon Script', cursive", google: "Pinyon+Script" },
      { name: "Playfair Display", family: "'Playfair Display', serif", google: "Playfair+Display:ital,wght@0,400;1,400;1,600" }
    ],
    display: [
      { name: "Cormorant Garamond", family: "'Cormorant Garamond', serif", google: "Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500" },
      { name: "Playfair Display", family: "'Playfair Display', serif", google: "Playfair+Display:ital,wght@0,400;0,600;1,400" },
      { name: "Cinzel", family: "'Cinzel', serif", google: "Cinzel:wght@400;600;700" },
      { name: "Bodoni Moda", family: "'Bodoni Moda', serif", google: "Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400" },
      { name: "Cardo", family: "'Cardo', serif", google: "Cardo:ital,wght@0,400;0,700;1,400" }
    ],
    body: [
      { name: "Inter", family: "'Inter', sans-serif", google: "Inter:wght@300;400;500;600" },
      { name: "Work Sans", family: "'Work Sans', sans-serif", google: "Work+Sans:wght@300;400;500;600" },
      { name: "Source Serif 4", family: "'Source Serif 4', serif", google: "Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400" },
      { name: "Lora", family: "'Lora', serif", google: "Lora:ital,wght@0,400;0,500;0,600;1,400" }
    ]
  },

  defaultThemes: {
    vino: {
      "wine-900": "#163C2B", "wine-700": "#163C2B", "wine-500": "#24583F",
      "blush-100": "#F5F2EB", "blush-200": "#EDE8DE", "cream": "#FAF8F5",
      "gold-300": "#D4B67D", "gold-500": "#A38047", "gold-700": "#7A5E30",
      "ink-900": "#1E1E1E", "ink-700": "#2E2E2E",
      "rose-600": "#A38047", "text-cream": "#FAF8F5"
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
    nameConnector: "&", 
    monogram: "", 
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
      text: "Todo comenzó con una mirada y una conversación que duró horas. Desde ese instante supimos que nuestras vidas estarían unidas para siempre. Hoy damos el paso más importante y queremos compartirlo contigo.",
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
      namesFont: "Cormorant Garamond", // Fuente exclusiva para Nombres de Protagonistas (Hero & Footer)
      scriptFont: "Parisienne",
      displayFont: "Cormorant Garamond",
      bodyFont: "Inter",
      customNames: "",
      customScript: "",
      customDisplay: "",
      customBody: "",
      customNamesFile: "",
      customNamesFileName: "",
      customScriptFile: "",
      customScriptFileName: "",
      customDisplayFile: "",
      customDisplayFileName: "",
      customBodyFile: "",
      customBodyFileName: "",
      
      // Efecto de Títulos (Sólido Clásico o Metálico)
      titleEffect: "solid", // 'metallic' o 'solid'
      titleMetallicPreset: "gold", // 'gold', 'rosegold', 'silver', 'bronze', 'custom'
      titleCustomMetallic: "",
      titleSolidColor: "#1E1E1E",

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
    footerClosing: "Con amor,",
    footerText: "",
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
        image: "",        // URL o base64 de PNG con fondo transparente
        widthPct: 85,     // Ancho como % del contenedor (30–100)
        maxWidth: 560,    // Ancho máximo en px (250–900)
        offsetY: 0,       // Ajuste vertical fino en px (-200 a +200)
        offsetX: 0,       // Ajuste horizontal fino en px (-150 a +150)
        overlapPct: 50,   // % de caída hacia la siguiente sección (0 a 100)
        alignX: "center", // 'center', 'left', 'right'
        parallaxSpeed: 25,// Velocidad GSAP yPercent (0 a 60)
        extraPadding: 0   // Padding superior extra en la sección siguiente en px (0 a 250)
      },
      countdown: {
        enabled: false,
        image: "",
        widthPct: 80,
        maxWidth: 540,
        offsetY: 0,
        offsetX: 0,
        overlapPct: 50,
        alignX: "center",
        parallaxSpeed: 25,
        extraPadding: 0
      },
      family: {
        enabled: false,
        image: "",
        widthPct: 82,
        maxWidth: 560,
        offsetY: 0,
        offsetX: 0,
        overlapPct: 50,
        alignX: "center",
        parallaxSpeed: 25,
        extraPadding: 0
      }
    },
    vendorCard: {
      enabled: true,
      badge: "¿Deseas una invitación como esta?",
      title: "Invitaciones Digitales de Lujo",
      description: "Diseño interactivo exclusivo para Bodas, XV Años y Eventos Especiales.",
      whatsappNumber: "5215512345678",
      whatsappMessage: "¡Hola! Vi esta invitación digital y me gustaría solicitar información y cotización para mi próximo evento ✨",
      buttonText: "Solicitar Información por WhatsApp",
      showAgencyNote: true,
      agencyName: "Invitta Studio · Invitaciones Digitales de Lujo"
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

  luxuryIcons: {
    // 1. Ceremonia Religiosa / Iglesia (Arco ojival, Ventanal Rosa, Cruz y Campanario)
    church: `
      <svg viewBox="0 0 32 32" class="w-7 h-7 text-antique-gold mx-auto" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 3v4m-2-2h4"/>
        <path d="M16 7l-7 6v15h14V13L16 7z"/>
        <path d="M9 18l-5 4v6h5v-10zm14 0l5 4v6h-5v-10z"/>
        <path d="M14 28v-7a2 2 0 0 1 4 0v7"/>
        <circle cx="16" cy="14" r="2.2"/>
        <path d="M3 28h26"/>
      </svg>
    `,

    // 2. Recepción / Fiesta / Brindis (Copas de Champán Finas con Efervescencia y Destellos)
    celebration: `
      <svg viewBox="0 0 32 32" class="w-7 h-7 text-antique-gold mx-auto" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <g transform="translate(1, 0)">
          <path d="M11 6.5c-2.8 0-4.8 2-4.2 6.8l1 6.8c.5 1.7 2 2.7 3.7 2.7h.7c1.7 0 3.2-1 3.7-2.7l1-6.8c.6-4.8-1.4-6.8-4.2-6.8h-1.7z" transform="rotate(-12 11 13)"/>
          <path d="M19 6.5c2.8 0 4.8 2 4.2 6.8l-1 6.8c-.5 1.7-2 2.7-3.7 2.7h-.7c-1.7 0-3.2-1-3.7-2.7l-1-6.8C12.5 8.5 14.5 6.5 17.3 6.5H19z" transform="rotate(12 19 13)"/>
          <path d="M8.5 24.5l-2 4.5m-3 0h6m11-4.5l2 4.5m-1 0h6"/>
          <circle cx="15" cy="4.5" r=".8" fill="currentColor"/>
          <circle cx="13" cy="7.5" r=".6" fill="currentColor"/>
          <circle cx="17" cy="9" r=".6" fill="currentColor"/>
        </g>
      </svg>
    `,

    // 3. Código de Vestimenta (Gancho de Alta Costura, Moño Royal y Laureles)
    dressCode: `
      <svg viewBox="0 0 48 48" class="w-10 h-10 text-antique-gold mx-auto mb-4 gsap-fade-up" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <path d="M24 7a4.5 4.5 0 0 1 4.5 4.5c0 2.5-2.25 3.5-4.5 4.5"/>
        <path d="M24 16L7 27a3 3 0 0 0 1.5 5.5H39.5A3 3 0 0 0 41 27L24 16z"/>
        <path d="M21 34l3 2 3-2-1 5-2-1-2 1-1-5z"/>
        <circle cx="24" cy="35" r="1.2" fill="currentColor"/>
        <path d="M16 38c2.5 2.5 5.5 3.5 8 3.5s5.5-1 8-3.5"/>
        <path d="M12 29c-1.5 3-1.5 7.5.5 11M36 29c1.5 3 1.5 7.5-.5 11" stroke-dasharray="1.5 2.5"/>
      </svg>
    `,

    // 4. Datos Bancarios (Templo Clásico Jónico con Columnas y Frontón)
    bank: `
      <svg viewBox="0 0 24 24" class="w-5 h-5 text-antique-gold flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9.5l9-5 9 5v1.5H3V9.5z"/>
        <path d="M5.5 11v7m4.2-7v7m4.6-7v7m4.2-7v7"/>
        <path d="M2 18h20v2.5H2V18zm0 2.5h20V22H2v-1.5z"/>
        <circle cx="12" cy="7.5" r=".75" fill="currentColor"/>
      </svg>
    `,

    // 5. Álbum Colaborativo (Cámara Vintage Leica de Recuerdos)
    photoAlbum: `
      <svg viewBox="0 0 32 32" class="w-7 h-7 text-antique-gold mx-auto" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="9" width="24" height="18" rx="3.5"/>
        <path d="M11 9l2-3.5h6l2 3.5"/>
        <circle cx="16" cy="18" r="5.5"/>
        <circle cx="16" cy="18" r="2.5"/>
        <circle cx="23.5" cy="12.5" r="1" fill="currentColor"/>
        <path d="M7 12.5h2"/>
        <path d="M25 5.5l1 1.5L27.5 7.5 26 8 25 9.5l-1-1.5-1.5-.5 1.5-.5L25 5.5z" fill="currentColor" stroke="none"/>
      </svg>
    `,

    // 6. Instagram / Hashtag (Cámara con Destello de Estrella)
    camera: `
      <svg viewBox="0 0 48 48" class="w-10 h-10 text-antique-gold mx-auto mb-3" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="14" width="36" height="26" rx="5"/>
        <path d="M16 14l3-5h10l3 5"/>
        <circle cx="24" cy="27" r="8"/>
        <circle cx="24" cy="27" r="4" stroke-dasharray="2 2"/>
        <circle cx="34.5" cy="19.5" r="1.5" fill="currentColor"/>
        <path d="M37 7l1 2.5L40.5 10.5 38 11.5 37 14l-1-2.5-2.5-1 2.5-1L37 7z" fill="currentColor" stroke="none"/>
      </svg>
    `,

    // 7. Reloj / Horario (Dial Analógico Delicado)
    clock: `
      <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 text-antique-gold flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="8" cy="8" r="6.25"/>
        <path d="M8 4.25v3.75l2.5 1.5"/>
      </svg>
    `,

    // 8. Mapa Plegado (Google Maps)
    map: `
      <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1.5 3.5l4.25-1.75 4.5 1.75 4.25-1.75v10.5l-4.25 1.75-4.5-1.75-4.25 1.75V3.5z"/>
        <path d="M5.75 1.75v10.5m4.5-8.75v10.5"/>
      </svg>
    `,

    // 9. Aguja / Brújula de Navegación (Waze)
    navigation: `
      <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="8,1.5 14.5,13.5 8,10.75 1.5,13.5"/>
      </svg>
    `,

    // 10. Calendario con Signo Más (Google Calendar)
    calendarAdd: `
      <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="12" height="11" rx="2"/>
        <path d="M5 1.5v3M11 1.5v3M2 6.5h12"/>
        <path d="M8 8.5v3.5M6.25 10.25h3.5"/>
      </svg>
    `,

    // 11. Descarga / Archivo .ics (Apple Calendar)
    download: `
      <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 2.5v7.5m-3-3l3 3 3-3"/>
        <path d="M2.5 11.5v1.25a1.25 1.25 0 0 0 1.25 1.25h8.5a1.25 1.25 0 0 0 1.25-1.25V11.5"/>
      </svg>
    `,

    // 12. Copiar al Portapapeles (Tarjetas Superpuestas)
    copy: `
      <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="5" width="8.5" height="8.5" rx="1.75"/>
        <path d="M3.5 11H2.5A1.5 1.5 0 0 1 1 9.5v-7A1.5 1.5 0 0 1 2.5 1h7A1.5 1.5 0 0 1 11 2.5v1"/>
      </svg>
    `,

    // 13. Subir Fotos (Nube de Recuerdos)
    cloudUpload: `
      <svg viewBox="0 0 16 16" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3.5 10.5a3.5 3.5 0 0 1 .5-6.9 4.5 4.5 0 0 1 8.5 1.5 3.25 3.25 0 0 1 .5 6.4"/>
        <path d="M8 7.5v6m-2.25-3.75L8 7.5l2.25 2.25"/>
      </svg>
    `,

    // 14. Enlace Externo (Flecha Diagonal de Salida)
    externalLink: `
      <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 8.5v4a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 2 12.5v-7A1.5 1.5 0 0 1 3.5 4h4"/>
        <path d="M9.5 2h4.5v4.5M6.5 9.5L13.5 2.5"/>
      </svg>
    `,

    // 15. Barra de Navegación Inferior Móvil (Icons 20x20)
    navHome: `
      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 10.5l9-7.5 9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9.5z"/>
        <path d="M9.5 22v-6a2.5 2.5 0 0 1 5 0v6"/>
      </svg>
    `,
    navLocation: `
      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 21.5s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/>
        <circle cx="12" cy="9.5" r="2.5"/>
      </svg>
    `,
    navGallery: `
      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="14" height="14" rx="2"/>
        <path d="M21 7v12a2 2 0 0 1-2 2H7"/>
        <circle cx="8" cy="8" r="1.5"/>
        <path d="M3 14l4-4 5 5 2-2 3 3"/>
      </svg>
    `,
    navSchedule: `
      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v5l3.5 2"/>
      </svg>
    `,
    navRsvp: `
      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/>
        <path d="M2.5 7.5l9.5 6.5 9.5-6.5"/>
      </svg>
    `,

    // 16. Reproductor de Música (Play & Pause)
    play: `
      <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 fill-current">
        <polygon points="5,3 13,8 5,13"/>
      </svg>
    `,
    pause: `
      <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 fill-current">
        <rect x="4" y="3" width="2.5" height="10" rx=".75"/>
        <rect x="9.5" y="3" width="2.5" height="10" rx=".75"/>
      </svg>
    `
  },

  resolveTypography(config) {
    const typo = config.typography || this.defaultConfig.typography;
    const fontsToLoad = new Set();
    let localFontFaces = "";

    // 0. Names Font (Hero Names & Footer Signature Only)
    let namesFamily = "'Cormorant Garamond', serif";
    if (typo.customNamesFile && typo.customNamesFile.trim()) {
      localFontFaces += `
        @font-face {
          font-family: 'LocalCustomNames';
          src: url('${typo.customNamesFile}');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      namesFamily = "'LocalCustomNames', serif";
    } else if (typo.customNames && typo.customNames.trim()) {
      const name = typo.customNames.trim();
      namesFamily = `'${name}', serif`;
      fontsToLoad.add(name.replace(/\s+/g, '+'));
    } else if (typo.namesFont) {
      const preset = (this.fontPresets.names && this.fontPresets.names.find(f => f.name === typo.namesFont))
        || (this.fontPresets.display && this.fontPresets.display.find(f => f.name === typo.namesFont))
        || (this.fontPresets.script && this.fontPresets.script.find(f => f.name === typo.namesFont))
        || { name: typo.namesFont, family: `'${typo.namesFont}', serif`, google: typo.namesFont.replace(/\s+/g, '+') };
      namesFamily = preset.family;
      if (preset.google) fontsToLoad.add(preset.google);
    }

    // 1. Script Font
    let scriptFamily = "'Parisienne', cursive";
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
    let displayFamily = "'Cormorant Garamond', serif";
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
    let bodyFamily = "'Inter', sans-serif";
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

    fontsToLoad.add("Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500");
    fontsToLoad.add("Inter:wght@300;400;500;600");
    fontsToLoad.add("Parisienne");
    fontsToLoad.add("Playfair+Display:ital,wght@0,400;0,600;1,400");
    fontsToLoad.add("Alex+Brush");
    fontsToLoad.add("Great+Vibes");
    fontsToLoad.add("Work+Sans:wght@300;400;500;600");
    fontsToLoad.add("Cinzel:wght@400;600");
    fontsToLoad.add("Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400");

    const fontFamiliesParam = Array.from(fontsToLoad).map(f => `family=${f}`).join('&');
    const googleFontsUrl = `https://fonts.googleapis.com/css2?${fontFamiliesParam}&display=swap`;

    // 4. Resolve Title Effect (Metallic Foil Gradient vs Solid Color - Alto Contraste & Brillo Real)
    const titleEffect = typo.titleEffect || 'metallic';
    const titleMetallicPreset = typo.titleMetallicPreset || 'gold';
    const titleSolidColor = typo.titleSolidColor || '#ffffff';

    let metallicGradient = "linear-gradient(135deg, #6B4208 0%, #B88528 20%, #E8CA7A 40%, #946418 60%, #C89535 80%, #5E3804 100%)";
    if (titleMetallicPreset === 'rosegold') {
      metallicGradient = "linear-gradient(135deg, #6A222F 0%, #A8485B 20%, #E8AAB6 40%, #7D2B3B 60%, #C26376 80%, #521822 100%)";
    } else if (titleMetallicPreset === 'silver') {
      metallicGradient = "linear-gradient(135deg, #2D333B 0%, #5C6773 20%, #B8C2CC 40%, #3A434F 60%, #7A8998 80%, #1F242B 100%)";
    } else if (titleMetallicPreset === 'bronze') {
      metallicGradient = "linear-gradient(135deg, #5C2508 0%, #9E4A16 20%, #DCA072 40%, #6B2E0B 60%, #B85F24 80%, #421802 100%)";
    } else if (titleMetallicPreset === 'custom' && typo.titleCustomMetallic) {
      metallicGradient = typo.titleCustomMetallic;
    }

    const titleEffectClass = titleEffect === 'metallic' ? 'title-styled-metallic' : 'title-styled-solid';

    return { 
      googleFontsUrl, 
      namesFamily,
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
    const I = this.luxuryIcons;

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

    // Countdown Styling (Default Frosted Glass Card con Alto Contraste)
    const countStyle = config.countdownStyle || this.defaultConfig.countdownStyle || {};
    const countBgHex = countStyle.bgColor || "#ffffff";
    const countOpacity = typeof countStyle.opacity === 'number' ? countStyle.opacity : 0.70;
    const countTextColor = countStyle.textColor || "#222222";
    const countRgbaBg = hexToRgba(countBgHex, countOpacity);

    // Music Configuration
    const musicConfig = config.music || this.defaultConfig.music || {};
    const hasMusic = musicConfig.enabled !== false && musicConfig.url && musicConfig.url.trim();

    // Multi-Plano Parallax Illustrations
    const illConfig = config.illustrations || this.defaultConfig.illustrations || {};
    const illHero      = Object.assign({ enabled: false, image: '', widthPct: 85, maxWidth: 560, offsetY: 0, offsetX: 0, overlapPct: 50, alignX: 'center', parallaxSpeed: 25, extraPadding: 0 }, illConfig.hero || {});
    const illCountdown = Object.assign({ enabled: false, image: '', widthPct: 80, maxWidth: 540, offsetY: 0, offsetX: 0, overlapPct: 50, alignX: 'center', parallaxSpeed: 25, extraPadding: 0 }, illConfig.countdown || {});
    const illFamily    = Object.assign({ enabled: false, image: '', widthPct: 82, maxWidth: 560, offsetY: 0, offsetX: 0, overlapPct: 50, alignX: 'center', parallaxSpeed: 25, extraPadding: 0 }, illConfig.family || {});

    const hasIllHero      = illHero.enabled !== false && illHero.image && illHero.image.trim();
    const hasIllCountdown = illCountdown.enabled !== false && illCountdown.image && illCountdown.image.trim();
    const hasIllFamily    = illFamily.enabled !== false && illFamily.image && illFamily.image.trim();

    const getIllStyle = (ill) => {
      const overlapPct = ill.overlapPct !== undefined ? Number(ill.overlapPct) : 50;
      const offsetY = Number(ill.offsetY || 0);
      const offsetX = Number(ill.offsetX || 0);
      const widthPct = Number(ill.widthPct || 85);
      const maxWidth = Number(ill.maxWidth || 560);
      const alignX = ill.alignX || 'center';

      let posCss = '';
      if (alignX === 'left') {
        posCss = `left: calc(3% + ${offsetX}px); right: auto; transform: none;`;
      } else if (alignX === 'right') {
        posCss = `right: calc(3% - ${offsetX}px); left: auto; transform: none;`;
      } else {
        posCss = `left: calc(50% + ${offsetX}px); right: auto; transform: translateX(-50%);`;
      }

      const bottomOffset = `calc(-${Math.round(overlapPct / 2)}% + ${offsetY}px)`;
      return `bottom: ${bottomOffset}; width: ${widthPct}%; max-width: ${maxWidth}px; ${posCss}`;
    };

    const illHeroStyle = getIllStyle(illHero);
    const illCountdownStyle = getIllStyle(illCountdown);
    const illFamilyStyle = getIllStyle(illFamily);

    // Section enabled flags
    const isStoryEnabled = !!(config.story && config.story.enabled !== false && (config.story.title || config.story.text));
    const isCountdownEnabled = (config.countdown ? config.countdown.enabled !== false : true) && config.countdownEnabled !== false;
    const isFamilyEnabled = (config.family ? config.family.enabled !== false : true) && config.familyEnabled !== false;
    const isLocationsEnabled = (config.locations ? config.locations.enabled !== false : true) && config.locationsEnabled !== false;
    const isDressCodeEnabled = (config.dressCode ? config.dressCode.enabled !== false : true);
    const isGalleryEnabled = (config.photos ? config.photos.galleryEnabled !== false : true) && !!(config.photos && config.photos.gallery && config.photos.gallery.length > 0);
    const isGiftRegistryEnabled = config.giftRegistry && config.giftRegistry.enabled !== false;
    const isItineraryEnabled = config.itineraryEnabled !== false && (config.itinerary ? config.itinerary.enabled !== false : true) && itinerarySteps.length > 0;
    const isSharedAlbumEnabled = config.sharedAlbum && config.sharedAlbum.enabled !== false;
    const isInstagramEnabled = config.instagram && config.instagram.enabled !== false && !!config.instagram.hashtag;
    const isRsvpEnabled = (config.rsvp ? config.rsvp.enabled !== false : true) && config.rsvpEnabled !== false;

    const hasStory = isStoryEnabled;
    const hasHeroPhoto = !!(config.photos && config.photos.hero && config.photos.hero.trim());

    const heroPad = Number(illHero.extraPadding || 0);
    const countdownPad = Number(illCountdown.extraPadding || 0);
    const familyPad = Number(illFamily.extraPadding || 0);

    const countdownPaddingTop = (isCountdownEnabled && hasIllHero) ? `pt-[calc(140px+${heroPad}px)] sm:pt-[calc(160px+${heroPad}px)]` : 'pt-2 sm:pt-4';
    const familyPaddingTop    = (isFamilyEnabled && isCountdownEnabled && hasIllCountdown) ? `pt-[calc(130px+${countdownPad}px)] sm:pt-[calc(150px+${countdownPad}px)] pb-20` : 'py-20';
    const detailsPaddingTop   = (isLocationsEnabled && isFamilyEnabled && hasIllFamily) ? `pt-[calc(130px+${familyPad}px)] sm:pt-[calc(150px+${familyPad}px)]` : 'pt-20';

    // Vendor / Lead Generation Card
    const vendorCard = Object.assign({
      enabled: true,
      badge: '¿Deseas una invitación como esta?',
      title: 'Invitaciones Digitales de Lujo',
      description: 'Diseño interactivo exclusivo para Bodas, XV Años y Eventos Especiales.',
      whatsappNumber: '5215512345678',
      whatsappMessage: '¡Hola! Vi esta invitación digital y me gustaría solicitar información y cotización para mi próximo evento ✨',
      buttonText: 'Solicitar Información por WhatsApp',
      showAgencyNote: true,
      agencyName: 'Invitta Studio · Invitaciones Digitales de Lujo'
    }, config.vendorCard || {});

    const isVendorCardEnabled = vendorCard.enabled !== false;

    const vendorPhone = (vendorCard.whatsappNumber || '').replace(/[^\d]/g, '');
    const vendorMsg = encodeURIComponent(vendorCard.whatsappMessage || 'Hola, me gustaría solicitar información para una invitación digital');
    const vendorWaLink = vendorPhone ? `https://wa.me/${vendorPhone}?text=${vendorMsg}` : `https://wa.me/?text=${vendorMsg}`;

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
<base target="_self"/>
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
        "names": ["var(--font-names)", "var(--font-display)", "'Cormorant Garamond'", "serif"],
        "display-lg": ["var(--font-display)", "'Cormorant Garamond'", "serif"],
        "script-accent": ["var(--font-script)", "'Parisienne'", "cursive"],
        "body-lg": ["var(--font-body)", "'Inter'", "sans-serif"],
        "label-caps": ["var(--font-body)", "'Inter'", "sans-serif"]
      },
      spacing: {
        "margin-desktop": "120px",
        "gutter": "24px",
        "base": "8px",
        "section-gap": "96px",
        "content-gap": "28px",
        "margin-mobile": "24px"
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
    --champagne: ${activeTheme['cream'] || '#FAF8F5'};
    --gold: ${activeTheme['gold-500'] || '#A38047'};
    --gold-light: ${activeTheme['gold-300'] || '#D4B67D'};
    --onyx: ${activeTheme['ink-900'] || '#1E1E1E'};
    --emerald: ${activeTheme['wine-900'] || '#163c2b'};
    --emerald-dark: ${activeTheme['ink-900'] || '#0d130e'};
    --font-names: ${typo.namesFamily};
    --font-script: ${typo.scriptFamily};
    --font-display: ${typo.displayFamily};
    --font-body: ${typo.bodyFamily};

    /* Títulos: Metálico Foil o Color Sólido */
    --title-gradient: ${typo.metallicGradient};
    --title-solid-color: ${typo.titleSolidColor};

    /* Escala Tipográfica Controlada y Proporcional */
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
    line-height: 1.25 !important;
    overflow: visible !important;
  }

  /* Escala Tipográfica Exacta, Fluida y Responsiva de Alta Gama */
  .hero-name-scaled {
    font-family: var(--font-names, var(--font-display)) !important;
    font-size: clamp(34px, calc((1.75rem + 3.2vw) * var(--scale-hero, 1.0)), 64px) !important;
    font-weight: 300 !important;
    line-height: 1.25 !important;
    letter-spacing: 0.02em !important;
    overflow: visible !important;
  }
  .hero-solo-name-scaled {
    font-family: var(--font-names, var(--font-display)) !important;
    font-size: clamp(34px, calc((1.85rem + 3.5vw) * var(--scale-hero, 1.0)), 64px) !important;
    font-weight: 300 !important;
    line-height: 1.25 !important;
    letter-spacing: 0.02em !important;
    overflow: visible !important;
  }
  .hero-connector-scaled {
    font-family: var(--font-script) !important;
    font-size: clamp(28px, calc((1.4rem + 1.8vw) * var(--scale-hero, 1.0)), 42px) !important;
    line-height: 1.1 !important;
    font-weight: 400 !important;
    overflow: visible !important;
  }
  .heading-script-scaled {
    font-family: var(--font-display) !important;
    font-size: clamp(24px, calc((1.4rem + 1.8vw) * var(--scale-headings, 1.0)), 36px) !important;
    line-height: 1.25 !important;
    font-weight: 400 !important;
    overflow: visible !important;
  }
  .heading-display-scaled {
    font-family: var(--font-display) !important;
    font-size: clamp(22px, calc((1.3rem + 1.6vw) * var(--scale-headings, 1.0)), 34px) !important;
    line-height: 1.25 !important;
    font-weight: 400 !important;
    overflow: visible !important;
  }
  .body-scaled {
    font-size: calc(0.95rem * var(--scale-body, 1.0)) !important;
  }

  /* Efectos para Títulos: Degradado Metálico Foil vs Color Sólido (Anti-Clipping Avanzado y Ultra-Fluido) */
  .title-styled-metallic {
    background: var(--title-gradient) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    color: transparent !important;
    display: inline-block;
    box-sizing: content-box !important;
    /* Generoso padding en los 4 costados (especialmente abajo y a los lados) para que los trazos, remates, ascendentes y descendentes NUNCA se corten */
    padding-top: 0.35em !important;
    padding-bottom: 0.55em !important;
    padding-left: 0.35em !important;
    padding-right: 0.45em !important;
    /* Márgenes compensatorios para mantener alineación exacta sin alterar el flujo visual */
    margin-top: -0.25em !important;
    margin-bottom: -0.45em !important;
    margin-left: -0.3em !important;
    margin-right: -0.4em !important;
    line-height: 1.35 !important;
    overflow: visible !important;
    filter: drop-shadow(0 1px 1px rgba(90, 60, 10, 0.18));
    -webkit-filter: drop-shadow(0 1px 1px rgba(90, 60, 10, 0.18));
  }

  .title-styled-solid {
    color: var(--title-solid-color) !important;
    display: inline-block;
    box-sizing: content-box !important;
    padding-top: 0.2em !important;
    padding-bottom: 0.35em !important;
    padding-left: 0.2em !important;
    padding-right: 0.25em !important;
    margin-top: -0.15em !important;
    margin-bottom: -0.25em !important;
    margin-left: -0.15em !important;
    margin-right: -0.2em !important;
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

  /* Estilo Editorial de Alta Gama para el Contador (Líneas Delicadas sin Recuadro) */
  .frosted-glass-card {
    background: transparent;
    color: var(--countdown-text, #222222);
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
      <span class="font-display-lg text-base tracking-widest text-antique-gold" id="headerTitle">
        ${config.eyebrow || (isWedding ? 'Nuestra Boda' : 'Mis XV Años')}
      </span>
    </div>
    
    <div class="flex items-center gap-2">
      <button type="button" data-nav="rsvp" class="btn-luxury-secondary text-[10px] px-4 py-1.5 shadow-sm bg-transparent cursor-pointer">
        RSVP
      </button>
    </div>
  </div>
</header>

<!-- ==================== CONTENIDO PRINCIPAL ==================== -->
<main class="relative pt-16 min-h-screen pb-24">
<div class="flex flex-col w-full overflow-hidden relative">

  <!-- ==================== 1. EVENTO Y PROTAGONISTA(S) ==================== -->
  <!-- overflow-visible so the bridge illustration can overlap the next section -->
  <section id="hero" class="relative ${hasHeroPhoto ? 'pt-0 pb-12' : 'min-h-[68vh] sm:min-h-[72vh] flex flex-col items-center justify-center pt-10 pb-6 px-margin-mobile'} text-center" style="overflow: visible;">
    
    ${hasHeroPhoto ? `
    <!-- ╔══════════════════════════════════════════════════════════════╗ -->
    <!-- ║  FOTOGRAFÍA PRINCIPAL A PANTALLA COMPLETA LIMPIA             ║ -->
    <!-- ╚══════════════════════════════════════════════════════════════╝ -->
    <div id="heroPhotoFrame" class="w-full relative h-[80vh] sm:h-[86vh] overflow-hidden mb-6">
      <div id="parallaxBgHero" class="absolute inset-0 w-full h-[115%] -top-[7%] will-change-transform">
        <img id="heroPhotoImg" src="${config.photos.hero}" alt="${safeTitle}" class="w-full h-full object-cover object-center" loading="eager"/>
      </div>
    </div>

    <!-- ╔══════════════════════════════════════════════════════════════╗ -->
    <!-- ║  TEXTOS DEBAJO DE LA FOTOGRAFÍA (MÁXIMA LEGIBILIDAD)         ║ -->
    <!-- ╚══════════════════════════════════════════════════════════════╝ -->
    <div class="relative z-10 flex flex-col items-center max-w-lg mx-auto gsap-fade-up w-full px-margin-mobile">
      
      <!-- VIP Guest Banner -->
      <div id="vipBanner" class="hidden flex-col items-center gap-0.5 px-6 py-2 bg-white/85 backdrop-blur-md rounded-full border border-antique-gold/40 shadow-sm mb-2">
        <span class="font-label-caps text-[10px] uppercase tracking-[0.25em] text-antique-gold font-medium">Invitación Especial Para</span>
        <span id="vipGuestName" class="font-display-lg text-base text-deep-onyx font-normal tracking-wide">Familia Invitada</span>
        <span id="vipGuestTickets" class="font-label-caps text-[10px] text-tertiary font-normal">2 Pases Reservados</span>
      </div>

      <!-- Eyebrow: NUESTRA BODA / MIS XV AÑOS (Sans 11-14px Medium MAYÚSCULAS tracking +2 a +3px) -->
      <p id="heroEyebrow" class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium gsap-eyebrow mb-2 sm:mb-3">
        ${config.eyebrow || (isWedding ? 'Nuestra Boda' : 'Mis XV Años')}
      </p>

      <!-- Nombres con Serif o Script (Personalizable exclusivamente para Portada & Firma) -->
      ${isWedding && groomDisplayName ? `
      <div class="flex flex-col items-center my-1 sm:my-2 gsap-title overflow-visible">
        <h1 class="font-names font-light overflow-visible hero-name-scaled ${titleEffectClass}" id="heroBrideName" style="font-family: var(--font-names, var(--font-display));">
          ${brideDisplayName}
        </h1>
        <span class="font-script text-antique-gold my-1.5 sm:my-2 font-normal leading-none select-none overflow-visible hero-connector-scaled" id="heroNameConnector" style="font-family: var(--font-script);">
          ${nameConnector}
        </span>
        <h1 class="font-names font-light overflow-visible hero-name-scaled ${titleEffectClass}" id="heroGroomName" style="font-family: var(--font-names, var(--font-display));">
          ${groomDisplayName}
        </h1>
      </div>` : `
      <h1 id="heroName" class="font-names font-light my-2 sm:my-3 gsap-title overflow-visible hero-solo-name-scaled ${titleEffectClass}" style="font-family: var(--font-names, var(--font-display));">
        ${brideDisplayName}
      </h1>`}

      <!-- Frase / Cita de Bienvenida (Con holgura y aire para que luzca) -->
      <div id="welcomeQuoteWrap" class="mt-6 sm:mt-8 max-w-[92%] sm:max-w-[460px] mx-auto px-4 ${config.quote ? '' : 'hidden'}">
        <p id="welcomeQuote" class="font-display-lg text-[18px] sm:text-[20px] md:text-[22px] italic leading-[1.7] text-deep-onyx/85 font-light text-center">
          &ldquo;${config.quote || ''}&rdquo;
        </p>
      </div>

      <!-- Mensaje de Bienvenida (Serif Editorial 17-19px con espacio respirable) -->
      <div id="welcomeMessageWrap" class="max-w-[480px] mx-auto mt-6 sm:mt-7 mb-2 px-3 ${config.welcomeMessage ? '' : 'hidden'}">
        <p id="welcomeMessage" class="font-display-lg text-[16.5px] sm:text-[18.5px] text-deep-onyx/90 leading-[1.75] font-light tracking-wide text-center">
          ${config.welcomeMessage || ''}
        </p>
      </div>

    </div>
    ` : `
    <!-- ╔══════════════════════════════════════════════════════════════╗ -->
    <!-- ║  SISTEMA SIN FOTO (ATMÓSFERA Y TEXTO CENTRADO)               ║ -->
    <!-- ╚══════════════════════════════════════════════════════════════╝ -->
    <div class="absolute inset-0 overflow-hidden z-0 rounded-none">
      <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-champagne-cream"></div>
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/40 via-transparent to-transparent"></div>
    </div>

    <!-- Contenido Central sin foto -->
    <div class="relative z-10 flex flex-col items-center max-w-lg mx-auto gsap-scale-up w-full mt-4 px-margin-mobile">
      
      <!-- VIP Guest Banner -->
      <div id="vipBanner" class="hidden flex-col items-center gap-0.5 px-6 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/30 shadow-sm mb-2">
        <span class="font-label-caps text-[10px] uppercase tracking-[0.25em] text-antique-gold font-medium">Invitación Especial Para</span>
        <span id="vipGuestName" class="font-display-lg text-base text-white font-normal tracking-wide">Familia Invitada</span>
        <span id="vipGuestTickets" class="font-label-caps text-[10px] text-white/80 font-normal">2 Pases Reservados</span>
      </div>

      <!-- Eyebrow: NUESTRA BODA / MIS XV AÑOS -->
      <p id="heroEyebrow" class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium gsap-eyebrow mb-2 sm:mb-3">
        ${config.eyebrow || (isWedding ? 'Nuestra Boda' : 'Mis XV Años')}
      </p>

      <!-- Nombres con Efecto de Títulos -->
      ${isWedding && groomDisplayName ? `
      <div class="flex flex-col items-center my-1 sm:my-2 gsap-title overflow-visible">
        <h1 class="font-names font-light overflow-visible hero-name-scaled ${titleEffectClass}" id="heroBrideName" style="font-family: var(--font-names, var(--font-display));">
          ${brideDisplayName}
        </h1>
        <span class="font-script text-antique-gold my-1.5 sm:my-2 font-normal leading-none select-none overflow-visible hero-connector-scaled" id="heroNameConnector" style="font-family: var(--font-script);">
          ${nameConnector}
        </span>
        <h1 class="font-names font-light overflow-visible hero-name-scaled ${titleEffectClass}" id="heroGroomName" style="font-family: var(--font-names, var(--font-display));">
          ${groomDisplayName}
        </h1>
      </div>` : `
      <h1 id="heroName" class="font-names font-light my-2 sm:my-3 gsap-title overflow-visible hero-solo-name-scaled ${titleEffectClass}" style="font-family: var(--font-names, var(--font-display));">
        ${brideDisplayName}
      </h1>`}

      <!-- Frase / Cita de Bienvenida -->
      <div id="welcomeQuoteWrap" class="mt-6 sm:mt-8 max-w-[92%] sm:max-w-[460px] mx-auto px-4 ${config.quote ? '' : 'hidden'}">
        <p id="welcomeQuote" class="font-display-lg text-[18px] sm:text-[20px] md:text-[22px] italic leading-[1.7] text-[#f7f6ec]/90 font-light text-center">
          &ldquo;${config.quote || ''}&rdquo;
        </p>
      </div>

      <!-- Mensaje de Bienvenida -->
      <div id="welcomeMessageWrap" class="max-w-[480px] mx-auto mt-6 sm:mt-7 mb-2 px-3 ${config.welcomeMessage ? '' : 'hidden'}">
        <p id="welcomeMessage" class="font-display-lg text-[16.5px] sm:text-[18.5px] text-white/95 leading-[1.75] font-light tracking-wide text-center">
          ${config.welcomeMessage || ''}
        </p>
      </div>

    </div>
    `}

    ${!hasStory ? `
    <!-- CAPA 2: Ilustración Puente Hero → Countdown (Parallax Medio) cuando no hay Historia -->
    <div id="illustrationBridgeHero"
      class="absolute z-30 pointer-events-none will-change-transform ${hasIllHero ? '' : 'hidden'}"
      style="${illHeroStyle}">
      <img src="${illHero.image || ''}" alt="Ilustración decorativa" class="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.35)]" loading="eager" />
    </div>` : ''}
  </section>


  <!-- ==================== 1.1 HISTORIA DE AMOR / SEMBLANZA (OPCIONAL) ==================== -->
  <section id="storySection" class="py-12 px-margin-mobile text-center max-w-xl mx-auto relative overflow-visible ${hasStory ? '' : 'hidden'}">
    <div class="max-w-lg mx-auto gsap-fade-up relative z-10">
      <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-2" id="storySubtitle">${(config.story && config.story.subtitle) || ''}</p>
      <h2 class="font-display-lg text-[28px] sm:text-[32px] text-deep-onyx mb-4 font-normal tracking-wide" id="storyTitle">${(config.story && config.story.title) || 'Nuestra Historia'}</h2>
      <p class="font-display-lg text-[17px] sm:text-[19px] text-deep-onyx/90 leading-[1.7] font-light tracking-wide max-w-lg mx-auto" id="storyText">${(config.story && config.story.text) || ''}</p>
    </div>

    ${hasStory ? `
    <!-- CAPA 2: Ilustración Puente Debajo de Nuestra Historia (Parallax Medio) -->
    <!-- Se posiciona debajo de Nuestra Historia, ocupando el espacio vacío hacia la Cuenta Regresiva sin encimarse -->
    <div id="illustrationBridgeHero"
      class="absolute z-30 pointer-events-none will-change-transform ${hasIllHero ? '' : 'hidden'}"
      style="${illHeroStyle}">
      <img src="${illHero.image || ''}" alt="Ilustración decorativa" class="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.35)]" loading="eager" />
    </div>` : ''}
  </section>

  <!-- ==================== 2. CUENTA REGRESIVA & CALENDARIO ==================== -->
  <!-- Top padding increases when an illustration bridge is active to receive the overlap -->
  <section id="countdownSection" class="${countdownPaddingTop} pb-20 px-margin-mobile text-center relative max-w-lg mx-auto gsap-fade-up overflow-visible ${isCountdownEnabled ? '' : 'hidden'}">

    <!-- ╔══════════════════════════════════════════╗ -->
    <!-- ║  FECHA TIPOGRÁFICA ESTILO EDITORIAL      ║ -->
    <!-- ║        MAY                               ║ -->
    <!-- ║  SATURDAY  |  23  |  AT 4 PM             ║ -->
    <!-- ╚══════════════════════════════════════════╝ -->
    <div id="heroDateBlock" class="w-full max-w-[400px] mx-auto mt-5 sm:mt-7 mb-7 py-2 gsap-fade-up select-none">

      <!-- Nombre del Mes (Sans 11-14px Medium MAYÚSCULAS tracking +2 a +3px) -->
      <p id="heroDateMonth" class="font-label-caps text-[11.5px] sm:text-[13px] tracking-[0.3em] uppercase font-medium text-antique-gold mb-3.5 text-center">
        ${dateMonthName || (config.eventDateLabel || config.eventDateShort || '').split(' ').slice(-1)[0] || 'MARZO'}
      </p>

      <!-- Fila Principal: DÍA-SEMANA | NÚMERO-GRANDE | HORA -->
      <div class="flex items-center justify-center gap-0 w-full">

        <!-- Columna Izquierda: Día de la Semana -->
        <div class="flex-1 flex justify-end pr-4 sm:pr-6">
          <p id="heroDateWeekday" class="font-label-caps text-[11px] sm:text-[12.5px] tracking-[0.25em] uppercase font-medium text-deep-onyx/80 text-right leading-tight">
            ${dateDayOfWeek || 'VIERNES'}
          </p>
        </div>

        <!-- Separador vertical izquierdo -->
        <div class="w-px h-12 sm:h-14 bg-antique-gold/40 flex-shrink-0"></div>

        <!-- Centro: Número del Día (Serif destacado como elemento gráfico de alta gama) -->
        <div class="px-5 sm:px-7 flex-shrink-0 flex items-center justify-center">
          <span id="heroDateDay" class="font-display-lg text-[64px] sm:text-[76px] md:text-[84px] font-light leading-none tracking-tight text-deep-onyx tabular-nums select-none">
            ${dateDayNumber || '20'}
          </span>
        </div>

        <!-- Separador vertical derecho -->
        <div class="w-px h-12 sm:h-14 bg-antique-gold/40 flex-shrink-0"></div>

        <!-- Columna Derecha: Hora -->
        <div class="flex-1 flex justify-start pl-4 sm:pl-6">
          <p id="heroDateTime" class="font-label-caps text-[11px] sm:text-[12.5px] tracking-[0.25em] uppercase font-medium text-deep-onyx/80 text-left leading-tight">
            ${dateTimeLabel || (config.ceremony && config.ceremony.time ? config.ceremony.time : '4:00 PM')}
          </p>
        </div>

      </div>
    </div>

    ${(() => {
      const cdPhoto = config.countdownPhoto && config.countdownPhoto.trim() ? config.countdownPhoto.trim() : '';
      const cdPhotoEnabled = config.countdownPhotoEnabled !== false;
      if (!cdPhoto || !cdPhotoEnabled) return '';
      return `
    <!-- ╔══════════════════════════════════════════╗ -->
    <!-- ║  FOTOGRAFÍA DEL CONTADOR (Entre Fecha y  ║ -->
    <!-- ║  Temporizador, a la referencia dada)      ║ -->
    <!-- ╚══════════════════════════════════════════╝ -->
    <div id="countdownPhotoWrap" class="w-full relative my-5 overflow-hidden" style="border-radius:0; min-height:220px; max-height:72vh;">
      <div id="countdownPhotoParallax" class="w-full h-full will-change-transform flex items-center justify-center">
        <img id="countdownPhotoImg"
          src="${cdPhoto}"
          alt="Foto del contador"
          loading="lazy"
          class="w-full h-auto block mx-auto"
          style="display:block; width:100%; height:auto; object-fit:contain; border-radius:0; max-height:72vh;"/>
      </div>
    </div>`;
    })()}

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
            <span id="days" class="font-display-lg text-[32px] sm:text-[36px] md:text-[40px] font-light tabular-nums leading-none tracking-tight text-deep-onyx" style="color: var(--countdown-text);">00</span>
            <span class="font-label-caps text-[9.5px] sm:text-[10px] uppercase tracking-[0.25em] mt-2 font-medium text-antique-gold">Días</span>
          </div>

          <!-- Divisor Vertical Fino -->
          <div class="w-px h-10 sm:h-11 bg-antique-gold/40 flex-shrink-0"></div>

          <!-- Horas -->
          <div class="flex-1 flex flex-col items-center">
            <span id="hours" class="font-display-lg text-[32px] sm:text-[36px] md:text-[40px] font-light tabular-nums leading-none tracking-tight text-deep-onyx" style="color: var(--countdown-text);">00</span>
            <span class="font-label-caps text-[9.5px] sm:text-[10px] uppercase tracking-[0.25em] mt-2 font-medium text-antique-gold">Horas</span>
          </div>

          <!-- Divisor Vertical Fino -->
          <div class="w-px h-10 sm:h-11 bg-antique-gold/40 flex-shrink-0"></div>

          <!-- Minutos -->
          <div class="flex-1 flex flex-col items-center">
            <span id="minutes" class="font-display-lg text-[32px] sm:text-[36px] md:text-[40px] font-light tabular-nums leading-none tracking-tight text-deep-onyx" style="color: var(--countdown-text);">00</span>
            <span class="font-label-caps text-[9.5px] sm:text-[10px] uppercase tracking-[0.25em] mt-2 font-medium text-antique-gold">Minutos</span>
          </div>

          <!-- Divisor Vertical Fino -->
          <div class="w-px h-10 sm:h-11 bg-antique-gold/40 flex-shrink-0"></div>

          <!-- Segundos -->
          <div class="flex-1 flex flex-col items-center">
            <span id="seconds" class="font-display-lg text-[32px] sm:text-[36px] md:text-[40px] font-light tabular-nums leading-none tracking-tight text-deep-onyx" style="color: var(--countdown-text);">00</span>
            <span class="font-label-caps text-[9.5px] sm:text-[10px] uppercase tracking-[0.25em] mt-2 font-medium text-antique-gold">Segundos</span>
          </div>

        </div>
      </div>

      <!-- Frase Emotiva Tipográfica y Caligráfica -->
      <div id="countdownPhraseWrap" class="mt-7 mb-2 text-center max-w-sm mx-auto ${(config.countdownPhrase || isWedding) ? '' : 'hidden'}">
        <div class="flex items-center justify-center gap-3">
          <span class="w-6 h-px bg-antique-gold/40 flex-shrink-0"></span>
          <p id="countdownPhrase" class="font-display-lg text-lg sm:text-xl text-deep-onyx/85 italic leading-none font-light">
            &ldquo;${config.countdownPhrase || (isWedding ? 'Para casarme con el amor de mi vida' : 'Para mi gran día')}&rdquo;
          </p>
          <span class="w-6 h-px bg-antique-gold/40 flex-shrink-0"></span>
        </div>
      </div>

      <!-- Botones de Calendario (Sans 11-12px Medium MAYÚSCULAS tracking +3px) -->
      <div class="flex flex-wrap justify-center items-center gap-3 mt-7">
        <a id="btnGoogleCalendar" href="#" target="_blank" rel="noopener noreferrer" class="btn-luxury-secondary text-[11px] px-5 py-2 uppercase tracking-[0.25em] font-medium inline-flex items-center gap-2">
          ${I.calendarAdd}
          <span>Google Calendar</span>
        </a>
        <button type="button" id="btnCalendar" class="btn-luxury-secondary text-[11px] px-5 py-2 uppercase tracking-[0.25em] font-medium inline-flex items-center gap-2">
          ${I.download}
          <span>Apple / .ics</span>
        </button>
      </div>
    </div>

    <!-- CAPA 2: Ilustración Puente Cuenta Regresiva → Familia (Parallax Medio) -->
    <div id="illustrationBridgeCountdown"
      class="absolute z-30 pointer-events-none will-change-transform ${hasIllCountdown ? '' : 'hidden'}"
      style="${illCountdownStyle}">
      <img src="${illCountdown.image || ''}" alt="Ilustración decorativa" class="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.35)]" loading="lazy" />
    </div>
  </section>


  <!-- Divider Line -->
  <div class="flex justify-center py-4 gsap-fade-up">
    <div class="w-24 h-[1px] bg-antique-gold/50"></div>
  </div>

  <!-- ==================== 3. FAMILIA & PADRINOS ==================== -->
  <section id="family" class="${familyPaddingTop} px-margin-mobile bg-emerald-dark text-center border-y border-antique-gold/30 relative ${isFamilyEnabled ? '' : 'hidden'}" style="overflow: visible;">
    ${(() => {
      const bg = getSectionBg(config, 'family', 0.35);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 overflow-hidden z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="max-w-2xl mx-auto relative z-10">
      <h2 id="blessingHeading" class="font-display-lg text-[28px] sm:text-[32px] font-normal text-[#f7f6ec] mb-12 px-4 gsap-title tracking-wide">
        ${config.blessingIntro || 'Con la bendición de nuestros padres'}
      </h2>

      <!-- Padres Boda (Dual) -->
      <div id="parentsWeddingGrid" class="${isWedding ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-2 gap-10 text-center gsap-stagger-container">
        <!-- Padres de la Novia -->
        <div id="brideParentsBlock" class="gsap-stagger-item ${(config.brideMother || config.brideFather) ? '' : 'hidden'}">
          <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-3 gsap-eyebrow">Padres de la Novia</p>
          <div class="flex flex-col items-center">
            <p class="font-display-lg text-lg sm:text-xl text-[#f7f6ec] font-light tracking-wide">${config.brideFather || ''}</p>
            ${(config.brideFather && config.brideMother) ? `
            <span class="font-script text-2xl sm:text-3xl text-antique-gold my-[-2px] leading-none select-none" style="font-family: var(--font-script);">&amp;</span>
            ` : ''}
            <p class="font-display-lg text-lg sm:text-xl text-[#f7f6ec] font-light tracking-wide">${config.brideMother || ''}</p>
          </div>
        </div>

        <!-- Padres del Novio -->
        <div id="groomParentsBlock" class="gsap-stagger-item ${(config.groomMother || config.groomFather) ? '' : 'hidden'}">
          <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-3 gsap-eyebrow">Padres del Novio</p>
          <div class="flex flex-col items-center">
            <p class="font-display-lg text-lg sm:text-xl text-[#f7f6ec] font-light tracking-wide">${config.groomFather || ''}</p>
            ${(config.groomFather && config.groomMother) ? `
            <span class="font-script text-2xl sm:text-3xl text-antique-gold my-[-2px] leading-none select-none" style="font-family: var(--font-script);">&amp;</span>
            ` : ''}
            <p class="font-display-lg text-lg sm:text-xl text-[#f7f6ec] font-light tracking-wide">${config.groomMother || ''}</p>
          </div>
        </div>
      </div>

      <!-- Padres XV (Single) -->
      <div id="parentsXvGrid" class="${!isWedding && (config.mother || config.father) ? 'block' : 'hidden'} gsap-stagger-item">
        <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-3 gsap-eyebrow">Mis Padres</p>
        <div class="flex flex-col items-center">
          <p class="font-display-lg text-lg sm:text-xl text-[#f7f6ec] font-light tracking-wide">${config.father || ''}</p>
          ${(config.father && config.mother) ? `
          <span class="font-script text-2xl sm:text-3xl text-antique-gold my-[-2px] leading-none select-none" style="font-family: var(--font-script);">&amp;</span>
          ` : ''}
          <p class="font-display-lg text-lg sm:text-xl text-[#f7f6ec] font-light tracking-wide">${config.mother || ''}</p>
        </div>
      </div>

      <!-- Padrinos -->
      <div id="godparentsBlock" class="mt-12 gsap-stagger-item ${(config.godmother || config.godfather) ? '' : 'hidden'}">
        <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-3 gsap-eyebrow" id="lblGodparentsSection">
          ${isWedding ? 'Padrinos de Velación' : 'Mis Padrinos'}
        </p>
        ${(config.godfather && config.godmother) ? `
        <div class="flex flex-col items-center">
          <p class="font-display-lg text-lg sm:text-xl text-[#f7f6ec] font-light tracking-wide">${config.godfather}</p>
          <span class="font-script text-2xl sm:text-3xl text-antique-gold my-[-2px] leading-none select-none" style="font-family: var(--font-script);">&amp;</span>
          <p class="font-display-lg text-lg sm:text-xl text-[#f7f6ec] font-light tracking-wide">${config.godmother}</p>
        </div>
        ` : `
        <p class="font-display-lg text-lg sm:text-xl text-[#f7f6ec] font-light tracking-wide">
          ${config.godfather || config.godmother || ''}
        </p>
        `}
      </div>

      <!-- Corte de Honor -->
      <div id="courtBlock" class="mt-10 gsap-stagger-item ${config.court && config.court.length ? '' : 'hidden'}">
        <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-3 gsap-eyebrow" id="lblCourtSection">
          ${isWedding ? 'Damas de Honor & Best Men' : 'Corte de Honor'}
        </p>
        <div class="flex flex-wrap justify-center gap-2 text-sm text-[#f7f6ec]/90 max-w-lg mx-auto font-body-lg font-normal">
          ${(config.court || []).map(m => `<span>${m}</span>`).join('<span class="text-antique-gold">·</span>')}
        </div>
      </div>
    </div>

    <!-- CAPA 2: Ilustración Puente Familia → Ubicaciones (Parallax Medio) -->
    <div id="illustrationBridgeFamily"
      class="absolute z-30 pointer-events-none will-change-transform ${hasIllFamily ? '' : 'hidden'}"
      style="${illFamilyStyle}">
      <img src="${illFamily.image || ''}" alt="Ilustración decorativa" class="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.35)]" loading="lazy" />
    </div>
  </section>

  <!-- ==================== 4. UBICACIONES (DÓNDE & CUÁNDO) ==================== -->
  <section id="details" class="${detailsPaddingTop} pb-20 px-margin-mobile text-center max-w-3xl mx-auto relative overflow-hidden ${isLocationsEnabled ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'details', 0.30);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="relative z-10 w-full">
      <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-2">Dónde y Cuándo</p>
      <h2 class="font-display-lg text-[28px] sm:text-[32px] font-normal text-deep-onyx mb-12 gsap-title tracking-wide">Ubicaciones</h2>

    <div class="space-y-12 max-w-lg mx-auto gsap-stagger-container">
      
      <!-- Ceremonia -->
      <div id="ceremonyCard" class="relative bg-white/50 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgba(165,110,14,0.08)] border border-antique-gold/50 gsap-stagger-item ${(config.ceremony && (config.ceremony.venue || config.ceremony.address)) ? '' : 'hidden'}">
        <div class="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-champagne-cream rounded-full flex items-center justify-center border border-antique-gold shadow-sm">
          ${I.church}
        </div>
        <h3 class="font-display-lg text-[21px] sm:text-[23px] font-normal text-deep-onyx mb-2 mt-4 gsap-title tracking-wide">Ceremonia Religiosa</h3>
        
        <!-- Horario Destacado con Insignia Dorada -->
        <div class="my-3 flex items-center justify-center ${(config.ceremony && config.ceremony.time) ? '' : 'hidden'}">
          <span class="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-antique-gold/[0.09] border border-antique-gold/40 shadow-[0_2px_8px_rgba(165,110,14,0.06)]">
            ${I.clock}
            <span id="ceremonyTime" class="font-label-caps text-[12px] sm:text-[13px] text-antique-gold font-semibold tracking-[0.25em] uppercase">${(config.ceremony && config.ceremony.time) || ''}</span>
          </span>
        </div>

        <p class="font-display-lg text-[18px] sm:text-[20px] text-deep-onyx leading-[1.4] font-light tracking-wide mb-1">${(config.ceremony && config.ceremony.venue) || ''}</p>
        <p class="font-display-lg text-[14.5px] sm:text-[15.5px] text-tertiary mb-6 leading-[1.65] font-light tracking-wide">${(config.ceremony && config.ceremony.address) || ''}</p>
        
        <div class="flex flex-wrap justify-center items-center gap-3">
          <a id="ceremonyMap" class="btn-luxury-primary text-[11px] uppercase tracking-[0.25em] font-medium inline-flex items-center gap-2 ${(config.ceremony && config.ceremony.mapsUrl) ? '' : 'hidden'}" href="${(config.ceremony && config.ceremony.mapsUrl) || '#'}" target="_blank" rel="noopener noreferrer">
            ${I.map}
            <span>Google Maps</span>
          </a>
          <a id="ceremonyWaze" class="btn-luxury-secondary text-[11px] uppercase tracking-[0.25em] font-medium inline-flex items-center gap-2 ${(config.ceremony && config.ceremony.wazeUrl) ? '' : 'hidden'}" href="${(config.ceremony && config.ceremony.wazeUrl) || '#'}" target="_blank" rel="noopener noreferrer">
            ${I.navigation}
            <span>Waze</span>
          </a>
        </div>
      </div>

      <!-- Recepción -->
      <div id="receptionCard" class="relative bg-white/50 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgba(165,110,14,0.08)] border border-antique-gold/50 gsap-stagger-item ${(config.reception && (config.reception.venue || config.reception.address)) ? '' : 'hidden'}">
        <div class="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-champagne-cream rounded-full flex items-center justify-center border border-antique-gold shadow-sm">
          ${I.celebration}
        </div>
        <h3 class="font-display-lg text-[21px] sm:text-[23px] font-normal text-deep-onyx mb-2 mt-4 gsap-title tracking-wide">Recepción</h3>
        
        <!-- Horario Destacado con Insignia Dorada -->
        <div class="my-3 flex items-center justify-center ${(config.reception && config.reception.time) ? '' : 'hidden'}">
          <span class="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-antique-gold/[0.09] border border-antique-gold/40 shadow-[0_2px_8px_rgba(165,110,14,0.06)]">
            ${I.clock}
            <span id="receptionTime" class="font-label-caps text-[12px] sm:text-[13px] text-antique-gold font-semibold tracking-[0.25em] uppercase">${(config.reception && config.reception.time) || ''}</span>
          </span>
        </div>

        <p class="font-display-lg text-[18px] sm:text-[20px] text-deep-onyx leading-[1.4] font-light tracking-wide mb-1">${(config.reception && config.reception.venue) || ''}</p>
        <p class="font-display-lg text-[14.5px] sm:text-[15.5px] text-tertiary mb-6 leading-[1.65] font-light tracking-wide">${(config.reception && config.reception.address) || ''}</p>

        <div class="flex flex-wrap justify-center items-center gap-3">
          <a id="receptionMap" class="btn-luxury-primary text-[11px] uppercase tracking-[0.25em] font-medium inline-flex items-center gap-2 ${(config.reception && config.reception.mapsUrl) ? '' : 'hidden'}" href="${(config.reception && config.reception.mapsUrl) || '#'}" target="_blank" rel="noopener noreferrer">
            ${I.map}
            <span>Google Maps</span>
          </a>
          <a id="receptionWaze" class="btn-luxury-secondary text-[11px] uppercase tracking-[0.25em] font-medium inline-flex items-center gap-2 ${(config.reception && config.reception.wazeUrl) ? '' : 'hidden'}" href="${(config.reception && config.reception.wazeUrl) || '#'}" target="_blank" rel="noopener noreferrer">
            ${I.navigation}
            <span>Waze</span>
          </a>
        </div>
      </div>

    </div>
    </div>
  </section>

  <!-- ==================== 5. DRESS CODE ==================== -->
  <section id="dresscode" class="py-20 px-margin-mobile bg-emerald-deep text-center border-y border-antique-gold/30 relative overflow-hidden ${isDressCodeEnabled ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'dressCode', 0.25);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="max-w-xl mx-auto relative z-10">
      ${I.dressCode}
      <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] mb-2 uppercase font-medium gsap-eyebrow">Código de Vestimenta</p>
      <h2 id="dressTitle" class="font-display-lg text-[28px] sm:text-[32px] font-normal text-[#f7f6ec] mb-4 gsap-title tracking-wide">${(config.dressCode && config.dressCode.title) || 'Formal'}</h2>
      <p id="dressDesc" class="font-display-lg text-[16px] sm:text-[18px] text-[#f7f6ec]/90 mb-8 max-w-md mx-auto leading-[1.7] font-light tracking-wide gsap-fade-up">${(config.dressCode && config.dressCode.description) || ''}</p>
      
      <div id="dressPaletteWrapper" class="flex flex-wrap justify-center items-center gap-4 sm:gap-6 gsap-fade-up ${(config.dressCode && config.dressCode.colorsEnabled !== false && config.dressCode.colorPalette && config.dressCode.colorPalette.length) ? '' : 'hidden'}">
        ${((config.dressCode && config.dressCode.colorPalette) || []).map(c => `
          <div class="flex flex-col items-center gap-2">
            <div class="w-10 h-10 rounded-full border border-antique-gold/60 shadow-sm transition-transform hover:scale-105" style="background-color: ${c.hex};"></div>
            <span class="font-label-caps text-[10px] text-[#f7f6ec]/80 tracking-wider uppercase font-medium">${c.name}</span>
          </div>
        `).join('')}

        <div class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-error/50 shadow-sm relative">
            <div class="absolute inset-0 border-2 border-error rounded-full opacity-60"></div>
            <div class="w-full h-[2px] bg-error absolute rotate-45 opacity-60"></div>
          </div>
          <span class="font-label-caps text-[10px] text-error uppercase tracking-wider font-medium">Blanco / Perla</span>
        </div>
      </div>

      <p class="font-display-lg text-xs text-[#f7f6ec]/65 italic mt-6 font-light ${(config.dressCode && config.dressCode.reservedColorsNote) ? '' : 'hidden'}">
        ${(config.dressCode && config.dressCode.reservedColorsNote) || ''}
      </p>
    </div>
  </section>

  <!-- ==================== 6. GALERÍA FOTOGRÁFICA ==================== -->
  <section id="galeria" class="py-16 px-margin-mobile max-w-xl mx-auto relative overflow-hidden ${isGalleryEnabled ? '' : 'hidden'}">
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
        <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-2">Momentos Inolvidables</p>
        <h2 class="font-display-lg text-[28px] sm:text-[32px] font-normal text-deep-onyx tracking-wide">Galería de Recuerdos</h2>
      </div>
      
      <!-- Galería Editorial: Fotos Completas, Sin Esquinas Redondeadas, Con Parallax Individual -->
      <div class="w-full flex flex-col gap-3" id="galleryGrid">
        ${((config.photos && config.photos.gallery) || []).map((url, i) => url ? `
          <div class="gallery-item-wrap w-full relative will-change-transform" style="overflow: visible;">
            <!-- Marco interior que contiene la foto sin recortar -->
            <div class="w-full relative overflow-hidden" style="border-radius: 0; border: 1px solid rgba(193,150,79,0.35);">
              <img src="${url}" alt="Foto ${i+1}" loading="lazy"
                class="gallery-photo w-full h-auto block"
                style="display:block; width:100%; height:auto; object-fit:contain; border-radius:0; will-change:transform;"/>
            </div>
          </div>
        ` : '').join('')}
      </div>
    </div>
  </section>

  <!-- ==================== 7. MESA DE REGALOS & TRANSFERENCIA ==================== -->
  <section id="giftregistry" class="py-20 px-margin-mobile text-center max-w-xl mx-auto relative overflow-hidden ${isGiftRegistryEnabled ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'giftRegistry', 0.25);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="relative z-10 w-full">
      <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-2">Mesa de Regalos</p>
      <h2 class="font-display-lg text-[28px] sm:text-[32px] font-normal text-deep-onyx mb-4 gsap-title tracking-wide">Mesa de Regalos</h2>
      <p id="giftIntro" class="font-display-lg text-[16px] sm:text-[18px] text-deep-onyx/85 mb-8 max-w-md mx-auto leading-[1.7] font-light tracking-wide gsap-fade-up">
        ${(config.giftRegistry && config.giftRegistry.intro) || 'El mejor regalo es tu presencia, pero si deseas tener un detalle con nosotros, te sugerimos nuestras opciones:'}
      </p>

      <!-- Tiendas -->
      <div class="flex flex-col gap-4 max-w-sm mx-auto gsap-stagger-container mb-8">
        ${((config.giftRegistry && config.giftRegistry.stores) || []).map(store => `
          <a class="bg-white/60 backdrop-blur-sm border border-antique-gold/40 p-5 flex items-center justify-between shadow-sm hover:bg-white/90 hover:shadow-md transition-all gsap-stagger-item rounded-2xl" href="${store.url || '#'}" target="_blank" rel="noopener noreferrer">
            <span class="font-label-caps text-[11px] text-deep-onyx tracking-[0.25em] uppercase font-medium">${store.name}</span>
            <span class="flex items-center gap-1.5 font-body-lg text-sm text-antique-gold font-normal">
              ${store.code ? `<span>${store.code}</span>` : ''}
              ${I.externalLink}
            </span>
          </a>
        `).join('')}
      </div>

      <!-- Datos Bancarios (CLABE) -->
      <div id="bankInfoCard" class="bg-white/70 backdrop-blur-sm border border-antique-gold/50 p-6 rounded-2xl max-w-sm mx-auto text-left shadow-sm ${(config.giftRegistry && config.giftRegistry.bank && config.giftRegistry.bank.clabe) ? '' : 'hidden'}">
        <div class="flex items-center gap-2.5 mb-3">
          ${I.bank}
          <span class="font-label-caps text-[11px] text-antique-gold uppercase tracking-[0.25em] font-medium">Transferencia Bancaria</span>
        </div>
        <p id="giftBankName" class="font-display-lg text-[18px] sm:text-[20px] text-deep-onyx font-normal">${(config.giftRegistry && config.giftRegistry.bank && config.giftRegistry.bank.bankName) || 'Banco'}</p>
        <p id="giftBankHolder" class="font-display-lg text-[13.5px] sm:text-[14.5px] text-tertiary mb-3 font-light">${(config.giftRegistry && config.giftRegistry.bank && config.giftRegistry.bank.holder) ? `Titular: ${config.giftRegistry.bank.holder}` : ''}</p>
        
        <div class="flex items-center justify-between gap-2 p-2.5 bg-champagne-cream rounded-full border border-antique-gold/30 px-4">
          <span id="clabeText" class="font-mono text-xs text-deep-onyx tracking-wider select-all font-normal">${(config.giftRegistry && config.giftRegistry.bank && config.giftRegistry.bank.clabe) || ''}</span>
          <button type="button" id="btnCopyClabe" class="btn-luxury-primary text-[11px] px-3.5 py-1 uppercase tracking-[0.25em] font-medium inline-flex items-center gap-1.5">
            ${I.copy}
            <span>Copiar</span>
          </button>
        </div>
      </div>

      <p id="giftEnvelopeNote" class="font-display-lg text-sm text-tertiary/80 italic mt-6 font-light tracking-wide ${(config.giftRegistry && config.giftRegistry.envelopeNote) ? '' : 'hidden'}">
        ${(config.giftRegistry && config.giftRegistry.envelopeNote) || ''}
      </p>
    </div>
  </section>

  <!-- ==================== 8. PROGRAMA / ITINERARIO ==================== -->
  <section id="itinerario" class="py-20 px-margin-mobile text-center max-w-2xl mx-auto relative overflow-hidden ${isItineraryEnabled ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'itinerary', 0.30);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="relative z-10 w-full">
      <div class="mb-12 gsap-fade-up overflow-visible">
        <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-2">Itinerario del Evento</p>
        <h2 class="font-display-lg font-normal mb-2 overflow-visible heading-script-scaled text-deep-onyx tracking-wide ${titleEffectClass}">Programa</h2>
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
                    <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold font-medium uppercase tracking-wider">${step.time || ''}</p>
                    <p class="font-display-lg text-base sm:text-lg text-deep-onyx font-normal mt-0.5 leading-snug tracking-wide">${step.label || ''}</p>
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
                    <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold font-medium uppercase tracking-wider">${step.time || ''}</p>
                    <p class="font-display-lg text-base sm:text-lg text-deep-onyx font-normal mt-0.5 leading-snug tracking-wide">${step.label || ''}</p>
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

  <!-- ==================== 8.5 ÁLBUM COLABORATIVO (GOOGLE PHOTOS / DRIVE) ==================== -->
  <section id="albumColaborativo" class="py-20 px-margin-mobile text-center max-w-xl mx-auto relative overflow-hidden ${isSharedAlbumEnabled ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'sharedAlbum', 0.25);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="bg-white/60 backdrop-blur-xl border border-antique-gold/40 p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgba(165,110,14,0.08)] relative z-10 overflow-hidden gsap-scale-up">
      
      <div class="w-14 h-14 bg-champagne-cream rounded-full flex items-center justify-center border border-antique-gold shadow-sm mx-auto mb-4 text-antique-gold">
        ${I.photoAlbum}
      </div>

      <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-2" id="albumSubtitle">
        ${(config.sharedAlbum && config.sharedAlbum.subtitle) || 'Recuerdos del Gran Día'}
      </p>

      <h3 class="font-display-lg text-[28px] sm:text-[32px] font-normal text-deep-onyx mb-3 tracking-wide" id="albumTitle">
        ${(config.sharedAlbum && config.sharedAlbum.title) || 'Álbum Colaborativo'}
      </h3>

      <p class="font-display-lg text-[16px] sm:text-[17.5px] text-deep-onyx/85 leading-[1.7] mb-6 max-w-md mx-auto font-light tracking-wide" id="albumDescription">
        ${(config.sharedAlbum && config.sharedAlbum.description) || '¡Ayúdanos a capturar cada momento! Sube aquí todas las fotos y videos que tomes durante nuestro gran día usando tu código personalizado de invitado.'}
      </p>

      <!-- Tarjeta con Código Personalizado de Acceso -->
      <div class="bg-champagne-cream/90 border border-antique-gold/50 rounded-2xl p-4 sm:p-5 max-w-xs mx-auto mb-6 shadow-sm">
        <span class="font-label-caps text-[9.5px] uppercase tracking-[0.25em] text-antique-gold font-medium block mb-1">
          Tu Código de Acceso
        </span>
        <div class="flex items-center justify-between gap-2 mt-2 bg-white/80 rounded-full px-4 py-2 border border-antique-gold/30">
          <span id="albumAccessCode" class="font-mono text-sm sm:text-base font-semibold text-deep-onyx tracking-widest select-all">
            ${(config.sharedAlbum && config.sharedAlbum.accessCode) || 'BODA2027'}
          </span>
          <button type="button" id="btnCopyAlbumCode" class="btn-luxury-primary text-[11px] px-3 py-1 uppercase tracking-[0.25em] font-medium flex items-center gap-1.5">
            ${I.copy}
            <span>Copiar</span>
          </button>
        </div>
      </div>

      <!-- Botón de Acción Principal -->
      <a id="btnOpenAlbum" href="${(config.sharedAlbum && config.sharedAlbum.albumUrl) || 'https://photos.google.com'}" target="_blank" rel="noopener noreferrer" class="btn-luxury-primary text-[11px] py-3 px-6 uppercase tracking-[0.25em] font-medium shadow-md inline-flex items-center gap-2">
        ${I.cloudUpload}
        <span>Subir Fotos al Álbum</span>
      </a>

    </div>
  </section>

  <!-- ==================== 9. HASHTAG / INSTAGRAM ==================== -->
  <section id="instagramSection" class="py-16 px-margin-mobile bg-emerald-deep text-center border-y border-antique-gold/30 relative overflow-hidden ${isInstagramEnabled ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'instagram', 0.25);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="max-w-md mx-auto relative z-10">
      ${I.camera}
      <p class="font-label-caps text-[11px] sm:text-[12px] text-antique-gold tracking-[0.25em] uppercase font-medium mb-2">Comparte tus Recuerdos</p>
      <h3 id="instagramHashtag" class="font-display-lg text-2xl sm:text-3xl font-light text-[#f7f6ec] mb-4 tracking-wide">${(config.instagram && config.instagram.hashtag) || ''}</h3>
      <p id="instagramText" class="font-display-lg text-[15.5px] sm:text-[17px] text-[#f7f6ec]/90 mb-6 leading-[1.7] font-light tracking-wide">${(config.instagram && config.instagram.text) || 'Usa nuestro hashtag oficial en tus publicaciones e historias de Instagram.'}</p>
      
      <button type="button" id="btnCopyHashtag" class="btn-luxury-secondary-dark text-[11px] uppercase tracking-[0.25em] font-medium inline-flex items-center gap-1.5">
        ${I.copy}
        <span>Copiar Hashtag</span>
      </button>
    </div>
  </section>

  <!-- ==================== 10. RSVP (CONFIRMACIÓN & QR PASS) ==================== -->
  <section id="rsvp" class="py-24 px-margin-mobile bg-emerald-dark text-center relative overflow-hidden border-t border-antique-gold/30 ${isRsvpEnabled ? '' : 'hidden'}">
    ${(() => {
      const bg = getSectionBg(config, 'rsvp', 0.35);
      return (bg.image && bg.image.trim()) ? `
        <div class="absolute inset-0 z-0 pointer-events-none" style="opacity: ${bg.opacity};">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('${bg.image}');"></div>
        </div>
      ` : '';
    })()}
    <div class="relative z-10 max-w-md mx-auto gsap-scale-up overflow-visible">
      <!-- RSVP como elemento gráfico tipográfico editorial de gran escala -->
      <p class="font-display-lg text-[52px] sm:text-[62px] md:text-[72px] font-light tracking-[0.12em] uppercase leading-none overflow-visible ${titleEffectClass} mb-2">RSVP</p>
      <h2 class="font-display-lg mb-3 font-normal gsap-title overflow-visible heading-script-scaled text-[#f7f6ec]/90 tracking-wide">Confirma tu Asistencia</h2>
      <p id="rsvpDeadline" class="font-display-lg text-[16px] sm:text-[18px] text-[#f7f6ec]/80 mb-8 gsap-fade-up font-light tracking-wide">
        ${config.rsvpDeadlineLabel || 'Por favor, haznos saber si podrás acompañarnos.'}
      </p>

      <form id="rsvpForm" class="flex flex-col gap-5 text-left gsap-fade-up bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-antique-gold/40 shadow-xl" novalidate>
        
        <!-- Nombre -->
        <div class="flex flex-col gap-2">
          <label class="font-label-caps text-[11px] text-antique-gold uppercase tracking-[0.25em] font-medium">Nombre Completo</label>
          <input id="formGuestName" name="nombre" required class="w-full bg-white/15 border border-antique-gold/50 rounded-full px-5 py-3 font-body-lg text-[#f7f6ec] focus:outline-none focus:border-antique-gold transition-colors placeholder:text-[#f7f6ec]/40 text-sm" placeholder="Escribe tu nombre y apellidos" type="text"/>
        </div>

        <!-- Teléfono -->
        <div class="flex flex-col gap-2">
          <label class="font-label-caps text-[11px] text-antique-gold uppercase tracking-[0.25em] font-medium">Teléfono / WhatsApp</label>
          <input name="telefono" class="w-full bg-white/15 border border-antique-gold/50 rounded-full px-5 py-3 font-body-lg text-[#f7f6ec] focus:outline-none focus:border-antique-gold transition-colors placeholder:text-[#f7f6ec]/40 text-sm" placeholder="Para enviar recordatorios" type="tel"/>
        </div>

        <!-- Asistencia -->
        <div class="flex flex-col gap-3">
          <label class="font-label-caps text-[11px] text-antique-gold uppercase tracking-[0.25em] font-medium">¿Asistirás?</label>
          <div class="flex flex-col gap-2.5">
            <label class="flex items-center gap-3 cursor-pointer p-3 border border-antique-gold/40 rounded-xl bg-[#0d130e]/40 hover:bg-[#0d130e]/60 transition-colors">
              <input class="accent-antique-gold w-4 h-4" name="rsvp" value="si" checked type="radio"/>
              <span class="font-body-lg text-sm text-[#f7f6ec] font-normal">Sí, con mucho gusto asistiré</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer p-3 border border-antique-gold/40 rounded-xl bg-[#0d130e]/40 hover:bg-[#0d130e]/60 transition-colors">
              <input class="accent-antique-gold w-4 h-4" name="rsvp" value="no" type="radio"/>
              <span class="font-body-lg text-sm text-[#f7f6ec] font-normal">Lamentablemente no podré asistir</span>
            </label>
          </div>
        </div>

        <!-- Selector de Pases (Restringido por URL VIP) -->
        <div id="rsvpTicketsRow" class="flex items-center justify-between p-3.5 bg-[#0d130e]/40 border border-antique-gold/40 rounded-xl">
          <div>
            <span class="font-label-caps text-[11px] text-antique-gold uppercase tracking-[0.25em] block font-medium">Pases Autorizados</span>
            <span id="allowedTicketsHint" class="text-[11px] text-[#f7f6ec]/70 font-normal">Máximo 2 personas</span>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" class="stepper__btn w-8 h-8 rounded-full border border-antique-gold bg-antique-gold/20 text-[#f7f6ec] flex items-center justify-center font-bold text-base hover:bg-antique-gold transition-colors" data-step="-1">-</button>
            <span id="guestCount" class="font-display-lg text-lg text-[#f7f6ec] font-light tabular-nums min-w-[20px] text-center">1</span>
            <button type="button" class="stepper__btn w-8 h-8 rounded-full border border-antique-gold bg-antique-gold/20 text-[#f7f6ec] flex items-center justify-center font-bold text-base hover:bg-antique-gold transition-colors" data-step="1">+</button>
          </div>
        </div>

        <button type="submit" id="rsvpSubmit" class="btn-luxury-primary w-full py-3.5 text-[11px] tracking-[0.25em] uppercase font-medium shadow-[0_4px_20px_rgba(165,110,14,0.4)] mt-2">
          Confirmar Asistencia
        </button>
      </form>

      <!-- Pase de Acceso con Código QR -->
      <div id="rsvpSuccess" class="hidden mt-6 bg-white text-deep-onyx p-6 sm:p-8 rounded-2xl border-2 border-dashed border-antique-gold shadow-2xl max-w-sm mx-auto text-center">
        <span class="font-script text-3xl text-antique-gold block">Pase de Acceso</span>
        <span class="font-display-lg text-sm tracking-widest text-deep-onyx font-normal block mt-1" id="qrEventTitle">${safeTitle}</span>
        
        <hr class="border-t border-antique-gold/30 my-4"/>
        
        <p class="font-body-lg text-base font-medium text-deep-onyx" id="qrGuestName"></p>
        <p class="font-body-lg text-xs text-tertiary mt-1 font-normal" id="qrGuestTickets"></p>
        
        <div id="qrContainer" class="flex justify-center my-4"></div>
        
        <p class="font-mono text-[10px] text-tertiary tracking-widest uppercase" id="qrFolio"></p>
        <p class="font-body-lg text-[11px] text-tertiary/80 mt-3 font-normal">Presenta este código QR en la entrada del evento para validar tu ingreso.</p>
      </div>

    </div>
  </section>

</div>

<!-- ==================== 11. FOOTER ==================== -->
<footer class="pt-16 pb-24 px-margin-mobile text-center bg-emerald-deep border-t border-antique-gold/30">
  ${(config.footerClosing !== undefined ? config.footerClosing : 'Con amor,') ? `
  <p class="font-script font-normal mb-1 gsap-fade-up overflow-visible text-2xl sm:text-3xl text-antique-gold" id="footerClosing">
    ${config.footerClosing !== undefined ? config.footerClosing : 'Con amor,'}
  </p>` : ''}
  <p class="font-names text-base sm:text-lg text-[#f7f6ec] tracking-[0.25em] uppercase font-light gsap-fade-up" id="footerNames" style="font-family: var(--font-names, var(--font-display));">
    ${fullDisplayName}
  </p>
  ${(config.footerText && config.footerText.trim()) ? `
  <p class="font-display-lg text-[14px] sm:text-[15px] text-[#f7f6ec]/60 mt-3 tracking-wider font-light" id="footerCustomText">
    ${config.footerText}
  </p>` : ''}

  <!-- ==================== TARJETA DISCRETA DE CONTRATACIÓN (WHATSAPP) ==================== -->
  <div id="vendorCard" class="mt-8 pt-6 border-t border-antique-gold/20 max-w-xs mx-auto gsap-fade-up ${(vendorCard.enabled !== false) ? '' : 'hidden'}">
    <p class="font-label-caps text-[9.5px] sm:text-[10px] text-antique-gold/90 tracking-[0.2em] mb-1 font-medium" id="vendorCardBadge">
      ${vendorCard.badge || '¿Deseas una invitación como esta?'}
    </p>
    <p class="font-body-lg text-[11.5px] text-[#f7f6ec]/65 leading-relaxed mb-3.5 max-w-[260px] mx-auto font-normal" id="vendorCardDesc">
      ${vendorCard.description || 'Diseño digital interactivo y exclusivo para Bodas, XV Años y Eventos Especiales.'}
    </p>
    <a id="btnVendorWhatsapp" href="${vendorWaLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-antique-gold/30 hover:border-antique-gold/60 text-antique-gold hover:text-[#f7f6ec] text-[9.5px] sm:text-[10px] font-label-caps tracking-[0.15em] uppercase font-medium transition-all duration-300 shadow-none">
      <svg class="w-3 h-3 fill-current flex-shrink-0" viewBox="0 0 24 24">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.088-1.928-.445-1.464-.606-2.433-2.094-2.511-2.198-.078-.104-.619-.824-.619-1.571 0-.748.39-1.116.529-1.268.139-.152.304-.19.405-.19.102 0 .204.002.294.007.095.006.223-.036.348.265.13.313.444 1.084.483 1.163.039.078.065.17.013.273-.052.103-.078.167-.156.257-.078.091-.163.203-.233.272-.078.077-.16.16-.069.316.091.156.404.667.867 1.079.596.53 1.099.694 1.255.772.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.348-.078.14.052.887.418 1.04.495.153.078.256.117.294.182.039.065.039.378-.105.783z"/>
      </svg>
      <span id="vendorCardBtnText">${vendorCard.buttonText || 'Solicitar Información por WhatsApp'}</span>
    </a>
    ${(vendorCard.showAgencyNote !== false && vendorCard.agencyName) ? `
    <span class="font-label-caps text-[8.5px] text-[#f7f6ec]/35 tracking-[0.2em] uppercase font-medium block mt-2.5" id="vendorCardAgency">
      ${vendorCard.agencyName}
    </span>` : ''}
  </div>
</footer>

<!-- ==================== REPRODUCTOR DE MÚSICA DISCRETO EN LA PARTE INFERIOR ==================== -->
<div id="musicPlayer" class="fixed right-4 bottom-20 z-40 ${hasMusic ? 'flex' : 'hidden'} items-center gap-2.5 px-3.5 py-2 bg-champagne-cream/95 backdrop-blur-xl border border-antique-gold/40 rounded-full shadow-[0_6px_25px_rgba(165,110,14,0.18)] cursor-pointer transition-all duration-300 hover:border-antique-gold hover:shadow-[0_8px_30px_rgba(165,110,14,0.28)]">
  <audio id="musicAudio" loop preload="auto" src="${musicConfig.url || ''}"></audio>
  
  <button id="musicToggle" type="button" aria-label="Música" class="w-7 h-7 rounded-full bg-antique-gold text-white flex items-center justify-center shadow-sm flex-shrink-0 transition-transform active:scale-90">
    <span id="musicIconPlay" class="flex items-center justify-center">${I.play}</span>
    <span id="musicIconPause" class="hidden flex items-center justify-center">${I.pause}</span>
  </button>
  
  <div id="musicEq" class="flex items-end gap-[3px] h-3.5 flex-shrink-0 px-0.5">
    <span class="eq-bar w-[2.5px] bg-antique-gold rounded-full" style="animation-delay:0ms;"></span>
    <span class="eq-bar w-[2.5px] bg-antique-gold rounded-full" style="animation-delay:200ms;"></span>
    <span class="eq-bar w-[2.5px] bg-antique-gold rounded-full" style="animation-delay:400ms;"></span>
  </div>
  
  <div class="flex flex-col text-left pr-1.5 overflow-hidden">
    <span id="musicStatus" class="font-label-caps text-[8px] uppercase tracking-[0.2em] text-antique-gold font-bold leading-none">Música</span>
    <span id="musicTitle" class="font-label-caps text-[10px] text-deep-onyx tracking-wider max-w-[110px] sm:max-w-[130px] truncate font-medium mt-0.5">
      ${musicConfig.title || 'Canción de los Novios'}
    </span>
  </div>
</div>

</main>

<!-- ==================== BARRA DE NAVEGACIÓN INFERIOR MÓVIL ==================== -->
<nav class="fixed bottom-0 w-full z-50 bg-champagne-cream/90 backdrop-blur-xl pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-antique-gold/20">
  <div class="flex justify-around items-center h-16 max-w-md mx-auto px-4">
    <button type="button" data-nav="hero" class="flex flex-col items-center justify-center gap-1 text-antique-gold font-bold transition-colors bg-transparent border-0 cursor-pointer p-0 select-none">
      ${I.navHome}
      <span class="font-label-caps text-[9px] uppercase tracking-wider">Inicio</span>
    </button>
    <button type="button" data-nav="details" class="flex flex-col items-center justify-center gap-1 text-tertiary hover:text-antique-gold transition-colors bg-transparent border-0 cursor-pointer p-0 select-none ${isLocationsEnabled ? '' : 'hidden'}">
      ${I.navLocation}
      <span class="font-label-caps text-[9px] uppercase tracking-wider">Lugar</span>
    </button>
    <button type="button" data-nav="galeria" class="flex flex-col items-center justify-center gap-1 text-tertiary hover:text-antique-gold transition-colors bg-transparent border-0 cursor-pointer p-0 select-none ${isGalleryEnabled ? '' : 'hidden'}">
      ${I.navGallery}
      <span class="font-label-caps text-[9px] uppercase tracking-wider">Galería</span>
    </button>
    <button type="button" data-nav="itinerario" class="flex flex-col items-center justify-center gap-1 text-tertiary hover:text-antique-gold transition-colors bg-transparent border-0 cursor-pointer p-0 select-none ${isItineraryEnabled ? '' : 'hidden'}">
      ${I.navSchedule}
      <span class="font-label-caps text-[9px] uppercase tracking-wider">Programa</span>
    </button>
    <button type="button" data-nav="rsvp" class="flex flex-col items-center justify-center gap-1 text-tertiary hover:text-antique-gold transition-colors bg-transparent border-0 cursor-pointer p-0 select-none ${isRsvpEnabled ? '' : 'hidden'}">
      ${I.navRsvp}
      <span class="font-label-caps text-[9px] uppercase tracking-wider">RSVP</span>
    </button>
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
    const span = btnCopyClabe.querySelector('span:last-child') || btnCopyClabe;
    const prev = span.textContent;
    span.textContent = '¡Copiado!';
    setTimeout(() => { span.textContent = prev; }, 1800);
  });
}

const btnCopyHashtag = document.getElementById('btnCopyHashtag');
if(btnCopyHashtag){
  btnCopyHashtag.addEventListener('click', async () => {
    const tag = (CONFIG.instagram && CONFIG.instagram.hashtag) || '';
    try { await navigator.clipboard.writeText(tag); } catch(e){}
    const span = btnCopyHashtag.querySelector('span:last-child') || btnCopyHashtag;
    const prev = span.textContent;
    span.textContent = '¡Copiado!';
    setTimeout(() => { span.textContent = prev; }, 1800);
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

// 7. Navegación fluida y desplazamiento suave sin redireccionar la ventana principal
function scrollToSection(targetId) {
  if (!targetId) return;
  const cleanId = targetId.replace(/^#/, '');
  const el = document.getElementById(cleanId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Actualizar estado activo en los botones de navegación inferior
    document.querySelectorAll('nav [data-nav]').forEach(btn => {
      const isCurrent = btn.getAttribute('data-nav') === cleanId;
      if (isCurrent) {
        btn.classList.add('text-antique-gold', 'font-bold');
        btn.classList.remove('text-tertiary');
      } else {
        btn.classList.remove('text-antique-gold', 'font-bold');
        btn.classList.add('text-tertiary');
      }
    });
  }
}

document.querySelectorAll('[data-nav]').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    scrollToSection(this.getAttribute('data-nav'));
  });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href && href.length > 1) {
      e.preventDefault();
      e.stopPropagation();
      scrollToSection(href);
    }
  });
});

// 8. GSAP Smooth Scroll Animations & Timeline Progress
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

    if (illBridgeHero && !illBridgeHero.classList.contains('hidden')) {
      // CAPA 2 — Ilustración puente Hero / Historia: plano intermedio con velocidad configurable
      const heroParallaxSpeed = ${Number(illHero.parallaxSpeed !== undefined ? illHero.parallaxSpeed : 25)};
      const triggerSec = illBridgeHero.closest('section') || heroSection;
      gsap.to(illBridgeHero, {
        yPercent: -heroParallaxSpeed,
        ease: 'none',
        scrollTrigger: {
          trigger: triggerSec,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8
        }
      });
    }

    const illBridgeCountdown = document.getElementById('illustrationBridgeCountdown');

    // ── Parallax Foto del Contador (sutil vertical) ──────────────────────────
    const countdownPhotoWrap = document.getElementById('countdownPhotoWrap');
    const countdownPhotoImg  = document.getElementById('countdownPhotoImg');
    if (countdownPhotoWrap && countdownPhotoImg) {
      gsap.set(countdownPhotoImg, { scale: 1.08, transformOrigin: 'center center' });
      gsap.fromTo(countdownPhotoImg,
        { y: -20 },
        {
          y: 20,
          ease: 'none',
          scrollTrigger: {
            trigger: countdownPhotoWrap,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5
          }
        }
      );
    }

    if (illBridgeCountdown && !illBridgeCountdown.classList.contains('hidden')) {
      // CAPA 2 — Ilustración puente Cuenta Regresiva → Familia: parallax marcado
      const cdParallaxSpeed = ${Number(illCountdown.parallaxSpeed !== undefined ? illCountdown.parallaxSpeed : 25)};
      const triggerSec = illBridgeCountdown.closest('section') || countdownSection;
      gsap.to(illBridgeCountdown, {
        yPercent: -cdParallaxSpeed,
        ease: 'none',
        scrollTrigger: {
          trigger: triggerSec,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8
        }
      });
    }

    if (familySection && illBridgeFamily && !illBridgeFamily.classList.contains('hidden')) {
      // CAPA 2 — Ilustración puente Familia: parallax marcado con velocidad configurable
      const familyParallaxSpeed = ${Number(illFamily.parallaxSpeed !== undefined ? illFamily.parallaxSpeed : 25)};
      gsap.to(illBridgeFamily, {
        yPercent: -familyParallaxSpeed,
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
    [illBridgeHero, illBridgeCountdown, illBridgeFamily].forEach(el => {
      if (el && !el.classList.contains('hidden')) {
        gsap.fromTo(el,
          { opacity: 0, scale: 0.82, y: 70 },
          { opacity: 1, scale: 1, y: 0, duration: 1.6, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 98%', toggleActions: 'play none none reverse' }
          }
        );
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PARALLAX GALERÍA: Cada foto se desplaza en scroll creando efecto de profundidad.
    // La imagen se escala un 6% extra para tener margen de viaje sin recortar la composición.
    // El contenedor interno (overflow:hidden) sólo oculta el margen de escala, nunca la foto.
    // ─────────────────────────────────────────────────────────────────────────
    document.querySelectorAll('.gallery-item-wrap').forEach((wrap) => {
      const photo = wrap.querySelector('.gallery-photo');
      const inner = wrap.querySelector('div');
      if (photo && inner) {
        inner.style.overflow = 'hidden';
        // Escala la foto 6% para que el viaje ±14px use sólo el margen de escala
        gsap.set(photo, { scale: 1.06, transformOrigin: 'center center' });
        gsap.fromTo(photo,
          { y: -14 },
          {
            y: 14,
            ease: 'none',
            scrollTrigger: {
              trigger: wrap,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2
            }
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
