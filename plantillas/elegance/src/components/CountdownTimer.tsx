import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Check, ExternalLink } from 'lucide-react';
import { EVENT_DATE } from '../data';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isCompleted: false,
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(EVENT_DATE) - +new Date();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isCompleted: false,
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  // Generate Google Calendar Link
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent('XV Años Ana Camila Zavala');
    const details = encodeURIComponent(
      'Te espero en mis XV Años para compartir un día inolvidable.\n\n' +
      '⛪ Ceremonia Religiosa: Parroquia Sagrado Corazón de Jesús - 3:00 P.M.\n' +
      '✨ Salón de Recepción: Cantabria Salón de Eventos - 9:00 P.M.'
    );
    const location = encodeURIComponent('Chihuahua, Chihuahua, México');
    // Start Dec 12, 2026 at 15:00 UTC (assuming local simplified)
    // End Dec 13, 2026 at 03:00 UTC
    const dates = '20261212T150000/20261213T030000';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&sf=true&output=xml`;
  };

  // Generate and Download ICS calendar file
  const downloadIcsFile = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'SUMMARY:XV Años Ana Camila Zavala',
      'DESCRIPTION:Te espero en mis XV Años para compartir un día inolvidable.\\n\\n⛪ Ceremonia Religiosa: Parroquia Sagrado Corazón de Jesús - 3:00 P.M.\\n✨ Salón de Recepción: Cantabria Salón de Eventos - 9:00 P.M.',
      'LOCATION:Chihuahua\\, Chihuahua\\, México',
      'DTSTART:20261212T150000',
      'DTEND:20261213T030000',
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'xv_anos_ana_camila.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsDropdownOpen(false);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div id="countdown-timer-module" className="flex flex-col items-start gap-8 w-full">
      {/* Dynamic Counter Grid */}
      <div className="flex gap-6 md:gap-10 text-center">
        <div className="flex flex-col items-center">
          <span className="font-serif font-light text-5xl md:text-6xl text-paper tracking-normal">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="font-sans text-[10px] md:text-xs text-sage tracking-[0.25em] mt-2 uppercase font-medium">
            Días
          </span>
        </div>
        <div className="text-sage/40 font-serif font-light text-5xl md:text-6xl">:</div>
        <div className="flex flex-col items-center">
          <span className="font-serif font-light text-5xl md:text-6xl text-paper tracking-normal">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="font-sans text-[10px] md:text-xs text-sage tracking-[0.25em] mt-2 uppercase font-medium">
            Horas
          </span>
        </div>
        <div className="text-sage/40 font-serif font-light text-5xl md:text-6xl">:</div>
        <div className="flex flex-col items-center">
          <span className="font-serif font-light text-5xl md:text-6xl text-paper tracking-normal">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="font-sans text-[10px] md:text-xs text-sage tracking-[0.25em] mt-2 uppercase font-medium">
            Minutos
          </span>
        </div>
        <div className="text-sage/40 font-serif font-light text-5xl md:text-6xl">:</div>
        <div className="flex flex-col items-center">
          <span className="font-serif font-light text-5xl md:text-6xl text-paper tracking-normal">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="font-sans text-[10px] md:text-xs text-sage tracking-[0.25em] mt-2 uppercase font-medium">
            Segundos
          </span>
        </div>
      </div>

      {/* Interactive Dropdown Button */}
      <div className="relative w-full md:w-auto">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full md:w-auto px-6 py-4 bg-transparent border border-paper/20 hover:border-sage text-paper hover:text-sage transition-all duration-300 font-sans text-xs tracking-[0.3em] uppercase font-medium flex items-center justify-center gap-3 group"
        >
          <Calendar size={14} className="group-hover:scale-110 transition-transform" />
          {copied ? '¡AGREGADO!' : 'AGREGAR AL CALENDARIO'}
          <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <>
            {/* Backdrop click to close */}
            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
            
            <div className="absolute left-0 mt-2 w-full md:w-64 bg-ink border border-outline-variant/10 rounded shadow-2xl z-20 overflow-hidden animate-fade-in">
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center justify-between px-5 py-4 text-xs font-sans tracking-widest text-paper hover:bg-sage/20 transition-colors border-b border-paper/10"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink size={12} className="text-sage" />
                  GOOGLE CALENDAR
                </span>
                <span className="text-[9px] text-sage">ONLINE</span>
              </a>
              <button
                onClick={downloadIcsFile}
                className="w-full flex items-center justify-between px-5 py-4 text-xs font-sans tracking-widest text-paper hover:bg-sage/20 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Calendar size={12} className="text-sage" />
                  DESCARGAR ARCHIVO iCAL (.ICS)
                </span>
                <span className="text-[9px] text-sage">MÓVIL / PC</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
