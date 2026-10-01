import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, trade, zone, services, years, lang, userId, demo } = req.body;
    if (!name || !trade || !zone || !services) return res.status(400).json({ error: 'Missing fields' });

    if (userId && !demo) {
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).single();
      if (profile?.plan === 'free') {
        const { count } = await supabase.from('generations').select('*', { count: 'exact', head: true })
          .eq('user_id', userId).eq('type', 'marketing');
        if (count >= 1) return res.status(403).json({ error: 'free_limit' });
      }
    }

    const langInstruction = lang === 'es'
      ? 'Responde en español de España, con tono profesional pero cercano.'
      : 'Respond in English, with a professional but friendly tone.';

    const prompt = `You are a marketing expert for self-employed professionals.

A professional gives you these details:
- Name: ${name}
- Trade: ${trade}
- Area: ${zone}
- Services: ${services}
- Years of experience: ${years || 'not specified'}

${langInstruction}

Generate EXACTLY this:

1. PROFESSIONAL BIO (4-5 lines, for Google Business, social media or classified ads)

2. ADS (3 short texts, max 3 lines each, ready to post on social media or classifieds. Each with a different angle: one focused on experience, one on quality, one on local area)

3. WHATSAPP REPLIES (5 template replies for the most common client messages:
- When they ask for a price without giving details
- When they ask about availability
- When they ask if you do free quotes
- When they ask for references of previous work
- When they say someone else gave a lower price)

Format each section with its title in CAPS. No markdown. Be concrete and direct, no empty generic phrases.`;

    // Stream response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullText = '';

    const stream = await anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.text) {
        fullText += event.delta.text;
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);

    // Save to DB after streaming
    if (userId && !demo) {
      await supabase.from('generations').insert({
        user_id: userId, type: 'marketing',
        input: { name, trade, zone, services, years, lang },
        output: fullText
      });
      await supabase.from('profiles').update({
        business_name: name, trade, zone, services,
        years_experience: years ? parseInt(years) : null,
        updated_at: new Date().toISOString()
      }).eq('id', userId);
    }

    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
    res.end();
  }
}
