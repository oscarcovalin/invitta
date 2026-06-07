const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'demos');
const allFolders = ['boda-esencial', 'boda-premium', 'boda-vip', 'xv-esencial', 'xv-premium', 'xv-vip'];

const newRegistryHtml = `
            <div class="registry-buttons-wrapper" style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-top: 30px; align-items: center;">
                <!-- Boton 1 -->
                <a href="#" id="registry-btn-1" target="_blank" class="btn-primary registry-btn" style="display:none; align-items: center; justify-content: center; gap: 8px; height: auto; padding: 12px 30px;"><i class="fa-solid fa-gift"></i> <span id="registry-name-1">Mesa 1</span></a>
                <!-- Boton 2 -->
                <a href="#" id="registry-btn-2" target="_blank" class="btn-primary registry-btn" style="display:none; align-items: center; justify-content: center; gap: 8px; height: auto; padding: 12px 30px;"><i class="fa-solid fa-gift"></i> <span id="registry-name-2">Mesa 2</span></a>
            </div>
            
            <!-- Lluvia de sobres -->
            <div id="lluvia-sobres-card" class="card" style="display:none; background: transparent; border: 2px dashed var(--primary-color); padding: 30px; border-radius: 10px; width: 100%; max-width: 500px; margin: 40px auto 0; box-shadow: none;">
                <i class="fa-solid fa-envelope-open-text" style="font-size: 2.5rem; color: var(--primary-color); margin-bottom: 15px;"></i>
                <h3 style="color: var(--primary-color); font-family: var(--font-primary); font-size: 1.4rem; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">Lluvia de Sobres</h3>
                <p style="font-size: 0.95rem; color: var(--text-color); margin-bottom: 0; opacity: 0.85; line-height: 1.6;">La tradición de la lluvia de sobres consiste en un regalo en efectivo que se deposita en un buzón o sobre especial el día del evento.</p>
            </div>
`;

for (const folder of allFolders) {
    const indexPath = path.join(demosDir, folder, 'index.html');
    if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        // Expresión regular para reemplazar el viejo registry-options
        const regex = /<div class="registry-options".*?>[\s\S]*?<\/div>[\s]*<\/div>[\s]*<\/section>/;
        // El regex de arriba es un poco arriesgado, buscaremos los contenedores precisos
        
        // Mejor busquemos la sección y la reemplazamos con un nuevo bloque exacto.
        const sectionRegex = /<div class="registry-options"[\s\S]*?Lluvia de Sobres[\s\S]*?<\/div>\s*<\/div>/;
        
        if (sectionRegex.test(html)) {
            html = html.replace(sectionRegex, newRegistryHtml);
        } else {
            console.log(`No se encontró el bloque en ${folder}. Intentando regex alternativo...`);
            // Alternativo manual por id
            const altRegex = /<div class="registry-options"[\s\S]*?<\/div>\s*<\/div>/;
            html = html.replace(altRegex, newRegistryHtml);
        }

        // De nuevo forzamos la caché de JS
        const v = new Date().getTime();
        html = html.replace(/src="js\/config\.js.*?"/, `src="js/config.js?v=${v}"`);
        html = html.replace(/src="js\/main\.js.*?"/, `src="js/main.js?v=${v}"`);
        html = html.replace(/href="css\/style\.css.*?"/, `href="css/style.css?v=${v}"`);

        fs.writeFileSync(indexPath, html, 'utf-8');
        console.log(`Arreglado Mesa de Regalos en ${folder}`);
    }
}
