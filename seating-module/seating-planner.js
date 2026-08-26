/**
 * ============================================================================
 * SeatingPlanner — Motor Reactivo de Asignación de Mesas & Floor Plan
 * Haute-Couture Design System · Invitta Studio (Antigravity)
 * ============================================================================
 */

class SeatingPlanner {
  constructor(options = {}) {
    this.options = Object.assign({
      unassignedListSelector: '#unassignedList',
      tablesContainerSelector: '#tablesContainer',
      statsAssignedCountSelector: '#statAssignedCount',
      statsTotalCountSelector: '#statTotalCount',
      statsUnassignedSelector: '#statUnassignedCount',
      statsProgressBarSelector: '#statProgressBar',
      statsPercentSelector: '#statPercent',
      statsOvercapacityBadgeSelector: '#statOvercapacityBadge',
      searchInputSelector: '#searchGuestsInput',
      overCapacityColor: '#A38047',
      onStateChange: null
    }, options);

    this.searchQuery = '';

    // Estado centralizado en memoria con catálogo ampliado
    this.state = {
      guests: options.initialGuests || this.getDefaultGuests(),
      tables: options.initialTables || this.getDefaultTables(),
      draggedItem: null
    };

    this.init();
  }

  getDefaultGuests() {
    return [
      // Familia Martínez (Bloque de 4)
      { id: 'g_1', name: 'Carlos Martínez', familyKey: 'martinez', familyTitle: 'Familia Martínez', pases: 1, tableId: null, vip: false, diet: 'none', tag: '' },
      { id: 'g_2', name: 'Elena Valdés', familyKey: 'martinez', familyTitle: 'Familia Martínez', pases: 1, tableId: null, vip: false, diet: 'vegetarian', tag: 'Veg' },
      { id: 'g_3', name: 'Sofía M. (Niño)', familyKey: 'martinez', familyTitle: 'Familia Martínez', pases: 1, tableId: null, vip: false, diet: 'kids', tag: 'Silla' },
      { id: 'g_4', name: 'Mateo Martínez (Niño)', familyKey: 'martinez', familyTitle: 'Familia Martínez', pases: 1, tableId: null, vip: false, diet: 'kids', tag: 'Menú Niño' },

      // Hermanos López (Bloque de 2)
      { id: 'g_5', name: 'Andrés López', familyKey: 'lopez', familyTitle: 'Hermanos López', pases: 1, tableId: null, vip: false, diet: 'none', tag: '' },
      { id: 'g_6', name: 'Laura López', familyKey: 'lopez', familyTitle: 'Hermanos López', pases: 1, tableId: null, vip: false, diet: 'gluten_free', tag: 'Sin Gluten' },

      // Familia Valenzuela (Bloque de 3)
      { id: 'g_7', name: 'Dr. Carlos Valenzuela', familyKey: 'valenzuela', familyTitle: 'Familia Valenzuela', pases: 1, tableId: null, vip: false, diet: 'none', tag: '' },
      { id: 'g_8', name: 'Sofía de Valenzuela', familyKey: 'valenzuela', familyTitle: 'Familia Valenzuela', pases: 1, tableId: null, vip: false, diet: 'none', tag: '' },
      { id: 'g_9', name: 'Carlos Jr. Valenzuela', familyKey: 'valenzuela', familyTitle: 'Familia Valenzuela', pases: 1, tableId: null, vip: false, diet: 'none', tag: '' },

      // VIP Singles (Padrinos & Corte de Honor)
      { id: 'g_10', name: 'Sr. Fernando Silva', familyKey: '', familyTitle: '', pases: 1, tableId: null, vip: true, court: false, diet: 'none', tag: 'Padrino de Velación' },
      { id: 'g_11', name: 'Camila Ortiz', familyKey: '', familyTitle: '', pases: 1, tableId: 'tbl_imperial', vip: true, court: true, diet: 'none', tag: 'Dama de Honor' },
      { id: 'g_12', name: 'Diego Fuentes', familyKey: '', familyTitle: '', pases: 1, tableId: 'tbl_imperial', vip: true, court: true, diet: 'none', tag: 'Best Man' },
      { id: 'g_13', name: 'Renata Vega', familyKey: '', familyTitle: '', pases: 1, tableId: null, vip: true, court: true, diet: 'celiac', tag: 'Dama de Honor' },
      { id: 'g_14', name: 'Lucía Fernández', familyKey: '', familyTitle: '', pases: 1, tableId: null, vip: false, court: false, diet: 'vegan', tag: 'Vegana' }
    ];
  }

  getDefaultTables() {
    return [
      {
        id: 'tbl_imperial',
        number: 'I',
        name: 'Mesa Imperial',
        subtitle: 'Novios & Corte de Honor',
        type: 'imperial', // rectangular
        capacity: 10,
        posX: '50%',
        posY: '40px'
      },
      {
        id: 'tbl_1',
        number: '1',
        name: 'Mesa 1',
        subtitle: 'Familia Principal',
        type: 'circular',
        capacity: 8,
        posX: '16%',
        posY: '270px'
      },
      {
        id: 'tbl_2',
        number: '2',
        name: 'Mesa 2',
        subtitle: 'Familia Foránea',
        type: 'circular',
        capacity: 8,
        posX: '72%',
        posY: '270px'
      },
      {
        id: 'tbl_3',
        number: '3',
        name: 'Mesa 3',
        subtitle: 'Amigos & Universitarios',
        type: 'imperial',
        capacity: 10,
        posX: '50%',
        posY: '530px'
      }
    ];
  }

  init() {
    if (typeof document === 'undefined') return;
    this.bindSearch();
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
    if (deMatch && deMatch[2]) return deMatch[2];
    const parts = clean.split(/\s+/).filter(p => !['de', 'del', 'la', 'las', 'los', 'y', 'e'].includes(p));
    return parts.length >= 2 ? parts[parts.length - 1] : clean;
  }

  getGroupedUnassignedGuests() {
    let unassigned = this.state.guests.filter(g => !g.tableId);

    // Filtrar por término de búsqueda si existe
    if (this.searchQuery) {
      const q = this.normalizeText(this.searchQuery);
      unassigned = unassigned.filter(g => 
        this.normalizeText(g.name).includes(q) || 
        this.normalizeText(g.familyTitle).includes(q) ||
        this.normalizeText(g.tag).includes(q)
      );
    }

    const groupsMap = new Map();

    unassigned.forEach(guest => {
      const key = guest.familyKey || this.extractFamilyKey(guest.name);
      if (guest.familyTitle || key) {
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key).push(guest);
      } else {
        if (!groupsMap.has(guest.id)) groupsMap.set(guest.id, [guest]);
      }
    });

    const items = [];
    groupsMap.forEach((members, key) => {
      if (members.length >= 2) {
        const rawSurname = members[0].name.split(/\s+/).pop();
        const title = members[0].familyTitle || `Familia ${rawSurname.charAt(0).toUpperCase() + rawSurname.slice(1)}`;
        items.push({
          type: 'family',
          familyKey: key,
          title: title,
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
    this.updateStateAndDOM();
  }

  assignFamilyGroupToTable(familyMemberIds, targetTableId) {
    if (!Array.isArray(familyMemberIds)) return;
    familyMemberIds.forEach(id => {
      const guest = this.state.guests.find(g => g.id === id);
      if (guest) guest.tableId = targetTableId;
    });
    this.updateStateAndDOM();
  }

  unassignGuest(guestId) {
    const guest = this.state.guests.find(g => g.id === guestId);
    if (!guest) return;
    guest.tableId = null;
    this.updateStateAndDOM();
  }

  updateStateAndDOM() {
    if (typeof document !== 'undefined') {
      this.renderUnassignedList();
      this.renderTables();
      this.renderStats();
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('seating:updated', { detail: { state: this.state } }));
    }

    if (typeof this.options.onStateChange === 'function') {
      this.options.onStateChange(this.state);
    }
  }

  bindSearch() {
    if (typeof document === 'undefined') return;
    const searchInput = document.querySelector(this.options.searchInputSelector);
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderUnassignedList();
    });
  }

  render() {
    if (typeof document === 'undefined') return;
    this.renderUnassignedList();
    this.renderTables();
    this.renderStats();
    this.bindGlobalEvents();
  }

  /**
   * Renderizado de la lista izquierda con el diseño Haute-Couture
   */
  renderUnassignedList() {
    if (typeof document === 'undefined') return;
    const container = document.querySelector(this.options.unassignedListSelector);
    if (!container) return;

    const groupedItems = this.getGroupedUnassignedGuests();

    if (groupedItems.length === 0) {
      container.innerHTML = `
        <div class="text-center py-16 px-4 text-on-surface-variant select-none">
          <span class="material-symbols-outlined text-4xl mb-3 text-secondary block opacity-70">task_alt</span>
          <p class="font-headline-lg-mobile text-primary text-base">Todos Asignados</p>
          <p class="font-label-sm text-warm-grey mt-1">No hay invitados pendientes en este momento.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = groupedItems.map(item => {
      if (item.type === 'family') {
        // BLOQUE FAMILIAR REDISEÑADO
        const memberIdsJson = JSON.stringify(item.members.map(m => m.id)).replace(/"/g, '&quot;');
        return `
          <div class="border border-outline-variant rounded-lg overflow-hidden bg-surface transition-all hover:border-charcoal group mb-5 select-none"
            draggable="true"
            data-drag-type="family"
            data-family-ids="${memberIdsJson}">
            
            <!-- Encabezado Familia Draggable -->
            <div class="bg-surface-container px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-outline-variant">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-on-surface-variant font-light text-[18px]">drag_indicator</span>
                <span class="font-body-lg text-primary font-medium">${item.title}</span>
              </div>
              <span class="bg-surface-container-high text-on-surface font-label-caps px-3 py-1 rounded-lg border border-outline-variant font-semibold">
                ${item.members.length}
              </span>
            </div>

            <!-- Integrantes -->
            <div class="p-3 space-y-2">
              ${item.members.map(m => `
                <div class="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-colors cursor-grab active:cursor-grabbing border border-outline-variant"
                  draggable="true"
                  data-drag-type="single"
                  data-guest-id="${m.id}">
                  
                  <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-on-surface-variant font-light text-[16px]">drag_indicator</span>
                    <span class="font-body-md text-on-surface">${m.name}</span>
                  </div>
                  
                  <div class="flex items-center gap-1.5">
                    ${m.tag ? `
                      <span class="font-label-sm text-warm-grey uppercase tracking-widest px-2 py-0.5 rounded bg-surface-container border border-outline-variant text-[10px]" title="${m.tag}">
                        ${m.tag}
                      </span>
                    ` : ''}
                    <button type="button" class="btn-guest-card-edit p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors text-xs" title="Editar invitado" data-id="${m.id}">
                      <span class="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        // INVITADO INDIVIDUAL (VIP o Regular)
        const g = item.guest;
        const isVip = g.vip || g.court;
        
        if (isVip) {
          return `
            <div class="border border-brushed-champagne rounded-lg overflow-hidden bg-surface transition-all hover:border-charcoal group mb-4 select-none cursor-grab active:cursor-grabbing shadow-sm"
              draggable="true"
              data-drag-type="single"
              data-guest-id="${g.id}">
              
              <div class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-brushed-champagne font-light text-[18px]">drag_indicator</span>
                  <div class="flex flex-col gap-0.5">
                    <span class="font-body-lg text-primary font-medium">${g.name}</span>
                    <span class="font-label-caps text-on-surface-variant text-[10px] tracking-wider">${g.tag || 'Corte de Honor'}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" class="btn-guest-card-edit p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors text-xs" title="Editar invitado" data-id="${g.id}">
                    <span class="material-symbols-outlined text-[15px]">edit</span>
                  </button>
                  <span class="material-symbols-outlined text-brushed-champagne font-light text-[20px]">star</span>
                </div>
              </div>
            </div>
          `;
        }

        return `
          <div class="border border-outline-variant rounded-lg overflow-hidden bg-surface transition-all hover:border-charcoal group mb-3 select-none cursor-grab active:cursor-grabbing"
            draggable="true"
            data-drag-type="single"
            data-guest-id="${g.id}">
            
            <div class="p-3.5 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-on-surface-variant font-light text-[16px]">drag_indicator</span>
                <span class="font-body-md text-on-surface">${g.name}</span>
              </div>
              <div class="flex items-center gap-2">
                ${g.tag ? `
                  <span class="font-label-sm text-warm-grey uppercase tracking-widest text-[10px] px-2 py-0.5 bg-surface-container rounded border border-outline-variant">
                    ${g.tag}
                  </span>
                ` : ''}
                <button type="button" class="btn-guest-card-edit p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors text-xs" title="Editar invitado" data-id="${g.id}">
                  <span class="material-symbols-outlined text-[14px]">edit</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');

    container.querySelectorAll('.btn-guest-card-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (typeof window.openModalGuestEdit === 'function') {
          window.openModalGuestEdit(id);
        } else {
          window.dispatchEvent(new CustomEvent('guest:edit', { detail: { guestId: id } }));
        }
      });
    });

    this.bindDragStartEvents(container);
  }

  /**
   * Renderizado de las mesas interactivas en el Floor Plan
   */
  renderTables() {
    if (typeof document === 'undefined') return;
    const container = document.querySelector(this.options.tablesContainerSelector);
    if (!container) return;

    container.innerHTML = this.state.tables.map(table => {
      const assigned = this.state.guests.filter(g => g.tableId === table.id);
      const count = assigned.length;
      const isOver = count > table.capacity;
      const overCount = count - table.capacity;

      // Estilo de Sobrecupo Elegante (#A38047)
      const overBorderClass = isOver ? 'border-[#A38047] shadow-[0_0_25px_rgba(163,128,71,0.25)] ring-1 ring-[#A38047]' : 'border-outline-variant';
      const isImperial = table.type === 'imperial';

      if (isImperial) {
        // ==================== MESA IMPERIAL (RECTANGULAR) ====================
        const half = Math.ceil(table.capacity / 2);
        const topAssigned = assigned.slice(0, half);
        const botAssigned = assigned.slice(half);

        return `
          <div class="table-card-dropzone relative group mb-14 mx-auto max-w-[560px]"
            data-table-id="${table.id}"
            style="transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
            
            <div class="w-full min-h-[140px] bg-surface-container-lowest rounded-lg border ${overBorderClass} shadow-sm flex flex-col items-center justify-center relative transition-all hover:border-charcoal p-6">
              
              <!-- Asientos Superiores -->
              <div class="absolute -top-4 w-full flex justify-around px-8">
                ${Array.from({ length: half }).map((_, i) => {
                  const guest = topAssigned[i];
                  if (guest) {
                    const initials = guest.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    return `
                      <div class="seat-pill w-8 h-8 rounded-full bg-surface border ${guest.vip || guest.court ? 'border-brushed-champagne text-primary' : 'border-charcoal text-on-surface'} flex items-center justify-center cursor-pointer text-label-sm font-semibold shadow-sm transition-transform hover:scale-110"
                        title="${guest.name} (Clic para quitar)"
                        data-guest-id="${guest.id}">
                        ${initials}
                      </div>
                    `;
                  }
                  return `
                    <div class="w-8 h-8 rounded-full bg-surface-container-low border border-dashed border-outline-variant flex items-center justify-center text-label-sm text-on-surface-variant opacity-60">
                      +
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Asientos Inferiores -->
              <div class="absolute -bottom-4 w-full flex justify-around px-8">
                ${Array.from({ length: half }).map((_, i) => {
                  const guest = botAssigned[i];
                  if (guest) {
                    const initials = guest.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    return `
                      <div class="seat-pill w-8 h-8 rounded-full bg-surface border ${guest.vip || guest.court ? 'border-brushed-champagne text-primary' : 'border-charcoal text-on-surface'} flex items-center justify-center cursor-pointer text-label-sm font-semibold shadow-sm transition-transform hover:scale-110"
                        title="${guest.name} (Clic para quitar)"
                        data-guest-id="${guest.id}">
                        ${initials}
                      </div>
                    `;
                  }
                  return `
                    <div class="w-8 h-8 rounded-full bg-surface-container-low border border-dashed border-outline-variant flex items-center justify-center text-label-sm text-on-surface-variant opacity-60">
                      +
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Contenido de la Mesa -->
              <div class="flex flex-col items-center select-none text-center">
                <span class="font-headline-lg text-primary tracking-widest uppercase">${table.name}</span>
                ${table.subtitle ? `<span class="font-label-caps text-on-surface-variant mt-1 tracking-widest text-[11px]">${table.subtitle}</span>` : ''}
                
                <div class="mt-3 flex items-center gap-4 text-label-caps text-on-surface-variant">
                  <span class="flex items-center gap-1.5 font-mono text-xs ${isOver ? 'text-[#A38047] font-bold' : ''}">
                    <span class="material-symbols-outlined font-light text-[16px]">group</span>
                    ${count} / ${table.capacity} ${isOver ? `(+${overCount} sobrecupo)` : ''}
                  </span>
                  ${table.id === 'tbl_imperial' ? `
                    <span class="flex items-center gap-1 text-brushed-champagne font-semibold">
                      <span class="material-symbols-outlined font-light text-[15px]">star</span> VIP
                    </span>
                  ` : ''}
                </div>
              </div>

              <!-- Dropzone Hover Indicator -->
              <div class="drop-indicator absolute inset-0 flex items-center justify-center bg-surface-container-high/80 rounded-lg opacity-0 pointer-events-none transition-opacity">
                <span class="material-symbols-outlined font-light text-[32px] text-charcoal">add</span>
              </div>

            </div>
          </div>
        `;
      } else {
        // ==================== MESA CIRCULAR ====================
        const seatSlots = Math.max(table.capacity, count);
        const radius = 95; // Radio en px

        return `
          <div class="table-card-dropzone relative group flex justify-center mb-8"
            data-table-id="${table.id}"
            style="transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
            
            <div class="w-60 h-60 rounded-full bg-surface-container-lowest border ${overBorderClass} flex flex-col items-center justify-center relative transition-all hover:border-charcoal shadow-sm">
              
              <!-- Asientos Radiales Circulares -->
              ${Array.from({ length: seatSlots }).map((_, i) => {
                const angle = (i / seatSlots) * 2 * Math.PI - Math.PI / 2;
                const x = Math.round(radius * Math.cos(angle));
                const y = Math.round(radius * Math.sin(angle));
                const guest = assigned[i];

                if (guest) {
                  const initials = guest.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  return `
                    <div class="seat-pill w-8 h-8 rounded-full bg-surface border ${guest.vip || guest.court ? 'border-brushed-champagne text-primary' : 'border-charcoal text-on-surface'} flex items-center justify-center cursor-pointer text-label-sm font-semibold shadow-sm transition-transform hover:scale-110 absolute"
                      style="left: calc(50% + ${x}px - 16px); top: calc(50% + ${y}px - 16px);"
                      title="${guest.name} (Clic para quitar)"
                      data-guest-id="${guest.id}">
                      ${initials}
                    </div>
                  `;
                }

                return `
                  <div class="w-8 h-8 rounded-full bg-surface-container-low border border-dashed border-outline-variant flex items-center justify-center text-label-sm text-on-surface-variant opacity-60 absolute"
                    style="left: calc(50% + ${x}px - 16px); top: calc(50% + ${y}px - 16px);">
                    +
                  </div>
                `;
              }).join('')}

              <!-- Contenido Central Mesa Circular -->
              <div class="flex flex-col items-center select-none text-center px-4">
                <span class="font-headline-lg text-primary tracking-widest">${table.name}</span>
                
                <div class="mt-2 flex items-center gap-1 font-label-caps text-on-surface-variant bg-surface px-3 py-1 rounded-lg border ${isOver ? 'border-[#A38047] text-[#A38047] font-bold' : 'border-outline-variant'}">
                  ${count} / ${table.capacity} ${isOver ? `(+${overCount})` : ''}
                </div>
              </div>

              <!-- Dropzone Hover Indicator -->
              <div class="drop-indicator absolute inset-0 flex items-center justify-center bg-surface-container-high/80 rounded-full opacity-0 pointer-events-none transition-opacity">
                <span class="material-symbols-outlined font-light text-[32px] text-charcoal">add</span>
              </div>

            </div>
          </div>
        `;
      }
    }).join('');

    this.bindDropZoneEvents(container);
  }

  /**
   * Renderizado de la barra de estadísticas superior
   */
  renderStats() {
    if (typeof document === 'undefined') return;

    const totalGuests = this.state.guests.length;
    const assignedCount = this.state.guests.filter(g => g.tableId).length;
    const unassignedCount = totalGuests - assignedCount;
    const percent = totalGuests > 0 ? Math.round((assignedCount / totalGuests) * 100) : 0;

    const overCapacityTables = this.state.tables.filter(table => {
      const seats = this.state.guests.filter(g => g.tableId === table.id).length;
      return seats > table.capacity;
    }).length;

    // Actualizar contadores DOM
    const elAssigned = document.querySelector(this.options.statsAssignedCountSelector);
    if (elAssigned) elAssigned.textContent = assignedCount;

    const elTotal = document.querySelector(this.options.statsTotalCountSelector);
    if (elTotal) elTotal.textContent = `/ ${totalGuests}`;

    const elUnassigned = document.querySelector(this.options.statsUnassignedSelector);
    if (elUnassigned) elUnassigned.textContent = unassignedCount;

    const elProgressBar = document.querySelector(this.options.statsProgressBarSelector);
    if (elProgressBar) elProgressBar.style.width = `${percent}%`;

    const elPercent = document.querySelector(this.options.statsPercentSelector);
    if (elPercent) elPercent.textContent = `${percent}%`;

    const elOvercapacityBadge = document.querySelector(this.options.statsOvercapacityBadgeSelector);
    if (elOvercapacityBadge) {
      if (overCapacityTables > 0) {
        elOvercapacityBadge.innerHTML = `
          <span class="material-symbols-outlined font-light text-[18px] text-[#A38047]">warning</span>
          <span class="font-label-caps text-[#A38047] font-semibold">${overCapacityTables} en Sobrecupo</span>
        `;
        elOvercapacityBadge.className = "flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-[#A38047] border border-[#A38047]/40 rounded-lg";
      } else {
        elOvercapacityBadge.innerHTML = `
          <span class="material-symbols-outlined font-light text-[18px]">info</span>
          <span class="font-label-caps">0 Sobrecupo</span>
        `;
        elOvercapacityBadge.className = "flex items-center gap-2 px-4 py-2 bg-surface-container text-on-surface-variant border border-outline-variant rounded-lg";
      }
    }
  }

  bindDragStartEvents(scopeElement) {
    if (typeof document === 'undefined') return;
    scopeElement.querySelectorAll('[draggable="true"]').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        const type = el.dataset.dragType;
        if (type === 'family') {
          const ids = JSON.parse(el.dataset.familyIds || '[]');
          this.state.draggedItem = { type: 'family', ids: ids };
          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'family', ids: ids }));
        } else {
          const guestId = el.dataset.guestId;
          this.state.draggedItem = { type: 'single', id: guestId };
          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'single', id: guestId }));
        }

        el.classList.add('opacity-40');
        e.dataTransfer.effectAllowed = 'move';
      });

      el.addEventListener('dragend', () => {
        el.classList.remove('opacity-40');
        this.state.draggedItem = null;
        document.querySelectorAll('.drop-indicator').forEach(ind => ind.classList.add('opacity-0'));
      });
    });
  }

  bindDropZoneEvents(scopeElement) {
    if (typeof document === 'undefined') return;

    scopeElement.querySelectorAll('.table-card-dropzone').forEach(dropzone => {
      const tableId = dropzone.dataset.tableId;
      const indicator = dropzone.querySelector('.drop-indicator');

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (indicator) indicator.classList.remove('opacity-0');
      });

      dropzone.addEventListener('dragleave', () => {
        if (indicator) indicator.classList.add('opacity-0');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (indicator) indicator.classList.add('opacity-0');

        try {
          const payload = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (payload.type === 'family') {
            this.assignFamilyGroupToTable(payload.ids, tableId);
          } else if (payload.type === 'single') {
            this.assignGuestToTable(payload.id, tableId);
          }
        } catch (err) {
          if (this.state.draggedItem) {
            if (this.state.draggedItem.type === 'family') {
              this.assignFamilyGroupToTable(this.state.draggedItem.ids, tableId);
            } else {
              this.assignGuestToTable(this.state.draggedItem.id, tableId);
            }
          }
        }
      });
    });

    // Clic en asiento para desasignar
    scopeElement.querySelectorAll('.seat-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const guestId = pill.dataset.guestId;
        this.unassignGuest(guestId);
      });
    });
  }

  bindGlobalEvents() {
    if (typeof document === 'undefined') return;
    const unassignedContainer = document.querySelector(this.options.unassignedListSelector);
    if (!unassignedContainer) return;

    unassignedContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      unassignedContainer.classList.add('ring-2', 'ring-charcoal');
    });

    unassignedContainer.addEventListener('dragleave', () => {
      unassignedContainer.classList.remove('ring-2', 'ring-charcoal');
    });

    unassignedContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      unassignedContainer.classList.remove('ring-2', 'ring-charcoal');
      
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

  addTable(name = 'Mesa Adicional', type = 'circular', capacity = 8) {
    const newNumber = this.state.tables.length + 1;
    const newTable = {
      id: 'tbl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      number: String(newNumber),
      name: `${name} ${newNumber}`,
      subtitle: 'Invitados',
      type: type,
      capacity: capacity
    };
    this.state.tables.push(newTable);
    this.updateStateAndDOM();
    return newTable;
  }

  /**
   * Ajusta la capacidad (8, 10 o 12) en todas las mesas del evento
   */
  setCapacityAcrossTables(capacity = 8) {
    const validCap = [8, 10, 12].includes(Number(capacity)) ? Number(capacity) : 8;
    this.state.tables.forEach(t => {
      t.capacity = validCap;
    });
    this.updateStateAndDOM();
    return validCap;
  }

  /**
   * Ajusta la cantidad total de mesas en el salón
   */
  setTotalTables(targetCount, defaultCapacity = 8) {
    const target = Math.max(1, Number(targetCount) || 1);
    
    // Si faltan mesas, crearlas
    while (this.state.tables.length < target) {
      const newNum = this.state.tables.length + 1;
      this.state.tables.push({
        id: 'tbl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        number: String(newNum),
        name: `Mesa ${newNum}`,
        subtitle: 'Invitados',
        type: newNum % 3 === 0 ? 'imperial' : 'circular',
        capacity: defaultCapacity
      });
    }

    // Si sobran mesas, desasignar invitados y recortar
    if (this.state.tables.length > target) {
      const removedTables = this.state.tables.slice(target);
      const removedIds = new Set(removedTables.map(t => t.id));
      this.state.guests.forEach(g => {
        if (removedIds.has(g.tableId)) {
          g.tableId = null;
        }
      });
      this.state.tables = this.state.tables.slice(0, target);
    }

    this.updateStateAndDOM();
    return this.state.tables.length;
  }

  /**
   * Distribución Automática Inteligente de Invitados
   * Respeta bloques familiares, corte de honor / VIPs y capacidad por mesa (8, 10 o 12)
   */
  autoDistributeGuests(options = {}) {
    const capacity = [8, 10, 12].includes(Number(options.capacity)) ? Number(options.capacity) : 8;
    
    // 1. Unificar capacidades si se solicitó
    this.setCapacityAcrossTables(capacity);

    // 2. Limpiar asignaciones para distribución limpia
    this.state.guests.forEach(g => g.tableId = null);

    // 3. Separar grupos
    const courtOrVips = this.state.guests.filter(g => g.court || g.vip);
    
    const familiesMap = {};
    const singles = [];

    this.state.guests.forEach(g => {
      if (g.court || g.vip) return;
      if (g.familyKey && g.familyKey.trim()) {
        if (!familiesMap[g.familyKey]) {
          familiesMap[g.familyKey] = [];
        }
        familiesMap[g.familyKey].push(g);
      } else {
        singles.push(g);
      }
    });

    const familyGroups = Object.values(familiesMap);

    // 4. Asignar primero VIPs a Mesa Imperial (o Mesa 1)
    const imperialTable = this.state.tables.find(t => t.type === 'imperial') || this.state.tables[0];
    if (imperialTable) {
      courtOrVips.forEach(g => {
        const assignedInImperial = this.state.guests.filter(x => x.tableId === imperialTable.id).length;
        if (assignedInImperial < imperialTable.capacity) {
          g.tableId = imperialTable.id;
        }
      });
    }

    // 5. Asignar Bloques Familiares en mesas completas sin separarlos
    familyGroups.forEach(group => {
      const groupSize = group.length;
      
      let bestTable = this.state.tables.find(tbl => {
        const currentCount = this.state.guests.filter(x => x.tableId === tbl.id).length;
        return (currentCount + groupSize) <= tbl.capacity;
      });

      if (!bestTable) {
        bestTable = this.addTable('Mesa', 'circular', capacity);
      }

      group.forEach(g => {
        g.tableId = bestTable.id;
      });
    });

    // 6. Asignar Invitados Individuales y Restantes
    this.state.guests.forEach(g => {
      if (g.tableId) return;

      let bestTable = this.state.tables.find(tbl => {
        const currentCount = this.state.guests.filter(x => x.tableId === tbl.id).length;
        return currentCount < tbl.capacity;
      });

      if (!bestTable) {
        bestTable = this.addTable('Mesa', 'circular', capacity);
      }

      g.tableId = bestTable.id;
    });

    this.updateStateAndDOM();

    return {
      totalGuests: this.state.guests.length,
      assignedGuests: this.state.guests.filter(g => g.tableId).length,
      totalTables: this.state.tables.length,
      capacityPerTable: capacity,
      totalCapacity: this.state.tables.reduce((acc, t) => acc + t.capacity, 0)
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SeatingPlanner;
} else if (typeof window !== 'undefined') {
  window.SeatingPlanner = SeatingPlanner;
}
