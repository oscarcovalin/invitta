import React, { useState, useEffect } from "react";
import { RSVP } from "../types";

interface RsvpAdminProps {
  isOpen: boolean;
  onClose: () => void;
  rsvps: RSVP[];
  onDeleteRsvp: (id: string) => void;
  onClearAll: () => void;
}

export function RsvpAdmin({ isOpen, onClose, rsvps, onDeleteRsvp, onClearAll }: RsvpAdminProps) {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "attending" | "not-attending">("all");

  useEffect(() => {
    if (!isOpen) {
      setPasscode("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "2026") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Código de acceso incorrecto. Sugerencia: 2026");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasscode("");
  };

  // Calculations
  const totalSubmissions = rsvps.length;
  const attendingSubmissions = rsvps.filter(r => r.attending);
  const attendingGuestsTotal = attendingSubmissions.reduce((sum, r) => sum + (r.guestsCount || 1), 0);
  const declinedSubmissions = rsvps.filter(r => !r.attending).length;

  const filteredRsvps = rsvps.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.email && r.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filter === "attending") return matchesSearch && r.attending;
    if (filter === "not-attending") return matchesSearch && !r.attending;
    return matchesSearch;
  });

  const exportToCsv = () => {
    if (rsvps.length === 0) {
      alert("No hay confirmaciones para exportar.");
      return;
    }

    const headers = ["ID", "Nombre", "Email", "Asiste", "Pases Solicitados", "Notas Alimenticias", "Mensaje", "Fecha Confirmacion"];
    const rows = rsvps.map(r => [
      r.id,
      `"${r.name.replace(/"/g, '""')}"`,
      r.email ? `"${r.email.replace(/"/g, '""')}"` : "",
      r.attending ? "SÍ" : "NO",
      r.guestsCount,
      r.dietaryNotes ? `"${r.dietaryNotes.replace(/"/g, '""')}"` : "",
      r.message ? `"${r.message.replace(/"/g, '""')}"` : "",
      r.timestamp
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RSVP_Ana_Camila_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadSampleData = () => {
    if (confirm("¿Cargar 5 confirmaciones ficticias para demostración?")) {
      const samples: RSVP[] = [
        {
          id: "1",
          name: "Alejandro Zavala Almazán",
          email: "alejandro@gmail.com",
          attending: true,
          guestsCount: 4,
          dietaryNotes: "1 Vegetariano",
          timestamp: new Date().toLocaleString(),
          message: "¡Muchas felicidades Camila, nos vemos pronto!"
        },
        {
          id: "2",
          name: "María Fernanda González",
          email: "mafer.gonzalez@hotmail.com",
          attending: true,
          guestsCount: 2,
          timestamp: new Date().toLocaleString(),
          message: "¡Qué emoción compartir contigo tu gran día!"
        },
        {
          id: "3",
          name: "Roberto Bernal O'Farrill",
          email: "roberto@bernal.com",
          attending: false,
          guestsCount: 0,
          timestamp: new Date().toLocaleString(),
          message: "Lamentablemente no podremos asistir por viaje familiar. ¡Los mejores deseos!"
        },
        {
          id: "4",
          name: "Diana Estefanía Morales",
          email: "diana.mor@outlook.com",
          attending: true,
          guestsCount: 1,
          dietaryNotes: "Alergia a mariscos",
          timestamp: new Date().toLocaleString()
        },
        {
          id: "5",
          name: "Familia Farrera Orozco",
          email: "farrera@farrera.com",
          attending: true,
          guestsCount: 5,
          timestamp: new Date().toLocaleString(),
          message: "Confirmamos la asistencia de toda la familia. ¡Abrazos!"
        }
      ];
      
      // We will trigger a state save in App.tsx by passing them through a simulated addition
      samples.forEach(s => {
        // Simple manual addition
        localStorage.setItem(`rsvp_${s.id}`, JSON.stringify(s));
      });
      // Force reload to let parent update
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        id="admin-backdrop"
        className="absolute inset-0 bg-ink/80 backdrop-blur-md transition-opacity duration-500"
      ></div>

      {/* Admin Panel */}
      <div 
        id="admin-panel-container"
        className="relative bg-paper w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-12 border border-outline-variant/30 shadow-2xl transition-all duration-300 transform scale-100 flex flex-col gap-6"
      >
        {/* Corner Ornaments */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-sage/40"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-sage/40"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          id="close-admin-btn"
          className="absolute top-4 right-4 text-ink/40 hover:text-sage transition-colors p-2"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="py-12 max-w-md mx-auto w-full space-y-8">
            <div className="text-center space-y-4">
              <span className="material-symbols-outlined text-4xl text-sage">lock</span>
              <h3 className="font-display text-2xl md:text-3xl text-ink">Buzón RSVP Administrador</h3>
              <p className="font-sans text-xs text-on-surface-variant tracking-[0.1em] uppercase">
                Área reservada para Ana Camila y familia
              </p>
              <div className="w-12 h-[1px] bg-sage/30 mx-auto"></div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-subheading-caps text-[10px] text-sage">Código de Acceso</label>
                <input 
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Introduce '2026' para probar"
                  className="w-full bg-transparent border border-outline-variant/50 p-3 text-center tracking-widest text-ink focus:outline-hidden focus:border-sage rounded-xs text-sm"
                  autoFocus
                />
                {error && <p className="text-xs text-rose-600 text-center">{error}</p>}
              </div>

              <button 
                type="submit"
                id="auth-submit-btn"
                className="w-full py-4 bg-ink text-white hover:bg-sage transition-colors duration-300 font-sans tracking-[0.2em] text-xs font-semibold uppercase rounded-xs"
              >
                INGRESAR AL PANEL
              </button>
            </form>
          </div>
        ) : (
          /* RSVP Management Dashboard */
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-outline-variant/20">
              <div className="space-y-1">
                <h3 className="font-display text-2xl md:text-3xl text-ink">Registro de Invitados</h3>
                <p className="font-sans text-xs text-sage tracking-[0.15em] uppercase">
                  Ana Camila Zavala — 12.Dic.2026
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={exportToCsv}
                  id="export-csv-btn"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sage text-paper text-xs font-semibold tracking-wider uppercase hover:opacity-90 transition-all rounded-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Exportar CSV
                </button>
                {rsvps.length === 0 && (
                  <button 
                    onClick={loadSampleData}
                    id="load-demo-btn"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-sage/40 text-sage text-xs font-semibold tracking-wider uppercase hover:bg-sage/10 transition-all rounded-xs cursor-pointer"
                  >
                    Cargar Demos
                  </button>
                )}
                <button 
                  onClick={handleLogout}
                  id="admin-logout-btn"
                  className="px-4 py-2 border border-outline-variant/50 text-ink/70 hover:text-ink text-xs font-semibold tracking-wider uppercase transition-all rounded-xs cursor-pointer"
                >
                  Salir
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-surface-container-low/50 p-4 border border-outline-variant/20">
                <span className="text-[9px] tracking-[0.2em] uppercase font-semibold text-on-surface-variant block">Respuestas Recibidas</span>
                <p className="font-display text-2xl md:text-3xl text-ink font-light mt-1">{totalSubmissions}</p>
              </div>
              <div className="bg-surface-container-low/50 p-4 border border-outline-variant/20">
                <span className="text-[9px] tracking-[0.2em] uppercase font-semibold text-sage block">Familias Asistirán</span>
                <p className="font-display text-2xl md:text-3xl text-sage font-light mt-1">{attendingSubmissions.length}</p>
              </div>
              <div className="bg-surface-container-low/50 p-4 border border-outline-variant/20">
                <span className="text-[9px] tracking-[0.2em] uppercase font-semibold text-ink block">Total de Pases Solicitados</span>
                <p className="font-display text-2xl md:text-3xl text-ink font-light mt-1">{attendingGuestsTotal}</p>
              </div>
              <div className="bg-surface-container-low/50 p-4 border border-outline-variant/20">
                <span className="text-[9px] tracking-[0.2em] uppercase font-semibold text-on-surface-variant/70 block">Cancelaciones (No asisten)</span>
                <p className="font-display text-2xl md:text-3xl text-on-surface-variant/70 font-light mt-1">{declinedSubmissions}</p>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-ink/40">
                  <span className="material-symbols-outlined text-sm">search</span>
                </span>
                <input 
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border border-outline-variant/50 pl-9 pr-4 py-2.5 text-xs focus:outline-hidden focus:border-sage rounded-xs text-ink placeholder:opacity-50"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase rounded-xs transition-colors duration-300 ${filter === "all" ? "bg-ink text-paper" : "bg-transparent text-ink border border-outline-variant/30"}`}
                >
                  Todos ({rsvps.length})
                </button>
                <button 
                  onClick={() => setFilter("attending")}
                  className={`px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase rounded-xs transition-colors duration-300 ${filter === "attending" ? "bg-sage text-paper" : "bg-transparent text-ink border border-outline-variant/30"}`}
                >
                  Asistirán ({attendingSubmissions.length})
                </button>
                <button 
                  onClick={() => setFilter("not-attending")}
                  className={`px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase rounded-xs transition-colors duration-300 ${filter === "not-attending" ? "bg-on-surface-variant/80 text-paper" : "bg-transparent text-ink border border-outline-variant/30"}`}
                >
                  No Asistirán ({declinedSubmissions})
                </button>
              </div>
            </div>

            {/* Guests Table */}
            <div className="border border-outline-variant/20 overflow-x-auto bg-white/50">
              {filteredRsvps.length === 0 ? (
                <div className="py-12 text-center text-sm text-on-surface-variant/60 font-light italic">
                  No se encontraron registros de confirmación.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/75 border-b border-outline-variant/20">
                      <th className="p-4 text-[10px] font-semibold tracking-widest text-sage uppercase">Invitado / Familia</th>
                      <th className="p-4 text-[10px] font-semibold tracking-widest text-sage uppercase">Contacto</th>
                      <th className="p-4 text-[10px] font-semibold tracking-widest text-sage uppercase text-center">Estado</th>
                      <th className="p-4 text-[10px] font-semibold tracking-widest text-sage uppercase text-center">Pases</th>
                      <th className="p-4 text-[10px] font-semibold tracking-widest text-sage uppercase">Notas / Mensaje</th>
                      <th className="p-4 text-[10px] font-semibold tracking-widest text-sage uppercase text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-xs text-ink font-light">
                    {filteredRsvps.map((rsvp) => (
                      <tr key={rsvp.id} className="hover:bg-paper/50 transition-colors">
                        <td className="p-4 font-semibold">{rsvp.name}</td>
                        <td className="p-4 select-all opacity-85">{rsvp.email || "-"}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-1 text-[9px] font-semibold tracking-wider uppercase rounded-xs ${rsvp.attending ? "bg-sage/10 text-sage" : "bg-red-50 text-red-700"}`}>
                            {rsvp.attending ? "ASISTIRÁ" : "CANCELÓ"}
                          </span>
                        </td>
                        <td className="p-4 text-center font-semibold text-sm">
                          {rsvp.attending ? rsvp.guestsCount : "0"}
                        </td>
                        <td className="p-4 max-w-xs space-y-1">
                          {rsvp.dietaryNotes && (
                            <p className="text-red-700/90 font-medium">
                              ⚠️ Dieta: {rsvp.dietaryNotes}
                            </p>
                          )}
                          {rsvp.message && (
                            <p className="text-on-surface-variant/80 italic">
                              "{rsvp.message}"
                            </p>
                          )}
                          <span className="text-[9px] text-on-surface-variant/40 block">
                            {rsvp.timestamp}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => {
                              if (confirm(`¿Eliminar la confirmación de ${rsvp.name}?`)) {
                                onDeleteRsvp(rsvp.id);
                              }
                            }}
                            className="text-red-700 hover:text-red-900 transition-colors p-1"
                            title="Eliminar registro"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Clear All Safety Option */}
            {rsvps.length > 0 && (
              <div className="flex justify-end pt-4">
                <button 
                  onClick={() => {
                    const confirmName = prompt("Para eliminar TODOS los registros, escribe 'BORRAR TODO' abajo:");
                    if (confirmName === "BORRAR TODO") {
                      onClearAll();
                    }
                  }}
                  className="text-[10px] tracking-widest text-red-600 hover:text-red-800 transition-colors uppercase font-semibold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs">delete_forever</span>
                  Vaciar Base de Datos
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
