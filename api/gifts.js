// Gifts API: send/receive gifts between players

const pendingGifts = {}; // deviceId -> [gifts]

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: fetch pending gifts for a player
  if (req.method === 'GET') {
    const { deviceId } = req.query || {};
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }
    const gifts = pendingGifts[deviceId] || [];
    // Clear after reading
    pendingGifts[deviceId] = [];
    return res.status(200).json({ gifts });
  }

  // POST: send a gift
  if (req.method === 'POST') {
    const { from, to, giftType, amount } = req.body || {};

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to are required' });
    }
    if (!giftType || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid giftType and amount are required' });
    }
    if (amount > 10000) {
      return res.status(400).json({ error: 'Gift amount too large' });
    }

    if (!pendingGifts[to]) {
      pendingGifts[to] = [];
    }
    pendingGifts[to].push({
      from,
      giftType,
      amount: Math.floor(amount),
      timestamp: Date.now(),
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
