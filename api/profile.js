const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://pbnlmjhpxvbohazrqzsj.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, slug, phone, whatsapp, tagline } = req.body;
    if (!userId || !slug) return res.status(400).json({ error: 'userId and slug required' });

    // Check slug availability
    const { data: existing } = await supabase
      .from('public_profiles')
      .select('id')
      .eq('slug', slug)
      .neq('user_id', userId)
      .single();

    if (existing) return res.json({ error: 'slug_taken' });

    // Get user profile for bio data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Upsert public profile
    const { error } = await supabase
      .from('public_profiles')
      .upsert({
        user_id: userId,
        slug,
        phone: phone || null,
        whatsapp: whatsapp || null,
        tagline: tagline || null,
        business_name: profile?.business_name || null,
        trade: profile?.trade || null,
        area: profile?.area || null,
        services: profile?.services || null,
        bio: profile?.bio || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Profile save error:', error);
      return res.status(500).json({ error: 'Could not save profile' });
    }

    res.json({ url: `https://oficioai.website/p/${slug}` });
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
