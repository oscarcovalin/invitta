/**
 * ============================================================================
 * RsvpManager — Módulo Reactivo de Gestión de RSVP para Invitta Studio (Antigravity)
 * ============================================================================
 * Escucha el formulario web, inyecta los datos dinámicamente en el nodo
 * `rsvpResponses` del JSON de la invitación y actualiza el DOM en tiempo real,
 * priorizando a los integrantes del arreglo `court` (Corte de Honor).
 */

class RsvpManager {
  /**
   * @param {Object} invitationConfig - Estructura JSON de la invitación (Catalina & Julián)
   * @param {Object} options - Configuración de selectores DOM y callbacks
   */
  constructor(invitationConfig, options = {}) {
    this.config = invitationConfig || {};
    
    // 1. Inicializar el nodo rsvpResponses si no existe
    if (!Array.isArray(this.config.rsvpResponses)) {
      this.config.rsvpResponses = [];
    }

    // 2. Opciones de selectores DOM
    this.options = Object.assign({
      formSelector: '#standaloneRsvpForm',
      feedContainerSelector: '#rsvpLiveFeed',
      statsContainerSelector: '#rsvpLiveStats',
      courtAutocompleteSelector: '#courtSuggestions',
      onResponseAdded: null
    }, options);

    this.init();
  }

  /**
   * Inicialización de eventos y renderizado inicial (Seguro para Node y Browser)
   */
  init() {
    if (typeof document !== 'undefined') {
      this.bindForm();
      this.renderStats();
      this.renderFeed();
    }
  }

  /**
   * Normalización para comparación insensible a mayúsculas y acentos
   */
  normalizeText(text) {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Verifica si un nombre pertenece a la Corte de Honor (court array)
   * @param {string} name 
   * @returns {boolean}
   */
  isCourtMember(name) {
    const courtList = this.config.court || [];
    const normalizedInput = this.normalizeText(name);
    if (!normalizedInput) return false;

    return courtList.some(member => {
      const normalizedMember = this.normalizeText(member);
      return normalizedMember === normalizedInput || 
             normalizedInput.includes(normalizedMember) || 
             normalizedMember.includes(normalizedInput);
    });
  }

  /**
   * Obtiene el nombre canónico de la corte si coincide
   */
  getCourtCanonicalName(name) {
    const courtList = this.config.court || [];
    const normalizedInput = this.normalizeText(name);
    const found = courtList.find(member => this.normalizeText(member) === normalizedInput);
    return found || name;
  }

  /**
   * Escucha y vincula el formulario web
   */
  bindForm() {
    if (typeof document === 'undefined') return;
    const form = document.querySelector(this.options.formSelector);
    if (!form) return;

    // Escucha inteligente mientras el usuario escribe para detectar VIP Court
    const nameInput = form.querySelector('#guestName') || form.querySelector('[name="nombre"]');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        const isVIP = this.isCourtMember(e.target.value);
        this.updateFormVipBadge(form, isVIP, e.target.value);
      });
    }

    // Escucha del submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit(form);
    });
  }

  /**
   * Muestra un indicador VIP en el formulario si es miembro de la corte
   */
  updateFormVipBadge(form, isVIP, currentName) {
    if (typeof document === 'undefined') return;
    let vipIndicator = form.querySelector('#courtVipFormBadge');
    if (isVIP) {
      if (!vipIndicator) {
        vipIndicator = document.createElement('div');
        vipIndicator.id = 'courtVipFormBadge';
        vipIndicator.className = 'flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs mt-2';
        const nameGroup = form.querySelector('#guestName')?.parentElement || form.firstElementChild;
        nameGroup.appendChild(vipIndicator);
      }
      vipIndicator.innerHTML = `
        <span class="material-symbols-outlined text-sm text-amber-400">crown</span>
        <span>¡Hola <strong>${this.getCourtCanonicalName(currentName)}</strong>! Eres parte distinguida de la <strong>Corte de Honor</strong>.</span>
      `;
      vipIndicator.style.display = 'flex';
    } else if (vipIndicator) {
      vipIndicator.style.display = 'none';
    }
  }

  /**
   * Procesa la confirmación, la inyecta en el JSON y actualiza la vista
   */
  handleFormSubmit(form) {
    if (typeof document === 'undefined') return;
    const formData = new FormData(form);
    const guestName = (document.getElementById('guestName')?.value || formData.get('nombre') || '').trim();
    const guestPhone = (document.getElementById('guestPhone')?.value || formData.get('telefono') || '').trim();
    const guestDiet = document.getElementById('guestDiet')?.value || formData.get('alergias') || 'none';
    const guestMessage = (document.getElementById('guestMessage')?.value || formData.get('mensaje') || '').trim();
    
    // Obtener pases y asistencia
    const ticketCountEl = document.getElementById('ticketCount');
    const tickets = ticketCountEl ? parseInt(ticketCountEl.textContent, 10) : 1;
    
    const activeRadio = form.querySelector('.radio-card.active') || form.querySelector('input[name="rsvp"]:checked');
    const attendance = (activeRadio?.dataset?.value || activeRadio?.value || 'yes') === 'yes' ? 'CONFIRMADO' : 'DECLINADO';

    if (!guestName) return;

    const isCourt = this.isCourtMember(guestName);
    const canonicalName = isCourt ? this.getCourtCanonicalName(guestName) : guestName;
    const folio = 'PASS-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Estructura de la Respuesta a inyectar en config.rsvpResponses
    const newResponse = {
      id: 'rsvp_' + Date.now(),
      folio: folio,
      timestamp: new Date().toISOString(),
      nombre: canonicalName,
      telefono: guestPhone,
      pasesConfirmados: attendance === 'CONFIRMADO' ? tickets : 0,
      asistencia: attendance,
      restriccionAlimentaria: guestDiet,
      mensaje: guestMessage,
      esCorteDeHonor: isCourt,
      rolCorte: isCourt ? 'Corte de Honor' : 'Invitado General',
      prioridad: isCourt ? 1 : 2
    };

    // 2. Inyección dinámica en el nodo rsvpResponses
    this.config.rsvpResponses.push(newResponse);

    // 3. Ordenar para PRIORIZAR a los integrantes de la corte (prioridad 1 primero, luego por fecha)
    this.sortResponses();

    // 4. Actualizar Estado Visual sin recargar página
    this.renderStats();
    this.renderFeed();

    // 5. Emitir evento personalizado para cualquier otro módulo reactivo
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('rsvp:updated', { detail: { response: newResponse, all: this.config.rsvpResponses } });
      window.dispatchEvent(event);
    }

    if (typeof this.options.onResponseAdded === 'function') {
      this.options.onResponseAdded(newResponse, this.config.rsvpResponses);
    }
  }

  /**
   * Ordena rsvpResponses priorizando integrantes de la Corte de Honor
   */
  sortResponses() {
    this.config.rsvpResponses.sort((a, b) => {
      // 1. Prioridad: Corte de Honor (prioridad 1) antes de Invitados Generales (prioridad 2)
      if (a.prioridad !== b.prioridad) {
        return a.prioridad - b.prioridad;
      }
      // 2. Si ambos tienen la misma prioridad, el más reciente arriba
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }

  /**
   * Renderiza el feed visual de confirmaciones en vivo
   */
  renderFeed() {
    if (typeof document === 'undefined') return;
    const feed = document.querySelector(this.options.feedContainerSelector);
    if (!feed) return;

    if (this.config.rsvpResponses.length === 0) {
      feed.innerHTML = `
        <div class="text-center py-8 text-neutral-400 text-xs font-light">
          <span class="material-symbols-outlined text-2xl mb-1 text-neutral-500 block">inbox</span>
          Aún no hay confirmaciones registradas. Las respuestas aparecerán aquí en tiempo real.
        </div>
      `;
      return;
    }

    feed.innerHTML = this.config.rsvpResponses.map((item, idx) => {
      const isCourt = item.esCorteDeHonor;
      const isConfirmed = item.asistencia === 'CONFIRMADO';
      
      return `
        <div class="relative p-3.5 rounded-xl transition-all duration-300 ${
          isCourt 
            ? 'bg-amber-950/25 border-2 border-amber-500/50 shadow-[0_4px_20px_rgba(217,119,6,0.15)] ring-1 ring-amber-400/30' 
            : 'bg-neutral-900/60 border border-neutral-800'
        } mb-2.5 flex flex-col gap-2">
          
          <!-- Encabezado con Insignia VIP Prioritaria -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              ${isCourt ? `
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-amber-500/25 to-amber-600/35 text-amber-300 border border-amber-400/50 shadow-sm animate-pulse">
                  <span class="material-symbols-outlined text-xs">crown</span>
                  CORTE DE HONOR
                </span>
              ` : `
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                  #${idx + 1}
                </span>
              `}
              <span class="text-[11px] font-mono text-neutral-400">${item.folio}</span>
            </div>

            <!-- Estado de Asistencia -->
            <span class="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full ${
              isConfirmed 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }">
              ${item.asistencia}
            </span>
          </div>

          <!-- Nombre y Pases -->
          <div class="flex items-baseline justify-between gap-2">
            <h4 class="text-sm font-medium ${isCourt ? 'text-amber-200 font-semibold' : 'text-neutral-100'}">
              ${item.nombre}
            </h4>
            ${isConfirmed ? `
              <span class="text-xs text-neutral-300 font-mono">
                ${item.pasesConfirmados} pase${item.pasesConfirmados > 1 ? 's' : ''}
              </span>
            ` : ''}
          </div>

          <!-- Mensaje / Alergias si existen -->
          ${item.mensaje ? `
            <p class="text-xs italic text-neutral-400 bg-black/20 p-2 rounded-lg border border-white/5">
              &ldquo;${item.mensaje}&rdquo;
            </p>
          ` : ''}

          <!-- Hora de registro -->
          <div class="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-white/5">
            <span>${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            ${item.telefono ? `<span>📞 ${item.telefono}</span>` : ''}
          </div>

        </div>
      `;
    }).join('');
  }

  /**
   * Actualiza el panel de estadísticas reactivas
   */
  renderStats() {
    if (typeof document === 'undefined') return;
    const statsEl = document.querySelector(this.options.statsContainerSelector);
    if (!statsEl) return;

    const total = this.config.rsvpResponses.length;
    const confirmedCount = this.config.rsvpResponses.filter(r => r.asistencia === 'CONFIRMADO').length;
    const totalTickets = this.config.rsvpResponses.reduce((acc, r) => acc + (r.pasesConfirmados || 0), 0);
    const courtConfirmed = this.config.rsvpResponses.filter(r => r.esCorteDeHonor && r.asistencia === 'CONFIRMADO').length;
    const totalCourt = (this.config.court || []).length;

    statsEl.innerHTML = `
      <div class="grid grid-cols-2 gap-2 text-center">
        
        <div class="bg-neutral-950/60 border border-neutral-800 p-2.5 rounded-xl">
          <span class="text-[9.5px] uppercase tracking-wider text-neutral-400 block mb-0.5">Total Respuestas</span>
          <span class="text-lg font-bold text-white tabular-nums">${total}</span>
        </div>

        <div class="bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl">
          <span class="text-[9.5px] uppercase tracking-wider text-emerald-400 block mb-0.5">Confirmados</span>
          <span class="text-lg font-bold text-emerald-300 tabular-nums">${confirmedCount}</span>
        </div>

        <div class="bg-amber-950/30 border border-amber-500/40 p-2.5 rounded-xl ring-1 ring-amber-400/20 col-span-2 sm:col-span-1">
          <span class="text-[9.5px] uppercase tracking-wider text-amber-400 block mb-0.5">👑 Corte de Honor</span>
          <span class="text-lg font-bold text-amber-300 tabular-nums">${courtConfirmed} / ${totalCourt}</span>
        </div>

        <div class="bg-neutral-950/60 border border-neutral-800 p-2.5 rounded-xl col-span-2 sm:col-span-1">
          <span class="text-[9.5px] uppercase tracking-wider text-neutral-400 block mb-0.5">Pases Totales</span>
          <span class="text-lg font-bold text-amber-200 tabular-nums">${totalTickets}</span>
        </div>

      </div>
    `;
  }
}

// Exportación modular para Browser o Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RsvpManager;
} else if (typeof window !== 'undefined') {
  window.RsvpManager = RsvpManager;
}
