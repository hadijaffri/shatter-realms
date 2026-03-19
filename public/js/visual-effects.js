// Enhanced visual effects: damage numbers, kill cams, death animations
(function () {
  'use strict';

  // ── Damage Numbers ──────────────────────────────────────────────
  // Replaces the original showDamageNumber with colour-coded, scaled,
  // animated floating numbers.

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
    div.style.cssText =
      'position:fixed;pointer-events:none;font-weight:bold;z-index:200;' +
      'text-shadow:0 0 4px rgba(0,0,0,0.8);transition:none;' +
      'left:' +
      x +
      'px;top:' +
      y +
      'px;' +
      'color:' +
      color +
      ';' +
      'font-size:' +
      (isBig ? '24px' : '16px') +
      ';';

    document.body.appendChild(div);
    activeNumbers.push({ div, born: performance.now(), startX: x, startY: y });
  }

  function update() {
    const now = performance.now();
    for (let i = activeNumbers.length - 1; i >= 0; i--) {
      const n = activeNumbers[i];
      const age = now - n.born;
      if (age > 900) {
        n.div.remove();
        activeNumbers.splice(i, 1);
        continue;
      }
      const t = age / 900;
      // Float up and fade out
      n.div.style.top = n.startY - t * 40 + 'px';
      n.div.style.opacity = String(1 - t);
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
  // Dissolve + ragdoll tumble styles.

  function playDeathAnimation(mesh, style) {
    if (!mesh) return;
    const duration = 800;
    const startY = mesh.position.y;
    const startTime = performance.now();

    function tick() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);

      if (style === 'dissolve') {
        mesh.traverse(function (child) {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = 1 - t;
          }
        });
        mesh.position.y = startY - t * 0.3;
      } else {
        // Default tumble
        mesh.rotation.x = t * (Math.PI / 2);
        mesh.position.y = startY - t * 0.5;
        mesh.traverse(function (child) {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = 1 - t;
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

  // ── Public API ──────────────────────────────────────────────────

  window.SR.VFX = {
    showDamageNumber: showDamageNumber,
    update: update,
    triggerKillCam: triggerKillCam,
    isKillCamActive: isKillCamActive,
    updateKillCam: updateKillCam,
    playDeathAnimation: playDeathAnimation,
  };
})();
