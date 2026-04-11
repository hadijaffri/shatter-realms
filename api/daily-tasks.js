import { setCorsHeaders, handleOptions } from './_lib/cors.js';

// Daily task definitions - rotates based on day of year
const TASK_POOL = [
  { id: 'kills_10', type: 'kills', target: 10, reward: 50, label: 'Defeat 10 enemies', icon: '⚔️' },
  {
    id: 'kills_25',
    type: 'kills',
    target: 25,
    reward: 120,
    label: 'Defeat 25 enemies',
    icon: '💀',
  },
  {
    id: 'kills_50',
    type: 'kills',
    target: 50,
    reward: 250,
    label: 'Defeat 50 enemies',
    icon: '☠️',
  },
  {
    id: 'play_5',
    type: 'playtime',
    target: 5,
    reward: 30,
    label: 'Play for 5 minutes',
    icon: '⏱️',
  },
  {
    id: 'play_15',
    type: 'playtime',
    target: 15,
    reward: 80,
    label: 'Play for 15 minutes',
    icon: '⏰',
  },
  {
    id: 'play_30',
    type: 'playtime',
    target: 30,
    reward: 200,
    label: 'Play for 30 minutes',
    icon: '🕐',
  },
  { id: 'wave_3', type: 'waves', target: 3, reward: 60, label: 'Survive 3 waves', icon: '🌊' },
  { id: 'wave_5', type: 'waves', target: 5, reward: 150, label: 'Survive 5 waves', icon: '🌊' },
  { id: 'wave_10', type: 'waves', target: 10, reward: 350, label: 'Survive 10 waves', icon: '🏆' },
  {
    id: 'score_1000',
    type: 'score',
    target: 1000,
    reward: 40,
    label: 'Earn 1,000 score',
    icon: '⭐',
  },
  {
    id: 'score_5000',
    type: 'score',
    target: 5000,
    reward: 100,
    label: 'Earn 5,000 score',
    icon: '🌟',
  },
  {
    id: 'score_10000',
    type: 'score',
    target: 10000,
    reward: 250,
    label: 'Earn 10,000 score',
    icon: '✨',
  },
  {
    id: 'coins_100',
    type: 'coins_collected',
    target: 100,
    reward: 75,
    label: 'Collect 100 coins in-game',
    icon: '💰',
  },
  { id: 'boss_1', type: 'bosses', target: 1, reward: 150, label: 'Defeat a boss', icon: '👹' },
  { id: 'games_3', type: 'games', target: 3, reward: 60, label: 'Play 3 games', icon: '🎮' },
];

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDailyTasks() {
  const day = getDayOfYear();
  // Use day as seed to pick 3 tasks deterministically
  const tasks = [];
  const poolCopy = [...TASK_POOL];

  // Simple seeded selection: pick 3 non-overlapping type tasks
  const usedTypes = new Set();
  let seed = day * 7 + 13;

  for (let i = 0; i < 3 && poolCopy.length > 0; i++) {
    seed = (seed * 31 + 17) % poolCopy.length;
    let idx = seed % poolCopy.length;

    // Try to avoid duplicate task types
    let attempts = 0;
    while (usedTypes.has(poolCopy[idx].type) && attempts < poolCopy.length) {
      idx = (idx + 1) % poolCopy.length;
      attempts++;
    }

    const task = poolCopy[idx];
    usedTypes.add(task.type);
    tasks.push({ ...task });
    poolCopy.splice(idx, 1);
  }

  return tasks;
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method === 'GET') {
    // Return today's daily tasks
    const tasks = getDailyTasks();
    const today = new Date().toISOString().split('T')[0];
    return res.status(200).json({ date: today, tasks });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
