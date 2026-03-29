# Agent Communication

This project uses a shared agent board that lives outside any single git branch.

## Why This Exists

Some agents can run shell commands but cannot load a custom MCP server directly. A branch-local script is not enough if different agents are working in different branches or worktrees.

To avoid that, the actual shared CLI and data store live here:

- `C:\Users\hadi\.agent-comms\bin\agent-comms-cli.cjs`
- `C:\Users\hadi\.agent-comms\projects\shatter-realms\`

## Fastest Commands

From the repo root:

```powershell
node scripts/agent-comms-cli.cjs read --for claude --limit 20
node scripts/agent-comms-cli.cjs presence --agent claude --status active --task "working on map polish"
node scripts/agent-comms-cli.cjs post --from claude --to codex --body "I am editing public/index.html"
node scripts/agent-comms-cli.cjs claim --agent claude public/index.html
node scripts/agent-comms-cli.cjs release --agent claude public/index.html
```

## Live Pairing

Run one watcher in each agent terminal so both sides keep polling the shared board and refreshing presence.

Codex terminal:

```powershell
node scripts/agent-comms-watch.cjs --agent codex --task "waiting for the next user instruction"
```

Claude terminal:

```powershell
node C:\Users\hadi\.agent-comms\bin\agent-comms-watch.cjs --project shatter-realms --agent claude --task "waiting for the next user instruction"
```

Inside the watcher:

- `/task <message>` updates your task and broadcasts it
- `/dm <agent> <message>` sends a direct message
- `/claim <path ...>` claims files
- `/release <path ...>` releases files
- `/who` shows live presence
- `/inbox` reprints recent inbox messages

To broadcast a new user request onto the board:

```powershell
node scripts/agent-comms-task.cjs "Implement the user's latest request and coordinate changes"
```

If you want passive refresh without an interactive terminal, run the daemon:

```powershell
node scripts/agent-comms-daemon.cjs --agent codex --task "working on realism" --durationMs 1800000
```

If the repo wrapper is missing in another branch, use the global path directly:

```powershell
node C:\Users\hadi\.agent-comms\bin\agent-comms-cli.cjs --project shatter-realms read --for claude --limit 20
```

PowerShell wrapper:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\hadi\.agent-comms\bin\agent-comms.ps1 --project shatter-realms read --for claude --limit 20
```

## Shared Features

- Presence: who is working on what
- Messages: direct or broadcast handoff notes
- Claims: simple file-claim coordination to reduce collisions

## Suggested Flow

1. Set presence.
2. Claim files before editing.
3. Broadcast the latest user instruction with `agent-comms-task.cjs` or `/task`.
4. Post direct messages or handoffs while working.
5. Release claims when done.
