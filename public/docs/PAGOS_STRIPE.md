# Activacion de pagos Invitta

La integracion usa Stripe Checkout alojado para que Invitta nunca reciba ni almacene datos de tarjeta.

## Metodos incluidos

- Tarjeta de credito o debito.
- OXXO mediante ficha y referencia de pago.

## Activacion

1. Crear la cuenta de Stripe para Mexico y completar la verificacion comercial.
2. Habilitar `Cards` y `OXXO` en los metodos de pago de Stripe.
3. Agregar en Vercel las variables de `.env.example`.
4. Crear en Stripe el webhook `https://invitta.vercel.app/api/stripe-webhook`.
5. Suscribir el webhook a estos eventos:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
6. Copiar el secreto de firma del webhook a `STRIPE_WEBHOOK_SECRET` y publicar nuevamente.

## Importes protegidos

Los importes se calculan exclusivamente en el servidor:

- Esencial: $399 MXN.
- Premium: $699 MXN.
- VIP Experience: $999 MXN.

OXXO es un pago diferido. Generar la ficha deja la solicitud en `pending`; solo el webhook de confirmacion la cambia a `paid`.
