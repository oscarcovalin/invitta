const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'demos');

const themes = {
    'boda-esencial': {
        type: 'html',
        primary: '#7A8B76', secondary: '#4A5B46', bg: '#F5F5F0', text: '#333333',
        fontScript: 'Alex Brush', fontPrimary: 'Montserrat', fontSecondary: 'Montserrat'
    },
    'boda-premium': {
        type: 'config',
        primary: '#A68A64', secondary: '#4A4641', bg: '#FDFBF7', text: '#333333',
        fontScript: 'Great Vibes', fontPrimary: 'Playfair Display', fontSecondary: 'Playfair Display'
    },
    'boda-vip': {
        type: 'config',
        primary: '#C5A059', secondary: '#D4AF37', bg: '#111111', text: '#EAEAEA',
        fontScript: 'Pinyon Script', fontPrimary: 'Cinzel', fontSecondary: 'Cinzel'
    },
    'xv-esencial': {
        type: 'html',
        primary: '#E89A9A', secondary: '#C27A7A', bg: '#FDFBFB', text: '#444444',
        fontScript: 'Parisienne', fontPrimary: 'Outfit', fontSecondary: 'Outfit'
    },
    'xv-premium': {
        type: 'config',
        primary: '#722F37', secondary: '#4A1C24', bg: '#1A1A1A', text: '#F0E6D2',
        fontScript: 'Dancing Script', fontPrimary: 'Cormorant Garamond', fontSecondary: 'Cormorant Garamond'
    },
    'xv-vip': {
        type: 'config',
        primary: '#8CA5D3', secondary: '#4A6B9C', bg: '#0A1128', text: '#E0E4CE',
        fontScript: 'Allura', fontPrimary: 'Playfair Display', fontSecondary: 'Inter'
    }
};

for (const [folder, theme] of Object.entries(themes)) {
    const demoPath = path.join(demosDir, folder);
    
    if (theme.type === 'config') {
        const configPath = path.join(demoPath, 'js', 'config.js');
        if (fs.existsSync(configPath)) {
            let confStr = fs.readFileSync(configPath, 'utf-8');
            try {
                const fakeScript = confStr.replace(/const WEDDING_CONFIG/g, 'var WEDDING_CONFIG');
                eval(fakeScript);
                
                if (typeof WEDDING_CONFIG !== 'undefined') {
                    WEDDING_CONFIG.theme.primaryColor = theme.primary;
                    WEDDING_CONFIG.theme.secondaryColor = theme.secondary;
                    WEDDING_CONFIG.theme.bgColor = theme.bg;
                    WEDDING_CONFIG.theme.textColor = theme.text;
                    WEDDING_CONFIG.theme.fontScript = theme.fontScript;
                    WEDDING_CONFIG.theme.fontPrimary = theme.fontPrimary;
                    WEDDING_CONFIG.theme.fontSecondary = theme.fontSecondary;

                    const newContent = `/**
 * CONFIGURACIÓN INYECTADA DESDE JSON
 */
const WEDDING_CONFIG = ${JSON.stringify(WEDDING_CONFIG, null, 4)};
`;
                    fs.writeFileSync(configPath, newContent, 'utf-8');
                    console.log(`Actualizado config.js en ${folder}`);
                }
            } catch(e) {
                console.error("Error en config", folder, e);
            }
        }
    } else if (theme.type === 'html') {
        const indexPath = path.join(demoPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf-8');
            
            // Eliminar bloque anterior si existe
            html = html.replace(/<style id="dynamic-theme">[\s\S]*?<\/style>/, '');
            
            // Inyectar CSS y Google Fonts
            const fontsUrl = `https://fonts.googleapis.com/css2?family=${theme.fontScript.replace(/ /g, '+')}&family=${theme.fontPrimary.replace(/ /g, '+')}:wght@300;400;600&display=swap`;
            
            const styleBlock = `<style id="dynamic-theme">
        @import url('${fontsUrl}');
        :root {
            --primary-color: ${theme.primary} !important;
            --secondary-color: ${theme.secondary} !important;
            --bg-color: ${theme.bg} !important;
            --text-color: ${theme.text} !important;
            --font-script: '${theme.fontScript}', cursive !important;
            --font-primary: '${theme.fontPrimary}', sans-serif !important;
            --font-secondary: '${theme.fontSecondary}', sans-serif !important;
        }
        body { background-color: var(--bg-color); color: var(--text-color); }
        h1, h2, .script-title { font-family: var(--font-script); }
    </style>`;
            
            // Insertar justo antes de </head>
            html = html.replace('</head>', `    ${styleBlock}\n</head>`);
            fs.writeFileSync(indexPath, html, 'utf-8');
            console.log(`Actualizado index.html en ${folder}`);
        }
    }
}
