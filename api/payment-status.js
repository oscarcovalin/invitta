const Stripe = require("stripe");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Metodo no permitido." });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return response.status(503).json({ code: "PAYMENTS_NOT_CONFIGURED" });
  }

  const sessionId = String(request.query?.session_id || "").trim();
  if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) {
    return response.status(400).json({ error: "Referencia de pago invalida." });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"]
    });
    const paymentIntent = session.payment_intent && typeof session.payment_intent === "object"
      ? session.payment_intent
      : null;
    const voucherUrl = paymentIntent?.next_action?.oxxo_display_details?.hosted_voucher_url || null;

    return response.status(200).json({
      paymentStatus: session.payment_status,
      packageTier: session.metadata?.package_tier || null,
      voucherUrl
    });
  } catch (error) {
    console.error("Unable to retrieve Stripe Checkout Session:", error.message);
    return response.status(404).json({ error: "No encontramos esta referencia de pago." });
  }
};
