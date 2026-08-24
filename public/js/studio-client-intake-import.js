(function () {
  "use strict";

  const YES_VALUES = new Set(["si", "sí", "yes", "true", "1", "activo"]);
  const DIRECT_FIELDS = [
    "title", "event_type", "bride_name", "groom_name", "honoree_name", "event_date", "event_time",
    "welcome_text", "dress_code", "dress_code_details", "children_note", "children_label",
    "bride_father_name", "bride_mother_name", "groom_father_name", "groom_mother_name",
    "father_name", "mother_name", "honor_witness_name", "godparents_text", "ceremony_name",
    "ceremony_address", "ceremony_map_url", "reception_name", "reception_address", "reception_map_url",
    "whatsapp_number", "whatsapp_number_secondary", "instagram_hashtag", "thankYouTitle", "thankYouSignature",
    "thankYouMessage", "hashtagSectionTitle", "hashtagSectionMessage", "music_title", "music_artist"
  ];

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
    const input = document.getElementById("client-intake-file");
    if (!button || !input) return;

    button.addEventListener("click", () => input.click());
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
