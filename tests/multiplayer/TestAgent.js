// TestAgent - Simulates a single player connection for stress testing
const WebSocket = require('ws');
const config = require('./config');

class TestAgent {
  constructor(agentId, roomId) {
    this.agentId = agentId;
    this.roomId = roomId;
    this.playerId = null;
    this.ws = null;
    this.connected = false;
    this.health = 100;
    this.maxHealth = 100;
    this.position = { x: 0, y: 1.7, z: 0 };

    // Metrics tracking
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      errors: [],
      latencies: [],
      actionsPerformed: {
        join: 0,
        move: 0,
        attack: 0,
        damage: 0,
        respawn: 0,
      },
      connectTime: 0,
      disconnectTime: 0,
    };
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const wsUrl = `wss://${config.PARTYKIT_HOST}/parties/${config.PARTY_NAME}/${this.roomId}`;
      const startTime = Date.now();

      try {
        this.ws = new WebSocket(wsUrl);
      } catch (error) {
        this.metrics.errors.push({
          type: 'ws_create_error',
          message: error.message,
          time: Date.now(),
        });
        return reject(error);
      }

      const timeout = setTimeout(() => {
        if (!this.connected) {
          this.metrics.errors.push({ type: 'connection_timeout', time: Date.now() });
          if (this.ws) {
            this.ws.terminate();
          }
          reject(new Error('Connection timeout'));
        }
      }, config.CONNECTION_TIMEOUT_MS);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.connected = true;
        this.metrics.connectTime = Date.now() - startTime;
        this.join();
        resolve();
      });

      this.ws.on('message', data => this.handleMessage(data));
      this.ws.on('error', error => this.handleError(error));
      this.ws.on('close', () => this.handleClose());
    });
  }

  join() {
    this.send({
      type: 'join',
      name: `Agent_${this.agentId}`,
      weapon: 'sword',
    });
    this.metrics.actionsPerformed.join++;
  }

  move() {
    this.position = {
      x: Math.random() * 40 - 20,
      y: 1.7,
      z: Math.random() * 40 - 20,
    };
    this.send({
      type: 'position',
      position: this.position,
      rotation: { x: 0, y: Math.random() * Math.PI * 2 },
      weapon: 'sword',
    });
    this.metrics.actionsPerformed.move++;
  }

  attack() {
    this.send({
      type: 'attack',
      weapon: 'sword',
      position: this.position,
      direction: { x: Math.random() - 0.5, y: 0, z: Math.random() - 0.5 },
    });
    this.metrics.actionsPerformed.attack++;
  }

  dealDamage(targetId) {
    if (!targetId) return;
    this.send({
      type: 'damage',
      targetId: targetId,
      damage: Math.floor(Math.random() * 25) + 10,
    });
    this.metrics.actionsPerformed.damage++;
  }

  respawn() {
    this.send({ type: 'respawn' });
    this.health = this.maxHealth;
    this.metrics.actionsPerformed.respawn++;
  }

  send(data) {
    if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const startTime = Date.now();
      try {
        this.ws.send(JSON.stringify(data));
        this.metrics.messagesSent++;
        this.metrics.latencies.push(Date.now() - startTime);
      } catch (error) {
        this.metrics.errors.push({ type: 'send_error', message: error.message, time: Date.now() });
      }
    }
  }

  handleMessage(data) {
    this.metrics.messagesReceived++;
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'game_state':
          this.playerId = msg.playerId;
          break;
        case 'player_damaged':
          if (msg.targetId === this.playerId) {
            this.health = msg.health;
          }
          break;
        case 'player_killed':
          if (msg.targetId === this.playerId) {
            this.health = 0;
          }
          break;
        case 'player_respawned':
          if (msg.playerId === this.playerId) {
            this.health = this.maxHealth;
          }
          break;
      }
    } catch (error) {
      this.metrics.errors.push({ type: 'parse_error', message: error.message, time: Date.now() });
    }
  }

  handleError(error) {
    this.metrics.errors.push({ type: 'ws_error', message: error.message, time: Date.now() });
  }

  handleClose() {
    this.connected = false;
    this.metrics.disconnectTime = Date.now();
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        // Ignore close errors
      }
    }
    this.connected = false;
  }

  getMetrics() {
    const latencies = this.metrics.latencies;
    return {
      agentId: this.agentId,
      playerId: this.playerId,
      messagesSent: this.metrics.messagesSent,
      messagesReceived: this.metrics.messagesReceived,
      errors: this.metrics.errors,
      actionsPerformed: this.metrics.actionsPerformed,
      connectTime: this.metrics.connectTime,
      avgLatency:
        latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
    };
  }
}

module.exports = TestAgent;
