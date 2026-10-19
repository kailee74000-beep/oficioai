const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://pbnlmjhpxvbohazrqzsj.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, trade, zone, services, years, lang, userId, seasonal, month, nextMonth } = req.body;
    if (!trade || !zone) return res.status(400).json({ error: 'Trade and area required' });

    // Check free limit
    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).single();
      const plan = profile?.plan || 'free';
      if (plan === 'free') {
        const { count } = await supabase.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId);
        if (count >= 3) return res.json({ error: 'free_limit' });
      }
    }

    let prompt;
    if (seasonal) {
      prompt = `You are a marketing expert for UK tradespeople. Generate 3 seasonal ads for a ${trade} in ${zone} for the month of ${month}.

Their services: ${services || 'general'}
Business name: ${name || trade}
${years ? `Experience: ${years} years` : ''}

Write 3 ready-to-post social media ads that:
- Reference seasonal/weather-related opportunities for ${month} and upcoming ${nextMonth}
- Include a call to action (WhatsApp, call, or message)
- Sound natural and human, not corporate
- Are 3-5 sentences each
- Reference the local area (${zone})

Separate each ad with ---

Do NOT use hashtags. Write as if the tradesperson is posting themselves.`;
    } else {
      prompt = `You are a marketing expert for UK tradespeople. Generate marketing content for:

Name: ${name}
Trade: ${trade}
Area: ${zone}
Services: ${services}
${years ? `Experience: ${years} years` : ''}

Generate in ${lang === 'es' ? 'Spanish' : 'English'}:

1. PROFESSIONAL BIO:
A professional bio for social media profiles (2-3 sentences, warm but professional).

2. ADS:
3 ready-to-post ads for different platforms (Facebook, Gumtree, Instagram). Each 2-4 sentences. Include a call to action.

3. WHATSAPP REPLIES:
3 professional WhatsApp reply templates for common client messages:
- A new enquiry
- A price question
- A follow-up after a quote

Sound natural and human. Use the tradesperson's name and area. No hashtags.`;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    const text = result.content?.[0]?.text || '';

    // Save generation
    if (userId) {
      await supabase.from('generations').insert({
        user_id: userId,
        trade,
        area: zone,
        content: text,
        type: seasonal ? 'seasonal' : 'marketing',
        created_at: new Date().toISOString()
      });
    }

    res.json({ text });
  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ error: 'Generation failed' });
  }
};
