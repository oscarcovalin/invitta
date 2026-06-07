const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'demos');

const corrections = {
    'boda-esencial': { // CDMX
        placeCere: "Catedral Metropolitana",
        addrCere1: "Plaza de la Constitución S/N",
        addrCere2: "Centro Histórico, CDMX",
        mapCere: "Catedral+Metropolitana+CDMX",
        placeRecep: "Hacienda de los Morales",
        addrRecep1: "Vázquez de Mella 525",
        addrRecep2: "Polanco, CDMX",
        mapRecep: "Hacienda+de+los+Morales",
        year: 2026, month: 9, day: 17, hour: 17 // Octubre es 9
    },
    'boda-premium': { // GDL
        placeCere: "Templo Expiatorio",
        addrCere1: "López Cotilla 935",
        addrCere2: "Guadalajara, Jalisco",
        mapCere: "Templo+Expiatorio+Guadalajara",
        placeRecep: "Salón Bellaterra",
        addrRecep1: "Av. Aviación 100",
        addrRecep2: "Zapopan, Jalisco",
        mapRecep: "Salon+Bellaterra+Zapopan",
        year: 2026, month: 10, day: 28, hour: 18 // Noviembre es 10
    },
    'boda-vip': { // MTY
        placeCere: "Basílica de Guadalupe",
        addrCere1: "Guanajuato 715",
        addrCere2: "Monterrey, N.L.",
        mapCere: "Basilica+de+Guadalupe+Monterrey",
        placeRecep: "Club Industrial",
        addrRecep1: "Av. Parteaguas",
        addrRecep2: "San Pedro Garza, N.L.",
        mapRecep: "Club+Industrial+Monterrey",
        year: 2026, month: 11, day: 19, hour: 19 // Diciembre es 11
    },
    'xv-esencial': { // CDMX
        placeCere: "Parroquia de San Juan",
        addrCere1: "Parque Centenario",
        addrCere2: "Coyoacán, CDMX",
        mapCere: "Parroquia+San+Juan+Coyoacan",
        placeRecep: "Jardín Versalles",
        addrRecep1: "Desierto de los Leones",
        addrRecep2: "CDMX",
        mapRecep: "Jardin+Versalles+CDMX",
        year: 2026, month: 2, day: 21, hour: 16 // Marzo es 2
    },
    'xv-premium': { // GDL
        placeCere: "Parroquia San Pedro",
        addrCere1: "Morelos 222",
        addrCere2: "Tlaquepaque, Jalisco",
        mapCere: "Parroquia+San+Pedro+Tlaquepaque",
        placeRecep: "Hacienda La Escoba",
        addrRecep1: "Carretera a Colotlán",
        addrRecep2: "Zapopan, Jalisco",
        mapRecep: "Hacienda+La+Escoba",
        year: 2026, month: 9, day: 31, hour: 18 // Octubre es 9
    },
    'xv-vip': { // MTY
        placeCere: "Parroquia Fátima",
        addrCere1: "Av. Vasconcelos",
        addrCere2: "San Pedro, N.L.",
        mapCere: "Parroquia+Fatima+San+Pedro",
        placeRecep: "Horno 3 Parque Fundidora",
        addrRecep1: "Fundidora",
        addrRecep2: "Monterrey, N.L.",
        mapRecep: "Horno+3+Monterrey",
        year: 2026, month: 7, day: 15, hour: 20 // Agosto es 7
    }
};

for (const [folder, data] of Object.entries(corrections)) {
    const demoPath = path.join(demosDir, folder);
    const configPath = path.join(demoPath, 'js', 'config.js');
    const indexPath = path.join(demoPath, 'index.html');

    // 1. Corregir config.js en Premium / VIP
    if (fs.existsSync(configPath)) {
        let conf = fs.readFileSync(configPath, 'utf-8');
        
        // Corregir Textos "Demo" en config
        conf = conf.replace(/"Lugar Demo"/g, `"${data.placeCere}"`);
        conf = conf.replace(/"Direcci\\u00f3n Demo"/g, `"${data.addrCere1}"`);
        conf = conf.replace(/"Dirección Demo"/g, `"${data.addrCere1}"`);
        conf = conf.replace(/"maps\+demo"/g, `"${data.mapCere}"`);
        
        conf = conf.replace(/"Sal\\u00f3n Demo"/g, `"${data.placeRecep}"`);
        conf = conf.replace(/"Salón Demo"/g, `"${data.placeRecep}"`);
        conf = conf.replace(/"salon\+demo"/g, `"${data.mapRecep}"`);
        
        // El JSON que dio el usuario tiene "countdownDate": { "targetDateTime": "..." }
        // Lo cambiamos a { year: X, month: Y, ... }
        conf = conf.replace(/"targetDateTime":\s*".*?"/g, `
        "year": ${data.year},
        "month": ${data.month},
        "day": ${data.day},
        "hour": ${data.hour},
        "minute": 0,
        "second": 0
        `);

        // Corregir Hotel Demo
        conf = conf.replace(/"Hotel Demo 1"/g, `"Hotel Grand Plaza"`);
        conf = conf.replace(/"Hotel Demo 2"/g, `"Hotel Boutique Centro"`);

        fs.writeFileSync(configPath, conf, 'utf-8');
        console.log("Config.js arreglado en " + folder);
    }
    
    // 2. Corregir index.html en Esencial
    else if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        // Corregir Textos "Demo"
        html = html.replace(/Lugar Demo/g, data.placeCere);
        html = html.replace(/Salón Demo/g, data.placeRecep);
        html = html.replace(/Dirección Demo, México/g, `${data.addrCere1}, ${data.addrCere2}`);
        html = html.replace(/maps\+demo/g, data.mapCere);
        html = html.replace(/salon\+demo/g, data.mapRecep);
        
        // Corregir el targetDate de la cuenta regresiva en el HTML o JS inline de los Esenciales
        // En boda-esencial/js/main.js es donde vive la fecha
        const mainJsPath = path.join(demoPath, 'js', 'main.js');
        if (fs.existsSync(mainJsPath)) {
            let js = fs.readFileSync(mainJsPath, 'utf-8');
            // Buscamos algo como const weddingDate = new Date("Nov 28, 2026 16:00:00").getTime();
            js = js.replace(/const weddingDate = new Date\(".*?"\)\.getTime\(\);/g, `const weddingDate = new Date(${data.year}, ${data.month}, ${data.day}, ${data.hour}, 0, 0).getTime();`);
            fs.writeFileSync(mainJsPath, js, 'utf-8');
        }

        fs.writeFileSync(indexPath, html, 'utf-8');
        console.log("index.html arreglado en " + folder);
    }
}
