// Unified game data API: leaderboard, battle-pass, profile, clans, gifts
// Routes based on ?endpoint= query parameter
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

// ── Leaderboard ─────────────────────────────────────────────────────
const leaderboardEntries = { global: [], weekly: [], daily: [] };
const MAX_ENTRIES = 100;

function handleLeaderboard(req, res) {
  if (req.method === 'GET') {
    const period = req.query.period || 'global';
    const list = leaderboardEntries[period] || leaderboardEntries.global;
    return res.status(200).json({ entries: list.slice(0, 50) });
  }

  if (req.method === 'POST') {
    const { name, score, wave, kills } = req.body || {};

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Valid score is required' });
    }

    const entry = {
      name: name.substring(0, 20),
      score: Math.floor(score),
      wave: Math.floor(wave || 0),
      kills: Math.floor(kills || 0),
      timestamp: Date.now(),
    };

    ['global', 'weekly', 'daily'].forEach(period => {
      leaderboardEntries[period].push(entry);
      leaderboardEntries[period].sort((a, b) => b.score - a.score);
      if (leaderboardEntries[period].length > MAX_ENTRIES) {
        leaderboardEntries[period] = leaderboardEntries[period].slice(0, MAX_ENTRIES);
      }
    });

    return res
      .status(200)
      .json({ success: true, rank: leaderboardEntries.global.indexOf(entry) + 1 });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Battle Pass ─────────────────────────────────────────────────────
function handleBattlePass(req, res) {
  if (req.method === 'GET') {
    const { deviceId } = req.query || {};
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }
    return res.status(200).json({ tier: 0, xp: 0 });
  }

  if (req.method === 'POST') {
    const { deviceId, tier, xp } = req.body || {};
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }
    return res.status(200).json({ success: true, tier, xp });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Profile ─────────────────────────────────────────────────────────
function handleProfile(req, res) {
  if (req.method === 'GET') {
    const { deviceId } = req.query || {};
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }
    return res.status(200).json({
      name: 'Unknown',
      level: 1,
      kills: 0,
      deaths: 0,
      highestWave: 0,
    });
  }

  if (req.method === 'POST') {
    const { deviceId } = req.body || {};
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Clans ───────────────────────────────────────────────────────────
const clans = {};

function handleClans(req, res) {
  if (req.method === 'GET') {
    const { clanId } = req.query || {};
    if (clanId && clans[clanId]) {
      return res.status(200).json(clans[clanId]);
    }
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

// ── Gifts ───────────────────────────────────────────────────────────
const pendingGifts = {};

function handleGifts(req, res) {
  if (req.method === 'GET') {
    const { deviceId } = req.query || {};
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }
    const gifts = pendingGifts[deviceId] || [];
    pendingGifts[deviceId] = [];
    return res.status(200).json({ gifts });
  }

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

// ── Router ──────────────────────────────────────────────────────────
const routes = {
  leaderboard: handleLeaderboard,
  'battle-pass': handleBattlePass,
  profile: handleProfile,
  clans: handleClans,
  gifts: handleGifts,
};

export default function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  const endpoint = req.query.endpoint;
  if (!endpoint || !routes[endpoint]) {
    return res.status(400).json({
      error: 'Missing or invalid endpoint parameter',
      valid: Object.keys(routes),
    });
  }

  return routes[endpoint](req, res);
}
