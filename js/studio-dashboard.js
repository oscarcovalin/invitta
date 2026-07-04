/**
 * studio-dashboard.js
 * Lógica del dashboard de Invitta Studio
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Proteger ruta
  const session = await window.studioAuth.requireSession();
  if (!session) return;

  const db = window.studioAuth.db;
  let currentStudioId = null;

  // Manejar Logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await window.studioAuth.logout();
  });

  // 1. Cargar datos del estudio
  async function loadStudioData() {
    const { data: studio, error } = await db
      .from("studios")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error || !studio) {
      document.getElementById("studio-name").textContent = "Estudio no encontrado";
      console.error("Error cargando estudio:", error);
      return;
    }

    currentStudioId = studio.id;
    document.getElementById("studio-name").textContent = studio.name || "Mi Estudio";
    
    // Guardar studio_id en localStorage para usarlo en el form más fácilmente
    localStorage.setItem("invitta_studio_id", currentStudioId);

    // 2. Cargar invitaciones
    await loadInvitations();
  }

  // 2. Cargar invitaciones del estudio
  async function loadInvitations() {
    const loadingMsg = document.getElementById("loading-msg");
    const emptyMsg = document.getElementById("empty-msg");
    const listContainer = document.getElementById("invitation-list");

    loadingMsg.style.display = "block";
    emptyMsg.style.display = "none";
    listContainer.innerHTML = "";

    const { data: invitations, error } = await db
      .from("studio_invitations")
      .select("id, title, slug, event_type, event_date, published, main_photo_url, music_url, gallery_urls, font_preset")
      .eq("studio_id", currentStudioId)
      .order("created_at", { ascending: false });

    loadingMsg.style.display = "none";

    if (error) {
      console.error("Error cargando invitaciones:", error);
      alert("Hubo un error al cargar tus invitaciones.");
      return;
    }

    if (!invitations || invitations.length === 0) {
      emptyMsg.style.display = "block";
      return;
    }

    // Renderizar
    invitations.forEach(inv => {
      const item = document.createElement("div");
      item.className = "invitation-item";
      
      const statusBadge = inv.published 
        ? `<span class="badge badge-published">Publicada</span>`
        : `<span class="badge badge-draft">Borrador</span>`;

      const dateStr = inv.event_date ? new Date(inv.event_date).toLocaleDateString("es-MX") : "Sin fecha";
      
      // Enlaces generados
      const baseLink = `${window.location.origin}/invitacion.html?slug=${inv.slug}`;
      const demoLink = `${window.location.origin}/invitacion.html?slug=${inv.slug}&n=Familia+Garcia&p=4&m=5`;

      const galleryCount = (() => {
        const v = inv.gallery_urls;
        if (!v) return 0;
        if (Array.isArray(v)) return v.filter(Boolean).length;
        try { const p = JSON.parse(v); return Array.isArray(p) ? p.filter(Boolean).length : 0; } catch { return 0; }
      })();

      const fontNames = {
        classic: "Clásica Elegante",
        romantic: "Romántica Script",
        editorial: "Editorial Fine Art",
        minimal: "Moderna Minimal",
        luxury: "Luxury Dramática"
      };
      const fontName = fontNames[inv.font_preset] || "Clásica Elegante";

      const mediaBadges = [
        inv.main_photo_url  ? `<span class="badge badge-media badge-photo">📷 Foto</span>` : "",
        inv.music_url       ? `<span class="badge badge-media badge-music">🎵 Música</span>` : "",
        galleryCount > 0    ? `<span class="badge badge-media badge-gallery">🖼️ Galería ${galleryCount}</span>` : "",
        `<span class="badge badge-media badge-font" style="background:#f3e8ff;color:#6b21a8;border-color:#d8b4fe;">✨ ${fontName}</span>`
      ].join(" ");

      item.innerHTML = `
        <div class="invitation-item-info">
          <h3>${inv.title || 'Sin título'} ${statusBadge} ${mediaBadges}</h3>
          <p>
            <strong>Evento:</strong> ${inv.event_type || '-'} | 
            <strong>Fecha:</strong> ${dateStr} | 
            <strong>Slug:</strong> ${inv.slug}
          </p>
        </div>
        <div class="invitation-item-actions">
          <button class="btn btn-secondary btn-small copy-btn" data-url="${baseLink}">Copiar Link Base</button>
          <a href="${demoLink}" target="_blank" class="btn btn-secondary btn-small">Ver Demo</a>
          <a href="/administracion/studio-invitacion-form.html?id=${inv.id}" class="btn btn-primary btn-small">Editar</a>
        </div>
      `;
      listContainer.appendChild(item);
    });

    // Eventos para copiar
    document.querySelectorAll(".copy-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const url = e.target.getAttribute("data-url");
        navigator.clipboard.writeText(url).then(() => {
          const originalText = e.target.textContent;
          e.target.textContent = "¡Copiado!";
          setTimeout(() => e.target.textContent = originalText, 2000);
        });
      });
    });
  }

  // Iniciar
  loadStudioData();
});
