const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'demos');
const xvFolders = ['xv-esencial', 'xv-premium', 'xv-vip'];

const parentHtml = `
        <div class="family-flex-container" style="justify-content: center; width: 100%; margin-bottom: 30px;">
            <div style="text-align: center;">
                <p class="family-member-name" id="bride-mother" style="font-size: 1.5rem; margin-bottom: 5px;"></p>
                <p class="family-member-name" id="bride-father" style="font-size: 1.5rem;"></p>
            </div>
        </div>
`;

for (const folder of xvFolders) {
    const indexPath = path.join(demosDir, folder, 'index.html');
    if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        // Reemplazar el contenedor vacío
        // Nota: puede haber espacios en blanco dentro, usaremos regex
        html = html.replace(/<div class="family-flex-container">[\s\S]*?<\/div>/, parentHtml);
        
        // También añadiremos un cache buster de paso para que lo vea de inmediato
        const v = new Date().getTime();
        html = html.replace(/src="js\/config\.js.*?"/, `src="js/config.js?v=${v}"`);
        html = html.replace(/src="js\/main\.js.*?"/, `src="js/main.js?v=${v}"`);
        html = html.replace(/href="css\/style\.css.*?"/, `href="css/style.css?v=${v}"`);

        fs.writeFileSync(indexPath, html, 'utf-8');
        console.log(`Arreglado padres en ${folder}`);
    }
}
