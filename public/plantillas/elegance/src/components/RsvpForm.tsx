import React, { useState } from 'react';
import { Check, Mail, Users, MessageSquare, Sparkles, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { GuestRSVP } from '../types';
import { EVENT_DETAILS } from '../data';

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="currentColor" 
    className="inline-block"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.023-5.101-2.883-6.963C16.588 1.917 14.114.892 11.488.892c-5.44 0-9.866 4.425-9.869 9.87-.001 1.83.479 3.619 1.391 5.196L1.874 21.1l5.215-1.366zM17.5 14.1c-.28-.14-1.65-.81-1.91-.9-.26-.1-.45-.14-.64.14-.19.28-.73.9-.9 1.1-.17.19-.34.21-.62.07-2.82-1.41-4.12-2.52-5.46-4.83-.3-.52.3-.48.86-1.6.09-.19.05-.35-.02-.5-.07-.15-.63-1.5-.86-2.07-.22-.54-.45-.46-.62-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.35-.26.28-1 1-1 2.45s1.04 2.85 1.19 3.05c.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.65-.67 1.88-1.32.23-.65.23-1.21.16-1.32-.07-.11-.26-.18-.54-.32z"/>
  </svg>
);

interface RsvpFormProps {
  onRsvpAdded: () => void;
}

export default function RsvpForm({ onRsvpAdded }: RsvpFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    attending: true,
    guestsCount: 1,
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitAction = (viaWhatsApp: boolean) => {
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Por favor, ingresa tu nombre completo.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);

    // Save locally and optionally redirect to WhatsApp
    setTimeout(() => {
      try {
        const storedRSVPs = localStorage.getItem('invitta_rsvps') || localStorage.getItem('elegance_rsvps');
        const rsvps: GuestRSVP[] = storedRSVPs ? JSON.parse(storedRSVPs) : [];

        const newRSVP: GuestRSVP = {
          id: 'rsvp-' + Date.now(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          attending: formData.attending,
          guestsCount: formData.attending ? formData.guestsCount : 0,
          message: formData.message.trim() || undefined,
          submittedAt: new Date().toISOString(),
        };

        rsvps.push(newRSVP);
        localStorage.setItem('invitta_rsvps', JSON.stringify(rsvps));

        if (viaWhatsApp) {
          const isAttendingText = formData.attending ? 'Sí, asistiré ✅' : 'No podré asistir ❌';
          const messageText = formData.message.trim() ? `\n✍️ Mensaje: "${formData.message.trim()}"` : '';
          
          const text = `Hola Ana Camila ✨\n\nQuiero confirmar mi asistencia a tus XV Años:\n\n👤 Nombre: ${formData.name.trim()}\n📧 Correo: ${formData.email.trim()}\n✨ Asistencia: ${isAttendingText}${messageText}\n\n¡Muchas gracias!`;
          
          const phone = EVENT_DETAILS.rsvpPhone;
          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
          window.open(whatsappUrl, '_blank');
        }

        setIsSuccess(true);
        setIsSubmitting(false);
        onRsvpAdded(); // Notify parent to refresh list if open
      } catch (err) {
        console.error('Failed to save RSVP:', err);
        setError('Ocurrió un error al guardar tu confirmación. Intenta de nuevo.');
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitAction(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      attending: true,
      guestsCount: 1,
      message: '',
    });
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center py-8 px-2 md:px-6 space-y-8"
      >
        {/* Elegant design icon crown / sparkles */}
        <div className="space-y-2">
          <div className="w-14 h-14 bg-[#c48473]/10 text-[#c48473] rounded-full flex items-center justify-center mx-auto border border-[#c48473]/20">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <span className="font-sans text-[9px] tracking-[0.35em] text-[#c48473] uppercase font-bold block pt-2">
            Agradecimiento
          </span>
        </div>

        {/* Elegant typography header */}
        <div className="space-y-4">
          <h3 className="font-serif italic text-3xl md:text-4xl text-ink font-light tracking-wide">
            ¡Muchas Gracias!
          </h3>
          <div className="w-10 h-px bg-sage/30 mx-auto"></div>
          
          {/* Personalized Warm Invitation Text */}
          <div className="font-serif italic text-[15px] md:text-base text-secondary max-w-md mx-auto leading-relaxed px-4 pt-1">
            "Hay personas que hacen que el mundo sea un lugar más cálido y mi celebración un recuerdo inolvidable. Tu compañía y cariño son mi mayor regalo en esta hermosa etapa que comienzo."
          </div>
        </div>

        {/* Dynamic customized card depending on response */}
        <div className="max-w-md mx-auto p-6 bg-surface-container-low/40 border border-outline-variant/20 relative rounded-sm text-left space-y-4">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-sage/30"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-sage/30"></div>

          <div className="space-y-1">
            <span className="font-sans text-[8px] tracking-[0.2em] text-sage uppercase font-bold block">
              DETALLES DE CONFIRMACIÓN
            </span>
            <p className="font-serif text-xl text-ink font-light">
              {formData.name.trim()}
            </p>
          </div>

          <div className="space-y-2 border-t border-outline-variant/10 pt-3">
            <p className="font-sans text-xs text-secondary leading-relaxed">
              {formData.attending ? (
                <span>
                  Es un gran honor saber que <strong className="text-ink font-medium">asistirás</strong> a mis XV años. He reservado este lugar con especial aprecio para ti. ¡Nos vemos pronto para celebrar!
                </span>
              ) : (
                <span>
                  Agradezco de corazón tu respuesta. Lamentamos mucho que no puedas acompañarnos físicamente, pero sabemos que estarás presente con tus mejores deseos.
                </span>
              )}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-[9px] text-sage font-sans uppercase tracking-[0.15em] font-medium border-t border-outline-variant/10">
            <span className="flex items-center gap-1.5">
              <Check size={11} className="text-[#c48473]" /> REGISTRO COMPLETO
            </span>
            <span className="text-secondary/60">
              {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        {/* Signature representation */}
        <div className="space-y-1">
          <p className="font-serif italic text-lg text-ink">
            Ana Camila Zavala
          </p>
          <p className="font-sans text-[8px] tracking-[0.25em] text-sage uppercase font-bold">
            XV AÑOS • 2026
          </p>
        </div>

        {/* Bottom utility button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 border border-outline-variant/60 hover:border-sage text-secondary hover:text-sage font-sans text-[9px] tracking-[0.25em] uppercase transition-all duration-300 rounded-sm font-semibold hover:bg-sage/5"
          >
            REGISTRAR OTRA ASISTENCIA
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      {/* Attendance selection */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center border-y border-outline-variant/20 py-6">
        <label className={`flex items-center justify-center gap-3 cursor-pointer group px-6 py-3 border transition-all duration-300 rounded ${formData.attending ? 'bg-sage/10 border-sage/40 text-sage' : 'border-outline-variant/20 hover:border-outline-variant/40 text-secondary hover:text-ink'}`}>
          <input
            type="radio"
            name="attending"
            checked={formData.attending === true}
            onChange={() => setFormData({ ...formData, attending: true })}
            className="sr-only"
          />
          <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
          <span className="font-sans text-xs tracking-[0.2em] font-semibold uppercase">
            SÍ, ASISTIRÉ
          </span>
        </label>

        <label className={`flex items-center justify-center gap-3 cursor-pointer group px-6 py-3 border transition-all duration-300 rounded ${!formData.attending ? 'bg-sage/10 border-sage/40 text-sage' : 'border-outline-variant/20 hover:border-outline-variant/40 text-secondary hover:text-ink'}`}>
          <input
            type="radio"
            name="attending"
            checked={formData.attending === false}
            onChange={() => setFormData({ ...formData, attending: false })}
            className="sr-only"
          />
          <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
          <span className="font-sans text-xs tracking-[0.2em] font-semibold uppercase">
            NO PODRÉ ASISTIR
          </span>
        </label>
      </div>

      {/* Inputs container */}
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 text-error text-xs font-sans tracking-wide rounded text-center">
            {error}
          </div>
        )}

        {/* Full Name */}
        <div className="relative group border-b border-outline-variant/40 focus-within:border-sage transition-colors pb-1">
          <label className="block font-sans text-[10px] text-sage uppercase tracking-[0.2em] font-semibold mb-1">
            Nombre Completo
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-ink placeholder:opacity-30 font-sans text-body-md font-light outline-none"
            placeholder="Ej. Juan Pérez"
            disabled={isSubmitting}
          />
        </div>

        {/* Email Address */}
        <div className="relative group border-b border-outline-variant/40 focus-within:border-sage transition-colors pb-1">
          <label className="block font-sans text-[10px] text-sage uppercase tracking-[0.2em] font-semibold mb-1">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-ink placeholder:opacity-30 font-sans text-body-md font-light outline-none"
            placeholder="para recibir tu invitación digital"
            disabled={isSubmitting}
          />
        </div>

        {/* Message / Congratulatory Note */}
        <div className="relative group border-b border-outline-variant/40 focus-within:border-sage transition-colors pb-1">
          <label className="block font-sans text-[10px] text-sage uppercase tracking-[0.2em] font-semibold mb-1">
            Mensaje de Felicitación / Notas Especiales
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={2}
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-ink placeholder:opacity-30 font-sans text-body-md font-light outline-none resize-none"
            placeholder="Escribe un lindo mensaje para Ana Camila..."
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option A: Confirm on Website */}
        <button
          type="button"
          onClick={() => handleSubmitAction(false)}
          disabled={isSubmitting}
          className="w-full py-4 bg-ink text-paper font-sans text-[10px] tracking-[0.25em] hover:bg-sage hover:text-paper hover:border-sage transition-all duration-300 font-semibold flex items-center justify-center gap-2.5 disabled:opacity-50 uppercase rounded-sm border border-ink"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin"></div>
              ENVIANDO...
            </>
          ) : (
            <>
              <Send size={11} />
              CONFIRMAR EN EL SITIO
            </>
          )}
        </button>

        {/* Option B: Confirm on WhatsApp */}
        <button
          type="button"
          onClick={() => handleSubmitAction(true)}
          disabled={isSubmitting}
          className="w-full py-4 bg-sage text-paper font-sans text-[10px] tracking-[0.25em] hover:bg-ink hover:border-ink transition-all duration-300 font-semibold flex items-center justify-center gap-2.5 disabled:opacity-50 uppercase rounded-sm border border-sage"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin"></div>
              ENVIANDO...
            </>
          ) : (
            <>
              <WhatsAppIcon size={12} />
              CONFIRMAR POR WHATSAPP
            </>
          )}
        </button>
      </div>
    </form>
  );
}
