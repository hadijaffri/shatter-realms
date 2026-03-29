// Progression: XP, levels, achievements, battle pass
(function () {
  'use strict';

  // ── XP / Levels ─────────────────────────────────────────────────
  var xp = 0;
  var level = 1;
  var XP_PER_LEVEL = 200; // base; grows 15% per level
  var MAX_LEVEL = 50;

  function xpToNextLevel() {
    return Math.floor(XP_PER_LEVEL * Math.pow(1.15, level - 1));
  }

  function grantXP(amount) {
    if (level >= MAX_LEVEL) return;
    xp += amount;
    while (xp >= xpToNextLevel() && level < MAX_LEVEL) {
      xp -= xpToNextLevel();
      level++;
      onLevelUp();
    }
    updateXPBar();
    save();
  }

  function onLevelUp() {
    // Stat bonuses
    if (typeof playerState !== 'undefined' && playerState) {
      playerState.maxHealth += 5;
      playerState.health = playerState.maxHealth;
      playerState.maxEnergy += 3;
      playerState.energy = playerState.maxEnergy;
    }

    // Announce
    var div = document.createElement('div');
    div.style.cssText =
      'position:fixed;top:45%;left:50%;transform:translate(-50%,-50%);' +
      'color:#ffd700;font-size:28px;font-weight:bold;z-index:200;' +
      'text-shadow:0 0 10px rgba(255,215,0,0.8);pointer-events:none;';
    div.textContent = 'LEVEL UP! Lv.' + level;
    document.body.appendChild(div);
    setTimeout(function () {
      div.remove();
    }, 2500);

    // Battle pass progress
    advanceBattlePass();

    // Check achievements
    checkAchievements();
  }

  function updateXPBar() {
    var bar = document.getElementById('xpBarFill');
    var text = document.getElementById('xpBarText');
    if (bar) {
      var pct = level >= MAX_LEVEL ? 100 : (xp / xpToNextLevel()) * 100;
      bar.style.width = pct + '%';
    }
    if (text) {
      text.textContent =
        level >= MAX_LEVEL
          ? 'Lv.' + level + ' MAX'
          : 'Lv.' + level + ' - ' + xp + '/' + xpToNextLevel() + ' XP';
    }
  }

  // ── Achievements ────────────────────────────────────────────────
  var ACHIEVEMENT_DEFS = [
    {
      id: 'first_blood',
      name: 'First Blood',
      desc: 'Kill your first enemy',
      check: function (s) {
        return s.totalKills >= 1;
      },
    },
    {
      id: 'slayer_10',
      name: 'Slayer',
      desc: 'Kill 10 enemies',
      check: function (s) {
        return s.totalKills >= 10;
      },
    },
    {
      id: 'slayer_100',
      name: 'Centurion',
      desc: 'Kill 100 enemies',
      check: function (s) {
        return s.totalKills >= 100;
      },
    },
    {
      id: 'slayer_500',
      name: 'Warlord',
      desc: 'Kill 500 enemies',
      check: function (s) {
        return s.totalKills >= 500;
      },
    },
    {
      id: 'slayer_1000',
      name: 'Annihilator',
      desc: 'Kill 1000 enemies',
      check: function (s) {
        return s.totalKills >= 1000;
      },
    },
    {
      id: 'boss_slayer',
      name: 'Boss Slayer',
      desc: 'Defeat a boss',
      check: function (s) {
        return s.bossKills >= 1;
      },
    },
    {
      id: 'boss_master',
      name: 'Boss Master',
      desc: 'Defeat 10 bosses',
      check: function (s) {
        return s.bossKills >= 10;
      },
    },
    {
      id: 'wave_5',
      name: 'Survivor',
      desc: 'Reach wave 5',
      check: function (s) {
        return s.highestWave >= 5;
      },
    },
    {
      id: 'wave_10',
      name: 'Veteran',
      desc: 'Reach wave 10',
      check: function (s) {
        return s.highestWave >= 10;
      },
    },
    {
      id: 'wave_20',
      name: 'Elite',
      desc: 'Reach wave 20',
      check: function (s) {
        return s.highestWave >= 20;
      },
    },
    {
      id: 'wave_50',
      name: 'Legend',
      desc: 'Reach wave 50',
      check: function (s) {
        return s.highestWave >= 50;
      },
    },
    {
      id: 'rich_100',
      name: 'Pocket Change',
      desc: 'Earn 100 coins',
      check: function (s) {
        return s.totalCoins >= 100;
      },
    },
    {
      id: 'rich_1000',
      name: 'Wealthy',
      desc: 'Earn 1000 coins',
      check: function (s) {
        return s.totalCoins >= 1000;
      },
    },
    {
      id: 'rich_10000',
      name: 'Tycoon',
      desc: 'Earn 10000 coins',
      check: function (s) {
        return s.totalCoins >= 10000;
      },
    },
    {
      id: 'combo_5',
      name: 'Combo Starter',
      desc: 'Get a 5x combo',
      check: function (s) {
        return s.highestCombo >= 5;
      },
    },
    {
      id: 'combo_15',
      name: 'Combo Master',
      desc: 'Get a 15x combo',
      check: function (s) {
        return s.highestCombo >= 15;
      },
    },
    {
      id: 'combo_30',
      name: 'Combo God',
      desc: 'Get a 30x combo',
      check: function (s) {
        return s.highestCombo >= 30;
      },
    },
    {
      id: 'level_10',
      name: 'Growing Strong',
      desc: 'Reach level 10',
      check: function (s) {
        return s.level >= 10;
      },
    },
    {
      id: 'level_25',
      name: 'Halfway There',
      desc: 'Reach level 25',
      check: function (s) {
        return s.level >= 25;
      },
    },
    {
      id: 'level_50',
      name: 'Max Power',
      desc: 'Reach level 50',
      check: function (s) {
        return s.level >= 50;
      },
    },
    {
      id: 'treasure_hunter',
      name: 'Treasure Hunter',
      desc: 'Open 5 secret chests',
      check: function (s) {
        return s.chestsOpened >= 5;
      },
    },
    {
      id: 'parry_master',
      name: 'Parry Master',
      desc: 'Successfully parry 20 times',
      check: function (s) {
        return s.parries >= 20;
      },
    },
    {
      id: 'dodge_master',
      name: 'Untouchable',
      desc: 'Dodge 50 times',
      check: function (s) {
        return s.dodges >= 50;
      },
    },
    {
      id: 'special_user',
      name: 'Ability Master',
      desc: 'Use special abilities 30 times',
      check: function (s) {
        return s.specialsUsed >= 30;
      },
    },
  ];

  var unlockedAchievements = {};
  var stats = {
    totalKills: 0,
    bossKills: 0,
    highestWave: 0,
    totalCoins: 0,
    highestCombo: 0,
    level: 1,
    chestsOpened: 0,
    parries: 0,
    dodges: 0,
    specialsUsed: 0,
  };

  function trackStat(key, value) {
    if (typeof value === 'number') {
      stats[key] = (stats[key] || 0) + value;
    } else {
      stats[key] = value;
    }
    stats.level = level;
    checkAchievements();
  }

  function setStatMax(key, value) {
    if (value > (stats[key] || 0)) {
      stats[key] = value;
    }
    checkAchievements();
  }

  function checkAchievements() {
    stats.level = level;
    for (var i = 0; i < ACHIEVEMENT_DEFS.length; i++) {
      var a = ACHIEVEMENT_DEFS[i];
      if (!unlockedAchievements[a.id] && a.check(stats)) {
        unlockedAchievements[a.id] = true;
        showAchievementPopup(a);
        grantXP(50); // Bonus XP for achievements
      }
    }
    save();
  }

  function showAchievementPopup(achievement) {
    var div = document.createElement('div');
    div.style.cssText =
      'position:fixed;top:80px;right:15px;background:rgba(0,0,0,0.85);' +
      'color:#ffd700;padding:12px 18px;border:1px solid #ffd700;border-radius:8px;' +
      'z-index:200;font-size:14px;max-width:250px;';
    div.innerHTML =
      '<div style="font-weight:bold;margin-bottom:4px;">Achievement Unlocked!</div>' +
      '<div>' +
      achievement.name +
      '</div>' +
      '<div style="color:#aaa;font-size:11px;">' +
      achievement.desc +
      '</div>';
    document.body.appendChild(div);
    setTimeout(function () {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.5s';
    }, 3000);
    setTimeout(function () {
      div.remove();
    }, 3500);
  }

  // ── Battle Pass ─────────────────────────────────────────────────
  var battlePassTier = 0;
  var battlePassXP = 0;
  var BP_XP_PER_TIER = 100;
  var BP_MAX_TIER = 30;

  var BP_REWARDS = [];
  // Generate rewards for 30 tiers
  (function () {
    var rewardTypes = ['coins', 'skin', 'title', 'coins', 'emote', 'coins'];
    for (var i = 0; i < BP_MAX_TIER; i++) {
      var type = rewardTypes[i % rewardTypes.length];
      var reward = { tier: i + 1, type: type };
      if (type === 'coins') reward.amount = 50 + i * 10;
      else if (type === 'skin')
        reward.skinId =
          ['crimson', 'arctic', 'toxic', 'golden', 'shadow', 'plasma'][Math.floor(i / 5)] ||
          'celestial';
      else if (type === 'title')
        reward.title =
          ['Novice', 'Warrior', 'Champion', 'Hero', 'Legend'][Math.floor(i / 6)] || 'Mythic';
      else if (type === 'emote')
        reward.emoteId = ['wave', 'dance', 'taunt', 'cheer', 'flex'][Math.floor(i / 6)] || 'bow';
      BP_REWARDS.push(reward);
    }
  })();

  function advanceBattlePass() {
    if (battlePassTier >= BP_MAX_TIER) return;
    battlePassXP += 25;
    while (battlePassXP >= BP_XP_PER_TIER && battlePassTier < BP_MAX_TIER) {
      battlePassXP -= BP_XP_PER_TIER;
      battlePassTier++;
      claimBattlePassReward(battlePassTier);
    }
    save();
  }

  function claimBattlePassReward(tier) {
    var reward = BP_REWARDS[tier - 1];
    if (!reward) return;
    if (reward.type === 'coins' && typeof inventory !== 'undefined') {
      inventory.coins += reward.amount;
    }
    // Other reward types stored for later use
    var div = document.createElement('div');
    div.style.cssText =
      'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.85);color:#00ffaa;padding:10px 16px;' +
      'border:1px solid #00ffaa;border-radius:8px;z-index:200;font-size:13px;';
    div.textContent =
      'Battle Pass Tier ' + tier + ': ' + reward.type + (reward.amount ? ' +' + reward.amount : '');
    document.body.appendChild(div);
    setTimeout(function () {
      div.remove();
    }, 2500);
  }

  // ── Persistence ─────────────────────────────────────────────────
  function save() {
    if (typeof setCookie === 'function') {
      setCookie(
        'srProgress',
        JSON.stringify({
          xp: xp,
          level: level,
          stats: stats,
          achievements: unlockedAchievements,
          bpTier: battlePassTier,
          bpXP: battlePassXP,
        })
      );
    }
  }

  function load() {
    if (typeof getCookie === 'function') {
      var data = getCookie('srProgress');
      if (data) {
        try {
          var parsed = JSON.parse(data);
          xp = parsed.xp || 0;
          level = parsed.level || 1;
          if (parsed.stats) {
            for (var key in parsed.stats) {
              stats[key] = parsed.stats[key];
            }
          }
          if (parsed.achievements) unlockedAchievements = parsed.achievements;
          battlePassTier = parsed.bpTier || 0;
          battlePassXP = parsed.bpXP || 0;
        } catch (_e) {
          // ignore corrupt data
        }
      }
    }
  }

  load();

  window.SR.Progression = {
    grantXP: grantXP,
    getLevel: function () {
      return level;
    },
    getXP: function () {
      return xp;
    },
    xpToNextLevel: xpToNextLevel,
    trackStat: trackStat,
    setStatMax: setStatMax,
    getStats: function () {
      return stats;
    },
    getAchievements: function () {
      return unlockedAchievements;
    },
    getBattlePassTier: function () {
      return battlePassTier;
    },
    updateXPBar: updateXPBar,
    checkAchievements: checkAchievements,
    advanceBattlePass: advanceBattlePass,
    ACHIEVEMENT_DEFS: ACHIEVEMENT_DEFS,
    BP_REWARDS: BP_REWARDS,
  };
})();
