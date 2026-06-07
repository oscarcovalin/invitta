const fs = require('fs');
const path = require('path');

const jsonsDir = 'C:\\Users\\Oscar\\Downloads\\mockups_invitta_json';
const demosDir = path.join(__dirname, 'demos');

// Mapeo de Demos a JSONs
const mapping = {
    'boda-esencial': 'boda-cdmx.json',
    'boda-premium': 'boda-gdl.json',
    'boda-vip': 'boda-mty.json',
    'xv-esencial': 'xv-cdmx.json',
    'xv-premium': 'xv-gdl.json',
    'xv-vip': 'xv-mty.json'
};

for (const [demoFolder, jsonName] of Object.entries(mapping)) {
    const jsonPath = path.join(jsonsDir, jsonName);
    const demoPath = path.join(demosDir, demoFolder);
    
    if (!fs.existsSync(jsonPath) || !fs.existsSync(demoPath)) {
        console.log("No encontrado: " + jsonName + " o " + demoFolder);
        continue;
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // --- MANEJO PARA PREMIUM Y VIP (js/config.js) ---
    const configPath = path.join(demoPath, 'js', 'config.js');
    if (fs.existsSync(configPath)) {
        // En lugar de regex pesadas, extraemos las variables 'theme' e 'images' del archivo antiguo si podemos, 
        // o las forzamos por defecto para que las imágenes sigan viéndose.
        
        let oldConfigStr = fs.readFileSync(configPath, 'utf-8');
        let oldImages = {};
        let oldTheme = {};
        let oldPassSection = {};
        
        // Tratamos de evaluar el viejo config
        try {
            // Simulamos un entorno para capturar WEDDING_CONFIG
            const fakeScript = oldConfigStr.replace(/const WEDDING_CONFIG/g, 'var WEDDING_CONFIG');
            eval(fakeScript);
            if (typeof WEDDING_CONFIG !== 'undefined') {
                oldImages = WEDDING_CONFIG.images || {};
                oldTheme = WEDDING_CONFIG.theme || {};
                oldPassSection = WEDDING_CONFIG.passSection || {};
            }
        } catch(e) {}

        // Combinamos el nuevo JSON con las imágenes y temas viejos
        jsonData.images = oldImages;
        jsonData.theme = oldTheme;
        if(Object.keys(oldPassSection).length > 0) {
            jsonData.passSection = oldPassSection;
        } else {
            jsonData.passSection = {
                title: "Pase de Invitación",
                subtitle: "Válido para:",
                defaultGuestName: "Familia Invitada",
                defaultPasses: 2,
                defaultTable: "Asignada",
                message: '"¡Te esperamos!"',
                qrDataPrefix: "INVITTA2026"
            };
        }

        const newConfigContent = `/**
 * CONFIGURACIÓN INYECTADA DESDE JSON
 */
const WEDDING_CONFIG = ${JSON.stringify(jsonData, null, 4)};
`;
        fs.writeFileSync(configPath, newConfigContent, 'utf-8');
        console.log(`Config.js actualizado para: ${demoFolder}`);
    } 
    // --- MANEJO PARA ESENCIAL (index.html) ---
    else {
        const indexPath = path.join(demoPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf-8');
            
            const namesText = jsonData.eventType === 'xv' ? jsonData.brideName : `${jsonData.brideName} & ${jsonData.groomName}`;
            
            // Reemplazo de Nombres
            html = html.replace(/<title id="tab-title">.*?<\/title>/g, `<title id="tab-title">${namesText}</title>`);
            html = html.replace(/<h1 class="title fade-in-up delay-1" id="hero-title">.*?<\/h1>/g, `<h1 class="title fade-in-up delay-1" id="hero-title">${namesText}</h1>`);
            html = html.replace(/<p id="envelope-names" class="envelope-names-preview">.*?<\/p>/g, `<p id="envelope-names" class="envelope-names-preview">${namesText}</p>`);
            
            // Fechas
            html = html.replace(/<p class="date fade-in-up delay-2" id="hero-date">.*?<\/p>/g, `<p class="date fade-in-up delay-2" id="hero-date">${jsonData.weddingDateText}</p>`);
            
            // Ceremonia
            if (jsonData.ceremonia) {
                html = html.replace(/<p id="ceremonia-place" style=".*?">.*?<\/p>/g, `<p id="ceremonia-place" style="font-weight: bold; color: var(--secondary-color); margin-top: 10px;">${jsonData.ceremonia.place}</p>`);
                html = html.replace(/<p id="ceremonia-address">.*?<\/p>/g, `<p id="ceremonia-address">${jsonData.ceremonia.address1}, ${jsonData.ceremonia.address2}</p>`);
                html = html.replace(/href="[^"]*" id="ceremonia-map"/, `href="https://maps.google.com/?q=${encodeURIComponent(jsonData.ceremonia.mapQuery)}" id="ceremonia-map"`);
            }
            
            // Recepción
            if (jsonData.recepcion) {
                html = html.replace(/<p id="recepcion-place" style=".*?">.*?<\/p>/g, `<p id="recepcion-place" style="font-weight: bold; color: var(--secondary-color); margin-top: 10px;">${jsonData.recepcion.place}</p>`);
                html = html.replace(/<p id="recepcion-address">.*?<\/p>/g, `<p id="recepcion-address">${jsonData.recepcion.address1}, ${jsonData.recepcion.address2}</p>`);
                html = html.replace(/href="[^"]*" id="recepcion-map"/, `href="https://maps.google.com/?q=${encodeURIComponent(jsonData.recepcion.mapQuery)}" id="recepcion-map"`);
            }

            // Quote
            if (jsonData.quote) {
                html = html.replace(/<p id="main-quote" style=".*?">.*?<\/p>/g, `<p id="main-quote" style="font-family: var(--font-secondary); font-size: 1.3rem; max-width: 800px; margin: 0 auto; color: var(--text-color); font-style: italic; line-height: 1.8; padding: 0 20px;">"${jsonData.quote}"</p>`);
            }

            fs.writeFileSync(indexPath, html, 'utf-8');
            console.log(`index.html actualizado para: ${demoFolder}`);
        }
    }
}
