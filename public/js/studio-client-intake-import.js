(function () {
  "use strict";

  const YES_VALUES = new Set(["si", "sí", "yes", "true", "1", "activo"]);
  const CLIENT_FIELDS = [
    ["title", "Datos principales", "Título de la invitación", "", "Ej. Nuestra boda"],
    ["event_type", "Datos principales", "Tipo de evento", "boda", "boda, xv, bautizo, cumpleanos u otro"],
    ["bride_name", "Datos principales", "Nombre de la novia", "", ""],
    ["groom_name", "Datos principales", "Nombre del novio", "", ""],
    ["honoree_name", "Datos principales", "Nombre de festejado/a (si no es boda)", "", ""],
    ["event_date", "Datos principales", "Fecha del evento", "", "AAAA-MM-DD"],
    ["event_time", "Datos principales", "Hora de inicio", "", "HH:MM, por ejemplo 18:30"],
    ["welcome_text", "Mensaje", "Mensaje de bienvenida", "", ""],
    ["dress_code", "Mensaje", "Código de vestimenta", "", ""],
    ["dress_code_details", "Mensaje", "Indicaciones de vestimenta", "", ""],
    ["children_note", "Mensaje", "Nota sobre niños (opcional)", "", ""],
    ["children_label", "Mensaje", "Título para la nota de niños", "", ""],
    ["bride_father_name", "Familia", "Padre de la novia", "", ""],
    ["bride_mother_name", "Familia", "Madre de la novia", "", ""],
    ["groom_father_name", "Familia", "Padre del novio", "", ""],
    ["groom_mother_name", "Familia", "Madre del novio", "", ""],
    ["father_name", "Familia", "Padre de festejado/a (si no es boda)", "", ""],
    ["mother_name", "Familia", "Madre de festejado/a (si no es boda)", "", ""],
    ["honor_witness_name", "Familia", "Testigo de honor (opcional)", "", ""],
    ["godparents_text", "Familia", "Padrinos (una línea por participación)", "", "Padrinos de honor: Carlos y Ana"],
    ["ceremony_name", "Ceremonia", "Lugar de ceremonia", "", ""],
    ["ceremony_address", "Ceremonia", "Dirección de ceremonia", "", ""],
    ["ceremony_map_url", "Ceremonia", "Enlace de mapa de ceremonia", "", "https://maps.app.goo.gl/..."],
    ["reception_name", "Recepción", "Lugar de recepción", "", ""],
    ["reception_address", "Recepción", "Dirección de recepción", "", ""],
    ["reception_map_url", "Recepción", "Enlace de mapa de recepción", "", "https://maps.app.goo.gl/..."],
    ["shared_album_enabled", "Funciones", "Activar álbum colaborativo", "No", "Sí o No"],
    ["whatsapp_number", "Contacto", "WhatsApp de confirmaciones", "", "52 + 10 dígitos, sin espacios"],
    ["whatsapp_number_secondary", "Contacto", "Segundo WhatsApp (opcional)", "", ""],
    ["instagram_hashtag", "Cierre", "Hashtag de Instagram (opcional)", "", ""],
    ["thankYouTitle", "Cierre", "Título de despedida", "", ""],
    ["thankYouSignature", "Cierre", "Firma de despedida", "", ""],
    ["thankYouMessage", "Cierre", "Mensaje de despedida", "", ""],
    ["hashtagSectionTitle", "Cierre", "Título de sección hashtag", "", ""],
    ["hashtagSectionMessage", "Cierre", "Mensaje para hashtag", "", ""],
    ["music_title", "Música", "Nombre de canción (opcional)", "", ""],
    ["music_artist", "Música", "Artista (opcional)", "", ""]
  ];
  const DIRECT_FIELDS = CLIENT_FIELDS.map(([id]) => id).filter(id => id !== "shared_album_enabled");

  function asText(value) {
    return value == null ? "" : String(value).trim();
  }

  function isYes(value) {
    return YES_VALUES.has(asText(value).toLocaleLowerCase("es-MX"));
  }

  function showMessage(message, type) {
    const target = document.getElementById(type === "error" ? "form-error" : "form-success");
    if (!target) return;
    target.textContent = message;
    target.style.display = "block";
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function setValue(id, value) {
    const element = document.getElementById(id);
    if (!element || value === undefined) return;
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setChecked(id, value) {
    const element = document.getElementById(id);
    if (!element || value === undefined) return;
    element.checked = isYes(value);
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function sheetRows(workbook, name) {
    const sheet = workbook.Sheets[name];
    return sheet ? window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false }) : [];
  }

  function readDataSheet(workbook) {
    const rows = sheetRows(workbook, "Datos");
    const values = new Map();
    rows.slice(1).forEach(row => {
      const key = asText(row[0]);
      if (key) values.set(key, asText(row[3]));
    });
    return values;
  }

  function addSheet(workbook, name, rows, widths) {
    const sheet = window.XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = widths.map(width => ({ wch: width }));
    window.XLSX.utils.book_append_sheet(workbook, sheet, name);
  }

  function downloadClientIntake() {
    if (!window.XLSX) throw new Error("No fue posible preparar el formulario. Revisa tu conexión e inténtalo de nuevo.");
    const workbook = window.XLSX.utils.book_new();
    addSheet(workbook, "Instrucciones", [
      ["Formulario de datos · Invitación digital Invitta"],
      [""],
      ["1. En Datos, llena únicamente la columna Respuesta. No modifiques Clave."],
      ["2. Usa AAAA-MM-DD para fecha y HH:MM para hora."],
      ["3. Completa Itinerario, Hospedaje y Regalos sólo si aplican."],
      ["4. Conserva el archivo en formato .xlsx y envíalo de vuelta a tu asesor."],
      ["5. Las fotos, música y diseño se cargan por separado en Invitta Studio."]
    ], [100]);
    addSheet(workbook, "Datos", [["Clave", "Sección", "Campo", "Respuesta", "Ejemplo o formato"], ...CLIENT_FIELDS], [26, 18, 38, 45, 36]);
    addSheet(workbook, "Itinerario", [["Hora", "Actividad"], ...Array.from({ length: 10 }, () => ["", ""])], [18, 54]);
    addSheet(workbook, "Hospedaje", [["Activo (Sí/No)", "Nombre", "Teléfono", "Dirección", "Enlace de mapa"], ...Array.from({ length: 3 }, () => ["No", "", "", "", ""])], [18, 30, 20, 42, 42]);
    addSheet(workbook, "Regalos", [["Opción", "Tipo", "Activo (Sí/No)", "Nombre / banco", "URL / CLABE", "Descripción o indicaciones"], ["1", "Mesa en línea", "No", "", "", ""], ["2", "Mesa en línea", "No", "", "", ""], ["3", "Transferencia", "No", "", "", ""]], [12, 20, 18, 30, 42, 42]);
    const bytes = window.XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "Formulario-Invitta-Cliente.xlsx";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function applyTimeline(workbook) {
    const rows = sheetRows(workbook, "Itinerario").slice(1);
    const lines = rows
      .map(row => [asText(row[0]), asText(row[1])])
      .filter(([time, activity]) => time || activity)
      .map(([time, activity]) => `${time}${time && activity ? " / " : ""}${activity}`);
    if (lines.length) setValue("itineraryText", lines.join("\n"));
  }

  function applyLodging(workbook) {
    const rows = sheetRows(workbook, "Hospedaje").slice(1, 4);
    rows.forEach((row, index) => {
      const position = index + 1;
      setChecked(`lodging_${position}_enabled`, row[0]);
      setValue(`lodging_${position}_name`, asText(row[1]));
      setValue(`lodging_${position}_phone`, asText(row[2]));
      setValue(`lodging_${position}_address`, asText(row[3]));
      setValue(`lodging_${position}_map_url`, asText(row[4]));
    });
  }

  function applyGifts(workbook) {
    const rows = sheetRows(workbook, "Regalos").slice(1, 4);
    rows.forEach((row, index) => {
      const position = index + 1;
      const type = asText(row[1]).toLocaleLowerCase("es-MX");
      const active = row[2];
      if (position === 3 || type.includes("transfer")) {
        setChecked("gift_3_enabled", active);
        setValue("gift_3_bank", asText(row[3]));
        setValue("gift_3_clabe", asText(row[4]));
        setValue("gift_3_note", asText(row[5]));
      } else {
        setChecked(`gift_${position}_enabled`, active);
        setValue(`gift_${position}_title`, asText(row[3]));
        setValue(`gift_${position}_url`, asText(row[4]));
        setValue(`gift_${position}_description`, asText(row[5]));
      }
    });
  }

  async function importClientIntake(file) {
    if (!window.XLSX) throw new Error("No fue posible cargar el lector de archivos. Revisa tu conexión e inténtalo de nuevo.");
    const data = await file.arrayBuffer();
    const workbook = window.XLSX.read(data, { type: "array" });
    if (!workbook.SheetNames.includes("Datos")) throw new Error("Este archivo no es un formulario de Invitta válido: falta la hoja Datos.");

    const values = readDataSheet(workbook);
    const title = values.get("title");
    if (!title && !values.get("bride_name") && !values.get("honoree_name")) {
      throw new Error("El formulario no contiene datos suficientes. Completa al menos el título o el nombre principal.");
    }

    DIRECT_FIELDS.forEach(id => setValue(id, values.get(id)));
    if (typeof window.setEventTimeSelects === "function") {
      window.setEventTimeSelects(values.get("event_time") || "");
    }
    setChecked("shared_album_enabled", values.get("shared_album_enabled"));
    applyTimeline(workbook);
    applyLodging(workbook);
    applyGifts(workbook);

    if (typeof window.updateWeddingNameFields === "function") window.updateWeddingNameFields();
    document.getElementById("title")?.dispatchEvent(new Event("input", { bubbles: true }));
    showMessage("Formulario importado. Revisa la vista previa y guarda los cambios cuando estés listo.", "success");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("import-client-intake");
    const downloadButton = document.getElementById("download-client-intake");
    const input = document.getElementById("client-intake-file");
    if (!button || !input) return;

    button.addEventListener("click", () => input.click());
    downloadButton?.addEventListener("click", () => {
      try {
        downloadClientIntake();
      } catch (error) {
        console.error("[Invitta Intake]", error);
        showMessage(error.message || "No se pudo crear el formulario.", "error");
      }
    });
    input.addEventListener("change", async () => {
      const [file] = input.files || [];
      input.value = "";
      if (!file) return;
      if (!confirm("El formulario llenará los campos visibles, pero no guardará nada hasta que pulses Guardar cambios. ¿Continuar?")) return;
      button.disabled = true;
      const label = button.textContent;
      button.textContent = "Importando...";
      try {
        await importClientIntake(file);
      } catch (error) {
        console.error("[Invitta Intake]", error);
        showMessage(error.message || "No se pudo importar este formulario.", "error");
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    });
  });
})();
