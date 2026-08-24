import { useState, useEffect } from "react";

type CountdownProps = {
  eventDate?: string;
  eventTime?: string;
  coupleName?: string;
  ceremonyName?: string;
  receptionName?: string;
  location?: string;
};

function toEventTimestamp(date?: string, time?: string) {
  if (!date) return new Date("2026-12-12T15:00:00-06:00").getTime();
  const match = String(time || "15:00").match(/(\d{1,2}):(\d{2})/);
  let hours = match ? Number(match[1]) : 15;
  const minutes = match ? Number(match[2]) : 0;
  if (/p\.m\./i.test(time || "") && hours < 12) hours += 12;
  if (/a\.m\./i.test(time || "") && hours === 12) hours = 0;
  const parsed = new Date(`${date.slice(0, 10)}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
  return Number.isNaN(parsed.getTime()) ? new Date("2026-12-12T15:00:00-06:00").getTime() : parsed.getTime();
}

function toIcsTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const part = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${part(date.getMonth() + 1)}${part(date.getDate())}T${part(date.getHours())}${part(date.getMinutes())}00`;
}

export function Countdown({ eventDate, eventTime, coupleName = "Ana Camila y Carlos", ceremonyName = "", receptionName = "", location = "" }: CountdownProps) {
  const targetDate = toEventTimestamp(eventDate, eventTime);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const downloadIcs = () => {
    const event = {
      title: `Boda de ${coupleName}`,
      description: `Acompáñanos a celebrar la unión de ${coupleName}.${ceremonyName ? ` Ceremonia: ${ceremonyName}.` : ""}${receptionName ? ` Recepción: ${receptionName}.` : ""}`,
      location,
      start: toIcsTimestamp(targetDate),
      end: toIcsTimestamp(targetDate + 7 * 60 * 60 * 1000),
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Elegance Digital Atelier//NONSGML Invitation//ES",
      "BEGIN:VEVENT",
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      `DTSTART:${event.start}`,
      `DTEND:${event.end}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Boda_${coupleName.replace(/[^A-Za-z0-9]+/g, "_") || "Invitta"}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative overflow-hidden bg-surface-container-low/80 backdrop-blur-md border border-champagne-gold/30 rounded-xs px-6 py-10 sm:px-8 sm:py-10 md:px-12 md:py-12 flex flex-col items-center gap-8 md:gap-10 shadow-2xl max-w-xl w-full mx-auto">
      {/* Delicate inner double gold line frame */}
      <div className="absolute inset-2 md:inset-3 border border-champagne-gold/15 rounded-xs pointer-events-none z-0" />
      
      {/* Decorative stationary corner borders */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-champagne-gold/40 rounded-tl-xs pointer-events-none" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-champagne-gold/40 rounded-tr-xs pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-champagne-gold/40 rounded-bl-xs pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-champagne-gold/40 rounded-br-xs pointer-events-none" />

      {/* Decorative subtitle header */}
      <div className="flex items-center gap-2 text-champagne-gold/70 z-10">
        <span className="text-[10px] tracking-[0.3em] font-sans text-sage/75 uppercase font-medium">CADA SEGUNDO ACERCA NUESTRO DÍA</span>
      </div>

      {/* Time Display Grid with Days, Hours, Minutes, Seconds */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 text-center z-10 w-full">
        {/* Days */}
        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[65px] md:min-w-[75px]">
          <span className="font-display font-light text-3xl sm:text-4xl md:text-5xl text-white tracking-tight">
            {timeLeft.days.toString().padStart(2, "0")}
          </span>
          <span className="text-subheading-caps text-[8px] sm:text-[9px] md:text-[10px] text-sage/80 mt-2 uppercase tracking-[0.15em]">Días</span>
        </div>
        
        <span className="font-display font-light text-xl sm:text-2xl md:text-3xl text-sage/30 self-center mb-5">:</span>

        {/* Hours */}
        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[65px] md:min-w-[75px]">
          <span className="font-display font-light text-3xl sm:text-4xl md:text-5xl text-white tracking-tight">
            {timeLeft.hours.toString().padStart(2, "0")}
          </span>
          <span className="text-subheading-caps text-[8px] sm:text-[9px] md:text-[10px] text-sage/80 mt-2 uppercase tracking-[0.15em]">Horas</span>
        </div>

        <span className="font-display font-light text-xl sm:text-2xl md:text-3xl text-sage/30 self-center mb-5">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[65px] md:min-w-[75px]">
          <span className="font-display font-light text-3xl sm:text-4xl md:text-5xl text-white tracking-tight">
            {timeLeft.minutes.toString().padStart(2, "0")}
          </span>
          <span className="text-subheading-caps text-[8px] sm:text-[9px] md:text-[10px] text-sage/80 mt-2 uppercase tracking-[0.15em]">Minutos</span>
        </div>

        <span className="font-display font-light text-xl sm:text-2xl md:text-3xl text-sage/30 self-center mb-5">:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[65px] md:min-w-[75px]">
          <span className="font-display font-light text-3xl sm:text-4xl md:text-5xl text-primary tracking-tight font-medium">
            {timeLeft.seconds.toString().padStart(2, "0")}
          </span>
          <span className="text-subheading-caps text-[8px] sm:text-[9px] md:text-[10px] text-sage/80 mt-2 uppercase tracking-[0.15em]">Segundos</span>
        </div>
      </div>

      <button
        onClick={downloadIcs}
        id="add-to-calendar-btn"
        className="px-6 py-3.5 border border-champagne-gold/30 hover:border-champagne-gold hover:bg-champagne-gold hover:text-[#10121e] transition-all duration-500 font-sans tracking-[0.25em] text-[9px] sm:text-[10px] text-champagne-gold uppercase rounded-xs cursor-pointer select-none z-10 shadow-lg"
      >
        AGREGAR AL CALENDARIO
      </button>
    </div>
  );
}
