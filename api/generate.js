import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, trade, zone, services, years, lang } = req.body;

    if (!name || !trade || !zone || !services) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const langInstruction = lang === 'es'
      ? 'Responde en español de España, con tono profesional pero cercano.'
      : 'Respond in English, with a professional but friendly tone.';

    const prompt = `You are a marketing expert for self-employed tradespeople in the construction and trades sector.

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

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content.map(b => b.text || '').join('\n');
    res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI generation failed' });
  }
}
