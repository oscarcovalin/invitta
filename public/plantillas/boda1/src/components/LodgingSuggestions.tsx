import React from "react";
import { motion } from "motion/react";
import { MapPin, Phone, ExternalLink, Hotel } from "lucide-react";

interface HotelSuggestion {
  id: string;
  name: string;
  phone: string;
  address: string;
  mapsUrl: string;
}

declare global { interface Window { INVITATION_DATA?: { lodgingOptions?: HotelSuggestion[] }; } }

export function LodgingSuggestions() {
  const hotels = Array.isArray(window.INVITATION_DATA?.lodgingOptions)
    ? window.INVITATION_DATA.lodgingOptions.filter((hotel) => hotel?.name)
    : [];
  if (!hotels.length) return null;
  return (
    <section id="lodging" className="py-24 px-margin-mobile bg-surface-container-low/20 relative overflow-hidden border-t border-b border-outline-variant/15">
      {/* Soft elegance backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(223,186,107,0.06)_0%,transparent_50%)] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Elegant Header Block */}
        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 mb-16"
        >
          <span className="text-subheading-caps text-sage tracking-[0.4em] flex items-center justify-center gap-2">
            <Hotel className="w-4 h-4 text-champagne-gold stroke-[1.5]" />
            Hospedaje
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-ink font-light tracking-tight">
            Sugerencias de Hospedaje
          </h2>
          <div className="w-16 h-[1.5px] bg-champagne-gold/40 mx-auto pt-2"></div>
        </motion.div>

        {/* Hotels Grid - exactly 2 places */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {hotels.map((hotel, i) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 45, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.2, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-paper border border-outline-variant/30 rounded-xs p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-500 group flex flex-col justify-between"
            >
              <div className="space-y-6">
                <h3 className="font-serif text-xl text-ink font-light tracking-wide leading-tight group-hover:text-sage transition-colors">
                  {hotel.name}
                </h3>

                <div className="space-y-3 text-xs border-t border-outline-variant/50 pt-4">
                  {/* Location Info */}
                  <div className="flex items-start gap-2.5 text-on-surface-variant font-light leading-relaxed">
                    <MapPin className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
                    <span>{hotel.address}</span>
                  </div>

                  {/* Contact Info */}
                  {hotel.phone && <div className="flex items-center gap-2.5 text-on-surface-variant">
                    <Phone className="w-4 h-4 text-sage flex-shrink-0" />
                    <a href={`tel:${hotel.phone.replace(/[^0-9+]/g, "")}`} className="hover:underline hover:text-ink font-medium">
                      {hotel.phone}
                    </a>
                  </div>}
                </div>
              </div>

              {/* Action button footer */}
              {hotel.mapsUrl && <div className="pt-8">
                <a
                  href={hotel.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-primary text-ink hover:bg-champagne-gold hover:text-paper text-[10px] tracking-[0.25em] font-semibold uppercase rounded-xs transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>CÓMO LLEGAR (MAPS)</span>
                </a>
              </div>}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
