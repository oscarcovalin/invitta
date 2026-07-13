import { LocationInfo, GalleryImage, RegistryOption } from './types';

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
  hero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGp8n5Ng6p1-hEL10ct7BPcL1m3RfIvLKaMbyAEEUhf0mZykSbOM1O2qochoiZoWMcnoGY5yT7r7uPd_GNUiqLkz9GIbEltfS1FlhgdmPo4vFvMAZKA72nu9ggR-4R5NefFXF8E--mszs4t-TxbKXy2uTqma3Kik5UKHnkJ6DFOi40Hu0Vk4gRoGrkzi_kiwKO4ECZWd_yfNrWRDmcyHWlKiQKQ_jGzVn04aBvq-nyeFtg1ew41eMxAGVkVjjq1CqlbjwrlfVai_c',
  countdownBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3mOR_AUaFh8Ii8Pi74QfwogxFgaEfY6NBPu3HV-B49kW3bvm3CCiXH3rReh6eQ2d57aBy1Efm-pJI6vJ06spX0kZhECc7oTfe8rrNCbM-HBLSgoBHEt5a4KF9a-guS8vhoHnvUofD1fxUMXjBtiZqu2krG6klmu0jPt_UhiJKHFw4-wW4OPG-3Y3L1fspyY3VJDlptycuhxe2Ro30xj7JBelicUduJMbyJoCSlbup68AmstNYHEULlCBfePC7PH4jY1Oqg0dOe1E',
  dressCodeBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvfHbfCANp8YxxIdVEmZJngRGQSp-9M8vWN1OohatnPdIWdOkT93PZbucEfGNcnS2FuFcfBW2BK20c2-hswKclndmWPnxHKN46GVvI2hL1Vnh0rD4Q3yg6uKCeb3xlQVdLvSgHhuPdL6WLz1KcPz2rgSnYKyY1Y_tbF0mUWvuNaFxHkXQ6wiIUD1ltoO4LspVjLARNJtmMMh0iklFsPJM-dBOl8oNmb73Ge3VQSncHQJ7dg7zfZO9qvljtJdRE_2Dy3ncMmB-X_lE',
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
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp1UneYNO0MeP74YJFv-y9jJMLb985CltX4HNGUUjNDtuuArrnBazRw1y8JY4ocNSSVB7thJbUs5Y0JsrKLhP36U2RTf2ajfuSB1cTYJBzzH2k7JPU3Yqc3bnne6vmtM_IzZz3xspY9RSNyK6_Jiem3qMPI3VTxxyPbODjaU5hNZg3j1N72UYjYvO28CCyHom3thNtdCxb2_b2_Cpx8tXXLwhAOCASX3WFLByQzjmluZMgoupI8EMQKbBXz5RGHjHrvYgnV8CWW3k',
    alt: 'Ana Camila en un vestido rojo junto a un coche clásico negro',
  },
  {
    id: 'gal-2',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmkBAwKY_AcELlMqiUh3i3ymA0rcSEoI4fPk7xt_kZ4fqeOvtwD1KaHbKYYRhDxUiNMxD_u_GaE2klTDpVGup_mwgPOPZvPK8SCycbyRxVUQhEc74tR96p35pp3PFESVADJ6JFQI7MZBEmxnpchGx16isgrBQW4H0vXjQohQ7VYQRysI8hfyiD9jaurOdTCYJ_hhjgukTYHtgEqiC_HtxaQfW9MtpMl92RxEVUF4_UryVzP2Lq_A-mwaG_WKGdzeLx0mH0Q5gP1MI',
    alt: 'Detalle de manos con guantes rojos sosteniendo un ramo de rosas blancas',
  },
  {
    id: 'gal-3',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA63u7Nf29k4YUsMPLvfbG2-fwaDaSW4PfhRApXk4bXsn8nSyNp6FBZwg512EtyMt8xgd_-TvEGPh10Dm-eTFvOL3TAxXGrLjPa_GFtcn19pn5-ZT0vG3rJlZnw_oyQy3oT3wyHOniIh9QwlP23FpGtx5DSdr4lZW4ir6NFdvTHIZmQRBcrpJjh194DffPlSO2J2RYFZ_w0J4AwPRVx9UUWPtfnPDV0P7spgv2V5Ie9G9IgQ9aes8-kaRjlRPf6u1uaX_A8XbLBCtQ',
    alt: 'Ana Camila en un vestido de encaje azul cielo en un claro del bosque',
  },
  {
    id: 'gal-4',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBszB4aYMznOR1Sn24ktvDMGgQVfXwA5I_jSBjJcU6Vw5_Fs7Qh-7Zab4VQaZXKdBS7RsEieC15SxSu_FqqASjNN-Yu1OOOT2LRyi_sl51feM8a5SU8B_0i6egw3xMAAtuVqTm-hnUGKTT4EN2VwOQvtcVlqA_U5cQqXeRt_K4XO6OC5LzB1FDbulSXN17zix91rrkx5ut8BhetyQtncA-w5ocLEvVKpkyrYyVpwZYtDsIiE1q0CL2WTmtDJMUuZFevsHONsbRncic',
    alt: 'Gran arco de piedra que conduce a un jardín iluminado por el sol',
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
