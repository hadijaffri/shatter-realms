// Emote system: 6 emotes with radial wheel, multiplayer broadcast
(function () {
  'use strict';

  var EMOTES = [
    { id: 'wave', icon: '👋', name: 'Wave' },
    { id: 'dance', icon: '💃', name: 'Dance' },
    { id: 'taunt', icon: '😤', name: 'Taunt' },
    { id: 'cheer', icon: '🎉', name: 'Cheer' },
    { id: 'flex', icon: '💪', name: 'Flex' },
    { id: 'bow', icon: '🙇', name: 'Bow' },
  ];

  var wheelOpen = false;
  var wheelElement = null;

  function createWheel() {
    if (wheelElement) return;

    wheelElement = document.createElement('div');
    wheelElement.id = 'emoteWheel';
    wheelElement.style.cssText =
      'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'width:200px;height:200px;display:none;z-index:250;pointer-events:auto;';

    var angleStep = (2 * Math.PI) / EMOTES.length;
    var radius = 70;

    for (var i = 0; i < EMOTES.length; i++) {
      var emote = EMOTES[i];
      var angle = angleStep * i - Math.PI / 2;
      var x = Math.cos(angle) * radius + 100 - 22;
      var y = Math.sin(angle) * radius + 100 - 22;

      var btn = document.createElement('button');
      btn.style.cssText =
        'position:absolute;width:44px;height:44px;border-radius:50%;' +
        'background:rgba(0,0,0,0.8);border:2px solid #888;color:#fff;' +
        'font-size:22px;cursor:pointer;display:flex;align-items:center;' +
        'justify-content:center;left:' +
        x +
        'px;top:' +
        y +
        'px;';
      btn.textContent = emote.icon;
      btn.title = emote.name;
      btn.setAttribute('data-emote', emote.id);
      btn.addEventListener(
        'click',
        (function (eid) {
          return function () {
            playEmote(eid);
            closeWheel();
          };
        })(emote.id)
      );
      wheelElement.appendChild(btn);
    }

    // Center label
    var center = document.createElement('div');
    center.style.cssText =
      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'color:#aaa;font-size:11px;pointer-events:none;';
    center.textContent = 'EMOTES';
    wheelElement.appendChild(center);

    document.body.appendChild(wheelElement);
  }

  function openWheel() {
    createWheel();
    wheelOpen = true;
    wheelElement.style.display = 'block';
  }

  function closeWheel() {
    wheelOpen = false;
    if (wheelElement) wheelElement.style.display = 'none';
  }

  function toggleWheel() {
    if (wheelOpen) closeWheel();
    else openWheel();
  }

  function isWheelOpen() {
    return wheelOpen;
  }

  function playEmote(emoteId) {
    var emote = null;
    for (var i = 0; i < EMOTES.length; i++) {
      if (EMOTES[i].id === emoteId) {
        emote = EMOTES[i];
        break;
      }
    }
    if (!emote) return;

    // Show emote above player
    var div = document.createElement('div');
    div.style.cssText =
      'position:fixed;top:35%;left:50%;transform:translate(-50%,-50%);' +
      'font-size:48px;z-index:200;pointer-events:none;' +
      'animation:emoteFloat 1.5s ease-out forwards;';
    div.textContent = emote.icon;
    document.body.appendChild(div);
    setTimeout(function () {
      div.remove();
    }, 1500);

    // Broadcast in multiplayer
    if (typeof ws !== 'undefined' && ws && ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: 'emote',
          emoteId: emoteId,
        })
      );
    }

    closeWheel();
  }

  // Show emote from a remote player
  function showRemoteEmote(playerId, emoteId) {
    var emote = null;
    for (var i = 0; i < EMOTES.length; i++) {
      if (EMOTES[i].id === emoteId) {
        emote = EMOTES[i];
        break;
      }
    }
    if (!emote) return;

    // Find the remote player's mesh
    if (
      typeof remotePlayers !== 'undefined' &&
      remotePlayers[playerId] &&
      remotePlayers[playerId].mesh
    ) {
      var mesh = remotePlayers[playerId].mesh;
      // Create floating emote in 3D (using DOM overlay)
      if (typeof camera !== 'undefined') {
        var sp = mesh.position.clone();
        sp.y += 2.5;
        sp = sp.project(camera);
        if (sp.z < 1) {
          var x = (sp.x * 0.5 + 0.5) * window.innerWidth;
          var y = (-sp.y * 0.5 + 0.5) * window.innerHeight;
          var div = document.createElement('div');
          div.style.cssText =
            'position:fixed;font-size:36px;z-index:200;pointer-events:none;' +
            'left:' +
            x +
            'px;top:' +
            y +
            'px;transform:translate(-50%,-50%);';
          div.textContent = emote.icon;
          document.body.appendChild(div);
          setTimeout(function () {
            div.remove();
          }, 2000);
        }
      }
    }
  }

  // Inject CSS animation for emote float
  var style = document.createElement('style');
  style.textContent =
    '@keyframes emoteFloat { 0% { opacity:1; transform:translate(-50%,-50%) scale(1); } ' +
    '100% { opacity:0; transform:translate(-50%,-120%) scale(1.5); } }';
  document.head.appendChild(style);

  window.SR.Emotes = {
    EMOTES: EMOTES,
    openWheel: openWheel,
    closeWheel: closeWheel,
    toggleWheel: toggleWheel,
    isWheelOpen: isWheelOpen,
    playEmote: playEmote,
    showRemoteEmote: showRemoteEmote,
  };
})();
