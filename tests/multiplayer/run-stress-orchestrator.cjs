const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getArg(name, fallback) {
  const args = process.argv.slice(2);
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return fallback;
}

const totalIterations = Number(getArg('total', 25000000));
const chunkSize = Number(getArg('chunk', 10000));
const label = String(getArg('label', '25m'));

if (!Number.isFinite(totalIterations) || totalIterations <= 0) {
  console.error('Invalid --total value.');
  process.exit(1);
}

if (!Number.isFinite(chunkSize) || chunkSize <= 0) {
  console.error('Invalid --chunk value.');
  process.exit(1);
}

const batches = Math.ceil(totalIterations / chunkSize);
const root = path.resolve(__dirname);
const runnerPath = path.join(__dirname, 'stress-test-runner.cjs');
const logDir = path.join(root, 'runs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const summaryPath = path.join(logDir, `stress-${label}-summary.log`);
const detailPath = path.join(logDir, `stress-${label}-detail.log`);

function writeSummary(line) {
  const msg = `[${new Date().toISOString()}] ${line}`;
  console.log(msg);
  fs.appendFileSync(summaryPath, msg + '\n');
}

function appendDetail(text) {
  if (!text) return;
  fs.appendFileSync(detailPath, text);
}

function parseMetric(regex, text, fallback = 0) {
  const match = text.match(regex);
  return match ? Number(match[1]) : fallback;
}

writeSummary(`Starting ${totalIterations.toLocaleString()} iteration stress run`);
writeSummary(`Chunks: ${batches} x up to ${chunkSize}`);

let executed = 0;
let aggregateSuccess = 0;
let aggregateFailed = 0;
let aggregateMessages = 0;
let aggregateBatchesPassed = 0;
let aggregateBatchesFailed = 0;
const startedAt = Date.now();

for (let batch = 1; batch <= batches; batch++) {
  const remaining = totalIterations - executed;
  const currentIterations = Math.min(chunkSize, remaining);

  writeSummary(`Batch ${batch}/${batches} starting (${currentIterations} iterations)`);
  const started = Date.now();

  const proc = spawnSync(process.execPath, [runnerPath, '--iterations', String(currentIterations)], {
    cwd: path.resolve(__dirname, '..', '..'),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 300,
  });

  const combined = `${proc.stdout || ''}${proc.stderr || ''}`;
  appendDetail(`\n\n================ BATCH ${batch}/${batches} ================\n`);
  appendDetail(combined);

  const successful = parseMetric(/Successful:\s+(\d+)/, combined, 0);
  const failed = parseMetric(/Failed:\s+(\d+)/, combined, currentIterations - successful);
  const messages = parseMetric(/Total messages:\s+(\d+)/, combined, 0);

  aggregateSuccess += successful;
  aggregateFailed += failed;
  aggregateMessages += messages;
  executed += currentIterations;

  const ok = proc.status === 0;
  if (ok) aggregateBatchesPassed++;
  else aggregateBatchesFailed++;

  const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);
  const globalElapsedMin = ((Date.now() - startedAt) / 60000).toFixed(2);

  writeSummary(
    `Batch ${batch}/${batches} done | exit=${proc.status} | success=${successful} failed=${failed} messages=${messages} | batchTime=${elapsedSec}s | totalExecuted=${executed}/${totalIterations} | elapsed=${globalElapsedMin}m`
  );

  if (!ok && failed === 0 && successful === 0) {
    writeSummary(`Batch ${batch} produced no parsable metrics. Continuing.`);
  }
}

const totalElapsedMin = ((Date.now() - startedAt) / 60000).toFixed(2);
const successRate = totalIterations > 0 ? ((aggregateSuccess / totalIterations) * 100).toFixed(3) : '0.000';

writeSummary('==================================================');
writeSummary(`FINAL: executed=${executed}`);
writeSummary(`FINAL: successful=${aggregateSuccess}`);
writeSummary(`FINAL: failed=${aggregateFailed}`);
writeSummary(`FINAL: successRate=${successRate}%`);
writeSummary(`FINAL: messages=${aggregateMessages}`);
writeSummary(`FINAL: batchPass=${aggregateBatchesPassed} batchFail=${aggregateBatchesFailed}`);
writeSummary(`FINAL: elapsed=${totalElapsedMin} minutes`);
writeSummary('==================================================');

process.exit(aggregateBatchesFailed === 0 ? 0 : 1);

