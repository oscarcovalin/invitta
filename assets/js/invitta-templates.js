/**
 * Invitta Templates Catalog
 * Contiene la definición de las plantillas base del sistema.
 * 
 * Uso previsto:
 * - Renderizado del catálogo en landing y dashboard.
 * - Base para clonación al momento de creación de invitación.
 */

function createGenericEventTemplate(id, name, type) {
  // These event types temporarily reuse the proven wedding renderer, while
  // retaining their own IDs so invitations can migrate to dedicated designs later.
  return {
    id: id,
    name: name,
    type: type,
    level: "basica",
    packageLabel: "Esencial",
    price: 399,
    demoUrl: "demos/boda-classic-basic/index.html",
    palettePreset: "ivory-sage",
    typographyPreset: "classic-wedding",
    templatePath: "demos/boda-classic-basic",
    customizable: true,
    status: "active",
    galleryLimit: 4,
    activeMonths: 2,
    rendererTemplateId: "boda-classic-basic",
    customization: {
      sectionBackgrounds: ["hero", "family", "locations", "gallery", "rsvp"]
    },
    features: {
      music: false,
      gallery: true,
      itinerary: false,
      rsvp: true,
      qr: false,
      personalizedPass: false
    }
  };
}

window.InvittaTemplates = [
  {
    id: "xv-elegance-basic",
    name: "Élégance XV",
    type: "xv",
    level: "basica",
    packageLabel: "Esencial",
    price: 399,
    demoUrl: "demos/xv-elegance/index.html",
    palettePreset: "sage-editorial",
    typographyPreset: "editorial-modern",
    templatePath: "demos/xv-elegance",
    customizable: true,
    status: "active",
    galleryLimit: 4,
    activeMonths: 2,
    features: {
      music: false,
      gallery: true,
      itinerary: false,
      rsvp: true,
      qr: false,
      personalizedPass: false
    }
  },
  {
    id: "xv-rose-gold-premium",
    name: "Rose Champagne XV",
    type: "xv",
    level: "premium",
    packageLabel: "Premium",
    price: 699,
    demoUrl: "demos/xv-premium-2/index.html",
    palettePreset: "rose-champagne",
    typographyPreset: "romantic-script",
    templatePath: "demos/xv-premium-2",
    customizable: true,
    status: "active",
    galleryLimit: 10,
    activeMonths: 4,
    features: {
      music: true,
      gallery: true,
      itinerary: true,
      rsvp: true,
      qr: false,
      personalizedPass: false
    }
  },
  {
    id: "xv-champagne-rose-vip",
    name: "Emerald Gala XV",
    type: "xv",
    level: "vip",
    packageLabel: "VIP Experience",
    price: 999,
    demoUrl: "demos/xv-vip-3/index.html",
    palettePreset: "emerald-gold",
    typographyPreset: "regal-editorial",
    templatePath: "demos/xv-vip-3",
    customizable: true,
    status: "active",
    galleryLimit: 10,
    activeMonths: 12,
    features: {
      music: true,
      gallery: true,
      itinerary: true,
      rsvp: true,
      qr: true,
      personalizedPass: true
    }
  },
  {
    id: "boda-classic-basic",
    name: "Classic Ivory Wedding",
    type: "boda",
    level: "basica",
    packageLabel: "Esencial",
    price: 399,
    demoUrl: "demos/boda-classic-basic/index.html",
    palettePreset: "ivory-sage",
    typographyPreset: "classic-wedding",
    templatePath: "demos/boda-classic-basic",
    customizable: true,
    status: "active",
    galleryLimit: 4,
    activeMonths: 2,
    features: {
      music: false,
      gallery: true,
      itinerary: false,
      rsvp: true,
      qr: false,
      personalizedPass: false
    }
  },
  {
    id: "boda-golden-romance-premium",
    name: "Olive Romance",
    type: "boda",
    level: "premium",
    packageLabel: "Premium",
    price: 699,
    demoUrl: "demos/boda-golden-romance-premium/index.html",
    palettePreset: "olive-romance",
    typographyPreset: "garden-romance",
    templatePath: "demos/boda-golden-romance-premium",
    customizable: true,
    status: "active",
    galleryLimit: 10,
    activeMonths: 4,
    features: {
      music: true,
      gallery: true,
      itinerary: true,
      rsvp: true,
      qr: false,
      personalizedPass: false
    }
  },
  {
    id: "boda-midnight-gold-vip",
    name: "Plum Noir Wedding",
    type: "boda",
    level: "vip",
    packageLabel: "VIP Experience",
    price: 999,
    demoUrl: "demos/boda-premium-1/index.html",
    palettePreset: "plum-noir",
    typographyPreset: "noir-luxury",
    templatePath: "demos/boda-premium-1",
    customizable: true,
    status: "active",
    galleryLimit: 10,
    activeMonths: 12,
    features: {
      music: true,
      gallery: true,
      itinerary: true,
      rsvp: true,
      qr: true,
      personalizedPass: true
    }
  },
  createGenericEventTemplate("cumpleanos-general-basic", "Diseño General — Cumpleaños", "cumpleanos"),
  createGenericEventTemplate("bautizo-general-basic", "Diseño General — Bautizo", "bautizo"),
  createGenericEventTemplate("otro-general-basic", "Diseño General — Otro evento", "otro")
];

// Helper functions that return unmutated copies
window.InvittaTemplateCatalog = {
  TEMPLATE_NAMES: window.InvittaTemplates.reduce(function(names, template) {
    names[template.id] = template.name;
    return names;
  }, {}),
  getAll: function() {
    return JSON.parse(JSON.stringify(window.InvittaTemplates));
  },
  getById: function(id) {
    const template = window.InvittaTemplates.find(t => t.id === id);
    return template ? JSON.parse(JSON.stringify(template)) : null;
  },
  getByType: function(type) {
    return JSON.parse(JSON.stringify(window.InvittaTemplates.filter(t => t.type === type)));
  },
  getByLevel: function(level) {
    return JSON.parse(JSON.stringify(window.InvittaTemplates.filter(t => t.level === level)));
  },
  getActive: function() {
    return JSON.parse(JSON.stringify(window.InvittaTemplates.filter(t => t.status === "active")));
  },
  getIdsByType: function(type) {
    return window.InvittaTemplates
      .filter(t => t.type === type && t.status === "active")
      .map(t => t.id);
  }
};
