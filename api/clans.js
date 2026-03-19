// Clans API: CRUD operations for clans

const clans = {}; // In-memory store; replace with database in production

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { clanId } = req.query || {};
    if (clanId && clans[clanId]) {
      return res.status(200).json(clans[clanId]);
    }
    // Return all clans (paginated in production)
    const list = Object.values(clans).slice(0, 50);
    return res.status(200).json({ clans: list });
  }

  if (req.method === 'POST') {
    const { action, clanId, name, tag, deviceId } = req.body || {};

    if (action === 'create') {
      if (!name || !tag) {
        return res.status(400).json({ error: 'Name and tag are required' });
      }
      const id = 'clan_' + Date.now().toString(36);
      clans[id] = {
        id,
        name: name.substring(0, 20),
        tag: tag.substring(0, 4).toUpperCase(),
        members: [deviceId || 'unknown'],
        leader: deviceId || 'unknown',
        created: Date.now(),
      };
      return res.status(200).json({ success: true, clan: clans[id] });
    }

    if (action === 'join') {
      if (!clanId || !clans[clanId]) {
        return res.status(404).json({ error: 'Clan not found' });
      }
      if (clans[clanId].members.length >= 50) {
        return res.status(400).json({ error: 'Clan is full' });
      }
      clans[clanId].members.push(deviceId || 'unknown');
      return res.status(200).json({ success: true, clan: clans[clanId] });
    }

    if (action === 'leave') {
      if (!clanId || !clans[clanId]) {
        return res.status(404).json({ error: 'Clan not found' });
      }
      clans[clanId].members = clans[clanId].members.filter(m => m !== deviceId);
      if (clans[clanId].members.length === 0) {
        delete clans[clanId];
      }
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
