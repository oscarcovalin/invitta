import { LocationInfo, GalleryImage, RegistryOption } from './types';
import royalHero from './assets/royal-hero.png';
import royalGallery01 from './assets/royal-gallery-01.png';
import royalGallery02 from './assets/royal-gallery-02.png';
import royalGallery03 from './assets/royal-gallery-03.png';
import royalGallery04 from './assets/royal-gallery-04.png';
import royalGallery05 from './assets/royal-gallery-05.png';
import royalGallery06 from './assets/royal-gallery-06.png';

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
  hero: royalHero,
  countdownBg: royalGallery05,
  dressCodeBg: royalGallery04,
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
    url: royalGallery01,
    alt: 'Quinceañera en vestido azul real',
  },
  {
    id: 'gal-2',
    url: royalGallery02,
    alt: 'Retrato de gala bajo el vitral',
  },
  {
    id: 'gal-3',
    url: royalGallery03,
    alt: 'Retrato editorial junto a la lámpara',
  },
  {
    id: 'gal-4',
    url: royalGallery04,
    alt: 'Vestido azul real sobre la escalera',
  },
  {
    id: 'gal-5',
    url: royalGallery05,
    alt: 'Quinceañera en el salón de columnas',
  },
  {
    id: 'gal-6',
    url: royalGallery06,
    alt: 'Retrato de gala con cauda azul',
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
