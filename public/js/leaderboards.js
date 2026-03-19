// Leaderboards: global/weekly/daily rankings with UI panel
(function () {
  'use strict';

  var panelOpen = false;
  var panelElement = null;
  var cachedData = { global: [], weekly: [], daily: [] };
  var activeTab = 'global';

  function createPanel() {
    if (panelElement) return;

    panelElement = document.createElement('div');
    panelElement.id = 'leaderboardPanel';
    panelElement.style.cssText =
      'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'width:400px;max-height:500px;background:rgba(10,10,20,0.95);' +
      'border:2px solid #4a0080;border-radius:12px;z-index:300;' +
      'display:none;color:#fff;font-size:13px;overflow:hidden;';

    panelElement.innerHTML =
      '<div style="padding:12px 16px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;">' +
      '<h3 style="margin:0;color:#ffd700;">Leaderboards</h3>' +
      '<button id="lbClose" style="background:none;border:none;color:#aaa;font-size:18px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<div style="display:flex;border-bottom:1px solid #333;">' +
      '<button class="lb-tab" data-tab="global" style="flex:1;padding:8px;background:#4a0080;border:none;color:#fff;cursor:pointer;">Global</button>' +
      '<button class="lb-tab" data-tab="weekly" style="flex:1;padding:8px;background:transparent;border:none;color:#aaa;cursor:pointer;">Weekly</button>' +
      '<button class="lb-tab" data-tab="daily" style="flex:1;padding:8px;background:transparent;border:none;color:#aaa;cursor:pointer;">Daily</button>' +
      '</div>' +
      '<div id="lbContent" style="padding:10px 16px;max-height:380px;overflow-y:auto;"></div>';

    document.body.appendChild(panelElement);

    // Event listeners
    document.getElementById('lbClose').addEventListener('click', closePanel);
    var tabs = panelElement.querySelectorAll('.lb-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        activeTab = this.getAttribute('data-tab');
        // Update tab styles
        var allTabs = panelElement.querySelectorAll('.lb-tab');
        for (var j = 0; j < allTabs.length; j++) {
          allTabs[j].style.background = allTabs[j] === this ? '#4a0080' : 'transparent';
          allTabs[j].style.color = allTabs[j] === this ? '#fff' : '#aaa';
        }
        renderContent();
      });
    }
  }

  function openPanel() {
    createPanel();
    panelOpen = true;
    panelElement.style.display = 'block';
    fetchLeaderboards();
  }

  function closePanel() {
    panelOpen = false;
    if (panelElement) panelElement.style.display = 'none';
  }

  function togglePanel() {
    if (panelOpen) closePanel();
    else openPanel();
  }

  function fetchLeaderboards() {
    // Fetch from API
    fetch('/api/leaderboard?period=' + activeTab)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        cachedData[activeTab] = data.entries || [];
        renderContent();
      })
      .catch(function () {
        renderContent();
      });
  }

  function renderContent() {
    var container = document.getElementById('lbContent');
    if (!container) return;

    var entries = cachedData[activeTab] || [];
    if (entries.length === 0) {
      container.innerHTML =
        '<p style="color:#888;text-align:center;padding:20px;">No entries yet. Play to be the first!</p>';
      return;
    }

    var html =
      '<table style="width:100%;border-collapse:collapse;">' +
      '<tr style="color:#888;font-size:11px;"><td>#</td><td>Player</td><td style="text-align:right;">Score</td><td style="text-align:right;">Wave</td></tr>';

    for (var i = 0; i < entries.length && i < 50; i++) {
      var e = entries[i];
      var rankColor = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#fff';
      html +=
        '<tr style="border-top:1px solid #222;"><td style="color:' +
        rankColor +
        ';font-weight:bold;">' +
        (i + 1) +
        '</td><td>' +
        (e.name || 'Unknown') +
        '</td><td style="text-align:right;">' +
        (e.score || 0) +
        '</td><td style="text-align:right;">' +
        (e.wave || 0) +
        '</td></tr>';
    }

    html += '</table>';
    container.innerHTML = html;
  }

  function submitScore(name, score, wave, kills) {
    fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        score: score,
        wave: wave,
        kills: kills,
      }),
    }).catch(function () {
      // Silently fail - not critical
    });
  }

  window.SR.Leaderboards = {
    openPanel: openPanel,
    closePanel: closePanel,
    togglePanel: togglePanel,
    submitScore: submitScore,
    isOpen: function () {
      return panelOpen;
    },
  };
})();
