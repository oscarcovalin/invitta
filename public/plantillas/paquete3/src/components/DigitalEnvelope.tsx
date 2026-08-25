import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface DigitalEnvelopeProps { onOpen: () => void; }
interface InvitationData { celebrantName?: string; eventTitle?: string; eventDate?: string; palettePreset?: string; colorPrimary?: string; colorSecondary?: string; titleColor?: string; accentColor?: string; }

declare global { interface Window { INVITATION_DATA?: InvitationData; } }

const envelopePalettes: Record<string, { base: string; support: string; accent: string }> = {
  champagne: { base: "#F7F0E7", support: "#40362E", accent: "#B99654" }, rose: { base: "#FAF0F0", support: "#704853", accent: "#C88A97" }, sage: { base: "#F1F3EC", support: "#405144", accent: "#718067" }, emerald: { base: "#F0F4EF", support: "#1F493B", accent: "#1E6A52" }, midnight: { base: "#10182A", support: "#F4E8D0", accent: "#C8A452" }, "terracotta-sand": { base: "#F4E5D8", support: "#5F3B2D", accent: "#B96F4B" }, "plum-olive": { base: "#F3EFF0", support: "#432E3A", accent: "#70805A" }, "opal-blue": { base: "#EAF2F4", support: "#263B5B", accent: "#8B79A8" }, "emerald-jewel": { base: "#E8EFEA", support: "#0E3B31", accent: "#C19A3C" }, "celestial-navy": { base: "#0C1630", support: "#F5EBD5", accent: "#D6AF4B" }
};

function validHex(value?: string) { return /^#[0-9a-f]{6}$/i.test(value || "") ? value! : ""; }
function mix(hexA: string, hexB: string, amount: number) {
  const a = hexA.replace("#", ""); const b = hexB.replace("#", "");
  const channel = (index: number) => Math.round(parseInt(a.slice(index, index + 2), 16) * (1 - amount) + parseInt(b.slice(index, index + 2), 16) * amount).toString(16).padStart(2, "0");
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

function getEnvelopeCopy() {
  const data = typeof window === "undefined" ? undefined : window.INVITATION_DATA;
  const names = data?.celebrantName?.trim() || "La celebración";
  const title = data?.eventTitle?.trim() || "Nuestra boda";
  const initials = names.split(/\s*(?:&|\by\b)\s*/i).filter(Boolean).map((name) => name.trim().charAt(0)).join("").slice(0, 2).toLocaleUpperCase("es-MX") || "I";
  let date = "";
  if (data?.eventDate) {
    const parsed = new Date(`${data.eventDate}T12:00:00`);
    date = Number.isNaN(parsed.getTime()) ? data.eventDate : new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
  }
  const preset = envelopePalettes[data?.palettePreset || ""] || { base: "#F7EFE0", support: "#252B3D", accent: "#B8954F" };
  const accent = validHex(data?.accentColor) || validHex(data?.colorPrimary) || preset.accent;
  const base = validHex(data?.colorSecondary) || preset.base;
  const ink = validHex(data?.titleColor) || preset.support;
  return { names, title, initials, date, paper: mix(base, "#FFFFFF", 0.58), ink, accent, envelope: mix(accent, "#101522", 0.72), envelopeLight: mix(accent, "#3A4668", 0.45), envelopeDark: mix(accent, "#101522", 0.82), line: mix(accent, "#F5DFAB", 0.42) };
}

export function DigitalEnvelope({ onOpen }: DigitalEnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCardExtracted, setIsCardExtracted] = useState(false);
  const copy = useMemo(getEnvelopeCopy, []);

  const handleOpen = () => {
    if (isOpen) return;
    setIsOpen(true);
    window.setTimeout(() => setIsCardExtracted(true), 520);
    window.setTimeout(onOpen, 2500);
  };

  return (
    <motion.div key="envelope-overlay" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.55 } }} className="fixed inset-0 z-[120] grid place-items-center overflow-hidden bg-[#10131f] px-5 py-10 text-[#f8f1e3]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(201,159,83,0.16),transparent_54%),linear-gradient(145deg,#0b0d16,#151a2b)]" />
      <div className="pointer-events-none absolute inset-5 border border-[#d9b66c]/15 md:inset-9" />
      <div className="relative w-full max-w-[560px] [perspective:1400px]">
        <motion.article initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={isCardExtracted ? { opacity: 1, y: "-64%", scale: 1 } : { opacity: 1, y: 12, scale: 0.97 }} transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }} style={{ backgroundColor: copy.paper, color: copy.ink }} className={`absolute inset-x-[8%] top-[10%] min-h-[255px] px-7 py-8 text-center shadow-[0_26px_65px_rgba(0,0,0,0.45)] md:min-h-[290px] md:px-12 md:py-10 ${isCardExtracted ? "z-50" : "z-20"}`}>
          <div className="pointer-events-none absolute inset-3 border" style={{ borderColor: copy.line }} />
          <div className="relative flex min-h-[190px] flex-col items-center justify-center gap-3 md:min-h-[220px]">
            <span className="text-[9px] font-semibold uppercase tracking-[0.36em]" style={{ color: copy.accent }}>Invitación</span><span className="h-px w-9" style={{ backgroundColor: copy.accent }} />
            <h2 className="font-serif text-[clamp(1.6rem,7vw,2.65rem)] leading-[0.98] [text-wrap:balance]">{copy.names}</h2>
            <p className="font-serif italic text-lg" style={{ color: copy.accent }}>{copy.title}</p>
            {copy.date && <p className="pt-1 text-[10px] uppercase tracking-[0.25em] opacity-70">{copy.date}</p>}
          </div>
        </motion.article>
        <div className="relative z-30 aspect-[1.45/1] overflow-hidden border shadow-[0_30px_65px_rgba(0,0,0,0.5)]" style={{ backgroundColor: copy.envelope, borderColor: copy.line }}>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.045),transparent_42%),radial-gradient(ellipse_at_50%_110%,rgba(212,171,92,0.2),transparent_58%)]" />
          <div className="absolute inset-x-0 bottom-0 z-20 h-[72%]"><svg viewBox="0 0 600 300" className="h-full w-full" aria-hidden="true"><path d="M0 300 300 95 600 300Z" fill={copy.envelopeLight} /><path d="M0 0 300 205 0 300Z" fill={copy.envelope} stroke={copy.line} strokeWidth="1" /><path d="M600 0 300 205 600 300Z" fill={copy.envelopeDark} stroke={copy.line} strokeWidth="1" /><path d="M0 300 300 95 600 300" fill="none" stroke={copy.line} strokeOpacity=".42" strokeWidth="1" /></svg></div>
          <motion.div style={{ transformOrigin: "top center", backfaceVisibility: "hidden" }} animate={isOpen ? { rotateX: 180 } : { rotateX: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-x-0 top-0 z-40 h-[58%]"><svg viewBox="0 0 600 220" className="h-full w-full" aria-hidden="true"><path d="M0 0 300 220 600 0Z" fill={copy.envelopeLight} stroke={copy.line} strokeWidth="1.2" /><path d="M0 0 300 220 600 0" fill="none" stroke={copy.line} strokeOpacity=".5" strokeWidth="1" /></svg></motion.div>
          <AnimatePresence>{!isOpen && <motion.button type="button" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.12, y: 18 }} transition={{ duration: 0.35 }} onClick={handleOpen} className="absolute left-1/2 top-[53%] z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 focus:outline-none" aria-label="Abrir invitación"><span style={{ background: `radial-gradient(circle at 35% 28%, ${mix(copy.accent, "#FFFFFF", 0.38)}, ${copy.accent} 58%, ${mix(copy.accent, "#101522", 0.46)})`, borderColor: copy.line, color: copy.paper }} className="grid h-20 w-20 place-items-center rounded-full border font-serif text-2xl tracking-[0.08em] shadow-[0_8px_18px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.65)] ring-8 ring-white/10 transition-transform duration-300 hover:scale-105 focus-visible:scale-105">{copy.initials}</span><span className="text-center text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: copy.line }}>Toca el sello para abrir</span></motion.button>}</AnimatePresence>
        </div>
        <p className="mt-7 text-center text-[9px] uppercase tracking-[0.3em]" style={{ color: copy.line }}>Una celebración para recordar</p>
      </div>
    </motion.div>
  );
}
