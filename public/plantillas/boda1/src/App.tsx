import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import confetti from "canvas-confetti";
import { RSVP, GiftRegistryOption } from "./types";
import { Countdown } from "./components/Countdown";
import { GiftRegistryModal } from "./components/GiftRegistryModal";
import { RsvpAdmin } from "./components/RsvpAdmin";
import { MusicPlayer } from "./components/MusicPlayer";
import { ParallaxImage } from "./components/ParallaxImage";
import { FloatingParticles } from "./components/FloatingParticles";
import { DigitalEnvelope } from "./components/DigitalEnvelope";
import { CollaborativeAlbum } from "./components/CollaborativeAlbum";
import { LodgingSuggestions } from "./components/LodgingSuggestions";
import { ImageReveal } from "./components/ImageReveal";
import { Camera, Church, GlassWater, Sparkles, Heart, Music, ShoppingBag, Gift, Landmark, Mail } from "lucide-react";
import midnightHero from "./assets/midnight-hero.jpg";
import midnightGallery02 from "./assets/midnight-gallery-02.jpg";
import midnightGallery03 from "./assets/midnight-gallery-03.jpg";
import midnightGallery04 from "./assets/midnight-gallery-04.jpg";
import midnightGallery05 from "./assets/midnight-gallery-05.jpg";
import midnightGallery06 from "./assets/midnight-gallery-06.jpg";
import midnightGallery07 from "./assets/midnight-gallery-07.jpg";
import midnightGallery08 from "./assets/midnight-gallery-08.jpg";
import midnightGallery09 from "./assets/midnight-gallery-09.jpg";
import midnightGallery10 from "./assets/midnight-gallery-10.jpg";
import midnightGallery11 from "./assets/midnight-gallery-11.jpg";
import midnightGallery12 from "./assets/midnight-gallery-12.jpg";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.25,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 60, filter: "blur(8px)" },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: { 
      duration: 1.2, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  }
};

type PublicInvitationData = {
  celebrantName?: string;
  eventTitle?: string;
  eventDate?: string;
  whatsapp?: string;
  guestToken?: string;
  ceremony?: { name?: string; time?: string; address?: string; mapUrl?: string };
  reception?: { name?: string; time?: string; address?: string; mapUrl?: string };
};

function getInvitationData(): PublicInvitationData {
  if (typeof window === "undefined") return {};
  const candidate = (window as Window & { INVITATION_DATA?: PublicInvitationData }).INVITATION_DATA;
  return candidate && typeof candidate === "object" ? candidate : {};
}

function formatInvitationDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return {
    full: `${lookup("day")} ${lookup("month")} ${lookup("year")}`,
    dayMonth: `${lookup("day")} ${lookup("month")}`,
    weekday: new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(date),
  };
}

function firstLine(value?: string, fallback = "") {
  return value?.trim() || fallback;
}

export default function App() {
  const invitation = getInvitationData();
  const couple = firstLine(invitation.celebrantName, "Ana Camila & Carlos").split(/\s*(?:&|\by\b)\s*/i).filter(Boolean);
  const brideName = couple[0] || "Ana Camila";
  const groomName = couple[1] || "Carlos";
  const eventDate = formatInvitationDate(invitation.eventDate);
  const ceremony = invitation.ceremony || {};
  const reception = invitation.reception || {};
  const ceremonyName = firstLine(ceremony.name, "Parroquia Sagrado Corazón de Jesús");
  const receptionName = firstLine(reception.name, "Cantabria Salón de Eventos");
  const ceremonyTime = firstLine(ceremony.time, "3:00 P.M.");
  const receptionTime = firstLine(reception.time, "9:00 P.M.");
  const coupleForCopy = `${brideName} y ${groomName}`;
  const usesStudioGuestPass = Boolean(invitation.eventDate || invitation.guestToken);
  // Parallax calculations
  const { scrollY } = useScroll();
  // Hero cover image: move down/up slowly as we scroll to create a classic slow-parallax feel
  const yHero = useTransform(scrollY, [0, 1000], [0, 100]);
  // Countdown banner background image: translate slowly to create depth
  const yCountdown = useTransform(scrollY, [200, 1800], [-80, 80]);

  // Entrance overlay opened state
  const [isOpened, setIsOpened] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("invitation_opened") === "true";
    }
    return false;
  });

  // Lock body scrolling when the elegant entrance gate is shown
  useEffect(() => {
    if (!isOpened) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpened]);

  // Scroll Progress State
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation & UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("invite");
  
  // Gift Registry Modal State
  const [selectedRegistry, setSelectedRegistry] = useState<GiftRegistryOption | null>(null);

  // Gallery Lightbox Index State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // RSVP Submissions State
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [rsvpSubmitted, setRsvpSubmitted] = useState<RSVP | null>(null);

  // RSVP Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [guestsCount, setGuestsCount] = useState(2);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [rsvpTab, setRsvpTab] = useState<"rsvp" | "pass">("rsvp");
  const [passSearchQuery, setPassSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RSVP[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Load RSVPs from localStorage on Mount
  useEffect(() => {
    refreshRsvps();
  }, []);

  // Gallery Lightbox keyboard navigation & body scroll lock
  useEffect(() => {
    if (lightboxIndex === null) return;
    
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % galleryImages.length : null));
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : null));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [lightboxIndex]);

  const refreshRsvps = () => {
    const list: RSVP[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("rsvp_")) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || "");
          list.push(item);
        } catch (e) {
          console.error("Error parsing RSVP record", e);
        }
      }
    }
    // Sort by timestamp descending
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRsvps(list);
  };

  // Subtle confetti celebration matching Quiet Luxury palette (Sage, gold, rose, ink, paper)
  const triggerCelebration = () => {
    const colors = ["#b38577", "#8fa89b", "#d4af37", "#f4efe9", "#2f3e22"];
    
    // Left side burst
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: colors,
    });
    
    // Right side burst
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: colors,
    });
  };

  // RSVP Submission Handler
  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Por favor, introduce tu nombre completo.");
      return;
    }
    if (attending === null) {
      setFormError("Por favor, selecciona si podrás asistir o no.");
      return;
    }

    const assignedTable = attending ? ("Mesa " + (Math.floor(Math.random() * 15) + 1)) : undefined;

    const newRsvp: RSVP = {
      id: "rsvp_" + Date.now(),
      name: name.trim(),
      email: email.trim(),
      attending,
      guestsCount: attending ? guestsCount : 0,
      dietaryNotes: dietaryNotes.trim() || undefined,
      timestamp: new Date().toLocaleString("es-MX", { timeZone: "America/Chihuahua" }),
      message: message.trim() || undefined,
      tableNumber: assignedTable,
    };

    try {
      localStorage.setItem(newRsvp.id, JSON.stringify(newRsvp));
      setRsvpSubmitted(newRsvp);
      refreshRsvps();
      triggerCelebration();
      
      // Reset form fields
      setName("");
      setEmail("");
      setAttending(null);
      setGuestsCount(2);
      setDietaryNotes("");
      setMessage("");
      setFormError("");
    } catch (e) {
      console.error(e);
      setFormError("Hubo un problema al registrar tu asistencia. Por favor, vuelve a intentarlo.");
    }
  };

  // Helper to generate elegant WhatsApp RSVP Link
  const getWhatsAppUrl = (
    nameVal?: string,
    attendingVal?: boolean | null,
    guestsVal?: number,
    dietaryVal?: string,
    msgVal?: string,
    tableVal?: string
  ) => {
    const phone = String(invitation.whatsapp || "").replace(/\D/g, "");
    let text = `¡Hola ${coupleForCopy}! ✨ Quiero confirmar mi asistencia a su Boda. 🌸`;
    if (nameVal) {
      text = `¡Hola ${coupleForCopy}! ✨ Soy *${nameVal}*.\n\n`;
      if (attendingVal === true) {
        text += `Confirmo con mucha alegría que *SÍ asistiré* a su hermosa celebración de Boda. 🌸🤍\n`;
        text += `🎟️ Pases solicitados: *${guestsVal || 1}*\n`;
        if (tableVal) {
          text += `📍 Mesa asignada: *${tableVal}*\n`;
        }
        if (dietaryVal) {
          text += `🍽️ Especificación alimenticia: _${dietaryVal}_\n`;
        }
      } else if (attendingVal === false) {
        text += `Les agradezco de corazón la hermosa invitación. Lamentablemente *NO podré asistir* en esta ocasión. Les deseo una boda de ensueño llena de amor y felicidad infinita. ✨💖\n`;
      }
      if (msgVal) {
        text += `\n💬 Mensaje especial:\n"${msgVal}"`;
      }
    }
    return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : "#";
  };

  const handleWhatsAppRsvp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Por favor, introduce tu nombre completo para generar tu confirmación por WhatsApp.");
      return;
    }
    if (attending === null) {
      setFormError("Por favor, selecciona si podrás asistir o no.");
      return;
    }

    const assignedTable = attending ? ("Mesa " + (Math.floor(Math.random() * 15) + 1)) : undefined;

    const newRsvp: RSVP = {
      id: "rsvp_" + Date.now(),
      name: name.trim(),
      email: email.trim(),
      attending,
      guestsCount: attending ? guestsCount : 0,
      dietaryNotes: dietaryNotes.trim() || undefined,
      timestamp: new Date().toLocaleString("es-MX", { timeZone: "America/Chihuahua" }),
      message: message.trim() || undefined,
      tableNumber: assignedTable,
    };

    try {
      localStorage.setItem(newRsvp.id, JSON.stringify(newRsvp));
      setRsvpSubmitted(newRsvp);
      refreshRsvps();
      triggerCelebration();

      // Reset form fields
      setName("");
      setEmail("");
      setAttending(null);
      setGuestsCount(2);
      setDietaryNotes("");
      setMessage("");
      setFormError("");
    } catch (e) {
      console.error(e);
    }

    const whatsappUrl = getWhatsAppUrl(
      newRsvp.name,
      newRsvp.attending,
      newRsvp.guestsCount,
      newRsvp.dietaryNotes,
      newRsvp.message,
      newRsvp.tableNumber
    );
    window.open(whatsappUrl, "_blank");
  };

  // RSVP Record Deletion
  const handleDeleteRsvp = (id: string) => {
    localStorage.removeItem(id);
    refreshRsvps();
  };

  const handleClearAllRsvps = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("rsvp_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    refreshRsvps();
    alert("Base de datos de confirmaciones vaciada con éxito.");
  };

  // Gift Registry Database
  const registries: GiftRegistryOption[] = [
    {
      id: "amazon",
      name: "Amazon",
      icon: "featured_seasonal",
      details: "Hemos seleccionado algunos artículos ideales para equipar nuestro nuevo hogar y etapas de vida. Puedes acceder directamente a nuestra mesa de regalos de Amazon aquí.",
      link: "https://www.amazon.com.mx/baby-reg" // Simulated premium mesa
    },
    {
      id: "liverpool",
      name: "Liverpool",
      icon: "card_giftcard",
      details: "Agradecemos enormemente tu cariño. Nuestra mesa de regalos está registrada en Liverpool bajo el número de evento: 51239845 o a nuestros nombres.",
      link: "https://www.liverpool.com.mx/tienda/giftregistry"
    },
    {
      id: "bank",
      name: "Datos Bancarios",
      icon: "account_balance",
      details: "Si prefieres realizar una aportación por transferencia o depósito bancario directo, ponemos a tu disposición los siguientes datos de confianza:",
      bank: "Banco Santander",
      beneficiary: "Ana Camila & Carlos",
      clabe: "0141 5065 5047 8820 12"
    },
    {
      id: "envelopes",
      name: "Lluvia de Sobres",
      icon: "mail",
      details: "La lluvia de sobres es la tradición de depositar vuestra aportación económica en un sobre el día del evento. Contaremos con un cofre muy especial y sobres en la entrada del salón de recepción para su comodidad."
    }
  ];

  // Gallery Editorial Assets
  const galleryImages = [
    {
      src: midnightHero,
      caption: "Retrato principal de gala, Sesión de Boda"
    },
    {
      src: midnightGallery02,
      caption: "Retrato clásico con auto vintage, Hacienda del Fresno"
    },
    {
      src: midnightGallery03,
      caption: "Detalle de ramo de novia y anillos de boda"
    },
    {
      src: midnightGallery04,
      caption: "Detalle romántico, Bosque Silvestre"
    },
    {
      src: midnightGallery05,
      caption: "Arcadas históricas y arquitectura de la recepción"
    },
    {
      src: midnightGallery06,
      caption: "Una historia bajo la lluvia"
    },
    {
      src: midnightGallery07,
      caption: "Arquitectura y complicidad"
    },
    {
      src: midnightGallery08,
      caption: "La alegria de encontrarnos"
    },
    {
      src: midnightGallery09,
      caption: "Un abrazo que lo dice todo"
    },
    {
      src: midnightGallery10,
      caption: "Color para nuestra historia"
    },
    {
      src: midnightGallery11,
      caption: "Entre cupulas y promesas"
    },
    {
      src: midnightGallery12,
      caption: "Una noche para siempre"
    }
  ];

  // Helper to scroll smoothly
  const scrollToSection = (id: string) => {
    setIsSidebarOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleOpenInvitation = () => {
    sessionStorage.setItem("invitation_opened", "true");
    setIsOpened(true);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!isOpened && (
          <DigitalEnvelope onOpen={handleOpenInvitation} />
        )}
      </AnimatePresence>

      <div className="bg-paper min-h-screen text-ink flex flex-col font-sans selection:bg-sage/20 relative">
        
        {/* Subtle Scroll Progress Bar at the very top */}
        <div className="fixed top-0 left-0 w-full h-[2px] bg-sage/10 z-50 pointer-events-none">
          <div 
            className="h-full bg-sage transition-all duration-75 ease-out" 
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Background Ambient Soundtrack Player */}
        <MusicPlayer autoPlay={isOpened} />

      {/* Top Header Navigation */}
      <header className="bg-transparent absolute top-0 left-0 w-full z-40 flex justify-between items-center px-margin-mobile md:px-gutter py-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            id="hamburger-menu-btn"
            className="text-primary hover:text-sage transition-colors p-2 cursor-pointer"
            aria-label="Abrir Menú de Navegación"
          >
            <span className="material-symbols-outlined text-3xl font-light">menu</span>
          </button>
        </div>
        
        <h1 className="font-serif font-normal text-xl md:text-2xl tracking-normal text-ink select-none">
          Invi<span className="italic text-sage">tta</span>
        </h1>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => scrollToSection("rsvp")}
            id="rsvp-header-anchor"
            className="text-subheading-caps text-[10px] text-primary hover:text-sage transition-all duration-300 font-semibold uppercase tracking-[0.2em] border-b border-primary/20 pb-0.5"
          >
            CONFIRMAR RSVP
          </button>
        </div>
      </header>

      {/* Elegant Drawer Navigation Menu */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop blur */}
          <div 
            onClick={() => setIsSidebarOpen(false)}
            id="sidebar-backdrop"
            className="absolute inset-0 bg-ink/60 backdrop-blur-xs transition-opacity duration-500"
          ></div>

          {/* Drawer Box */}
          <div 
            id="sidebar-menu-box"
            className="relative w-80 max-w-sm bg-paper h-full p-10 flex flex-col justify-between border-r border-outline-variant/30 shadow-2xl transition-all duration-500 transform translate-x-0"
          >
            {/* Corner Ornaments */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-sage/40"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-sage/40"></div>

            {/* Close */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              id="sidebar-close-btn"
              className="absolute top-4 right-4 text-ink/40 hover:text-sage transition-colors p-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            {/* Logo Header */}
            <div className="pt-8 text-center space-y-3">
              <span className="text-subheading-caps text-[9px] text-sage tracking-[0.3em] block">Nuestra Boda</span>
              <h2 className="font-serif text-3xl text-ink select-none">
                Invi<span className="italic text-sage">tta</span>
              </h2>
              <div className="w-8 h-[1px] bg-sage/30 mx-auto"></div>
            </div>

            {/* Nav List */}
            <nav className="flex flex-col gap-6 text-left my-auto">
              <button 
                onClick={() => scrollToSection("hero")}
                className="text-subheading-caps text-left text-[11px] text-ink/80 hover:text-sage tracking-[0.2em] transition-colors py-2 flex items-center gap-3 border-b border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-sm text-sage">favorite</span>
                {coupleForCopy}
              </button>
              <button 
                onClick={() => scrollToSection("honors")}
                className="text-subheading-caps text-left text-[11px] text-ink/80 hover:text-sage tracking-[0.2em] transition-colors py-2 flex items-center gap-3 border-b border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-sm text-sage">family_history</span>
                Padres y Padrinos
              </button>
              <button 
                onClick={() => scrollToSection("countdown")}
                className="text-subheading-caps text-left text-[11px] text-ink/80 hover:text-sage tracking-[0.2em] transition-colors py-2 flex items-center gap-3 border-b border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-sm text-sage">calendar_today</span>
                Fecha del Evento
              </button>
              <button 
                onClick={() => scrollToSection("details")}
                className="text-subheading-caps text-left text-[11px] text-ink/80 hover:text-sage tracking-[0.2em] transition-colors py-2 flex items-center gap-3 border-b border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-sm text-sage">distance</span>
                Ubicaciones
              </button>
              <button 
                onClick={() => scrollToSection("registry")}
                className="text-subheading-caps text-left text-[11px] text-ink/80 hover:text-sage tracking-[0.2em] transition-colors py-2 flex items-center gap-3 border-b border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-sm text-sage">redeem</span>
                Mesa de Regalos
              </button>
              <button 
                onClick={() => scrollToSection("gallery")}
                className="text-subheading-caps text-left text-[11px] text-ink/80 hover:text-sage tracking-[0.2em] transition-colors py-2 flex items-center gap-3 border-b border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-sm text-sage">photo_library</span>
                Galería Editorial
              </button>
              <button 
                onClick={() => scrollToSection("rsvp")}
                className="text-subheading-caps text-left text-[11px] text-ink/80 hover:text-sage tracking-[0.2em] transition-colors py-2 flex items-center gap-3 border-b border-outline-variant/10"
              >
                <span className="material-symbols-outlined text-sm text-sage">mail</span>
                Confirmar Asistencia
              </button>
            </nav>

            {/* Footer Signoff */}
            <div className="text-center">
              <p className="text-[9px] text-on-surface-variant/40 tracking-[0.3em] uppercase">
                © 2026 ÉLÉGANCE DIGITAL ATELIER
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="w-full overflow-hidden flex-grow">
        
        {/* HERO SECTION */}
        <section id="hero" className="relative min-h-screen flex flex-col md:flex-row items-center pt-24 md:pt-0">
          {/* Subtle floating gold gold dust / rose petals particles in the background */}
          <FloatingParticles />

          {/* Description Text Side */}
          <motion.div 
            initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:w-5/12 flex flex-col justify-center items-start px-margin-mobile md:pl-24 z-10 space-y-8 pt-12 md:pt-0"
          >
            <span className="text-subheading-caps text-sage tracking-[0.4em] font-medium">{firstLine(invitation.eventTitle, "Nuestra Boda")}</span>
            
            <h2 className="font-display text-ink uppercase flex flex-col select-none">
              <span className="block text-4xl md:text-5xl font-light leading-none tracking-tight">{brideName}</span>
              <span className="block md:ml-12 italic text-sage text-5xl md:text-7xl font-normal leading-none my-1">&amp;</span>
              <span className="block md:ml-24 text-4xl md:text-5xl font-light leading-none tracking-tight">{groomName}</span>
            </h2>

            <div className="mt-8 md:mt-16 border-l border-outline-variant/40 pl-6 relative before:absolute before:left-[-1px] before:top-0 before:w-px before:h-12 before:bg-sage">
              <p className="font-sans font-light text-on-surface-variant max-w-sm italic text-sm md:text-base leading-relaxed">
                "Hay momentos inolvidables que se atesoran en el corazón para siempre, por esa razón, queremos que compartan con nosotros este día tan especial..."
              </p>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => scrollToSection("rsvp")}
                id="hero-cta-btn"
                className="px-10 py-4 bg-ink text-paper text-xs tracking-[0.3em] font-semibold uppercase hover:bg-sage transition-all duration-500 rounded-xs flex items-center gap-3 cursor-pointer select-none"
              >
                CONFIRMAR ASISTENCIA
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </motion.div>

          {/* Large Beautiful Cover Photo Side */}
          <ImageReveal
            src={midnightHero}
            alt={`Retrato editorial de ${brideName} y ${groomName}`}
            className="w-full md:w-7/12 h-[65vh] md:h-screen mt-12 md:mt-0 group"
            imageClassName="object-center md:object-right"
            yParallax={yHero}
            isHero={true}
            breathe={true}
            showBorder={true}
            showBackdrop={true}
          >
            {/* Elegant soft fade-in masks */}
            <div className="absolute inset-0 bg-gradient-to-r from-paper via-transparent to-transparent md:block hidden opacity-60 pointer-events-none z-30"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent md:hidden block opacity-90 h-32 bottom-0 top-auto pointer-events-none z-30"></div>
          </ImageReveal>
        </section>

        {/* FAMILY HONORS SECTION */}
        <section id="honors" className="py-section-gap px-margin-mobile bg-surface-container-low/40">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24">
              <div className="md:col-span-7 space-y-20 text-left">
                
                {/* Parents Block */}
                <motion.div 
                  initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  <h3 className="text-subheading-caps text-sage tracking-[0.25em] flex items-center gap-4">
                    <span className="w-8 h-px bg-sage/50"></span>
                    Padres de la Novia
                  </h3>
                  <div className="flex flex-col gap-4">
                    <span className="font-display font-light text-2xl md:text-3.5xl text-ink leading-tight">
                      Susana Almazán Bernal
                    </span>
                    <span className="font-serif-accent italic text-sage text-2xl pl-12">&amp;</span>
                    <span className="font-display font-light text-2xl md:text-3.5xl text-ink leading-tight pl-16">
                      César Roberto Zavala
                    </span>
                  </div>
                </motion.div>

                {/* Godparents Block */}
                <motion.div 
                  initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6 pt-6"
                >
                  <h3 className="text-subheading-caps text-sage tracking-[0.25em] flex items-center gap-4">
                    <span className="w-8 h-px bg-sage/50"></span>
                    Padres del Novio
                  </h3>
                  <div className="flex flex-col gap-4">
                    <span className="font-display font-light text-2xl md:text-3.5xl text-ink leading-tight">
                      Diana Almanza García
                    </span>
                    <span className="font-serif-accent italic text-sage text-2xl pl-12">&amp;</span>
                    <span className="font-display font-light text-2xl md:text-3.5xl text-ink leading-tight pl-16">
                      Enrique O'Farrill Zúñiga
                    </span>
                  </div>
                </motion.div>

              </div>

              {/* Chambelán Block (Asymmetric Placement) */}
              <motion.div 
                initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="md:col-span-5 mt-12 md:mt-32"
              >
                <div className="space-y-6 p-8 md:p-12 bg-surface-container-low/60 border border-outline-variant/15 relative">
                  {/* Fine design brackets */}
                  <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-sage/40"></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-sage/40"></div>
                  
                  <h3 className="text-subheading-caps text-sage tracking-[0.3em] text-[10px] font-semibold">
                    Nuestros Padrinos de Honor
                  </h3>
                  
                  <span className="font-display text-2xl md:text-3xl text-ink block font-light tracking-tight mt-4">
                    Patricia &amp; Alejandro Farrera
                  </span>
                  
                  <div className="w-12 h-[1px] bg-sage/40 mt-6"></div>
                  <p className="text-xs text-on-surface-variant font-light italic leading-relaxed pt-2">
                    "Honrados de contar con su gran compañía, bendición y apoyo constante en esta hermosa unión."
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* COUNTDOWN BANNER */}
        <section id="countdown" className="relative py-32 bg-surface-container-low text-ink overflow-hidden">
          {/* Cinematic Background Image Overlay */}
          <div className="absolute inset-0 overflow-hidden">
            <ImageReveal
              src={midnightGallery07}
              alt="Cinematic evening forest background"
              className="absolute inset-0 w-full h-full"
              yParallax={yCountdown}
              parallaxClass="absolute inset-0 h-[130%] -top-[15%] w-full"
              showBorder={false}
              showBackdrop={false}
              targetOpacity={0.25}
              viewportMargin="0px"
            />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-margin-mobile flex flex-col md:flex-row items-center justify-between gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -40, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-left space-y-6"
            >
              <h3 className="text-subheading-caps text-sage tracking-[0.4em] flex items-center gap-4">
                <span className="w-12 h-px bg-sage"></span>
                Guarda la Fecha Especial
              </h3>
              <span className="font-display font-light text-5xl md:text-7xl block leading-tight tracking-tight">
                {eventDate ? eventDate.dayMonth : "12 Diciembre"} <br/>
                <span className="italic text-sage font-normal">{eventDate ? eventDate.full.split(" ").pop() : "2026"}</span>
              </span>
              <p className="font-sans text-xs text-ink/60 uppercase tracking-widest">
                {receptionName}
              </p>
            </motion.div>

            {/* Live Countdown Clock Component */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Countdown eventDate={invitation.eventDate} eventTime={ceremonyTime} coupleName={`${brideName} y ${groomName}`} ceremonyName={ceremonyName} receptionName={receptionName} location={firstLine(reception.address, "")} />
            </motion.div>
          </div>
        </section>

        {/* CEREMONY & LOCATIONS DETAILS */}
        <section id="details" className="py-section-gap px-margin-mobile bg-surface-container-low/20">
          <div className="max-w-6xl mx-auto space-y-14">
            
            <motion.div 
              initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-4"
            >
              <span className="text-subheading-caps text-sage tracking-[0.4em]">Solemnidad &amp; Festejo</span>
              <h2 className="font-display font-light text-3xl md:text-5xl text-ink tracking-tight">
                Detalles del Evento
              </h2>
              <div className="w-16 h-[1px] bg-sage/40 mx-auto"></div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              
              {/* Church Ceremony */}
              <motion.div 
                initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-paper border border-outline-variant/20 p-8 md:p-12 flex flex-col justify-between hover:border-sage transition-colors duration-500 relative group"
              >
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-sage/20 group-hover:border-sage transition-colors"></div>
                
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-full border border-sage/30 flex items-center justify-center text-sage">
                    <span className="material-symbols-outlined text-3xl font-light">church</span>
                  </div>

                  <h3 className="font-display text-3xl text-ink font-light">Ceremonia Religiosa</h3>
                  
                  <div className="space-y-3 text-sm md:text-base leading-relaxed text-on-surface-variant font-light">
                    <p className="font-semibold text-ink text-base">{ceremonyName}</p>
                    <p className="text-sage font-semibold tracking-[0.2em] uppercase text-xs">
                      {eventDate ? eventDate.weekday : "Sábado 12 de Diciembre"} • {ceremonyTime}
                    </p>
                    <p className="opacity-80 pt-2 font-sans text-xs md:text-sm">
                      {firstLine(ceremony.address, "Blv. Calle 20 de Noviembre y Av. Melchor Ocampo, Col. Pacífico, C.P. 31030 Chihuahua, Chihuahua.")}
                    </p>
                  </div>
                </div>

                <div className="pt-8 mt-4 flex flex-wrap gap-4 items-center">
                  <a 
                    href={firstLine(ceremony.mapUrl, "https://maps.google.com/?q=Parroquia+Sagrado+Corazon+de+Jesus+Chihuahua+Calle+20+de+Noviembre")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[11px] font-subheading-caps tracking-[0.25em] text-ink hover:text-sage border-b border-ink/45 hover:border-sage pb-1 transition-all"
                  >
                    CÓMO LLEGAR
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>

                </div>
              </motion.div>

              {/* Party Reception */}
              <motion.div 
                initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="bg-paper border border-outline-variant/20 p-8 md:p-12 flex flex-col justify-between hover:border-sage transition-colors duration-500 relative group"
              >
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-sage/20 group-hover:border-sage transition-colors"></div>

                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-full border border-sage/30 flex items-center justify-center text-sage">
                    <span className="material-symbols-outlined text-3xl font-light">celebration</span>
                  </div>

                  <h3 className="font-display text-3xl text-ink font-light">Salón de Recepción</h3>
                  
                  <div className="space-y-3 text-sm md:text-base leading-relaxed text-on-surface-variant font-light">
                    <p className="font-semibold text-ink text-base">{receptionName}</p>
                    <p className="text-sage font-semibold tracking-[0.2em] uppercase text-xs">
                      {eventDate ? eventDate.weekday : "Sábado 12 de Diciembre"} • {receptionTime}
                    </p>
                    <p className="opacity-80 pt-2 font-sans text-xs md:text-sm">
                      {firstLine(reception.address, "Blv. Col. Sierra Magisterial #6103 esq. con Tejas, Col. Los Ángeles, C.P. 31380 Chihuahua, Chihuahua.")}
                    </p>
                  </div>
                </div>

                <div className="pt-8 mt-4 flex flex-wrap gap-4 items-center">
                  <a 
                    href={firstLine(reception.mapUrl, "https://maps.google.com/?q=Cantabria+Salon+de+Eventos+Chihuahua+Sierra+Magisterial")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[11px] font-subheading-caps tracking-[0.25em] text-ink hover:text-sage border-b border-ink/45 hover:border-sage pb-1 transition-all"
                  >
                    CÓMO LLEGAR
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>

                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* DRESS CODE SECTION */}
        <section className="relative py-section-gap bg-surface-container-low text-ink flex flex-col md:flex-row items-center min-h-[70vh]">
          {/* Visual Fabric Texture Side */}
          <ImageReveal
            src={midnightGallery12}
            alt="Fotografía premium de detalles de vestidos de boda elegantes"
            className="w-full md:w-1/2 h-[50vh] md:h-full absolute md:relative top-0 left-0 opacity-20 md:opacity-100 overflow-hidden"
            imageClassName="object-center"
            breathe={true}
            showBorder={true}
            showBackdrop={true}
            viewportMargin="-100px"
          />

          {/* Details Explanation Side */}
          <motion.div 
            initial={{ opacity: 0, x: 40, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:w-1/2 relative z-10 px-margin-mobile md:px-24 text-center md:text-left space-y-12 py-24 md:py-0"
          >
            <div className="space-y-6">
              <span className="text-subheading-caps text-sage tracking-[0.4em] flex items-center justify-center md:justify-start gap-4">
                <span className="material-symbols-outlined text-2xl font-light">apparel</span>
                Código de Vestimenta
              </span>
              <h4 className="font-display font-light tracking-widest text-5xl md:text-7xl">
                FORMAL
              </h4>
              <p className="text-xs uppercase text-sage tracking-widest">
                Traje de Noche • Vestido Largo o Cocktail
              </p>
            </div>

            <div className="space-y-8 pl-0 md:pl-8 border-l-0 md:border-l border-sage/40">
              <p className="font-display text-lg md:text-xl italic text-ink/85 font-light leading-relaxed max-w-md mx-auto md:mx-0">
                "Este es un día dedicado con mucho cariño sólo a jóvenes y adultos, agradecemos de antemano su valiosa comprensión."
              </p>
              
              <div className="flex items-center justify-center md:justify-start gap-4">
                <span className="w-8 h-[1px] bg-sage/50"></span>
                <span className="text-subheading-caps tracking-[0.3em] text-sage text-xs font-semibold">
                  EVENTO SIN NIÑOS
                </span>
                <span className="w-8 h-[1px] bg-sage/50"></span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* GIFT REGISTRY SECTION */}
        <section id="registry" className="py-section-gap px-margin-mobile bg-surface-container-low/20">
          <div className="max-w-6xl mx-auto space-y-16">
            
            <motion.div 
              initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-4"
            >
              <span className="text-subheading-caps text-sage tracking-[0.4em]">Agradecemos su Gesto</span>
              <h2 className="font-display text-3xl md:text-5xl text-ink font-light tracking-tight">
                Mesa de Regalos
              </h2>
              <p className="text-on-surface-variant text-sm md:text-base font-light max-w-2xl mx-auto font-sans leading-relaxed">
                Su grata compañía en nuestra boda es nuestro mayor regalo, pero si desean tener un detalle especial con nosotros, aquí les compartimos nuestras opciones.
              </p>
              <div className="w-12 h-[1px] bg-sage/30 mx-auto pt-2"></div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {registries.map((reg, i) => (
                <motion.div 
                  key={reg.id}
                  onClick={() => setSelectedRegistry(reg)}
                  id={`registry-card-${reg.id}`}
                  initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-paper p-8 border border-outline-variant/35 flex flex-col items-center justify-between text-center space-y-6 hover:border-sage hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-center text-sage/75 group-hover:text-sage transition-colors duration-300 h-10">
                      {reg.id === "amazon" && <ShoppingBag className="w-10 h-10 stroke-[1.5]" />}
                      {reg.id === "liverpool" && <Gift className="w-10 h-10 stroke-[1.5]" />}
                      {reg.id === "bank" && <Landmark className="w-10 h-10 stroke-[1.5]" />}
                      {reg.id === "envelopes" && <Mail className="w-10 h-10 stroke-[1.5]" />}
                    </div>
                    <h4 className="font-display text-xl text-ink font-normal">{reg.name}</h4>
                    <p className="text-xs text-on-surface-variant/70 font-light leading-relaxed line-clamp-3">
                      {reg.details}
                    </p>
                  </div>

                  {reg.id !== "envelopes" && (
                    <span className="text-subheading-caps text-[10px] text-sage tracking-[0.2em] font-semibold border-b border-sage/20 group-hover:border-sage pb-0.5 mt-4 inline-block">
                      {reg.clabe ? "VER DATOS BANCARIOS" : reg.link ? "VER MESA" : "VER DETALLES"}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* GALLERIES / ASYMMETRIC VISUAL LIGHTBOX */}
        <section id="gallery" className="py-section-gap px-margin-mobile max-w-[1600px] mx-auto bg-surface-container-low/30">
          <div className="space-y-16">
            
            <motion.div 
              initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-4"
            >
              <span className="text-subheading-caps text-sage tracking-[0.4em]">Book Fotográfico</span>
              <h2 className="font-display text-3xl md:text-5xl text-ink font-light tracking-tight">
                Book Editorial
              </h2>
              <div className="w-16 h-[1px] bg-sage/40 mx-auto"></div>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col w-full gap-0"
            >
              {galleryImages.map((img, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  className="w-full"
                >
                  <ParallaxImage
                    src={img.src}
                    alt={img.caption || `Fotografía editorial ${index + 1}`}
                    caption={img.caption}
                    onClick={() => setLightboxIndex(index)}
                  />
                </motion.div>
              ))}
            </motion.div>

          </div>
        </section>

        {/* COLLABORATIVE GUEST ALBUM WITH INTEGRATED QR CODE */}
        <CollaborativeAlbum />

        {/* VISUAL ITINERARY SECTION */}
        <section id="itinerary" className="py-28 px-margin-mobile bg-surface-container-low/30 relative overflow-hidden border-t border-b border-outline-variant/10">
          {/* Corner Floral Ornaments matching the uploaded image */}
          {/* Top-Left Ornament */}
          <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 pointer-events-none select-none opacity-40">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Soft watercolor style leaves */}
              <path d="M10 10 C 30 50, 70 60, 110 50 C 90 90, 50 110, 10 100 Z" fill="#9c5d72" opacity="0.15" />
              <path d="M10 10 C 50 30, 60 70, 50 110 C 90 90, 110 50, 10 10 Z" fill="#eac88b" opacity="0.12" />
              <path d="M10 10 C 60 10, 100 30, 120 70 C 80 80, 40 60, 10 10 Z" fill="#9c5d72" opacity="0.18" />
              {/* Delicate cream rose shapes */}
              <circle cx="35" cy="35" r="25" fill="#cf9eb2" opacity="0.45" />
              <circle cx="35" cy="35" r="18" fill="#5c2a39" opacity="0.55" />
              <circle cx="30" cy="30" r="12" fill="#9c5d72" opacity="0.5" />
              <circle cx="45" cy="45" r="15" fill="#cf9eb2" opacity="0.35" />
              {/* Elegant fine lines for branches */}
              <path d="M0 0 Q 60 40 130 60" stroke="#cf9eb2" strokeWidth="0.75" opacity="0.3" />
              <path d="M0 0 Q 40 60 70 140" stroke="#cf9eb2" strokeWidth="0.75" opacity="0.3" />
              <path d="M0 0 Q 80 20 150 20" stroke="#cf9eb2" strokeWidth="0.5" opacity="0.25" />
            </svg>
          </div>

          {/* Bottom-Right Ornament */}
          <div className="absolute bottom-0 right-0 w-48 h-48 md:w-64 md:h-64 pointer-events-none select-none opacity-40 transform rotate-180">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Soft watercolor style leaves */}
              <path d="M10 10 C 30 50, 70 60, 110 50 C 90 90, 50 110, 10 100 Z" fill="#9c5d72" opacity="0.15" />
              <path d="M10 10 C 50 30, 60 70, 50 110 C 90 90, 110 50, 10 10 Z" fill="#eac88b" opacity="0.12" />
              <path d="M10 10 C 60 10, 100 30, 120 70 C 80 80, 40 60, 10 10 Z" fill="#9c5d72" opacity="0.18" />
              {/* Delicate cream rose shapes */}
              <circle cx="35" cy="35" r="25" fill="#cf9eb2" opacity="0.45" />
              <circle cx="35" cy="35" r="18" fill="#5c2a39" opacity="0.55" />
              <circle cx="30" cy="30" r="12" fill="#9c5d72" opacity="0.5" />
              <circle cx="45" cy="45" r="15" fill="#cf9eb2" opacity="0.35" />
              {/* Elegant fine lines for branches */}
              <path d="M0 0 Q 60 40 130 60" stroke="#cf9eb2" strokeWidth="0.75" opacity="0.3" />
              <path d="M0 0 Q 40 60 70 140" stroke="#cf9eb2" strokeWidth="0.75" opacity="0.3" />
            </svg>
          </div>

          <div className="max-w-2xl mx-auto relative z-10 py-4">
            {/* Elegant Header matching the uploaded design */}
            <div className="text-center space-y-2 mb-20 select-none">
              <h2 className="font-serif text-3xl md:text-4xl text-ink font-light tracking-[0.18em] uppercase">
                PROGRAMACIÓN
              </h2>
              <p className="font-serif italic text-xl md:text-2xl text-sage tracking-wide font-light">
                para nuestra Boda
              </p>
              <div className="w-16 h-[1.5px] bg-champagne-gold/40 mx-auto mt-4"></div>
            </div>

            {/* Visual Timeline layout exactly as the uploaded template */}
            <div className="relative pl-4 pr-2 sm:px-12">
              {/* Vertical timeline line positioned left-center */}
              <div className="absolute left-20 md:left-24 top-4 bottom-4 w-[1px] bg-sage/35 pointer-events-none"></div>

              {/* Timeline Entries list */}
              <div className="space-y-12 relative">
                {[
                  {
                    time: "16:00 P.M.",
                    title: "Sesión Fotográfica de Gala",
                    description: "Capturando recuerdos eternos",
                    icon: Camera,
                  },
                  {
                    time: "17:00 P.M.",
                    title: "Ceremonia de Acción de Gracias",
                    description: "Santuario del Sagrado Corazón",
                    icon: Church,
                  },
                  {
                    time: "19:00 P.M.",
                    title: "Bienvenida y Cóctel",
                    description: "Recibimiento de los invitados en el salón",
                    icon: GlassWater,
                  },
                  {
                    time: "20:30 P.M.",
                    title: "Vals de Gala & Brindis",
                    description: "Momento estelar junto a mis seres queridos",
                    icon: Sparkles,
                  },
                  {
                    time: "21:00 P.M.",
                    title: "Banquete de Honor",
                    description: "Cena de gala en el salón principal",
                    icon: Heart,
                  },
                  {
                    time: "22:30 P.M.",
                    title: "Gran Apertura de Pista",
                    description: "Música, baile y diversión inolvidable",
                    icon: Music,
                  }
                ].map((item, index) => {
                  const IconComponent = item.icon;

                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -15, filter: "blur(6px)" }}
                      whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.9, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center relative min-h-[70px]"
                    >
                      {/* Left: Beautiful minimalist outline icon */}
                      <div className="w-16 md:w-20 flex justify-center items-center flex-shrink-0">
                        <motion.div
                          whileHover={{ scale: 1.08 }}
                          className="text-ink/70 hover:text-sage transition-colors duration-300"
                        >
                          <IconComponent className="w-7 h-7 stroke-[1.25]" />
                        </motion.div>
                      </div>

                      {/* Center: Heart marker precisely intersecting the line */}
                      <div className="absolute left-20 md:left-24 -translate-x-1/2 z-20 flex items-center justify-center">
                        <svg 
                          viewBox="0 0 24 24" 
                          className="w-3.5 h-3.5 fill-ink hover:fill-sage hover:scale-125 transition-all duration-300 cursor-help"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>

                      {/* Right: Time, Title, and Description */}
                      <div className="pl-8 md:pl-10 flex flex-col justify-center">
                        {/* Time in elegant spaced small font */}
                        <span className="font-mono text-[11px] md:text-xs tracking-[0.2em] text-sage font-semibold">
                          {item.time}
                        </span>
                        
                        {/* Title & short description */}
                        <h3 className="font-serif text-[15px] md:text-lg text-ink font-normal tracking-wide mt-0.5 leading-snug">
                          {item.title}
                        </h3>
                        
                        <p className="font-sans text-[11px] md:text-xs text-ink/60 tracking-wide font-light">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Bottom beautiful phrase */}
            <div className="text-center mt-20 select-none">
              <p className="font-serif italic text-xs md:text-sm text-sage/75 max-w-sm mx-auto leading-relaxed">
                "La puntualidad de nuestros invitados dará el brillo perfecto a cada uno de estos momentos."
              </p>
            </div>
          </div>
        </section>

        {/* LODGING / HOTEL RECOMMENDATIONS */}
        <LodgingSuggestions />

        {/* RSVP CONFIRMATION FORM */}
        <section id="rsvp" className="py-section-gap px-margin-mobile bg-paper relative">
          
          {/* Subtle line layout overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e3e2e0_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-15 pointer-events-none"></div>

          <div className="max-w-2xl mx-auto bg-paper relative z-10 p-8 md:p-16 border border-outline-variant/25 shadow-2xl shadow-ink/5">
            {/* Fine border anchors */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-sage/40"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-sage/40"></div>

            <motion.div 
              initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-6"
            >
              <span className="text-subheading-caps text-sage tracking-[0.4em] block">Suscripción RSVP</span>
              <h2 className="font-display font-light text-3xl md:text-5xl text-ink tracking-tight">
                Confirmar Asistencia
              </h2>
              <p className="text-xs tracking-widest uppercase text-sage">
                Agradecemos confirmar su asistencia
              </p>
              <div className="w-12 h-[1px] bg-sage/30 mx-auto"></div>
            </motion.div>

            {!rsvpSubmitted && (
              <div className="flex justify-center gap-6 border-b border-outline-variant/15 pb-4 mt-8 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => setRsvpTab("rsvp")}
                  className={`text-xs tracking-widest uppercase font-semibold pb-2 border-b-2 transition-all cursor-pointer ${
                    rsvpTab === "rsvp" 
                      ? "border-sage text-sage font-bold" 
                      : "border-transparent text-sage/40 hover:text-sage/70"
                  }`}
                >
                  Confirmar RSVP
                </button>
                {!usesStudioGuestPass && (
                  <button
                    type="button"
                    onClick={() => {
                      setRsvpTab("pass");
                      setHasSearched(false);
                      setPassSearchQuery("");
                      setSearchResults([]);
                    }}
                    className={`text-xs tracking-widest uppercase font-semibold pb-2 border-b-2 transition-all cursor-pointer ${
                      rsvpTab === "pass"
                        ? "border-sage text-sage font-bold"
                        : "border-transparent text-sage/40 hover:text-sage/70"
                    }`}
                  >
                    Obtener mi Pase QR
                  </button>
                )}
              </div>
            )}

            {rsvpSubmitted ? (
              <div className="space-y-8 animate-fadeIn mt-12 text-center">
                {/* Personalized Elegant Agradecimiento Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="p-8 md:p-12 border border-outline-variant/20 bg-surface-container-low/30 relative rounded-xs"
                >
                  <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-sage/40"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-sage/40"></div>

                  <span className="text-subheading-caps text-sage tracking-[0.3em] text-[10px] block">Agradecimiento Sincero</span>
                  
                  <h3 className="font-serif text-3xl md:text-4xl text-ink tracking-tight mt-3">
                    ¡Muchas Gracias, <span className="italic text-sage">{rsvpSubmitted.name}</span>!
                  </h3>

                  <div className="w-12 h-px bg-sage/40 mx-auto my-5"></div>

                  <p className="font-sans text-[13px] md:text-sm text-on-surface-variant leading-relaxed max-w-xl mx-auto">
                    {rsvpSubmitted.attending ? (
                      <span>
                        Para nosotros, tu presencia es el regalo más valioso. Nos llena de inmensa felicidad saber que nos acompañarás a celebrar nuestra Boda en esta noche mágica. Prepárate para una velada de ensueño llena de luz, música y recuerdos inolvidables. ¡Nos vemos muy pronto!
                      </span>
                    ) : (
                      <span>
                        Te agradezco de corazón que te hayas tomado el tiempo de responder. Aunque lamentamos que no puedas acompañarnos físicamente en esta ocasión, sabemos que tu cariño y mejores deseos nos acompañarán en cada momento de esta noche tan especial. ¡Tu aprecio y bendiciones se sentirán en cada instante de esta velada mágica!
                      </span>
                    )}
                  </p>

                  <p className="font-serif italic text-xs md:text-sm text-sage tracking-wide max-w-md mx-auto pt-6 border-t border-outline-variant/10 mt-6">
                    "Hay momentos en la vida que son especiales por sí solos, pero compartirlos con las personas que amamos los hace eternos."
                  </p>
                </motion.div>

                {/* Simulated high-fashion Access Ticketing Pass card */}
                <div className="p-8 border border-champagne-gold/35 bg-surface-container-low space-y-8 text-center relative overflow-hidden rounded-xs">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-champagne-gold/5 rounded-bl-full pointer-events-none"></div>
                  
                  <span className="material-symbols-outlined text-4xl text-champagne-gold animate-bounce">verified</span>
                  
                  <div className="space-y-2">
                    <h4 className="font-display text-2xl text-ink font-light tracking-tight">¡Pases Confirmados con Éxito!</h4>
                    <p className="text-[13px] text-sage font-medium tracking-[0.1em] uppercase">
                      Pase de Acceso Exclusivo • {rsvpSubmitted.attending ? "Asistencia Confirmada" : "Inasistencia Registrada"}
                    </p>
                  </div>

                  <div className="border-t border-b border-outline-variant/20 py-6 space-y-4 text-left text-xs text-on-surface-variant leading-relaxed">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] tracking-widest uppercase font-semibold text-sage">Invitado Titular</span>
                        <p className="font-semibold text-ink text-[13px] pt-1">{rsvpSubmitted.name}</p>
                      </div>
                      <div>
                        <span className="text-[9px] tracking-widest uppercase font-semibold text-sage">Pases Asignados</span>
                        <p className="font-semibold text-ink text-sm pt-1">
                          {rsvpSubmitted.attending ? `${rsvpSubmitted.guestsCount} Personas` : "0 (No asistirá)"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] tracking-widest uppercase font-semibold text-sage">Ceremonia</span>
                        <p className="text-ink font-semibold pt-1">3:00 P.M. • Sdo. Corazón</p>
                      </div>
                      <div>
                        <span className="text-[9px] tracking-widest uppercase font-semibold text-sage">Recepción</span>
                        <p className="text-ink font-semibold pt-1">9:00 P.M. • Cantabria</p>
                      </div>
                    </div>

                    {rsvpSubmitted.attending && rsvpSubmitted.tableNumber && (
                      <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/10 pt-3">
                        <div>
                          <span className="text-[9px] tracking-widest uppercase font-semibold text-sage">Mesa Asignada</span>
                          <p className="font-semibold text-ink text-sm pt-0.5">{rsvpSubmitted.tableNumber}</p>
                        </div>
                        <div>
                          <span className="text-[9px] tracking-widest uppercase font-semibold text-sage">Pase Digital</span>
                          <p className="font-semibold text-ink text-xs pt-0.5">Pase Único QR</p>
                        </div>
                      </div>
                    )}

                    {rsvpSubmitted.dietaryNotes && (
                      <div className="border-t border-outline-variant/10 pt-3">
                        <span className="text-[9px] tracking-widest uppercase font-semibold text-rose-700">Especificación de Alimentos</span>
                        <p className="text-rose-800 font-semibold pt-1">{rsvpSubmitted.dietaryNotes}</p>
                      </div>
                    )}
                  </div>

                  {!usesStudioGuestPass && (
                  <div className="pt-4 space-y-4">
                    {rsvpSubmitted.attending ? (
                      /* Elegant QR code pass */
                      <div className="flex flex-col items-center gap-4 py-4 border-t border-dashed border-outline-variant/30 mt-2">
                        <span className="text-[10px] tracking-widest uppercase font-semibold text-sage">Tu Pase de Acceso QR Único</span>
                        <div className="p-4 bg-white border border-outline-variant/15 shadow-md inline-block rounded-xs">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                              `Ana Camila 15 | Pase Único\nInvitado: ${rsvpSubmitted.name}\nMesa: ${rsvpSubmitted.tableNumber || "Mesa 5"}\nPases: ${rsvpSubmitted.guestsCount}`
                            )}`} 
                            alt="Pase QR Único"
                            className="w-36 h-36 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-[9px] text-on-surface-variant/60 tracking-wider font-mono uppercase">
                          {rsvpSubmitted.id}
                        </p>
                      </div>
                    ) : (
                      /* Decorative Barcode if not attending */
                      <div className="flex flex-col items-center gap-1.5 opacity-60">
                        <div className="flex items-center gap-[2px] h-10 w-48">
                          {[1,3,1,2,4,1,2,3,1,2,1,4,1,3,2,1,2,3,1,2,1].map((width, i) => (
                            <div key={i} className="bg-ink h-full" style={{ flexGrow: width }} />
                          ))}
                        </div>
                        <span className="font-mono text-[8px] tracking-[0.25em] text-ink uppercase">
                          {rsvpSubmitted.id}
                        </span>
                      </div>
                    )}

                    <p className="text-[11px] text-on-surface-variant/80 italic">
                      Te sugerimos guardar una captura de pantalla de este pase para presentar en el acceso al salón.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => {
                          const url = getWhatsAppUrl(
                            rsvpSubmitted.name,
                            rsvpSubmitted.attending,
                            rsvpSubmitted.guestsCount,
                            rsvpSubmitted.dietaryNotes,
                            rsvpSubmitted.message,
                            rsvpSubmitted.tableNumber
                          );
                          window.open(url, "_blank");
                        }}
                        className="px-6 py-2.5 bg-[#25D366] text-white hover:bg-[#20ba5a] text-[10px] font-semibold tracking-widest uppercase transition-colors rounded-xs flex items-center justify-center gap-2 cursor-pointer select-none"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        ENVIAR COMPROBANTE POR WHATSAPP
                      </button>
                      <button 
                        onClick={() => setRsvpSubmitted(null)}
                        className="px-6 py-2.5 border border-outline-variant/40 hover:border-sage hover:text-sage text-[10px] font-semibold tracking-widest uppercase transition-colors rounded-xs cursor-pointer select-none"
                      >
                        Confirmar otra Familia
                      </button>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            ) : !usesStudioGuestPass && rsvpTab === "pass" ? (
              /* Beautiful QR Pass Search interface */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mt-12 space-y-8"
              >
                <p className="text-xs text-on-surface-variant/70 text-center font-light leading-relaxed max-w-md mx-auto">
                  Si ya registraste tu asistencia, ingresa tu nombre completo tal como lo escribiste al confirmar para descargar tu pase digital con tu código QR único y mesa asignada.
                </p>

                <div className="space-y-4 max-w-md mx-auto">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] tracking-widest uppercase font-semibold text-sage block">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Alejandro Zavala Almazán"
                      value={passSearchQuery}
                      onChange={(e) => setPassSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-b border-outline-variant/30 py-3 text-xs text-ink focus:border-sage focus:outline-none tracking-wide placeholder-on-surface-variant/30"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!passSearchQuery.trim()) return;
                      const query = passSearchQuery.toLowerCase().trim();
                      const matches = rsvps.filter(r => r.name.toLowerCase().includes(query));
                      setSearchResults(matches);
                      setHasSearched(true);
                    }}
                    className="w-full py-4 border border-sage/40 hover:bg-sage/5 transition-all text-[11px] font-bold tracking-[0.2em] uppercase text-sage rounded-xs cursor-pointer select-none"
                  >
                    Buscar mi Pase
                  </button>
                </div>

                {hasSearched && (
                  <div className="space-y-4 max-w-md mx-auto pt-6 border-t border-outline-variant/10 text-left">
                    {searchResults.length === 0 ? (
                      <div className="text-center space-y-2">
                        <p className="text-xs text-rose-800 font-medium">No se encontró ningún pase con ese nombre.</p>
                        <p className="text-[11px] text-on-surface-variant/60 font-light">
                          Verifica que esté bien escrito o <button onClick={() => setRsvpTab("rsvp")} className="underline font-semibold text-sage">Confirma tu asistencia</button> si aún no lo has hecho.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <span className="text-[9px] tracking-widest uppercase font-semibold text-sage block text-center mb-1">
                          Pases Encontrados ({searchResults.length})
                        </span>
                        {searchResults.map((match) => (
                          <button
                            key={match.id}
                            onClick={() => {
                              if (match.attending) {
                                setRsvpSubmitted(match);
                                triggerCelebration();
                              } else {
                                alert("Este invitado está registrado como NO asistirá.");
                              }
                            }}
                            className="w-full p-4 border border-outline-variant/20 hover:border-sage bg-surface-container-low/50 hover:bg-primary/20 transition-all text-left flex items-center justify-between group rounded-xs cursor-pointer"
                          >
                            <div>
                              <p className="text-xs font-semibold text-ink group-hover:text-sage transition-colors">{match.name}</p>
                              <p className="text-[10px] text-on-surface-variant/60 pt-0.5">
                                {match.attending ? `Confirmado • ${match.guestsCount} ${match.guestsCount === 1 ? "Pase" : "Pases"}` : "No asistirá"}
                              </p>
                            </div>
                            {match.attending && (
                              <div className="flex items-center gap-1.5 text-sage text-[10px] font-bold tracking-wider uppercase">
                                Ver Pase QR
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Regular RSVP Form Input */
              <form onSubmit={handleRsvpSubmit} className="space-y-12 mt-12">
                
                {/* Attendance selection radio controls */}
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 justify-center border-t border-b border-outline-variant/20 py-8">
                  <label className="flex items-center gap-4 cursor-pointer group select-none">
                    <input 
                      type="radio" 
                      name="attendance" 
                      checked={attending === true}
                      onChange={() => setAttending(true)}
                      className="w-4 h-4 text-sage border-outline-variant focus:ring-sage focus:outline-hidden"
                    />
                    <span className="font-subheading-caps text-[11px] tracking-[0.2em] group-hover:text-sage transition-colors">
                      SÍ, ASISTIRÉ
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-4 cursor-pointer group select-none">
                    <input 
                      type="radio" 
                      name="attendance"
                      checked={attending === false}
                      onChange={() => setAttending(false)}
                      className="w-4 h-4 text-sage border-outline-variant focus:ring-sage focus:outline-hidden"
                    />
                    <span className="font-subheading-caps text-[11px] tracking-[0.2em] group-hover:text-sage transition-colors">
                      NO PODRÉ ASISTIR
                    </span>
                  </label>
                </div>

                {/* Personal Information Inputs */}
                <div className="space-y-8 text-left">
                  
                  {/* Name field */}
                  <div className="relative group border-b border-outline-variant/35 pb-2">
                    <label className="block text-subheading-caps text-[10px] text-sage mb-2 tracking-[0.2em]">
                      Nombre completo o Familia
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej. Familia Zavala Almazán o Sr. Alberto Bernal"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-ink placeholder:opacity-30 font-sans text-sm md:text-base tracking-wide"
                    />
                  </div>

                  {/* Email field */}
                  <div className="relative group border-b border-outline-variant/35 pb-2">
                    <label className="block text-subheading-caps text-[10px] text-sage mb-2 tracking-[0.2em]">
                      Correo electrónico
                    </label>
                    <input 
                      type="email" 
                      placeholder="Para hacer llegar tu confirmación digital"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-ink placeholder:opacity-30 font-sans text-sm md:text-base tracking-wide"
                    />
                  </div>

                  {/* Conditional inputs if attending */}
                  {attending === true && (
                    <div className="space-y-8 animate-fadeIn pt-2">
                      
                      {/* Passes/Guests count dropdown */}
                      <div className="border-b border-outline-variant/35 pb-3">
                        <label className="block text-subheading-caps text-[10px] text-sage mb-2 tracking-[0.2em]">
                          Número de pases solicitados
                        </label>
                        <select 
                          value={guestsCount}
                          onChange={(e) => setGuestsCount(parseInt(e.target.value))}
                          className="w-full bg-transparent border-none p-0 text-ink font-semibold focus:ring-0 cursor-pointer text-sm"
                        >
                          <option value="1" className="text-ink">1 Persona (Pase Individual)</option>
                          <option value="2" className="text-ink">2 Personas (Pase de Pareja)</option>
                          <option value="3" className="text-ink">3 Personas (Pase de Familia)</option>
                          <option value="4" className="text-ink">4 Personas (Pase de Familia)</option>
                          <option value="5" className="text-ink">5 Personas (Pase de Familia Máximo)</option>
                        </select>
                      </div>

                      {/* Food Preferences / Allergies */}
                      <div className="relative group border-b border-outline-variant/35 pb-2">
                        <label className="block text-subheading-caps text-[10px] text-sage mb-2 tracking-[0.2em]">
                          Restricciones alimenticias o alergias (Opcional)
                        </label>
                        <input 
                          type="text" 
                          placeholder="Ej. Alergia a nueces, menú vegetariano, etc."
                          value={dietaryNotes}
                          onChange={(e) => setDietaryNotes(e.target.value)}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-ink placeholder:opacity-30 font-sans text-sm tracking-wide"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dedicatory Message */}
                  <div className="relative group border-b border-outline-variant/35 pb-2">
                    <label className="block text-subheading-caps text-[10px] text-sage mb-2 tracking-[0.2em]">
                      Mensaje de felicitación para {brideName} (Opcional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Deja unas palabras de buenos deseos aquí..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-ink placeholder:opacity-30 font-sans text-sm tracking-wide"
                    />
                  </div>

                </div>

                {formError && (
                  <p className="text-xs text-rose-600 text-center font-medium">
                    ⚠️ {formError}
                  </p>
                )}

                {/* Actions group */}
                <div className="space-y-4">
                  <button 
                    type="submit"
                    id="rsvp-submit-form-btn"
                    className="w-full py-5 bg-ink text-paper font-semibold text-[11px] tracking-[0.35em] hover:bg-sage transition-colors duration-500 uppercase rounded-xs cursor-pointer select-none"
                  >
                    CONFIRMAR EN ESTE SITIO
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-outline-variant/15"></div>
                    <span className="flex-shrink mx-4 text-[9px] tracking-[0.25em] text-sage font-semibold uppercase">O TAMBIÉN</span>
                    <div className="flex-grow border-t border-outline-variant/15"></div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleWhatsAppRsvp}
                    className="w-full py-4 border border-[#25D366]/40 hover:border-[#25D366] text-[#25d366] hover:text-white hover:bg-[#25D366] font-semibold text-[11px] tracking-[0.35em] bg-transparent transition-all duration-500 uppercase rounded-xs flex items-center justify-center gap-2 cursor-pointer select-none"
                  >
                    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    CONFIRMAR POR WHATSAPP
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-surface-container-low border-t border-outline-variant/20 w-full pt-16 pb-36 md:pb-28 px-margin-mobile md:px-gutter flex flex-col items-center space-y-12">
        <h2 className="font-serif text-3xl text-ink select-none">
          Invi<span className="italic text-sage">tta</span>
        </h2>
        


        {/* Locked Admin Dashboard Trigger */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <button 
            onClick={() => setIsAdminOpen(true)}
            id="admin-dashboard-footer-trigger"
            className="inline-flex items-center gap-2 text-[9px] tracking-[0.25em] text-sage hover:text-ink transition-colors uppercase font-bold"
            title="Acceso exclusivo para organizadores del evento"
          >
            <span className="material-symbols-outlined text-sm font-semibold">lock_open</span>
            Buzón de Confirmación Administrador
          </button>
        </div>

        <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-[0.3em] font-light text-center">
          © 2026 INVITTA DIGITAL ATELIER. TODOS LOS DERECHOS RESERVADOS.
        </p>
      </footer>

      {/* MOBILE FLOATING ACTION NAV BAR overlay (Saves screen real estate and guides user experience) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-4 bg-paper/90 backdrop-blur-md z-40 border-t border-outline-variant/15 shadow-lg">
        <button 
          onClick={() => scrollToSection("hero")}
          className="flex flex-col items-center justify-center text-sage hover:text-primary transition-colors gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          <span className="text-[8px] font-subheading-caps tracking-widest font-semibold uppercase">INVITACIÓN</span>
        </button>
        <button 
          onClick={() => scrollToSection("details")}
          className="flex flex-col items-center justify-center text-on-surface-variant/70 hover:text-sage transition-colors gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">calendar_today</span>
          <span className="text-[8px] font-subheading-caps tracking-widest font-semibold uppercase">DETALLES</span>
        </button>
        <button 
          onClick={() => scrollToSection("registry")}
          className="flex flex-col items-center justify-center text-on-surface-variant/70 hover:text-sage transition-colors gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">redeem</span>
          <span className="text-[8px] font-subheading-caps tracking-widest font-semibold uppercase">REGALOS</span>
        </button>
        <button 
          onClick={() => scrollToSection("rsvp")}
          className="flex flex-col items-center justify-center text-on-surface-variant/70 hover:text-sage transition-colors gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">mail</span>
          <span className="text-[8px] font-subheading-caps tracking-widest font-semibold uppercase">RSVP</span>
        </button>
      </nav>

      {/* Interactive Gift Registry Details Modal */}
      {selectedRegistry && (
        <GiftRegistryModal 
          registry={selectedRegistry}
          onClose={() => setSelectedRegistry(null)}
        />
      )}

      {/* Secret RSVP Admin Dashboard panel modal */}
      {isAdminOpen && (
        <RsvpAdmin 
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          rsvps={rsvps}
          onDeleteRsvp={handleDeleteRsvp}
          onClearAll={handleClearAllRsvps}
        />
      )}

      {/* Pristine Fullscreen Lightbox for Book Editorial */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-100 bg-[#151110]/98 backdrop-blur-md flex items-center justify-center p-4 md:p-8 select-none"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 text-paper/60 hover:text-white p-3 transition-colors cursor-pointer z-[110] rounded-full hover:bg-white/5"
              title="Cerrar"
            >
              <span className="material-symbols-outlined text-2xl font-light">close</span>
            </button>

            {/* Previous Arrow Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length);
              }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-paper/40 hover:text-white p-4 transition-all duration-300 cursor-pointer z-[110] rounded-full hover:bg-white/5 flex items-center justify-center"
              title="Anterior"
            >
              <span className="material-symbols-outlined text-3xl font-light">arrow_back_ios_new</span>
            </button>

            {/* Next Arrow Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((lightboxIndex + 1) % galleryImages.length);
              }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-paper/40 hover:text-white p-4 transition-all duration-300 cursor-pointer z-[110] rounded-full hover:bg-white/5 flex items-center justify-center"
              title="Siguiente"
            >
              <span className="material-symbols-outlined text-3xl font-light">arrow_forward_ios</span>
            </button>

            {/* Main Centered Photo Container with absolute overlay to allow beautiful concurrent cross-fade */}
            <div className="relative w-full max-w-[85vw] md:max-w-[70vw] h-[80vh] flex items-center justify-center pointer-events-auto">
              <AnimatePresence initial={false}>
                <motion.div
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex justify-center items-center overflow-hidden rounded-xs"
                  onClick={(e) => {
                    // Clicking the photo itself cycles to the next one elegantly
                    e.stopPropagation();
                    setLightboxIndex((lightboxIndex + 1) % galleryImages.length);
                  }}
                >
                  <motion.img
                    src={galleryImages[lightboxIndex].src}
                    alt={`Fotografía editorial ${lightboxIndex + 1}`}
                    // Smooth, continuous Ken Burns scale-up effect
                    initial={{ scale: 1.02 }}
                    animate={{ scale: 1.12 }}
                    transition={{
                      duration: 18,
                      ease: "easeOut",
                    }}
                    className="max-h-[80vh] max-w-full object-contain border border-white/5 shadow-2xl select-none rounded-xs cursor-pointer"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      </div>
    </>
  );
}
