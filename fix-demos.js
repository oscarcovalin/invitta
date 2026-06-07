const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'demos');

const configData = {
    'boda-premium': { names: ['Ana', 'Carlos'], isXv: false, date: '28 de Noviembre, 2026' },
    'boda-vip': { names: ['Isabella', 'Alejandro'], isXv: false, date: '19 de Diciembre, 2026' },
    'xv-premium': { names: ['Camila'], isXv: true, date: '31 de Octubre, 2026' },
    'xv-vip': { names: ['Ximena'], isXv: true, date: '15 de Agosto, 2026' }
};

for (const [folder, data] of Object.entries(configData)) {
    const demoPath = path.join(demosDir, folder);
    
    // 1. Fix main.js to disable localStorage
    const mainJsPath = path.join(demoPath, 'js', 'main.js');
    if (fs.existsSync(mainJsPath)) {
        let js = fs.readFileSync(mainJsPath, 'utf-8');
        js = js.replace(/const savedConfig = localStorage\.getItem\('wedding_config_machote'\);[\s\S]*?\/\/ --- INYECCIÓN DINÁMICA/, 
`// LocalStorage cache is DISABLED for demos.
if (typeof WEDDING_CONFIG !== "undefined") {
    activeConfig = WEDDING_CONFIG;
}
// --- INYECCIÓN DINÁMICA`);
        fs.writeFileSync(mainJsPath, js, 'utf-8');
    }

    // 2. Fix config.js to inject correct names
    const configPath = path.join(demoPath, 'js', 'config.js');
    if (fs.existsSync(configPath)) {
        let conf = fs.readFileSync(configPath, 'utf-8');
        
        conf = conf.replace(/eventType:\s*".*?"/, `eventType: "${data.isXv ? 'xv' : 'boda'}"`);
        conf = conf.replace(/brideName:\s*".*?"/, `brideName: "${data.names[0]}"`);
        if (data.isXv) {
            conf = conf.replace(/groomName:\s*".*?"/, `groomName: ""`);
            conf = conf.replace(/brideGroomInitials:\s*".*?"/, `brideGroomInitials: "${data.names[0][0]}"`);
        } else {
            conf = conf.replace(/groomName:\s*".*?"/, `groomName: "${data.names[1]}"`);
            conf = conf.replace(/brideGroomInitials:\s*".*?"/, `brideGroomInitials: "${data.names[0][0]} & ${data.names[1][0]}"`);
        }
        
        conf = conf.replace(/weddingDateText:\s*".*?"/, `weddingDateText: "${data.date}"`);
        
        fs.writeFileSync(configPath, conf, 'utf-8');
    }
    console.log("Fixed " + folder);
}
