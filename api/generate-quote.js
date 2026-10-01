import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { trade, description, userId, lang } = req.body;
    if (!trade || !description) return res.status(400).json({ error: 'Missing fields' });

    // Check plan - basic+ only
    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).single();
      if (!profile || profile.plan === 'free') {
        return res.status(403).json({ error: 'plan_required' });
      }
    }

    const langInstruction = lang === 'es'
      ? 'Responde en español de España.'
      : 'Respond in English.';

    const prompt = `You are an expert at writing professional service quotes for self-employed professionals.

Trade: ${trade}
Job description from the client: "${description}"

${langInstruction}

Generate a professional quote breakdown. Respond ONLY with valid JSON, no markdown, no backticks, no preamble. Use this exact structure:

{
  "title": "Short title for the job (max 6 words)",
  "items": [
    {"description": "Line item description", "price": 150},
    {"description": "Another item", "price": 80}
  ],
  "notes": "1-2 lines of professional terms: timeline, payment terms, what's included/excluded",
  "validity": "This quote is valid for 15 days"
}

Be realistic with prices for the Spanish/European market. Break the job into 3-6 specific line items. Prices in euros, no cents.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    try {
      const quote = JSON.parse(clean);
      res.status(200).json({ quote });
    } catch (e) {
      res.status(200).json({ quote: { title: 'Presupuesto', items: [{ description: 'Servicio profesional', price: 0 }], notes: '', validity: '' }, raw: text });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Quote generation failed' });
  }
}
