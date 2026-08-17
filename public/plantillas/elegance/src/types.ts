export interface GuestRSVP {
  id: string;
  name: string;
  email: string;
  attending: boolean;
  guestsCount: number;
  message?: string;
  submittedAt: string;
}

export interface LocationInfo {
  id: 'ceremony' | 'reception';
  title: string;
  place: string;
  time: string;
  address: string;
  postalCode: string;
  city: string;
  googleMapsUrl: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

export interface RegistryOption {
  id: string;
  title: string;
  icon: string;
  description: string;
  actionText: string;
  actionUrl?: string;
  copyValue?: string;
}
