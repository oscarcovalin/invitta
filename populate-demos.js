const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\Oscar\\.gemini\\antigravity-ide\\brain\\e80404d5-721c-4f9c-945f-499e722f90b7';
const demosDir = path.join(__dirname, 'demos');

// Función para encontrar imagen por prefijo en la carpeta de artifacts
function findImageByPrefix(prefix) {
    const files = fs.readdirSync(brainDir);
    const match = files.find(f => f.startsWith(prefix) && f.endsWith('.png'));
    return match ? path.join(brainDir, match) : null;
}

const configData = {
    'boda-esencial': {
        heroImgPrefix: 'boda_dia_hero',
        targetImgName: 'hero_bg.jpg',
        names: 'Sofía & Mateo',
        date: '14 de Marzo, 2026',
        ceremoniaPlaza: 'Hacienda San Gabriel',
        ceremoniaDir: 'Cuernavaca, Morelos',
        recepcionPlaza: 'Jardines de la Hacienda',
        recepcionDir: 'Cuernavaca, Morelos',
        quote: 'Nuestro viaje juntos apenas comienza.'
    },
    'boda-premium': {
        // Usa hero original o lo dejamos igual (ya tiene boda_noche). 
        // Agregaremos foto de galería.
        gal1Prefix: 'boda_premium_gal1',
        names: 'Ana & Carlos',
        date: '28 de Noviembre, 2026',
        ceremoniaPlaza: 'Parroquia San Miguel Arcángel',
        ceremoniaDir: 'Ciudad de México',
        recepcionPlaza: 'Salón Lomas',
        recepcionDir: 'Lomas de Chapultepec, CDMX',
        quote: 'El destino nos unió para siempre.'
    },
    'boda-vip': {
        heroImgPrefix: 'boda_vip_hero',
        targetImgName: 'hero_bg.jpg',
        gal1Prefix: 'boda_vip_gal1',
        names: 'Isabella & Alejandro',
        date: '19 de Diciembre, 2026',
        ceremoniaPlaza: 'Catedral Metropolitana',
        ceremoniaDir: 'Centro Histórico, CDMX',
        recepcionPlaza: 'Gran Hotel Ciudad de México',
        recepcionDir: 'Centro Histórico, CDMX',
        quote: 'Un amor eterno en una noche inolvidable.'
    },
    'xv-esencial': {
        heroImgPrefix: 'xv_esencial_hero',
        targetImgName: 'hero_bg.jpg',
        names: 'Valeria',
        date: '4 de Abril, 2026',
        ceremoniaPlaza: 'Parroquia La Sagrada Familia',
        ceremoniaDir: 'Colonia Roma, CDMX',
        recepcionPlaza: 'Salón Los Pinos',
        recepcionDir: 'Coyoacán, CDMX',
        quote: 'Hoy comienza mi primavera.'
    },
    'xv-premium': {
        gal1Prefix: 'xv_premium_gal1',
        names: 'Camila',
        date: '31 de Octubre, 2026',
        ceremoniaPlaza: 'Iglesia de San Juan',
        ceremoniaDir: 'Polanco, CDMX',
        recepcionPlaza: 'Salón Esmeralda',
        recepcionDir: 'Polanco, CDMX',
        quote: 'Una noche mágica e inolvidable.'
    },
    'xv-vip': {
        heroImgPrefix: 'xv_vip_hero',
        targetImgName: 'hero_bg.jpg',
        gal1Prefix: 'xv_vip_gal1',
        names: 'Ximena',
        date: '15 de Agosto, 2026',
        ceremoniaPlaza: 'Catedral del Mar',
        ceremoniaDir: 'Acapulco, Guerrero',
        recepcionPlaza: 'Gran Salón Diamante',
        recepcionDir: 'Zona Diamante, Acapulco',
        quote: 'Bajo las estrellas celebro mis 15 años.'
    }
};

for (const [folder, data] of Object.entries(configData)) {
    const demoPath = path.join(demosDir, folder);
    if (!fs.existsSync(demoPath)) continue;

    // 1. Copiar Imágenes
    if (data.heroImgPrefix) {
        const src = findImageByPrefix(data.heroImgPrefix);
        if (src) fs.copyFileSync(src, path.join(demoPath, 'assets', data.targetImgName));
    }
    if (data.gal1Prefix) {
        const src = findImageByPrefix(data.gal1Prefix);
        // La copiaremos encima de galeria_1.jpg
        if (src) fs.copyFileSync(src, path.join(demoPath, 'assets', 'galeria_1.jpg'));
    }

    // 2. Modificar index.html
    const indexPath = path.join(demoPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        // Nombres
        html = html.replace(/<title id="tab-title">.*?<\/title>/g, `<title id="tab-title">${data.names}</title>`);
        html = html.replace(/<h1 class="title fade-in-up delay-1" id="hero-title">.*?<\/h1>/g, `<h1 class="title fade-in-up delay-1" id="hero-title">${data.names}</h1>`);
        html = html.replace(/<p id="envelope-names" class="envelope-names-preview">.*?<\/p>/g, `<p id="envelope-names" class="envelope-names-preview">${data.names}</p>`);
        // Fechas
        html = html.replace(/<p class="date fade-in-up delay-2" id="hero-date">.*?<\/p>/g, `<p class="date fade-in-up delay-2" id="hero-date">${data.date}</p>`);
        // Lugares HTML (si están fijos)
        html = html.replace(/<p id="ceremonia-place" style=".*?">.*?<\/p>/g, `<p id="ceremonia-place" style="font-weight: bold; color: var(--secondary-color); margin-top: 10px;">${data.ceremoniaPlaza}</p>`);
        html = html.replace(/<p id="ceremonia-address">.*?<\/p>/g, `<p id="ceremonia-address">${data.ceremoniaDir}</p>`);
        html = html.replace(/<p id="recepcion-place" style=".*?">.*?<\/p>/g, `<p id="recepcion-place" style="font-weight: bold; color: var(--secondary-color); margin-top: 10px;">${data.recepcionPlaza}</p>`);
        html = html.replace(/<p id="recepcion-address">.*?<\/p>/g, `<p id="recepcion-address">${data.recepcionDir}</p>`);
        // Quote
        html = html.replace(/<p id="main-quote" style=".*?">.*?<\/p>/g, `<p id="main-quote" style="font-family: var(--font-secondary); font-size: 1.3rem; max-width: 800px; margin: 0 auto; color: var(--text-color); font-style: italic; line-height: 1.8; padding: 0 20px;">"${data.quote}"</p>`);

        fs.writeFileSync(indexPath, html, 'utf-8');
    }

    // 3. Modificar js/config.js (aunque los ids sobreescriben desde js, actualizaremos config para ser exhaustivos)
    const configPath = path.join(demoPath, 'js', 'config.js');
    if (fs.existsSync(configPath)) {
        let js = fs.readFileSync(configPath, 'utf-8');
        
        js = js.replace(/hero:\s*\{[\s\S]*?\},/, `hero: { title: "${data.names}", subtitle: "${folder.includes('xv') ? 'Mis XV Años' : 'Nuestra Boda'}", date: "${data.date}", background_image: "assets/${data.targetImgName || 'hero_bg.jpg'}" },`);
        
        fs.writeFileSync(configPath, js, 'utf-8');
    }

    console.log(`Updated ${folder}`);
}
