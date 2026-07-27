const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://invitta.vercel.app").replace(/\/$/, "");
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PUBLIC_KEY = process.env.SUPABASE_ANON_KEY || SERVICE_KEY;

function json(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(status).json(payload);
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

async function readJson(result) {
  const text = await result.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { message: text };
  }
}

async function supabaseRequest(path, options = {}) {
  const result = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: options.apiKey || SERVICE_KEY,
      Authorization: `Bearer ${options.bearer || SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await readJson(result);
  if (!result.ok) {
    const error = new Error(data?.msg || data?.message || data?.error_description || "Supabase request failed");
    error.status = result.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function getAuthenticatedUser(request) {
  const authorization = cleanText(request.headers.authorization, 4096);
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token || token === authorization) return null;

  try {
    return await supabaseRequest("/auth/v1/user", {
      apiKey: PUBLIC_KEY,
      bearer: token
    });
  } catch (_error) {
    return null;
  }
}

async function getInvitation(invitationId) {
  const select = [
    "id",
    "studio_id",
    "evento_id",
    "title",
    "honoree_name",
    "client_dashboard_email",
    "client_dashboard_user_id",
    "client_dashboard_enabled"
  ].join(",");
  const rows = await supabaseRequest(
    `/rest/v1/studio_invitations?id=eq.${encodeURIComponent(invitationId)}&select=${encodeURIComponent(select)}`
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function assertStudioManager(studioId, userId) {
  const rows = await supabaseRequest(
    `/rest/v1/studio_members?studio_id=eq.${encodeURIComponent(studioId)}`
      + `&user_id=eq.${encodeURIComponent(userId)}`
      + "&role=in.(owner,manager)&select=role"
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function findUserByEmail(email) {
  const normalizedEmail = email.toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const data = await supabaseRequest(`/auth/v1/admin/users?page=${page}&per_page=1000`);
    const users = Array.isArray(data?.users) ? data.users : [];
    const match = users.find((user) => String(user.email || "").toLowerCase() === normalizedEmail);
    if (match) return match;
    if (users.length < 1000) return null;
  }
  throw new Error("No fue posible localizar la cuenta del cliente.");
}

async function removeEventAccess(eventId, userId) {
  if (!isUuid(eventId) || !isUuid(userId)) return;
  await supabaseRequest(
    `/rest/v1/evento_usuarios?evento_id=eq.${encodeURIComponent(eventId)}`
      + `&user_id=eq.${encodeURIComponent(userId)}`,
    { method: "DELETE", prefer: "return=minimal" }
  );
}

async function sendAccessEmail(email, eventId, invitation) {
  const next = `/administracion/dashboard.html?event_id=${encodeURIComponent(eventId)}`;
  const redirectTo = `${SITE_URL}/administracion/restablecer-contrasena.html?next=${encodeURIComponent(next)}`;
  let user = await findUserByEmail(email);
  let delivery = "recovery";

  if (!user) {
    user = await supabaseRequest(
      `/auth/v1/invite?redirect_to=${encodeURIComponent(redirectTo)}`,
      {
        method: "POST",
        body: {
          email,
          data: {
            invitta_access: "event_owner",
            invitta_event_id: eventId,
            invitta_event_name: invitation.title || invitation.honoree_name || "Mi evento"
          }
        }
      }
    );
    delivery = "invitation";
  }

  if (!user?.id) {
    throw new Error("No fue posible preparar la cuenta del cliente.");
  }

  await supabaseRequest("/rest/v1/evento_usuarios?on_conflict=evento_id,user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: {
      evento_id: eventId,
      user_id: user.id,
      rol: "owner",
      updated_at: new Date().toISOString()
    }
  });

  if (delivery === "recovery") {
    await supabaseRequest(
      `/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
      {
        method: "POST",
        apiKey: PUBLIC_KEY,
        body: { email }
      }
    );
  }

  return { user, delivery };
}

async function updateInvitation(invitationId, payload) {
  await supabaseRequest(
    `/rest/v1/studio_invitations?id=eq.${encodeURIComponent(invitationId)}`,
    {
      method: "PATCH",
      prefer: "return=minimal",
      body: payload
    }
  );
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "Metodo no permitido." });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json(response, 503, {
      code: "CLIENT_ACCESS_NOT_CONFIGURED",
      error: "El acceso del cliente aun no esta configurado en el servidor."
    });
  }

  const caller = await getAuthenticatedUser(request);
  if (!caller?.id) {
    return json(response, 401, { error: "Inicia sesion nuevamente para continuar." });
  }

  let body;
  try {
    body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : (request.body || {});
  } catch (_error) {
    return json(response, 400, { error: "Solicitud invalida." });
  }

  const invitationId = cleanText(body.invitationId, 36);
  const action = cleanText(body.action || "send", 24).toLowerCase();
  const email = cleanText(body.email, 254).toLowerCase();

  if (!isUuid(invitationId) || !["send", "disable"].includes(action)) {
    return json(response, 400, { error: "Solicitud de acceso invalida." });
  }
  if (action === "send" && !isEmail(email)) {
    return json(response, 400, { error: "Escribe un correo valido para el cliente." });
  }

  try {
    const invitation = await getInvitation(invitationId);
    if (!invitation || !isUuid(invitation.studio_id)) {
      return json(response, 404, { error: "No encontramos la invitacion." });
    }
    if (!await assertStudioManager(invitation.studio_id, caller.id)) {
      return json(response, 403, { error: "Solo responsables del Studio pueden administrar este acceso." });
    }
    if (!isUuid(invitation.evento_id)) {
      return json(response, 409, { error: "Guarda la invitacion para preparar primero su panel de invitados." });
    }

    if (action === "disable") {
      if (isUuid(invitation.client_dashboard_user_id)) {
        await removeEventAccess(invitation.evento_id, invitation.client_dashboard_user_id);
      }
      await updateInvitation(invitation.id, {
        client_dashboard_enabled: false,
        client_dashboard_last_sent_at: null
      });
      return json(response, 200, { ok: true, enabled: false });
    }

    const { user, delivery } = await sendAccessEmail(email, invitation.evento_id, invitation);
    if (
      isUuid(invitation.client_dashboard_user_id)
      && invitation.client_dashboard_user_id !== user.id
    ) {
      await removeEventAccess(invitation.evento_id, invitation.client_dashboard_user_id);
    }
    const sentAt = new Date().toISOString();
    await updateInvitation(invitation.id, {
      client_dashboard_email: email,
      client_dashboard_user_id: user.id,
      client_dashboard_enabled: true,
      client_dashboard_last_sent_at: sentAt
    });

    return json(response, 200, {
      ok: true,
      enabled: true,
      email,
      delivery,
      sentAt,
      dashboardUrl: `${SITE_URL}/administracion/dashboard.html?event_id=${encodeURIComponent(invitation.evento_id)}`
    });
  } catch (error) {
    console.error("Client dashboard access error:", error.message, error.data || "");
    if (error.status === 429) {
      return json(response, 429, { error: "Se enviaron demasiados correos. Espera unos minutos e intenta nuevamente." });
    }
    return json(response, 500, { error: "No pudimos enviar el acceso del cliente. Intenta nuevamente." });
  }
};
