module.exports = function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const enabled = Boolean(
    process.env.STRIPE_SECRET_KEY
    && process.env.STRIPE_WEBHOOK_SECRET
    && process.env.SUPABASE_URL
    && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  response.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  return response.status(200).json({ enabled });
};
