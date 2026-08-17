// Lógica común de apertura para todos los sobres
document.addEventListener("DOMContentLoaded", function() {
    const overlays = document.querySelectorAll('.envelope-overlay');
    
    overlays.forEach(overlay => {
        const seal = overlay.querySelector('.envelope-seal');
        const flap = overlay.querySelector('.envelope-flap');
        const front = overlay.querySelector('.envelope-front');
        const content = overlay.querySelector('.envelope-content-preview');
        
        if (seal) {
            seal.addEventListener('click', function() {
                // 1. Abrir la solapa
                flap.classList.add('open');
                seal.classList.add('open');
                
                // Ocultar texto preview o forro extra
                if(content) content.style.opacity = '0';
                
                // 2. Extraer la carta virtual o deslizar el frente hacia abajo
                setTimeout(() => {
                    if(front) front.classList.add('slide-down');
                    overlay.classList.add('fade-out');
                    
                    // 3. Destruir el overlay para permitir scroll
                    setTimeout(() => {
                        overlay.style.display = 'none';
                        document.body.style.overflow = 'auto'; // Restaurar scroll
                    }, 1000);
                }, 600); // 600ms despues de que abra la solapa
                
                // Intento de reproducir música (común en las invitaciones VIP/Premium)
                const music = document.getElementById('bg-music');
                const musicBtn = document.getElementById('music-btn');
                if (music) {
                    music.play().then(() => {
                        if (musicBtn) musicBtn.classList.add('playing');
                    }).catch(() => {});
                }
            });
        }
    });

    // Asegurar que no hay scroll mientras el sobre esté activo
    if (overlays.length > 0) {
        document.body.style.overflow = 'hidden';
    }
});
