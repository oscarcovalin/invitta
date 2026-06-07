const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'demos');

const demoData = {
    'boda-esencial': {
        quote: "El amor verdadero no tiene un final feliz, porque simplemente no tiene final.",
        parents: { bm: "Elena Ruiz", bf: "José González", gm: "Carmen López", gf: "Roberto Martínez" },
        padrinos: "Arturo y Mónica Cárdenas",
        iti: [
            {time: "15:00 hrs", title: "Recepción", desc: "Llegada al jardín", icon: "fa-champagne-glasses"},
            {time: "16:00 hrs", title: "Ceremonia Civil", desc: "Unión legal", icon: "fa-file-signature"},
            {time: "17:00 hrs", title: "Banquete", desc: "Comida familiar", icon: "fa-utensils"},
            {time: "20:00 hrs", title: "Baile", desc: "Primer baile de novios", icon: "fa-heart"}
        ]
    },
    'boda-premium': {
        quote: "Te elegí a ti porque cuando mi luz se apaga, te sientas a mi lado en la sombra.",
        parents: { bm: "Luz María Santos", bf: "Francisco Torres", gm: "Rosaura Pérez", gf: "Javier Mendoza" },
        padrinos: "Ernesto y Claudia Villalobos",
        iti: [
            {time: "18:00 hrs", title: "Ceremonia Religiosa", desc: "Misa solemne", icon: "fa-church"},
            {time: "19:30 hrs", title: "Cóctel de Bienvenida", desc: "Bebidas y aperitivos", icon: "fa-martini-glass-citrus"},
            {time: "20:30 hrs", title: "Cena", desc: "Banquete de gala", icon: "fa-utensils"},
            {time: "22:00 hrs", title: "Inicia la Fiesta", desc: "Apertura de pista", icon: "fa-music"}
        ]
    },
    'boda-vip': {
        quote: "Juntos es mi lugar favorito en todo el mundo.",
        parents: { bm: "Silvia Cantú", bf: "Arturo Garza", gm: "Margarita Treviño", gf: "Raúl Lozano" },
        padrinos: "Diego y Valeria Sada",
        iti: [
            {time: "19:00 hrs", title: "Ceremonia de Gala", desc: "Basílica", icon: "fa-church"},
            {time: "21:00 hrs", title: "Recepción de Lujo", desc: "Club Industrial", icon: "fa-champagne-glasses"},
            {time: "22:00 hrs", title: "Banquete VIP", desc: "Cena de 4 tiempos", icon: "fa-utensils"},
            {time: "00:00 hrs", title: "Tornaboda", desc: "Música y antojitos", icon: "fa-moon"}
        ]
    },
    'xv-esencial': {
        quote: "Hay momentos que se guardan en el corazón para siempre.",
        parents: { bm: "Adriana Montes", bf: "Luis Fernández" },
        padrinos: "Marco y Sonia Reyes",
        iti: [
            {time: "16:00 hrs", title: "Sesión Fotográfica", desc: "Fotos familiares", icon: "fa-camera"},
            {time: "18:00 hrs", title: "Misa", desc: "Acción de gracias", icon: "fa-church"},
            {time: "20:00 hrs", title: "Recepción", desc: "Cena y vals", icon: "fa-crown"},
            {time: "22:00 hrs", title: "Baile Coreográfico", desc: "Sorpresa de XV", icon: "fa-music"}
        ]
    },
    'xv-premium': {
        quote: "Hoy comienzo a escribir la historia más bonita de mi juventud.",
        parents: { bm: "Verónica Rivas", bf: "Miguel Ángel Solís" },
        padrinos: "Hugo y Daniela Castro",
        iti: [
            {time: "17:00 hrs", title: "Ceremonia", desc: "Acción de gracias", icon: "fa-church"},
            {time: "19:00 hrs", title: "Recepción de Gala", desc: "Bienvenida", icon: "fa-glass-cheers"},
            {time: "20:30 hrs", title: "Vals", desc: "Baile tradicional con chambelanes", icon: "fa-crown"},
            {time: "23:00 hrs", title: "Hora Loca", desc: "Fiesta y neón", icon: "fa-compact-disc"}
        ]
    },
    'xv-vip': {
        quote: "Una noche mágica llena de sueños que hoy se hacen realidad.",
        parents: { bm: "Gabriela Villarreal", bf: "Eduardo Castillo" },
        padrinos: "Fernando y Marcela Domínguez",
        iti: [
            {time: "20:00 hrs", title: "Alfombra Roja", desc: "Llegada de invitados", icon: "fa-star"},
            {time: "21:30 hrs", title: "Brindis", desc: "Cena de gala", icon: "fa-champagne-glasses"},
            {time: "23:00 hrs", title: "Show Principal", desc: "Presentación y vals", icon: "fa-crown"},
            {time: "01:00 am", title: "After Party", desc: "DJ en vivo", icon: "fa-headphones"}
        ]
    }
};

for (const [folder, data] of Object.entries(demoData)) {
    const demoPath = path.join(demosDir, folder);
    const configPath = path.join(demoPath, 'js', 'config.js');

    // 1. Corregir config.js (Premium / VIP)
    if (fs.existsSync(configPath)) {
        let confStr = fs.readFileSync(configPath, 'utf-8');
        
        // Vamos a parsear el objeto WEDDING_CONFIG para sobreescribir partes directamente y regrabar
        try {
            const fakeScript = confStr.replace(/const WEDDING_CONFIG/g, 'var WEDDING_CONFIG');
            eval(fakeScript);
            
            if (typeof WEDDING_CONFIG !== 'undefined') {
                WEDDING_CONFIG.quote = data.quote;
                WEDDING_CONFIG.family.brideParents.mother = data.parents.bm;
                WEDDING_CONFIG.family.brideParents.father = data.parents.bf;
                
                if (WEDDING_CONFIG.eventType !== 'xv') {
                    WEDDING_CONFIG.family.groomParents.mother = data.parents.gm;
                    WEDDING_CONFIG.family.groomParents.father = data.parents.gf;
                }
                
                // Arreglar padrinos (godparents -> padrinos)
                WEDDING_CONFIG.family.padrinos = data.padrinos;
                delete WEDDING_CONFIG.family.godparents;
                
                // Reemplazar Itinerario
                WEDDING_CONFIG.itinerary = data.iti.map(i => ({
                    time: i.time,
                    title: i.title,
                    description: i.desc,
                    iconClass: i.icon
                }));

                const newConfigContent = `/**
 * CONFIGURACIÓN INYECTADA DESDE JSON
 */
const WEDDING_CONFIG = ${JSON.stringify(WEDDING_CONFIG, null, 4)};
`;
                fs.writeFileSync(configPath, newConfigContent, 'utf-8');
            }
        } catch(e) {
            console.error("Error arreglando", folder, e);
        }
    } 
    // 2. Corregir index.html (Esencial)
    else {
        const indexPath = path.join(demoPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf-8');
            
            html = html.replace(/"Mockup para demostración de invitación digital\."/g, `"${data.quote}"`);
            html = html.replace(/Patricia Morales/g, data.parents.bm);
            html = html.replace(/Ricardo González/g, data.parents.bf);
            html = html.replace(/Silvia Torres/g, data.parents.gm || "");
            html = html.replace(/Héctor Ramírez/g, data.parents.gf || "");
            
            // Reemplazar godparents estáticos si existen
            html = html.replace(/Carlos y Adriana Mendoza/g, data.padrinos);
            
            // El itinerario en Esencial se rinde desde JS o HTML, 
            // Si está en el main.js de la Esencial, hay que arreglarlo allá.
            const mainPath = path.join(demoPath, 'js', 'main.js');
            if (fs.existsSync(mainPath)) {
                let js = fs.readFileSync(mainPath, 'utf-8');
                // Arreglo rudimentario para inyectar el itinerario en main.js de esencial
                js = js.replace(/const itineraryData = \[[\s\S]*?\];/, `const itineraryData = ${JSON.stringify(data.iti.map(i => ({
                    time: i.time,
                    title: i.title,
                    description: i.desc,
                    icon: i.icon
                })), null, 4)};`);
                fs.writeFileSync(mainPath, js, 'utf-8');
            }

            fs.writeFileSync(indexPath, html, 'utf-8');
        }
    }
}
console.log("Datos ficticios arreglados exitosamente.");
