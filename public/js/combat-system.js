// Combat system: combos, dodge roll, parry, and per-weapon special abilities (Q)
(function () {
  'use strict';

  // ── Combo System ────────────────────────────────────────────────
  var comboCount = 0;
  var comboTimer = 0;
  var COMBO_TIMEOUT = 2000; // ms before combo resets
  var COMBO_MULT_STEP = 0.15; // +15 % per hit, capped at 2.5×

  function registerHit() {
    comboCount++;
    comboTimer = COMBO_TIMEOUT;
    updateComboHUD();
  }

  function getComboMultiplier() {
    if (comboCount <= 1) return 1;
    return Math.min(1 + (comboCount - 1) * COMBO_MULT_STEP, 2.5);
  }

  function updateComboHUD() {
    var el = document.getElementById('comboDisplay');
    if (!el) return;
    if (comboCount >= 2) {
      el.style.display = 'block';
      el.textContent = comboCount + 'x COMBO (' + getComboMultiplier().toFixed(1) + '×)';
      el.style.transform = 'scale(1.2)';
      setTimeout(function () {
        el.style.transform = 'scale(1)';
      }, 100);
    } else {
      el.style.display = 'none';
    }
  }

  // ── Dodge Roll ──────────────────────────────────────────────────
  var dodgeActive = false;
  var dodgeTimer = 0;
  var dodgeCooldown = 0;
  var dodgeDirection = null;
  var DODGE_DURATION = 350; // ms of i-frames + movement
  var DODGE_COOLDOWN = 800; // ms before next dodge
  var DODGE_DISTANCE = 4; // total distance covered
  var DODGE_ENERGY = 15;

  function tryDodge() {
    if (dodgeActive || dodgeCooldown > 0) return false;
    if (typeof playerState === 'undefined' || !playerState) return false;
    if (playerState.energy < DODGE_ENERGY) return false;

    playerState.energy -= DODGE_ENERGY;
    dodgeActive = true;
    dodgeTimer = 0;

    // Dodge in current movement direction, or backward if stationary
    var dir = new THREE.Vector3();
    var forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    var right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    var mx = 0;
    var mz = 0;
    if (typeof keys !== 'undefined') {
      if (keys['KeyW']) mz += 1;
      if (keys['KeyS']) mz -= 1;
      if (keys['KeyA']) mx -= 1;
      if (keys['KeyD']) mx += 1;
    }

    if (mx === 0 && mz === 0) {
      // Dodge backward
      dir.copy(forward).negate();
    } else {
      dir.addScaledVector(forward, mz);
      dir.addScaledVector(right, mx);
      dir.normalize();
    }

    dodgeDirection = dir;
    return true;
  }

  function isDodging() {
    return dodgeActive;
  }

  // ── Parry ───────────────────────────────────────────────────────
  var parryActive = false;
  var parryTimer = 0;
  var parryCooldown = 0;
  var PARRY_WINDOW = 250; // ms of active parry
  var PARRY_COOLDOWN = 1200;
  var lastParrySuccess = false;

  function tryParry() {
    if (parryActive || parryCooldown > 0) return false;
    parryActive = true;
    parryTimer = 0;
    lastParrySuccess = false;

    // Flash a parry indicator
    var el = document.getElementById('parryIndicator');
    if (el) {
      el.style.display = 'block';
      el.style.opacity = '1';
    }
    return true;
  }

  function isParrying() {
    return parryActive;
  }

  function onParrySuccess() {
    lastParrySuccess = true;
    // Stun nearby enemies briefly
    if (typeof enemies !== 'undefined' && window.SR.StatusEffects) {
      enemies.forEach(function (e) {
        if (!e.mesh || e.dying) return;
        var dist = e.mesh.position.distanceTo(playerState.position);
        if (dist < 3) {
          window.SR.StatusEffects.apply(e, 'stun');
        }
      });
    }
    // Visual flash
    var v = document.createElement('div');
    v.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:radial-gradient(circle,transparent 40%,rgba(255,255,100,0.2) 100%);' +
      'pointer-events:none;z-index:150;';
    document.body.appendChild(v);
    setTimeout(function () {
      v.remove();
    }, 120);
  }

  // ── Special Abilities (Q key) ───────────────────────────────────
  // Each weapon has a unique special ability on a longer cooldown.
  var specialCooldown = 0;
  var SPECIAL_COOLDOWNS = {}; // set per weapon

  var ABILITIES = {
    // ─ Melee ─
    sword: {
      name: 'Whirlwind',
      cooldown: 8000,
      energy: 30,
      action: function () {
        aoeAttack(3, 40, 0xccccff);
      },
    },
    axe: {
      name: 'Cleave',
      cooldown: 7000,
      energy: 25,
      action: function () {
        aoeAttack(3.5, 60, 0x884400);
      },
    },
    hammer: {
      name: 'Ground Pound',
      cooldown: 10000,
      energy: 40,
      action: function () {
        aoeAttack(4.5, 80, 0x666666);
        stunNearby(4.5);
      },
    },
    dagger: {
      name: 'Backstab',
      cooldown: 5000,
      energy: 15,
      action: function () {
        backstab(100);
      },
    },
    katana: {
      name: 'Iaido Strike',
      cooldown: 6000,
      energy: 20,
      action: function () {
        lineAttack(5, 70, 0xeeeeff);
      },
    },
    spear: {
      name: 'Impale',
      cooldown: 7000,
      energy: 25,
      action: function () {
        lineAttack(6, 55, 0x886633);
      },
    },
    scythe: {
      name: 'Soul Reap',
      cooldown: 9000,
      energy: 35,
      action: function () {
        aoeAttack(3.5, 70, 0x220044);
        healPlayer(20);
      },
    },
    mace: {
      name: 'Skull Crack',
      cooldown: 7000,
      energy: 25,
      action: function () {
        lineAttack(3, 65, 0xaaaaaa);
        stunNearby(3);
      },
    },
    claws: {
      name: 'Frenzy',
      cooldown: 6000,
      energy: 20,
      action: function () {
        rapidAttack(5, 20, 0xffaaaa);
      },
    },
    chainsaw: {
      name: 'Rampage',
      cooldown: 8000,
      energy: 30,
      action: function () {
        aoeAttack(2.5, 90, 0xff2222);
      },
    },

    // ─ Legendary Melee ─
    excalibur: {
      name: 'Holy Judgement',
      cooldown: 12000,
      energy: 50,
      action: function () {
        aoeAttack(6, 120, 0xffffcc);
        healPlayer(30);
      },
    },
    mjolnir: {
      name: 'Lightning Storm',
      cooldown: 14000,
      energy: 60,
      action: function () {
        aoeAttack(7, 150, 0xffff00);
        stunNearby(7);
      },
    },
    gungnir: {
      name: "Odin's Throw",
      cooldown: 10000,
      energy: 45,
      action: function () {
        lineAttack(15, 130, 0x4488ff);
      },
    },
    kusanagi: {
      name: 'Wind Cutter',
      cooldown: 8000,
      energy: 35,
      action: function () {
        aoeAttack(5, 110, 0x88ffcc);
      },
    },

    // ─ Ranged ─
    bow: {
      name: 'Arrow Rain',
      cooldown: 10000,
      energy: 35,
      action: function () {
        aoeAttack(5, 50, 0x8b4513);
      },
    },
    crossbow: {
      name: 'Piercing Bolt',
      cooldown: 8000,
      energy: 30,
      action: function () {
        lineAttack(12, 80, 0x444444);
      },
    },
    shuriken: {
      name: 'Blade Storm',
      cooldown: 6000,
      energy: 20,
      action: function () {
        aoeAttack(4, 35, 0xcccccc);
      },
    },

    // ─ Elemental ─
    flame_sword: {
      name: 'Inferno Slash',
      cooldown: 8000,
      energy: 30,
      action: function () {
        aoeAttack(4, 60, 0xff4400);
        applyEffectNearby('burn', 4);
      },
    },
    frost_axe: {
      name: 'Blizzard Chop',
      cooldown: 8000,
      energy: 30,
      action: function () {
        aoeAttack(4, 55, 0x00ccff);
        applyEffectNearby('freeze', 4);
      },
    },
    thunder_hammer: {
      name: 'Thunderclap',
      cooldown: 10000,
      energy: 40,
      action: function () {
        aoeAttack(5, 75, 0xffff00);
        stunNearby(5);
      },
    },
    venom_dagger: {
      name: 'Toxic Flurry',
      cooldown: 6000,
      energy: 20,
      action: function () {
        rapidAttack(4, 15, 0x00ff66);
        applyEffectNearby('poison', 3);
      },
    },
    shadow_scythe: {
      name: 'Shadow Rend',
      cooldown: 9000,
      energy: 35,
      action: function () {
        aoeAttack(4, 65, 0x220044);
        applyEffectNearby('bleed', 4);
      },
    },

    // ─ Magic (use the same key for caster weapons) ─
    fireball: {
      name: 'Firestorm',
      cooldown: 10000,
      energy: 40,
      action: function () {
        aoeAttack(5, 70, 0xff4400);
        applyEffectNearby('burn', 5);
      },
    },
    lightning: {
      name: 'Chain Bolt',
      cooldown: 10000,
      energy: 45,
      action: function () {
        aoeAttack(6, 80, 0xffff00);
        stunNearby(6);
      },
    },
    meteor: {
      name: 'Cataclysm',
      cooldown: 15000,
      energy: 70,
      action: function () {
        aoeAttack(8, 150, 0xff6600);
        applyEffectNearby('burn', 8);
      },
    },
  };

  // Fallback for weapons without a defined ability
  var DEFAULT_ABILITY = {
    name: 'Power Strike',
    cooldown: 6000,
    energy: 20,
    action: function () {
      aoeAttack(3, 45, 0xffffff);
    },
  };

  function getAbility(weaponId) {
    return ABILITIES[weaponId] || DEFAULT_ABILITY;
  }

  function useSpecialAbility() {
    if (specialCooldown > 0) return false;
    if (typeof playerState === 'undefined' || !playerState) return false;
    if (typeof hotbar === 'undefined' || typeof selectedSlot === 'undefined') return false;

    var weaponId = hotbar[selectedSlot];
    if (!weaponId) return false;

    var ability = getAbility(weaponId);
    if (playerState.energy < ability.energy) return false;

    playerState.energy -= ability.energy;
    specialCooldown = ability.cooldown;
    ability.action();

    // Show ability name
    showAbilityName(ability.name);
    updateSpecialHUD();
    return true;
  }

  function showAbilityName(name) {
    var el = document.getElementById('abilityName');
    if (!el) return;
    el.textContent = name;
    el.style.opacity = '1';
    setTimeout(function () {
      el.style.opacity = '0';
    }, 1200);
  }

  function updateSpecialHUD() {
    var el = document.getElementById('specialCooldownDisplay');
    if (!el) return;

    if (typeof hotbar !== 'undefined' && typeof selectedSlot !== 'undefined') {
      var weaponId = hotbar[selectedSlot];
      var ability = getAbility(weaponId);
      el.title = ability.name;
    }

    if (specialCooldown > 0) {
      el.textContent = 'Q: ' + (specialCooldown / 1000).toFixed(1) + 's';
      el.style.opacity = '0.6';
    } else {
      el.textContent = 'Q: READY';
      el.style.opacity = '1';
    }
  }

  // ── Ability Helpers (AOE, Line, Backstab, Rapid) ────────────────

  function aoeAttack(radius, damage, color) {
    if (typeof enemies === 'undefined') return;
    var pos = playerState.position;

    // Visual burst
    if (typeof createExplosionParticles === 'function') {
      createExplosionParticles(pos.clone().add(new THREE.Vector3(0, 0.5, 0)), color, 0xffffff);
    }

    enemies.forEach(function (e) {
      if (!e.mesh || e.dying) return;
      if (e.mesh.position.distanceTo(pos) < radius) {
        var finalDmg = damage * getComboMultiplier();
        if (typeof damageEnemy === 'function') damageEnemy(e, finalDmg, false);
        registerHit();
      }
    });

    if (typeof boss !== 'undefined' && boss && boss.mesh) {
      if (boss.mesh.position.distanceTo(pos) < radius) {
        if (typeof damageBoss === 'function') damageBoss(damage * getComboMultiplier(), false);
        registerHit();
      }
    }
  }

  function lineAttack(range, damage, color) {
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    var pos = playerState.position;

    if (typeof createSlashParticles === 'function') {
      createSlashParticles(pos.clone().add(dir.clone().multiplyScalar(1)), dir, color);
    }

    if (typeof enemies === 'undefined') return;
    enemies.forEach(function (e) {
      if (!e.mesh || e.dying) return;
      var toEnemy = e.mesh.position.clone().sub(pos);
      toEnemy.y = 0;
      var dist = toEnemy.length();
      if (dist > range) return;
      toEnemy.normalize();
      if (toEnemy.dot(dir) > 0.7) {
        var finalDmg = damage * getComboMultiplier();
        if (typeof damageEnemy === 'function') damageEnemy(e, finalDmg, false);
        registerHit();
      }
    });

    if (typeof boss !== 'undefined' && boss && boss.mesh) {
      var toBoss = boss.mesh.position.clone().sub(pos);
      toBoss.y = 0;
      var bDist = toBoss.length();
      if (bDist <= range) {
        toBoss.normalize();
        if (toBoss.dot(dir) > 0.7) {
          if (typeof damageBoss === 'function') damageBoss(damage * getComboMultiplier(), false);
          registerHit();
        }
      }
    }
  }

  function backstab(damage) {
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    var pos = playerState.position;
    var bestEnemy = null;
    var bestDist = 4;

    if (typeof enemies === 'undefined') return;
    enemies.forEach(function (e) {
      if (!e.mesh || e.dying) return;
      var d = e.mesh.position.distanceTo(pos);
      if (d < bestDist) {
        bestDist = d;
        bestEnemy = e;
      }
    });

    if (bestEnemy) {
      var finalDmg = damage * getComboMultiplier();
      if (typeof damageEnemy === 'function') damageEnemy(bestEnemy, finalDmg, true);
      registerHit();
    }
  }

  function rapidAttack(range, damagePerHit, color) {
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    var pos = playerState.position;
    var hits = 5;

    function doHit(hitNum) {
      if (hitNum >= hits) return;
      setTimeout(function () {
        if (typeof enemies === 'undefined') return;
        enemies.forEach(function (e) {
          if (!e.mesh || e.dying) return;
          var toEnemy = e.mesh.position.clone().sub(pos);
          toEnemy.y = 0;
          if (toEnemy.length() < range && toEnemy.normalize().dot(dir) > 0.5) {
            var finalDmg = damagePerHit * getComboMultiplier();
            if (typeof damageEnemy === 'function') damageEnemy(e, finalDmg, false);
            registerHit();
          }
        });
        doHit(hitNum + 1);
      }, 80);
    }
    doHit(0);
  }

  function stunNearby(radius) {
    if (!window.SR.StatusEffects || typeof enemies === 'undefined') return;
    enemies.forEach(function (e) {
      if (!e.mesh || e.dying) return;
      if (e.mesh.position.distanceTo(playerState.position) < radius) {
        window.SR.StatusEffects.apply(e, 'stun');
      }
    });
  }

  function applyEffectNearby(effectType, radius) {
    if (!window.SR.StatusEffects || typeof enemies === 'undefined') return;
    enemies.forEach(function (e) {
      if (!e.mesh || e.dying) return;
      if (e.mesh.position.distanceTo(playerState.position) < radius) {
        window.SR.StatusEffects.apply(e, effectType);
      }
    });
  }

  function healPlayer(amount) {
    if (typeof playerState === 'undefined' || !playerState) return;
    playerState.health = Math.min(playerState.maxHealth, playerState.health + amount);
    if (window.SR.VFX) {
      window.SR.VFX.showDamageNumber(
        playerState.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
        amount,
        'heal'
      );
    }
  }

  // ── Main Update ─────────────────────────────────────────────────

  function update(dt) {
    // Combo decay
    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) {
        comboCount = 0;
        updateComboHUD();
      }
    }

    // Dodge update
    if (dodgeCooldown > 0) dodgeCooldown -= dt;
    if (dodgeActive) {
      dodgeTimer += dt;
      if (dodgeTimer >= DODGE_DURATION) {
        dodgeActive = false;
        dodgeCooldown = DODGE_COOLDOWN;
        dodgeDirection = null;
      } else if (dodgeDirection && typeof playerState !== 'undefined' && playerState) {
        // Move player in dodge direction
        var speed = (DODGE_DISTANCE / DODGE_DURATION) * dt;
        playerState.position.x += dodgeDirection.x * speed;
        playerState.position.z += dodgeDirection.z * speed;
      }
    }

    // Parry update
    if (parryCooldown > 0) parryCooldown -= dt;
    if (parryActive) {
      parryTimer += dt;
      if (parryTimer >= PARRY_WINDOW) {
        parryActive = false;
        parryCooldown = PARRY_COOLDOWN;
        var el = document.getElementById('parryIndicator');
        if (el) el.style.display = 'none';
      }
    }

    // Special cooldown
    if (specialCooldown > 0) {
      specialCooldown -= dt;
      if (specialCooldown < 0) specialCooldown = 0;
      updateSpecialHUD();
    }
  }

  // ── Public API ──────────────────────────────────────────────────

  window.SR.Combat = {
    registerHit: registerHit,
    getComboMultiplier: getComboMultiplier,
    tryDodge: tryDodge,
    isDodging: isDodging,
    tryParry: tryParry,
    isParrying: isParrying,
    onParrySuccess: onParrySuccess,
    useSpecialAbility: useSpecialAbility,
    getAbility: getAbility,
    update: update,
    getComboCount: function () {
      return comboCount;
    },
    getSpecialCooldown: function () {
      return specialCooldown;
    },
    getDodgeDirection: function () {
      return dodgeDirection;
    },
  };
})();
