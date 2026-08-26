/**
 * ============================================================================
 * SeatingPlanner — Módulo Reactivo de Asignación de Mesas & Drag and Drop
 * Entorno Antigravity · Invitta Studio
 * ============================================================================
 * Manejo de estado reactivo, contenedores auto-escalables sin bloqueos,
 * detección inteligente de bloques familiares y alertas sutiles de sobrecupo (#A38047).
 */

class SeatingPlanner {
  /**
   * @param {Object} options - Configuración inicial de mesas e invitados
   */
  constructor(options = {}) {
    this.options = Object.assign({
      containerSelector: '#seatingApp',
      unassignedListSelector: '#unassignedList',
      tablesGridSelector: '#tablesGrid',
      statsSelector: '#seatingStats',
      overCapacityColor: '#A38047',
      onStateChange: null
    }, options);

    // Estado centralizado en memoria
    this.state = {
      guests: options.initialGuests || this.getDefaultGuests(),
      tables: options.initialTables || this.getDefaultTables(),
      draggedItem: null
    };

    this.init();
  }

  getDefaultGuests() {
    return [
      { id: 'g_1', name: 'Elena de Martínez', pases: 1, tableId: null, vip: false, diet: 'none' },
      { id: 'g_2', name: 'Roberto Martínez', pases: 1, tableId: null, vip: false, diet: 'none' },
      { id: 'g_3', name: 'Valeria Martínez', pases: 1, tableId: null, vip: false, diet: 'vegetarian' },
      
      { id: 'g_4', name: 'Sofía de Valenzuela', pases: 1, tableId: null, vip: false, diet: 'none' },
      { id: 'g_5', name: 'Dr. Carlos Valenzuela', pases: 1, tableId: null, vip: false, diet: 'none' },

      { id: 'g_6', name: 'Camila Ortiz', pases: 2, tableId: null, vip: true, court: true, diet: 'none' },
      { id: 'g_7', name: 'Diego Fuentes', pases: 2, tableId: null, vip: true, court: true, diet: 'none' },
      { id: 'g_8', name: 'Renata Vega', pases: 1, tableId: null, vip: true, court: true, diet: 'gluten_free' },
      
      { id: 'g_9', name: 'Mauricio Garza', pases: 2, tableId: null, vip: false, diet: 'none' },
      { id: 'g_10', name: 'Lucía Fernández', pases: 1, tableId: null, vip: false, diet: 'vegan' },
      { id: 'g_11', name: 'Ing. Fernando Gómez', pases: 2, tableId: null, vip: false, diet: 'none' },
      { id: 'g_12', name: 'Mariana Ruiz', pases: 2, tableId: null, vip: false, diet: 'none' }
    ];
  }

  getDefaultTables() {
    return [
      { id: 'tbl_1', number: 1, name: 'Mesa de Honor (Novios & Corte)', capacity: 8, assignedGuestIds: [] },
      { id: 'tbl_2', number: 2, name: 'Familia Principal', capacity: 6, assignedGuestIds: [] },
      { id: 'tbl_3', number: 3, name: 'Amigos & Universitarios', capacity: 8, assignedGuestIds: [] },
      { id: 'tbl_4', number: 4, name: 'Familia Foránea', capacity: 6, assignedGuestIds: [] }
    ];
  }

  init() {
    if (typeof document === 'undefined') return;
    this.render();
  }

  normalizeText(text) {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  extractFamilyKey(fullName) {
    let clean = this.normalizeText(fullName);
    clean = clean.replace(/\b(dr|dra|ing|lic|arq|prof|profa|sr|sra|srta)\.?\s+/g, '');
    
    const deMatch = clean.match(/\bde\s+(la\s+|los\s+|las\s+|del\s+)?([a-z]+)/);
    if (deMatch && deMatch[2]) {
      return deMatch[2];
    }

    const parts = clean.split(/\s+/).filter(p => !['de', 'del', 'la', 'las', 'los', 'y', 'e'].includes(p));
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    }

    return clean;
  }

  getGroupedUnassignedGuests() {
    const unassigned = this.state.guests.filter(g => !g.tableId);
    const groupsMap = new Map();

    unassigned.forEach(guest => {
      const familyKey = this.extractFamilyKey(guest.name);
      if (!groupsMap.has(familyKey)) {
        groupsMap.set(familyKey, []);
      }
      groupsMap.get(familyKey).push(guest);
    });

    const items = [];

    groupsMap.forEach((members, key) => {
      if (members.length >= 2) {
        const rawSurname = members[0].name.split(/\s+/).pop();
        const familyTitle = `Familia ${rawSurname.charAt(0).toUpperCase() + rawSurname.slice(1)}`;
        
        items.push({
          type: 'family',
          familyKey: key,
          title: familyTitle,
          members: members,
          totalPases: members.reduce((acc, m) => acc + (m.pases || 1), 0)
        });
      } else {
        items.push({
          type: 'single',
          guest: members[0]
        });
      }
    });

    return items;
  }

  assignGuestToTable(guestId, targetTableId) {
    const guest = this.state.guests.find(g => g.id === guestId);
    if (!guest) return;

    guest.tableId = targetTableId;
    this.updateStateAndDOM(targetTableId);
  }

  assignFamilyGroupToTable(familyMembers, targetTableId) {
    if (!Array.isArray(familyMembers)) return;
    
    familyMembers.forEach(member => {
      const guest = this.state.guests.find(g => g.id === member.id);
      if (guest) {
        guest.tableId = targetTableId;
      }
    });

    this.updateStateAndDOM(targetTableId);
  }

  unassignGuest(guestId) {
    const guest = this.state.guests.find(g => g.id === guestId);
    if (!guest) return;

    const previousTableId = guest.tableId;
    guest.tableId = null;
    this.updateStateAndDOM(previousTableId);
  }

  updateStateAndDOM(affectedTableId = null) {
    if (typeof document !== 'undefined') {
      this.renderUnassignedList();
      this.renderTables(affectedTableId);
      this.renderStats();
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('seating:updated', { detail: { state: this.state } }));
    }

    if (typeof this.options.onStateChange === 'function') {
      this.options.onStateChange(this.state);
    }
  }

  render() {
    if (typeof document === 'undefined') return;
    this.renderUnassignedList();
    this.renderTables();
    this.renderStats();
    this.bindGlobalEvents();
  }

  renderUnassignedList() {
    if (typeof document === 'undefined') return;
    const container = document.querySelector(this.options.unassignedListSelector);
    if (!container) return;

    const groupedItems = this.getGroupedUnassignedGuests();

    if (groupedItems.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 px-4 text-neutral-400 text-xs">
          <span class="material-symbols-outlined text-3xl mb-2 text-emerald-400 block animate-bounce">check_circle</span>
          <p class="font-medium text-neutral-200">¡Todos los invitados asignados!</p>
          <p class="text-[11px] text-neutral-400 mt-1">Todas las familias tienen su mesa correspondiente.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = groupedItems.map(item => {
      if (item.type === 'family') {
        const membersJson = JSON.stringify(item.members.map(m => m.id)).replace(/"/g, '&quot;');
        return `
          <div class="family-cluster-card p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/40 shadow-sm cursor-grab hover:shadow-md transition-all duration-200 mb-3 select-none relative group ring-1 ring-amber-400/20 hover:ring-amber-400/40"
            draggable="true"
            data-drag-type="family"
            data-family-ids="${membersJson}"
            title="Arrastra esta familia completa a cualquier mesa">
            
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-amber-500/25 text-amber-300 flex items-center justify-center text-xs">
                  <span class="material-symbols-outlined text-sm">groups</span>
                </span>
                <h4 class="text-xs font-semibold text-amber-200 tracking-wide">${item.title}</h4>
              </div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                ${item.members.length} personas · ${item.totalPases} pases
              </span>
            </div>

            <div class="flex flex-wrap gap-1.5 mt-2">
              ${item.members.map(m => `
                <span class="text-[11px] px-2 py-0.5 rounded-md bg-black/40 border border-amber-500/20 text-neutral-300 font-sans-ui flex items-center gap-1">
                  ${m.name}
                  ${m.diet !== 'none' ? `<span class="text-[9px] text-amber-400" title="Dieta: ${m.diet}">🥗</span>` : ''}
                </span>
              `).join('')}
            </div>

            <div class="text-[9.5px] text-amber-400/70 mt-2 text-right flex items-center justify-end gap-1 font-medium">
              <span class="material-symbols-outlined text-xs">drag_indicator</span>
              <span>Arrastrar bloque completo</span>
            </div>
          </div>
        `;
      } else {
        const g = item.guest;
        return `
          <div class="guest-card p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 shadow-sm cursor-grab hover:shadow-md transition-all duration-200 mb-2.5 select-none relative group"
            draggable="true"
            data-drag-type="single"
            data-guest-id="${g.id}">
            
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                ${g.court ? `
                  <span class="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]" title="Corte de Honor">👑</span>
                ` : `
                  <span class="w-5 h-5 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-[10px]">👤</span>
                `}
                <span class="text-xs font-medium text-neutral-200">${g.name}</span>
              </div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                ${g.pases} pase${g.pases > 1 ? 's' : ''}
              </span>
            </div>

            ${g.diet !== 'none' ? `
              <div class="text-[10px] text-amber-300/80 mt-1 flex items-center gap-1">
                <span>🥗 Dieta especial: ${g.diet}</span>
              </div>
            ` : ''}
          </div>
        `;
      }
    }).join('');

    this.bindDragStartEvents(container);
  }

  renderTables() {
    if (typeof document === 'undefined') return;
    const container = document.querySelector(this.options.tablesGridSelector);
    if (!container) return;

    container.innerHTML = this.state.tables.map(table => {
      const assignedGuests = this.state.guests.filter(g => g.tableId === table.id);
      const totalSeatsTaken = assignedGuests.reduce((acc, g) => acc + (g.pases || 1), 0);
      const isOverCapacity = totalSeatsTaken > table.capacity;
      const overCapacityCount = totalSeatsTaken - table.capacity;

      const borderStyle = isOverCapacity 
        ? `border-color: ${this.options.overCapacityColor}; box-shadow: 0 0 25px rgba(163, 128, 71, 0.28), inset 0 0 15px rgba(163, 128, 71, 0.08);` 
        : `border-color: rgba(255, 255, 255, 0.1);`;

      return `
        <div class="table-dropzone relative rounded-2xl p-5 bg-neutral-900/70 backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between"
          style="${borderStyle}"
          data-table-id="${table.id}">
          
          <div>
            <div class="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-500/30 text-amber-300 flex items-center justify-center font-display font-bold text-sm">
                  ${table.number}
                </span>
                <div>
                  <h3 class="text-xs font-semibold text-neutral-100 leading-tight">${table.name}</h3>
                  <span class="text-[10.5px] text-neutral-400">Capacidad sugerida: ${table.capacity} asientos</span>
                </div>
              </div>

              <div class="text-right">
                ${isOverCapacity ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold text-white transition-all animate-pulse"
                    style="background-color: ${this.options.overCapacityColor}; box-shadow: 0 2px 10px rgba(163, 128, 71, 0.4);">
                    <span class="material-symbols-outlined text-xs">info</span>
                    Sobrecupo: ${totalSeatsTaken}/${table.capacity} (+${overCapacityCount})
                  </span>
                ` : `
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono ${
                    totalSeatsTaken === table.capacity 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-neutral-800 text-neutral-300'
                  }">
                    ${totalSeatsTaken}/${table.capacity} asientos
                  </span>
                `}
              </div>
            </div>

            <div class="table-seats-container grid grid-cols-1 sm:grid-cols-2 gap-2 min-h-[140px] p-2 rounded-xl bg-black/25 border border-dashed border-white/10 transition-all duration-300"
              data-drop-target="true"
              data-table-id="${table.id}">
              
              ${assignedGuests.length === 0 ? `
                <div class="col-span-full flex flex-col items-center justify-center text-neutral-400 py-8 pointer-events-none select-none">
                  <span class="material-symbols-outlined text-2xl mb-1 opacity-50">place_item</span>
                  <span class="text-xs">Mesa vacía · Arrastra personas o familias aquí</span>
                </div>
              ` : assignedGuests.map(g => `
                <div class="assigned-guest-pill p-2.5 rounded-lg bg-neutral-800/90 border border-neutral-700 hover:border-amber-500/50 flex items-center justify-between gap-2 shadow-sm transition-all duration-200 group"
                  draggable="true"
                  data-drag-type="single"
                  data-guest-id="${g.id}">
                  
                  <div class="flex items-center gap-1.5 overflow-hidden">
                    <span class="material-symbols-outlined text-xs text-neutral-400 cursor-grab">drag_indicator</span>
                    <span class="text-xs font-medium text-neutral-200 truncate">${g.name}</span>
                  </div>

                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <span class="text-[10px] font-mono text-neutral-400">${g.pases}p</span>
                    <button type="button" class="btn-remove-guest opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-400 transition-opacity p-0.5"
                      data-guest-id="${g.id}" title="Quitar de la mesa">
                      <span class="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                </div>
              `).join('')}

            </div>
          </div>

          <div class="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10.5px] text-neutral-400">
            <span>Ocupación: ${Math.round((totalSeatsTaken / table.capacity) * 100)}%</span>
            <div class="w-28 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500 ${isOverCapacity ? 'bg-[#A38047]' : 'bg-amber-400'}"
                style="width: ${Math.min(100, (totalSeatsTaken / table.capacity) * 100)}%;"></div>
            </div>
          </div>

        </div>
      `;
    }).join('');

    this.bindDropZoneEvents(container);
  }

  renderStats() {
    if (typeof document === 'undefined') return;
    const container = document.querySelector(this.options.statsSelector);
    if (!container) return;

    const totalGuests = this.state.guests.length;
    const assignedGuests = this.state.guests.filter(g => g.tableId).length;
    const unassignedGuests = totalGuests - assignedGuests;
    
    const totalCapacity = this.state.tables.reduce((acc, t) => acc + t.capacity, 0);
    const totalSeatsOccupied = this.state.guests.filter(g => g.tableId).reduce((acc, g) => acc + (g.pases || 1), 0);

    const overCapacityTables = this.state.tables.filter(table => {
      const seats = this.state.guests.filter(g => g.tableId === table.id).reduce((acc, g) => acc + (g.pases || 1), 0);
      return seats > table.capacity;
    }).length;

    container.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div class="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl">
          <span class="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Invitados Asignados</span>
          <span class="text-xl font-bold text-emerald-300 tabular-nums">${assignedGuests} <span class="text-xs text-neutral-400 font-normal">/ ${totalGuests}</span></span>
        </div>

        <div class="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl">
          <span class="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Sin Asignar</span>
          <span class="text-xl font-bold text-amber-300 tabular-nums">${unassignedGuests}</span>
        </div>

        <div class="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl">
          <span class="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Asientos Ocupados</span>
          <span class="text-xl font-bold text-white tabular-nums">${totalSeatsOccupied} <span class="text-xs text-neutral-400 font-normal">/ ${totalCapacity}</span></span>
        </div>

        <div class="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl ${overCapacityTables > 0 ? 'ring-1 ring-[#A38047]' : ''}">
          <span class="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Mesas en Sobrecupo</span>
          <span class="text-xl font-bold ${overCapacityTables > 0 ? 'text-[#A38047]' : 'text-neutral-400'} tabular-nums">${overCapacityTables}</span>
        </div>
      </div>
    `;
  }

  bindDragStartEvents(scopeElement) {
    if (typeof document === 'undefined') return;
    scopeElement.querySelectorAll('[draggable="true"]').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        const type = el.dataset.dragType;
        if (type === 'family') {
          const ids = JSON.parse(el.dataset.familyIds || '[]');
          const members = this.state.guests.filter(g => ids.includes(g.id));
          this.state.draggedItem = { type: 'family', members: members };
          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'family', ids: ids }));
        } else {
          const guestId = el.dataset.guestId;
          const guest = this.state.guests.find(g => g.id === guestId);
          this.state.draggedItem = { type: 'single', guest: guest };
          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'single', id: guestId }));
        }
        
        el.classList.add('opacity-40', 'scale-95');
        e.dataTransfer.effectAllowed = 'move';
      });

      el.addEventListener('dragend', () => {
        el.classList.remove('opacity-40', 'scale-95');
        this.state.draggedItem = null;
        document.querySelectorAll('.table-dropzone').forEach(dz => dz.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-500/10'));
      });
    });
  }

  bindDropZoneEvents(scopeElement) {
    if (typeof document === 'undefined') return;
    scopeElement.querySelectorAll('.table-dropzone').forEach(dropzone => {
      const tableId = dropzone.dataset.tableId;

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dropzone.classList.add('ring-2', 'ring-amber-400', 'bg-amber-500/10');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-500/10');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-500/10');

        try {
          const payload = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (payload.type === 'family') {
            const members = this.state.guests.filter(g => payload.ids.includes(g.id));
            this.assignFamilyGroupToTable(members, tableId);
          } else if (payload.type === 'single') {
            this.assignGuestToTable(payload.id, tableId);
          }
        } catch (err) {
          if (this.state.draggedItem) {
            if (this.state.draggedItem.type === 'family') {
              this.assignFamilyGroupToTable(this.state.draggedItem.members, tableId);
            } else {
              this.assignGuestToTable(this.state.draggedItem.guest.id, tableId);
            }
          }
        }
      });
    });

    scopeElement.querySelectorAll('.btn-remove-guest').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const guestId = btn.dataset.guestId;
        this.unassignGuest(guestId);
      });
    });

    this.bindDragStartEvents(scopeElement);
  }

  bindGlobalEvents() {
    if (typeof document === 'undefined') return;
    const unassignedContainer = document.querySelector(this.options.unassignedListSelector);
    if (!unassignedContainer) return;

    unassignedContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      unassignedContainer.classList.add('ring-2', 'ring-amber-400/50');
    });

    unassignedContainer.addEventListener('dragleave', () => {
      unassignedContainer.classList.remove('ring-2', 'ring-amber-400/50');
    });

    unassignedContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      unassignedContainer.classList.remove('ring-2', 'ring-amber-400/50');
      
      try {
        const payload = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (payload.type === 'single') {
          this.unassignGuest(payload.id);
        } else if (payload.type === 'family') {
          payload.ids.forEach(id => this.unassignGuest(id));
        }
      } catch (err) {}
    });
  }

  addTable(name = 'Nueva Mesa', capacity = 8) {
    const newNumber = this.state.tables.length + 1;
    const newTable = {
      id: 'tbl_' + Date.now(),
      number: newNumber,
      name: name,
      capacity: capacity,
      assignedGuestIds: []
    };
    this.state.tables.push(newTable);
    this.updateStateAndDOM();
    return newTable;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SeatingPlanner;
} else if (typeof window !== 'undefined') {
  window.SeatingPlanner = SeatingPlanner;
}
