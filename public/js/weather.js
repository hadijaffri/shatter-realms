// Weather system: rain, snow, sandstorm, fog, thunderstorm per map
// Enhanced with wind simulation, wet surface effects, rain splashes,
// variable particle sizes, and smooth weather transitions.
(function () {
  'use strict';

  var WEATHER_TYPES = {
    clear: { fog: 0.006, fogColor: 0x7ec8e3, particles: null, ambientMod: 1.0, wind: 0 },
    rain: { fog: 0.012, fogColor: 0x556677, particles: 'rain', ambientMod: 0.7, wind: 0.3 },
    snow: { fog: 0.01, fogColor: 0xccddee, particles: 'snow', ambientMod: 0.85, wind: 0.15 },
    sandstorm: { fog: 0.018, fogColor: 0xc2a654, particles: 'sand', ambientMod: 0.6, wind: 0.8 },
    fog: { fog: 0.025, fogColor: 0x999999, particles: null, ambientMod: 0.65, wind: 0.05 },
    thunderstorm: {
      fog: 0.015,
      fogColor: 0x334455,
      particles: 'rain',
      ambientMod: 0.5,
      wind: 0.6,
    },
  };

  // Map-specific default weather (used when no vote / random)
  var MAP_WEATHER = {
    'frozen-tundra': 'snow',
    'inferno-peaks': 'clear',
    'toxic-marsh': 'fog',
    'shadow-abyss': 'fog',
    'neon-wasteland': 'sandstorm',
    'sky-fortress': 'rain',
    'dragons-roost': 'thunderstorm',
    'crystalline-cavern': 'clear',
    'ancient-temple': 'rain',
    'ridge-plaza': 'clear',
    'void-sanctum': 'fog',
  };

  var currentWeather = 'clear';
  var particleSystem = null;
  var particlePositions = null;
  var particleSizes = null;
  var particleVelocities = null;
  var PARTICLE_COUNT = 2000;
  var lightningTimer = 0;

  // Wind state
  var windDirection = new THREE.Vector2(1, 0.3).normalize();
  var windStrength = 0;
  var windGustTimer = 0;
  var windGustStrength = 0;

  // Wet surface effect
  var wetness = 0;
  var targetWetness = 0;

  // Splash system for rain
  var splashPool = [];
  var SPLASH_COUNT = 40;
  var splashTimer = 0;

  // Transition state
  var transitionProgress = 1;
  var transitionFrom = null;
  var TRANSITION_SPEED = 0.0008; // ~1.25 seconds

  function init(mapName) {
    currentWeather = MAP_WEATHER[mapName] || 'clear';
    transitionProgress = 1;
    transitionFrom = null;
    applyWeather();
  }

  function setWeather(type) {
    if (!WEATHER_TYPES[type] || type === currentWeather) return;
    transitionFrom = currentWeather;
    currentWeather = type;
    transitionProgress = 0;
    applyWeather();
  }

  function applyWeather() {
    var def = WEATHER_TYPES[currentWeather];
    if (!def) return;

    // Update scene fog (immediate, transition handles blending)
    if (typeof scene !== 'undefined' && scene && scene.fog) {
      scene.fog.density = def.fog;
      scene.fog.color.setHex(def.fogColor);
      scene.background = new THREE.Color(def.fogColor);
    }

    // Update wind
    windStrength = def.wind;

    // Wet surfaces for rain/thunderstorm
    targetWetness = currentWeather === 'rain' || currentWeather === 'thunderstorm' ? 0.6 : 0;

    // Remove existing particles
    if (particleSystem && typeof scene !== 'undefined' && scene) {
      scene.remove(particleSystem);
      particleSystem = null;
    }

    // Clean up splashes
    cleanupSplashes();

    if (def.particles) {
      createParticles(def.particles);
      if (def.particles === 'rain') {
        createSplashPool();
      }
    }
  }

  function createParticles(type) {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;

    var geometry = new THREE.BufferGeometry();
    particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    particleSizes = new Float32Array(PARTICLE_COUNT);
    particleVelocities = [];

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 80;
      particlePositions[i * 3 + 1] = Math.random() * 30;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      if (type === 'rain') {
        // Varied rain drop speeds for depth
        var speed = 0.35 + Math.random() * 0.15;
        particleVelocities.push({
          x: windDirection.x * windStrength * 0.1,
          y: -speed,
          z: windDirection.y * windStrength * 0.1,
        });
        particleSizes[i] = 0.03 + Math.random() * 0.04; // varied drop sizes
      } else if (type === 'snow') {
        particleVelocities.push({
          x: (Math.random() - 0.5) * 0.02 + windDirection.x * windStrength * 0.03,
          y: -0.03 - Math.random() * 0.025,
          z: (Math.random() - 0.5) * 0.02 + windDirection.y * windStrength * 0.03,
        });
        particleSizes[i] = 0.08 + Math.random() * 0.12; // big fluffy flakes
      } else {
        // sand
        particleVelocities.push({
          x: windDirection.x * (0.15 + Math.random() * 0.1),
          y: (Math.random() - 0.5) * 0.03,
          z: windDirection.y * (0.1 + Math.random() * 0.05),
        });
        particleSizes[i] = 0.04 + Math.random() * 0.06;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    var color = type === 'rain' ? 0x8899bb : type === 'snow' ? 0xeeeeff : 0xc2a654;

    var material = new THREE.PointsMaterial({
      color: color,
      size: type === 'snow' ? 0.15 : type === 'sand' ? 0.08 : 0.05,
      transparent: true,
      opacity: type === 'sand' ? 0.45 : type === 'snow' ? 0.7 : 0.5,
      depthWrite: false,
      blending: type === 'rain' ? THREE.AdditiveBlending : THREE.NormalBlending,
      sizeAttenuation: true,
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
  }

  // ── Rain splash pool (reusable meshes) ────────────────────────

  function createSplashPool() {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;

    for (var i = 0; i < SPLASH_COUNT; i++) {
      var geo = new THREE.RingGeometry(0, 0.15, 8);
      var mat = new THREE.MeshBasicMaterial({
        color: 0xaabbcc,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      scene.add(mesh);
      splashPool.push({ mesh: mesh, life: 0, active: false });
    }
  }

  function spawnSplash(x, y, z) {
    for (var i = 0; i < splashPool.length; i++) {
      var s = splashPool[i];
      if (!s.active) {
        s.mesh.position.set(x, y + 0.02, z);
        s.mesh.scale.set(0.3, 0.3, 0.3);
        s.mesh.material.opacity = 0.5;
        s.mesh.visible = true;
        s.life = 0;
        s.active = true;
        return;
      }
    }
  }

  function updateSplashes(dt) {
    for (var i = 0; i < splashPool.length; i++) {
      var s = splashPool[i];
      if (!s.active) continue;
      s.life += dt * 0.003;
      if (s.life >= 1) {
        s.active = false;
        s.mesh.visible = false;
        continue;
      }
      // Expand and fade
      var scale = 0.3 + s.life * 1.2;
      s.mesh.scale.set(scale, scale, scale);
      s.mesh.material.opacity = 0.5 * (1 - s.life);
    }
  }

  function cleanupSplashes() {
    for (var i = 0; i < splashPool.length; i++) {
      if (splashPool[i].mesh && typeof scene !== 'undefined' && scene) {
        scene.remove(splashPool[i].mesh);
      }
    }
    splashPool = [];
  }

  // ── Wet surface effect ────────────────────────────────────────
  // Reduces roughness and increases metalness on ground during rain.

  function updateWetSurfaces(dt) {
    // Smoothly transition wetness
    var speed = dt * 0.0003;
    if (wetness < targetWetness) {
      wetness = Math.min(targetWetness, wetness + speed);
    } else if (wetness > targetWetness) {
      wetness = Math.max(targetWetness, wetness - speed * 0.5); // dry slower
    }

    if (typeof scene === 'undefined' || !scene) return;

    // Apply to ground material
    scene.traverse(function (child) {
      if (
        child.isMesh &&
        child.geometry &&
        child.geometry.type === 'PlaneGeometry' &&
        child.geometry.parameters &&
        child.geometry.parameters.width >= 200 &&
        child.material
      ) {
        // Wet = smoother and slightly reflective
        child.material.roughness = 0.92 - wetness * 0.35;
        child.material.metalness = wetness * 0.08;
        child.material.needsUpdate = true;
      }
    });
  }

  // ── Wind gusts ────────────────────────────────────────────────

  function updateWind(dt) {
    windGustTimer -= dt;
    if (windGustTimer <= 0) {
      windGustTimer = 2000 + Math.random() * 5000;
      windGustStrength = Math.random() * 0.5;
      // Slightly shift wind direction
      var angle = Math.atan2(windDirection.y, windDirection.x) + (Math.random() - 0.5) * 0.3;
      windDirection.set(Math.cos(angle), Math.sin(angle));
    }

    // Decay gust
    windGustStrength *= 0.998;
  }

  // ── Main update ───────────────────────────────────────────────

  function update(dt) {
    updateWind(dt);
    updateWetSurfaces(dt);

    // Smooth weather transition (fog blending)
    if (transitionProgress < 1 && transitionFrom) {
      transitionProgress = Math.min(1, transitionProgress + TRANSITION_SPEED * dt);
      var fromDef = WEATHER_TYPES[transitionFrom];
      var toDef = WEATHER_TYPES[currentWeather];
      if (fromDef && toDef && typeof scene !== 'undefined' && scene && scene.fog) {
        var t = transitionProgress * transitionProgress * (3 - 2 * transitionProgress); // smoothstep
        scene.fog.density = fromDef.fog + (toDef.fog - fromDef.fog) * t;

        var fromColor = new THREE.Color(fromDef.fogColor);
        var toColor = new THREE.Color(toDef.fogColor);
        fromColor.lerp(toColor, t);
        scene.fog.color.copy(fromColor);
        scene.background = fromColor;
      }
      if (transitionProgress >= 1) {
        transitionFrom = null;
      }
    }

    if (!particleSystem || !particlePositions || typeof playerState === 'undefined' || !playerState)
      return;

    var px = playerState.position.x;
    var pz = playerState.position.z;
    var totalWind = windStrength + windGustStrength;

    splashTimer -= dt;

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var idx = i * 3;
      var vel = particleVelocities[i];

      // Add wind influence to velocity
      var wx = vel.x + windDirection.x * totalWind * 0.02;
      var wz = vel.z + windDirection.y * totalWind * 0.02;

      particlePositions[idx] += wx * (dt * 0.06);
      particlePositions[idx + 1] += vel.y * (dt * 0.06);
      particlePositions[idx + 2] += wz * (dt * 0.06);

      // Recycle particles that fall below ground or drift too far
      if (
        particlePositions[idx + 1] < -1 ||
        Math.abs(particlePositions[idx] - px) > 40 ||
        Math.abs(particlePositions[idx + 2] - pz) > 40
      ) {
        // Spawn splash where raindrop hit
        if (
          particlePositions[idx + 1] < -1 &&
          (currentWeather === 'rain' || currentWeather === 'thunderstorm') &&
          splashTimer <= 0
        ) {
          var groundY = 0;
          if (typeof getTerrainHeight === 'function') {
            groundY = getTerrainHeight(particlePositions[idx], particlePositions[idx + 2]);
          }
          spawnSplash(particlePositions[idx], groundY, particlePositions[idx + 2]);
          splashTimer = 15 + Math.random() * 30; // throttle splash creation
        }

        particlePositions[idx] = px + (Math.random() - 0.5) * 80;
        particlePositions[idx + 1] = 15 + Math.random() * 15;
        particlePositions[idx + 2] = pz + (Math.random() - 0.5) * 80;
      }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;

    // Update rain splashes
    if (currentWeather === 'rain' || currentWeather === 'thunderstorm') {
      updateSplashes(dt);
    }

    // Thunderstorm lightning with scene light flash
    if (currentWeather === 'thunderstorm') {
      lightningTimer -= dt;
      if (lightningTimer <= 0) {
        triggerLightning();
        lightningTimer = 3000 + Math.random() * 8000;
      }
    }
  }

  function triggerLightning() {
    // Screen flash
    var flash = document.createElement('div');
    flash.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:rgba(255,255,255,0.3);pointer-events:none;z-index:140;';
    document.body.appendChild(flash);
    setTimeout(function () {
      flash.style.opacity = '0';
      flash.style.transition = 'opacity 0.3s';
    }, 50);
    setTimeout(function () {
      flash.remove();
    }, 400);

    // Flash the scene lights momentarily
    if (typeof scene !== 'undefined' && scene) {
      scene.traverse(function (child) {
        if (child.isDirectionalLight && child.intensity < 2) {
          var origIntensity = child.intensity;
          child.intensity = 3.0;
          setTimeout(function () {
            child.intensity = origIntensity;
          }, 80);
        }
      });
    }
  }

  function cleanup() {
    if (particleSystem && typeof scene !== 'undefined' && scene) {
      scene.remove(particleSystem);
    }
    cleanupSplashes();
    particleSystem = null;
    particlePositions = null;
    particleSizes = null;
    particleVelocities = null;
    currentWeather = 'clear';
    wetness = 0;
    targetWetness = 0;
    windGustStrength = 0;
  }

  window.SR.Weather = {
    init: init,
    setWeather: setWeather,
    update: update,
    cleanup: cleanup,
    getWeather: function () {
      return currentWeather;
    },
    getWindDirection: function () {
      return windDirection;
    },
    getWindStrength: function () {
      return windStrength + windGustStrength;
    },
    getWetness: function () {
      return wetness;
    },
    TYPES: Object.keys(WEATHER_TYPES),
  };
})();
