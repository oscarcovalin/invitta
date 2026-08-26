/**
 * ============================================================================
 * StardustEngine — Efecto "Polvo de Estrellas" (Stardust) Parallax 3D a 60fps
 * Sin Canvas · Sin Librerías · CSS & DOM Puro · Invitta Studio (Antigravity)
 * ============================================================================
 */

class StardustEngine {
  /**
   * @param {Object} options - Configuración del generador de partículas
   */
  constructor(options = {}) {
    this.options = Object.assign({
      containerSelector: '#stardustContainer',
      triggerSectionSelector: '#timelineSection',
      ceremonySelector: '#ceremonySection',
      receptionSelector: '#receptionSection',
      count: 65, // Cantidad óptima balanceada para rendimiento móvil
      goldColor: '#A38047',
      goldGlow: 'rgba(163, 128, 71, 0.85)',
      speedBack: 0.08,
      speedMid: 0.26,
      speedFront: 0.58,
      autoInject: true
    }, options);

    this.layers = {
      back: null,
      mid: null,
      front: null
    };

    this.ticking = false;
    this.scrollY = 0;
    this.progress = 0;

    this.init();
  }

  init() {
    if (typeof document === 'undefined') return;

    this.setupDOM();
    this.generateParticles();
    this.bindScrollEvents();
    this.update();
  }

  /**
   * Crea e inyecta la estructura de capas DOM en el contenedor
   */
  setupDOM() {
    if (typeof document === 'undefined') return;
    let container = document.querySelector(this.options.containerSelector);
    
    if (!container && this.options.autoInject) {
      container = document.createElement('div');
      container.id = 'stardustContainer';
      container.className = 'stardust-master-container';
      document.body.prepend(container);
    }

    if (!container) return;

    this.container = container;
    this.container.innerHTML = '';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
      contain: strict;
      opacity: var(--stardust-opacity, 0);
      transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    `;

    // 1. Capa Fondo (Profundidad Lejana)
    this.layers.back = document.createElement('div');
    this.layers.back.className = 'stardust-layer stardust-layer-back';
    this.layers.back.style.cssText = `
      position: absolute; inset: -20vh -10vw; width: 120vw; height: 140vh;
      transform: translate3d(0, 0, 0); will-change: transform; pointer-events: none;
    `;

    // 2. Capa Media (Profundidad Intermedia)
    this.layers.mid = document.createElement('div');
    this.layers.mid.className = 'stardust-layer stardust-layer-mid';
    this.layers.mid.style.cssText = `
      position: absolute; inset: -30vh -10vw; width: 120vw; height: 160vh;
      transform: translate3d(0, 0, 0); will-change: transform; pointer-events: none;
    `;

    // 3. Capa Frontal (Primer Plano Rápido)
    this.layers.front = document.createElement('div');
    this.layers.front.className = 'stardust-layer stardust-layer-front';
    this.layers.front.style.cssText = `
      position: absolute; inset: -40vh -10vw; width: 120vw; height: 180vh;
      transform: translate3d(0, 0, 0); will-change: transform; pointer-events: none;
    `;

    this.container.appendChild(this.layers.back);
    this.container.appendChild(this.layers.mid);
    this.container.appendChild(this.layers.front);
  }

  /**
   * Inyecta dinámicamente divs individuales como estrellas suspendidas
   */
  generateParticles() {
    if (!this.container || typeof document === 'undefined') return;

    const total = this.options.count;
    const backCount = Math.floor(total * 0.45);  // 45% fondo
    const midCount = Math.floor(total * 0.35);   // 35% medio
    const frontCount = total - backCount - midCount; // 20% frente

    // Capa Fondo: Estrellas diminutas tenues
    for (let i = 0; i < backCount; i++) {
      const p = this.createParticleElement({
        size: this.randomRange(1, 2.2),
        opacity: this.randomRange(0.35, 0.65),
        duration: this.randomRange(3.5, 6),
        delay: this.randomRange(0, 4),
        glow: false
      });
      if (p) this.layers.back.appendChild(p);
    }

    // Capa Media: Estrellas brillantes definidas
    for (let i = 0; i < midCount; i++) {
      const p = this.createParticleElement({
        size: this.randomRange(2.2, 3.8),
        opacity: this.randomRange(0.6, 0.88),
        duration: this.randomRange(2.5, 4.5),
        delay: this.randomRange(0, 3),
        glow: true,
        glowBlur: 4
      });
      if (p) this.layers.mid.appendChild(p);
    }

    // Capa Frontal: Destellos de lujo y diamantes estelares
    for (let i = 0; i < frontCount; i++) {
      const isDiamond = Math.random() > 0.4;
      const p = this.createParticleElement({
        size: this.randomRange(3.8, 5.5),
        opacity: this.randomRange(0.85, 1),
        duration: this.randomRange(1.8, 3.2),
        delay: this.randomRange(0, 2.5),
        glow: true,
        glowBlur: 8,
        isDiamond: isDiamond
      });
      if (p) this.layers.front.appendChild(p);
    }
  }

  /**
   * Genera el elemento DOM individual con estilos inline acelerados
   */
  createParticleElement(cfg) {
    const top = (Math.random() * 100).toFixed(2);
    const left = (Math.random() * 100).toFixed(2);
    const size = cfg.size.toFixed(1);

    const glowStyle = cfg.glow 
      ? `box-shadow: 0 0 ${cfg.glowBlur}px ${this.options.goldGlow}, 0 0 ${cfg.glowBlur * 1.8}px rgba(240, 224, 205, 0.4);` 
      : '';

    const shapeStyle = cfg.isDiamond
      ? `transform: rotate(45deg); border-radius: 1px;`
      : `border-radius: 50%;`;

    const cssText = `
      position: absolute;
      top: ${top}%;
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      background: radial-gradient(circle, #FFFDF8 20%, ${this.options.goldColor} 85%, transparent 100%);
      opacity: ${cfg.opacity};
      ${shapeStyle}
      ${glowStyle}
      animation: stardustTwinkle ${cfg.duration}s ease-in-out ${cfg.delay}s infinite alternate;
      pointer-events: none;
    `;

    if (typeof document !== 'undefined') {
      const el = document.createElement('div');
      el.className = 'stardust-star';
      el.style.cssText = cssText;
      return el;
    }

    // Objeto mock para entorno Node
    return {
      className: 'stardust-star',
      style: { cssText: cssText }
    };
  }

  randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  bindScrollEvents() {
    if (typeof window === 'undefined') return;
    window.addEventListener('scroll', () => {
      this.scrollY = window.scrollY || window.pageYOffset;
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.update();
          this.ticking = false;
        });
        this.ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Bucle de actualización a 60fps que mueve únicamente los 3 planos GPU
   */
  update() {
    if (!this.layers.back || !this.layers.mid || !this.layers.front) return;

    const scrollY = this.scrollY;

    // 1. Gravedad suspendida (Parallax diferencial en eje Y)
    const yBack = -(scrollY * this.options.speedBack).toFixed(2);
    const yMid = -(scrollY * this.options.speedMid).toFixed(2);
    const yFront = -(scrollY * this.options.speedFront).toFixed(2);

    this.layers.back.style.transform = `translate3d(0, ${yBack}px, 0)`;
    this.layers.mid.style.transform = `translate3d(0, ${yMid}px, 0)`;
    this.layers.front.style.transform = `translate3d(0, ${yFront}px, 0)`;

    // 2. Transición Cinemática y Fade-In hacia el Itinerario / Recepción (#FAF8F5 -> #163C2B)
    this.updateCinematicFade();
  }

  /**
   * Calcula el progreso del fundido hacia la atmósfera oscura
   */
  updateCinematicFade() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const triggerEl = document.querySelector(this.options.triggerSectionSelector) || 
                      document.querySelector(this.options.receptionSelector);

    if (!triggerEl) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, this.scrollY / (maxScroll * 0.4)) : 0;
      this.applyProgress(progress);
      return;
    }

    const rect = triggerEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const triggerPoint = vh * 0.85;

    let progress = (triggerPoint - rect.top) / (vh * 0.65);
    progress = Math.max(0, Math.min(1, progress));

    const smoothProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    this.applyProgress(smoothProgress);
  }

  applyProgress(progress) {
    this.progress = progress;
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--stardust-opacity', progress.toFixed(3));
      document.documentElement.style.setProperty('--bg-crossfade', progress.toFixed(3));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stardust:updated', { 
        detail: { 
          progress: progress, 
          scrollY: this.scrollY 
        } 
      }));
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StardustEngine;
} else if (typeof window !== 'undefined') {
  window.StardustEngine = StardustEngine;
}
