// Weather system: rain, snow, sandstorm, fog, thunderstorm per map
(function () {
  'use strict';

  var WEATHER_TYPES = {
    clear: { fog: 0.006, fogColor: 0x7ec8e3, particles: null },
    rain: { fog: 0.012, fogColor: 0x556677, particles: 'rain' },
    snow: { fog: 0.01, fogColor: 0xccddee, particles: 'snow' },
    sandstorm: { fog: 0.018, fogColor: 0xc2a654, particles: 'sand' },
    fog: { fog: 0.025, fogColor: 0x999999, particles: null },
    thunderstorm: { fog: 0.015, fogColor: 0x334455, particles: 'rain' },
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
  var particleVelocities = null;
  var PARTICLE_COUNT = 1200;
  var lightningTimer = 0;
  var lightningFlash = null;

  function init(mapName) {
    currentWeather = MAP_WEATHER[mapName] || 'clear';
    applyWeather();
  }

  function setWeather(type) {
    if (!WEATHER_TYPES[type]) return;
    currentWeather = type;
    applyWeather();
  }

  function applyWeather() {
    var def = WEATHER_TYPES[currentWeather];
    if (!def) return;

    // Update scene fog
    if (typeof scene !== 'undefined' && scene && scene.fog) {
      scene.fog.density = def.fog;
      scene.fog.color.setHex(def.fogColor);
      scene.background = new THREE.Color(def.fogColor);
    }

    // Remove existing particles
    if (particleSystem && typeof scene !== 'undefined' && scene) {
      scene.remove(particleSystem);
      particleSystem = null;
    }

    if (def.particles) {
      createParticles(def.particles);
    }
  }

  function createParticles(type) {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;

    var geometry = new THREE.BufferGeometry();
    particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    particleVelocities = [];

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 80;
      particlePositions[i * 3 + 1] = Math.random() * 30;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      if (type === 'rain') {
        particleVelocities.push({ x: 0.01, y: -0.4, z: 0.02 });
      } else if (type === 'snow') {
        particleVelocities.push({
          x: (Math.random() - 0.5) * 0.02,
          y: -0.04 - Math.random() * 0.02,
          z: (Math.random() - 0.5) * 0.02,
        });
      } else {
        // sand
        particleVelocities.push({
          x: 0.15 + Math.random() * 0.05,
          y: (Math.random() - 0.5) * 0.02,
          z: 0.05,
        });
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    var color = type === 'rain' ? 0x8899bb : type === 'snow' ? 0xffffff : 0xc2a654;
    var size = type === 'snow' ? 0.15 : type === 'sand' ? 0.08 : 0.05;

    var material = new THREE.PointsMaterial({
      color: color,
      size: size,
      transparent: true,
      opacity: type === 'sand' ? 0.5 : 0.6,
      depthWrite: false,
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
  }

  function update(dt) {
    if (!particleSystem || !particlePositions || typeof playerState === 'undefined' || !playerState)
      return;

    var px = playerState.position.x;
    var pz = playerState.position.z;

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var idx = i * 3;
      var vel = particleVelocities[i];
      particlePositions[idx] += vel.x * (dt * 0.06);
      particlePositions[idx + 1] += vel.y * (dt * 0.06);
      particlePositions[idx + 2] += vel.z * (dt * 0.06);

      // Recycle particles that fall below ground or drift too far
      if (
        particlePositions[idx + 1] < -1 ||
        Math.abs(particlePositions[idx] - px) > 40 ||
        Math.abs(particlePositions[idx + 2] - pz) > 40
      ) {
        particlePositions[idx] = px + (Math.random() - 0.5) * 80;
        particlePositions[idx + 1] = 15 + Math.random() * 15;
        particlePositions[idx + 2] = pz + (Math.random() - 0.5) * 80;
      }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;

    // Thunderstorm lightning
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
  }

  function cleanup() {
    if (particleSystem && typeof scene !== 'undefined' && scene) {
      scene.remove(particleSystem);
    }
    particleSystem = null;
    particlePositions = null;
    particleVelocities = null;
    currentWeather = 'clear';
  }

  window.SR.Weather = {
    init: init,
    setWeather: setWeather,
    update: update,
    cleanup: cleanup,
    getWeather: function () {
      return currentWeather;
    },
    TYPES: Object.keys(WEATHER_TYPES),
  };
})();
