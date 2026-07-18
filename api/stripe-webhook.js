const Stripe = require("stripe");

function readRawBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

async function updateSalesRequest(session, paymentStatus, eventType) {
  const requestId = session.metadata?.invitation_request_id;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!requestId || !supabaseUrl || !serviceRoleKey) return;

  const paid = paymentStatus === "paid";
  const amountMxn = Number.isFinite(session.amount_total) ? Math.round(session.amount_total / 100) : null;
  const paymentMethod = eventType.includes("async_payment") ? "oxxo" : (paid ? "card" : null);
  const payload = {
    payment_status: paymentStatus,
    stripe_session_id: session.id,
    payment_method: paymentMethod,
    payment_amount_mxn: amountMxn,
    payment_email: session.customer_details?.email || session.customer_email || null,
    paid_at: paid ? new Date().toISOString() : null
  };

  const result = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/invitation_requests?id=eq.${encodeURIComponent(requestId)}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(payload)
  });

  if (!result.ok) throw new Error(`Supabase payment update returned ${result.status}: ${await result.text()}`);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).end();
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return response.status(503).json({ error: "Webhook no configurado." });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    const rawBody = await readRawBody(request);
    event = stripe.webhooks.constructEvent(
      rawBody,
      request.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Invalid Stripe webhook:", error.message);
    return response.status(400).json({ error: "Firma invalida." });
  }

  try {
    const session = event.data.object;
    if (event.type === "checkout.session.completed") {
      await updateSalesRequest(session, session.payment_status === "paid" ? "paid" : "pending", event.type);
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      await updateSalesRequest(session, "paid", event.type);
    } else if (event.type === "checkout.session.async_payment_failed") {
      await updateSalesRequest(session, "failed", event.type);
    } else if (event.type === "checkout.session.expired") {
      await updateSalesRequest(session, "expired", event.type);
    }
  } catch (error) {
    console.error("Unable to persist Stripe webhook:", error.message);
    return response.status(500).json({ error: "No se pudo registrar el pago." });
  }

  return response.status(200).json({ received: true });
};

module.exports.config = {
  api: { bodyParser: false }
};
