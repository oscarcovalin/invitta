import React, { useState } from 'react';
import { X, Copy, Check, ShoppingBag, Gift, CreditCard, Mail } from 'lucide-react';
import { RegistryOption } from '../types';

interface RegistryModalProps {
  option: RegistryOption;
  onClose: () => void;
}

export default function RegistryModal({ option, onClose }: RegistryModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (option.copyValue) {
      navigator.clipboard.writeText(option.copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Gift':
        return <Gift size={32} className="text-sage" />;
      case 'ShoppingBag':
        return <ShoppingBag size={32} className="text-sage" />;
      case 'CreditCard':
        return <CreditCard size={32} className="text-sage" />;
      case 'Mail':
        return <Mail size={32} className="text-sage" />;
      default:
        return <Gift size={32} className="text-sage" />;
    }
  };

  return (
    <div id="registry-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Semi-transparent dark background */}
      <div 
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-paper w-full max-w-lg p-8 md:p-12 border border-outline-variant/30 rounded shadow-2xl z-10 overflow-hidden transform transition-all animate-scale-up">
        {/* Aesthetic Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-sage/40"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-sage/40"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-ink transition-colors p-2"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        {/* Modal Content */}
        <div className="flex flex-col items-center text-center space-y-6 mt-4">
          <div className="w-16 h-16 rounded-full border border-sage/20 flex items-center justify-center">
            {getIconComponent(option.icon)}
          </div>

          <span className="font-sans text-[10px] tracking-[0.3em] text-sage uppercase font-semibold">
            Mesa de Regalos
          </span>

          <h3 className="font-serif text-3xl md:text-4xl text-ink font-light">
            {option.title}
          </h3>

          <div className="w-12 h-px bg-sage/30 relative">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper px-2 text-sage text-[10px]">✦</span>
          </div>

          <p className="font-sans text-body-md text-on-surface-variant leading-relaxed max-w-md font-light">
            {option.description}
          </p>

          {/* Conditional actions */}
          {option.copyValue ? (
            <div className="w-full space-y-4">
              <div className="bg-surface-container-low border border-outline-variant/30 px-4 py-3.5 flex items-center justify-between text-left rounded">
                <code className="font-mono text-xs md:text-sm text-ink font-semibold tracking-wider select-all">
                  {option.copyValue}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 text-sage hover:text-ink transition-colors ml-2 flex-shrink-0"
                  title="Copiar al portapapeles"
                >
                  {copied ? <Check size={16} className="text-status-success animate-scale-up" /> : <Copy size={16} />}
                </button>
              </div>
              
              <button
                onClick={handleCopy}
                className="w-full py-4 bg-ink text-paper font-sans text-xs tracking-[0.25em] hover:bg-sage transition-all duration-300 font-semibold"
              >
                {copied ? '¡COPIADO CON ÉXITO!' : option.actionText}
              </button>
            </div>
          ) : (
            option.actionUrl && (
              <a
                href={option.actionUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full py-4 bg-ink text-paper font-sans text-xs tracking-[0.25em] hover:bg-sage flex items-center justify-center gap-2 transition-all duration-300 font-semibold"
              >
                {option.actionText}
              </a>
            )
          )}

          <button
            onClick={onClose}
            className="text-[10px] font-sans tracking-[0.2em] text-secondary hover:text-ink transition-colors uppercase mt-4"
          >
            VOLVER A LA INVITACIÓN
          </button>
        </div>
      </div>
    </div>
  );
}
