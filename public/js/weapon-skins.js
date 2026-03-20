// Weapon skins: cosmetic color, emissive, and trail variants
(function () {
  'use strict';

  // Skin definitions: { color, emissive, trailColor, name }
  var SKINS = {
    default: { name: 'Default', color: null, emissive: null, trail: null, price: 0 },
    crimson: { name: 'Crimson', color: 0xcc0000, emissive: 0xff2200, trail: 0xff4444, price: 200 },
    arctic: { name: 'Arctic', color: 0x88ccff, emissive: 0x4488ff, trail: 0x66bbff, price: 200 },
    toxic: { name: 'Toxic', color: 0x44ff00, emissive: 0x22cc00, trail: 0x66ff33, price: 200 },
    golden: { name: 'Golden', color: 0xffd700, emissive: 0xffaa00, trail: 0xffdd44, price: 500 },
    shadow: { name: 'Shadow', color: 0x222222, emissive: 0x440066, trail: 0x6600aa, price: 300 },
    plasma: { name: 'Plasma', color: 0xcc00ff, emissive: 0xaa00ff, trail: 0xdd44ff, price: 400 },
    inferno: {
      name: 'Inferno',
      color: 0xff4400,
      emissive: 0xff2200,
      trail: 0xff6600,
      price: 350,
    },
    frost: { name: 'Frost', color: 0xaaddff, emissive: 0x88bbff, trail: 0xccddff, price: 350 },
    void: { name: 'Void', color: 0x110022, emissive: 0x220044, trail: 0x330066, price: 600 },
    celestial: {
      name: 'Celestial',
      color: 0xffffff,
      emissive: 0xffffcc,
      trail: 0xffffee,
      price: 800,
    },
  };

  // Equipped skins per weapon: { weaponId: skinId }
  var equipped = {};

  function equip(weaponId, skinId) {
    if (!SKINS[skinId]) return false;
    equipped[weaponId] = skinId;
    saveSkins();
    return true;
  }

  function getEquipped(weaponId) {
    return equipped[weaponId] || 'default';
  }

  function getSkinDef(skinId) {
    return SKINS[skinId] || SKINS['default'];
  }

  function getTrailColor(weaponId) {
    var skinId = equipped[weaponId] || 'default';
    var def = SKINS[skinId];
    return def && def.trail ? def.trail : null;
  }

  // Apply skin visuals to the sword mesh
  function applySkinToMesh(mesh, weaponId) {
    if (!mesh) return;
    var skinId = equipped[weaponId] || 'default';
    var def = SKINS[skinId];
    if (!def || skinId === 'default') return;

    mesh.traverse(function (child) {
      if (child.isMesh && child.material) {
        if (def.color !== null) child.material.color = new THREE.Color(def.color);
        if (def.emissive !== null) {
          child.material.emissive = new THREE.Color(def.emissive);
          child.material.emissiveIntensity = 0.4;
        }
      }
    });
  }

  // Persistence via cookies
  function saveSkins() {
    if (typeof setCookie === 'function') {
      setCookie('weaponSkins', JSON.stringify(equipped));
    }
  }

  function loadSkins() {
    if (typeof getCookie === 'function') {
      var data = getCookie('weaponSkins');
      if (data) {
        try {
          equipped = JSON.parse(data);
        } catch (_e) {
          equipped = {};
        }
      }
    }
  }

  // Load on init
  loadSkins();

  window.SR.WeaponSkins = {
    SKINS: SKINS,
    equip: equip,
    getEquipped: getEquipped,
    getSkinDef: getSkinDef,
    getTrailColor: getTrailColor,
    applySkinToMesh: applySkinToMesh,
    loadSkins: loadSkins,
  };
})();
