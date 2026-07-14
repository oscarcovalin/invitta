(function () {
  "use strict";

  const palettes = {
    "sage-editorial": {
      background: "#FAF9F7",
      surface: "#FFFFFF",
      primary: "#596452",
      secondary: "#7A8471",
      accent: "#C5A46D",
      text: "#1E211E",
      muted: "#747970"
    },
    "rose-champagne": {
      background: "#FFF8FB",
      surface: "#FFFFFF",
      primary: "#B97D88",
      secondary: "#D4A3A3",
      accent: "#B88A3D",
      text: "#3A2828",
      muted: "#8C7478"
    },
    "emerald-gold": {
      background: "#091712",
      surface: "#10231B",
      primary: "#D4AF37",
      secondary: "#2E7D52",
      accent: "#D9BC69",
      text: "#F4F0E4",
      muted: "#A4B3A7"
    },
    "ivory-sage": {
      background: "#FAF6EF",
      surface: "#FFFDF9",
      primary: "#7A9068",
      secondary: "#B89B6A",
      accent: "#B89B6A",
      text: "#2C2C2C",
      muted: "#817B72"
    },
    "olive-romance": {
      background: "#F8F3EA",
      surface: "#FFFFFF",
      primary: "#89745A",
      secondary: "#68765A",
      accent: "#B87C55",
      text: "#2C2924",
      muted: "#756E65"
    },
    "plum-noir": {
      background: "#0D0810",
      surface: "#1A0D18",
      primary: "#D4AF37",
      secondary: "#5A203E",
      accent: "#B8895B",
      text: "#F5EDD8",
      muted: "#AA967D"
    }
  };

  const typography = {
    "editorial-modern": {
      script: "Cormorant Garamond",
      heading: "Cormorant Garamond",
      body: "Montserrat"
    },
    "romantic-script": {
      script: "Great Vibes",
      heading: "Cormorant Garamond",
      body: "Jost"
    },
    "regal-editorial": {
      script: "Italiana",
      heading: "Cormorant Garamond",
      body: "Manrope"
    },
    "classic-wedding": {
      script: "Cormorant Garamond",
      heading: "Cormorant Garamond",
      body: "Jost"
    },
    "garden-romance": {
      script: "Allura",
      heading: "Playfair Display",
      body: "Jost"
    },
    "noir-luxury": {
      script: "Bodoni Moda",
      heading: "Cormorant Garamond",
      body: "Manrope"
    }
  };

  const packages = {
    essential: { label: "Esencial", price: 399, activeMonths: 2 },
    premium: { label: "Premium", price: 699, activeMonths: 4 },
    vip: { label: "VIP Experience", price: 999, activeMonths: 12 }
  };

  const templates = {
    "xv-essential": {
      eventType: "xv",
      tier: "essential",
      showcase: "Ana Camila Zavala",
      palette: "sage-editorial",
      typography: "editorial-modern",
      motion: "editorial-fade",
      allowedPalettes: ["sage-editorial", "rose-champagne", "ivory-sage"],
      allowedTypography: ["editorial-modern", "romantic-script", "classic-wedding"]
    },
    "xv-premium": {
      eventType: "xv",
      tier: "premium",
      showcase: "Regina Torres",
      palette: "rose-champagne",
      typography: "romantic-script",
      motion: "soft-rise",
      allowedPalettes: ["rose-champagne", "sage-editorial", "ivory-sage"],
      allowedTypography: ["romantic-script", "editorial-modern", "garden-romance"]
    },
    "xv-vip": {
      eventType: "xv",
      tier: "vip",
      showcase: "Isabella Morales",
      palette: "emerald-gold",
      typography: "regal-editorial",
      motion: "cinematic-fade",
      allowedPalettes: ["emerald-gold", "plum-noir", "rose-champagne"],
      allowedTypography: ["regal-editorial", "noir-luxury", "romantic-script"]
    },
    "wedding-essential": {
      eventType: "boda",
      tier: "essential",
      showcase: "Sofia y Alejandro",
      palette: "ivory-sage",
      typography: "classic-wedding",
      motion: "editorial-fade",
      allowedPalettes: ["ivory-sage", "sage-editorial", "olive-romance"],
      allowedTypography: ["classic-wedding", "editorial-modern", "garden-romance"]
    },
    "wedding-premium": {
      eventType: "boda",
      tier: "premium",
      showcase: "Mariana y Diego",
      palette: "olive-romance",
      typography: "garden-romance",
      motion: "soft-rise",
      allowedPalettes: ["olive-romance", "ivory-sage", "plum-noir"],
      allowedTypography: ["garden-romance", "classic-wedding", "noir-luxury"]
    },
    "wedding-vip": {
      eventType: "boda",
      tier: "vip",
      showcase: "Valentina y Sebastian",
      palette: "plum-noir",
      typography: "noir-luxury",
      motion: "cinematic-fade",
      allowedPalettes: ["plum-noir", "emerald-gold", "olive-romance"],
      allowedTypography: ["noir-luxury", "regal-editorial", "garden-romance"]
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getRequestedPreset(parameter, allowed, fallback) {
    const requested = new URLSearchParams(window.location.search).get(parameter);
    return requested && allowed.includes(requested) ? requested : fallback;
  }

  function loadFont(fontName) {
    if (!fontName) return;

    const id = `invitta-font-${fontName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap`;
    document.head.appendChild(link);
  }

  function applyRootTheme(palette, fonts) {
    const root = document.documentElement;
    const variables = {
      "--invitta-background": palette.background,
      "--invitta-surface": palette.surface,
      "--invitta-primary": palette.primary,
      "--invitta-secondary": palette.secondary,
      "--invitta-accent": palette.accent,
      "--invitta-text": palette.text,
      "--invitta-muted": palette.muted,
      "--primary-color": palette.primary,
      "--secondary-color": palette.secondary,
      "--accent-color": palette.accent,
      "--bg-color": palette.background,
      "--surface-color": palette.surface,
      "--text-color": palette.text,
      "--muted-color": palette.muted,
      "--font-script": `'${fonts.script}', cursive`,
      "--font-primary": `'${fonts.heading}', serif`,
      "--font-secondary": `'${fonts.body}', sans-serif`
    };

    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    [fonts.script, fonts.heading, fonts.body].forEach(loadFont);
  }

  function applyEssentialAliases(templateId, palette, fonts) {
    const root = document.documentElement;

    if (templateId === "wedding-essential") {
      root.style.setProperty("--cream", palette.background);
      root.style.setProperty("--cream-mid", palette.surface);
      root.style.setProperty("--gold", palette.accent);
      root.style.setProperty("--gold-light", palette.secondary);
      root.style.setProperty("--sage", palette.primary);
      root.style.setProperty("--charcoal", palette.text);
      root.style.setProperty("--warm", palette.muted);
      root.style.setProperty("--serif", `'${fonts.heading}', Georgia, serif`);
      root.style.setProperty("--sans", `'${fonts.body}', sans-serif`);
    }

    if (templateId === "xv-essential") {
      const style = document.createElement("style");
      style.dataset.invittaPreset = "xv-essential";
      style.textContent = `
        html[data-invitta-template="xv-essential"] body,
        html[data-invitta-template="xv-essential"] .bg-paper { background-color: var(--invitta-background) !important; }
        html[data-invitta-template="xv-essential"] .text-sage,
        html[data-invitta-template="xv-essential"] .text-primary { color: var(--invitta-primary) !important; }
        html[data-invitta-template="xv-essential"] .text-ink { color: var(--invitta-text) !important; }
        html[data-invitta-template="xv-essential"] .font-body-md,
        html[data-invitta-template="xv-essential"] .font-body-lg,
        html[data-invitta-template="xv-essential"] .font-label-caps { font-family: var(--font-secondary) !important; }
        html[data-invitta-template="xv-essential"] .font-headline-md,
        html[data-invitta-template="xv-essential"] .font-headline-lg,
        html[data-invitta-template="xv-essential"] .font-display-xl,
        html[data-invitta-template="xv-essential"] .font-display-xl-mobile { font-family: var(--font-primary) !important; }
      `;
      document.head.appendChild(style);
    }
  }

  function applyConfigTheme(config, templateId, template, palette, fonts) {
    if (!config || typeof config !== "object") return;

    config.templateId = templateId;
    config.packageTier = template.tier;
    config.package = clone(packages[template.tier]);
    config.theme = config.theme || {};
    config.theme.colors = clone(palette);
    config.theme.typography = clone(fonts);
    config.theme.primaryColor = palette.primary;
    config.theme.secondaryColor = palette.secondary;
    config.theme.bgColor = palette.background;
    config.theme.textColor = palette.text;
    config.theme.fontScript = fonts.script;
    config.theme.fontPrimary = fonts.heading;
    config.theme.fontSecondary = fonts.body;
  }

  function installOpeningMotion(motion) {
    const style = document.createElement("style");
    style.dataset.invittaOpening = motion;
    style.textContent = `
      html[data-invitta-template="wedding-premium"] .hero-content,
      html[data-invitta-template="wedding-vip"] .hero-content {
        width: min(100%, 800px);
        max-width: 100%;
        box-sizing: border-box;
      }
      html[data-invitta-template="wedding-premium"] .hero-content > *,
      html[data-invitta-template="wedding-vip"] .hero-content > * {
        max-width: 100%;
      }
      @keyframes invitta-editorial-fade {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes invitta-soft-rise {
        from { opacity: 0; transform: translateY(18px) scale(.99); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes invitta-cinematic-fade {
        from { opacity: 0; filter: blur(2px); transform: scale(1.015); }
        to { opacity: 1; filter: blur(0); transform: scale(1); }
      }
      @media (prefers-reduced-motion: no-preference) {
        html[data-invitta-motion="editorial-fade"] main > section:first-child > *,
        html[data-invitta-motion="editorial-fade"] .cover > * {
          animation: invitta-editorial-fade 900ms cubic-bezier(.22,1,.36,1) both;
        }
        html[data-invitta-motion="soft-rise"] .hero > *,
        html[data-invitta-motion="soft-rise"] header.hero > * {
          animation: invitta-soft-rise 1050ms cubic-bezier(.22,1,.36,1) both;
        }
        html[data-invitta-motion="cinematic-fade"] .hero > *,
        html[data-invitta-motion="cinematic-fade"] header.hero > * {
          animation: invitta-cinematic-fade 1200ms cubic-bezier(.22,1,.36,1) both;
        }
      }
      @media (max-width: 640px) {
        html[data-invitta-template="wedding-premium"] .hero-content,
        html[data-invitta-template="wedding-vip"] .hero-content {
          padding-inline: 16px;
        }
        html[data-invitta-template="wedding-premium"] .hero .title,
        html[data-invitta-template="wedding-vip"] .hero .title {
          white-space: normal;
          overflow-wrap: anywhere;
          text-wrap: balance;
          line-height: 1.05;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const templateId = document.documentElement.dataset.invittaTemplate;
  const template = templates[templateId];

  window.InvittaDemoSystem = Object.freeze({
    palettes: clone(palettes),
    typography: clone(typography),
    packages: clone(packages),
    templates: clone(templates),
    getTemplate: function (id) {
      return templates[id] ? clone(templates[id]) : null;
    }
  });

  if (!template) return;

  const paletteId = getRequestedPreset("palette", template.allowedPalettes, template.palette);
  const typographyId = getRequestedPreset("type", template.allowedTypography, template.typography);
  const palette = palettes[paletteId];
  const fonts = typography[typographyId];
  const packageInfo = packages[template.tier];
  const root = document.documentElement;

  root.dataset.invittaEvent = template.eventType;
  root.dataset.invittaTier = template.tier;
  root.dataset.invittaPalette = paletteId;
  root.dataset.invittaTypography = typographyId;
  root.dataset.invittaMotion = template.motion;
  root.dataset.invittaPrice = String(packageInfo.price);

  applyRootTheme(palette, fonts);
  applyEssentialAliases(templateId, palette, fonts);
  installOpeningMotion(template.motion);

  if (typeof WEDDING_CONFIG !== "undefined") {
    applyConfigTheme(WEDDING_CONFIG, templateId, template, palette, fonts);
  }
})();
