const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const MAX_BYTES = 6 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function json(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(status).json(payload);
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function readJson(result) {
  return result.text().then((text) => {
    if (!text) return null;
    try { return JSON.parse(text); } catch (_error) { return { message: text }; }
  });
}

async function supabaseRequest(path, options = {}) {
  const result = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      ...(options.headers || {})
    },
    body: options.body
  });
  const data = await readJson(result);
  if (!result.ok) {
    const error = new Error(data?.message || data?.error || "Supabase request failed");
    error.status = result.status;
    throw error;
  }
  return data;
}

async function invitationForSlug(slug) {
  const select = "id,slug,published,expires_at,shared_album_enabled";
  const rows = await supabaseRequest(
    `/rest/v1/studio_invitations?slug=eq.${encodeURIComponent(slug)}&select=${encodeURIComponent(select)}&limit=1`
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

function activeAlbum(invitation) {
  return invitation && invitation.published === true && invitation.shared_album_enabled === true
    && (!invitation.expires_at || new Date(invitation.expires_at).getTime() > Date.now());
}

function storagePathUrl(bucket, objectPath) {
  return `/storage/v1/object/sign/${encodeURIComponent(bucket)}/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
}

async function signPhoto(path) {
  const signed = await supabaseRequest(storagePathUrl("invitation-album", path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 })
  });
  return signed?.signedURL ? `${SUPABASE_URL}/storage/v1${signed.signedURL}` : "";
}

function detectImage(buffer, mimeType) {
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

function extensionFor(mimeType) {
  return mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
}

async function verifyGuest(slug, guestToken) {
  const result = await supabaseRequest("/rest/v1/rpc/get_public_invitation_guest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invitation_slug: slug, guest_token: guestToken })
  });
  return Boolean(result);
}

module.exports = async function handler(request, response) {
  if (!SUPABASE_URL || !SERVICE_KEY) return json(response, 503, { error: "El álbum aún no está configurado." });
  const url = new URL(request.url || "/", "https://invitta.vercel.app");

  try {
    if (request.method === "GET") {
      const slug = cleanText(url.searchParams.get("slug"), 160);
      const invitation = await invitationForSlug(slug);
      if (!activeAlbum(invitation)) return json(response, 404, { error: "El álbum no está disponible." });
      const rows = await supabaseRequest(
        `/rest/v1/invitation_album_photos?invitation_id=eq.${encodeURIComponent(invitation.id)}`
          + "&select=id,storage_path,guest_name,message,created_at&order=created_at.desc&limit=60"
      );
      const photos = await Promise.all(rows.map(async (photo) => ({
        id: photo.id,
        src: await signPhoto(photo.storage_path),
        guestName: photo.guest_name,
        message: photo.message || "",
        createdAt: photo.created_at
      })));
      return json(response, 200, { photos: photos.filter((photo) => photo.src) });
    }

    if (request.method !== "POST") {
      response.setHeader("Allow", "GET, POST");
      return json(response, 405, { error: "Método no permitido." });
    }

    const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : (request.body || {});
    const slug = cleanText(body.slug, 160);
    const guestToken = cleanText(body.guestToken, 160);
    const guestName = cleanText(body.guestName, 120);
    const message = cleanText(body.message, 500) || null;
    const mimeType = cleanText(body.mimeType, 40).toLowerCase();
    const encoded = String(body.fileBase64 || "").replace(/^data:[^;]+;base64,/, "");
    if (!slug || !guestToken || !guestName || !IMAGE_TYPES.has(mimeType) || !encoded) {
      return json(response, 400, { error: "Completa los datos y selecciona una imagen válida." });
    }
    const invitation = await invitationForSlug(slug);
    if (!activeAlbum(invitation) || !await verifyGuest(slug, guestToken)) {
      return json(response, 403, { error: "Tu enlace personalizado no permite subir fotos." });
    }
    const file = Buffer.from(encoded, "base64");
    if (!file.length || file.length > MAX_BYTES || !detectImage(file, mimeType)) {
      return json(response, 400, { error: "La imagen debe ser JPG, PNG o WebP y pesar hasta 6 MB." });
    }
    const objectPath = `${invitation.id}/${Date.now()}-${crypto.randomUUID()}.${extensionFor(mimeType)}`;
    await supabaseRequest(`/storage/v1/object/invitation-album/${objectPath.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST",
      headers: { "Content-Type": mimeType, "x-upsert": "false" },
      body: file
    });
    const inserted = await supabaseRequest("/rest/v1/invitation_album_photos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ invitation_id: invitation.id, storage_path: objectPath, guest_name: guestName, message })
    });
    const photo = Array.isArray(inserted) ? inserted[0] : inserted;
    return json(response, 201, {
      photo: { id: photo.id, src: await signPhoto(objectPath), guestName, message: message || "", createdAt: photo.created_at }
    });
  } catch (error) {
    console.error("Shared album error:", error.message);
    return json(response, 500, { error: "No pudimos guardar la foto. Intenta nuevamente." });
  }
};
