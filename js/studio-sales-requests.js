(function () {
  "use strict";

  const statusLabels = {
    new: "Nueva",
    contacted: "Contactada",
    in_progress: "En proceso",
    won: "Ganada",
    lost: "Descartada"
  };

  function formatDate(value) {
    if (!value) return "Por definir";
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? "Por definir" : date.toLocaleDateString("es-MX");
  }

  function formatCreatedAt(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
  }

  function buildField(label, value) {
    const field = document.createElement("div");
    field.className = "sales-request-field";
    const fieldLabel = document.createElement("span");
    fieldLabel.className = "sales-request-label";
    fieldLabel.textContent = label;
    const fieldValue = document.createElement("span");
    fieldValue.className = "sales-request-value";
    fieldValue.textContent = value || "Por definir";
    field.append(fieldLabel, fieldValue);
    return field;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const session = await window.studioAuth.requireSession();
    if (!session) return;

    const db = window.studioAuth.db;
    const studioName = document.getElementById("sales-studio-name");
    const status = document.getElementById("sales-status");
    const list = document.getElementById("sales-request-list");
    const empty = document.getElementById("sales-empty");
    const filter = document.getElementById("sales-filter");
    let requests = [];

    document.getElementById("sales-logout-btn").addEventListener("click", () => window.studioAuth.logout());

    const { data: studios } = await db.rpc("current_invitta_studio");
    const studio = Array.isArray(studios) ? studios[0] : null;
    studioName.textContent = studio?.name || "Invitta Studio";

    const { data: isSalesOperator, error: roleError } = await db
      .rpc("is_invitta_sales_operator");

    if (roleError || !isSalesOperator) {
      status.textContent = "Este panel está disponible únicamente para el equipo comercial de Invitta.";
      return;
    }

    function render() {
      const selectedStatus = filter.value;
      const visible = selectedStatus === "all"
        ? requests
        : requests.filter((request) => request.status === selectedStatus);
      list.replaceChildren();
      empty.style.display = visible.length ? "none" : "block";

      visible.forEach((request) => {
        const item = document.createElement("article");
        item.className = "sales-request-item";

        const top = document.createElement("div");
        top.className = "sales-request-top";
        const heading = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = request.client_name;
        const meta = document.createElement("p");
        meta.className = "sales-request-meta";
        meta.textContent = `${request.client_phone} · ${formatCreatedAt(request.created_at)}`;
        heading.append(title, meta);
        const badge = document.createElement("span");
        badge.className = "badge badge-media";
        badge.textContent = statusLabels[request.status] || "Nueva";
        top.append(heading, badge);

        const grid = document.createElement("div");
        grid.className = "sales-request-grid";
        grid.append(
          buildField("Evento", request.event_type),
          buildField("Fecha", formatDate(request.event_date)),
          buildField("Ciudad", request.event_city),
          buildField("Diseño", request.design_name),
          buildField("Paquete", request.package_tier),
          buildField("Paleta", request.palette_preference),
          buildField("Tipografía", request.typography_preference)
        );

        const notes = document.createElement("p");
        notes.className = "sales-request-notes";
        notes.textContent = request.notes || "Sin notas adicionales.";

        const actions = document.createElement("div");
        actions.className = "sales-request-actions";
        const statusSelect = document.createElement("select");
        statusSelect.className = "form-control";
        Object.entries(statusLabels).forEach(([value, label]) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          option.selected = value === request.status;
          statusSelect.appendChild(option);
        });
        statusSelect.addEventListener("change", async () => {
          statusSelect.disabled = true;
          const updates = { status: statusSelect.value };

          if (!request.assigned_studio_id && studio?.id) {
            updates.assigned_studio_id = studio.id;
            updates.claimed_by = session.user.id;
            updates.claimed_at = new Date().toISOString();
          }

          let updateQuery = db
            .from("invitation_requests")
            .update(updates)
            .eq("id", request.id);

          if (!request.assigned_studio_id) updateQuery = updateQuery.is("assigned_studio_id", null);

          const { data: updatedRequest, error } = await updateQuery
            .select("assigned_studio_id, status")
            .single();
          statusSelect.disabled = false;
          if (error) {
            console.error("No se pudo actualizar la solicitud:", error);
            status.textContent = "No se pudo actualizar la solicitud.";
            statusSelect.value = request.status;
            return;
          }
          request.status = updatedRequest?.status || statusSelect.value;
          request.assigned_studio_id = updatedRequest?.assigned_studio_id || request.assigned_studio_id;
          render();
        });

        const createButton = document.createElement("a");
        createButton.className = "btn btn-primary btn-small";
        createButton.textContent = request.converted_invitation_id ? "Abrir invitacion" : "Crear invitacion";
        createButton.href = request.converted_invitation_id
          ? `/administracion/studio-invitacion-form.html?id=${encodeURIComponent(request.converted_invitation_id)}`
          : `/administracion/studio-invitacion-form.html?request=${encodeURIComponent(request.id)}`;
        actions.append(statusSelect, createButton);
        item.append(top, grid, notes, actions);
        list.appendChild(item);
      });
    }

    async function loadRequests() {
      status.textContent = "Cargando solicitudes...";
      const { data, error } = await db
        .from("invitation_requests")
        .select("id, client_name, client_phone, event_type, design_name, requested_template_id, package_tier, palette_preference, typography_preference, event_date, event_city, notes, status, assigned_studio_id, created_at, converted_invitation_id")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("No se pudieron cargar las solicitudes:", error);
        status.textContent = "No tienes acceso comercial o la migracion aun no se ha aplicado.";
        return;
      }

      requests = data || [];
      status.textContent = `${requests.length} solicitud${requests.length === 1 ? "" : "es"}`;
      render();
    }

    filter.addEventListener("change", render);
    loadRequests();
  });
})();
