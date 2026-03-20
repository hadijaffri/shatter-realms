// Daily challenges: 3 per day, date-seeded, with coin rewards
(function () {
  'use strict';

  var CHALLENGE_POOL = [
    { id: 'kill_20', desc: 'Kill 20 enemies', target: 20, stat: 'kills', reward: 50 },
    { id: 'kill_50', desc: 'Kill 50 enemies', target: 50, stat: 'kills', reward: 120 },
    { id: 'wave_5', desc: 'Reach wave 5', target: 5, stat: 'wave', reward: 60 },
    { id: 'wave_10', desc: 'Reach wave 10', target: 10, stat: 'wave', reward: 150 },
    { id: 'combo_10', desc: 'Get a 10x combo', target: 10, stat: 'combo', reward: 80 },
    { id: 'combo_20', desc: 'Get a 20x combo', target: 20, stat: 'combo', reward: 150 },
    { id: 'score_1000', desc: 'Score 1000 points', target: 1000, stat: 'score', reward: 70 },
    { id: 'score_5000', desc: 'Score 5000 points', target: 5000, stat: 'score', reward: 200 },
    { id: 'dodge_10', desc: 'Dodge 10 times', target: 10, stat: 'dodges', reward: 60 },
    { id: 'parry_5', desc: 'Parry 5 attacks', target: 5, stat: 'parries', reward: 80 },
    { id: 'special_5', desc: 'Use 5 special abilities', target: 5, stat: 'specials', reward: 70 },
    { id: 'boss_1', desc: 'Defeat a boss', target: 1, stat: 'bosses', reward: 100 },
    { id: 'coins_100', desc: 'Collect 100 coins', target: 100, stat: 'coinsCollected', reward: 40 },
    { id: 'chest_2', desc: 'Open 2 secret chests', target: 2, stat: 'chests', reward: 90 },
    {
      id: 'destroy_5',
      desc: 'Break 5 destructibles',
      target: 5,
      stat: 'destructibles',
      reward: 50,
    },
  ];

  var dailyChallenges = []; // 3 active challenges
  var progress = {}; // { challengeId: currentValue }
  var claimed = {}; // { challengeId: true }
  var lastDate = '';

  // Seeded random from date string
  function seedRandom(seed) {
    var hash = 0;
    for (var i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return function () {
      hash = (hash * 16807) % 2147483647;
      return (hash - 1) / 2147483646;
    };
  }

  function getDateString() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function generateDailyChallenges() {
    var dateStr = getDateString();
    if (dateStr === lastDate && dailyChallenges.length === 3) return;

    lastDate = dateStr;
    progress = {};
    claimed = {};

    var rng = seedRandom(dateStr + 'shatterrealms');
    var pool = CHALLENGE_POOL.slice();
    dailyChallenges = [];

    for (var i = 0; i < 3 && pool.length > 0; i++) {
      var idx = Math.floor(rng() * pool.length);
      dailyChallenges.push(pool[idx]);
      pool.splice(idx, 1);
    }

    save();
  }

  function trackProgress(stat, value) {
    for (var i = 0; i < dailyChallenges.length; i++) {
      var ch = dailyChallenges[i];
      if (ch.stat === stat) {
        progress[ch.id] = Math.max(progress[ch.id] || 0, value);
      }
    }
  }

  function incrementProgress(stat, amount) {
    for (var i = 0; i < dailyChallenges.length; i++) {
      var ch = dailyChallenges[i];
      if (ch.stat === stat) {
        progress[ch.id] = (progress[ch.id] || 0) + (amount || 1);
      }
    }
  }

  function claimReward(challengeId) {
    if (claimed[challengeId]) return false;
    var ch = null;
    for (var i = 0; i < dailyChallenges.length; i++) {
      if (dailyChallenges[i].id === challengeId) {
        ch = dailyChallenges[i];
        break;
      }
    }
    if (!ch) return false;
    if ((progress[ch.id] || 0) < ch.target) return false;

    claimed[ch.id] = true;
    if (typeof inventory !== 'undefined') {
      inventory.coins += ch.reward;
    }
    if (window.SR.Progression) {
      window.SR.Progression.grantXP(ch.reward);
    }

    save();
    return true;
  }

  function getChallenges() {
    return dailyChallenges.map(function (ch) {
      return {
        id: ch.id,
        desc: ch.desc,
        target: ch.target,
        progress: progress[ch.id] || 0,
        reward: ch.reward,
        claimed: !!claimed[ch.id],
        complete: (progress[ch.id] || 0) >= ch.target,
      };
    });
  }

  // Persistence
  function save() {
    if (typeof setCookie === 'function') {
      setCookie(
        'srDailyChallenges',
        JSON.stringify({
          date: lastDate,
          progress: progress,
          claimed: claimed,
        })
      );
    }
  }

  function load() {
    if (typeof getCookie === 'function') {
      var data = getCookie('srDailyChallenges');
      if (data) {
        try {
          var parsed = JSON.parse(data);
          var today = getDateString();
          if (parsed.date === today) {
            lastDate = parsed.date;
            progress = parsed.progress || {};
            claimed = parsed.claimed || {};
          }
        } catch (_e) {
          // ignore
        }
      }
    }
  }

  load();
  generateDailyChallenges();

  window.SR.DailyChallenges = {
    getChallenges: getChallenges,
    trackProgress: trackProgress,
    incrementProgress: incrementProgress,
    claimReward: claimReward,
    generateDailyChallenges: generateDailyChallenges,
  };
})();
