// Weapon upgrades: 5 levels per weapon (damage + cooldown improvements)
(function () {
  'use strict';

  // Upgrade cost per level
  var COSTS = [100, 250, 500, 1000, 2500];
  var MAX_LEVEL = 5;

  // Multipliers per level (index 0 = level 1 bonus)
  var DAMAGE_MULT = [1.0, 1.1, 1.2, 1.35, 1.5, 1.75];
  var COOLDOWN_MULT = [1.0, 0.95, 0.9, 0.85, 0.8, 0.7];

  // { weaponId: upgradeLevel (0-5) }
  var upgrades = {};

  function getLevel(weaponId) {
    return upgrades[weaponId] || 0;
  }

  function getDamageMultiplier(weaponId) {
    var lvl = upgrades[weaponId] || 0;
    return DAMAGE_MULT[lvl] || 1;
  }

  function getCooldownMultiplier(weaponId) {
    var lvl = upgrades[weaponId] || 0;
    return COOLDOWN_MULT[lvl] || 1;
  }

  function getUpgradeCost(weaponId) {
    var lvl = upgrades[weaponId] || 0;
    if (lvl >= MAX_LEVEL) return null;
    return COSTS[lvl];
  }

  function upgrade(weaponId) {
    var lvl = upgrades[weaponId] || 0;
    if (lvl >= MAX_LEVEL) return false;

    var cost = COSTS[lvl];
    if (typeof inventory === 'undefined' || inventory.coins < cost) return false;

    inventory.coins -= cost;
    upgrades[weaponId] = lvl + 1;
    save();

    // Show upgrade notification
    var div = document.createElement('div');
    div.style.cssText =
      'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'background:rgba(0,0,0,0.9);color:#00ff88;padding:15px 25px;' +
      'border:2px solid #00ff88;border-radius:10px;z-index:200;' +
      'font-size:16px;font-weight:bold;text-align:center;';
    div.innerHTML =
      'Weapon Upgraded!<br><span style="font-size:12px;color:#aaa;">' +
      weaponId +
      ' Lv.' +
      (lvl + 1) +
      '</span>';
    document.body.appendChild(div);
    setTimeout(function () {
      div.remove();
    }, 2000);

    return true;
  }

  // Persistence
  function save() {
    if (typeof setCookie === 'function') {
      setCookie('srWeaponUpgrades', JSON.stringify(upgrades));
    }
  }

  function load() {
    if (typeof getCookie === 'function') {
      var data = getCookie('srWeaponUpgrades');
      if (data) {
        try {
          upgrades = JSON.parse(data);
        } catch (_e) {
          upgrades = {};
        }
      }
    }
  }

  load();

  window.SR.WeaponUpgrades = {
    getLevel: getLevel,
    getDamageMultiplier: getDamageMultiplier,
    getCooldownMultiplier: getCooldownMultiplier,
    getUpgradeCost: getUpgradeCost,
    upgrade: upgrade,
    MAX_LEVEL: MAX_LEVEL,
  };
})();
