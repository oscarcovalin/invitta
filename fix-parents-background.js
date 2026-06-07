const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'demos');
const allFolders = ['boda-esencial', 'boda-premium', 'boda-vip', 'xv-esencial', 'xv-premium', 'xv-vip'];

// Nombres para inyectar DENTRO DEL HTML de los que no tienen inyección JS (Esenciales)
const hardcodedParents = {
    'boda-esencial': `
            <div>
                <h3 class="family-role-title">Padres de la Novia</h3>
                <p class="family-member-name" id="bride-mother">Elena Ruiz</p>
                <p class="family-member-name" id="bride-father">José González</p>
            </div>
            <div>
                <h3 class="family-role-title">Padres del Novio</h3>
                <p class="family-member-name" id="groom-mother">Carmen López</p>
                <p class="family-member-name" id="groom-father">Roberto Martínez</p>
            </div>
    `,
    'xv-esencial': `
        <div class="family-flex-container" style="justify-content: center; width: 100%; margin-bottom: 30px;">
            <div style="text-align: center;">
                <p class="family-member-name" id="bride-mother" style="font-size: 1.5rem; margin-bottom: 5px;">Adriana Montes</p>
                <p class="family-member-name" id="bride-father" style="font-size: 1.5rem;">Luis Fernández</p>
            </div>
        </div>
    `
};

for (const folder of allFolders) {
    const indexPath = path.join(demosDir, folder, 'index.html');
    const cssPath = path.join(demosDir, folder, 'css', 'style.css');
    
    // 1. ARREGLAR PADRES EN ESENCIALES (HARDCODE HTML)
    if (folder.includes('esencial') && fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        if (folder === 'boda-esencial') {
            const familyRegex = /<div class="family-flex-container">[\s\S]*?<\/div>\s*<\/div>\s*<div class="family-padrinos/m;
            // Solo reemplazar si el HTML está vacío o diferente, intentaremos reemplazar el contenido interior
            html = html.replace(/<div class="family-flex-container">[\s\S]*?(<div class="family-padrinos)/, `<div class="family-flex-container">\n${hardcodedParents['boda-esencial']}\n        </div>\n        $1`);
        } else if (folder === 'xv-esencial') {
            html = html.replace(/<div class="family-flex-container"[\s\S]*?<\/div>\s*<\/div>/, hardcodedParents['xv-esencial']);
        }
        
        fs.writeFileSync(indexPath, html, 'utf-8');
    }
    
    // 2. ARREGLAR TEXTURAS DE FONDO Y ELIMINAR SECTION_BG EN TODOS LOS CSS
    if (fs.existsSync(cssPath)) {
        let css = fs.readFileSync(cssPath, 'utf-8');
        
        // Quitar llamadas a var(--global-bg-image) y poner textura de papel sutil a TODOS los body/secciones
        css = css.replace(/background-image:\s*var\(--global-bg-image\);/g, '/* background image removed */');
        
        // Textura orgánica de papel sutil (SVG Base64) + color de fondo
        const organicTextureCSS = `
/* Textura Orgánica Inyectada */
body, .section-padding, .quote-section, .hospedaje-section {
    background-color: var(--bg-color);
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
    background-blend-mode: multiply;
}
        `;
        
        // Limpiar inyecciones previas si las hay
        css = css.replace(/\/\* Textura Orgánica Inyectada \*\/[\s\S]*?background-blend-mode: multiply;\n}/, '');
        css += organicTextureCSS;
        
        fs.writeFileSync(cssPath, css, 'utf-8');
    }
    
    // Y para asegurar que en JS no se reescriba la textura de hojas
    const mainJsPath = path.join(demosDir, folder, 'js', 'main.js');
    if (fs.existsSync(mainJsPath)) {
        let mainJs = fs.readFileSync(mainJsPath, 'utf-8');
        // Quitar la línea del if que inyecta section_bg.png
        mainJs = mainJs.replace(/root\.style\.setProperty\('--global-bg-image', `url\('\.\.\/assets\/section_bg\.png'\)`\);/g, `/* global bg removed */`);
        fs.writeFileSync(mainJsPath, mainJs, 'utf-8');
    }
}

console.log("Fondo orgánico aplicado y padres de esenciales forzados en HTML.");
