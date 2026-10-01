import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method === 'POST') {
    // Save/update public profile
    const { userId, slug: newSlug, phone, whatsapp, photo_url, tagline } = req.body;
    if (!userId || !newSlug) return res.status(400).json({ error: 'Missing fields' });

    // Check slug available
    const { data: existing } = await supabase.from('profiles')
      .select('id').eq('public_slug', newSlug).neq('id', userId).single();
    if (existing) return res.status(409).json({ error: 'slug_taken' });

    await supabase.from('profiles').update({
      public_slug: newSlug, phone, whatsapp, photo_url, tagline,
      updated_at: new Date().toISOString()
    }).eq('id', userId);

    return res.status(200).json({ url: `https://oficioai.website/p/${newSlug}` });
  }

  // GET - serve public profile page
  if (!slug) return res.status(404).json({ error: 'Not found' });

  const { data: profile } = await supabase.from('profiles')
    .select('business_name, trade, zone, services, years_experience, phone, whatsapp, tagline, public_slug')
    .eq('public_slug', slug).single();

  if (!profile) return res.status(404).send('Perfil no encontrado');

  // Get latest marketing generation
  const { data: gen } = await supabase.from('generations')
    .select('output').eq('type', 'marketing')
    .order('created_at', { ascending: false }).limit(1);

  const bio = gen?.[0]?.output?.match(/(?:PROFESSIONAL BIO|BIO PROFESIONAL)[:\s]*([\s\S]*?)(?=\n\s*(?:2\.|ADS|ANUNCIOS))/i)?.[1]?.trim() || '';

  const servicesList = profile.services ? profile.services.split(',').map(s => s.trim()) : [];
  const whatsappLink = profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}` : '';
  const phoneLink = profile.phone ? `tel:${profile.phone}` : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${profile.business_name || 'Profesional'} — ${profile.trade || 'Autónomo'}</title>
<meta name="description" content="${profile.tagline || bio.substring(0, 155)}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#fafafa;color:#111827;min-height:100vh}
.page{max-width:480px;margin:0 auto;padding:40px 24px 60px}
.header{text-align:center;margin-bottom:32px}
.avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#4F46E5,#7C3AED);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;font-weight:700;color:#fff}
h1{font-size:1.5rem;font-weight:700;letter-spacing:-.5px}
.trade-badge{display:inline-block;background:#EEF2FF;color:#4F46E5;font-size:.8rem;font-weight:600;padding:4px 12px;border-radius:16px;margin-top:8px}
.zone{font-size:.9rem;color:#6B7280;margin-top:6px}
.tagline{font-size:.95rem;color:#374151;margin-top:12px;line-height:1.6}
.bio{background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px;margin-bottom:16px;font-size:.9rem;color:#374151;line-height:1.7}
.section-title{font-size:.85rem;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.services{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
.service-tag{background:#F3F4F6;color:#374151;font-size:.85rem;padding:8px 14px;border-radius:8px;font-weight:500}
.experience{background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:12px}
.exp-num{font-size:1.8rem;font-weight:700;color:#4F46E5}
.exp-label{font-size:.85rem;color:#6B7280}
.actions{display:flex;flex-direction:column;gap:10px}
.btn{display:block;text-align:center;padding:14px;border-radius:10px;font-size:1rem;font-weight:600;text-decoration:none;transition:opacity .15s}
.btn:hover{opacity:.9}
.btn-wa{background:#25D366;color:#fff}
.btn-phone{background:#111827;color:#fff}
.footer{text-align:center;margin-top:40px;font-size:.75rem;color:#9CA3AF}
.footer a{color:#4F46E5;text-decoration:none;font-weight:600}
</style>
</head>
<body>
<div class="page">
<div class="header">
<div class="avatar">${(profile.business_name || 'P')[0].toUpperCase()}</div>
<h1>${profile.business_name || 'Profesional'}</h1>
<div class="trade-badge">${profile.trade || 'Autónomo'}</div>
<div class="zone">📍 ${profile.zone || ''}</div>
${profile.tagline ? `<p class="tagline">${profile.tagline}</p>` : ''}
</div>
${bio ? `<div class="bio">${bio}</div>` : ''}
${servicesList.length > 0 ? `
<div class="section-title">Servicios</div>
<div class="services">${servicesList.map(s => `<div class="service-tag">${s}</div>`).join('')}</div>
` : ''}
${profile.years_experience ? `
<div class="experience">
<div class="exp-num">${profile.years_experience}</div>
<div class="exp-label">años de<br>experiencia</div>
</div>` : ''}
<div class="actions">
${whatsappLink ? `<a href="${whatsappLink}" class="btn btn-wa">💬 WhatsApp</a>` : ''}
${phoneLink ? `<a href="${phoneLink}" class="btn btn-phone">📞 Llamar</a>` : ''}
</div>
<div class="footer">Creado con <a href="https://oficioai.website">OficioAI</a></div>
</div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
