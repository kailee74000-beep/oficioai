# OficioAI v2 — Con cuentas de usuario y pagos

## Variables de entorno en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y añade:

1. ANTHROPIC_API_KEY → (tu clave de Anthropic - ya la tienes)
2. SUPABASE_URL → https://pbnlmjhpxvbohazrqzsj.supabase.co
3. SUPABASE_SERVICE_KEY → (la encuentras en Supabase → Settings → API → service_role key - es la clave SECRETA, no la pública)
4. STRIPE_SECRET_KEY → (en Stripe → Developers → API keys → Secret key)
5. STRIPE_WEBHOOK_SECRET → (se crea en el paso del webhook)

## Configurar el webhook de Stripe

1. En Stripe → Developers → Webhooks → Add endpoint
2. URL: https://oficioai.website/api/stripe-webhook
3. Eventos: checkout.session.completed, customer.subscription.deleted
4. Copia el "Signing secret" que te da → es tu STRIPE_WEBHOOK_SECRET

## Subir a GitHub

Reemplaza todos los archivos en tu repositorio "oficioai" con los de esta carpeta.
Vercel se actualiza automáticamente.
