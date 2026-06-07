const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'demos');

const darkFolders = ['boda-vip', 'xv-premium', 'xv-vip'];
const allFolders = ['boda-esencial', 'boda-premium', 'boda-vip', 'xv-esencial', 'xv-premium', 'xv-vip'];

// 1. Arreglar el fondo oscuro (Quitar textura beige)
for (const folder of darkFolders) {
    const mainJsPath = path.join(demosDir, folder, 'js', 'main.js');
    if (fs.existsSync(mainJsPath)) {
        let mainJs = fs.readFileSync(mainJsPath, 'utf-8');
        // Cambiar la inyección de la textura beige por 'none'
        mainJs = mainJs.replace(/root\.style\.setProperty\('--global-bg-image', `url\('\.\.\/assets\/section_bg\.png'\)`\);/g, `root.style.setProperty('--global-bg-image', 'none');`);
        // Para index.html de los oscuros
        fs.writeFileSync(mainJsPath, mainJs, 'utf-8');
    }
}

// 2. Modificar el CSS de las categorías para que el itinerario sea diferente
for (const folder of allFolders) {
    const cssPath = path.join(demosDir, folder, 'css', 'style.css');
    if (fs.existsSync(cssPath)) {
        let css = fs.readFileSync(cssPath, 'utf-8');
        
        // Vamos a inyectar reglas de CSS al final del archivo
        let customCSS = "\n/* --- DISEÑO EXCLUSIVO DE ITINERARIO --- */\n";

        if (folder.includes('esencial')) {
            // Diseño Esencial: Timeline clásico (círculos y línea central) - Ya lo tiene por defecto, solo asegurarnos.
            customCSS += `
            .timeline-item { border: 1px solid rgba(0,0,0,0.05); }
            `;
        } 
        else if (folder.includes('premium')) {
            // Diseño Premium: ZigZag Flotante sin línea sólida
            customCSS += `
            .timeline::before { display: none !important; }
            .timeline-item { width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 40px !important; }
            .timeline-item:nth-child(even) { flex-direction: column; }
            .timeline-icon { position: relative; left: auto; right: auto; transform: none; width: 60px; height: 60px; margin-bottom: 15px; background: var(--secondary-color); color: var(--bg-color); }
            .timeline-content { width: 90%; max-width: 400px; padding: 25px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); background: var(--bg-color); border: 1px solid var(--primary-color); }
            .timeline-item:nth-child(even) .timeline-content { left: auto; }
            `;
        }
        else if (folder.includes('vip')) {
            // Diseño VIP: Ultra Minimalista Lujoso
            customCSS += `
            .timeline::before { width: 1px; background: linear-gradient(to bottom, transparent, var(--primary-color), transparent); }
            .timeline-item { margin-bottom: 50px; }
            .timeline-content { background: transparent; box-shadow: none; padding: 10px; border-left: 3px solid var(--primary-color); border-radius: 0; text-align: left; }
            .timeline-item:nth-child(even) .timeline-content { border-left: none; border-right: 3px solid var(--primary-color); text-align: right; }
            .timeline-icon { background: transparent; border: 2px solid var(--primary-color); color: var(--primary-color); font-size: 1.5rem; }
            .timeline-content h3 { font-family: var(--font-script); font-size: 2.2rem; color: var(--primary-color); }
            `;
        }

        // Si ya había inyectado esto antes (por si se corre dos veces), lo elimino primero
        css = css.replace(/\/\* --- DISEÑO EXCLUSIVO DE ITINERARIO --- \*\/[\s\S]*$/, '');
        css += customCSS;
        
        // Quitar global-bg-image de background-color si está ahí
        css = css.replace(/background-image:\s*var\(--global-bg-image\);/g, '/* background image removed for solid colors */');

        fs.writeFileSync(cssPath, css, 'utf-8');
    }
}
console.log("Visuales arreglados: fondos de textura removidos y CSS de itinerarios diferenciado.");
