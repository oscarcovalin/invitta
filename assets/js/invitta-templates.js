/**
 * Invitta Templates Catalog
 * Contiene la definición de las plantillas base del sistema.
 * 
 * Uso previsto:
 * - Renderizado del catálogo en landing y dashboard.
 * - Base para clonación al momento de creación de invitación.
 */

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
    templatePath: "plantillas/elegance",
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
    templatePath: "plantillas/paquete2",
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
    templatePath: "plantillas/vip",
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
    templatePath: "plantillas/boda-classic-basic",
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
    templatePath: "plantillas/boda-golden-romance",
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
    templatePath: "plantillas/boda1",
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
  }
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
