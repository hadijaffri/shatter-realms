import type * as Party from "partykit/server";

interface Player {
    id: string;
    name: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number };
    health: number;
    maxHealth: number;
    kills: number;
    deaths: number;
    weapon: string;
    lastUpdate: number;
}

interface GameState {
    players: Map<string, Player>;
    matchStartTime: number;
    matchDuration: number; // 5 minutes in ms
    matchEnded: boolean;
    winner: string | null;
}

export default class GameServer implements Party.Server {
    constructor(readonly room: Party.Room) {}

    state: GameState = {
        players: new Map(),
        matchStartTime: 0,
        matchDuration: 5 * 60 * 1000, // 5 minutes
        matchEnded: false,
        winner: null
    };

    timerInterval: ReturnType<typeof setInterval> | null = null;

    onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
        // Player connected, wait for join message with player data
        console.log(`Player connected: ${conn.id}`);
    }

    onClose(conn: Party.Connection) {
        // Remove player from state
        const player = this.state.players.get(conn.id);
        if (player) {
            this.state.players.delete(conn.id);
            // Broadcast player left
            this.room.broadcast(JSON.stringify({
                type: "player_left",
                playerId: conn.id,
                playerName: player.name
            }));
        }

        // If no players left, reset match
        if (this.state.players.size === 0) {
            this.resetMatch();
        }
    }

    onMessage(message: string, sender: Party.Connection) {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case "join":
                    this.handleJoin(sender, data);
                    break;
                case "position":
                    this.handlePosition(sender, data);
                    break;
                case "attack":
                    this.handleAttack(sender, data);
                    break;
                case "damage":
                    this.handleDamage(sender, data);
                    break;
                case "respawn":
                    this.handleRespawn(sender);
                    break;
            }
        } catch (e) {
            console.error("Error parsing message:", e);
        }
    }

    handleJoin(conn: Party.Connection, data: any) {
        const player: Player = {
            id: conn.id,
            name: data.name || `Player_${conn.id.slice(0, 4)}`,
            position: { x: Math.random() * 40 - 20, y: 1.7, z: Math.random() * 40 - 20 },
            rotation: { x: 0, y: 0 },
            health: 100,
            maxHealth: 100,
            kills: 0,
            deaths: 0,
            weapon: data.weapon || "sword",
            lastUpdate: Date.now()
        };

        this.state.players.set(conn.id, player);

        // Start match if first player or match ended
        if (this.state.matchEnded || this.state.matchStartTime === 0) {
            this.startMatch();
        }

        // Send current game state to joining player
        const playersArray = Array.from(this.state.players.values());
        conn.send(JSON.stringify({
            type: "game_state",
            players: playersArray,
            matchStartTime: this.state.matchStartTime,
            matchDuration: this.state.matchDuration,
            timeRemaining: this.getTimeRemaining()
        }));

        // Broadcast new player to all others
        this.room.broadcast(JSON.stringify({
            type: "player_joined",
            player: player
        }), [conn.id]);
    }

    handlePosition(conn: Party.Connection, data: any) {
        const player = this.state.players.get(conn.id);
        if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
            player.weapon = data.weapon || player.weapon;
            player.lastUpdate = Date.now();

            // Broadcast position to all other players
            this.room.broadcast(JSON.stringify({
                type: "player_position",
                playerId: conn.id,
                position: player.position,
                rotation: player.rotation,
                weapon: player.weapon,
                health: player.health
            }), [conn.id]);
        }
    }

    handleAttack(conn: Party.Connection, data: any) {
        // Broadcast attack animation to all players
        this.room.broadcast(JSON.stringify({
            type: "player_attack",
            playerId: conn.id,
            weapon: data.weapon,
            position: data.position,
            direction: data.direction
        }), [conn.id]);
    }

    handleDamage(conn: Party.Connection, data: any) {
        const target = this.state.players.get(data.targetId);
        const attacker = this.state.players.get(conn.id);

        if (target && attacker && !this.state.matchEnded) {
            target.health -= data.damage;

            // Broadcast damage
            this.room.broadcast(JSON.stringify({
                type: "player_damaged",
                targetId: data.targetId,
                attackerId: conn.id,
                damage: data.damage,
                health: target.health
            }));

            // Check for kill
            if (target.health <= 0) {
                attacker.kills++;
                target.deaths++;
                target.health = 0;

                // Broadcast kill
                this.room.broadcast(JSON.stringify({
                    type: "player_killed",
                    targetId: data.targetId,
                    killerId: conn.id,
                    killerName: attacker.name,
                    targetName: target.name,
                    killerKills: attacker.kills
                }));
            }
        }
    }

    handleRespawn(conn: Party.Connection) {
        const player = this.state.players.get(conn.id);
        if (player) {
            player.health = player.maxHealth;
            player.position = {
                x: Math.random() * 40 - 20,
                y: 1.7,
                z: Math.random() * 40 - 20
            };

            // Broadcast respawn
            this.room.broadcast(JSON.stringify({
                type: "player_respawned",
                playerId: conn.id,
                position: player.position,
                health: player.health
            }));
        }
    }

    startMatch() {
        this.state.matchStartTime = Date.now();
        this.state.matchEnded = false;
        this.state.winner = null;

        // Reset all player stats
        this.state.players.forEach(player => {
            player.kills = 0;
            player.deaths = 0;
            player.health = player.maxHealth;
        });

        // Start timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            const timeRemaining = this.getTimeRemaining();

            // Broadcast time update every 10 seconds
            if (timeRemaining % 10000 < 1000) {
                this.broadcastTimeUpdate();
            }

            // Check for match end
            if (timeRemaining <= 0) {
                this.endMatch();
            }
        }, 1000);

        // Broadcast match start
        this.room.broadcast(JSON.stringify({
            type: "match_start",
            matchStartTime: this.state.matchStartTime,
            matchDuration: this.state.matchDuration
        }));
    }

    getTimeRemaining(): number {
        if (this.state.matchStartTime === 0) return this.state.matchDuration;
        return Math.max(0, this.state.matchDuration - (Date.now() - this.state.matchStartTime));
    }

    broadcastTimeUpdate() {
        this.room.broadcast(JSON.stringify({
            type: "time_update",
            timeRemaining: this.getTimeRemaining()
        }));
    }

    endMatch() {
        if (this.state.matchEnded) return;

        this.state.matchEnded = true;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Find winner (most kills)
        let winner: Player | null = null;
        let maxKills = -1;

        this.state.players.forEach(player => {
            if (player.kills > maxKills) {
                maxKills = player.kills;
                winner = player;
            }
        });

        this.state.winner = winner?.id || null;

        // Create scoreboard
        const scoreboard = Array.from(this.state.players.values())
            .map(p => ({
                id: p.id,
                name: p.name,
                kills: p.kills,
                deaths: p.deaths
            }))
            .sort((a, b) => b.kills - a.kills);

        // Broadcast match end
        this.room.broadcast(JSON.stringify({
            type: "match_end",
            winnerId: this.state.winner,
            winnerName: winner?.name || "No one",
            winnerKills: maxKills,
            scoreboard: scoreboard,
            reward: 75 // Winner gets 75 coins
        }));
    }

    resetMatch() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.state = {
            players: new Map(),
            matchStartTime: 0,
            matchDuration: 5 * 60 * 1000,
            matchEnded: false,
            winner: null
        };
    }
}
