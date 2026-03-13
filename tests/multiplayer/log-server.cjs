const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = Number(process.env.LOG_SERVER_PORT || 8787);
const logsDir = path.resolve(__dirname, 'runs');
const envLabel = process.env.STRESS_LABEL || null;
const defaultLabel = envLabel || '25m';

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (_e) {
    return '';
  }
}

function listSummaryFiles() {
  try {
    return fs.readdirSync(logsDir).filter(name => name.startsWith('stress-') && name.endsWith('-summary.log'));
  } catch (_e) {
    return [];
  }
}

function labelFromSummaryFile(file) {
  return file.slice('stress-'.length, -'-summary.log'.length);
}

function pickLatestSummary() {
  const files = listSummaryFiles();
  let latestFile = null;
  let latestTime = 0;
  for (const file of files) {
    try {
      const fullPath = path.join(logsDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.mtimeMs > latestTime) {
        latestTime = stat.mtimeMs;
        latestFile = file;
      }
    } catch (_e) {
      // ignore unreadable files
    }
  }
  if (!latestFile) return null;
  const label = labelFromSummaryFile(latestFile);
  return {
    label,
    summaryPath: path.join(logsDir, latestFile),
    detailPath: path.join(logsDir, `stress-${label}-detail.log`)
  };
}

function resolveLogPaths() {
  const preferredSummary = path.join(logsDir, `stress-${defaultLabel}-summary.log`);
  const preferredDetail = path.join(logsDir, `stress-${defaultLabel}-detail.log`);

  if (envLabel && fs.existsSync(preferredSummary)) {
    return { label: defaultLabel, summaryPath: preferredSummary, detailPath: preferredDetail };
  }

  const latest = pickLatestSummary();
  if (latest) return latest;

  return { label: defaultLabel, summaryPath: preferredSummary, detailPath: preferredDetail };
}

function parseRemaining(summaryText) {
  if (!summaryText) return null;
  const lines = summaryText.split(/\r?\n/).filter(Boolean);
  let startIdx = -1;
  let total = null;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const match = lines[i].match(/Starting ([\d,]+) iteration stress run/);
    if (match) {
      startIdx = i;
      total = Number(match[1].replace(/,/g, ''));
      break;
    }
  }
  if (startIdx === -1 || !Number.isFinite(total)) return null;
  let executed = 0;
  for (let i = lines.length - 1; i >= startIdx; i -= 1) {
    const match = lines[i].match(/totalExecuted=(\d+)\/(\d+)/);
    if (match) {
      executed = Number(match[1]);
      break;
    }
  }
  const remaining = Math.max(0, total - executed);
  return { total, executed, remaining };
}

function getMeta(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return { exists: true, size: stat.size, updated: stat.mtime.toISOString() };
  } catch (_e) {
    return { exists: false, size: 0, updated: null };
  }
}

function isNodeRunning(matchText) {
  try {
    const out = execSync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:list', { encoding: 'utf8' });
    return out.toLowerCase().includes(matchText.toLowerCase());
  } catch (_e) {
    return false;
  }
}

function respondText(res, text, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text);
}

function respondJson(res, payload, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload, null, 2));
}

function respondHtml(res, html, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(html);
}

function pageTemplate(label) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Stress Remaining</title>
  <style>
    body { margin: 0; padding: 18px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #0e1116; color: #d6d9df; }
    h1 { margin: 0 0 12px 0; font-size: 20px; color: #f5d442; }
    .meta { font-size: 11px; color: #9fb3cf; margin-bottom: 10px; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
    button, a { background: #1f2733; color: #e8edf5; border: 1px solid #344054; border-radius: 6px; padding: 8px 10px; text-decoration: none; cursor: pointer; }
    button:hover, a:hover { border-color: #5b7bb2; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 1000px) { .grid { grid-template-columns: 1fr 1fr; } }
    .card { border: 1px solid #283042; border-radius: 8px; overflow: hidden; background: #131924; }
    .head { padding: 10px; font-size: 12px; border-bottom: 1px solid #283042; background: #151f2d; }
    .remaining-wrap { padding: 28px; text-align: center; }
    .remaining-label { font-size: 12px; color: #9fb3cf; letter-spacing: 0.08em; text-transform: uppercase; }
    .remaining-value { font-size: 44px; font-weight: 700; margin-top: 10px; color: #f5d442; }
    .remaining-sub { margin-top: 8px; font-size: 12px; color: #b9c4d6; }
  </style>
</head>
<body>
  <h1>${label.toUpperCase()} Stress Remaining</h1>
  <div class="meta" id="meta">Loading status...</div>
  <div class="row">
    <button onclick="refreshAll()">Refresh</button>
    <button onclick="toggleAuto()" id="autoBtn">Auto Refresh: ON</button>
    <a href="/remaining" target="_blank" rel="noopener">Open /remaining</a>
    <a href="/summary" target="_blank" rel="noopener">Open /summary</a>
    <a href="/detail" target="_blank" rel="noopener">Open /detail</a>
    <a href="/status" target="_blank" rel="noopener">Open /status</a>
  </div>
  <div class="card">
    <div class="head">Iterations Left</div>
    <div class="remaining-wrap">
      <div class="remaining-label">Remaining</div>
      <div class="remaining-value" id="remainingValue">—</div>
      <div class="remaining-sub" id="remainingSub">Waiting for data...</div>
    </div>
  </div>
  <script>
    let auto = true;
    let timer = null;
    async function loadStatus() {
      const r = await fetch('/status?t=' + Date.now(), { cache: 'no-store' });
      return r.json();
    }
    function formatNumber(value) {
      if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a';
      return value.toLocaleString('en-US');
    }
    async function refreshAll() {
      try {
        const status = await loadStatus();
        const remaining = status.remaining || null;
        document.getElementById('meta').textContent =
          'Label: ' + status.label +
          ' | Orchestrator: ' + (status.orchestratorRunning ? 'RUNNING' : 'STOPPED') +
          ' | Runner: ' + (status.runnerRunning ? 'RUNNING' : 'STOPPED') +
          ' | Summary bytes: ' + status.files.summary.size +
          ' | Detail bytes: ' + status.files.detail.size +
          ' | Updated: ' + (status.files.summary.updated || 'n/a');
        if (remaining) {
          document.getElementById('remainingValue').textContent = formatNumber(remaining.remaining);
          document.getElementById('remainingSub').textContent = '';
        } else {
          document.getElementById('remainingValue').textContent = 'n/a';
          document.getElementById('remainingSub').textContent = 'No summary data found.';
        }
      } catch (e) {
        document.getElementById('meta').textContent = 'Failed to load logs: ' + e.message;
      }
    }
    function tick() {
      refreshAll();
      if (auto) timer = setTimeout(tick, 1000);
    }
    function toggleAuto() {
      auto = !auto;
      document.getElementById('autoBtn').textContent = 'Auto Refresh: ' + (auto ? 'ON' : 'OFF');
      if (auto) tick();
      else if (timer) clearTimeout(timer);
    }
    tick();
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  const { label, summaryPath, detailPath } = resolveLogPaths();

  if (url === '/' || url === '/index.html') {
    return respondHtml(res, pageTemplate(label));
  }
  if (url === '/summary') {
    return respondText(res, readText(summaryPath) || '(no summary log yet)');
  }
  if (url === '/detail') {
    return respondText(res, readText(detailPath) || '(no detail log yet)');
  }
  if (url === '/status') {
    const summaryText = readText(summaryPath);
    const remaining = parseRemaining(summaryText);
    return respondJson(res, {
      label,
      orchestratorRunning: isNodeRunning('run-stress-orchestrator.cjs'),
      runnerRunning: isNodeRunning('stress-test-runner.cjs'),
      remaining,
      files: {
        summary: getMeta(summaryPath),
        detail: getMeta(detailPath)
      }
    });
  }
  if (url === '/remaining') {
    const summaryText = readText(summaryPath);
    const remaining = parseRemaining(summaryText);
    return respondJson(res, { label, remaining });
  }

  return respondText(res, 'Not found', 404);
});

server.listen(PORT, () => {
  const mode = envLabel ? `label ${defaultLabel}` : 'latest label auto-detect';
  console.log(`Stress log server running at http://localhost:${PORT} (${mode})`);
});
