const Stripe = require("stripe");

const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://invitta.vercel.app").replace(/\/$/, "");
const PACKAGE_CATALOG = Object.freeze({
  essential: { name: "Invitacion Esencial", amount: 39900 },
  premium: { name: "Invitacion Premium", amount: 69900 },
  vip: { name: "Invitacion VIP Experience", amount: 99900 }
});

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Metodo no permitido." });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return response.status(503).json({
      code: "PAYMENTS_NOT_CONFIGURED",
      error: "Los pagos en linea estaran disponibles muy pronto. Puedes continuar por WhatsApp."
    });
  }

  let body;
  try {
    body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : (request.body || {});
  } catch (_error) {
    return response.status(400).json({ error: "Solicitud de pago invalida." });
  }
  const packageTier = cleanText(body.packageTier, 24).toLowerCase();
  const selectedPackage = PACKAGE_CATALOG[packageTier];

  if (!selectedPackage) {
    return response.status(400).json({ error: "Selecciona un paquete Esencial, Premium o VIP." });
  }

  const clientName = cleanText(body.clientName, 160);
  const clientPhone = cleanText(body.clientPhone, 50);
  const designName = cleanText(body.designName, 120);
  const requestId = cleanText(body.requestId, 36);

  if (clientName.length < 2 || clientPhone.replace(/\D/g, "").length < 8) {
    return response.status(400).json({ error: "Nombre y WhatsApp validos son obligatorios." });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const metadata = {
    package_tier: packageTier,
    client_name: clientName,
    client_phone: clientPhone,
    design_name: designName || "Por definir"
  };
  if (isUuid(requestId)) metadata.invitation_request_id = requestId;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "es",
      payment_method_types: ["card", "oxxo"],
      payment_method_options: {
        oxxo: { expires_after_days: 3 }
      },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "mxn",
          unit_amount: selectedPackage.amount,
          product_data: {
            name: selectedPackage.name,
            description: designName ? `Diseno seleccionado: ${designName}` : "Invitacion digital personalizada Invitta"
          }
        }
      }],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${SITE_URL}/pago-exitoso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/solicitar-invitacion.html?pago=cancelado`,
      custom_text: {
        submit: { message: "Tu invitacion comenzara a prepararse cuando confirmemos el pago." }
      }
    });

    return response.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Unable to create Stripe Checkout Session:", error.message);
    return response.status(500).json({ error: "No pudimos iniciar el pago. Intenta nuevamente o continua por WhatsApp." });
  }
};

module.exports.PACKAGE_CATALOG = PACKAGE_CATALOG;
