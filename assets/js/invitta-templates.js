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
    demoUrl: "demos/xv-esencial/index.html",
    palettePreset: "sage-editorial",
    typographyPreset: "editorial-modern",
    templatePath: "plantillas/elegance",
    customizable: true,
    status: "active",
    features: {
      music: false,
      gallery: true,
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
    demoUrl: "demos/xv-premium/index.html",
    palettePreset: "rose-champagne",
    typographyPreset: "romantic-script",
    templatePath: "plantillas/paquete2",
    customizable: true,
    status: "active",
    features: {
      music: true,
      gallery: true,
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
    demoUrl: "demos/xv-vip/index.html",
    palettePreset: "emerald-gold",
    typographyPreset: "regal-editorial",
    templatePath: "plantillas/vip",
    customizable: true,
    status: "active",
    features: {
      music: true,
      gallery: true,
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
    demoUrl: "demos/boda-esencial/index.html",
    palettePreset: "ivory-sage",
    typographyPreset: "classic-wedding",
    templatePath: "plantillas/boda-classic-basic",
    customizable: true,
    status: "active",
    features: {
      music: false,
      gallery: true,
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
    demoUrl: "demos/boda-premium/index.html",
    palettePreset: "olive-romance",
    typographyPreset: "garden-romance",
    templatePath: "plantillas/boda-golden-romance",
    customizable: true,
    status: "active",
    features: {
      music: true,
      gallery: true,
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
    demoUrl: "demos/boda-vip/index.html",
    palettePreset: "plum-noir",
    typographyPreset: "noir-luxury",
    templatePath: "plantillas/boda1",
    customizable: true,
    status: "active",
    features: {
      music: true,
      gallery: true,
      rsvp: true,
      qr: true,
      personalizedPass: true
    }
  }
];

// Helper functions that return unmutated copies
window.InvittaTemplateCatalog = {
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
  }
};
