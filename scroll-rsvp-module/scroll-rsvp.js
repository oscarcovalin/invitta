/**
 * ============================================================================
 * ScrollRsvpController — Formulario RSVP en Pergamino Desplegable & Detección URL
 * Entorno Antigravity · Invitta Studio
 * ============================================================================
 * Detecta automáticamente parámetros URL (?guest=id), precarga pases asignados
 * en modo personalizado o habilita registro abierto, con animación de pergamino.
 */

class ScrollRsvpController {
  /**
   * @param {Object} options - Configuración de selectores y registro de invitados
   */
  constructor(options = {}) {
    this.options = Object.assign({
      containerSelector: '#parchmentScrollWrapper',
      formSelector: '#scrollRsvpForm',
      unfurlTriggerSelector: '#btnWaxSeal',
      guestRegistry: options.guestRegistry || this.getDefaultRegistry(),
      defaultMaxPasses: 4,
      onConfirm: null
    }, options);

    this.currentGuest = null;
    this.mode = 'open'; // 'personalized' | 'open'
    this.selectedPasses = 1;
    this.attendance = 'yes';
    this.isUnfurled = false;

    this.init();
  }

  getDefaultRegistry() {
    return {
      'camila_ortiz': {
        id: 'camila_ortiz',
        nombre: 'Camila Ortiz',
        titulo: 'Estimada Camila Ortiz',
        rol: 'Dama de Honor · Corte de Honor',
        pasesMax: 2,
        pasesDefault: 2,
        isVip: true,
        isCourt: true,
        telefono: '+52 55 9876 5432'
      },
      'familia_martinez': {
        id: 'familia_martinez',
        nombre: 'Familia Martínez Valdés',
        titulo: 'Apreciable Familia Martínez Valdés',
        rol: 'Familia de Honor',
        pasesMax: 4,
        pasesDefault: 4,
        isVip: true,
        isCourt: false,
        telefono: '+52 55 1234 5678'
      },
      'dr_valenzuela': {
        id: 'dr_valenzuela',
        nombre: 'Dr. Carlos & Sra. Sofía Valenzuela',
        titulo: 'Distinguidos Dr. Carlos & Sra. Sofía',
        rol: 'Invitados Especiales',
        pasesMax: 2,
        pasesDefault: 2,
        isVip: false,
        isCourt: false,
        telefono: '+52 55 4433 2211'
      },
      'diego_fuentes': {
        id: 'diego_fuentes',
        nombre: 'Diego Fuentes',
        titulo: 'Estimado Diego Fuentes',
        rol: 'Best Man · Corte de Honor',
        pasesMax: 2,
        pasesDefault: 2,
        isVip: true,
        isCourt: true,
        telefono: '+52 55 3322 1100'
      }
    };
  }

  init() {
    if (typeof document === 'undefined') return;

    this.detectGuestFromUrl();
    this.bindEvents();
  }

  /**
   * Detecta automáticamente si existe ?guest=id o ?g=id en la URL
   */
  detectGuestFromUrl(forcedParam = null) {
    let guestKey = forcedParam;

    if (!guestKey && typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      guestKey = urlParams.get('guest') || urlParams.get('g') || urlParams.get('id');
    }

    if (guestKey) {
      const cleanKey = String(guestKey).toLowerCase().trim();
      const registry = this.options.guestRegistry;

      // 1. Coincidencia exacta por ID
      if (registry[cleanKey]) {
        this.setPersonalizedMode(registry[cleanKey]);
        return registry[cleanKey];
      }

      // 2. Coincidencia por nombre o clave normalizada
      const found = Object.values(registry).find(g => 
        g.id.toLowerCase() === cleanKey || 
        g.nombre.toLowerCase().includes(cleanKey) ||
        cleanKey.includes(g.id.toLowerCase())
      );

      if (found) {
        this.setPersonalizedMode(found);
        return found;
      }

      // 3. Parámetro de nombre libre en URL (ej. ?guest=Juan%20Perez)
      const dynamicGuest = {
        id: 'dynamic_' + cleanKey,
        nombre: decodeURIComponent(guestKey),
        titulo: `Apreciable ${decodeURIComponent(guestKey)}`,
        rol: 'Invitado',
        pasesMax: 2,
        pasesDefault: 2,
        isVip: false,
        isCourt: false
      };
      this.setPersonalizedMode(dynamicGuest);
      return dynamicGuest;
    }

    // Modo Abierto: Sin parámetro URL
    this.setOpenMode();
    return null;
  }

  /**
   * Configura el formulario para Invitado Precargado Personalizado
   */
  setPersonalizedMode(guest) {
    this.mode = 'personalized';
    this.currentGuest = guest;
    this.selectedPasses = guest.pasesDefault || guest.pasesMax || 1;

    this.renderPersonalizedView();
  }

  /**
   * Configura el formulario para Registro Abierto Manual
   */
  setOpenMode() {
    this.mode = 'open';
    this.currentGuest = null;
    this.selectedPasses = 1;

    this.renderOpenView();
  }

  renderPersonalizedView() {
    if (typeof document === 'undefined') return;
    const g = this.currentGuest;
    if (!g) return;

    // 1. Banner VIP de Bienvenida en Pergamino
    const personalizedBanner = document.getElementById('personalizedGuestBanner');
    const openNameBlock = document.getElementById('openNameBlock');
    const maxPassesLabel = document.getElementById('maxPassesLabel');
    const passesCountEl = document.getElementById('scrollPassesCount');

    if (personalizedBanner) {
      personalizedBanner.classList.remove('hidden');
      personalizedBanner.innerHTML = `
        <div class="flex items-start justify-between gap-3 p-4 rounded-xl bg-amber-950/10 border border-[#A38047]/40 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-full bg-[#163C2B] text-[#A38047] flex items-center justify-center text-lg flex-shrink-0 border border-[#A38047]/40 shadow-md">
              <span class="material-symbols-outlined text-xl">${g.isCourt ? 'crown' : 'verified'}</span>
            </span>
            <div>
              <span class="font-sans text-[10px] uppercase tracking-[0.25em] text-[#A38047] font-semibold block">${g.rol || 'Pases Reservados'}</span>
              <h3 class="font-['Cinzel'] text-base font-semibold text-[#163C2B] leading-tight">${g.titulo || g.nombre}</h3>
            </div>
          </div>
          <span class="text-[10.5px] font-mono px-2.5 py-1 rounded-full bg-[#163C2B] text-[#FAF8F5] font-semibold flex-shrink-0">
            ${g.pasesMax} pases asignados
          </span>
        </div>
      `;
    }

    if (openNameBlock) openNameBlock.classList.add('hidden');
    if (maxPassesLabel) maxPassesLabel.textContent = `Límite asignado: ${g.pasesMax} persona(s)`;
    if (passesCountEl) passesCountEl.textContent = this.selectedPasses;
  }

  renderOpenView() {
    if (typeof document === 'undefined') return;
    const personalizedBanner = document.getElementById('personalizedGuestBanner');
    const openNameBlock = document.getElementById('openNameBlock');
    const maxPassesLabel = document.getElementById('maxPassesLabel');
    const passesCountEl = document.getElementById('scrollPassesCount');

    if (personalizedBanner) personalizedBanner.classList.add('hidden');
    if (openNameBlock) openNameBlock.classList.remove('hidden');
    if (maxPassesLabel) maxPassesLabel.textContent = `Límite general: ${this.options.defaultMaxPasses} persona(s)`;
    if (passesCountEl) passesCountEl.textContent = this.selectedPasses;
  }

  /**
   * Despliega el pergamino con animación fluida
   */
  unfurlParchment() {
    if (typeof document === 'undefined') return;
    const sealWrap = document.getElementById('waxSealWrapper');
    const parchmentBody = document.getElementById('parchmentBody');
    const bottomRoller = document.getElementById('parchmentBottomRoller');

    if (sealWrap) {
      sealWrap.style.transform = 'scale(0.85)';
      sealWrap.style.opacity = '0';
      setTimeout(() => sealWrap.style.display = 'none', 300);
    }

    if (parchmentBody) {
      parchmentBody.style.maxHeight = '1800px';
      parchmentBody.style.opacity = '1';
      parchmentBody.style.transform = 'scaleY(1)';
    }

    if (bottomRoller) {
      bottomRoller.style.transform = 'translateY(0)';
      bottomRoller.style.opacity = '1';
    }

    this.isUnfurled = true;
  }

  bindEvents() {
    if (typeof document === 'undefined') return;

    // Sello de cera desplegable
    const btnSeal = document.getElementById('btnWaxSeal');
    if (btnSeal) {
      btnSeal.addEventListener('click', () => this.unfurlParchment());
    }

    // Stepper de Pases (+ / -)
    const btnInc = document.getElementById('btnIncPasses');
    const btnDec = document.getElementById('btnDecPasses');
    const passesCountEl = document.getElementById('scrollPassesCount');

    if (btnInc) {
      btnInc.addEventListener('click', () => {
        const max = this.mode === 'personalized' && this.currentGuest 
          ? this.currentGuest.pasesMax 
          : this.options.defaultMaxPasses;

        if (this.selectedPasses < max) {
          this.selectedPasses++;
          if (passesCountEl) passesCountEl.textContent = this.selectedPasses;
        }
      });
    }

    if (btnDec) {
      btnDec.addEventListener('click', () => {
        if (this.selectedPasses > 1) {
          this.selectedPasses--;
          if (passesCountEl) passesCountEl.textContent = this.selectedPasses;
        }
      });
    }

    // Selector de Asistencia (Cards táctiles)
    document.querySelectorAll('.attendance-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.attendance-card').forEach(c => {
          c.classList.remove('active', 'border-[#A38047]', 'bg-[#163C2B]/10');
          c.classList.add('border-[#A38047]/30', 'bg-black/5');
          c.querySelector('.radio-indicator').classList.add('hidden');
        });

        card.classList.add('active', 'border-[#A38047]', 'bg-[#163C2B]/10');
        card.classList.remove('border-[#A38047]/30', 'bg-black/5');
        card.querySelector('.radio-indicator').classList.remove('hidden');

        this.attendance = card.dataset.value;
        const passesBlock = document.getElementById('scrollPassesBlock');
        const dietBlock = document.getElementById('scrollDietBlock');

        if (this.attendance === 'no') {
          if (passesBlock) passesBlock.style.display = 'none';
          if (dietBlock) dietBlock.style.display = 'none';
          document.getElementById('btnSubmitScrollRsvp').textContent = 'Enviar Aviso (No podré asistir)';
        } else {
          if (passesBlock) passesBlock.style.display = 'flex';
          if (dietBlock) dietBlock.style.display = 'block';
          document.getElementById('btnSubmitScrollRsvp').textContent = 'Confirmar Asistencia en Pergamino';
        }
      });
    });

    // Envío del Formulario
    const form = document.querySelector(this.options.formSelector);
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit(form);
      });
    }
  }

  handleSubmit(form) {
    if (typeof document === 'undefined') return;

    let guestName = '';
    if (this.mode === 'personalized' && this.currentGuest) {
      guestName = this.currentGuest.nombre;
    } else {
      guestName = (document.getElementById('openGuestNameInput')?.value || '').trim();
    }

    if (!guestName) {
      alert('Por favor ingresa tu nombre completo.');
      return;
    }

    const phone = (document.getElementById('scrollGuestPhone')?.value || '').trim();
    const diet = document.getElementById('scrollGuestDiet')?.value || 'none';
    const message = (document.getElementById('scrollGuestMessage')?.value || '').trim();
    const confirmedPasses = this.attendance === 'yes' ? this.selectedPasses : 0;
    const folio = this.generateLogisticalFolio(guestName, confirmedPasses || this.selectedPasses);

    const responsePayload = {
      folio: folio,
      timestamp: new Date().toISOString(),
      nombre: guestName,
      telefono: phone,
      asistencia: this.attendance === 'yes' ? 'CONFIRMADO' : 'DECLINADO',
      pases: confirmedPasses,
      dieta: diet,
      mensaje: message,
      modo: this.mode
    };

    // Renderizar Estado de Éxito y Pase de Acceso
    this.renderSuccessPass(responsePayload);

    if (typeof this.options.onConfirm === 'function') {
      this.options.onConfirm(responsePayload);
    }
  }

  renderSuccessPass(payload) {
    if (typeof document === 'undefined') return;

    const formWrap = document.getElementById('scrollFormContent');
    const successWrap = document.getElementById('scrollSuccessView');
    
    if (formWrap) formWrap.classList.add('hidden');
    if (successWrap) {
      successWrap.classList.remove('hidden');
      
      const folioEl = document.getElementById('passFolioCode');
      const nameEl = document.getElementById('passGuestName');
      const summaryEl = document.getElementById('passSummary');
      
      if (folioEl) folioEl.textContent = payload.folio;
      if (nameEl) nameEl.textContent = payload.nombre;
      if (summaryEl) {
        summaryEl.textContent = payload.asistencia === 'CONFIRMADO' 
          ? `Asistencia confirmada para ${payload.pases} persona(s).` 
          : `Has declinado la asistencia. Agradecemos tu aviso.`;
      }
    }
  }

  generateLogisticalFolio(guestName, passesCount = 1) {
    let tableCode = 'MGEN';
    if (this.currentGuest) {
      if (this.currentGuest.isCourt || this.currentGuest.isImperial || this.currentGuest.tableId === 'tbl_imperial') {
        tableCode = 'MIMP';
      } else if (this.currentGuest.tableId || this.currentGuest.table) {
        const tStr = String(this.currentGuest.tableId || this.currentGuest.table);
        const match = tStr.match(/\d+/);
        if (match) tableCode = 'M' + match[0].padStart(2, '0');
      }
    }

    let nameCode = 'INVITADO';
    if (guestName) {
      const rawTokens = guestName
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .filter(w => !['FAMILIA', 'FAM', 'SR', 'SRA', 'DR', 'DRA', 'ING', 'LIC', 'DON', 'DONA', 'DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y'].includes(w.toUpperCase()));
      
      if (rawTokens.length > 0) {
        nameCode = rawTokens[0].toUpperCase().substring(0, 10);
      }
    }

    const passesCode = `${passesCount || 1}P`;
    return `${tableCode}-${nameCode}-${passesCode}`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollRsvpController;
} else if (typeof window !== 'undefined') {
  window.ScrollRsvpController = ScrollRsvpController;
}
