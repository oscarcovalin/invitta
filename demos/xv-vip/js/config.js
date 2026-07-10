/**
 * CONFIGURACIÓN DEMO — XV Años VIP: Colección Esmeralda
 * Isabella Morales · CDMX, 15 Ago 2026
 */
const WEDDING_CONFIG = {
    "eventType": "xv",
    "brideName": "Isabella Morales",
    "groomName": "",
    "brideGroomInitials": "I",
    "hashtag": "#IsabellaXV2026",
    "quote": "Quince años de amor, risas y sueños. Esta noche, el cuento comienza.",
    "weddingDateText": "15 de Agosto, 2026",
    "countdownDate": {
        "year": 2026,
        "month": 7,
        "day": 15,
        "hour": 18,
        "minute": 30,
        "second": 0
    },
    "family": {
        "brideParents": {
            "mother": "Sofía Castillo de Morales",
            "father": "Héctor Morales Vidal"
        },
        "groomParents": {
            "mother": "",
            "father": ""
        },
        "padrinos": "Familia Ramírez-Ibarra y Familia Vidal-Cortés"
    },
    "ceremonia": {
        "title": "Ceremonia de XV Años",
        "time": "18:30 hrs",
        "place": "Basílica de Nuestra Señora de Guadalupe",
        "address1": "Plaza de las Américas 1, Villa de Guadalupe",
        "address2": "Ciudad de México, CDMX",
        "mapQuery": "Basilica+de+Guadalupe+CDMX"
    },
    "recepcion": {
        "title": "Gran Fiesta VIP",
        "time": "20:30 hrs",
        "place": "Salón Imperial Pedregal",
        "address1": "Periférico Sur 4580, Jardines del Pedregal",
        "address2": "Ciudad de México, CDMX",
        "mapQuery": "Salon+Imperial+Pedregal+CDMX"
    },
    "itinerary": [
        { "time": "18:30 hrs", "title": "Ceremonia Religiosa", "description": "Misa de acción de gracias", "iconClass": "fa-church" },
        { "time": "19:30 hrs", "title": "Llegada en Carroza", "description": "Entrada espectacular al salón", "iconClass": "fa-star" },
        { "time": "20:00 hrs", "title": "Cóctel VIP", "description": "Bienvenida con barra libre y aperitivos finos", "iconClass": "fa-champagne-glasses" },
        { "time": "21:00 hrs", "title": "Gran Vals de Honor", "description": "El baile más esperado", "iconClass": "fa-crown" },
        { "time": "21:30 hrs", "title": "Show de Sorpresas", "description": "Artistas invitados", "iconClass": "fa-wand-magic-sparkles" },
        { "time": "22:00 hrs", "title": "Banquete de 6 Tiempos", "description": "Gastronomía de autor", "iconClass": "fa-utensils" },
        { "time": "23:30 hrs", "title": "Fiesta Total", "description": "DJ internacional hasta el amanecer", "iconClass": "fa-music" }
    ],
    "dressCode": {
        "title": "Black Tie — Esmeralda y Dorado",
        "women": { "title": "Mujeres", "desc": "Vestido de gala o coctel largo", "note": "Evitar tonos esmeralda y azul royal (reservado para la quinceañera)" },
        "men": { "title": "Hombres", "desc": "Esmoquin negro o traje de gala" }
    },
    "registry": {
        "description": "Isabella sueña con viajar. Si deseas regalarle algo especial:",
        "registry1": { "name": "Fondo de Viaje", "url": "https://wa.me/525566790073" },
        "registry2": { "name": "El Palacio de Hierro", "url": "https://www.elpalaciodehierro.com" },
        "lluviaSobres": true
    },
    "incluirHospedaje": true,
    "hospedaje": {
        "description": "Para nuestros invitados de otras ciudades, hemos preparado opciones especiales:",
        "opciones": [
            { "name": "Hotel InterContinental Presidente CDMX", "address": "Campos Elíseos 218, Polanco", "phone": "Tel. 55 5327 7700", "url": "https://ihg.com" },
            { "name": "Grand Velas México City", "address": "Leibnitz 24, Anzures", "phone": "Tel. 55 5207 6060", "url": "https://grandvelas.com" }
        ]
    },
    "rsvp": {
        "title": "Confirma tu Asistencia",
        "description": "Lugares muy limitados. Por favor confirma antes del 1 de Agosto de 2026.",
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
            "background": "#0A1A14",
            "surface": "#0F2219",
            "primary": "#D4AF37",
            "secondary": "#2E7D52",
            "accent": "#A0522D",
            "text": "#F0EDE0",
            "muted": "#9AB09A"
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
        "secondaryColor": "#2E7D52",
        "bgColor": "#0A1A14",
        "textColor": "#F0EDE0",
        "fontScript": "Great Vibes",
        "fontPrimary": "Cormorant Garamond",
        "fontSecondary": "Jost"
    },
    "passSection": {
        "title": "Pase VIP de Honor",
        "subtitle": "Invitados especiales:",
        "defaultGuestName": "Familia Invitada",
        "defaultPasses": 2,
        "defaultTable": "VIP-01",
        "message": "\"Isabella te espera esta noche para vivir juntos el sueño de sus quince años.\"",
        "qrPrefix": "IsabellaVIPXV2026"
    }
};
