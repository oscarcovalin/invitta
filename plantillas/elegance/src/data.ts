import { LocationInfo, GalleryImage, RegistryOption } from './types';
import natasha005 from './assets/natasha-005.jpg';
import natasha008 from './assets/natasha-008.jpg';
import natasha012 from './assets/natasha-012.jpg';
import natasha015 from './assets/natasha-015.jpg';
import natasha021 from './assets/natasha-021.jpg';

export const EVENT_DATE = '2026-12-12T15:00:00'; // Dec 12, 2026 at 3:00 PM (Ceremony time)

export const EVENT_DETAILS = {
  rsvpPhone: '526141234567', // WhatsApp contact number (international format)
  quinceanera: {
    firstName: 'Ana',
    middleName: 'Camila',
    lastName: 'Zavala',
    fullName: 'Ana Camila Zavala',
    quote: '"Hay momentos inolvidables que se atesoran en el corazón para siempre, por esa razón, quiero que compartas conmigo este día tan especial..."',
  },
  parents: {
    mother: 'Susana Almazán Bernal',
    father: 'César Roberto Zavala',
  },
  godparents: {
    mother: 'Diana Almanza García',
    father: 'Enrique O\'Farrill Zúñiga',
  },
  chambelan: {
    name: 'Carlos González Farrera',
  }
};

export const IMAGES = {
  hero: natasha012,
  countdownBg: natasha005,
  dressCodeBg: natasha015,
};

export const LOCATIONS: LocationInfo[] = [
  {
    id: 'ceremony',
    title: 'Ceremonia Religiosa',
    place: 'Parroquia Sagrado Corazón de Jesús',
    time: '3:00 P.M.',
    address: 'Blv. Calle 20 de Noviembre y Av. Melchor Ocampo, Col. Pacífico',
    postalCode: 'C.P. 31030',
    city: 'Chihuahua, Chih.',
    googleMapsUrl: 'https://maps.google.com/?q=Parroquia+Sagrado+Corazon+de+Jesus+Chihuahua',
  },
  {
    id: 'reception',
    title: 'Salón de Recepción',
    place: 'Cantabria Salón de Eventos',
    time: '9:00 P.M.',
    address: 'Blv. Col. Sierra Magisterial #6103 esq. con Tejas, Col. Los Ángeles',
    postalCode: 'C.P. 31380',
    city: 'Chihuahua, Chih.',
    googleMapsUrl: 'https://maps.google.com/?q=Cantabria+Salon+de+Eventos+Chihuahua',
  },
];

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    id: 'gal-1',
    url: natasha008,
    alt: 'Retrato editorial al atardecer',
  },
  {
    id: 'gal-2',
    url: natasha005,
    alt: 'Retrato urbano con luz dorada',
  },
  {
    id: 'gal-3',
    url: natasha015,
    alt: 'Detalle editorial entre la luz del jardín',
  },
  {
    id: 'gal-4',
    url: natasha021,
    alt: 'Amigas celebrando al aire libre',
  },
];

export const REGISTRY_OPTIONS: RegistryOption[] = [
  {
    id: 'amazon',
    title: 'Amazon',
    icon: 'Gift',
    description: 'Hemos seleccionado algunos artículos especiales en nuestra mesa de regalos de Amazon.',
    actionText: 'VER MESA DE REGALOS',
    actionUrl: 'https://www.amazon.com.mx/baby-reg/',
  },
  {
    id: 'liverpool',
    title: 'Liverpool',
    icon: 'ShoppingBag',
    description: 'También puedes encontrar nuestra mesa de regalos oficial en Liverpool.',
    actionText: 'VER MESA LIVERPOOL',
    actionUrl: 'https://www.liverpool.com.mx/tienda/giftregistry',
  },
  {
    id: 'bank',
    title: 'Datos Bancarios',
    icon: 'CreditCard',
    description: 'Si prefieres realizar una transferencia bancaria, puedes copiar la Clabe Interbancaria aquí.',
    actionText: 'COPIAR CLABE',
    copyValue: '0121 8001 2345 6789 01',
  },
  {
    id: 'envelope',
    title: 'Lluvia de Sobres',
    icon: 'Mail',
    description: 'Contaremos con una urna especial para sobres con tu obsequio el día del evento en el salón.',
    actionText: 'MÁS INFORMACIÓN',
    copyValue: 'Lluvia de Sobres: Depósito en sobre cerrado al ingresar al salón.',
  },
];

// Suggested ambient music track matching the "Quiet Luxury" classical romance aesthetic
// (E.g. soft orchestral track)
export const BACKGROUND_MUSIC_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; // A nice instrumental piano melody
