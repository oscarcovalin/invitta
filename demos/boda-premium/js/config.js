/**
 * CONFIGURACIÓN INYECTADA DESDE JSON
 */
const WEDDING_CONFIG = {
    "eventType": "boda",
    "brideName": "Mariana López",
    "groomName": "Diego Hernández",
    "brideGroomInitials": "M & D",
    "hashtag": "#MarianaYDiego",
    "quote": "Te elegí a ti porque cuando mi luz se apaga, te sientas a mi lado en la sombra.",
    "weddingDateText": "14 de Noviembre, 2026",
    "countdownDate": {
        "year": 2026,
        "month": 10,
        "day": 28,
        "hour": 18,
        "minute": 0,
        "second": 0
    },
    "family": {
        "brideParents": {
            "mother": "Luz María Santos",
            "father": "Francisco Torres"
        },
        "groomParents": {
            "mother": "Rosaura Pérez",
            "father": "Javier Mendoza"
        },
        "padrinos": "Ernesto y Claudia Villalobos"
    },
    "ceremonia": {
        "title": "Ceremonia Religiosa",
        "time": "17:00 hrs",
        "place": "Templo Expiatorio",
        "address1": "López Cotilla 935",
        "address2": "México",
        "mapQuery": "Templo+Expiatorio+Guadalajara"
    },
    "recepcion": {
        "title": "Recepción",
        "time": "19:00 hrs",
        "place": "Salón Bellaterra",
        "address1": "López Cotilla 935",
        "address2": "México",
        "mapQuery": "Salon+Bellaterra+Zapopan"
    },
    "itinerary": [
        {
            "time": "18:00 hrs",
            "title": "Ceremonia Religiosa",
            "description": "Misa solemne",
            "iconClass": "fa-church"
        },
        {
            "time": "19:30 hrs",
            "title": "Cóctel de Bienvenida",
            "description": "Bebidas y aperitivos",
            "iconClass": "fa-martini-glass-citrus"
        },
        {
            "time": "20:30 hrs",
            "title": "Cena",
            "description": "Banquete de gala",
            "iconClass": "fa-utensils"
        },
        {
            "time": "22:00 hrs",
            "title": "Inicia la Fiesta",
            "description": "Apertura de pista",
            "iconClass": "fa-music"
        }
    ],
    "dressCode": {
        "title": "Formal",
        "women": {
            "title": "Mujeres",
            "desc": "Vestido elegante",
            "note": "Evitar color blanco"
        },
        "men": {
            "title": "Hombres",
            "desc": "Traje y corbata"
        }
    },
    "registry": {
        "description": "El mejor regalo es tu presencia.",
        "registry1": {
            "name": "Liverpool",
            "url": "https://www.liverpool.com.mx"
        },
        "registry2": {
            "name": "Amazon",
            "url": "https://www.amazon.com.mx"
        },
        "lluviaSobres": true
    },
    "incluirHospedaje": true,
    "hospedaje": {
        "description": "Opciones recomendadas.",
        "opciones": [
            {
                "name": "Hotel Grand Plaza",
                "address": "Dirección 1",
                "phone": "5555555555",
                "url": "https://example.com"
            },
            {
                "name": "Hotel Boutique Centro",
                "address": "Dirección 2",
                "phone": "5555555556",
                "url": "https://example.com"
            }
        ]
    },
    "rsvp": {
        "title": "Confirma tu Asistencia",
        "description": "Favor de confirmar.",
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
        "grid5": "assets/grid_5.jpg",
        "grid6": "",
        "grid7": "",
        "grid8": "",
        "grid9": "",
        "grid10": "",
        "grid11": "",
        "grid12": ""
    },
    "theme": {
        "primaryColor": "#A68A64",
        "secondaryColor": "#4A4641",
        "bgColor": "#FDFBF7",
        "textColor": "#333333",
        "bgImage": "",
        "fontScript": "Great Vibes",
        "fontPrimary": "Playfair Display",
        "fontSecondary": "Playfair Display"
    },
    "passSection": {
        "title": "Pase de Invitación",
        "subtitle": "Válido para:",
        "defaultGuestName": "Familia Invitada",
        "defaultPasses": 2,
        "defaultTable": "14",
        "message": "\"Con alegría en el corazón, los esperamos para compartir nuestra unión.\"",
        "qrDataPrefix": "PaulinaAnaelRodrigoBoda2026"
    }
};
