const fs = require("fs");
const path = require("path");

const APP_URL = "https://invitta.vercel.app";
const SUPABASE_URL = "https://zqnlvmafwcioizzxhnhz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_aGhY_wqkcuv0c2wLDMb-nw_wsjjfTcd";
const HTML_PATH = path.join(process.cwd(), "invitacion.html");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

async function getInvitation(slug) {
  if (!slug) return null;

  const query = new URLSearchParams({
    select: "title,honoree_name,event_type,event_date,main_photo_url,gallery_urls",
    slug: `eq.${slug}`,
    published: "eq.true",
    limit: "1"
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/studio_invitations?${query}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase returned ${response.status}.`);
  }

  const invitations = await response.json();
  return invitations[0] || null;
}

function injectSocialMetadata(html, invitation, slug) {
  const name = String(invitation?.honoree_name || invitation?.title || "").trim();
  const title = invitation
    ? `${invitation.title || name || "Invitación Digital"} | Invitta Studio`
    : "Invitación Digital | Invitta Studio";
  const description = name
    ? `Acompáñanos a celebrar con ${name}. Consulta todos los detalles de la invitación.`
    : "Tu invitación digital personalizada para este evento especial.";
  const image = invitation?.main_photo_url || firstGalleryImage(invitation?.gallery_urls);
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
      `<meta property="og:image:alt" content="${escapeHtml(name || "Fotografía de la invitación")}">`,
      `<meta name="twitter:image" content="${escapeHtml(image)}">`
    );
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
  const slugValue = Array.isArray(request.query?.slug) ? request.query.slug[0] : request.query?.slug;
  const slug = String(slugValue || "").trim().slice(0, 160);
  let invitation = null;

  try {
    invitation = await getInvitation(slug);
  } catch (error) {
    console.error("Unable to build invitation social preview:", error.message);
  }

  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
  response.status(200).send(injectSocialMetadata(html, invitation, slug));
};
