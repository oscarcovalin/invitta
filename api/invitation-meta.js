const fs = require("fs");
const path = require("path");

const APP_URL = "https://invitta.vercel.app";
const SUPABASE_URL = "https://zqnlvmafwcioizzxhnhz.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_aGhY_wqkcuv0c2wLDMb-nw_wsjjfTcd";

let HTML_PATH = path.join(process.cwd(), "dist", "invitacion.html");
if (!fs.existsSync(HTML_PATH)) {
  HTML_PATH = path.join(process.cwd(), "invitacion.html");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeMojibakePass(value) {
  const windows1252Bytes = {
    "\u20ac": 0x80, "\u201a": 0x82, "\u0192": 0x83, "\u201e": 0x84, "\u2026": 0x85,
    "\u2020": 0x86, "\u2021": 0x87, "\u02c6": 0x88, "\u2030": 0x89, "\u0160": 0x8a,
    "\u2039": 0x8b, "\u0152": 0x8c, "\u017d": 0x8e, "\u2018": 0x91, "\u2019": 0x92,
    "\u201c": 0x93, "\u201d": 0x94, "\u2022": 0x95, "\u2013": 0x96, "\u2014": 0x97,
    "\u02dc": 0x98, "\u2122": 0x99, "\u0161": 0x9a, "\u203a": 0x9b, "\u0153": 0x9c,
    "\u017e": 0x9e, "\u0178": 0x9f
  };
  const bytes = [];

  for (const character of String(value || "")) {
    const code = character.charCodeAt(0);
    if (code <= 0xff) {
      bytes.push(code);
    } else if (Object.prototype.hasOwnProperty.call(windows1252Bytes, character)) {
      bytes.push(windows1252Bytes[character]);
    } else {
      return value;
    }
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
}

function repairMojibake(value) {
  let repaired = String(value || "");

  for (let pass = 0; pass < 4 && /[\u00c3\u00c2\u00e2\u00f0\u00c6\u00c5]/.test(repaired); pass += 1) {
    try {
      const candidate = decodeMojibakePass(repaired);
      const currentMarkers = (repaired.match(/[\u00c3\u00c2\u00e2\u00f0\u00c6\u00c5]/g) || []).length;
      const candidateMarkers = (candidate.match(/[\u00c3\u00c2\u00e2\u00f0\u00c6\u00c5]/g) || []).length;
      if (candidate === repaired || candidateMarkers >= currentMarkers) break;
      repaired = candidate;
    } catch (_error) {
      break;
    }
  }

  return repaired;
}

function firstGalleryImage(value) {
  if (Array.isArray(value)) return value.find(Boolean) || "";
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.find(Boolean) || "" : "";
  } catch (_error) {
    return value.split(",").map((item) => item.trim()).find(Boolean) || "";
  }
}

function heroSectionBackground(value) {
  if (!value) return "";
  let backgrounds = value;
  if (typeof value === "string") {
    try {
      backgrounds = JSON.parse(value);
    } catch (_error) {
      return "";
    }
  }
  const hero = backgrounds && typeof backgrounds === "object" ? String(backgrounds.hero || "").trim() : "";
  return /^https:\/\//i.test(hero) ? hero : "";
}

function isMilestoneInvitation(invitation) {
  if (!invitation) return false;
  if (invitation.template_id === "cumpleanos-50-sorpresa") return true;
  return invitation.event_type === "cumpleanos" && /(?:^|\D)50(?:\D|$)/.test(String(invitation.title || ""));
}

async function getInvitation(slug) {
  if (!slug) return null;

  const isoNow = new Date().toISOString();
  const baseHeaders = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Accept: "application/json"
  };

  // Paso 1: búsqueda exacta (case-sensitive, más eficiente)
  const exactQuery = new URLSearchParams({
    select: "title,honoree_name,event_type,event_date,main_photo_url,gallery_urls,section_backgrounds,template_id,expires_at",
    slug: `eq.${slug}`,
    published: "eq.true",
    or: `(expires_at.is.null,expires_at.gt.${isoNow})`,
    limit: "1"
  });

  const exactResponse = await fetch(`${SUPABASE_URL}/rest/v1/studio_invitations?${exactQuery}`, {
    headers: baseHeaders
  });

  if (!exactResponse.ok) {
    throw new Error(`Supabase returned ${exactResponse.status} on exact lookup.`);
  }

  const exactResults = await exactResponse.json();
  if (exactResults[0]) return exactResults[0];

  // Paso 2: fallback case-insensitive (cubre Keiry-XV / keiry-xv / KEIRY-XV)
  console.warn(`[invitation-meta] Slug exacto "${slug}" no encontrado o inactivo. Intentando búsqueda case-insensitive.`);

  const ilikeQuery = new URLSearchParams({
    select: "title,honoree_name,event_type,event_date,main_photo_url,gallery_urls,section_backgrounds,template_id,expires_at,slug",
    slug: `ilike.${slug}`,
    published: "eq.true",
    or: `(expires_at.is.null,expires_at.gt.${isoNow})`,
    limit: "1"
  });

  const ilikeResponse = await fetch(`${SUPABASE_URL}/rest/v1/studio_invitations?${ilikeQuery}`, {
    headers: baseHeaders
  });

  if (!ilikeResponse.ok) {
    throw new Error(`Supabase returned ${ilikeResponse.status} on ilike lookup.`);
  }

  const ilikeResults = await ilikeResponse.json();
  if (ilikeResults[0]) {
    console.warn(`[invitation-meta] Slug encontrado con variación de mayúsculas: "${ilikeResults[0].slug}" (solicitado: "${slug}"). Considera corregir el slug en la BD.`);
    return ilikeResults[0];
  }

  // Paso 3: diagnóstico — verificar si el registro existe pero está inactivo
  const diagQuery = new URLSearchParams({
    select: "slug,published,expires_at",
    slug: `ilike.${slug}`,
    limit: "1"
  });
  const diagResponse = await fetch(`${SUPABASE_URL}/rest/v1/studio_invitations?${diagQuery}`, {
    headers: baseHeaders
  });
  if (diagResponse.ok) {
    const diagResults = await diagResponse.json();
    if (diagResults[0]) {
      const rec = diagResults[0];
      if (!rec.published) {
        console.warn(`[invitation-meta] DIAGNÓSTICO: El slug "${rec.slug}" existe pero published=false. Actívalo en el dashboard de Supabase.`);
      } else if (rec.expires_at && new Date(rec.expires_at) <= new Date()) {
        console.warn(`[invitation-meta] DIAGNÓSTICO: El slug "${rec.slug}" existe pero expiró el ${rec.expires_at}. Extiende expires_at en la BD.`);
      }
    } else {
      console.warn(`[invitation-meta] DIAGNÓSTICO: El slug "${slug}" NO EXISTE en la tabla studio_invitations. Créalo desde Invitta Studio.`);
    }
  }

  return null;
}

function injectSocialMetadata(html, invitation, slug) {
  const name = repairMojibake(invitation?.honoree_name || invitation?.title).trim();
  const invitationTitle = repairMojibake(invitation?.title).trim();
  const title = invitation
    ? `${invitationTitle || name || "Invitación Digital"} | Invitta Studio`
    : "Invitación Digital | Invitta Studio";
  const description = name
    ? `Acompáñanos a celebrar con ${name}. Consulta todos los detalles de la invitación.`
    : "Tu invitación digital personalizada para este evento especial.";
  const milestoneSocialImage = `${APP_URL}/demos/evento-general-basic/assets/cumpleanos-50-sorpresa-social.jpg?v=20260814`;
  const usesMilestoneSocialImage = isMilestoneInvitation(invitation);
  const image = (usesMilestoneSocialImage ? milestoneSocialImage : "") ||
    heroSectionBackground(invitation?.section_backgrounds) ||
    invitation?.main_photo_url ||
    firstGalleryImage(invitation?.gallery_urls);
  const canonicalUrl = slug
    ? `${APP_URL}/invitacion.html?slug=${encodeURIComponent(slug)}`
    : `${APP_URL}/invitacion.html`;

  const tags = [
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Invitta Studio">',
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`
  ];

  if (image) {
    tags.push(
      `<meta property="og:image" content="${escapeHtml(image)}">`,
      `<meta property="og:image:secure_url" content="${escapeHtml(image)}">`,
      `<meta property="og:image:type" content="${escapeHtml(/\.webp(?:$|\?)/i.test(image) ? "image/webp" : /\.png(?:$|\?)/i.test(image) ? "image/png" : "image/jpeg")}">`,
      `<meta property="og:image:alt" content="${escapeHtml(name || "Fotografía de la invitación")}">`,
      `<meta name="twitter:image" content="${escapeHtml(image)}">`
    );

    if (usesMilestoneSocialImage) {
      tags.push(
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">'
      );
    }
  }

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta\s+name=["']description["'][^>]*>/i,
      `<meta name="description" content="${escapeHtml(description)}">`
    )
    .replace("</head>", `  <!-- Dynamic invitation social preview -->\n  ${tags.join("\n  ")}\n</head>`);
}

module.exports = async function handler(request, response) {
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const requestUrl = new URL(request.url || "/", APP_URL);
  const slug = String(requestUrl.searchParams.get("slug") || "").trim().slice(0, 160);
  let invitation = null;

  try {
    invitation = await getInvitation(slug);
  } catch (error) {
    console.error("[invitation-meta] Error al consultar invitación social preview:", error.message);
  }

  if (slug && !invitation) {
    // El slug no se encontró o está inactivo. Se sirve igualmente el HTML (200)
    // para que el motor JS del cliente muestre el error elegante al usuario.
    // Retornar 404 aquí evitaría que carguen CSS/JS → pantalla en blanco.
    console.warn(`[invitation-meta] Slug "${slug}" no encontrado o inactivo → sirviendo HTML con status 200 para manejo en cliente.`);
  }

  response.setHeader("Content-Type", "text/html; charset=utf-8");
  // No cachear cuando no hay invitación (puede activarse pronto en Supabase)
  const cacheControl = invitation
    ? "public, s-maxage=60, stale-while-revalidate=300"
    : "no-store";
  response.setHeader("Cache-Control", cacheControl);
  response.status(200).send(injectSocialMetadata(html, invitation, slug));
};
