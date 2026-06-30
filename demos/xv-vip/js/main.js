// --- GESTIÓN GLOBAL DE CONFIGURACIÓN ---
let activeConfig = null;

// Intentar cargar configuración personalizada desde localStorage
// LocalStorage cache is DISABLED for demos.
if (typeof WEDDING_CONFIG !== "undefined") {
    activeConfig = WEDDING_CONFIG;
}
// --- INYECCIÓN DINÁMICA DE ESTILOS & FUENTES ---
if (activeConfig && activeConfig.theme) {
    const root = document.documentElement;
    const theme = activeConfig.theme;
    if (theme) {
        root.style.setProperty('--primary-color', theme.primaryColor || '#8C7B5D');
        root.style.setProperty('--secondary-color', theme.secondaryColor || '#2F3E46');
        root.style.setProperty('--bg-color', theme.bgColor || '#F8F5F0');
        root.style.setProperty('--text-color', theme.textColor || '#333333');
        
        root.style.setProperty('--font-script', `'${theme.fontScript}', cursive`);
        root.style.setProperty('--font-primary', `'${theme.fontPrimary}', sans-serif`);
        root.style.setProperty('--font-secondary', `'${theme.fontSecondary}', sans-serif`);
        
        if (theme.bgImage && theme.bgImage.trim() !== "") {
            root.style.setProperty('--global-bg-image', `url('${theme.bgImage}')`);
            root.style.setProperty('--global-bg-opacity', '1');
        } else {
            root.style.setProperty('--global-bg-image', 'none');
        }
    }

    // 2. Cargar & Inyectar Tipografías de Google
    if (theme.fontScript) {
        loadGoogleFont(theme.fontScript);
        root.style.setProperty('--font-script', `'${theme.fontScript}', cursive`);
    }
    if (theme.fontPrimary) {
        loadGoogleFont(theme.fontPrimary);
        root.style.setProperty('--font-primary', `'${theme.fontPrimary}', sans-serif`);
        root.style.setProperty('--font-secondary', `'${theme.fontPrimary}', sans-serif`);
    }
}

// Función para importar dinámicamente tipografías desde Google Fonts
function loadGoogleFont(fontName) {
    // Evitar cargar las fuentes locales clásicas
    if (fontName === 'Sweet Pea' || fontName === 'Champagne Limousines' || !fontName) return;

    const fontId = `gfont-${fontName.toLowerCase().replace(/ /g, '-')}`;
    if (document.getElementById(fontId)) return; // Ya está cargada

    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:ital,wght@0,300;0,400;0,700;1,400&display=swap`;
    document.head.appendChild(link);
}

// --- RENDERIZADO DINÁMICO DE DATOS (MACHOTE) ---
document.addEventListener("DOMContentLoaded", () => {
    if (!activeConfig) return;

    const isXv = activeConfig.eventType === "xv";
    const mainTitleText = isXv ? activeConfig.brideName : `${activeConfig.brideName} & ${activeConfig.groomName}`;
    const pageTitle = isXv ? `Mis XV Años - ${mainTitleText}` : `Nuestra Boda - ${mainTitleText}`;
    const defaultPreTitle = isXv ? "Tenemos el honor de invitarte a los XV Años de" : "Tenemos el honor de invitarte a esta celebración de";

    // 1. Metadatos e Identidad
    document.title = pageTitle;
    const tabTitleEl = document.getElementById("tab-title");
    if (tabTitleEl) tabTitleEl.innerText = pageTitle;

    const ogTitle = document.getElementById("og-title");
    if (ogTitle) ogTitle.setAttribute("content", pageTitle);

    setDOMText("hero-title", mainTitleText);
    setDOMText("hero-date", activeConfig.weddingDateText);
    setDOMText("hero-pre-title", activeConfig.preTitle || defaultPreTitle);
    setDOMText("footer-title", activeConfig.brideGroomInitials);

    // Render Quote
    const quoteSection = document.getElementById("quote-section");
    if (quoteSection) {
        if (activeConfig.quote && activeConfig.quote.trim() !== "") {
            setDOMText("main-quote", `"${activeConfig.quote}"`);
            quoteSection.style.display = "block";
        } else {
            quoteSection.style.display = "none";
        }
    }

    // --- 1.1 Inyección Dinámica de Fotografías ---
    if (activeConfig.images) {
        const images = activeConfig.images;
        const applyBg = (selector, url) => {
            if (!url) return;
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.style.setProperty('background-image', `url('${url}')`, 'important'));
        };
        applyBg('.hero', images.hero);
        applyBg('.parallax-1', images.parallax1);
        applyBg('.parallax-2', images.parallax2);
        applyBg('.parallax-3', images.parallax3);

        // Renderizado 100% dinámico de la Galería (admite hasta 12 imágenes)
        const galleryContainer = document.getElementById("photo-grid");
        if (galleryContainer) {
            // Limpiar cualquier parallax-section previa para evitar duplicados en recargas rápidas
            const oldItems = galleryContainer.querySelectorAll('.parallax-section');
            oldItems.forEach(item => item.remove());

            // Recorrer las ranuras disponibles de galería
            for (let i = 1; i <= 12; i++) {
                const imgKey = `grid${i}`;
                const imgUrl = images[imgKey];
                
                // Si la imagen tiene contenido (ruta local, URL o Base64 optimizada)
                if (imgUrl && imgUrl.trim() !== "") {
                    const itemDiv = document.createElement("div");
                    itemDiv.className = `parallax-section gallery-item-${i} reveal`;
                    itemDiv.style.setProperty('background-image', `url('${imgUrl}')`, 'important');
                    galleryContainer.appendChild(itemDiv);
                }
            }
        }
    }

    // 2. Padres y Padrinos
    setDOMText("bride-mother", activeConfig.family.brideParents.mother);
    setDOMText("bride-father", activeConfig.family.brideParents.father);
    
    if (isXv) {
        const groomMotherEl = document.getElementById("groom-mother");
        if (groomMotherEl && groomMotherEl.parentElement) {
            groomMotherEl.parentElement.style.display = "none";
        }
        const brideMotherEl = document.getElementById("bride-mother");
        if (brideMotherEl && brideMotherEl.previousElementSibling) {
            brideMotherEl.previousElementSibling.innerText = "Mis Padres";
        }
        setDOMText("family-title", "Con la Bendición de Mis Padres");
        setDOMText("gallery-title", "Mi Galería");
    } else {
        setDOMText("groom-mother", activeConfig.family.groomParents.mother);
        setDOMText("groom-father", activeConfig.family.groomParents.father);
    }
    
    const padContainer = document.getElementById("padrinos-container");
    if (padContainer) {
        if (activeConfig.family.padrinos) {
            setDOMText("padrinos-names", activeConfig.family.padrinos);
            padContainer.style.display = "block";
        } else {
            padContainer.style.display = "none";
        }
    }

    // 3. Ubicaciones & Detalles
    setDOMText("ceremonia-title", activeConfig.ceremonia.title);
    setDOMText("ceremonia-time", activeConfig.ceremonia.time);
    setDOMText("ceremonia-place", activeConfig.ceremonia.place);
    setDOMText("ceremonia-address", `${activeConfig.ceremonia.address1}, ${activeConfig.ceremonia.address2}`);
    setDOMAttribute("ceremonia-map", "href", `https://maps.google.com/?q=${activeConfig.ceremonia.mapQuery}`);

    setDOMText("recepcion-title", activeConfig.recepcion.title);
    setDOMText("recepcion-time", activeConfig.recepcion.time);
    setDOMText("recepcion-place", activeConfig.recepcion.place);
    setDOMText("recepcion-address", `${activeConfig.recepcion.address1}, ${activeConfig.recepcion.address2}`);
    setDOMAttribute("recepcion-map", "href", `https://maps.google.com/?q=${activeConfig.recepcion.mapQuery}`);

    // 4. Itinerario (Timeline Dinámico)
    const timelineContainer = document.getElementById("timeline-container");
    if (timelineContainer && activeConfig.itinerary) {
        timelineContainer.innerHTML = ""; // Limpiar
        activeConfig.itinerary.forEach(item => {
            const timelineItem = document.createElement("div");
            timelineItem.className = "timeline-item";

            const iconDiv = document.createElement("div");
            iconDiv.className = "timeline-icon";
            const icon = document.createElement("i");
            icon.className = `fa-solid ${item.iconClass}`;
            iconDiv.appendChild(icon);
            timelineItem.appendChild(iconDiv);

            const contentDiv = document.createElement("div");
            contentDiv.className = "timeline-content";

            const timeSpan = document.createElement("span");
            timeSpan.className = "time";
            timeSpan.innerText = item.time;

            const h3 = document.createElement("h3");
            h3.innerText = item.title;

            const p = document.createElement("p");
            p.innerText = item.description;

            contentDiv.appendChild(timeSpan);
            contentDiv.appendChild(h3);
            contentDiv.appendChild(p);

            timelineItem.appendChild(contentDiv);
            timelineContainer.appendChild(timelineItem);
        });
    }

    // 4.5 Hospedaje
    const hospedajeContainer = document.getElementById("hospedaje-container");
    const hospedajeSection = document.getElementById("hospedaje");
    if (hospedajeContainer && hospedajeSection && activeConfig.incluirHospedaje && activeConfig.hospedaje && activeConfig.hospedaje.opciones) {
        const validHotels = activeConfig.hospedaje.opciones.filter(h => h.name && h.name.trim() !== "");
        if (validHotels.length > 0) {
            hospedajeSection.style.display = "block";
            setDOMText("hospedaje-desc", activeConfig.hospedaje.description);
            
            validHotels.forEach(hotel => {
                const card = document.createElement("div");
                card.className = "card";
                card.style.maxWidth = "350px";
                
                let linkHtml = "";
                if (hotel.url && hotel.url.trim() !== "") {
                    linkHtml = `<a href="${hotel.url}" target="_blank" class="btn-secondary" style="margin-top: 15px;"><i class="fa-solid fa-link"></i> Ver Sitio / Reservar</a>`;
                }

                card.innerHTML = `
                    <i class="fa-solid fa-hotel card-icon"></i>
                    <h3 style="font-size: 1.8rem; margin-bottom: 10px;">${hotel.name}</h3>
                    <p style="font-weight: bold; color: var(--text-color); margin-bottom: 5px;">${hotel.address}</p>
                    <p style="color: var(--text-color); margin-bottom: 10px;"><i class="fa-solid fa-phone"></i> ${hotel.phone}</p>
                    ${linkHtml}
                `;
                hospedajeContainer.appendChild(card);
            });
        }
    }

    // 5. Código de Vestimenta
    setDOMText("dress-code-subtitle", activeConfig.dressCode.title);
    setDOMText("dress-women-desc", activeConfig.dressCode.women.desc);
    setDOMText("dress-women-note", activeConfig.dressCode.women.note);
    setDOMText("dress-men-desc", activeConfig.dressCode.men.desc);

    const dressWomenImg = document.getElementById("dress-women-img");
    if (dressWomenImg && activeConfig.dressCode.women.image) {
        dressWomenImg.src = activeConfig.dressCode.women.image;
    }

    const dressMenImg = document.getElementById("dress-men-img");
    if (dressMenImg && activeConfig.dressCode.men.image) {
        dressMenImg.src = activeConfig.dressCode.men.image;
    }

    // 6. Mesa de Regalos
    setDOMText("registry-desc", activeConfig.registry.description);
    
    // Regalo 1
    const regBtn1 = document.getElementById("registry-btn-1");
    if (regBtn1) {
        if (activeConfig.registry.registry1 && activeConfig.registry.registry1.url) {
            regBtn1.setAttribute("href", activeConfig.registry.registry1.url);
            setDOMText("registry-name-1", activeConfig.registry.registry1.name || "Ver Mesa");
            regBtn1.style.display = "inline-flex";
        } else if (activeConfig.registry.liverpoolId) { // Fallback legacy
            regBtn1.setAttribute("href", `https://mesaderegalos.liverpool.com.mx/milistaderegalos/${activeConfig.registry.liverpoolId}`);
            setDOMText("registry-name-1", "Ver Mesa en Liverpool");
            regBtn1.style.display = "inline-flex";
        } else {
            regBtn1.style.display = "none";
        }
    }

    // Regalo 2
    const regBtn2 = document.getElementById("registry-btn-2");
    if (regBtn2) {
        if (activeConfig.registry.registry2 && activeConfig.registry.registry2.url) {
            regBtn2.setAttribute("href", activeConfig.registry.registry2.url);
            setDOMText("registry-name-2", activeConfig.registry.registry2.name || "Ver Mesa");
            regBtn2.style.display = "inline-flex";
        } else {
            regBtn2.style.display = "none";
        }
    }

    // Lluvia de sobres
    const lluviaCard = document.getElementById("lluvia-sobres-card");
    if (lluviaCard) {
        if (activeConfig.registry.lluviaSobres || activeConfig.registry.lluviaSobres === undefined) {
            lluviaCard.style.display = "block";
        } else {
            lluviaCard.style.display = "none";
        }
    }

    // 7. Pases Personalizados e Invitado (Parámetros URL)
    const invitationData = getUrlParams();
    setDOMText("ticket-title", activeConfig.passSection.title);
    setDOMText("ticket-subtitle", activeConfig.passSection.subtitle);
    setDOMText("ticket-guest-name", invitationData.guest);
    setDOMText("ticket-passes", invitationData.passes);
    setDOMText("ticket-table", invitationData.table);
    setDOMText("ticket-message", activeConfig.passSection.message);

    // QR dinámico (Para acceso en recepción)
    const ticketQrEl = document.getElementById('ticket-qr');
    if (ticketQrEl) {
        const prefix = (activeConfig.passSection && activeConfig.passSection.qrPrefix) ? activeConfig.passSection.qrPrefix : "ACCESO";
        // En lugar de usar la URL local (file://) que los celulares rechazan, 
        // generamos un texto claro que los scanners de eventos leen perfectamente.
        const qrData = `${prefix} | Invitado: ${invitationData.guest} | Pases: ${invitationData.passes} | Mesa: ${invitationData.table}`;
        ticketQrEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
    }

    // Dropdown RSVP
    const guestsSelect = document.getElementById('guests');
    if (guestsSelect) {
        guestsSelect.innerHTML = '';
        for (let i = 1; i <= invitationData.passes; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = i + (i === 1 ? ' persona' : ' personas');
            guestsSelect.appendChild(option);
        }
    }

    // 8. Formulario RSVP (Confirmación por WhatsApp)
    setDOMText("rsvp-title", activeConfig.rsvp.title);
    setDOMText("rsvp-desc", activeConfig.rsvp.description);

    const rsvpForm = document.getElementById('rsvp-form');
    if (rsvpForm) {
        const btn1 = document.getElementById('btn-rsvp-1');
        const num2 = activeConfig.rsvp.whatsappNumber2;
        const btnContainer = document.getElementById('rsvp-buttons-container');
        
        if (num2 && num2.trim() !== "" && btnContainer) {
            if (btn1) btn1.innerText = "Confirmar con Novia (Opción 1)";
            
            if (!document.getElementById('btn-rsvp-2')) {
                const btn2 = document.createElement("button");
                btn2.type = "submit";
                btn2.id = "btn-rsvp-2";
                btn2.className = "btn-primary w-100";
                btn2.style.backgroundColor = "var(--secondary-color)";
                btn2.innerText = "Confirmar con Novio (Opción 2)";
                btnContainer.appendChild(btn2);
            }
        }

        rsvpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitterBtn = e.submitter || (this.querySelector('button[type="submit"]'));
            
            const name = document.getElementById('name').value;
            const attendance = document.getElementById('attendance').value;
            const guestsCount = document.getElementById('guests').value;
            const message = document.getElementById('message').value;
            
            let phoneNumber = activeConfig.rsvp.whatsappNumber; 
            if (submitterBtn && submitterBtn.id === 'btn-rsvp-2') {
                phoneNumber = activeConfig.rsvp.whatsappNumber2;
            }
            
            submitterBtn.innerText = 'Redirigiendo a WhatsApp...';
            submitterBtn.style.opacity = '0.7';
            
            let textMessage = "";
            const greetingNames = isXv ? activeConfig.brideName : `${activeConfig.brideName} y ${activeConfig.groomName}`;
            const eventWord = isXv ? "mis XV Años" : "su celebración";
            const emojiRing = isXv ? "👑" : "💍";
            
            if (attendance === 'yes') {
                textMessage = `¡Hola ${greetingNames}! ${emojiRing}\n\nConfirmo mi asistencia para ${eventWord}. 🥂✨\n\n*Nombre:* ${name}\n*Asistentes:* ${guestsCount} de ${invitationData.passes} autorizados.\n*Mesa:* ${invitationData.table}`;
            } else {
                textMessage = `¡Hola ${greetingNames}! 🤍\n\nLamento informar que no podré asistir a ${eventWord}.\n\n*Nombre:* ${name}`;
            }
            
            if (message) {
                textMessage += `\n*Mensaje:* ${message}`;
            }
            
            const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(textMessage)}`;
            
            setTimeout(() => {
                window.open(waUrl, '_blank');
                this.innerHTML = `
                    <div style="text-align: center; padding: 20px 0;">
                        <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 15px;"></i>
                        <h3 style="color: var(--secondary-color); font-family: var(--font-script);">¡Mensaje Generado!</h3>
                        <p>Te hemos redirigido a WhatsApp para enviar tu confirmación.</p>
                    </div>
                `;
            }, 1000);
        });
    }

    // 8.5 Lógica del Sobre Digital (Efecto Wow)
    const envelopeOverlay = document.getElementById("envelope-overlay");
    const envelopeContainer = document.querySelector(".envelope-container");
    const envelopeSeal = document.getElementById("envelope-seal");
    const envelopeNames = document.getElementById("envelope-names");

    if (envelopeOverlay && envelopeSeal) {
        // Deshabilitar scroll al inicio
        document.body.style.overflow = "hidden";
        
        // Nombres en el sobre
        const namesText = isXv ? activeConfig.brideName : `${activeConfig.brideName} & ${activeConfig.groomName}`;
        if (envelopeNames) envelopeNames.innerText = namesText;

        envelopeSeal.addEventListener("click", () => {
            // Animación de abrir
            envelopeContainer.classList.add("open");
            
            // Intentar reproducir música inmediatamente tras la interacción
            if (typeof attemptPlay === 'function') {
                attemptPlay();
            }
            
            // Esperar a que termine la animación (1.5s) para desvanecer el overlay
            setTimeout(() => {
                envelopeOverlay.classList.add("hidden");
                // Habilitar scroll de nuevo
                document.body.style.overflow = "auto";
                document.body.style.overflowX = "hidden"; // Mantener X hidden
            }, 1500);
        });
    }

    // 9. Música de Fondo
    const bgMusic = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');
    let isPlaying = false;

    function attemptPlay() {
        if (!isPlaying && bgMusic) {
            bgMusic.play().then(() => {
                isPlaying = true;
                if(musicBtn) musicBtn.classList.add('playing');
            }).catch(function(error) {
                console.log("Audio play bloqueado, esperando interacción.", error);
            });
        }
    }

    if (bgMusic) {
        // Enlazar música
        bgMusic.src = activeConfig.musicUrl || "assets/music.mp3";

        attemptPlay();
        
        document.body.addEventListener('click', attemptPlay, { once: true });
        document.body.addEventListener('touchstart', attemptPlay, { once: true });
        document.body.addEventListener('scroll', attemptPlay, { once: true });
    }

    if (musicBtn && bgMusic) {
        musicBtn.addEventListener('click', function(e) {
            e.stopPropagation(); 
            if (isPlaying) {
                bgMusic.pause();
                musicBtn.classList.remove('playing');
            } else {
                bgMusic.play().catch(function(error) {
                    console.log("Error al reproducir audio:", error);
                });
                musicBtn.classList.add('playing');
            }
            isPlaying = !isPlaying;
        });
    }

    // 10. Lightbox Gallery Logic
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    if (lightbox && lightboxImg && lightboxClose) {
        // Encontrar todas las secciones con fondo de imagen (Galería Parallax)
        const galleryItems = document.querySelectorAll('.parallax-section');
        
        galleryItems.forEach(item => {
            item.addEventListener('click', function() {
                // Obtener la URL de la imagen de fondo
                const bgImage = window.getComputedStyle(this).getPropertyValue('background-image');
                // Remover 'url("' y '")'
                const urlMatch = bgImage.match(/url\(["']?(.*?)["']?\)/);
                if (urlMatch && urlMatch[1]) {
                    lightboxImg.src = urlMatch[1];
                    lightbox.classList.add('show');
                    document.body.style.overflow = 'hidden'; // Prevenir scroll
                }
            });
        });

        // Cerrar Lightbox
        const closeLightbox = () => {
            lightbox.classList.remove('show');
            document.body.style.overflow = 'auto'; // Restaurar scroll
            setTimeout(() => { lightboxImg.src = ""; }, 400); // Limpiar después de animación
        };

        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) {
                closeLightbox();
            }
        });
    }

    reveal();
});

// --- FUNCIONES AUXILIARES ---
function setDOMText(id, text) {
    const el = document.getElementById(id);
    if (el && text !== undefined && text !== null) {
        el.innerText = text;
    }
}

function setDOMAttribute(id, attr, value) {
    const el = document.getElementById(id);
    if (el && value) {
        el.setAttribute(attr, value);
    }
}

// --- LECTURA DE PARÁMETROS URL ---
function getUrlParams() {
    if (!activeConfig) return {};
    const params = new URLSearchParams(window.location.search);
    return {
        guest: params.get('n') || params.get('invitado') || activeConfig.passSection.defaultGuestName,
        passes: parseInt(params.get('p') || params.get('pases')) || activeConfig.passSection.defaultPasses,
        table: params.get('m') || params.get('mesa') || activeConfig.passSection.defaultTable
    };
}

// --- CONTADOR DE CUENTA REGRESIVA ---
const countdownTimer = setInterval(function() {
    if (!activeConfig || !activeConfig.countdownDate) return;

    const wDate = activeConfig.countdownDate;
    const weddingDate = new Date(wDate.year, wDate.month, wDate.day, wDate.hour, wDate.minute, wDate.second).getTime();
    const now = new Date().getTime();
    const distance = weddingDate - now;

    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    if (distance < 0) {
        clearInterval(countdownTimer);
        const wrapper = document.querySelector(".countdown-wrapper");
        if (wrapper) wrapper.innerHTML = "<h3 style='color: var(--primary-color); font-size: 2.2rem;'>¡Hoy es el gran día! 🥂💍</h3>";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.innerHTML = days < 10 ? "0" + days : days;
    hoursEl.innerHTML = hours < 10 ? "0" + hours : hours;
    minutesEl.innerHTML = minutes < 10 ? "0" + minutes : minutes;
    secondsEl.innerHTML = seconds < 10 ? "0" + seconds : seconds;
}, 1000);

// --- REVELACIÓN ---
function reveal() {
    const reveals = document.querySelectorAll(".reveal");
    for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 100;
        
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}

window.addEventListener("scroll", reveal);

// --- PARALLAX ---
function initMobileParallax() {
    const parallaxElements = document.querySelectorAll('.parallax-section, .hero');
    
    if (window.innerWidth <= 768) {
        window.addEventListener('scroll', function() {
            let scrolled = window.pageYOffset;
            
            parallaxElements.forEach(function(section) {
                let offset = section.offsetTop;
                let height = section.offsetHeight;
                
                if (scrolled + window.innerHeight > offset && scrolled < offset + height) {
                    let yPos = (scrolled - offset) * 0.25; 
                    
                    if(section.classList.contains('hero')) {
                         section.style.setProperty('background-position', `75% calc(25% + ${yPos}px)`, 'important');
                    } else {
                         section.style.setProperty('background-position', `center calc(50% + ${yPos}px)`, 'important');
                    }
                }
            });
        }, { passive: true });
    } else {
        parallaxElements.forEach(function(section) {
            section.style.removeProperty('background-position');
        });
    }
}

window.addEventListener('resize', initMobileParallax);
initMobileParallax();
