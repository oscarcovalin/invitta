const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'demos');

const demos = [
    { folder: 'boda-esencial', envClass: 'env-boda-esencial' },
    { folder: 'boda-premium', envClass: 'env-boda-premium env-arch' },
    { folder: 'boda-vip', envClass: 'env-boda-vip' },
    { folder: 'xv-esencial', envClass: 'env-xv-esencial' },
    { folder: 'xv-premium', envClass: 'env-xv-premium env-asym' },
    { folder: 'xv-vip', envClass: 'env-xv-vip' }
];

demos.forEach(demo => {
    const indexPath = path.join(demosDir, demo.folder, 'index.html');
    if (!fs.existsSync(indexPath)) return;

    let html = fs.readFileSync(indexPath, 'utf-8');

    // 1. Remover el envelope antiguo si existe (el de VIP)
    html = html.replace(/<!-- Envelope Overlay \(Sobre Digital\) -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '');
    // A veces el regex no atrapa si hay div extras. Haremos un regex más robusto o simplemente removeremos el bloque conocido.
    // Usaremos indexOf para limpiar a mano si el regex falla.
    let envStart = html.indexOf('<!-- Envelope Overlay (Sobre Digital) -->');
    if (envStart !== -1) {
        let envEnd = html.indexOf('<!-- Background Music -->');
        if (envEnd !== -1) {
            html = html.substring(0, envStart) + html.substring(envEnd);
        }
    }

    // 2. Inyectar CSS en el <head>
    if (!html.includes('envelopes.css')) {
        html = html.replace('</head>', '    <link rel="stylesheet" href="../../assets/css/envelopes.css">\n</head>');
    }

    // 3. Inyectar JS antes de </body>
    if (!html.includes('envelopes.js')) {
        html = html.replace('</body>', '    <script src="../../assets/js/envelopes.js"></script>\n</body>');
    }

    // 4. Inyectar el nuevo Envelope justo después de <body>
    const newEnvelope = `
    <!-- Envelope Overlay (Sobre Digital) -->
    <div id="envelope-overlay" class="envelope-overlay ${demo.envClass}">
        <div class="envelope-container">
            <div class="envelope-flap" id="envelope-flap"></div>
            <div class="envelope-back"></div>
            <div class="envelope-liner"></div>
            <div class="envelope-front"></div>
            <div class="envelope-seal" id="envelope-seal">
                <i class="fa-solid fa-envelope-open" style="font-size:1.2rem;"></i>
            </div>
        </div>
    </div>
`;
    // Quitar cualquier inyección previa de nuestro mismo script para ser idempotentes
    html = html.replace(/<!-- Envelope Overlay \(Sobre Digital\) -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '');

    html = html.replace('<body>', '<body>\n' + newEnvelope);

    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log(`Injected envelope in ${demo.folder}`);
});
