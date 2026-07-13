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
    demoUrl: "demos/xv-elegance/index.html",
    templatePath: "plantillas/elegance",
    customizable: true,
    status: "active",
    features: {
      music: true,
      gallery: true,
      rsvp: true,
      qr: true,
      personalizedPass: false
    }
  },
  {
    id: "xv-rose-gold-premium",
    name: "Rose Gold XV",
    type: "xv",
    level: "premium",
    demoUrl: "demos/xv-premium-2/index.html",
    templatePath: "plantillas/paquete2",
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
    id: "xv-champagne-rose-vip",
    name: "Champagne Rose VIP",
    type: "xv",
    level: "vip",
    demoUrl: "demos/xv-vip-3/index.html",
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
    name: "Classic Wedding",
    type: "boda",
    level: "basica",
    demoUrl: "demos/boda-classic-basic/index.html",
    templatePath: "plantillas/boda-classic-basic",
    customizable: true,
    status: "active",
    features: {
      music: true,
      gallery: true,
      rsvp: true,
      qr: true,
      personalizedPass: false
    }
  },
  {
    id: "boda-golden-romance-premium",
    name: "Golden Romance",
    type: "boda",
    level: "premium",
    demoUrl: "demos/boda-golden-romance-premium/index.html",
    templatePath: "plantillas/boda-golden-romance",
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
    id: "boda-midnight-gold-vip",
    name: "Midnight Gold Wedding",
    type: "boda",
    level: "vip",
    demoUrl: "demos/boda-premium-1/index.html",
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
