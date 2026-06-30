/**
 * CONFIGURACIÓN INYECTADA DESDE JSON
 */
const WEDDING_CONFIG = {
    "eventType": "xv",
    "brideName": "Regina Torres",
    "groomName": "",
    "brideGroomInitials": "R",
    "hashtag": "#ReginaXV",
    "quote": "Hoy comienzo a escribir la historia más bonita de mi juventud.",
    "weddingDateText": "24 de Octubre, 2026",
    "countdownDate": {
        "year": 2026,
        "month": 9,
        "day": 24,
        "hour": 18,
        "minute": 0,
        "second": 0
    },
    "family": {
        "brideParents": {
            "mother": "Verónica Rivas",
            "father": "Miguel Ángel Solís"
        },
        "groomParents": {
            "mother": "Silvia Torres",
            "father": "Héctor Ramírez"
        },
        "padrinos": "Hugo y Daniela Castro"
    },
    "ceremonia": {
        "title": "Misa de Acción de Gracias",
        "time": "17:00 hrs",
        "place": "Parroquia San Pedro",
        "address1": "Morelos 222",
        "address2": "México",
        "mapQuery": "Parroquia+San+Pedro+Tlaquepaque"
    },
    "recepcion": {
        "title": "Recepción",
        "time": "19:00 hrs",
        "place": "Hacienda La Escoba",
        "address1": "Morelos 222",
        "address2": "México",
        "mapQuery": "Hacienda+La+Escoba"
    },
    "itinerary": [
        {
            "time": "17:00 hrs",
            "title": "Ceremonia",
            "description": "Acción de gracias",
            "iconClass": "fa-church"
        },
        {
            "time": "19:00 hrs",
            "title": "Recepción de Gala",
            "description": "Bienvenida",
            "iconClass": "fa-glass-cheers"
        },
        {
            "time": "20:30 hrs",
            "title": "Vals",
            "description": "Baile tradicional con chambelanes",
            "iconClass": "fa-crown"
        },
        {
            "time": "23:00 hrs",
            "title": "Hora Loca",
            "description": "Fiesta y neón",
            "iconClass": "fa-compact-disc"
        }
    ],
    "dressCode": {
        "title": "Formal",
        "women": {
            "title": "Mujeres",
            "desc": "Vestido elegante",
            "note": "Se reserva el color principal para la quinceañera"
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
                "name": "Hotel Demo Centro",
                "address": "Datos de hospedaje personalizables para cada evento.",
                "phone": "Tel. 55 1234 5678",
                "url": "https://hotel-demo.invitta.mx"
            },
            {
                "name": "Hotel Demo Jardín",
                "address": "Datos de hospedaje personalizables para cada evento.",
                "phone": "Tel. 55 8765 4321",
                "url": "https://hotel-demo.invitta.mx"
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
        "grid5": "assets/grid_5.jpg"
    },
    "theme": {
        "colors": {
            "background": "#FAF6F1",
            "surface": "#FFFFFF",
            "primary": "#C9A46A",
            "secondary": "#D8A7A7",
            "accent": "#B8895B",
            "text": "#2B2522",
            "muted": "#7B6F68"
        },
        "typography": {
            "script": "Parisienne",
            "heading": "Cormorant Garamond",
            "body": "Cormorant Garamond"
        },
        "images": {
            "hero": "assets/hero_bg.jpg",
            "ogImage": "assets/hero_bg.jpg",
            "gallery": [
                "assets/gallery_1.jpg",
                "assets/gallery_2.jpg",
                "assets/gallery_3.jpg",
                "assets/grid_1.jpg",
                "assets/grid_2.jpg"
            ]
        },
        "primaryColor": "#C9A46A",
        "secondaryColor": "#D8A7A7",
        "bgColor": "#FAF6F1",
        "textColor": "#2B2522",
        "bgImage": "",
        "fontScript": "Parisienne",
        "fontPrimary": "Cormorant Garamond",
        "fontSecondary": "Cormorant Garamond"
    },
    "passSection": {
        "title": "Pase de Invitación",
        "subtitle": "Válido para:",
        "defaultGuestName": "Familia Invitada",
        "defaultPasses": 2,
        "defaultTable": "14",
        "message": "\"Gracias por acompañarme en esta celebración tan especial.\"",
        "qrPrefix": "ReginaXV2026"
    }
};
