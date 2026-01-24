// Multiplayer stress test script
const WebSocket = require('ws');

const PARTYKIT_HOST = 'game.hadijaffri.partykit.dev';
const ROOM_ID = 'test-room-' + Date.now();

class TestPlayer {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.ws = null;
        this.connected = false;
        this.messagesReceived = 0;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const wsUrl = `wss://${PARTYKIT_HOST}/parties/shatterrealmsgame/${ROOM_ID}`;

            console.log(`[Player ${this.id}] Connecting to ${wsUrl}...`);

            this.ws = new WebSocket(wsUrl);

            this.ws.on('open', () => {
                console.log(`[Player ${this.id}] Connected!`);
                this.connected = true;

                // Send join message
                this.ws.send(JSON.stringify({
                    type: 'join',
                    name: this.name,
                    weapon: 'sword'
                }));

                resolve();
            });

            this.ws.on('message', (data) => {
                this.messagesReceived++;
                const msg = JSON.parse(data);
                console.log(`[Player ${this.id}] Received: ${msg.type}`);

                // Respond to game state
                if (msg.type === 'game_state') {
                    console.log(`[Player ${this.id}] Game has ${msg.players.length} players`);
                }
            });

            this.ws.on('error', (error) => {
                console.error(`[Player ${this.id}] Error:`, error.message);
                reject(error);
            });

            this.ws.on('close', () => {
                console.log(`[Player ${this.id}] Disconnected`);
                this.connected = false;
            });

            setTimeout(() => {
                if (!this.connected) {
                    reject(new Error('Connection timeout'));
                }
            }, 10000);
        });
    }

    sendPosition() {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'position',
                position: {
                    x: Math.random() * 40 - 20,
                    y: 1.7,
                    z: Math.random() * 40 - 20
                },
                rotation: {
                    x: 0,
                    y: Math.random() * Math.PI * 2
                },
                weapon: 'sword'
            }));
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

async function runTest(numPlayers = 10, durationMs = 30000) {
    console.log(`\n🎮 Starting multiplayer stress test with ${numPlayers} players for ${durationMs/1000}s\n`);

    const players = [];

    // Create and connect players
    for (let i = 0; i < numPlayers; i++) {
        const player = new TestPlayer(i + 1, `TestPlayer_${i + 1}`);
        players.push(player);

        try {
            await player.connect();
            await new Promise(resolve => setTimeout(resolve, 500)); // Stagger connections
        } catch (error) {
            console.error(`Failed to connect player ${i + 1}:`, error.message);
        }
    }

    console.log(`\n✅ ${players.filter(p => p.connected).length}/${numPlayers} players connected\n`);

    // Simulate gameplay
    const interval = setInterval(() => {
        players.forEach(player => {
            if (Math.random() > 0.7) { // 30% chance to send position update
                player.sendPosition();
            }
        });
    }, 100);

    // Run for specified duration
    await new Promise(resolve => setTimeout(resolve, durationMs));

    // Cleanup
    clearInterval(interval);
    players.forEach(player => player.disconnect());

    // Results
    console.log('\n📊 Test Results:');
    players.forEach(player => {
        console.log(`  Player ${player.id}: ${player.messagesReceived} messages received`);
    });

    const totalMessages = players.reduce((sum, p) => sum + p.messagesReceived, 0);
    console.log(`\n  Total messages: ${totalMessages}`);
    console.log(`  Avg per player: ${(totalMessages / numPlayers).toFixed(2)}`);
}

// Run the test
const numPlayers = parseInt(process.argv[2]) || 10;
const duration = parseInt(process.argv[3]) || 30000;

runTest(numPlayers, duration)
    .then(() => {
        console.log('\n✅ Test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });
