const fs = require('fs');
const path = require('path');

const demosDir = path.join(__dirname, 'public', 'demos');

const themes = {
    'boda-esencial': {
        type: 'html',
        color60: '#F5F5F0', color30: '#4A5B46', color10: '#7A8B76', text: '#333333',
        fontScript: 'Alex Brush', fontPrimary: 'Montserrat', fontSecondary: 'Montserrat'
    },
    'boda-premium': {
        type: 'config',
        color60: '#FDFBF7', color30: '#A68A64', color10: '#4A4641', text: '#333333',
        fontScript: 'Great Vibes', fontPrimary: 'Playfair Display', fontSecondary: 'Playfair Display'
    },
    'boda-vip': {
        type: 'config',
        color60: '#111111', color30: '#D4AF37', color10: '#C5A059', text: '#EAEAEA',
        fontScript: 'Pinyon Script', fontPrimary: 'Cinzel', fontSecondary: 'Cinzel'
    },
    'xv-esencial': {
        type: 'html',
        color60: '#FDFBFB', color30: '#E89A9A', color10: '#C27A7A', text: '#444444',
        fontScript: 'Parisienne', fontPrimary: 'Outfit', fontSecondary: 'Outfit'
    },
    'xv-premium': {
        type: 'config',
        color60: '#1A1A1A', color30: '#722F37', color10: '#4A1C24', text: '#F0E6D2',
        fontScript: 'Dancing Script', fontPrimary: 'Cormorant Garamond', fontSecondary: 'Cormorant Garamond'
    },
    'xv-vip': {
        type: 'config',
        color60: '#0A1128', color30: '#4A6B9C', color10: '#8CA5D3', text: '#E0E4CE',
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
                    // Mapeo retrocompatible para configuraciones VIP/Premium que usan config.js
                    WEDDING_CONFIG.theme.bgColor = theme.color60;
                    WEDDING_CONFIG.theme.secondaryColor = theme.color30;
                    WEDDING_CONFIG.theme.primaryColor = theme.color10;
                    WEDDING_CONFIG.theme.textColor = theme.text;
                    
                    WEDDING_CONFIG.theme.color60 = theme.color60;
                    WEDDING_CONFIG.theme.color30 = theme.color30;
                    WEDDING_CONFIG.theme.color10 = theme.color10;

                    WEDDING_CONFIG.theme.fontScript = theme.fontScript;
                    WEDDING_CONFIG.theme.fontPrimary = theme.fontPrimary;
                    WEDDING_CONFIG.theme.fontSecondary = theme.fontSecondary;

                    const newContent = `/**
 * CONFIGURACION INYECTADA DESDE JSON (REGLA 60-30-10)
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
              /* Regla 60-30-10 */
              --inv-60: ${theme.color60};
              --inv-30: ${theme.color30};
              --inv-10: ${theme.color10};
              --inv-text: ${theme.text};
              
              /* Compatibilidad legacy y alias */
              --bg-color: var(--inv-60);
              --secondary-color: var(--inv-30);
              --primary-color: var(--inv-10);
              --text-color: var(--inv-text);
              
              --font-script: '${theme.fontScript}', cursive;
              --font-primary: '${theme.fontPrimary}', sans-serif;
              --font-secondary: '${theme.fontSecondary}', sans-serif;
          }
        body { background-color: var(--inv-60); color: var(--text-color); }
        h1, h2, .script-title { font-family: var(--font-script); }
    </style>`;
            
            // Insertar justo antes de </head>
            html = html.replace('</head>', `    ${styleBlock}\n</head>`);
            fs.writeFileSync(indexPath, html, 'utf-8');
            console.log(`Actualizado index.html en ${folder}`);
        }
    }
}
