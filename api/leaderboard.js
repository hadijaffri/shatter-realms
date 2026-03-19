// Leaderboard API: GET (fetch rankings) and POST (submit score)
// Uses in-memory store for now; replace with database in production.

const entries = { global: [], weekly: [], daily: [] };
const MAX_ENTRIES = 100;

function _getWeekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + week;
}

function _getDayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const period = req.query.period || 'global';
    const list = entries[period] || entries.global;
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

    // Add to all relevant leaderboards
    ['global', 'weekly', 'daily'].forEach(period => {
      entries[period].push(entry);
      entries[period].sort((a, b) => b.score - a.score);
      if (entries[period].length > MAX_ENTRIES) {
        entries[period] = entries[period].slice(0, MAX_ENTRIES);
      }
    });

    return res.status(200).json({ success: true, rank: entries.global.indexOf(entry) + 1 });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
