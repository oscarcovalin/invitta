const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'demos');
const folders = ['boda-esencial', 'boda-premium', 'boda-vip', 'xv-esencial', 'xv-premium', 'xv-vip'];

for (const folder of folders) {
    const indexPath = path.join(demosDir, folder, 'index.html');
    if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        // Cache buster for JS and CSS
        const v = new Date().getTime(); // timestamp
        
        html = html.replace(/src="js\/config\.js.*?"/, `src="js/config.js?v=${v}"`);
        html = html.replace(/src="js\/main\.js.*?"/, `src="js/main.js?v=${v}"`);
        html = html.replace(/href="css\/style\.css.*?"/, `href="css/style.css?v=${v}"`);
        
        fs.writeFileSync(indexPath, html, 'utf-8');
    }
}
console.log("Cache busters agregados.");
