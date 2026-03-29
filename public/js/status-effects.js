// Status effects system: poison, bleed, stun, slow, burn, freeze
(function () {
  'use strict';

  // Each active effect: { type, target, remaining, tickTimer, dps, source }
  // target is an enemy object (has .mesh, .health, .speed, .baseSpeed)
  // or the string 'player' for effects on the player.
  const activeEffects = [];

  // Effect definitions
  const DEFS = {
    poison: { duration: 5000, dps: 4, speedMult: 1, color: 0x00ff66 },
    bleed: { duration: 4000, dps: 6, speedMult: 1, color: 0xff3333 },
    burn: { duration: 3000, dps: 8, speedMult: 1, color: 0xff6600 },
    freeze: { duration: 3000, dps: 0, speedMult: 0.3, color: 0x00ccff },
    slow: { duration: 4000, dps: 0, speedMult: 0.5, color: 0x8888ff },
    stun: { duration: 1500, dps: 0, speedMult: 0, color: 0xffaaff },
  };

  // Map elemental weapons to status effects
  const WEAPON_EFFECTS = {
    flame_sword: 'burn',
    frost_axe: 'freeze',
    thunder_hammer: 'stun',
    venom_dagger: 'poison',
    earth_mace: 'slow',
    shadow_scythe: 'bleed',
    holy_lance: 'burn',
    wind_blade: 'slow',
    iceball: 'freeze',
    frost_nova: 'freeze',
    poison: 'poison',
    chain_lightning: 'stun',
    fire_storm: 'burn',
    molotov: 'burn',
    blowdart: 'poison',
  };

  function apply(target, type) {
    var def = DEFS[type];
    if (!def) return;

    // Don't stack the same effect type on the same target – refresh instead
    for (var i = 0; i < activeEffects.length; i++) {
      if (activeEffects[i].target === target && activeEffects[i].type === type) {
        activeEffects[i].remaining = def.duration;
        return;
      }
    }

    // Store original speed so we can restore it later
    if (target !== 'player' && target.baseSpeed === undefined) {
      target.baseSpeed = target.speed;
    }

    activeEffects.push({
      type: type,
      target: target,
      remaining: def.duration,
      tickTimer: 0,
      dps: def.dps,
      speedMult: def.speedMult,
      color: def.color,
    });

    // Visual tint on enemies
    if (target !== 'player' && target.mesh) {
      tintMesh(target.mesh, def.color);
    }
  }

  function applyFromWeapon(target, weaponId) {
    var effectType = WEAPON_EFFECTS[weaponId];
    if (effectType) apply(target, effectType);
  }

  function tintMesh(mesh, color) {
    mesh.traverse(function (child) {
      if (child.isMesh && child.material) {
        child.material.emissive = new THREE.Color(color);
        child.material.emissiveIntensity = 0.4;
      }
    });
  }

  function clearTint(mesh) {
    mesh.traverse(function (child) {
      if (child.isMesh && child.material) {
        child.material.emissiveIntensity = 0;
      }
    });
  }

  function update(dt) {
    for (var i = activeEffects.length - 1; i >= 0; i--) {
      var fx = activeEffects[i];
      fx.remaining -= dt;
      fx.tickTimer += dt;

      // Damage tick every 500ms
      if (fx.dps > 0 && fx.tickTimer >= 500) {
        fx.tickTimer -= 500;
        var tickDmg = fx.dps * 0.5; // dps * 0.5s

        if (fx.target === 'player') {
          if (typeof damagePlayer === 'function') {
            damagePlayer(tickDmg);
          }
          if (window.SR.VFX) {
            window.SR.VFX.showDamageNumber(
              playerState.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
              tickDmg,
              fx.type
            );
          }
        } else if (fx.target.mesh && !fx.target.dying) {
          fx.target.health -= tickDmg;
          if (window.SR.VFX) {
            window.SR.VFX.showDamageNumber(
              fx.target.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)),
              tickDmg,
              fx.type
            );
          }
          if (fx.target.health <= 0 && typeof killEnemy === 'function') {
            killEnemy(fx.target);
          }
        }
      }

      // Apply speed modifier
      if (fx.target !== 'player' && fx.target.baseSpeed !== undefined) {
        fx.target.speed = fx.target.baseSpeed * fx.speedMult;
      }

      // Expire
      if (fx.remaining <= 0) {
        // Restore speed
        if (fx.target !== 'player' && fx.target.baseSpeed !== undefined) {
          fx.target.speed = fx.target.baseSpeed;
        }
        // Clear tint
        if (fx.target !== 'player' && fx.target.mesh) {
          // Only clear if no other effects remain on this target
          var hasOther = false;
          for (var j = 0; j < activeEffects.length; j++) {
            if (j !== i && activeEffects[j].target === fx.target) {
              hasOther = true;
              break;
            }
          }
          if (!hasOther) clearTint(fx.target.mesh);
        }
        activeEffects.splice(i, 1);
      }
    }
  }

  function getSpeedModifier() {
    // Returns minimum speed multiplier affecting the player
    var mult = 1;
    for (var i = 0; i < activeEffects.length; i++) {
      if (activeEffects[i].target === 'player') {
        mult = Math.min(mult, activeEffects[i].speedMult);
      }
    }
    return mult;
  }

  function isStunned(target) {
    for (var i = 0; i < activeEffects.length; i++) {
      if (activeEffects[i].target === target && activeEffects[i].type === 'stun') {
        return true;
      }
    }
    return false;
  }

  function clearAllFor(target) {
    for (var i = activeEffects.length - 1; i >= 0; i--) {
      if (activeEffects[i].target === target) {
        if (target !== 'player' && target.baseSpeed !== undefined) {
          target.speed = target.baseSpeed;
        }
        activeEffects.splice(i, 1);
      }
    }
    if (target !== 'player' && target.mesh) clearTint(target.mesh);
  }

  function getActiveEffects(target) {
    var result = [];
    for (var i = 0; i < activeEffects.length; i++) {
      if (activeEffects[i].target === target) {
        result.push(activeEffects[i].type);
      }
    }
    return result;
  }

  window.SR.StatusEffects = {
    apply: apply,
    applyFromWeapon: applyFromWeapon,
    update: update,
    getSpeedModifier: getSpeedModifier,
    isStunned: isStunned,
    clearAllFor: clearAllFor,
    getActiveEffects: getActiveEffects,
    WEAPON_EFFECTS: WEAPON_EFFECTS,
  };
})();
