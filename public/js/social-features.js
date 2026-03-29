// Social features: player profiles, clans, gift system
(function () {
  'use strict';

  // ── Player Profile ──────────────────────────────────────────────

  var profile = {
    name: '',
    title: 'Novice',
    favoriteWeapon: 'sword',
    totalKills: 0,
    totalDeaths: 0,
    gamesPlayed: 0,
    highestWave: 0,
    highestScore: 0,
    joinDate: null,
  };

  function loadProfile() {
    if (typeof getCookie === 'function') {
      var data = getCookie('srProfile');
      if (data) {
        try {
          var parsed = JSON.parse(data);
          for (var key in parsed) {
            profile[key] = parsed[key];
          }
        } catch (_e) {
          // ignore
        }
      }
    }
    if (!profile.joinDate) {
      profile.joinDate = new Date().toISOString().split('T')[0];
    }
  }

  function saveProfile() {
    if (typeof setCookie === 'function') {
      setCookie('srProfile', JSON.stringify(profile));
    }
  }

  function updateProfile(updates) {
    for (var key in updates) {
      profile[key] = updates[key];
    }
    saveProfile();
  }

  function getKDRatio() {
    if (profile.totalDeaths === 0) return profile.totalKills;
    return (profile.totalKills / profile.totalDeaths).toFixed(2);
  }

  // Profile panel
  function openProfilePanel() {
    var existing = document.getElementById('profilePanel');
    if (existing) {
      existing.remove();
      return;
    }

    var panel = document.createElement('div');
    panel.id = 'profilePanel';
    panel.style.cssText =
      'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'width:350px;background:rgba(10,10,20,0.95);border:2px solid #3498db;' +
      'border-radius:12px;z-index:300;color:#fff;padding:20px;';

    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">' +
      '<h3 style="margin:0;color:#3498db;">Player Profile</h3>' +
      '<button onclick="document.getElementById(\'profilePanel\').remove()" style="background:none;border:none;color:#aaa;font-size:18px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<div style="border-bottom:1px solid #333;padding-bottom:10px;margin-bottom:10px;">' +
      '<div style="font-size:18px;font-weight:bold;">' +
      (profile.name || 'Anonymous') +
      '</div>' +
      '<div style="color:#ffd700;font-size:12px;">' +
      profile.title +
      '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">' +
      statRow('K/D Ratio', getKDRatio()) +
      statRow('Total Kills', profile.totalKills) +
      statRow('Games Played', profile.gamesPlayed) +
      statRow('Highest Wave', profile.highestWave) +
      statRow('Highest Score', profile.highestScore) +
      statRow('Fav. Weapon', profile.favoriteWeapon) +
      statRow('Joined', profile.joinDate) +
      statRow('Level', window.SR.Progression ? window.SR.Progression.getLevel() : 1) +
      '</div>';

    document.body.appendChild(panel);
  }

  function statRow(label, value) {
    return (
      '<div style="background:rgba(255,255,255,0.05);padding:6px 8px;border-radius:4px;">' +
      '<div style="color:#888;font-size:10px;">' +
      label +
      '</div>' +
      '<div style="font-weight:bold;">' +
      value +
      '</div></div>'
    );
  }

  // ── Clans ───────────────────────────────────────────────────────

  var clan = null; // { id, name, tag, members, leader }

  function createClan(name, tag) {
    if (clan) return false;
    clan = {
      id: 'clan_' + Date.now().toString(36),
      name: name,
      tag: tag.substring(0, 4).toUpperCase(),
      members: [profile.name || 'Anonymous'],
      leader: profile.name || 'Anonymous',
    };
    saveClan();
    return true;
  }

  function joinClan(clanData) {
    clan = clanData;
    saveClan();
  }

  function leaveClan() {
    clan = null;
    saveClan();
  }

  function getClanTag() {
    return clan ? '[' + clan.tag + ']' : '';
  }

  function saveClan() {
    if (typeof setCookie === 'function') {
      setCookie('srClan', JSON.stringify(clan));
    }
  }

  function loadClan() {
    if (typeof getCookie === 'function') {
      var data = getCookie('srClan');
      if (data) {
        try {
          clan = JSON.parse(data);
        } catch (_e) {
          clan = null;
        }
      }
    }
  }

  // ── Gift System ─────────────────────────────────────────────────

  var pendingGifts = []; // { from, type, amount, timestamp }

  function sendGift(toPlayerId, type, amount) {
    if (typeof inventory === 'undefined') return false;
    if (type === 'coins') {
      if (inventory.coins < amount) return false;
      inventory.coins -= amount;
    }

    // Send via multiplayer connection
    if (typeof ws !== 'undefined' && ws && ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: 'gift',
          to: toPlayerId,
          giftType: type,
          amount: amount,
        })
      );
    }
    return true;
  }

  function receiveGift(from, type, amount) {
    pendingGifts.push({
      from: from,
      type: type,
      amount: amount,
      timestamp: Date.now(),
    });

    if (type === 'coins' && typeof inventory !== 'undefined') {
      inventory.coins += amount;
    }

    // Show notification
    var div = document.createElement('div');
    div.style.cssText =
      'position:fixed;top:100px;right:15px;background:rgba(0,0,0,0.85);' +
      'color:#ff88cc;padding:10px 15px;border:1px solid #ff88cc;border-radius:8px;' +
      'z-index:200;font-size:13px;';
    div.textContent = 'Gift from ' + from + ': ' + amount + ' ' + type;
    document.body.appendChild(div);
    setTimeout(function () {
      div.remove();
    }, 3000);
  }

  // Init
  loadProfile();
  loadClan();

  window.SR.Social = {
    // Profile
    getProfile: function () {
      return profile;
    },
    updateProfile: updateProfile,
    openProfilePanel: openProfilePanel,

    // Clans
    getClan: function () {
      return clan;
    },
    createClan: createClan,
    joinClan: joinClan,
    leaveClan: leaveClan,
    getClanTag: getClanTag,

    // Gifts
    sendGift: sendGift,
    receiveGift: receiveGift,
    getPendingGifts: function () {
      return pendingGifts;
    },
  };
})();
