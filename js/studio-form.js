/**
 * studio-form.js
 * Lógica para crear y editar invitaciones en Invitta Studio
 */

document.addEventListener("DOMContentLoaded", async () => {
  const session = await window.studioAuth.requireSession();
  if (!session) return;

  const db = window.studioAuth.db;
  const urlParams = new URLSearchParams(window.location.search);
  const inviteId = urlParams.get("id");
  const isEditMode = !!inviteId;
  
  // Elementos del DOM
  const form = document.getElementById("invitation-form");
  const loading = document.getElementById("loading-indicator");
  const errorAlert = document.getElementById("form-error");
  const successAlert = document.getElementById("form-success");
  const pageTitle = document.getElementById("page-title");
  const saveBtn = document.getElementById("save-btn");

  let currentStudioId = localStorage.getItem("invitta_studio_id");

  // Si no tenemos el studio_id, lo buscamos
  if (!currentStudioId) {
    const { data: studio } = await db
      .from("studios")
      .select("id")
      .eq("user_id", session.user.id)
      .single();
    if (studio) {
      currentStudioId = studio.id;
      localStorage.setItem("invitta_studio_id", currentStudioId);
    } else {
      errorAlert.textContent = "No se pudo encontrar tu estudio.";
      errorAlert.style.display = "block";
      loading.style.display = "none";
      return;
    }
  }

  // Si es modo edición, cargar datos
  if (isEditMode) {
    pageTitle.textContent = "Editar Invitación";
    await loadInvitationData(inviteId);
  } else {
    // Modo creación
    loading.style.display = "none";
    form.style.display = "block";
  }

  // Función para cargar datos
  async function loadInvitationData(id) {
    const { data, error } = await db
      .from("studio_invitations")
      .select("*")
      .eq("id", id)
      .eq("studio_id", currentStudioId)
      .single();

    loading.style.display = "none";

    if (error || !data) {
      errorAlert.textContent = "Error al cargar la invitación o no tienes permiso.";
      errorAlert.style.display = "block";
      return;
    }

    // Llenar formulario
    document.getElementById("title").value = data.title || "";
    document.getElementById("slug").value = data.slug || "";
    document.getElementById("event_type").value = data.event_type || "boda";
    document.getElementById("honoree_name").value = data.honoree_name || "";
    document.getElementById("event_date").value = data.event_date || "";
    document.getElementById("event_time").value = data.event_time || "";
    document.getElementById("welcome_text").value = data.welcome_text || "";
    document.getElementById("color_primary").value = data.color_primary || "#C9A46A";
    document.getElementById("color_secondary").value = data.color_secondary || "#F7E7D7";
    document.getElementById("ceremony_name").value = data.ceremony_name || "";
    document.getElementById("ceremony_address").value = data.ceremony_address || "";
    document.getElementById("ceremony_map_url").value = data.ceremony_map_url || "";
    document.getElementById("reception_name").value = data.reception_name || "";
    document.getElementById("reception_address").value = data.reception_address || "";
    document.getElementById("reception_map_url").value = data.reception_map_url || "";
    document.getElementById("gift_table_url").value = data.gift_table_url || "";
    document.getElementById("dress_code").value = data.dress_code || "";
    document.getElementById("whatsapp_number").value = data.whatsapp_number || "";
    document.getElementById("published").checked = !!data.published;

    form.style.display = "block";
  }

  // Guardar datos
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorAlert.style.display = "none";
    successAlert.style.display = "none";
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";

    const payload = {
      title: document.getElementById("title").value,
      slug: document.getElementById("slug").value,
      event_type: document.getElementById("event_type").value,
      honoree_name: document.getElementById("honoree_name").value,
      event_date: document.getElementById("event_date").value || null,
      event_time: document.getElementById("event_time").value || null,
      welcome_text: document.getElementById("welcome_text").value,
      color_primary: document.getElementById("color_primary").value,
      color_secondary: document.getElementById("color_secondary").value,
      ceremony_name: document.getElementById("ceremony_name").value,
      ceremony_address: document.getElementById("ceremony_address").value,
      ceremony_map_url: document.getElementById("ceremony_map_url").value,
      reception_name: document.getElementById("reception_name").value,
      reception_address: document.getElementById("reception_address").value,
      reception_map_url: document.getElementById("reception_map_url").value,
      gift_table_url: document.getElementById("gift_table_url").value,
      dress_code: document.getElementById("dress_code").value,
      whatsapp_number: document.getElementById("whatsapp_number").value,
      published: document.getElementById("published").checked,
      // Arrays por defecto según instrucciones
      gallery_urls: [],
      itinerary: [],
      template_id: null,
      main_photo_url: null,
      music_url: null,
    };

    let result;
    if (isEditMode) {
      // Actualizar
      result = await db
        .from("studio_invitations")
        .update(payload)
        .eq("id", inviteId)
        .eq("studio_id", currentStudioId);
    } else {
      // Insertar
      payload.studio_id = currentStudioId;
      result = await db
        .from("studio_invitations")
        .insert([payload]);
    }

    if (result.error) {
      console.error("Error al guardar:", result.error);
      errorAlert.textContent = "Error al guardar. Puede que el slug ya esté en uso u otro error de validación.";
      errorAlert.style.display = "block";
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar Invitación";
    } else {
      successAlert.textContent = "Invitación guardada exitosamente. Redirigiendo...";
      successAlert.style.display = "block";
      setTimeout(() => {
        window.location.href = "/administracion/studio-dashboard.html";
      }, 1500);
    }
  });

});
