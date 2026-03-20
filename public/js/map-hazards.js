// Map hazards: lava zones, falling rocks, shrinking zone, poison pools
(function () {
  'use strict';

  var hazards = []; // { type, mesh, x, z, radius, ... }
  var shrinkZone = null;
  var fallingRocks = [];
  var rockTimer = 0;

  // ── Lava / Poison Pools ────────────────────────────────────────
  function spawnPool(x, z, radius, type) {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;

    var color = type === 'lava' ? 0xff4400 : 0x44ff00;
    var emissive = type === 'lava' ? 0xff2200 : 0x22aa00;
    var geo = new THREE.CircleGeometry(radius, 24);
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    var terrainY = typeof getTerrainHeight === 'function' ? getTerrainHeight(x, z) : 0;
    mesh.position.set(x, terrainY + 0.05, z);
    scene.add(mesh);

    hazards.push({ type: type, mesh: mesh, x: x, z: z, radius: radius, tickTimer: 0 });
  }

  // ── Falling Rocks ──────────────────────────────────────────────
  function spawnFallingRock() {
    if (
      typeof THREE === 'undefined' ||
      typeof scene === 'undefined' ||
      typeof playerState === 'undefined'
    )
      return;

    var px = playerState.position.x + (Math.random() - 0.5) * 20;
    var pz = playerState.position.z + (Math.random() - 0.5) * 20;
    var size = 0.3 + Math.random() * 0.5;

    var geo = new THREE.DodecahedronGeometry(size, 0);
    var mat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, 25, pz);
    mesh.castShadow = true;
    scene.add(mesh);

    // Warning shadow on ground
    var terrainY = typeof getTerrainHeight === 'function' ? getTerrainHeight(px, pz) : 0;
    var warnGeo = new THREE.CircleGeometry(size * 2, 16);
    var warnMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
    });
    var warnMesh = new THREE.Mesh(warnGeo, warnMat);
    warnMesh.rotation.x = -Math.PI / 2;
    warnMesh.position.set(px, terrainY + 0.1, pz);
    scene.add(warnMesh);

    fallingRocks.push({
      mesh: mesh,
      warning: warnMesh,
      x: px,
      z: pz,
      size: size,
      y: 25,
      speed: 0.02 + Math.random() * 0.01,
      groundY: terrainY,
      damage: 15 + Math.floor(size * 20),
    });
  }

  // ── Shrinking Zone ─────────────────────────────────────────────
  function initShrinkZone(startRadius, shrinkRate) {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;

    var geo = new THREE.RingGeometry(startRadius - 0.5, startRadius, 64);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.2;
    scene.add(mesh);

    shrinkZone = {
      mesh: mesh,
      radius: startRadius,
      minRadius: 8,
      shrinkRate: shrinkRate || 0.002, // units per ms
      tickTimer: 0,
    };
  }

  // ── Init: spawn hazards based on map ────────────────────────────
  function init() {
    cleanup();

    // Spawn a few random lava/poison pools
    for (var i = 0; i < 3; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 15 + Math.random() * 30;
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;
      var type = Math.random() < 0.5 ? 'lava' : 'poison';
      spawnPool(x, z, 1.5 + Math.random() * 2, type);
    }

    rockTimer = 5000 + Math.random() * 5000;
  }

  // ── Update ──────────────────────────────────────────────────────
  function update(dt) {
    if (typeof playerState === 'undefined' || !playerState) return;
    var px = playerState.position.x;
    var pz = playerState.position.z;

    // Pool damage tick (every 500ms)
    for (var i = 0; i < hazards.length; i++) {
      var h = hazards[i];
      var dx = px - h.x;
      var dz = pz - h.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < h.radius) {
        h.tickTimer += dt;
        if (h.tickTimer >= 500) {
          h.tickTimer -= 500;
          var dmg = h.type === 'lava' ? 12 : 8;
          if (typeof damagePlayer === 'function') damagePlayer(dmg);

          // Apply burn/poison status
          if (window.SR.StatusEffects) {
            window.SR.StatusEffects.apply('player', h.type === 'lava' ? 'burn' : 'poison');
          }
        }
      } else {
        h.tickTimer = 0;
      }

      // Animate emissive pulsing
      if (h.mesh && h.mesh.material) {
        h.mesh.material.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.003) * 0.2;
      }
    }

    // Falling rocks
    rockTimer -= dt;
    if (rockTimer <= 0 && fallingRocks.length < 5) {
      spawnFallingRock();
      rockTimer = 4000 + Math.random() * 6000;
    }

    for (var j = fallingRocks.length - 1; j >= 0; j--) {
      var rock = fallingRocks[j];
      rock.y -= rock.speed * dt;
      rock.mesh.position.y = rock.y;
      rock.mesh.rotation.x += 0.02;
      rock.mesh.rotation.z += 0.01;

      // Fade warning
      if (rock.warning) {
        var progress = 1 - (rock.y - rock.groundY) / 25;
        rock.warning.material.opacity = Math.min(0.5, progress * 0.5);
      }

      if (rock.y <= rock.groundY + 0.5) {
        // Impact - check player proximity
        var rdx = px - rock.x;
        var rdz = pz - rock.z;
        var rdist = Math.sqrt(rdx * rdx + rdz * rdz);
        if (rdist < rock.size * 3) {
          if (typeof damagePlayer === 'function') damagePlayer(rock.damage);
        }

        // Impact particles
        if (typeof createExplosionParticles === 'function') {
          createExplosionParticles(
            new THREE.Vector3(rock.x, rock.groundY + 0.5, rock.z),
            0x888888,
            0x666666
          );
        }

        scene.remove(rock.mesh);
        if (rock.warning) scene.remove(rock.warning);
        fallingRocks.splice(j, 1);
      }
    }

    // Shrinking zone
    if (shrinkZone && shrinkZone.radius > shrinkZone.minRadius) {
      shrinkZone.radius -= shrinkZone.shrinkRate * dt;
      shrinkZone.tickTimer += dt;

      // Rebuild ring mesh periodically
      if (shrinkZone.tickTimer > 2000) {
        shrinkZone.tickTimer = 0;
        scene.remove(shrinkZone.mesh);
        var geo = new THREE.RingGeometry(
          Math.max(shrinkZone.radius - 0.5, 0),
          shrinkZone.radius,
          64
        );
        shrinkZone.mesh.geometry.dispose();
        shrinkZone.mesh.geometry = geo;
        scene.add(shrinkZone.mesh);
      }

      // Damage if outside zone
      var playerDist = Math.sqrt(px * px + pz * pz);
      if (playerDist > shrinkZone.radius) {
        if (typeof damagePlayer === 'function') damagePlayer(dt * 0.005);
      }
    }
  }

  function cleanup() {
    for (var i = 0; i < hazards.length; i++) {
      if (hazards[i].mesh && typeof scene !== 'undefined' && scene) scene.remove(hazards[i].mesh);
    }
    hazards = [];
    for (var j = 0; j < fallingRocks.length; j++) {
      if (typeof scene !== 'undefined' && scene) {
        scene.remove(fallingRocks[j].mesh);
        if (fallingRocks[j].warning) scene.remove(fallingRocks[j].warning);
      }
    }
    fallingRocks = [];
    if (shrinkZone && shrinkZone.mesh && typeof scene !== 'undefined' && scene) {
      scene.remove(shrinkZone.mesh);
    }
    shrinkZone = null;
    rockTimer = 0;
  }

  window.SR.MapHazards = {
    init: init,
    update: update,
    cleanup: cleanup,
    spawnPool: spawnPool,
    initShrinkZone: initShrinkZone,
  };
})();
