const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://pbnlmjhpxvbohazrqzsj.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  const { slug } = req.query;
  if (!slug) return res.status(404).send('Not found');

  try {
    const { data: profile, error } = await supabase
      .from('public_profiles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !profile) {
      return res.status(404).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Page not found — OficioAI</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fafbff;color:#0f172a;text-align:center"><div><h1 style="font-size:2rem">Page not found</h1><p style="color:#64748b">This profile doesn't exist yet.</p><a href="https://oficioai.website" style="color:#6366F1;font-weight:600">Create yours free at OficioAI →</a></div></body></html>`);
    }

    const name = profile.business_name || profile.trade || 'Professional';
    const trade = profile.trade || '';
    const area = profile.area || '';
    const tagline = profile.tagline || `${trade} in ${area}`;
    const bio = profile.bio || '';
    const services = profile.services ? (Array.isArray(profile.services) ? profile.services : profile.services.split(',').map(s => s.trim())) : [];
    const phone = profile.phone || '';
    const whatsapp = profile.whatsapp || '';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const servicesHTML = services.length > 0
      ? `<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:20px 0">${services.map(s => `<span style="background:rgba(99,102,241,.1);color:#6366F1;padding:6px 16px;border-radius:24px;font-size:.85rem;font-weight:600">${escHtml(s)}</span>`).join('')}</div>`
      : '';

    const contactHTML = [];
    if (whatsapp) contactHTML.push(`<a href="https://wa.me/${whatsapp}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;padding:14px 32px;border-radius:12px;font-size:1rem;font-weight:600;text-decoration:none">💬 WhatsApp me</a>`);
    if (phone) contactHTML.push(`<a href="tel:${phone}" style="display:inline-flex;align-items:center;gap:8px;background:#6366F1;color:#fff;padding:14px 32px;border-radius:12px;font-size:1rem;font-weight:600;text-decoration:none">📞 Call now</a>`);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(name)} — ${escHtml(tagline)}</title>
<meta name="description" content="${escHtml(bio.slice(0, 155))}">
<meta property="og:title" content="${escHtml(name)} — ${escHtml(tagline)}">
<meta property="og:description" content="${escHtml(bio.slice(0, 155))}">
<meta property="og:url" content="https://oficioai.website/p/${escHtml(slug)}">
<meta property="og:type" content="profile">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#fafbff;color:#0f172a;min-height:100vh}
@media(prefers-color-scheme:dark){body{background:#050507;color:#f1f5f9}}
.card{max-width:480px;margin:40px auto;background:#fff;border-radius:20px;box-shadow:0 8px 40px rgba(0,0,0,.08);overflow:hidden;padding:40px 32px;text-align:center}
@media(prefers-color-scheme:dark){.card{background:rgba(30,30,35,.8);box-shadow:0 8px 40px rgba(0,0,0,.4)}}
.avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#ec4899);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;font-weight:800}
h1{font-size:1.5rem;font-weight:800;margin-bottom:4px}
.tagline{color:#64748b;font-size:.92rem;margin-bottom:20px}
.bio{font-size:.9rem;line-height:1.8;color:#334155;margin-bottom:24px;max-width:400px;margin-left:auto;margin-right:auto}
@media(prefers-color-scheme:dark){.tagline{color:#94a3b8}.bio{color:#cbd5e1}}
.contacts{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:8px}
.footer{text-align:center;padding:24px;font-size:.75rem;color:#94a3b8}
.footer a{color:#6366F1;text-decoration:none;font-weight:600}
.footer a:hover{text-decoration:underline}
@media(max-width:520px){.card{margin:16px;padding:32px 20px}}
</style>
</head>
<body>
<div class="card">
  <div class="avatar">${initials}</div>
  <h1>${escHtml(name)}</h1>
  <div class="tagline">${escHtml(tagline)}</div>
  ${servicesHTML}
  ${bio ? `<div class="bio">${escHtml(bio)}</div>` : ''}
  <div class="contacts">${contactHTML.join('')}</div>
</div>
<div class="footer">Made with <a href="https://oficioai.website?ref=publicpage" target="_blank">OficioAI</a> — AI marketing for every trade</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Public profile error:', err.message);
    res.status(500).send('Server error');
  }
};

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
