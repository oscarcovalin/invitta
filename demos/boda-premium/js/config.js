/**
 * CONFIGURACIÓN DEMO — Boda Premium: Olive Romance
 * Mariana & Diego · Guadalajara, 14 Nov 2026
 */
const WEDDING_CONFIG = {
    "eventType": "boda",
    "brideName": "Mariana López",
    "groomName": "Diego Hernández",
    "brideGroomInitials": "M & D",
    "hashtag": "#MarianaYDiego2026",
    "quote": "El amor no se mira el uno al otro; el amor mira juntos en la misma dirección.",
    "weddingDateText": "14 de Noviembre, 2026",
    "countdownDate": {
        "year": 2026,
        "month": 10,
        "day": 14,
        "hour": 17,
        "minute": 0,
        "second": 0
    },
    "family": {
        "brideParents": {
            "mother": "Luz María Santos de López",
            "father": "Francisco López Ruiz"
        },
        "groomParents": {
            "mother": "Rosaura Pérez de Hernández",
            "father": "Javier Hernández Morales"
        },
        "padrinos": "Ernesto y Claudia Villalobos"
    },
    "ceremonia": {
        "title": "Ceremonia Religiosa",
        "time": "17:00 hrs",
        "place": "Templo Expiatorio del Santísimo Sacramento",
        "address1": "López Cotilla 935, Col. Americana",
        "address2": "Guadalajara, Jalisco",
        "mapQuery": "Templo+Expiatorio+Guadalajara"
    },
    "recepcion": {
        "title": "Recepción",
        "time": "19:30 hrs",
        "place": "Hacienda Los Cipreses",
        "address1": "Carretera Zapopan-Tesistán 3000",
        "address2": "Zapopan, Jalisco",
        "mapQuery": "Hacienda+Los+Cipreses+Zapopan"
    },
    "itinerary": [
        { "time": "17:00 hrs", "title": "Ceremonia Religiosa", "description": "Misa solemne en el Templo Expiatorio", "iconClass": "fa-church" },
        { "time": "19:00 hrs", "title": "Traslado", "description": "Viaje a la Hacienda Los Cipreses", "iconClass": "fa-car" },
        { "time": "19:30 hrs", "title": "Cóctel de Bienvenida", "description": "Bebidas y bocadillos en el jardín", "iconClass": "fa-martini-glass-citrus" },
        { "time": "21:00 hrs", "title": "Cena de Gala", "description": "Banquete de 5 tiempos", "iconClass": "fa-utensils" },
        { "time": "22:30 hrs", "title": "Vals y Primera Pieza", "description": "El gran momento de los novios", "iconClass": "fa-heart" },
        { "time": "23:00 hrs", "title": "¡A Bailar!", "description": "Apertura de pista y DJ", "iconClass": "fa-music" }
    ],
    "dressCode": {
        "title": "Formal — Jardín de Olivos",
        "women": { "title": "Mujeres", "desc": "Vestido formal o de coctel", "note": "Evitar color blanco e ivory" },
        "men": { "title": "Hombres", "desc": "Traje oscuro con corbata" }
    },
    "registry": {
        "description": "Tu presencia es el mejor regalo. Si deseas darnos algo, aquí encontrarás nuestras mesas de regalos.",
        "registry1": { "name": "Liverpool", "url": "https://www.liverpool.com.mx" },
        "registry2": { "name": "El Palacio de Hierro", "url": "https://www.elpalaciodehierro.com" },
        "lluviaSobres": true
    },
    "incluirHospedaje": true,
    "hospedaje": {
        "description": "Para los invitados que vienen de fuera de Guadalajara, hemos reservado tarifas especiales en:",
        "opciones": [
            { "name": "Hotel Camino Real Guadalajara", "address": "Av. Vallarta 5005, Guadalajara", "phone": "Tel. 33 3134 2424", "url": "https://caminoreal.com" },
            { "name": "Hotel Hilton Guadalajara Midtown", "address": "Av. de las Rosas 2933, Guadalajara", "phone": "Tel. 33 3678 9000", "url": "https://hilton.com" }
        ]
    },
    "rsvp": {
        "title": "Confirma tu Asistencia",
        "description": "Favor de confirmar antes del 15 de Octubre de 2026.",
        "whatsappNumber": "525566790073",
        "whatsappNumber2": "525512345678"
    },
    "images": {
        "hero": "assets/hero_bg.jpg",
        "parallax1": "assets/gallery_1.jpg",
        "parallax2": "assets/gallery_2.jpg",
        "parallax3": "assets/gallery_3.jpg",
        "grid1": "assets/grid_1.jpg",
        "grid2": "assets/grid_2.jpg",
        "grid3": "assets/grid_3.jpg",
        "grid4": "assets/grid_4.jpg",
        "grid5": "assets/grid_5.jpg"
    },
    "theme": {
        "colors": {
            "background": "#F8F3EA",
            "surface": "#FFFFFF",
            "primary": "#A68A64",
            "secondary": "#6F7D5F",
            "accent": "#C58A5C",
            "text": "#2C2924",
            "muted": "#756E65"
        },
        "typography": {
            "script": "Great Vibes",
            "heading": "Playfair Display",
            "body": "Jost"
        },
        "images": {
            "hero": "assets/hero_bg.jpg",
            "ogImage": "assets/hero_bg.jpg",
            "gallery": ["assets/gallery_1.jpg","assets/gallery_2.jpg","assets/gallery_3.jpg","assets/grid_1.jpg","assets/grid_2.jpg"]
        },
        "primaryColor": "#A68A64",
        "secondaryColor": "#6F7D5F",
        "bgColor": "#F8F3EA",
        "textColor": "#2C2924",
        "fontScript": "Great Vibes",
        "fontPrimary": "Playfair Display",
        "fontSecondary": "Jost"
    },
    "passSection": {
        "title": "Pase de Invitación",
        "subtitle": "Válido para:",
        "defaultGuestName": "Familia Invitada",
        "defaultPasses": 2,
        "defaultTable": "7",
        "message": "\"Con alegría en el corazón, los esperamos para compartir este momento único.\"",
        "qrPrefix": "MarianaYDiego2026"
    }
};
