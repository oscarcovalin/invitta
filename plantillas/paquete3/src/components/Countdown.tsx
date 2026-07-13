import { useState, useEffect } from "react";

export function Countdown() {
  const targetDate = new Date("2026-12-12T15:00:00-06:00").getTime(); // Chihuahua/Mexico time
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
      title: "XV Años Ana Camila Zavala",
      description: "Acompáñanos a celebrar los quince años de Ana Camila. Ceremonia: Parroquia Sagrado Corazón de Jesús. Recepción: Cantabria Salón de Eventos.",
      location: "Cantabria Salón de Eventos, Chihuahua, Chih.",
      start: "20261212T150000",
      end: "20261213T020000",
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
    link.download = "XV_Anos_Ana_Camila.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-start gap-12">
      <div className="flex gap-8 md:gap-12 text-center">
        <div className="flex flex-col items-center">
          <span className="font-display font-light text-5xl md:text-6xl text-white tracking-tight">
            {timeLeft.days.toString().padStart(2, "0")}
          </span>
          <span className="text-subheading-caps text-[10px] text-sage/70 mt-2">Días</span>
        </div>
        
        <span className="font-display font-light text-4xl text-sage/40 self-start mt-2">:</span>

        <div className="flex flex-col items-center">
          <span className="font-display font-light text-5xl md:text-6xl text-white tracking-tight">
            {timeLeft.hours.toString().padStart(2, "0")}
          </span>
          <span className="text-subheading-caps text-[10px] text-sage/70 mt-2">Horas</span>
        </div>

        <span className="font-display font-light text-4xl text-sage/40 self-start mt-2">:</span>

        <div className="flex flex-col items-center">
          <span className="font-display font-light text-5xl md:text-6xl text-white tracking-tight">
            {timeLeft.minutes.toString().padStart(2, "0")}
          </span>
          <span className="text-subheading-caps text-[10px] text-sage/70 mt-2">Minutos</span>
        </div>

        <span className="font-display font-light text-4xl text-sage/40 self-start mt-2 sm:inline hidden">:</span>

        <div className="sm:flex flex-col items-center hidden">
          <span className="font-display font-light text-5xl md:text-6xl text-white tracking-tight text-sage">
            {timeLeft.seconds.toString().padStart(2, "0")}
          </span>
          <span className="text-subheading-caps text-[10px] text-sage/70 mt-2">Segundos</span>
        </div>
      </div>

      <button
        onClick={downloadIcs}
        id="add-to-calendar-btn"
        className="px-8 py-4 border border-white/20 hover:border-sage hover:bg-white hover:text-ink transition-all duration-500 font-sans tracking-[0.25em] text-[11px] text-white uppercase rounded-xs cursor-pointer select-none"
      >
        AGREGAR AL CALENDARIO
      </button>
    </div>
  );
}
