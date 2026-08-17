import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Users, CheckCircle, XCircle, Trash2, Search, Download, Plus, LogOut, Check, ArrowUpDown } from 'lucide-react';
import { GuestRSVP } from '../types';

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<GuestRSVP[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'attending' | 'declined'>('all');
  
  // States for adding a guest manually
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: '',
    email: '',
    attending: true,
    guestsCount: 1,
    message: '',
  });

  const [addError, setAddError] = useState<string | null>(null);

  // Load RSVPs
  const loadRSVPs = () => {
    try {
      const stored = localStorage.getItem('invitta_rsvps') || localStorage.getItem('elegance_rsvps');
      if (stored) {
        setRsvps(JSON.parse(stored));
      } else {
        // Seed default dummy data if empty so the panel doesn't look blank on first load!
        const initialData: GuestRSVP[] = [
          {
            id: 'rsvp-seed-1',
            name: 'Familia Almanza García',
            email: 'diana.almanza@example.com',
            attending: true,
            guestsCount: 4,
            message: '¡Felicitaciones Camila! Nos vemos muy pronto para celebrar.',
            submittedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
          },
          {
            id: 'rsvp-seed-2',
            name: 'César Roberto Zavala Jr.',
            email: 'cesar.zavala.jr@example.com',
            attending: true,
            guestsCount: 1,
            message: '¡No puedo faltar a la fiesta de mi hermana preferida!',
            submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
          },
          {
            id: 'rsvp-seed-3',
            name: 'Enrique O\'Farrill Zúñiga',
            email: 'enrique.ofarrill@example.com',
            attending: true,
            guestsCount: 2,
            message: 'Un honor acompañar a mi ahijada en sus quince.',
            submittedAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
          },
          {
            id: 'rsvp-seed-4',
            name: 'Sofia Valenzuela',
            email: 'sofia.v@example.com',
            attending: false,
            guestsCount: 0,
            message: 'Lo lamento mucho Camila, me coincide con un examen escolar fuera de la ciudad. ¡Mucho éxito en tu gran día!',
            submittedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
          }
        ];
        localStorage.setItem('invitta_rsvps', JSON.stringify(initialData));
        setRsvps(initialData);
      }
    } catch (e) {
      console.error('Error loading RSVPs:', e);
    }
  };

  useEffect(() => {
    loadRSVPs();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (passcode.trim() === 'admin123' || passcode.trim().toLowerCase() === 'admin') {
      setIsAuthenticated(true);
    } else {
      setError('Contraseña incorrecta. Pista: usa "admin123"');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      const updated = rsvps.filter(item => item.id !== id);
      localStorage.setItem('invitta_rsvps', JSON.stringify(updated));
      setRsvps(updated);
    }
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newGuest.name.trim()) {
      setAddError('Ingresa el nombre.');
      return;
    }

    const newEntry: GuestRSVP = {
      id: 'manual-' + Date.now(),
      name: newGuest.name.trim(),
      email: newGuest.email.trim() || `${Date.now()}@example.com`,
      attending: newGuest.attending,
      guestsCount: newGuest.attending ? newGuest.guestsCount : 0,
      message: newGuest.message.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };

    const updated = [...rsvps, newEntry];
    localStorage.setItem('invitta_rsvps', JSON.stringify(updated));
    setRsvps(updated);

    // Reset Form
    setNewGuest({
      name: '',
      email: '',
      attending: true,
      guestsCount: 1,
      message: '',
    });
    setShowAddForm(false);
  };

  const exportToCSV = () => {
    try {
      const headers = ['ID', 'Nombre', 'Email', 'Asistencia', 'Boletos', 'Mensaje', 'Fecha Registro'];
      const rows = rsvps.map(r => [
        r.id,
        `"${r.name.replace(/"/g, '""')}"`,
        r.email,
        r.attending ? 'ASISTE' : 'NO ASISTE',
        r.guestsCount,
        `"${(r.message || '').replace(/"/g, '""')}"`,
        r.submittedAt
      ]);

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'confirmaciones_invitta_xv.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('CSV Export failed:', e);
    }
  };

  const filteredGuests = rsvps.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.message && item.message.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === 'attending') return matchesSearch && item.attending;
    if (filter === 'declined') return matchesSearch && !item.attending;
    return matchesSearch;
  });

  // KPI calculations
  const totalRSVPs = rsvps.length;
  const attendingCount = rsvps.filter(item => item.attending).length;
  const declinedCount = rsvps.filter(item => !item.attending).length;
  const totalGuests = rsvps.reduce((sum, item) => sum + (item.attending ? item.guestsCount : 0), 0);

  if (!isAuthenticated) {
    return (
      <div id="admin-login-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-ink/75 backdrop-blur-md" onClick={onClose}></div>
        <div className="relative bg-paper w-full max-w-md p-8 md:p-10 border border-outline-variant/30 rounded shadow-2xl z-10">
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-sage/40"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-sage/40"></div>
          
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-12 h-12 bg-sage/10 text-sage rounded-full flex items-center justify-center">
              <Lock size={20} />
            </div>
            <div className="space-y-2">
              <span className="font-sans text-[10px] tracking-[0.25em] text-sage uppercase font-bold">Panel Organizador</span>
              <h3 className="font-serif text-2xl text-ink font-light">Confirmaciones</h3>
              <p className="font-sans text-xs text-on-surface-variant font-light">
                Por favor, ingresa la clave de acceso de administrador para ver la lista de invitados confirmados.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Ingresa clave (ej: admin123)"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded px-4 py-3 focus:outline-none focus:ring-1 focus:ring-sage text-center tracking-[0.2em] font-sans text-sm text-ink"
                autoFocus
              />
              {error && (
                <p className="text-xs text-error font-sans font-light bg-error/10 py-2 rounded">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="w-full py-3.5 bg-ink text-paper hover:bg-sage font-sans text-xs tracking-[0.2em] uppercase transition-all duration-300 font-semibold"
              >
                INGRESAR AL PANEL
              </button>
            </form>

            <button
              onClick={onClose}
              className="text-[10px] font-sans tracking-widest text-secondary hover:text-ink transition-colors uppercase"
            >
              CERRAR Y REGRESAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-panel-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-paper flex flex-col min-h-screen">
      {/* Header Panel */}
      <header className="border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between bg-surface-container-lowest">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-ping"></span>
          <span className="font-sans text-[10px] tracking-[0.25em] text-sage uppercase font-bold">Panel en Vivo</span>
          <h2 className="font-serif text-xl text-ink pl-4 border-l border-outline-variant/30 hidden sm:block">XV Ana Camila - Admin</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 text-[10px] font-sans tracking-widest text-secondary hover:text-ink uppercase transition-colors"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-ink text-paper hover:bg-sage font-sans text-[10px] tracking-widest uppercase transition-colors"
          >
            Cerrar Panel
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="flex-grow p-6 max-w-7xl mx-auto w-full space-y-8">
        
        {/* KPI metrics cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-low border border-outline-variant/15 p-5 space-y-2">
            <span className="font-sans text-[9px] tracking-[0.2em] text-secondary uppercase block">Total Registros</span>
            <span className="font-serif text-3xl font-light text-ink">{totalRSVPs}</span>
            <span className="font-sans text-[9px] text-sage block">Familias / Personas</span>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/15 p-5 space-y-2">
            <span className="font-sans text-[9px] tracking-[0.2em] text-secondary uppercase block">Asistirán</span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-light text-ink">{attendingCount}</span>
              <span className="text-xs text-sage font-sans">({totalRSVPs ? Math.round((attendingCount/totalRSVPs)*100) : 0}%)</span>
            </div>
            <span className="font-sans text-[9px] text-status-success flex items-center gap-1">
              <CheckCircle size={10} /> Registros positivos
            </span>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/15 p-5 space-y-2">
            <span className="font-sans text-[9px] tracking-[0.2em] text-secondary uppercase block">Invitados Totales</span>
            <span className="font-serif text-3xl font-light text-ink">{totalGuests}</span>
            <span className="font-sans text-[9px] text-sage block">Boletos / Pases confirmados</span>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/15 p-5 space-y-2">
            <span className="font-sans text-[9px] tracking-[0.2em] text-secondary uppercase block">No Asistirán</span>
            <span className="font-serif text-3xl font-light text-ink">{declinedCount}</span>
            <span className="font-sans text-[9px] text-error flex items-center gap-1">
              <XCircle size={10} /> Cancelaciones
            </span>
          </div>
        </div>

        {/* Controls, Filters & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          
          {/* Filters tabs */}
          <div className="flex items-center border border-outline-variant/20 rounded p-1 bg-surface-container-low max-w-sm">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-4 py-1.5 text-[10px] font-sans tracking-widest uppercase transition-all duration-300 rounded ${filter === 'all' ? 'bg-ink text-paper font-semibold' : 'text-secondary hover:text-ink'}`}
            >
              Todos ({totalRSVPs})
            </button>
            <button
              onClick={() => setFilter('attending')}
              className={`flex-1 px-4 py-1.5 text-[10px] font-sans tracking-widest uppercase transition-all duration-300 rounded ${filter === 'attending' ? 'bg-ink text-paper font-semibold' : 'text-secondary hover:text-ink'}`}
            >
              Asisten ({attendingCount})
            </button>
            <button
              onClick={() => setFilter('declined')}
              className={`flex-1 px-4 py-1.5 text-[10px] font-sans tracking-widest uppercase transition-all duration-300 rounded ${filter === 'declined' ? 'bg-ink text-paper font-semibold' : 'text-secondary hover:text-ink'}`}
            >
              No Asisten ({declinedCount})
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-sage text-paper hover:bg-ink font-sans text-[10px] tracking-widest uppercase transition-all duration-300 rounded font-semibold"
            >
              <Plus size={12} />
              Agregar Invitado
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 text-ink hover:border-sage hover:text-sage font-sans text-[10px] tracking-widest uppercase transition-all duration-300 rounded font-semibold"
              title="Exportar a CSV"
            >
              <Download size={12} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Manual Addition Form */}
        {showAddForm && (
          <div className="p-6 border border-outline-variant/25 bg-surface-container-low/50 rounded space-y-4 animate-scale-up">
            <h4 className="font-serif text-lg text-ink font-medium">Agregar Invitado Manualmente</h4>
            <form onSubmit={handleAddGuest} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[9px] font-sans tracking-widest text-secondary uppercase block font-semibold">Nombre Completo</label>
                <input
                  type="text"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  placeholder="Ej. Familia Flores"
                  className="w-full bg-paper border border-outline-variant/20 rounded p-2 text-xs font-sans text-ink"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-sans tracking-widest text-secondary uppercase block font-semibold">Correo</label>
                <input
                  type="email"
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  placeholder="opcional@correo.com"
                  className="w-full bg-paper border border-outline-variant/20 rounded p-2 text-xs font-sans text-ink"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-sans tracking-widest text-secondary uppercase block font-semibold">Asistencia</label>
                <select
                  value={newGuest.attending ? 'true' : 'false'}
                  onChange={(e) => setNewGuest({ ...newGuest, attending: e.target.value === 'true' })}
                  className="w-full bg-paper border border-outline-variant/20 rounded p-2 text-xs font-sans text-ink"
                >
                  <option value="true">SÍ ASISTE</option>
                  <option value="false">NO ASISTE</option>
                </select>
              </div>

              {newGuest.attending && (
                <div className="space-y-1">
                  <label className="text-[9px] font-sans tracking-widest text-secondary uppercase block font-semibold">Pases</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newGuest.guestsCount}
                    onChange={(e) => setNewGuest({ ...newGuest, guestsCount: parseInt(e.target.value) || 1 })}
                    className="w-full bg-paper border border-outline-variant/20 rounded p-2 text-xs font-sans text-ink"
                  />
                </div>
              )}

              <div className="space-y-1 md:col-span-1">
                <button
                  type="submit"
                  className="w-full py-2 bg-ink text-paper hover:bg-sage font-sans text-[10px] tracking-widest uppercase transition-colors"
                >
                  Guardar
                </button>
              </div>
              
              {addError && (
                <p className="text-[10px] text-error font-sans md:col-span-5">{addError}</p>
              )}
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative border-b border-outline-variant/20 pb-2">
          <Search size={16} className="absolute left-2 top-1.5 text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, correo, palabras de felicitación..."
            className="w-full bg-transparent pl-10 pr-4 py-1.5 text-sm font-sans text-ink outline-none border-none placeholder:text-secondary-fixed-dim focus:ring-0"
          />
        </div>

        {/* Guests Table */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/40 border-b border-outline-variant/20 text-[10px] font-sans tracking-widest text-secondary uppercase">
                  <th className="px-6 py-4 font-semibold">Invitado</th>
                  <th className="px-6 py-4 font-semibold">Contacto</th>
                  <th className="px-6 py-4 font-semibold">Asistencia</th>
                  <th className="px-6 py-4 font-semibold">Pases</th>
                  <th className="px-6 py-4 font-semibold">Mensaje de felicitación</th>
                  <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-xs font-sans text-secondary font-light">
                      No se encontraron resultados que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-serif text-sm font-semibold text-ink">{item.name}</p>
                        <p className="font-sans text-[9px] text-secondary opacity-60">
                          Reg: {new Date(item.submittedAt).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-sans text-xs text-on-surface-variant font-light">
                        {item.email}
                      </td>
                      <td className="px-6 py-4">
                        {item.attending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-sans tracking-widest uppercase font-semibold text-status-success bg-status-success/10 rounded-full">
                            <CheckCircle size={10} /> ASISTE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-sans tracking-widest uppercase font-semibold text-error bg-error/10 rounded-full">
                            <XCircle size={10} /> NO ASISTE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-serif text-sm font-semibold text-ink">
                        {item.attending ? item.guestsCount : '—'}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-sans text-xs text-on-surface-variant font-light line-clamp-2 italic" title={item.message}>
                          {item.message ? `"${item.message}"` : <span className="opacity-40">Sin mensaje</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-secondary hover:text-error transition-colors"
                          title="Eliminar confirmación"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
