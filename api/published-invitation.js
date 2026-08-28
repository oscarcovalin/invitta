const SUPABASE_URL = "https://yyiunhyzziixzussmmls.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_t9MtXm131UkO6jUNuHSJgQ_kQLnEEYU";

function validSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length >= 3 && value.length <= 80;
}

module.exports = async function publishedInvitation(request, response) {
  const requestUrl = new URL(request.url || "/", "https://invitta-independent-qa.vercel.app");
  const slug = String(request.query?.slug || requestUrl.searchParams.get("slug") || "").trim().toLowerCase();

  if (!validSlug(slug)) {
    response.status(404).send("Invitación no encontrada");
    return;
  }

  try {
    const lookup = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_published_invitation_path`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ p_slug: slug })
    });

    if (!lookup.ok) throw new Error(`Published invitation lookup failed: ${lookup.status}`);
    const result = await lookup.json();
    const published = Array.isArray(result) ? result[0] : null;
    if (!published?.storage_path) {
      response.status(404).send("Invitación no encontrada");
      return;
    }

    const publicFileUrl = `${SUPABASE_URL}/storage/v1/object/public/invitta-2-published/${published.storage_path}`;
    response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    response.redirect(302, publicFileUrl);
  } catch (error) {
    console.error("Unable to resolve published invitation:", error.message);
    response.status(503).send("La invitación no está disponible en este momento");
  }
};
