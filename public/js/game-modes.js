// Game modes: boss rush, TDM, co-op PvE, spectator
(function () {
  'use strict';

  var currentMode = 'solo'; // solo, boss_rush, tdm, coop, spectator

  // ── Boss Rush ───────────────────────────────────────────────────
  // 5 bosses back-to-back with scaling difficulty.

  var bossRushWave = 0;
  var BOSS_RUSH_COUNT = 5;
  var BOSS_RUSH_SCALING = [1, 1.5, 2, 2.5, 3.5]; // health multiplier

  function startBossRush() {
    currentMode = 'boss_rush';
    bossRushWave = 0;
    if (typeof announceWave === 'function') announceWave('BOSS RUSH!');
    setTimeout(function () {
      spawnBossRushBoss();
    }, 1500);
  }

  function spawnBossRushBoss() {
    if (bossRushWave >= BOSS_RUSH_COUNT) {
      onBossRushComplete();
      return;
    }

    var scaling = BOSS_RUSH_SCALING[bossRushWave] || 1;
    bossRushWave++;

    if (typeof announceWave === 'function') {
      announceWave('BOSS ' + bossRushWave + ' / ' + BOSS_RUSH_COUNT);
    }

    // Spawn boss via existing function, then scale it
    if (typeof spawnBoss === 'function') {
      spawnBoss();
      // Scale boss health after spawn
      setTimeout(function () {
        if (typeof boss !== 'undefined' && boss) {
          boss.maxHealth = Math.floor(boss.maxHealth * scaling);
          boss.health = boss.maxHealth;
          boss.damage = Math.floor(boss.damage * (1 + (scaling - 1) * 0.5));
        }
      }, 100);
    }
  }

  function onBossRushBossKilled() {
    if (currentMode !== 'boss_rush') return;
    if (bossRushWave < BOSS_RUSH_COUNT) {
      setTimeout(function () {
        spawnBossRushBoss();
      }, 2000);
    } else {
      onBossRushComplete();
    }
  }

  function onBossRushComplete() {
    if (typeof announceWave === 'function') {
      announceWave('BOSS RUSH COMPLETE!');
    }
    if (window.SR.Progression) {
      window.SR.Progression.grantXP(1000);
    }
    if (typeof inventory !== 'undefined') {
      inventory.coins += 500;
    }
    currentMode = 'solo';
  }

  // ── Team Deathmatch ─────────────────────────────────────────────

  var teams = { red: [], blue: [] };
  var teamScores = { red: 0, blue: 0 };
  var TDM_SCORE_LIMIT = 30;
  var myTeam = null;

  function startTDM() {
    currentMode = 'tdm';
    teamScores = { red: 0, blue: 0 };
    // Team assignment happens server-side; client stores its own team
    updateTDMHUD();
  }

  function assignTeam(team) {
    myTeam = team;
    updateTDMHUD();
  }

  function onTDMKill(killerTeam) {
    if (currentMode !== 'tdm') return;
    if (killerTeam === 'red' || killerTeam === 'blue') {
      teamScores[killerTeam]++;
      updateTDMHUD();
      if (teamScores[killerTeam] >= TDM_SCORE_LIMIT) {
        endTDM(killerTeam);
      }
    }
  }

  function updateTDMHUD() {
    var el = document.getElementById('tdmScores');
    if (el) {
      el.style.display = currentMode === 'tdm' ? 'block' : 'none';
      el.innerHTML =
        '<span style="color:#ff4444;">RED ' +
        teamScores.red +
        '</span> | <span style="color:#4444ff;">BLUE ' +
        teamScores.blue +
        '</span>';
    }
  }

  function endTDM(winnerTeam) {
    if (typeof announceWave === 'function') {
      announceWave(winnerTeam.toUpperCase() + ' TEAM WINS!');
    }
    currentMode = 'solo';
  }

  // ── Co-op PvE ──────────────────────────────────────────────────
  // Uses same wave system but enemies are synced by server.

  function startCoop() {
    currentMode = 'coop';
    if (typeof announceWave === 'function') announceWave('CO-OP MODE');
  }

  // ── Spectator Mode ─────────────────────────────────────────────

  var spectating = false;
  var spectateTarget = null;
  var spectateIndex = 0;

  function enterSpectator() {
    spectating = true;
    currentMode = 'spectator';
    // Hide HUD combat elements
    var hud = document.getElementById('hotbar');
    if (hud) hud.style.display = 'none';
    var cross = document.getElementById('crosshair');
    if (cross) cross.style.display = 'none';

    cycleSpectateTarget(1);

    var div = document.createElement('div');
    div.id = 'spectatorLabel';
    div.style.cssText =
      'position:fixed;top:15px;left:50%;transform:translateX(-50%);' +
      'color:#aaa;font-size:14px;z-index:200;pointer-events:none;' +
      'background:rgba(0,0,0,0.6);padding:5px 12px;border-radius:5px;';
    div.textContent = 'SPECTATING - Arrow keys to switch';
    document.body.appendChild(div);
  }

  function exitSpectator() {
    spectating = false;
    spectateTarget = null;
    currentMode = 'solo';
    var label = document.getElementById('spectatorLabel');
    if (label) label.remove();
  }

  function cycleSpectateTarget(direction) {
    if (typeof remotePlayers === 'undefined') return;
    var ids = Object.keys(remotePlayers);
    if (ids.length === 0) return;
    spectateIndex = (spectateIndex + direction + ids.length) % ids.length;
    spectateTarget = ids[spectateIndex];
  }

  function updateSpectator() {
    if (!spectating || !spectateTarget) return;
    if (typeof remotePlayers === 'undefined' || !remotePlayers[spectateTarget]) {
      cycleSpectateTarget(1);
      return;
    }
    var target = remotePlayers[spectateTarget];
    if (target.mesh && typeof camera !== 'undefined') {
      var pos = target.mesh.position.clone();
      pos.y += 3;
      pos.z += 5;
      camera.position.lerp(pos, 0.05);
      camera.lookAt(target.mesh.position);
    }
  }

  window.SR.GameModes = {
    getMode: function () {
      return currentMode;
    },
    setMode: function (m) {
      currentMode = m;
    },

    // Boss Rush
    startBossRush: startBossRush,
    onBossRushBossKilled: onBossRushBossKilled,
    getBossRushWave: function () {
      return bossRushWave;
    },

    // TDM
    startTDM: startTDM,
    assignTeam: assignTeam,
    onTDMKill: onTDMKill,
    getTeamScores: function () {
      return teamScores;
    },
    getMyTeam: function () {
      return myTeam;
    },

    // Co-op
    startCoop: startCoop,

    // Spectator
    enterSpectator: enterSpectator,
    exitSpectator: exitSpectator,
    cycleSpectateTarget: cycleSpectateTarget,
    updateSpectator: updateSpectator,
    isSpectating: function () {
      return spectating;
    },
  };
})();
