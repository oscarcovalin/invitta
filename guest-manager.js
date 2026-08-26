/**
 * ============================================================================
 * GuestManager — Motor Central de Logística, Invitados y Envíos
 * Invitta 2.0 Beta · Antigravity
 * ============================================================================
 */

class GuestManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'invitta_2_guest_db';
    this.options = Object.assign({
      defaultContemplatedGuests: 120,
      defaultCapacityPerTable: 8,
      eventDetails: {
        coupleName: 'Catalina & Julián',
        eventDate: '20 de Marzo, 2027',
        venue: 'Jardín Las Magnolias',
        rsvpDeadline: '15 de Febrero, 2027',
        baseUrl: options.baseUrl || (typeof window !== 'undefined' && window.location ? window.location.href.split('index.html')[0] : '')
      }
    }, options);

    this.state = this.loadState();
  }

  loadState() {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('Error loading from storage, using defaults', e);
      }
    }

    return this.getInitialState();
  }

  saveState() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      } catch (e) {}
    }
  }

  getInitialState() {
    const contemplated = this.options.defaultContemplatedGuests;
    const capacity = this.options.defaultCapacityPerTable;
    const requiredTables = Math.ceil(contemplated / capacity);

    return {
      config: {
        contemplatedGuests: contemplated,
        capacityPerTable: capacity,
        totalTables: requiredTables,
        overCapacityColor: '#A38047'
      },
      tables: this.generateInitialTables(requiredTables, capacity),
      guests: this.getDefaultGuests()
    };
  }

  generateInitialTables(count, capacity) {
    const tables = [];
    for (let i = 1; i <= count; i++) {
      const isImperial = i === 1;
      tables.push({
        id: `tbl_${i}`,
        number: isImperial ? 'I' : String(i),
        name: isImperial ? 'Mesa Imperial (Novios & Corte)' : `Mesa ${i}`,
        subtitle: isImperial ? 'Presidencial' : 'Banquete',
        type: isImperial ? 'imperial' : 'circular',
        capacity: capacity
      });
    }
    return tables;
  }

  getDefaultGuests() {
    return [
      // 1. Familia Martínez (Bloque 4 pases)
      {
        id: 'g_martinez',
        name: 'Familia Martínez Valdés',
        contactName: 'Carlos Martínez',
        familyKey: 'martinez',
        passes: 4,
        confirmedPasses: 0,
        phone: '+525512345678',
        email: 'carlos.martinez@example.com',
        role: 'family_bride',
        roleLabel: 'Familia de la Novia',
        vip: true,
        court: false,
        tableId: 'tbl_2',
        status: 'SENT', // DRAFT, SENT, CONFIRMED, DECLINED
        diet: 'none',
        notes: 'Incluye menú infantil para Mateo',
        sentAt: '2026-08-25T14:30:00Z',
        respondedAt: null,
        reminderSentAt: null
      },
      // 2. Camila Ortiz (Corte de Honor · 2 pases)
      {
        id: 'g_camila',
        name: 'Camila Ortiz',
        contactName: 'Camila Ortiz',
        familyKey: '',
        passes: 2,
        confirmedPasses: 2,
        phone: '+525598765432',
        email: 'camila.ortiz@example.com',
        role: 'court',
        roleLabel: 'Dama de Honor · Corte',
        vip: true,
        court: true,
        tableId: 'tbl_1',
        status: 'CONFIRMED',
        diet: 'none',
        notes: 'Dama principal',
        sentAt: '2026-08-25T10:15:00Z',
        respondedAt: '2026-08-25T16:45:00Z',
        reminderSentAt: null
      },
      // 3. Diego Fuentes (Best Man · 2 pases)
      {
        id: 'g_diego',
        name: 'Diego Fuentes',
        contactName: 'Diego Fuentes',
        familyKey: '',
        passes: 2,
        confirmedPasses: 2,
        phone: '+525533221100',
        email: 'diego.fuentes@example.com',
        role: 'court',
        roleLabel: 'Best Man · Corte',
        vip: true,
        court: true,
        tableId: 'tbl_1',
        status: 'CONFIRMED',
        diet: 'none',
        notes: 'Padrino de brindis',
        sentAt: '2026-08-25T10:20:00Z',
        respondedAt: '2026-08-25T17:00:00Z',
        reminderSentAt: null
      },
      // 4. Dr. Carlos Valenzuela (2 pases)
      {
        id: 'g_valenzuela',
        name: 'Dr. Carlos & Sofía Valenzuela',
        contactName: 'Carlos Valenzuela',
        familyKey: 'valenzuela',
        passes: 2,
        confirmedPasses: 0,
        phone: '+525544332211',
        email: 'dr.valenzuela@example.com',
        role: 'vip',
        roleLabel: 'Invitado Especial',
        vip: true,
        court: false,
        tableId: 'tbl_2',
        status: 'DRAFT',
        diet: 'none',
        notes: '',
        sentAt: null,
        respondedAt: null,
        reminderSentAt: null
      },
      // 5. Renata Vega (Dama de Honor · 2 pases)
      {
        id: 'g_renata',
        name: 'Renata Vega',
        contactName: 'Renata Vega',
        familyKey: '',
        passes: 2,
        confirmedPasses: 2,
        phone: '+525577889900',
        email: 'renata.vega@example.com',
        role: 'court',
        roleLabel: 'Dama de Honor',
        vip: true,
        court: true,
        tableId: 'tbl_1',
        status: 'CONFIRMED',
        diet: 'celiac',
        notes: 'Restricción celíaca estricta',
        sentAt: '2026-08-25T11:00:00Z',
        respondedAt: '2026-08-25T15:20:00Z',
        reminderSentAt: null
      },
      // 6. Fernando Martínez Ruiz (2 pases)
      {
        id: 'g_fernando',
        name: 'Fernando Martínez Ruiz',
        contactName: 'Fernando Martínez',
        familyKey: '',
        passes: 2,
        confirmedPasses: 0,
        phone: '+525566778899',
        email: 'fernando.m@example.com',
        role: 'friends',
        roleLabel: 'Amigos',
        vip: false,
        court: false,
        tableId: 'tbl_3',
        status: 'SENT',
        diet: 'none',
        notes: '',
        sentAt: '2026-08-25T14:35:00Z',
        respondedAt: null,
        reminderSentAt: null
      }
    ];
  }

  // ==========================================
  // PASO 1: DIMENSIONAMIENTO & MESAS
  // ==========================================
  setDimensioning(contemplatedGuests, capacityPerTable) {
    const guests = Math.max(1, parseInt(contemplatedGuests, 10) || 120);
    const capacity = [8, 10, 12].includes(Number(capacityPerTable)) ? Number(capacityPerTable) : 8;
    const requiredTables = Math.ceil(guests / capacity);

    this.state.config.contemplatedGuests = guests;
    this.state.config.capacityPerTable = capacity;
    this.state.config.totalTables = requiredTables;

    this.state.tables = this.generateInitialTables(requiredTables, capacity);
    this.saveState();

    return {
      contemplatedGuests: guests,
      capacityPerTable: capacity,
      requiredTables: requiredTables,
      totalCapacity: requiredTables * capacity,
      marginSeats: (requiredTables * capacity) - guests
    };
  }

  // ==========================================
  // PASO 2: GESTIÓN DE INVITADOS
  // ==========================================
  addGuest(guestData) {
    const newGuest = Object.assign({
      id: 'g_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      name: 'Invitado Nuevo',
      contactName: '',
      familyKey: '',
      passes: 2,
      confirmedPasses: 0,
      phone: '',
      email: '',
      role: 'general',
      roleLabel: 'Invitado General',
      vip: false,
      court: false,
      tableId: null,
      status: 'DRAFT',
      diet: 'none',
      notes: '',
      sentAt: null,
      respondedAt: null,
      reminderSentAt: null
    }, guestData);

    this.state.guests.push(newGuest);
    this.saveState();
    return newGuest;
  }

  updateGuest(id, updateData) {
    const guest = this.state.guests.find(g => g.id === id);
    if (!guest) return null;

    Object.assign(guest, updateData);
    this.saveState();
    return guest;
  }

  deleteGuest(id) {
    const index = this.state.guests.findIndex(g => g.id === id);
    if (index !== -1) {
      this.state.guests.splice(index, 1);
      this.saveState();
      return true;
    }
    return false;
  }

  // ==========================================
  // PASO 3: AUTO-DISTRIBUCIÓN DE MESAS
  // ==========================================
  autoDistributeGuests() {
    const capacity = this.state.config.capacityPerTable || 8;
    
    // Limpiar mesas
    this.state.guests.forEach(g => g.tableId = null);

    // 1. Asignar VIPs y Corte a Mesa 1 (Imperial)
    const imperialTable = this.state.tables[0];
    const courtVips = this.state.guests.filter(g => g.court || g.vip);
    
    if (imperialTable) {
      let currentCount = 0;
      courtVips.forEach(g => {
        if (currentCount + g.passes <= imperialTable.capacity) {
          g.tableId = imperialTable.id;
          currentCount += g.passes;
        }
      });
    }

    // 2. Asignar Familias y Grupos
    const unassigned = this.state.guests.filter(g => !g.tableId);
    
    unassigned.forEach(g => {
      // Buscar mesa con cupo
      let table = this.state.tables.find(tbl => {
        const assignedInTable = this.state.guests
          .filter(x => x.tableId === tbl.id)
          .reduce((sum, x) => sum + x.passes, 0);
        return (assignedInTable + g.passes) <= tbl.capacity;
      });

      if (!table) {
        // Si no hay mesa suficiente, crear nueva
        const newNum = this.state.tables.length + 1;
        table = {
          id: `tbl_${newNum}`,
          number: String(newNum),
          name: `Mesa ${newNum}`,
          subtitle: 'Banquete',
          type: 'circular',
          capacity: capacity
        };
        this.state.tables.push(table);
      }

      g.tableId = table.id;
    });

    this.saveState();
    return this.getDistributionSummary();
  }

  getDistributionSummary() {
    const totalPasses = this.state.guests.reduce((sum, g) => sum + g.passes, 0);
    const assignedPasses = this.state.guests.filter(g => g.tableId).reduce((sum, g) => sum + g.passes, 0);
    const totalCapacity = this.state.tables.reduce((sum, t) => sum + t.capacity, 0);

    return {
      totalGuestsCount: this.state.guests.length,
      totalPasses: totalPasses,
      assignedPasses: assignedPasses,
      unassignedPasses: totalPasses - assignedPasses,
      totalTables: this.state.tables.length,
      totalCapacity: totalCapacity,
      margin: totalCapacity - totalPasses
    };
  }

  // ==========================================
  // PASO 4: GENERADOR DE MENSAJES & LINKS
  // ==========================================
  getPersonalizedUrl(guest) {
    const base = this.options.eventDetails.baseUrl.replace(/\/+$/, '');
    const cleanId = encodeURIComponent(guest.id.replace(/^g_/, ''));
    return `${base}/scroll-rsvp-module/index.html?guest=${cleanId}`;
  }

  getWhatsAppLink(guest) {
    const url = this.getPersonalizedUrl(guest);
    const couple = this.options.eventDetails.coupleName;
    const date = this.options.eventDetails.eventDate;
    const passes = guest.passes;

    const message = `✨ *Invitación Especial de Boda — ${couple}* ✨\n\n` +
      `Estimad@ *${guest.name}*:\n` +
      `Nos llena de alegría invitarte a celebrar nuestra boda este *${date}*.\n\n` +
      `🎟️ Hemos reservado con mucho cariño *${passes} ${passes === 1 ? 'pase' : 'pases'}* para ti.\n\n` +
      `📲 Por favor confirma tu asistencia y consulta los detalles de la recepción en tu pase digital interactivo:\n` +
      `${url}\n\n` +
      `¡Esperamos contar con tu valiosa presencia!`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = (guest.phone || '').replace(/[^0-9]/g, '');
    
    return cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
  }

  getReminderWhatsAppLink(guest) {
    const url = this.getPersonalizedUrl(guest);
    const couple = this.options.eventDetails.coupleName;
    const deadline = this.options.eventDetails.rsvpDeadline;

    const message = `🔔 *Recordatorio de Asistencia — Boda ${couple}* 🔔\n\n` +
      `Hola *${guest.name}*:\n` +
      `Esperamos que te encuentres muy bien. Te recordamos que la fecha límite para confirmar tu asistencia es el *${deadline}*.\n\n` +
      `🎟️ Tienes *${guest.passes} ${guest.passes === 1 ? 'pase reservado' : 'pases reservados'}*.\n\n` +
      `👉 Confirma en 1 clic aquí:\n${url}\n\n` +
      `¡Un abrazo grande!`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = (guest.phone || '').replace(/[^0-9]/g, '');
    
    return cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
  }

  getEmailLink(guest) {
    const url = this.getPersonalizedUrl(guest);
    const couple = this.options.eventDetails.coupleName;
    const date = this.options.eventDetails.eventDate;
    
    const subject = encodeURIComponent(`Invitación Especial de Boda: ${couple}`);
    const body = encodeURIComponent(
      `Estimad@ ${guest.name},\n\n` +
      `Nos complace invitarte a celebrar el inicio de nuestra vida juntos este ${date}.\n\n` +
      `Tienes ${guest.passes} pases asignados. Puedes ver los horarios, mapas y confirmar asistencia en tu enlace personalizado:\n` +
      `${url}\n\n` +
      `Con afecto,\n${couple}`
    );

    return `mailto:${guest.email || ''}?subject=${subject}&body=${body}`;
  }

  markAsSent(id) {
    const g = this.updateGuest(id, {
      status: 'SENT',
      sentAt: new Date().toISOString()
    });
    return g;
  }

  markReminderSent(id) {
    const g = this.updateGuest(id, {
      reminderSentAt: new Date().toISOString()
    });
    return g;
  }

  recordRsvpResponse(id, { confirmed, confirmedPasses, diet, notes }) {
    const g = this.updateGuest(id, {
      status: confirmed ? 'CONFIRMED' : 'DECLINED',
      confirmedPasses: confirmed ? Math.min(this.getGuest(id)?.passes || 1, confirmedPasses) : 0,
      diet: diet || 'none',
      notes: notes || '',
      respondedAt: new Date().toISOString()
    });
    return g;
  }

  getGuest(id) {
    return this.state.guests.find(g => g.id === id);
  }

  getMetrics() {
    const total = this.state.guests.length;
    const totalPasses = this.state.guests.reduce((s, g) => s + g.passes, 0);
    
    const sent = this.state.guests.filter(g => g.status === 'SENT' || g.status === 'CONFIRMED' || g.status === 'DECLINED').length;
    const confirmedList = this.state.guests.filter(g => g.status === 'CONFIRMED');
    const confirmedCount = confirmedList.length;
    const confirmedPasses = confirmedList.reduce((s, g) => s + (g.confirmedPasses || g.passes), 0);
    
    const declinedList = this.state.guests.filter(g => g.status === 'DECLINED');
    const declinedCount = declinedList.length;
    const declinedPasses = declinedList.reduce((s, g) => s + g.passes, 0);

    const pendingCount = this.state.guests.filter(g => g.status === 'SENT' || g.status === 'DRAFT').length;

    return {
      totalGuests: total,
      totalPasses: totalPasses,
      sentCount: sent,
      confirmedCount: confirmedCount,
      confirmedPasses: confirmedPasses,
      declinedCount: declinedCount,
      declinedPasses: declinedPasses,
      pendingCount: pendingCount,
      confirmedPercent: totalPasses > 0 ? ((confirmedPasses / totalPasses) * 100).toFixed(1) : 0
    };
  }

  exportDataJson() {
    return JSON.stringify(this.state, null, 2);
  }

  importDataJson(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.guests && parsed.tables) {
        this.state = parsed;
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error('JSON import error', e);
    }
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GuestManager;
} else if (typeof window !== 'undefined') {
  window.GuestManager = GuestManager;
}
