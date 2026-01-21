# ShatterRealms

A 3D wave-based dungeon crawler combat game with multiplayer PvP support.

## Features

- **Singleplayer Mode**: Wave-based PvE combat against monsters and bosses
- **Multiplayer Mode**: Real-time PvP combat with other players
- **Weapon Shop**: Buy new weapons and abilities with earned coins
- **Cloud + Cookie Persistence**: Your progress is saved both to the cloud and locally
- **5-Minute Matches**: Multiplayer matches are timed with the winner receiving 75 coins

## Tech Stack

- **Frontend**: Vanilla JS + Three.js (WebGL 3D)
- **Multiplayer**: PartyKit (Cloudflare-based WebSocket server)
- **Deployment**: Vercel
- **Storage**: Vercel Serverless Functions + Browser Cookies

## Local Development

```bash
# Install dependencies
npm install

# Start local server
npm run dev

# Start PartyKit dev server (for multiplayer)
npm run party:dev
```

## Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 2. Deploy PartyKit

```bash
# Deploy PartyKit server
npm run party:deploy
```

### 3. Update PartyKit Host

After deploying PartyKit, update the `PARTYKIT_HOST` variable in `public/index.html` with your PartyKit deployment URL.

### 4. Configure Domain (Optional)

To use a custom domain like `shatter-realms.com`:
1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS records as instructed by Vercel

## Project Structure

```
shatterrealms/
├── public/
│   └── index.html          # Main game (Three.js + multiplayer client)
├── api/
│   └── save.js             # Vercel serverless function for cloud saves
├── party/
│   └── game.ts             # PartyKit multiplayer server
├── package.json            # Dependencies and scripts
├── vercel.json             # Vercel deployment config
└── partykit.json           # PartyKit deployment config
```

## Game Controls

### Computer
- **WASD**: Move
- **Mouse**: Look around
- **Left Click**: Attack/Use item
- **Space**: Jump
- **Shift**: Sprint
- **1-6**: Select hotbar slot
- **Tab**: View scoreboard (multiplayer)

### Mobile
- **Left Joystick**: Move
- **Drag Screen**: Look around
- **Attack Button**: Attack/Use item
- **Jump Button**: Jump
- **Dash Button**: Dash

## Multiplayer Protocol

The game uses WebSocket for real-time multiplayer communication:
- Position sync at 30fps
- Server-authoritative damage and kill tracking
- 5-minute match timer
- Automatic respawn after 5 seconds

## License

MIT
