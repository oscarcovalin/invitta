const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'demos');

function processDemo(folderName, type, tier) {
    const indexPath = path.join(demosDir, folderName, 'index.html');
    if (!fs.existsSync(indexPath)) return;
    
    let html = fs.readFileSync(indexPath, 'utf-8');

    // 1. ADAPTACIONES POR TIPO (BODA vs XV AÑOS)
    if (type === 'xv') {
        html = html.replace(/Nuestra Boda/g, 'Mis XV Años');
        html = html.replace(/Paulina Anael & Rodrigo/g, 'Valentina');
        html = html.replace(/Paulina Anael/g, 'Valentina');
        html = html.replace(/Rodrigo/g, 'Familia'); // Quitamos al novio donde aplique
        html = html.replace(/Padres de la Novia/g, 'Mis Padres');
        // Remover bloque Padres del Novio (buscando un patrón aproximado)
        html = html.replace(/<div class="reveal">[\s\S]*?<h3 class="family-role-title">Padres del Novio<\/h3>[\s\S]*?<\/div>/g, '');
        // Itinerario: Ceremonia Religiosa se queda.
        html = html.replace(/Primer Baile/g, 'Vals de XV Años');
    }

    // 2. ADAPTACIONES POR PAQUETE (TIER)
    if (tier === 'esencial') {
        // Remover Galería de fotos
        html = html.replace(/<!-- Photo Gallery Parallax -->[\s\S]*?<\/section>/g, '');
        html = html.replace(/<div class="parallax-section gallery-item.*?<\/div>/g, '');
        
        // Remover Mesa de Regalos
        html = html.replace(/<!-- Gift Registry Section -->[\s\S]*?<\/section>/g, '');
        html = html.replace(/<!-- Dress Code Section -->[\s\S]*?<\/section>/g, ''); // Sin Dress code interactivo en esencial
    }
    
    if (tier === 'premium') {
        // Premium: Usar CSS Dark Theme para la tarjeta y el fondo
        // Al ser una copia de VIP, primero removemos los módulos exclusivos de VIP
        // (Pase con código QR, Álbum Colaborativo)
        html = html.replace(/<!-- VIP Access Pass -->[\s\S]*?<\/section>/g, '');
        html = html.replace(/<!-- Collaborative Album Section -->[\s\S]*?<\/section>/g, '');
        html = html.replace(/<!-- Guest Album -->[\s\S]*?<\/section>/g, '');
        
        // Cambiar título para Premium
        if (type === 'boda') {
            html = html.replace(/VIP Experience/g, 'Edición Premium');
            html = html.replace(/Valentina/g, 'Ana & Carlos');
        } else {
            html = html.replace(/VIP Experience/g, 'Edición Premium');
            html = html.replace(/Valentina/g, 'Sofía');
        }
    }

    if (tier === 'vip') {
        // En boda, se llama Ana y Carlos si queremos (pero mejor dejamos Camila/Valentina)
        if (type === 'boda') {
            html = html.replace(/VIP Experience/g, 'Edición VIP');
        } else {
            html = html.replace(/Valentina/g, 'Camila');
            html = html.replace(/VIP Experience/g, 'Edición VIP');
        }
    }
    
    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log(`Processed ${folderName}`);
}

// Ejecutar para cada carpeta
const demos = [
    { folder: 'boda-esencial', type: 'boda', tier: 'esencial' },
    { folder: 'boda-premium', type: 'boda', tier: 'premium' },
    { folder: 'boda-vip', type: 'boda', tier: 'vip' },
    { folder: 'xv-esencial', type: 'xv', tier: 'esencial' },
    { folder: 'xv-premium', type: 'xv', tier: 'premium' },
    { folder: 'xv-vip', type: 'xv', tier: 'vip' }
];

demos.forEach(d => processDemo(d.folder, d.type, d.tier));

// --- CAMBIAR ESTILO A DARK MODE EN PREMIUM ---
const premiumCssPaths = [
    path.join(demosDir, 'boda-premium', 'css', 'style.css'),
    path.join(demosDir, 'xv-premium', 'css', 'style.css')
];

premiumCssPaths.forEach(cssPath => {
    if (fs.existsSync(cssPath)) {
        // Cargar el CSS base de VIP
        let css = fs.readFileSync(path.join(demosDir, 'boda-vip', 'css', 'style.css'), 'utf-8');
        // Sobreescribir las variables root para hacerlo Dark Mode Elegante (Estilo "Moderna")
        css = css.replace(/--bg-color: #FAF7F2;/g, '--bg-color: #1a1a1a;');
        css = css.replace(/--secondary-color: #2E2E2E;/g, '--secondary-color: #f7f6f4;'); // Texto claro
        css = css.replace(/--text-color: #6B6560;/g, '--text-color: #c4c4c4;');
        css = css.replace(/--border-color: #E8DDD0;/g, '--border-color: #333;');
        css = css.replace(/--white: #FFFFFF;/g, '--white: #222;'); // Cajas oscuras
        // Escribir a premium
        fs.writeFileSync(cssPath, css, 'utf-8');
    }
});
console.log('CSS Premium adaptado a Dark Theme');
