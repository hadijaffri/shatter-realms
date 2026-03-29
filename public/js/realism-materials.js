// Realism material enhancements: procedural bump maps, PBR upgrades,
// ground detail, improved tree/rock materials, and environment scattering.
(function () {
  'use strict';

  // ── Procedural Normal Map Generator ───────────────────────────
  // Creates a normal map from noise, no textures needed.

  function generateNormalMap(width, height, scale, strength) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var imageData = ctx.createImageData(width, height);
    var data = imageData.data;

    // Simple 2D noise function
    function noise2D(x, y) {
      var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return (n - Math.floor(n)) * 2 - 1;
    }

    // Smooth noise with interpolation
    function smoothNoise(x, y) {
      var ix = Math.floor(x);
      var iy = Math.floor(y);
      var fx = x - ix;
      var fy = y - iy;
      fx = fx * fx * (3 - 2 * fx); // smoothstep
      fy = fy * fy * (3 - 2 * fy);

      var a = noise2D(ix, iy);
      var b = noise2D(ix + 1, iy);
      var c = noise2D(ix, iy + 1);
      var d = noise2D(ix + 1, iy + 1);

      return a + fx * (b - a) + fy * (c - a) + fx * fy * (a - b - c + d);
    }

    // Multi-octave noise
    function fbm(x, y) {
      var val = 0;
      var amp = 0.5;
      var freq = 1;
      for (var o = 0; o < 4; o++) {
        val += smoothNoise(x * freq, y * freq) * amp;
        amp *= 0.5;
        freq *= 2.1;
      }
      return val;
    }

    // Generate height field
    var heights = new Float32Array(width * height);
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        heights[y * width + x] = fbm(x * scale, y * scale);
      }
    }

    // Convert heights to normals
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var idx = y * width + x;
        var left = x > 0 ? heights[idx - 1] : heights[idx];
        var right = x < width - 1 ? heights[idx + 1] : heights[idx];
        var up = y > 0 ? heights[idx - width] : heights[idx];
        var down = y < height - 1 ? heights[idx + width] : heights[idx];

        var dx = (right - left) * strength;
        var dy = (down - up) * strength;

        // Normalize
        var len = Math.sqrt(dx * dx + dy * dy + 1);
        var nx = -dx / len;
        var ny = -dy / len;
        var nz = 1.0 / len;

        // Map to 0-255 range
        var pi = idx * 4;
        data[pi] = Math.floor((nx * 0.5 + 0.5) * 255);
        data[pi + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        data[pi + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
        data[pi + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    var texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // ── Procedural Roughness Map ──────────────────────────────────
  // Variation in roughness makes surfaces look more natural.

  function generateRoughnessMap(width, height, baseRoughness, variation) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var imageData = ctx.createImageData(width, height);
    var data = imageData.data;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var n = Math.sin(x * 0.15 + 3.7) * Math.cos(y * 0.13 + 1.2) * 0.5 + 0.5;
        var detail = Math.sin(x * 0.8) * Math.cos(y * 0.7) * 0.3;
        var roughness = baseRoughness + (n + detail * 0.5 - 0.5) * variation;
        roughness = Math.max(0, Math.min(1, roughness));

        var val = Math.floor(roughness * 255);
        var idx = (y * width + x) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    var texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // ── Enhance Ground Material ───────────────────────────────────
  // Adds normal map and roughness variation to the flat ground.

  function enhanceGround() {
    if (typeof scene === 'undefined' || !scene) return;

    var ground = null;
    scene.traverse(function (child) {
      if (
        child.isMesh &&
        child.geometry &&
        child.geometry.type === 'PlaneGeometry' &&
        child.geometry.parameters &&
        child.geometry.parameters.width >= 200
      ) {
        ground = child;
      }
    });

    if (!ground) return;

    // Generate and apply procedural normal map (grass-like bumps)
    var normalMap = generateNormalMap(512, 512, 0.08, 1.5);
    normalMap.repeat.set(25, 25);
    ground.material.normalMap = normalMap;
    ground.material.normalScale = new THREE.Vector2(0.3, 0.3);

    // Roughness variation map
    var roughnessMap = generateRoughnessMap(256, 256, 0.88, 0.15);
    roughnessMap.repeat.set(20, 20);
    ground.material.roughnessMap = roughnessMap;

    ground.material.envMapIntensity = 0.4;
    ground.material.needsUpdate = true;

    console.log('[Realism] Ground material enhanced with normal & roughness maps');
  }

  // ── Enhance Tree Materials ────────────────────────────────────
  // Better bark and foliage with subtle subsurface scattering look.

  function enhanceTrees() {
    if (typeof scene === 'undefined' || !scene) return;
    var count = 0;

    scene.traverse(function (child) {
      if (!child.isMesh || !child.material) return;

      // Detect tree trunks by brown cylinder geometry
      if (
        child.geometry &&
        child.geometry.type === 'CylinderGeometry' &&
        child.material.color &&
        child.material.color.r > 0.25 &&
        child.material.color.r < 0.5 &&
        child.material.color.g < 0.3
      ) {
        // Bark: add micro-bumps
        var barkNormal = generateNormalMap(128, 128, 0.2, 2.0);
        barkNormal.repeat.set(2, 4);
        child.material.normalMap = barkNormal;
        child.material.normalScale = new THREE.Vector2(0.5, 0.5);
        child.material.roughness = 0.95;
        child.material.needsUpdate = true;
        count++;
      }

      // Detect foliage cones (green, using ConeGeometry)
      if (
        child.geometry &&
        child.geometry.type === 'ConeGeometry' &&
        child.material.color &&
        child.material.color.g > 0.3
      ) {
        // Subtle translucency look via emissive
        child.material.emissive = child.material.color.clone().multiplyScalar(0.05);
        child.material.emissiveIntensity = 0.3;
        child.material.roughness = 0.85;
        child.material.needsUpdate = true;
        count++;
      }
    });

    if (count > 0) {
      console.log('[Realism] Enhanced', count, 'tree meshes');
    }
  }

  // ── Enhance Rock Materials ────────────────────────────────────
  // Better weathered rock look with normal detail.

  function enhanceRocks() {
    if (typeof scene === 'undefined' || !scene) return;
    var count = 0;

    scene.traverse(function (child) {
      if (
        child.isMesh &&
        child.geometry &&
        child.geometry.type === 'DodecahedronGeometry' &&
        child.material
      ) {
        var rockNormal = generateNormalMap(128, 128, 0.15, 2.5);
        rockNormal.repeat.set(1, 1);
        child.material.normalMap = rockNormal;
        child.material.normalScale = new THREE.Vector2(0.6, 0.6);

        // Vary roughness per rock
        child.material.roughness = 0.9 + Math.random() * 0.08;
        child.material.metalness = 0.02 + Math.random() * 0.03;
        child.material.needsUpdate = true;
        count++;
      }
    });

    if (count > 0) {
      console.log('[Realism] Enhanced', count, 'rock meshes');
    }
  }

  // ── Enhance Cobblestone ───────────────────────────────────────

  function enhanceCobblestone() {
    if (typeof scene === 'undefined' || !scene) return;

    scene.traverse(function (child) {
      if (
        child.isMesh &&
        child.geometry &&
        child.geometry.type === 'CircleGeometry' &&
        child.material &&
        child.material.color &&
        Math.abs(child.material.color.r - child.material.color.g) < 0.05
      ) {
        var cobbleNormal = generateNormalMap(256, 256, 0.12, 3.0);
        cobbleNormal.repeat.set(6, 6);
        child.material.normalMap = cobbleNormal;
        child.material.normalScale = new THREE.Vector2(0.8, 0.8);

        var cobbleRoughness = generateRoughnessMap(128, 128, 0.82, 0.12);
        cobbleRoughness.repeat.set(6, 6);
        child.material.roughnessMap = cobbleRoughness;
        child.material.needsUpdate = true;
      }
    });
  }

  // ── Add Ambient Particles (dust motes / pollen) ───────────────

  var dustSystem = null;
  var dustPositions = null;
  var DUST_COUNT = 200;

  function createDustMotes() {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;

    var geo = new THREE.BufferGeometry();
    dustPositions = new Float32Array(DUST_COUNT * 3);

    for (var i = 0; i < DUST_COUNT; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 60;
      dustPositions[i * 3 + 1] = 1 + Math.random() * 8;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    var mat = new THREE.PointsMaterial({
      color: 0xffffee,
      size: 0.04,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    dustSystem = new THREE.Points(geo, mat);
    scene.add(dustSystem);
    console.log('[Realism] Dust motes added');
  }

  function updateDustMotes(dt) {
    if (!dustSystem || !dustPositions) return;

    var time = performance.now() * 0.0001;
    for (var i = 0; i < DUST_COUNT; i++) {
      var idx = i * 3;
      // Gentle floating drift
      dustPositions[idx] += Math.sin(time + i * 0.7) * 0.002;
      dustPositions[idx + 1] += Math.cos(time * 0.8 + i * 1.3) * 0.001;
      dustPositions[idx + 2] += Math.sin(time * 0.6 + i * 2.1) * 0.002;

      // Recenter around player
      if (typeof playerState !== 'undefined' && playerState) {
        var dx = dustPositions[idx] - playerState.position.x;
        var dz = dustPositions[idx + 2] - playerState.position.z;
        if (Math.abs(dx) > 30 || Math.abs(dz) > 30) {
          dustPositions[idx] = playerState.position.x + (Math.random() - 0.5) * 60;
          dustPositions[idx + 1] = 1 + Math.random() * 8;
          dustPositions[idx + 2] = playerState.position.z + (Math.random() - 0.5) * 60;
        }
      }
    }
    dustSystem.geometry.attributes.position.needsUpdate = true;
  }

  // ── Add Rim/Fill Light for Depth ──────────────────────────────
  // A secondary colored light from behind adds visual depth.

  function addAtmosphericLights() {
    if (typeof scene === 'undefined' || !scene) return;

    // Warm rim light from opposite sun direction
    var rimLight = new THREE.DirectionalLight(0xffaa66, 0.15);
    rimLight.position.set(-40, 30, -60);
    rimLight.castShadow = false;
    scene.add(rimLight);

    // Cool fill from below-horizon for bounce light simulation
    var bounceLight = new THREE.DirectionalLight(0x6688aa, 0.1);
    bounceLight.position.set(0, -10, 30);
    bounceLight.castShadow = false;
    scene.add(bounceLight);

    console.log('[Realism] Atmospheric rim and bounce lights added');
  }

  // ── Master Init ───────────────────────────────────────────────

  function init() {
    if (typeof THREE === 'undefined') return;

    enhanceGround();
    enhanceTrees();
    enhanceRocks();
    enhanceCobblestone();
    createDustMotes();
    addAtmosphericLights();

    console.log('[Realism] All material enhancements applied');
  }

  function update(dt) {
    updateDustMotes(dt);
  }

  function cleanup() {
    if (dustSystem && typeof scene !== 'undefined' && scene) {
      scene.remove(dustSystem);
    }
    dustSystem = null;
    dustPositions = null;
  }

  // ── Public API ────────────────────────────────────────────────

  window.SR.Materials = {
    init: init,
    update: update,
    cleanup: cleanup,
    generateNormalMap: generateNormalMap,
    generateRoughnessMap: generateRoughnessMap,
  };
})();
