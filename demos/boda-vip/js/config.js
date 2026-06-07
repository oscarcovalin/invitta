/**
 * CONFIGURACIÓN INYECTADA DESDE JSON
 */
const WEDDING_CONFIG = {
    "eventType": "boda",
    "brideName": "Valeria Martínez",
    "groomName": "Sebastián Garza",
    "brideGroomInitials": "V & S",
    "hashtag": "#ValeYSebas",
    "quote": "Juntos es mi lugar favorito en todo el mundo.",
    "weddingDateText": "5 de Diciembre, 2026",
    "countdownDate": {
        "year": 2026,
        "month": 11,
        "day": 19,
        "hour": 19,
        "minute": 0,
        "second": 0
    },
    "family": {
        "brideParents": {
            "mother": "Silvia Cantú",
            "father": "Arturo Garza"
        },
        "groomParents": {
            "mother": "Margarita Treviño",
            "father": "Raúl Lozano"
        },
        "padrinos": "Diego y Valeria Sada"
    },
    "ceremonia": {
        "title": "Ceremonia Religiosa",
        "time": "17:00 hrs",
        "place": "Basílica de Guadalupe",
        "address1": "Guanajuato 715",
        "address2": "México",
        "mapQuery": "Basilica+de+Guadalupe+Monterrey"
    },
    "recepcion": {
        "title": "Recepción",
        "time": "19:00 hrs",
        "place": "Club Industrial",
        "address1": "Guanajuato 715",
        "address2": "México",
        "mapQuery": "Club+Industrial+Monterrey"
    },
    "itinerary": [
        {
            "time": "19:00 hrs",
            "title": "Ceremonia de Gala",
            "description": "Basílica",
            "iconClass": "fa-church"
        },
        {
            "time": "21:00 hrs",
            "title": "Recepción de Lujo",
            "description": "Club Industrial",
            "iconClass": "fa-champagne-glasses"
        },
        {
            "time": "22:00 hrs",
            "title": "Banquete VIP",
            "description": "Cena de 4 tiempos",
            "iconClass": "fa-utensils"
        },
        {
            "time": "00:00 hrs",
            "title": "Tornaboda",
            "description": "Música y antojitos",
            "iconClass": "fa-moon"
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
        "primaryColor": "#C5A059",
        "secondaryColor": "#D4AF37",
        "bgColor": "#111111",
        "textColor": "#EAEAEA",
        "bgImage": "",
        "fontScript": "Pinyon Script",
        "fontPrimary": "Cinzel",
        "fontSecondary": "Cinzel"
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
