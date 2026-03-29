// Destructible objects: crates, barrels, pots that drop loot
(function () {
  'use strict';

  var objects = []; // { mesh, type, health, x, z, dropped }
  var DEFS = {
    crate: { color: 0x8b6914, health: 30, size: 0.6, loot: 'coins' },
    barrel: { color: 0x664422, health: 20, size: 0.5, loot: 'health' },
    pot: { color: 0xcc8844, health: 10, size: 0.35, loot: 'energy' },
  };
  var TYPES = Object.keys(DEFS);

  function init() {
    cleanup();
    // Scatter destructibles around the map
    for (var i = 0; i < 15; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 8 + Math.random() * 40;
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;
      spawn(x, z);
    }
  }

  function spawn(x, z, type) {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;
    type = type || TYPES[Math.floor(Math.random() * TYPES.length)];
    var def = DEFS[type];

    var geo;
    if (type === 'barrel') {
      geo = new THREE.CylinderGeometry(def.size * 0.4, def.size * 0.4, def.size * 1.2, 8);
    } else if (type === 'pot') {
      geo = new THREE.SphereGeometry(def.size * 0.5, 8, 6);
    } else {
      geo = new THREE.BoxGeometry(def.size, def.size, def.size);
    }

    var mat = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: 0.85,
      metalness: 0.1,
    });
    var mesh = new THREE.Mesh(geo, mat);
    var terrainY = typeof getTerrainHeight === 'function' ? getTerrainHeight(x, z) : 0;
    mesh.position.set(x, terrainY + def.size * 0.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    objects.push({
      mesh: mesh,
      type: type,
      health: def.health,
      maxHealth: def.health,
      x: x,
      z: z,
      dropped: false,
    });
  }

  // Called from meleeAttack / projectile hit checks
  function tryHit(worldPos, damage, radius) {
    if (!worldPos) return false;
    var hit = false;
    for (var i = objects.length - 1; i >= 0; i--) {
      var obj = objects[i];
      if (obj.dropped) continue;
      var dx = worldPos.x - obj.x;
      var dz = worldPos.z - obj.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < (radius || 2.5)) {
        obj.health -= damage;

        // Flash
        if (obj.mesh && obj.mesh.material) {
          obj.mesh.material.emissive = new THREE.Color(0xffffff);
          obj.mesh.material.emissiveIntensity = 0.8;
          setTimeout(
            (function (m) {
              return function () {
                if (m.material) m.material.emissiveIntensity = 0;
              };
            })(obj.mesh),
            80
          );
        }

        if (obj.health <= 0) {
          breakObject(i);
        }
        hit = true;
      }
    }
    return hit;
  }

  function breakObject(index) {
    var obj = objects[index];
    obj.dropped = true;
    var def = DEFS[obj.type];

    // Break particles
    if (typeof createExplosionParticles === 'function') {
      createExplosionParticles(obj.mesh.position.clone(), def.color, 0xffffff);
    }

    // Drop loot
    if (def.loot === 'coins' && typeof spawnCoin === 'function') {
      for (var c = 0; c < 2; c++) {
        var pos = obj.mesh.position.clone();
        pos.x += (Math.random() - 0.5) * 1;
        pos.z += (Math.random() - 0.5) * 1;
        spawnCoin(pos);
      }
    } else if (def.loot === 'health' && typeof playerState !== 'undefined' && playerState) {
      playerState.health = Math.min(playerState.maxHealth, playerState.health + 15);
      if (window.SR.VFX) {
        window.SR.VFX.showDamageNumber(
          obj.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)),
          15,
          'heal'
        );
      }
    } else if (def.loot === 'energy' && typeof playerState !== 'undefined' && playerState) {
      playerState.energy = Math.min(playerState.maxEnergy, playerState.energy + 20);
    }

    // Remove mesh
    if (typeof scene !== 'undefined' && scene) scene.remove(obj.mesh);
    objects.splice(index, 1);
  }

  function update() {
    // Gentle bob animation
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.mesh && !obj.dropped) {
        var def = DEFS[obj.type];
        var terrainY = typeof getTerrainHeight === 'function' ? getTerrainHeight(obj.x, obj.z) : 0;
        obj.mesh.position.y = terrainY + def.size * 0.5 + Math.sin(Date.now() * 0.002 + i) * 0.02;
      }
    }
  }

  function cleanup() {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].mesh && typeof scene !== 'undefined' && scene) {
        scene.remove(objects[i].mesh);
      }
    }
    objects = [];
  }

  function getObjects() {
    return objects;
  }

  window.SR.Destructibles = {
    init: init,
    spawn: spawn,
    tryHit: tryHit,
    update: update,
    cleanup: cleanup,
    getObjects: getObjects,
  };
})();
