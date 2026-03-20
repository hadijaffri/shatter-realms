// Secret areas: hidden chests and treasure rooms with proximity reveal
(function () {
  'use strict';

  var chests = []; // { mesh, x, z, revealed, opened, loot }
  var REVEAL_DISTANCE = 5;
  var OPEN_DISTANCE = 2;
  var CHEST_COUNT = 5;

  function init() {
    cleanup();
    for (var i = 0; i < CHEST_COUNT; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 20 + Math.random() * 50;
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;
      spawnChest(x, z);
    }
  }

  function spawnChest(x, z) {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;

    var group = new THREE.Group();

    // Chest base
    var baseGeo = new THREE.BoxGeometry(0.7, 0.4, 0.5);
    var baseMat = new THREE.MeshStandardMaterial({
      color: 0x8b6914,
      roughness: 0.7,
      metalness: 0.3,
    });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    group.add(base);

    // Chest lid
    var lidGeo = new THREE.BoxGeometry(0.7, 0.15, 0.5);
    var lidMat = new THREE.MeshStandardMaterial({
      color: 0xa07818,
      roughness: 0.6,
      metalness: 0.35,
    });
    var lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.475;
    group.add(lid);

    // Gold trim
    var trimGeo = new THREE.BoxGeometry(0.72, 0.05, 0.05);
    var trimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.1,
    });
    var trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, 0.4, 0.23);
    group.add(trim);

    var terrainY = typeof getTerrainHeight === 'function' ? getTerrainHeight(x, z) : 0;
    group.position.set(x, terrainY, z);
    group.visible = false; // Hidden until close
    group.castShadow = true;
    scene.add(group);

    var lootValue = 20 + Math.floor(Math.random() * 40);

    chests.push({
      mesh: group,
      lid: lid,
      x: x,
      z: z,
      revealed: false,
      opened: false,
      loot: lootValue,
    });
  }

  function update() {
    if (typeof playerState === 'undefined' || !playerState) return;
    var px = playerState.position.x;
    var pz = playerState.position.z;

    for (var i = 0; i < chests.length; i++) {
      var ch = chests[i];
      if (ch.opened) continue;

      var dx = px - ch.x;
      var dz = pz - ch.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      // Proximity reveal
      if (!ch.revealed && dist < REVEAL_DISTANCE) {
        ch.revealed = true;
        ch.mesh.visible = true;

        // Sparkle effect
        if (typeof createMagicParticles === 'function') {
          createMagicParticles(
            ch.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)),
            0xffd700,
            10,
            0.08
          );
        }
      }

      // Auto-open on close approach
      if (ch.revealed && !ch.opened && dist < OPEN_DISTANCE) {
        openChest(i);
      }

      // Gentle glow pulse when revealed but not opened
      if (ch.revealed && !ch.opened && ch.lid) {
        ch.lid.material.emissive = new THREE.Color(0xffd700);
        ch.lid.material.emissiveIntensity = 0.2 + Math.sin(Date.now() * 0.004) * 0.15;
      }
    }
  }

  function openChest(index) {
    var ch = chests[index];
    ch.opened = true;

    // Lid open animation
    if (ch.lid) {
      ch.lid.rotation.x = -Math.PI / 3;
      ch.lid.position.y = 0.55;
      ch.lid.position.z = -0.15;
      ch.lid.material.emissiveIntensity = 0;
    }

    // Loot burst particles
    if (typeof createMagicParticles === 'function') {
      createMagicParticles(
        ch.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)),
        0xffd700,
        15,
        0.1
      );
    }

    // Give coins
    if (typeof inventory !== 'undefined') {
      inventory.coins += ch.loot;
    }

    // Spawn visual coins
    if (typeof spawnCoin === 'function') {
      for (var c = 0; c < 3; c++) {
        var pos = ch.mesh.position.clone();
        pos.x += (Math.random() - 0.5) * 1;
        pos.z += (Math.random() - 0.5) * 1;
        spawnCoin(pos);
      }
    }

    // Show pickup text
    var div = document.createElement('div');
    div.className = 'coin-pickup';
    div.textContent = 'TREASURE! +' + ch.loot + ' coins';
    div.style.left = '50%';
    div.style.top = '30%';
    div.style.color = '#ffd700';
    div.style.fontSize = '18px';
    document.body.appendChild(div);
    setTimeout(function () {
      div.remove();
    }, 1500);

    // Fade out chest after a moment
    setTimeout(function () {
      if (ch.mesh && typeof scene !== 'undefined' && scene) {
        scene.remove(ch.mesh);
      }
    }, 3000);
  }

  function cleanup() {
    for (var i = 0; i < chests.length; i++) {
      if (chests[i].mesh && typeof scene !== 'undefined' && scene) {
        scene.remove(chests[i].mesh);
      }
    }
    chests = [];
  }

  window.SR.SecretAreas = {
    init: init,
    update: update,
    cleanup: cleanup,
  };
})();
