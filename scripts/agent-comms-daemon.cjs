const { spawnSync } = require('child_process');

const scriptPath = 'C:\\Users\\hadi\\.agent-comms\\bin\\agent-comms-daemon.cjs';
const result = spawnSync(process.execPath, [scriptPath, '--project', 'shatter-realms', ...process.argv.slice(2)], {
  stdio: 'inherit',
});

process.exit(result.status === null ? 1 : result.status);
