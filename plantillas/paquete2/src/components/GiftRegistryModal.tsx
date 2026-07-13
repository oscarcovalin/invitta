import { useState } from "react";
import { GiftRegistryOption } from "../types";

interface GiftRegistryModalProps {
  registry: GiftRegistryOption | null;
  onClose: () => void;
}

export function GiftRegistryModal({ registry, onClose }: GiftRegistryModalProps) {
  const [copied, setCopied] = useState(false);

  if (!registry) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        id="modal-backdrop"
        className="absolute inset-0 bg-ink/75 backdrop-blur-xs transition-opacity duration-500"
      ></div>

      {/* Modal Container */}
      <div 
        id="registry-modal-container"
        className="relative bg-paper w-full max-w-lg p-8 md:p-12 border border-outline-variant/30 shadow-2xl transition-all duration-300 transform scale-100 flex flex-col gap-8"
      >
        {/* Corner Ornaments */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-sage/40"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-sage/40"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          id="close-modal-btn"
          className="absolute top-4 right-4 text-ink/40 hover:text-sage transition-colors p-2"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-sage">{registry.icon}</span>
          <h3 className="font-display text-2xl md:text-3xl text-ink tracking-tight">{registry.name}</h3>
          <div className="w-12 h-[1px] bg-sage/30 mx-auto"></div>
        </div>

        <div className="font-sans text-[#454841] text-[15px] leading-relaxed text-center space-y-6">
          <p className="font-light italic">"{registry.details}"</p>

          {registry.clabe && (
            <div className="bg-surface-container-low/60 p-6 border border-outline-variant/20 space-y-4 text-left">
              <div className="space-y-1">
                <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-sage block">Banco</span>
                <p className="font-semibold text-ink text-sm">{registry.bank}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-sage block">Beneficiario</span>
                <p className="font-semibold text-ink text-sm">{registry.beneficiary}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-sage block">CLABE Interbancaria</span>
                <div className="flex items-center justify-between gap-4 mt-1">
                  <p className="font-mono text-xs md:text-sm text-ink tracking-wider font-semibold select-all bg-white px-2 py-1 border border-outline-variant/10 rounded-sm">
                    {registry.clabe}
                  </p>
                  <button 
                    onClick={() => handleCopy(registry.clabe || "")}
                    id="copy-clabe-btn"
                    className="flex items-center gap-2 px-3 py-1.5 bg-ink text-paper text-[10px] font-semibold tracking-wider uppercase hover:bg-sage transition-all duration-300 rounded-xs shrink-0 cursor-pointer select-none"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copied ? "check" : "content_copy"}
                    </span>
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {registry.link && (
            <div className="pt-4 flex justify-center">
              <a 
                href={registry.link}
                target="_blank"
                rel="noopener noreferrer"
                id="registry-external-link"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-ink text-paper text-xs font-semibold tracking-[0.2em] uppercase hover:bg-sage transition-colors duration-500 rounded-xs"
              >
                Ir a la Mesa de Regalos
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          )}
        </div>

        <div className="text-center pt-2">
          <button 
            onClick={onClose}
            id="modal-footer-close-btn"
            className="text-[11px] tracking-[0.2em] text-sage hover:text-ink transition-colors uppercase font-semibold"
          >
            Volver a la Invitación
          </button>
        </div>
      </div>
    </div>
  );
}
