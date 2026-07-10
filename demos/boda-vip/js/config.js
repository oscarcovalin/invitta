/**
 * CONFIGURACIÓN DEMO — Boda VIP: Plum Noir
 * Valentina & Sebastián · Ciudad de México, 7 Feb 2026
 */
const WEDDING_CONFIG = {
    "eventType": "boda",
    "brideName": "Valentina Ríos",
    "groomName": "Sebastián Montoya",
    "brideGroomInitials": "V & S",
    "hashtag": "#ValentinaYSebastian",
    "quote": "Dos almas que se encontraron en la oscuridad y crearon su propia luz.",
    "weddingDateText": "7 de Febrero, 2027",
    "countdownDate": {
        "year": 2027,
        "month": 1,
        "day": 7,
        "hour": 19,
        "minute": 0,
        "second": 0
    },
    "family": {
        "brideParents": {
            "mother": "Carmen Fuentes de Ríos",
            "father": "Roberto Ríos Gutiérrez"
        },
        "groomParents": {
            "mother": "Patricia Salinas de Montoya",
            "father": "Alejandro Montoya Cruz"
        },
        "padrinos": "Fernando y Lucía Castañeda"
    },
    "ceremonia": {
        "title": "Ceremonia Civil",
        "time": "18:00 hrs",
        "place": "Palacio de Bellas Artes — Salón Principal",
        "address1": "Av. Juárez s/n, Centro Histórico",
        "address2": "Ciudad de México, CDMX",
        "mapQuery": "Palacio+de+Bellas+Artes+CDMX"
    },
    "recepcion": {
        "title": "Recepción de Gala",
        "time": "20:30 hrs",
        "place": "Club Industrial Santa Fe",
        "address1": "Vasco de Quiroga 3000, Santa Fe",
        "address2": "Ciudad de México, CDMX",
        "mapQuery": "Club+Industrial+Santa+Fe+CDMX"
    },
    "itinerary": [
        { "time": "18:00 hrs", "title": "Ceremonia Civil", "description": "Unión oficial ante el juez", "iconClass": "fa-rings-wedding" },
        { "time": "19:30 hrs", "title": "Coctel Exclusivo", "description": "Bienvenida con música en vivo", "iconClass": "fa-champagne-glasses" },
        { "time": "20:30 hrs", "title": "Banquete de Gala", "description": "Cena de 7 tiempos con maridaje", "iconClass": "fa-utensils" },
        { "time": "22:00 hrs", "title": "Primer Vals", "description": "El baile de los novios", "iconClass": "fa-heart" },
        { "time": "22:30 hrs", "title": "Show en Vivo", "description": "Grupo musical y DJ", "iconClass": "fa-music" },
        { "time": "01:00 hrs", "title": "Brindis Final", "description": "Hasta el amanecer", "iconClass": "fa-star" }
    ],
    "dressCode": {
        "title": "Black Tie — Gala Nocturna",
        "women": { "title": "Mujeres", "desc": "Vestido de gala largo", "note": "Evitar blanco, ivory y negro puro" },
        "men": { "title": "Hombres", "desc": "Esmoquin o traje negro con pajarita" }
    },
    "registry": {
        "description": "Tu presencia ilumina nuestra noche más especial. Si deseas celebrarnos con un detalle:",
        "registry1": { "name": "El Palacio de Hierro", "url": "https://www.elpalaciodehierro.com" },
        "registry2": { "name": "Sears", "url": "https://www.sears.com.mx" },
        "lluviaSobres": true
    },
    "incluirHospedaje": true,
    "hospedaje": {
        "description": "Para nuestros invitados foráneos, hemos negociado tarifas preferenciales en:",
        "opciones": [
            { "name": "Hotel St. Regis México City", "address": "Paseo de la Reforma 439, Cuauhtémoc", "phone": "Tel. 55 5228 1818", "url": "https://marriott.com" },
            { "name": "Four Seasons México City", "address": "Paseo de la Reforma 500, Juárez", "phone": "Tel. 55 5230 1818", "url": "https://fourseasons.com/mexicocity" }
        ]
    },
    "rsvp": {
        "title": "Confirma tu Asistencia",
        "description": "Cupos limitados. Confirma antes del 7 de Enero de 2027.",
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
            "background": "#0d0810",
            "surface": "#1a0d18",
            "primary": "#D4AF37",
            "secondary": "#8B6914",
            "accent": "#b8895b",
            "text": "#F5EDD8",
            "muted": "#A89070"
        },
        "typography": {
            "script": "Great Vibes",
            "heading": "Cormorant Garamond",
            "body": "Jost"
        },
        "images": {
            "hero": "assets/hero_bg.jpg",
            "ogImage": "assets/hero_bg.jpg",
            "gallery": ["assets/gallery_1.jpg","assets/gallery_2.jpg","assets/gallery_3.jpg","assets/grid_1.jpg","assets/grid_2.jpg"]
        },
        "primaryColor": "#D4AF37",
        "secondaryColor": "#4a1832",
        "bgColor": "#0d0810",
        "textColor": "#F5EDD8",
        "fontScript": "Great Vibes",
        "fontPrimary": "Cormorant Garamond",
        "fontSecondary": "Jost"
    },
    "passSection": {
        "title": "Pase VIP de Invitación",
        "subtitle": "Asistentes autorizados:",
        "defaultGuestName": "Familia Invitada",
        "defaultPasses": 2,
        "defaultTable": "VIP-03",
        "message": "\"Esta noche solo existimos nosotros. Gracias por ser parte de nuestra historia.\"",
        "qrPrefix": "ValentinaSebastianVIP2027"
    }
};
