import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { context, message, lang, userId } = req.body;
    if (!context || !message) return res.status(400).json({ error: 'Missing fields' });

    // Check user plan
    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).single();
      if (!profile || profile.plan !== 'pro') {
        return res.status(403).json({ error: 'pro_only', message: 'Pro plan required' });
      }
    }

    const langInstruction = lang === 'es' ? 'Responde en español de España.' : 'Respond in English.';

    const prompt = `You are an expert in sales and negotiation for self-employed tradespeople (builders, painters, plumbers, etc.).

The professional says: "${context}"

A potential client sent this message:
"${message}"

${langInstruction}

Analyze the message and respond with EXACTLY this format (no markdown):

SCORE: [a number from 1 to 100 indicating the probability this client becomes a real, well-paying job]

LEVEL: [one word: LOW / MEDIUM / HIGH / EXCELLENT]

ANALYSIS:
- Client seriousness: [1-2 line assessment]
- Detected urgency: [low/medium/high and why]
- Estimated budget: [if you can tell]
- Red flags: [if any]
- Positive signals: [if any]

SUGGESTED REPLY:
[Write a WhatsApp reply the professional can copy and send directly, adapted to the tone and seriousness detected, aiming to close the job]`;

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content.map(b => b.text || '').join('\n');

    if (userId) {
      await supabase.from('generations').insert({
        user_id: userId,
        type: 'analysis',
        input: { context, message, lang },
        output: text
      });
    }

    res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed' });
  }
}
