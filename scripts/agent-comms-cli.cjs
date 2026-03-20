const { spawnSync } = require('child_process');

const cliPath = 'C:\\Users\\hadi\\.agent-comms\\bin\\agent-comms-cli.cjs';
const result = spawnSync(process.execPath, [cliPath, '--project', 'shatter-realms', ...process.argv.slice(2)], {
  stdio: 'inherit',
});

process.exit(result.status === null ? 1 : result.status);
