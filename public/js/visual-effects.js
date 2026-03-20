// Enhanced visual effects: damage numbers, kill cams, death animations,
// screen shake, hit flash, motion blur indication, and impact sparks.
(function () {
  'use strict';

  // ── Damage Numbers ──────────────────────────────────────────────
  // Colour-coded, scaled, animated floating numbers with physics.

  const COLORS = {
    normal: '#ffffff',
    crit: '#ffff00',
    poison: '#00ff66',
    bleed: '#ff3333',
    burn: '#ff8800',
    freeze: '#00ccff',
    heal: '#44ff44',
    stun: '#ffaaff',
    combo: '#ff00ff',
  };

  const activeNumbers = [];

  function showDamageNumber(pos, damage, type) {
    if (typeof camera === 'undefined') return;
    const sp = pos.clone().project(camera);
    if (sp.z > 1) return; // behind camera

    const x = (sp.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-sp.y * 0.5 + 0.5) * window.innerHeight;

    const div = document.createElement('div');
    div.className = 'damage-number';
    const rounded = Math.round(damage);
    div.textContent = type === 'heal' ? '+' + rounded : rounded;

    const color = COLORS[type] || COLORS.normal;
    const isBig = type === 'crit' || type === 'combo';
    const fontSize = isBig ? 28 : 18;
    div.style.cssText =
      'position:fixed;pointer-events:none;font-weight:bold;z-index:200;' +
      'text-shadow:0 0 6px rgba(0,0,0,0.9), 0 0 12px ' +
      color +
      '40;transition:none;' +
      'left:' +
      x +
      'px;top:' +
      y +
      'px;' +
      'color:' +
      color +
      ';' +
      'font-size:' +
      fontSize +
      'px;';

    document.body.appendChild(div);

    // Random horizontal drift for visual spread
    const drift = (Math.random() - 0.5) * 30;
    activeNumbers.push({
      div: div,
      born: performance.now(),
      startX: x,
      startY: y,
      driftX: drift,
      velocityY: isBig ? -60 : -45,
      gravity: 80,
    });

    // Trigger screen shake on crits
    if (type === 'crit') {
      triggerScreenShake(4, 150);
    }
  }

  function update() {
    const now = performance.now();
    for (let i = activeNumbers.length - 1; i >= 0; i--) {
      const n = activeNumbers[i];
      const age = now - n.born;
      if (age > 1100) {
        n.div.remove();
        activeNumbers.splice(i, 1);
        continue;
      }
      const t = age / 1100;
      // Physics-based arc: initial velocity + gravity
      const seconds = age / 1000;
      const yOffset = n.velocityY * seconds + 0.5 * n.gravity * seconds * seconds;
      const xOffset = n.driftX * t;

      n.div.style.left = n.startX + xOffset + 'px';
      n.div.style.top = n.startY + yOffset + 'px';
      n.div.style.opacity = String(Math.max(0, 1 - t * t));

      // Scale pop effect
      const scale = t < 0.1 ? 1 + (1 - t / 0.1) * 0.3 : 1;
      n.div.style.transform = 'scale(' + scale + ')';
    }
  }

  // ── Screen Shake ────────────────────────────────────────────────
  // Camera-based shake for impacts — feels more grounded.

  let shakeIntensity = 0;
  let shakeDuration = 0;
  let shakeTimer = 0;
  let shakeOffset = { x: 0, y: 0 };

  function triggerScreenShake(intensity, duration) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
    shakeDuration = Math.max(shakeDuration, duration);
    shakeTimer = 0;
  }

  function updateScreenShake(dt) {
    if (shakeIntensity <= 0) {
      shakeOffset.x = 0;
      shakeOffset.y = 0;
      return;
    }

    shakeTimer += dt;
    if (shakeTimer >= shakeDuration) {
      shakeIntensity = 0;
      shakeDuration = 0;
      shakeTimer = 0;
      shakeOffset.x = 0;
      shakeOffset.y = 0;
      return;
    }

    const decay = 1 - shakeTimer / shakeDuration;
    const amount = shakeIntensity * decay * decay;
    shakeOffset.x = (Math.random() - 0.5) * amount * 0.01;
    shakeOffset.y = (Math.random() - 0.5) * amount * 0.01;

    // Apply to camera if available
    if (typeof camera !== 'undefined' && camera) {
      camera.position.x += shakeOffset.x;
      camera.position.y += shakeOffset.y;
    }
  }

  // ── Hit Flash ───────────────────────────────────────────────────
  // Brief red tint when player takes damage.

  let hitFlashDiv = null;

  function triggerHitFlash() {
    if (!hitFlashDiv) {
      hitFlashDiv = document.createElement('div');
      hitFlashDiv.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'pointer-events:none;z-index:150;transition:opacity 0.2s;' +
        'background:radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,0.25) 100%);';
      document.body.appendChild(hitFlashDiv);
    }
    hitFlashDiv.style.opacity = '1';
    setTimeout(function () {
      if (hitFlashDiv) hitFlashDiv.style.opacity = '0';
    }, 100);
  }

  // ── Impact Sparks ─────────────────────────────────────────────
  // 3D particle burst at hit location for metallic weapon impacts.

  const sparkPool = [];
  const MAX_SPARKS = 30;

  function spawnSparks(position, count) {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;
    count = Math.min(count || 6, MAX_SPARKS);

    for (let i = 0; i < count; i++) {
      let spark;
      // Reuse from pool
      if (sparkPool.length < MAX_SPARKS) {
        const geo = new THREE.SphereGeometry(0.03, 4, 4);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xffcc44,
          transparent: true,
          opacity: 1,
        });
        spark = {
          mesh: new THREE.Mesh(geo, mat),
          velocity: new THREE.Vector3(),
          life: 0,
          active: false,
        };
        sparkPool.push(spark);
      } else {
        // Find inactive
        spark = sparkPool.find(function (s) {
          return !s.active;
        });
        if (!spark) continue;
      }

      spark.mesh.position.copy(position);
      spark.velocity.set(
        (Math.random() - 0.5) * 0.15,
        Math.random() * 0.12 + 0.05,
        (Math.random() - 0.5) * 0.15
      );
      spark.life = 0;
      spark.active = true;
      spark.mesh.material.opacity = 1;
      spark.mesh.visible = true;
      if (!spark.mesh.parent) scene.add(spark.mesh);
    }
  }

  function updateSparks(dt) {
    const dtSec = dt * 0.001;
    for (let i = 0; i < sparkPool.length; i++) {
      const s = sparkPool[i];
      if (!s.active) continue;
      s.life += dtSec;
      if (s.life > 0.4) {
        s.active = false;
        s.mesh.visible = false;
        continue;
      }
      // Gravity
      s.velocity.y -= 0.3 * dtSec;
      s.mesh.position.addScaledVector(s.velocity, dtSec * 60);
      s.mesh.material.opacity = Math.max(0, 1 - s.life / 0.4);
      // Color shift from bright yellow to red
      const t = s.life / 0.4;
      s.mesh.material.color.setHSL(0.12 - t * 0.12, 1, 0.6 - t * 0.3);
    }
  }

  // ── Kill Cam ────────────────────────────────────────────────────
  // Brief slow-motion + camera orbit on significant kills.

  let killCamActive = false;
  let killCamTimer = 0;
  let killCamTarget = null;
  let killCamOrigSpeed = 1;
  const KILL_CAM_DURATION = 1500; // ms

  function triggerKillCam(targetPos) {
    if (killCamActive) return;
    killCamActive = true;
    killCamTimer = 0;
    killCamTarget = targetPos.clone();
    killCamOrigSpeed = 1;
    triggerScreenShake(6, 300);
  }

  function isKillCamActive() {
    return killCamActive;
  }

  function updateKillCam(dt) {
    if (!killCamActive) return;
    killCamTimer += dt;
    if (killCamTimer >= KILL_CAM_DURATION) {
      killCamActive = false;
      killCamTarget = null;
      return;
    }
    // Slow-mo factor ramps down then back up
    const t = killCamTimer / KILL_CAM_DURATION;
    const slowFactor = 0.2 + 0.8 * (t < 0.5 ? t * 2 : 1);
    return slowFactor;
  }

  // ── Death Animations ────────────────────────────────────────────
  // Dissolve + ragdoll tumble styles with spark burst.

  function playDeathAnimation(mesh, style) {
    if (!mesh) return;
    const duration = 900;
    const startY = mesh.position.y;
    const startTime = performance.now();

    // Spawn sparks at death location
    if (mesh.position) {
      spawnSparks(mesh.position, 8);
    }

    function tick() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic for smoother motion
      const eased = 1 - Math.pow(1 - t, 3);

      if (style === 'dissolve') {
        mesh.traverse(function (child) {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = 1 - eased;
          }
        });
        mesh.position.y = startY - eased * 0.3;
        mesh.scale.setScalar(1 - eased * 0.2);
      } else {
        // Default tumble
        mesh.rotation.x = eased * (Math.PI / 2);
        mesh.rotation.z = eased * 0.3 * (Math.random() > 0.5 ? 1 : -1);
        mesh.position.y = startY - eased * 0.5;
        mesh.traverse(function (child) {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = 1 - eased;
          }
        });
      }

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        if (mesh.parent) mesh.parent.remove(mesh);
      }
    }

    requestAnimationFrame(tick);
  }

  // ── Combined update ─────────────────────────────────────────────

  function updateAll(dt) {
    update();
    updateScreenShake(dt || 16);
    updateSparks(dt || 16);
  }

  // ── Public API ──────────────────────────────────────────────────

  window.SR.VFX = {
    showDamageNumber: showDamageNumber,
    update: updateAll,
    triggerKillCam: triggerKillCam,
    isKillCamActive: isKillCamActive,
    updateKillCam: updateKillCam,
    playDeathAnimation: playDeathAnimation,
    triggerScreenShake: triggerScreenShake,
    triggerHitFlash: triggerHitFlash,
    spawnSparks: spawnSparks,
  };
})();
