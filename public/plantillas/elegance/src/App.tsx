import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MapPin, 
  Gift, 
  Users, 
  Heart, 
  ExternalLink, 
  ChevronRight, 
  Lock, 
  Music, 
  Menu, 
  X,
  Map,
  Grid
} from 'lucide-react';

import { 
  EVENT_DETAILS, 
  LOCATIONS, 
  GALLERY_IMAGES, 
  REGISTRY_OPTIONS, 
  IMAGES 
} from './data';
import { RegistryOption, LocationInfo } from './types';

// Subcomponents
import MusicPlayer from './components/MusicPlayer';
import CountdownTimer from './components/CountdownTimer';
import RegistryModal from './components/RegistryModal';
import RsvpForm from './components/RsvpForm';
import AdminDashboard from './components/AdminDashboard';
import GalleryLightbox from './components/GalleryLightbox';
import { InvitationExtras } from '../../shared/InvitationExtras';

// Framer Motion Animation Presets for Quiet Luxury Vibe
const motionFadeUp = {
  initial: { opacity: 0, y: 35 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-12% 0px" },
  transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] } // Elegant flowy ease
};

const motionFadeUpWithDelay = (delay: number) => ({
  ...motionFadeUp,
  transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1], delay }
});

const motionScaleIn = {
  initial: { opacity: 0, scale: 1.05 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-12% 0px" },
  transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] }
};

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [selectedRegistry, setSelectedRegistry] = useState<RegistryOption | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [rsvpRefreshKey, setRsvpRefreshKey] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Monitor scroll height to handle background transparency of header and progress bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Calculate scroll progress percentage
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      } else {
        setScrollProgress(0);
      }
      
      // Basic Intersection Observer mock for active section tracking
      const sections = ['hero', 'family', 'countdown', 'locations', 'details', 'registry', 'gallery', 'rsvp'];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial call to set correct progress and scroll state on mount
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRsvpAdded = () => {
    setRsvpRefreshKey(prev => prev + 1);
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getGoogleCalendarUrlForCeremony = () => {
    const title = encodeURIComponent('XV Años Ana Camila Zavala - Ceremonia Religiosa');
    const details = encodeURIComponent(
      'Te espero en la Ceremonia Religiosa de mis XV Años.\n\n' +
      '⛪ Lugar: Parroquia Sagrado Corazón de Jesús\n' +
      '🕒 Hora: 3:00 P.M.'
    );
    const location = encodeURIComponent('Parroquia Sagrado Corazón de Jesús, Chihuahua, Chihuahua, México');
    const dates = '20261212T150000/20261212T163000';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&sf=true&output=xml`;
  };

  const getGoogleCalendarUrlForReception = () => {
    const title = encodeURIComponent('XV Años Ana Camila Zavala - Recepción');
    const details = encodeURIComponent(
      'Te espero en la Recepción de mis XV Años.\n\n' +
      '✨ Lugar: Cantabria Salón de Eventos\n' +
      '🕒 Hora: 9:00 P.M.'
    );
    const location = encodeURIComponent('Cantabria Salón de Eventos, Chihuahua, Chihuahua, México');
    const dates = '20261212T210000/20261213T030000';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&sf=true&output=xml`;
  };

  return (
    <div className="bg-paper text-on-surface selection:bg-sage/25 font-sans min-h-screen flex flex-col relative overflow-x-hidden antialiased">
      
      {/* Subtle Scroll Progress Bar */}
      <div id="scroll-progress-container" className="fixed top-0 left-0 w-full h-[3px] z-[100] bg-outline-variant/20 pointer-events-none">
        <div 
          id="scroll-progress-bar"
          className="h-full bg-sage transition-all duration-100 ease-out origin-left"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Background Music Player */}
      <MusicPlayer />

      {/* Header / Navigation Bar */}
      <header 
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 px-6 py-4 md:px-12 flex justify-between items-center ${
          isScrolled 
            ? 'bg-paper/85 backdrop-blur-md border-b border-outline-variant/15 shadow-sm' 
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-primary hover:text-sage transition-colors md:hidden p-1.5"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          
          {/* Logo / Brand Name */}
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-serif text-lg transition-all hover:opacity-80 flex items-center select-none"
          >
            <span className="text-on-background font-medium tracking-normal">Inv</span>
            <span className="italic text-[#c48473] font-medium tracking-normal">itta</span>
          </button>
        </div>

        {/* Desktop Navigation links */}
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => scrollToSection('family')}
            className={`font-sans text-[10px] tracking-[0.2em] uppercase font-semibold transition-colors ${activeSection === 'family' ? 'text-sage' : 'text-secondary hover:text-ink'}`}
          >
            Familia
          </button>
          <button 
            onClick={() => scrollToSection('locations')}
            className={`font-sans text-[10px] tracking-[0.2em] uppercase font-semibold transition-colors ${activeSection === 'locations' ? 'text-sage' : 'text-secondary hover:text-ink'}`}
          >
            Ubicación
          </button>
          <button 
            onClick={() => scrollToSection('details')}
            className={`font-sans text-[10px] tracking-[0.2em] uppercase font-semibold transition-colors ${activeSection === 'details' ? 'text-sage' : 'text-secondary hover:text-ink'}`}
          >
            Código de Vestir
          </button>
          <button 
            onClick={() => scrollToSection('registry')}
            className={`font-sans text-[10px] tracking-[0.2em] uppercase font-semibold transition-colors ${activeSection === 'registry' ? 'text-sage' : 'text-secondary hover:text-ink'}`}
          >
            Regalos
          </button>
          <button 
            onClick={() => scrollToSection('gallery')}
            className={`font-sans text-[10px] tracking-[0.2em] uppercase font-semibold transition-colors ${activeSection === 'gallery' ? 'text-sage' : 'text-secondary hover:text-ink'}`}
          >
            Galería
          </button>
        </nav>

        {/* Action Button */}
        <div>
          <button 
            onClick={() => scrollToSection('rsvp')}
            className="font-sans text-[10px] tracking-[0.25em] font-semibold text-primary hover:text-sage transition-all uppercase border-b-2 border-sage/40 pb-0.5"
          >
            RSVP
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-45"
            ></motion.div>
            
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-4/5 max-w-xs bg-paper border-r border-outline-variant/20 z-50 p-8 flex flex-col justify-between"
            >
              <div className="space-y-12">
                <div className="flex justify-between items-center">
                  <span className="font-serif text-lg flex items-center select-none">
                    <span className="text-on-background font-medium tracking-normal">Inv</span>
                    <span className="italic text-[#c48473] font-medium tracking-normal">itta</span>
                  </span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 text-secondary hover:text-ink"
                    aria-label="Cerrar menú"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mobile list links */}
                <nav className="flex flex-col gap-6">
                  <button 
                    onClick={() => scrollToSection('hero')}
                    className="text-left font-sans text-xs tracking-[0.15em] uppercase font-medium text-secondary hover:text-ink"
                  >
                    Inicio
                  </button>
                  <button 
                    onClick={() => scrollToSection('family')}
                    className="text-left font-sans text-xs tracking-[0.15em] uppercase font-medium text-secondary hover:text-ink"
                  >
                    Nuestros Padres
                  </button>
                  <button 
                    onClick={() => scrollToSection('locations')}
                    className="text-left font-sans text-xs tracking-[0.15em] uppercase font-medium text-secondary hover:text-ink"
                  >
                    Ubicación y Horarios
                  </button>
                  <button 
                    onClick={() => scrollToSection('details')}
                    className="text-left font-sans text-xs tracking-[0.15em] uppercase font-medium text-secondary hover:text-ink"
                  >
                    Código de Vestir
                  </button>
                  <button 
                    onClick={() => scrollToSection('registry')}
                    className="text-left font-sans text-xs tracking-[0.15em] uppercase font-medium text-secondary hover:text-ink"
                  >
                    Mesa de Regalos
                  </button>
                  <button 
                    onClick={() => scrollToSection('gallery')}
                    className="text-left font-sans text-xs tracking-[0.15em] uppercase font-medium text-secondary hover:text-ink"
                  >
                    Galería de Fotos
                  </button>
                  <button 
                    onClick={() => scrollToSection('rsvp')}
                    className="text-left font-sans text-xs tracking-[0.15em] uppercase font-semibold text-sage hover:text-ink"
                  >
                    Confirmar Asistencia
                  </button>
                </nav>
              </div>

              {/* Mobile Drawer Footer */}
              <div className="space-y-4">
                <div className="w-8 h-px bg-sage/30"></div>
                <p className="font-serif italic text-xs text-secondary-fixed-dim">
                  "Hay momentos inolvidables que se atesoran en el corazón para siempre..."
                </p>
                <p className="font-sans text-[8px] tracking-widest text-secondary opacity-60 uppercase">
                  12 DICIEMBRE 2026 • CHIHUAHUA
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Sections */}
      <main className="flex-grow w-full">
        
        {/* HERO SECTION */}
        <section 
          id="hero" 
          className="relative min-h-screen flex flex-col md:flex-row items-center pt-20 md:pt-0"
        >
          {/* Typographic Introduction */}
          <div className="w-full md:w-5/12 flex flex-col justify-center items-start px-8 md:pl-24 z-10 space-y-8 pt-12 md:pt-0">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-sans text-[11px] font-semibold text-sage uppercase tracking-[0.45em]"
            >
              Mis Quince Años
            </motion.span>
            
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="font-serif text-ink uppercase flex flex-col leading-[0.95] tracking-tight"
            >
              <span className="block text-6xl md:text-7xl">
                {EVENT_DETAILS.quinceanera.firstName}
              </span>
              <span className="block md:ml-12 italic text-sage text-6xl md:text-7xl font-normal py-1">
                {EVENT_DETAILS.quinceanera.middleName}
              </span>
              <span className="block md:ml-24 text-6xl md:text-7xl">
                {EVENT_DETAILS.quinceanera.lastName}
              </span>
            </motion.h2>

            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.4 }}
              className="mt-8 md:mt-16 border-l border-outline-variant/30 pl-6 relative before:absolute before:left-[-1px] before:top-0 before:w-px before:h-12 before:bg-sage"
            >
              <p className="font-serif text-body-md text-on-surface-variant max-w-sm italic leading-relaxed">
                {EVENT_DETAILS.quinceanera.quote}
              </p>
            </motion.div>
          </div>

          {/* Portrait Image Canvas */}
          <div className="w-full md:w-7/12 h-[55vh] md:h-screen mt-12 md:mt-0 relative overflow-hidden">
            <motion.img 
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="w-full h-full object-cover animate-breathe object-center md:object-right" 
              alt="Retrato elegante de Ana Camila Zavala en vestido rojo"
              src={IMAGES.hero}
              referrerPolicy="no-referrer"
            />
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-paper via-transparent to-transparent md:block hidden opacity-60"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent md:hidden block opacity-85 h-36 bottom-0 top-auto"></div>
          </div>
        </section>

        {/* FAMILY HONORS SECTION */}
        <section 
          id="family" 
          className="py-24 md:py-36 px-6 md:px-12 bg-surface-container-low/20"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24">
              
              {/* Left Column: Parents & Godparents */}
              <div className="md:col-span-7 space-y-20 text-left">
                
                {/* Parents Card */}
                <motion.div {...motionFadeUp} className="space-y-6">
                  <h3 className="font-sans text-[11px] tracking-[0.3em] text-sage uppercase font-semibold flex items-center gap-4">
                    <span className="w-10 h-px bg-sage/40"></span>
                    Con la bendición de Dios y mis padres
                  </h3>
                  <div className="flex flex-col gap-3 pl-4 md:pl-8">
                    <span className="font-serif text-2xl md:text-3xl text-ink font-light">
                      {EVENT_DETAILS.parents.mother}
                    </span>
                    <span className="font-serif text-2xl italic text-sage text-center w-20">&amp;</span>
                    <span className="font-serif text-2xl md:text-3xl text-ink font-light pl-6 md:pl-12">
                      {EVENT_DETAILS.parents.father}
                    </span>
                  </div>
                </motion.div>

                {/* Godparents Card */}
                <motion.div {...motionFadeUpWithDelay(0.25)} className="space-y-6">
                  <h3 className="font-sans text-[11px] tracking-[0.3em] text-sage uppercase font-semibold flex items-center gap-4">
                    <span className="w-10 h-px bg-sage/40"></span>
                    Mis Padrinos
                  </h3>
                  <div className="flex flex-col gap-3 pl-4 md:pl-8">
                    <span className="font-serif text-2xl md:text-3xl text-ink font-light">
                      {EVENT_DETAILS.godparents.mother}
                    </span>
                    <span className="font-serif text-2xl italic text-sage text-center w-20">&amp;</span>
                    <span className="font-serif text-2xl md:text-3xl text-ink font-light pl-6 md:pl-12">
                      {EVENT_DETAILS.godparents.father}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Escort (Chambelán) with elegant layout frames */}
              <div className="md:col-span-5 flex items-center justify-start md:justify-end">
                <motion.div 
                  {...motionFadeUpWithDelay(0.4)}
                  className="w-full max-w-sm p-8 bg-paper border border-outline-variant/30 relative"
                >
                  {/* Subtle luxurious custom frame brackets */}
                  <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-sage/50"></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-sage/50"></div>
                  
                  <div className="space-y-4">
                    <span className="font-sans text-[10px] tracking-[0.3em] text-sage uppercase font-semibold block">
                      Mi Chambelán de Honor
                    </span>
                    <h3 className="font-serif text-2xl text-ink font-light leading-snug">
                      {EVENT_DETAILS.chambelan.name}
                    </h3>
                    <div className="w-8 h-px bg-sage/40"></div>
                    <p className="font-sans text-xs text-on-surface-variant font-light leading-relaxed">
                      Especial agradecimiento por acompañarme con elegancia y amistad en este gran vals.
                    </p>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* COUNTDOWN BANNER */}
        <section 
          id="countdown" 
          className="relative py-28 md:py-36 bg-ink text-paper overflow-hidden"
        >
          {/* Atmospheric background */}
          <div className="absolute inset-0 opacity-40">
            <img 
              className="w-full h-full object-cover object-center" 
              alt="Bosque crepuscular atmosférico" 
              src={IMAGES.countdownBg}
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Main layout */}
          <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-16">
            
            {/* Title description */}
            <motion.div {...motionFadeUp} className="space-y-6 text-left max-w-lg">
              <h3 className="font-sans text-[11px] tracking-[0.4em] text-sage uppercase font-bold flex items-center gap-4">
                <span className="w-12 h-px bg-sage"></span>
                Te espero el día
              </h3>
              
              <div className="space-y-1">
                <span className="font-serif text-5xl md:text-6xl block font-light leading-tight">
                  12 Diciembre
                </span>
                <span className="font-serif text-4xl md:text-5xl italic text-sage/90 block font-normal">
                  2026
                </span>
              </div>
              <p className="font-sans text-xs text-paper/70 tracking-widest uppercase font-medium">
                SÁBADO • INICIO DE CEREMONIA: 3:00 P.M.
              </p>
            </motion.div>

            {/* Countdown Component */}
            <motion.div {...motionFadeUpWithDelay(0.3)} className="flex flex-col items-start gap-8">
              <CountdownTimer />
            </motion.div>

          </div>
        </section>

        {/* LOCATIONS SECTION */}
        <section 
          id="locations" 
          className="py-24 md:py-36 px-6 md:px-12 bg-paper relative"
        >
          <div className="max-w-6xl mx-auto space-y-24">
            
            <motion.div {...motionFadeUp} className="text-center space-y-4 max-w-xl mx-auto">
              <span className="font-sans text-[11px] tracking-[0.35em] text-sage uppercase font-semibold block">Ubicaciones del Evento</span>
              <h2 className="font-serif text-3xl md:text-4xl text-ink font-light">¿Dónde celebraremos?</h2>
              <div className="w-12 h-px bg-sage/30 mx-auto"></div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-stretch">
              
              {/* Ceremony Card */}
              <motion.div 
                {...motionFadeUpWithDelay(0.2)}
                className="flex flex-col md:flex-row gap-8 items-start bg-surface-container-low/20 p-8 border border-outline-variant/15 relative hover:border-sage/40 transition-colors duration-500 rounded-sm"
              >
                <div className="w-14 h-14 rounded-full border border-sage/30 flex items-center justify-center bg-paper flex-shrink-0">
                  <span className="font-serif italic text-sage text-xl font-semibold">⛪</span>
                </div>
                
                <div className="space-y-6 text-left flex-grow">
                  <div className="space-y-2">
                    <span className="font-sans text-[9px] tracking-[0.25em] text-sage uppercase font-bold block">01 / Santa Ceremonia</span>
                    <h3 className="font-serif text-2xl text-ink font-medium">{LOCATIONS[0].title}</h3>
                  </div>
                  
                  <div className="space-y-2 font-sans text-xs text-on-surface-variant font-light leading-relaxed">
                    <p className="font-semibold text-ink text-sm">{LOCATIONS[0].place}</p>
                    <p className="text-sage font-semibold tracking-widest text-xs uppercase py-1">Hora: {LOCATIONS[0].time}</p>
                    <p className="opacity-90">{LOCATIONS[0].address}</p>
                    <p className="opacity-90">{LOCATIONS[0].postalCode} • {LOCATIONS[0].city}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 mt-4 pt-3 border-t border-outline-variant/10">
                    <a 
                      href={LOCATIONS[0].googleMapsUrl} 
                      target="_blank" 
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 text-[10px] font-sans tracking-[0.25em] text-ink hover:text-sage font-bold border-b border-ink/40 hover:border-sage transition-all pb-1 uppercase"
                    >
                      COMO LLEGAR <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Reception Card */}
              <motion.div 
                {...motionFadeUpWithDelay(0.4)}
                className="flex flex-col md:flex-row gap-8 items-start bg-surface-container-low/20 p-8 border border-outline-variant/15 relative hover:border-sage/40 transition-colors duration-500 rounded-sm"
              >
                <div className="w-14 h-14 rounded-full border border-sage/30 flex items-center justify-center bg-paper flex-shrink-0">
                  <span className="font-serif italic text-sage text-xl font-semibold">✨</span>
                </div>
                
                <div className="space-y-6 text-left flex-grow">
                  <div className="space-y-2">
                    <span className="font-sans text-[9px] tracking-[0.25em] text-sage uppercase font-bold block">02 / La Recepción</span>
                    <h3 className="font-serif text-2xl text-ink font-medium">{LOCATIONS[1].title}</h3>
                  </div>
                  
                  <div className="space-y-2 font-sans text-xs text-on-surface-variant font-light leading-relaxed">
                    <p className="font-semibold text-ink text-sm">{LOCATIONS[1].place}</p>
                    <p className="text-sage font-semibold tracking-widest text-xs uppercase py-1">Hora: {LOCATIONS[1].time}</p>
                    <p className="opacity-90">{LOCATIONS[1].address}</p>
                    <p className="opacity-90">{LOCATIONS[1].postalCode} • {LOCATIONS[1].city}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 mt-4 pt-3 border-t border-outline-variant/10">
                    <a 
                      href={LOCATIONS[1].googleMapsUrl} 
                      target="_blank" 
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 text-[10px] font-sans tracking-[0.25em] text-ink hover:text-sage font-bold border-b border-ink/40 hover:border-sage transition-all pb-1 uppercase"
                    >
                      COMO LLEGAR <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* DRESS CODE & ADULTS ONLY SECTION */}
        <section 
          id="details" 
          className="relative py-24 md:py-36 bg-ink text-paper flex flex-col lg:flex-row items-stretch min-h-[60vh]"
        >
          {/* Soft background photography detailing */}
          <div className="w-full lg:w-1/2 min-h-[40vh] lg:min-h-0 relative overflow-hidden">
            <motion.img 
              {...motionScaleIn}
              className="w-full h-full object-cover object-center absolute inset-0 opacity-40 lg:opacity-100" 
              alt="Textura de vestido de gala y encajes de alta costura" 
              src={IMAGES.dressCodeBg}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink lg:block hidden"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent lg:hidden block h-24 bottom-0 top-auto"></div>
          </div>

          {/* Typographic Dress Code rules */}
          <motion.div 
            {...motionFadeUp}
            className="w-full lg:w-1/2 flex flex-col justify-center items-start px-6 md:px-16 py-12 lg:py-0 space-y-10 relative z-10"
          >
            <div className="space-y-4 text-left">
              <span className="font-sans text-[11px] tracking-[0.35em] text-sage uppercase font-bold block">
                Código de Vestimenta
              </span>
              <h4 className="font-serif text-5xl md:text-6xl tracking-widest text-paper font-light">
                FORMAL
              </h4>
            </div>

            <div className="space-y-6 pl-6 border-l border-sage/50 text-left">
              <p className="font-serif text-lg italic text-paper/85 max-w-md font-light leading-relaxed">
                "Este es un día dedicado sólo a jóvenes y adultos, agradecemos de antemano su comprensión."
              </p>
              <div className="inline-flex items-center gap-2 bg-sage/10 border border-sage/30 px-3 py-1 text-[10px] font-sans tracking-[0.25em] text-sage uppercase font-bold rounded-full">
                ✦ NO NIÑOS
              </div>
            </div>
          </motion.div>
        </section>

        {/* GIFT REGISTRY SECTION */}
        <section 
          id="registry" 
          className="py-24 md:py-36 px-6 md:px-12 bg-surface-container-low/20"
        >
          <div className="max-w-6xl mx-auto space-y-16">
            
            <motion.div {...motionFadeUp} className="text-center space-y-4 max-w-xl mx-auto">
              <span className="font-sans text-[11px] tracking-[0.35em] text-sage uppercase font-semibold block">Mesa de Regalos</span>
              <h2 className="font-serif text-3xl md:text-4xl text-ink font-light">Sugerencias de Regalo</h2>
              <div className="w-12 h-px bg-sage/30 mx-auto"></div>
              <p className="font-sans text-xs text-on-surface-variant max-w-sm mx-auto font-light leading-relaxed">
                Tu presencia es mi mayor regalo, pero si deseas tener un detalle conmigo, aquí tienes algunas opciones que he seleccionado.
              </p>
            </motion.div>

            {/* Registry options grid cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {REGISTRY_OPTIONS.map((option, index) => (
                <motion.div 
                  key={option.id}
                  onClick={() => setSelectedRegistry(option)}
                  {...motionFadeUpWithDelay(index * 0.15)}
                  className="bg-paper p-8 border border-outline-variant/15 flex flex-col items-center justify-between text-center min-h-[220px] hover:border-sage/60 hover:shadow-lg transition-all duration-300 group cursor-pointer rounded-sm"
                >
                  <div className="w-12 h-12 rounded-full border border-sage/10 bg-surface-container-low/30 flex items-center justify-center group-hover:bg-sage/10 transition-colors">
                    <span className="font-serif text-lg text-sage">✦</span>
                  </div>
                  
                  <div className="space-y-2 my-4">
                    <h4 className="font-serif text-xl text-ink font-medium">{option.title}</h4>
                    <p className="font-sans text-[10px] text-on-surface-variant/70 tracking-wide font-light line-clamp-2">
                      {option.description}
                    </p>
                  </div>

                  {option.id !== 'envelope' && (
                    <button className="font-sans text-[10px] tracking-[0.2em] text-sage border-b border-sage/20 group-hover:border-sage transition-all pb-0.5 uppercase font-bold">
                      {option.id === 'bank' ? 'VER DATOS' : 'VER ENLACE'}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

          </div>
        </section>

        {/* INTERACTIVE GALLERY & LIGHTBOX SECTION */}
        <section 
          id="gallery" 
          className="py-24 md:py-36 px-6 md:px-12 max-w-[1500px] mx-auto space-y-16"
        >
          <motion.div {...motionFadeUp} className="text-center space-y-4 max-w-xl mx-auto">
            <span className="font-sans text-[11px] tracking-[0.35em] text-sage uppercase font-semibold block">Book de Fotos</span>
            <h2 className="font-serif text-3xl md:text-4xl text-ink font-light">Galería Editorial</h2>
            <div className="w-12 h-px bg-sage/30 mx-auto"></div>
            <p className="font-sans text-xs text-on-surface-variant font-light">
              Haz clic en cualquier imagen para verla en pantalla completa y recorrer mi book fotográfico oficial.
            </p>
          </motion.div>

          {/* Asymmetric Elegant grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-stretch">
            
            {/* Main large left image */}
            <motion.div 
              onClick={() => setLightboxIndex(0)}
              {...motionFadeUpWithDelay(0.1)}
              className="md:col-span-7 h-[50vh] md:h-[80vh] overflow-hidden cursor-pointer group relative rounded-sm border border-outline-variant/15"
            >
              <img 
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-out" 
                alt="Ana Camila en vestido rojo clásico" 
                src={GALLERY_IMAGES[0].url}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                <span className="font-sans text-[10px] tracking-[0.3em] text-paper border border-paper/40 px-4 py-2 uppercase bg-ink/30 font-semibold rounded-sm">Ampliar Foto</span>
              </div>
            </motion.div>

            {/* Vertical column right */}
            <div className="md:col-span-5 flex flex-col gap-6 md:gap-8 justify-between">
              
              <motion.div 
                onClick={() => setLightboxIndex(1)}
                {...motionFadeUpWithDelay(0.3)}
                className="h-[30vh] md:h-[38vh] overflow-hidden cursor-pointer group relative rounded-sm border border-outline-variant/15"
              >
                <img 
                  className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-1000 ease-out" 
                  alt="Detalle de manos en guantes rojos con rosas" 
                  src={GALLERY_IMAGES[1].url}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                  <span className="font-sans text-[10px] tracking-[0.3em] text-paper border border-paper/40 px-4 py-2 uppercase bg-ink/30 font-semibold rounded-sm">Ampliar Foto</span>
                </div>
              </motion.div>

              <motion.div 
                onClick={() => setLightboxIndex(2)}
                {...motionFadeUpWithDelay(0.5)}
                className="h-[30vh] md:h-[38vh] overflow-hidden cursor-pointer group relative rounded-sm border border-outline-variant/15"
              >
                <img 
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-out" 
                  alt="Ana Camila en un vestido de encaje azul cielo" 
                  src={GALLERY_IMAGES[2].url}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                  <span className="font-sans text-[10px] tracking-[0.3em] text-paper border border-paper/40 px-4 py-2 uppercase bg-ink/30 font-semibold rounded-sm">Ampliar Foto</span>
                </div>
              </motion.div>

            </div>

          </div>

          {/* Bottom centered landscape shot */}
          <motion.div 
            onClick={() => setLightboxIndex(3)}
            {...motionFadeUpWithDelay(0.2)}
            className="h-[35vh] md:h-[55vh] overflow-hidden max-w-4xl mx-auto cursor-pointer group relative rounded-sm border border-outline-variant/15"
          >
            <img 
              className="w-full h-full object-cover object-bottom group-hover:scale-[1.03] transition-transform duration-1000 ease-out" 
              alt="Gran arco de piedra en el jardín del palacio" 
              src={GALLERY_IMAGES[3].url}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
              <span className="font-sans text-[10px] tracking-[0.3em] text-paper border border-paper/40 px-4 py-2 uppercase bg-ink/30 font-semibold rounded-sm">Ampliar Foto</span>
            </div>
          </motion.div>
        </section>

        <InvitationExtras />

        {/* RSVP FORM SECTION */}
        <section 
          id="rsvp" 
          className="py-24 md:py-36 px-6 md:px-12 bg-paper relative border-t border-outline-variant/15"
        >
          {/* Subtle luxury geometric grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e3e2e0_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-25"></div>
          
          <motion.div 
            {...motionFadeUp}
            className="max-w-2xl mx-auto bg-paper relative z-10 p-8 md:p-16 border border-outline-variant/25 shadow-2xl rounded"
          >
            {/* Elegant corner accents */}
            <div className="absolute top-0 left-0 w-10 h-10 border-t border-l border-sage/40"></div>
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b border-r border-sage/40"></div>

            <div className="space-y-12">
              
              <div className="text-center space-y-4">
                <span className="font-sans text-[11px] tracking-[0.4em] text-sage uppercase font-bold block">Confirmación RSVP</span>
                <h2 className="font-serif text-3xl md:text-4xl text-ink font-light">Acompáñame a Celebrar</h2>
                <div className="w-12 h-px bg-sage/30 mx-auto"></div>
                <p className="font-sans text-xs text-on-surface-variant max-w-sm mx-auto font-light leading-relaxed">
                  Agradezco confirmar tu grata asistencia antes del <strong className="text-ink">15 de Noviembre de 2026</strong> para coordinar accesos.
                </p>
              </div>

              {/* Form integration */}
              <RsvpForm onRsvpAdded={handleRsvpAdded} />

            </div>
          </motion.div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-surface-container-low/40 border-t border-outline-variant/20 py-20 px-6 md:px-12 flex flex-col items-center space-y-12 w-full text-center">
        
        {/* Brand name */}
        <h2 className="font-serif text-2xl flex items-center justify-center select-none">
          <span className="text-on-background font-medium tracking-normal">Inv</span>
          <span className="italic text-[#c48473] font-medium tracking-normal">itta</span>
        </h2>
        
        {/* Nav list */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          <button 
            onClick={() => scrollToSection('hero')} 
            className="font-sans text-[10px] tracking-[0.2em] text-on-surface-variant hover:text-sage transition-colors uppercase font-semibold"
          >
            Colección
          </button>
          <button 
            onClick={() => scrollToSection('family')} 
            className="font-sans text-[10px] tracking-[0.2em] text-on-surface-variant hover:text-sage transition-colors uppercase font-semibold"
          >
            Padres & Padrinos
          </button>
          <button 
            onClick={() => scrollToSection('locations')} 
            className="font-sans text-[10px] tracking-[0.2em] text-on-surface-variant hover:text-sage transition-colors uppercase font-semibold"
          >
            Ceremonia & Salón
          </button>
          <button 
            onClick={() => scrollToSection('rsvp')} 
            className="font-sans text-[10px] tracking-[0.2em] text-on-surface-variant hover:text-sage transition-colors uppercase font-semibold"
          >
            Confirmar RSVP
          </button>
        </div>

        {/* Administration portal trigger */}
        <div className="pt-4 border-t border-outline-variant/10 w-full max-w-xs flex flex-col items-center gap-2">
          <button
            onClick={() => setIsAdminOpen(true)}
            className="inline-flex items-center gap-2 text-[10px] font-sans tracking-[0.2em] text-secondary hover:text-sage transition-colors uppercase font-semibold"
          >
            <Lock size={10} /> ACCESO ORGANIZADORES
          </button>
        </div>

        {/* Copyright notice */}
        <div className="space-y-1">
          <p className="font-sans text-[9px] text-on-surface-variant/50 uppercase tracking-[0.25em] font-light">
            © 2026 INVITTA DIGITAL ATELIER. ALL RIGHTS RESERVED.
          </p>
          <p className="font-serif italic text-[10px] text-sage">
            Hecho con amor para Ana Camila Zavala
          </p>
        </div>

      </footer>

      {/* BOTTOM MOBILE NAV OVERLAY */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-3 px-2 bg-paper/95 border-t border-outline-variant/15 shadow-2xl z-40 backdrop-blur-md">
        
        <button 
          onClick={() => scrollToSection('hero')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${activeSection === 'hero' ? 'text-sage scale-105 font-semibold' : 'text-secondary/60'}`}
        >
          <Sparkles size={18} />
          <span className="font-sans text-[8px] tracking-widest font-semibold uppercase">Inicio</span>
        </button>

        <button 
          onClick={() => scrollToSection('locations')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${activeSection === 'locations' ? 'text-sage scale-105 font-semibold' : 'text-secondary/60'}`}
        >
          <MapPin size={18} />
          <span className="font-sans text-[8px] tracking-widest font-semibold uppercase">Ubicación</span>
        </button>

        <button 
          onClick={() => scrollToSection('registry')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${activeSection === 'registry' ? 'text-sage scale-105 font-semibold' : 'text-secondary/60'}`}
        >
          <Gift size={18} />
          <span className="font-sans text-[8px] tracking-widest font-semibold uppercase">Regalos</span>
        </button>

        <button 
          onClick={() => scrollToSection('rsvp')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${activeSection === 'rsvp' ? 'text-sage scale-105 font-semibold' : 'text-secondary/60'}`}
        >
          <Users size={18} />
          <span className="font-sans text-[8px] tracking-widest font-semibold uppercase">RSVP</span>
        </button>

      </nav>

      {/* MODALS AND OVERLAYS GATE */}
      
      {/* 1. Gift Registry details modal */}
      {selectedRegistry && (
        <RegistryModal 
          option={selectedRegistry} 
          onClose={() => setSelectedRegistry(null)} 
        />
      )}

      {/* 2. Photo Lightbox details modal */}
      {lightboxIndex !== null && (
        <GalleryLightbox
          images={GALLERY_IMAGES}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onSelectIndex={(idx) => setLightboxIndex(idx)}
        />
      )}

      {/* 3. Passcode-Protected Admin RSVP Dashboard */}
      {isAdminOpen && (
        <AdminDashboard 
          onClose={() => setIsAdminOpen(false)} 
        />
      )}

    </div>
  );
}
