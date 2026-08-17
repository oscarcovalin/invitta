/**
 * Lógica para la generación y conversión del JSON del cuestionario
 * a la estructura normalizada de la configuración de invitación (Fase 7D).
 */

document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");

    // Eventos de Drag & Drop
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
    });
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
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

let finalConfigObject = null;

function handleFile(file) {
    if (!file.name.endsWith(".json")) {
        alert("Por favor, selecciona un archivo .json válido.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            processClientData(data);
        } catch (error) {
            console.error(error);
            alert("Error al parsear el archivo JSON. Verifica que el archivo no esté corrupto.");
        }
    };
    reader.readAsText(file);
}

function processClientData(clientData) {
    // 1. Ocultar Uploader, Mostrar UI de Preview
    document.getElementById("uploadCard").style.display = "none";
    document.querySelectorAll(".preview-container").forEach(el => el.style.display = "block");
    document.getElementById("actionsFooter").style.display = "flex";

    // 2. Limpiar advertencias previas
    const warningsContainer = document.getElementById("warningsContainer");
    warningsContainer.innerHTML = "";
    warningsContainer.style.display = "none";
    
    // 3. Mapear datos a invitationConfig
    const config = {
        meta: {
            source: "invitta-client-questionnaire",
            version: "1.0",
            generatedAt: new Date().toISOString()
        },
        template: clientData.visual?.template || {},
        event: {
            type: clientData.eventType || "",
            packageLevel: clientData.paqueteInteres || "",
            primaryName: clientData.brideName || "",
            secondaryName: clientData.groomName || "",
            initials: clientData.brideGroomInitials || "",
            hashtag: clientData.hashtag || "",
            quote: clientData.quote || "",
            dateText: clientData.weddingDateText || "",
            countdownDateTime: clientData.countdownDate?.targetDateTime || ""
        },
        family: {
            hostParents: clientData.family?.brideParents || {},
            secondaryParents: clientData.family?.groomParents || {},
            godparents: clientData.family?.godparents || ""
        },
        locations: {
            ceremony: {
                title: clientData.ceremonia?.title || "",
                time: clientData.ceremonia?.time || "",
                place: clientData.ceremonia?.place || "",
                address: [clientData.ceremonia?.address1, clientData.ceremonia?.address2].filter(Boolean).join(", "),
                mapQuery: clientData.ceremonia?.mapQuery || ""
            },
            reception: {
                title: clientData.recepcion?.title || "",
                time: clientData.recepcion?.time || "",
                place: clientData.recepcion?.place || "",
                address: [clientData.recepcion?.address1, clientData.recepcion?.address2].filter(Boolean).join(", "),
                mapQuery: clientData.recepcion?.mapQuery || ""
            }
        },
        itinerary: clientData.itinerary || [],
        dressCode: clientData.dressCode || {},
        registry: {
            description: clientData.registry?.description || "",
            options: [clientData.registry?.registry1, clientData.registry?.registry2].filter(r => r && r.name && r.url),
            lluviaSobres: !!clientData.registry?.lluviaSobres
        },
        lodging: {
            enabled: !!clientData.incluirHospedaje,
            description: clientData.hospedaje?.description || "",
            options: clientData.hospedaje?.opciones || []
        },
        rsvp: {
            title: clientData.rsvp?.title || "",
            description: clientData.rsvp?.description || "",
            whatsappNumbers: [clientData.rsvp?.whatsappNumber, clientData.rsvp?.whatsappNumber2].filter(Boolean)
        },
        visual: {
            palette: clientData.visual?.palette || "",
            customPalette: clientData.visual?.customPalette || "",
            typography: clientData.visual?.typography || "",
            handwritten: clientData.visual?.handwritten || "",
            style: clientData.visual?.style || "",
            photos: clientData.visual?.photos || ""
        }
    };

    finalConfigObject = config;

    // 4. Validaciones y Advertencias
    let warnings = [];
    if (!config.template || !config.template.id) {
        warnings.push("Este cuestionario no tiene plantilla seleccionada.");
    }
    if (!config.event.primaryName) {
        warnings.push("Falta nombre principal del evento.");
    }
    if (!config.event.dateText && !config.event.countdownDateTime) {
        warnings.push("Falta fecha legible o fecha de cuenta regresiva.");
    }

    if (warnings.length > 0) {
        warningsContainer.style.display = "block";
        warnings.forEach(msg => {
            const div = document.createElement("div");
            div.className = "warning-alert";
            div.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>${msg}</span>`;
            warningsContainer.appendChild(div);
        });
    }

    // 5. Mostrar Resumen Visual
    const summaryData = [
        { label: "Tipo de Evento", value: config.event.type },
        { label: "Paquete", value: config.event.packageLevel },
        { label: "Nombre Principal", value: config.event.primaryName },
        { label: "Nombre Secundario", value: config.event.secondaryName || "N/A" },
        { label: "Fecha", value: config.event.dateText || "N/A" },
        { label: "Plantilla", value: config.template.name || "N/A" },
        { label: "Paleta", value: config.visual.palette === "Personalizada" ? `Custom (${config.visual.customPalette})` : config.visual.palette },
        { label: "Tipografía", value: config.visual.typography },
        { label: "Estilo Visual", value: config.visual.style },
        { label: "Fotos", value: config.visual.photos }
    ];

    const summaryGrid = document.getElementById("summaryGrid");
    summaryGrid.innerHTML = "";
    summaryData.forEach(item => {
        const div = document.createElement("div");
        div.className = "summary-item";
        div.innerHTML = `
            <div class="summary-label">${item.label}</div>
            <div class="summary-value">${item.value || "-"}</div>
        `;
        summaryGrid.appendChild(div);
    });

    // 6. Mostrar Vista Previa JSON
    document.getElementById("jsonPreview").textContent = JSON.stringify(config, null, 2);
}

function downloadConfig() {
    if (!finalConfigObject) return;
    
    const dataStr = JSON.stringify(finalConfigObject, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "invitta-configuracion.json";
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
