/**
 * ✏️ CONFIGURACIÓN DE LA INVITACIÓN DE BODA (MACHOTE)
 * ------------------------------------------------------------------
 * En este archivo puedes cambiar toda la información de la invitación de boda
 * sin necesidad de modificar el código HTML o CSS. ¡Solo edita los textos entre comillas!
 */

const WEDDING_CONFIG = {
    // --- 👑 TIPO DE EVENTO & IDENTIDAD ---
    eventType: "boda", // Puede ser "boda" o "xv"
    brideName: "Paulina Anael",
    groomName: "Rodrigo",
    brideGroomInitials: "P, A & R", // Iniciales para el Footer y logo (ej: P, A & R)
    hashtag: "#BodaPaulinaYRodrigo", // Hashtag oficial de la boda (para fotos)
    quote: "Hay momentos en la vida que son especiales por sí solos, pero compartirlos con las personas que quieres los hace inolvidables.", // Pensamiento o Cita (Opcional)

    // --- 📅 FECHAS Y CUENTA REGRESIVA ---
    weddingDateText: "11 de Julio, 2026", // Texto de la fecha legible que aparece en la portada
    
    // Configuración exacta para la cuenta regresiva (Año, Mes, Día, Hora, Minutos, Segundos)
    // IMPORTANTE: En JavaScript, los meses empiezan desde 0:
    // Enero = 0, Febrero = 1, Marzo = 2, Abril = 3, Mayo = 4, Junio = 5,
    // Julio = 6, Agosto = 7, Septiembre = 8, Octubre = 9, Noviembre = 10, Diciembre = 11.
    countdownDate: { 
        year: 2026, 
        month: 6, // 6 representa Julio
        day: 11, 
        hour: 16, 
        minute: 0, 
        second: 0 
    },

    // --- 🕊️ BENDICIÓN DE LOS PADRES Y PADRINOS ---
    family: {
        brideParents: {
            father: "Oscar Pineda Lozada",
            mother: "Claudia Guadalupe Aguirre Coahonte"
        },
        groomParents: {
            father: "Jaime Correa Correa",
            mother: "Angelina Córdova García"
        },
        padrinos: "Ángel Patiño y Lucila Osorio" // Padrinos principales de velación
    },

    // --- 📍 DETALLES DE LOS EVENTOS & UBICACIONES ---
    ceremonia: {
        title: "Ceremonia Religiosa",
        time: "16:00 hrs",
        place: "Iglesia y Ex Convento de San Juan Bautista",
        address1: "Centenario 8",
        address2: "Villa de Coyoacán, Coyoacán 04000 CDMX",
        // Parámetro de búsqueda para Google Maps (sin espacios, usa + en su lugar)
        mapQuery: "Iglesia+y+Ex+Convento+de+San+Juan+Bautista+Centenario+8,+Coyoacan"
    },
    recepcion: {
        title: "Recepción",
        time: "19:00 hrs",
        place: "Salon Miami",
        address1: "Boulevar Bosque de Las Naciones 30",
        address2: "Bosques de Aragon, 57170 Cdad. Nezahualcóyotl, Méx.",
        // Parámetro de búsqueda para Google Maps (sin espacios, usa + en su lugar)
        mapQuery: "Salon+Miami+Boulevar+Bosque+de+Las+Naciones+30+Nezahualcoyotl"
    },

    // --- 🗓️ ITINERARIO DEL DÍA ---
    // Iconos recomendados de FontAwesome: fa-church, fa-martini-glass-citrus, fa-champagne-glasses, fa-utensils, fa-heart, fa-music
    itinerary: [
        { 
            time: "16:00 hrs", 
            title: "Ceremonia Religiosa", 
            description: "Iglesia y Ex Convento de San Juan Bautista", 
            iconClass: "fa-church" 
        },
        { 
            time: "19:00 hrs", 
            title: "Recepción", 
            description: "Salon Miami", 
            iconClass: "fa-martini-glass-citrus" 
        },
        { 
            time: "19:30 hrs", 
            title: "Recepción del Salón", 
            description: "Cóctel de bienvenida", 
            iconClass: "fa-champagne-glasses" 
        },
        { 
            time: "20:00 hrs", 
            title: "Cena y Brindis", 
            description: "Momento de compartir el banquete y brindar", 
            iconClass: "fa-utensils" 
        },
        { 
            time: "21:00 hrs", 
            title: "Primer Baile", 
            description: "Vals de los novios", 
            iconClass: "fa-heart" 
        },
        { 
            time: "21:30 hrs", 
            title: "Inicia la Fiesta", 
            description: "Apertura de la pista de baile y fiesta general", 
            iconClass: "fa-music" 
        }
    ],

    // --- 👔 CÓDIGO DE VESTIMENTA ---
    dressCode: {
        title: "Elegante",
        women: {
            title: "Mujeres",
            desc: "Vestido Largo",
            note: "Se reserva el color blanco",
            image: "assets/dress_female.png"
        },
        men: {
            title: "Hombres",
            desc: "Traje y Corbata",
            image: "assets/dress_male.png"
        }
    },

    // --- 🏨 HOSPEDAJE SUGERIDO ---
    hospedaje: {
        description: "Hemos seleccionado algunas opciones de alojamiento cerca del evento.",
        opciones: [
            {
                name: "Hotel Fiesta Americana",
                address: "Paseo de la Reforma 80, CDMX",
                phone: "55 1234 5678",
                url: "https://www.fiestamericana.com"
            },
            {
                name: "Hotel Boutique Coyoacán",
                address: "Ignacio Allende 45, Coyoacán",
                phone: "55 8765 4321",
                url: ""
            }
        ]
    },
    incluirHospedaje: true, // true para mostrar sección de hospedaje, false para ocultar

    // --- 🛍️ MESA DE REGALOS ---
    registry: {
        description: "El mejor regalo es tu presencia, pero si deseas tener un detalle con nosotros:",
        registry1: {
            name: "Liverpool",
            url: "https://mesaderegalos.liverpool.com.mx/milistaderegalos/51982905"
        },
        registry2: {
            name: "",
            url: "" // Opcional, déjalo vacío si no usas una segunda mesa
        },
        lluviaSobres: true // true para mostrar lluvia de sobres, false para ocultar
    },

    // --- 🎫 PASES PERSONALIZADOS (QR / PARÁMETROS URL) ---
    // Esta sección se rellena dinámicamente según la URL (ej: index.html?n=Familia+Perez&p=3&m=12)
    // Si no se proveen parámetros en la URL, se usarán estos valores por defecto:
    passSection: {
        title: "Pase de Invitación",
        subtitle: "Válido para:",
        defaultGuestName: "Familia Invitada",
        defaultPasses: 2,
        defaultTable: "14",
        message: '"Con alegría en el corazón, los esperamos para compartir nuestra unión."',
        // Prefijo para la información del código QR al escanearse
        qrDataPrefix: "PaulinaAnaelRodrigoBoda2026"
    },

    // --- ✉️ RSVP (FORMULARIO INTERACTIVO & REDIRECCIÓN A WHATSAPP) ---
    rsvp: {
        title: "Confirma tu Asistencia",
        description: "Por favor, haznos saber si podrás acompañarnos en este día tan especial.",
        // Tu número de WhatsApp real con código de país, SIN el signo "+" ni espacios (ej: "5215523109700" para México)
        whatsappNumber: "5215523109700",
        whatsappNumber2: "" // Número opcional para confirmar (ej. novio)
    },

    // --- 🎨 DISEÑO, COLORES Y TIPOGRAFÍAS ---
    theme: {
        primaryColor: "#8C7B5D", // Color principal (acentos, iconos, botones)
        secondaryColor: "#2F3E46", // Color secundario (títulos principales)
        bgColor: "#F8F5F0", // Color de fondo general de las secciones
        textColor: "#333333", // Color del texto general
        bgImage: "", // URL o ruta de imagen para fondo general (opcional)
        fontScript: "Sweet Pea", // Fuente cursiva para títulos
        fontPrimary: "Champagne Limousines", // Fuente principal
        fontSecondary: "Champagne Limousines" // Fuente secundaria
    },

    // --- 📷 GALERÍA & FOTOGRAFÍAS ---
    images: {
        hero: "assets/hero_bg.jpg",
        parallax1: "assets/gallery_1.jpg",
        parallax2: "assets/gallery_2.jpg",
        parallax3: "assets/gallery_3.jpg",
        grid1: "assets/grid_1.jpg",
        grid2: "assets/grid_2.jpg",
        grid3: "assets/grid_3.jpg",
        grid4: "assets/grid_4.jpg",
        grid5: "assets/grid_5.jpg",
        grid6: "",
        grid7: "",
        grid8: "",
        grid9: "",
        grid10: "",
        grid11: "",
        grid12: ""
    }
};
