function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.UTAHOP_KEY;
  if (!key) {
    console.error('lead submit failed: UTAHOP_KEY is not set');
    return res.status(500).json({ error: 'server_not_configured' });
  }

  const body = typeof req.body === 'string' ? safeJsonParse(req.body) : req.body;
  if (!body) {
    return res.status(400).json({ error: 'bad_body' });
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const company = String(body.company || '').trim();
  const message = String(body.message || '').trim();

  if (!name && !email && !phone) {
    return res.status(400).json({ error: 'nothing_to_save' });
  }

  const payload = {
    name: name || undefined,
    email: email || undefined,
    phone: phone || undefined,
    company: company || undefined,
    message: message || undefined,
    source: 'website',
    visitor_id: body.visitor_id || undefined,
    landing_page: body.landing_page || undefined,
    utm_source: body.utm_source || undefined,
    utm_medium: body.utm_medium || undefined,
    utm_campaign: body.utm_campaign || undefined,
  };

  try {
    const upstream = await fetch('https://yuta-opp.vercel.app/api/v1/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('lead submit rejected by UtahOp', upstream.status, data);
      return res.status(upstream.status).json(data);
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('lead submit failed', err);
    return res.status(502).json({ error: 'upstream_unreachable' });
  }
};
