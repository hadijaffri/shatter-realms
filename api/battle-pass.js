// Battle Pass API: save/load battle pass state

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { deviceId } = req.query || {};
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }
    // In production, fetch from database
    return res.status(200).json({ tier: 0, xp: 0 });
  }

  if (req.method === 'POST') {
    const { deviceId, tier, xp } = req.body || {};
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }
    // In production, save to database
    return res.status(200).json({ success: true, tier, xp });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
