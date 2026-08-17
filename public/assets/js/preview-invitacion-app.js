/**
 * Visor Interno (Previewer) para la configuración normalizada de Invitta.
 * Lee invitta-configuracion.json y renderiza un prototipo.
 */

document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "var(--sys-accent)";
        dropZone.style.background = "#fdfaf5";
    });
    dropZone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "var(--sys-border)";
        dropZone.style.background = "#fafafa";
    });
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
});

let loadedConfig = null;

function handleFile(file) {
    const errorMsg = document.getElementById("errorMsg");
    errorMsg.style.display = "none";

    if (!file.name.endsWith(".json")) {
        showError("Por favor, selecciona un archivo .json válido.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.meta || !data.event || !data.visual) {
                showError("El archivo no parece ser una configuración Invitta válida.");
                return;
            }
            loadedConfig = data;
            processConfig(data);
        } catch (error) {
            showError("Error al parsear el archivo JSON.");
        }
    };
    reader.readAsText(file);
}

function showError(msg) {
    const errorMsg = document.getElementById("errorMsg");
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
}

function getPaletteColors(paletteName, customPalette) {
    // Default fallback
    const p = { bg: "#ffffff", surface: "#f8f8f8", accent: "#d4af37", text: "#333333", muted: "#888888" };
    
    switch(paletteName) {
        case "Rosa Champagne": return { bg: "#faf8f5", surface: "#fdfbfa", accent: "#c48473", text: "#4a4443", muted: "#8a7a65" };
        case "Lavanda Dream": return { bg: "#f8f6fa", surface: "#ffffff", accent: "#9d8cb3", text: "#3b3542", muted: "#8b8594" };
        case "Cool Blue": return { bg: "#f4f7f9", surface: "#ffffff", accent: "#6c8da8", text: "#2c3e50", muted: "#7f8c8d" };
        case "Olive Romance": return { bg: "#f5f6f4", surface: "#ffffff", accent: "#7a8471", text: "#3a4035", muted: "#8a9481" };
        case "Terracotta Sunset": return { bg: "#faf5f3", surface: "#ffffff", accent: "#b86b53", text: "#4a332d", muted: "#9a837d" };
        case "Plum Noir VIP": return { bg: "#1a1514", surface: "#2a2220", accent: "#fadcd4", text: "#f0eade", muted: "#8a7a65" };
        case "Jade Garden": return { bg: "#f0f4f1", surface: "#ffffff", accent: "#4a7c59", text: "#233d2b", muted: "#708c78" };
        case "Personalizada": 
            // Return elegant neutral + custom palette note in UI
            return { bg: "#f9f9f9", surface: "#ffffff", accent: "#999999", text: "#111111", muted: "#666666", customNote: customPalette };
        default: return p;
    }
}

function getTypography(typographyName, handwrittenName) {
    // defaults
    let t = { title: "'Playfair Display', serif", body: "'Montserrat', sans-serif", accent: "'Great Vibes', cursive" };
    
    switch(typographyName) {
        case "Clásica Editorial": t.title = "'Cormorant Garamond', serif"; t.body = "'Jost', sans-serif"; break;
        case "Romántica Fina": t.title = "'Playfair Display', serif"; t.body = "'Montserrat', sans-serif"; break;
        case "Lujo Nocturno": t.title = "'Bodoni Moda', serif"; t.body = "'Lato', sans-serif"; break;
        case "Moderna Minimal": t.title = "'Libre Baskerville', serif"; t.body = "'Inter', sans-serif"; break;
        case "Jardín Romántico": t.title = "'Lora', serif"; t.body = "'Nunito Sans', sans-serif"; break;
        case "Glam Editorial": t.title = "'Cinzel', serif"; t.body = "'Raleway', sans-serif"; break;
    }

    if (handwrittenName && handwrittenName !== "No, prefiero tipografía limpia") {
        if (handwrittenName.includes("Romántica")) t.accent = "'Great Vibes', cursive";
        else if (handwrittenName.includes("Moderna")) t.accent = "'Parisienne', cursive";
        else if (handwrittenName.includes("Lujo")) t.accent = "'Allura', cursive";
        else if (handwrittenName.includes("Orgánica")) t.accent = "'Sacramento', cursive";
        else if (handwrittenName.includes("Sofisticada")) t.accent = "'Alex Brush', cursive";
    } else {
        t.accent = t.title; // Fallback a title limpia
    }

    return t;
}

function processConfig(data) {
    // 1. Ocultar Uploader, mostrar UI
    document.getElementById("uploadContainer").style.display = "none";
    document.getElementById("sidebar").style.display = "flex";
    document.getElementById("previewWrapper").style.display = "flex";
    document.getElementById("actionsBar").style.display = "flex";

    // 2. Llenar Metadata HUD
    document.getElementById("metaTemplateId").textContent = data.template.id || "N/A";
    document.getElementById("metaTemplateName").textContent = data.template.name || "N/A";
    document.getElementById("metaTemplateLevel").textContent = `${data.template.level} / ${data.template.type}`;
    document.getElementById("metaPalette").textContent = data.visual.palette || "N/A";
    document.getElementById("metaTypo").textContent = data.visual.typography || "N/A";
    document.getElementById("metaHandwritten").textContent = data.visual.handwritten || "N/A";
    document.getElementById("metaStyle").textContent = data.visual.style || "N/A";

    // 3. Aplicar Estilos CSS Custom Properties al body
    const palette = getPaletteColors(data.visual.palette, data.visual.customPalette);
    const fonts = getTypography(data.visual.typography, data.visual.handwritten);
    
    document.documentElement.style.setProperty("--bg-color", palette.bg);
    document.documentElement.style.setProperty("--surface-color", palette.surface);
    document.documentElement.style.setProperty("--accent-color", palette.accent);
    document.documentElement.style.setProperty("--text-color", palette.text);
    document.documentElement.style.setProperty("--muted-color", palette.muted);
    
    document.documentElement.style.setProperty("--title-font", fonts.title);
    document.documentElement.style.setProperty("--body-font", fonts.body);
    document.documentElement.style.setProperty("--accent-font", fonts.accent);

    // 4. Renderizar HTML Dinámico
    const isBoda = data.event.type === "boda";
    let html = "";

    if (palette.customNote) {
        html += `<div style="background:#fff3cd; color:#856404; padding:10px; font-size:0.8rem;"><b>Nota Diseño Personalizado:</b> ${palette.customNote}</div>`;
    }

    // A. Portada
    html += `<div class="section" style="min-height: 80vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">`;
    if (isBoda) {
        html += `<div class="muted-text" style="margin-bottom:20px;">Nuestra Boda</div>`;
        html += `<div class="accent-text">${data.event.primaryName}</div>`;
        if (data.event.secondaryName) html += `<div class="accent-text" style="font-size:2rem; margin:10px 0;">&</div>`;
        if (data.event.secondaryName) html += `<div class="accent-text">${data.event.secondaryName}</div>`;
    } else {
        html += `<div class="muted-text" style="margin-bottom:20px;">Mis XV Años</div>`;
        html += `<div class="accent-text">${data.event.primaryName}</div>`;
    }
    
    html += `<div class="muted-text" style="margin-top:40px;">${data.event.dateText || data.event.countdownDateTime || ""}</div>`;
    if (data.event.quote) {
        html += `<div style="margin-top:40px; font-style:italic; font-size:0.9rem;">"${data.event.quote}"</div>`;
    }
    html += `</div>`;

    // B. Cuenta regresiva (simulada)
    if (data.event.countdownDateTime) {
        html += `<div class="section surface">`;
        html += `<h2>Faltan</h2>`;
        html += `<div style="font-size:2rem; font-family:var(--title-font); color:var(--accent-color); margin:20px 0;">00 : 00 : 00 : 00</div>`;
        html += `</div>`;
    }

    // C. Padres / Familia
    html += `<div class="section">`;
    html += `<div class="muted-text">Con la bendición de Dios y nuestros padres</div>`;
    if (data.family.hostParents.mother) html += `<h3 style="margin-top:20px;">${data.family.hostParents.mother}</h3>`;
    if (data.family.hostParents.father) html += `<h3>${data.family.hostParents.father}</h3>`;
    if (data.family.secondaryParents && (data.family.secondaryParents.mother || data.family.secondaryParents.father)) {
        html += `<div style="margin:20px 0; width:40px; height:1px; background:var(--accent-color); display:inline-block;"></div>`;
        if (data.family.secondaryParents.mother) html += `<h3>${data.family.secondaryParents.mother}</h3>`;
        if (data.family.secondaryParents.father) html += `<h3>${data.family.secondaryParents.father}</h3>`;
    }
    if (data.family.godparents) {
        html += `<div class="muted-text" style="margin-top:30px;">Padrinos</div>`;
        html += `<h3>${data.family.godparents}</h3>`;
    }
    html += `</div>`;

    // D. Ceremonia
    if (data.locations.ceremony && data.locations.ceremony.title) {
        html += `<div class="section surface">`;
        html += `<h2>${data.locations.ceremony.title}</h2>`;
        html += `<div style="font-size:1.2rem; color:var(--accent-color); margin-bottom:10px;">${data.locations.ceremony.time}</div>`;
        html += `<div style="font-weight:600;">${data.locations.ceremony.place}</div>`;
        html += `<div style="font-size:0.9rem; margin-bottom:20px;">${data.locations.ceremony.address}</div>`;
        html += `<button class="btn-preview"><i class="fa-solid fa-location-dot"></i> Ver ubicación</button>`;
        html += `</div>`;
    }

    // E. Recepción
    if (data.locations.reception && data.locations.reception.title) {
        html += `<div class="section">`;
        html += `<h2>${data.locations.reception.title}</h2>`;
        html += `<div style="font-size:1.2rem; color:var(--accent-color); margin-bottom:10px;">${data.locations.reception.time}</div>`;
        html += `<div style="font-weight:600;">${data.locations.reception.place}</div>`;
        html += `<div style="font-size:0.9rem; margin-bottom:20px;">${data.locations.reception.address}</div>`;
        html += `<button class="btn-preview"><i class="fa-solid fa-location-dot"></i> Ver ubicación</button>`;
        html += `</div>`;
    }

    // F. Itinerario
    if (data.itinerary && data.itinerary.length > 0) {
        html += `<div class="section surface">`;
        html += `<h2>Itinerario</h2>`;
        data.itinerary.forEach(iti => {
            html += `<div class="iti-item">`;
            html += `<div class="iti-time">${iti.time}</div>`;
            html += `<div class="iti-title">${iti.title}</div>`;
            if (iti.description) html += `<div style="font-size:0.85rem;">${iti.description}</div>`;
            html += `</div>`;
        });
        html += `</div>`;
    }

    // G. Dress code
    if (data.dressCode && data.dressCode.title) {
        html += `<div class="section">`;
        html += `<h2>${data.dressCode.title}</h2>`;
        if (data.dressCode.women && data.dressCode.women.desc) {
            html += `<div style="margin-bottom:15px;"><b>${data.dressCode.women.title}:</b> ${data.dressCode.women.desc}`;
            if (data.dressCode.women.note) html += `<br><span style="font-size:0.8rem; color:var(--muted-color);">${data.dressCode.women.note}</span>`;
            html += `</div>`;
        }
        if (data.dressCode.men && data.dressCode.men.desc) {
            html += `<div><b>${data.dressCode.men.title}:</b> ${data.dressCode.men.desc}</div>`;
        }
        html += `</div>`;
    }

    // H. Mesa de regalos
    if (data.registry && (data.registry.lluviaSobres || data.registry.options.length > 0)) {
        html += `<div class="section surface">`;
        html += `<h2>Mesa de Regalos</h2>`;
        if (data.registry.description) html += `<p style="margin-bottom:20px; font-size:0.9rem;">${data.registry.description}</p>`;
        if (data.registry.lluviaSobres) {
            html += `<div style="margin-bottom:20px;"><i class="fa-solid fa-envelope" style="font-size:2rem; color:var(--accent-color);"></i><br><b style="font-size:0.9rem;">Lluvia de Sobres</b></div>`;
        }
        data.registry.options.forEach(opt => {
            html += `<button class="btn-preview" style="display:block; width:100%; margin-bottom:10px;">${opt.name}</button>`;
        });
        html += `</div>`;
    }

    // I. Hospedaje
    if (data.lodging && data.lodging.enabled && data.lodging.options.length > 0) {
        html += `<div class="section">`;
        html += `<h2>Hospedaje sugerido</h2>`;
        if (data.lodging.description) html += `<p style="margin-bottom:20px; font-size:0.9rem;">${data.lodging.description}</p>`;
        data.lodging.options.forEach(opt => {
            html += `<div style="margin-bottom:20px;">`;
            html += `<h3>${opt.name}</h3>`;
            html += `<div style="font-size:0.85rem;">${opt.address}</div>`;
            html += `<div style="font-size:0.85rem; margin-bottom:10px;">${opt.phone}</div>`;
            if (opt.url) html += `<a href="#" style="color:var(--accent-color); font-size:0.85rem; font-weight:600;">Ver información</a>`;
            html += `</div>`;
        });
        html += `</div>`;
    }

    // J. RSVP
    if (data.rsvp && data.rsvp.title) {
        html += `<div class="section surface">`;
        html += `<h2>${data.rsvp.title}</h2>`;
        if (data.rsvp.description) html += `<p style="margin-bottom:20px; font-size:0.9rem;">${data.rsvp.description}</p>`;
        data.rsvp.whatsappNumbers.forEach(num => {
            html += `<button class="btn-preview" style="display:block; width:100%; margin-bottom:10px;"><i class="fa-brands fa-whatsapp"></i> Confirmar al ${num}</button>`;
        });
        html += `</div>`;
    }

    // K. Créditos
    html += `<div class="credits">Invitación digital creada con Invitta</div>`;

    document.getElementById("invitationContent").innerHTML = html;
}

function downloadPreviewHTML() {
    // Collect computed dynamic variables
    const bg = document.documentElement.style.getPropertyValue("--bg-color");
    const surface = document.documentElement.style.getPropertyValue("--surface-color");
    const accent = document.documentElement.style.getPropertyValue("--accent-color");
    const text = document.documentElement.style.getPropertyValue("--text-color");
    const muted = document.documentElement.style.getPropertyValue("--muted-color");
    const titleFont = document.documentElement.style.getPropertyValue("--title-font");
    const bodyFont = document.documentElement.style.getPropertyValue("--body-font");
    const accentFont = document.documentElement.style.getPropertyValue("--accent-font");

    const innerHTML = document.getElementById("invitationContent").innerHTML;

    // Create a standalone HTML document
    const staticHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Invitación</title>
    <!-- Incluyendo fuentes generadas -->
    <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Great+Vibes&family=Inter:wght@100..900&family=Jost:ital,wght@0,100..900;1,100..900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=Parisienne&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Raleway:ital,wght@0,100..900;1,100..900&family=Sacramento&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg-color: ${bg};
            --surface-color: ${surface};
            --accent-color: ${accent};
            --text-color: ${text};
            --muted-color: ${muted};
            --title-font: ${titleFont};
            --body-font: ${bodyFont};
            --accent-font: ${accentFont};
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background-color: #333; display: flex; justify-content: center; }
        
        .invitation-container { 
            width: 100%; max-width: 420px; 
            background: var(--bg-color); 
            min-height: 100vh;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        
        /* Mismos estilos que el previewer */
        .invitation-content { font-family: var(--body-font); color: var(--text-color); line-height: 1.6; text-align: center; }
        .section { padding: 50px 24px; border-bottom: 1px solid var(--surface-color); }
        .section:last-child { border-bottom: none; }
        .section.surface { background-color: var(--surface-color); }
        h1, h2, h3 { font-family: var(--title-font); font-weight: normal; margin-bottom: 16px; }
        .accent-text { font-family: var(--accent-font); color: var(--accent-color); font-size: 3rem; margin: 20px 0; line-height: 1.2; }
        .muted-text { color: var(--muted-color); font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase; }
        .btn-preview { display: inline-block; padding: 12px 24px; background-color: var(--accent-color); color: var(--bg-color); text-decoration: none; border-radius: 4px; font-family: var(--body-font); font-size: 0.85rem; letter-spacing: 1px; text-transform: uppercase; margin-top: 16px; border: none; }
        .iti-item { margin-bottom: 20px; }
        .iti-time { font-family: var(--title-font); font-size: 1.2rem; color: var(--accent-color); }
        .iti-title { font-weight: 600; margin-top: 4px; }
        .credits { padding: 30px; font-size: 0.75rem; color: var(--muted-color); background: var(--text-color); text-align: center; }
    </style>
</head>
<body>
    <div class="invitation-container">
        <div class="invitation-content">
            ${innerHTML}
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([staticHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "preview-invitacion.html";
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
