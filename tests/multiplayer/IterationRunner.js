// IterationRunner - Runs a single test iteration with multiple agents
const TestAgent = require('./TestAgent');
const config = require('./config');

class IterationRunner {
  constructor(iterationId, roomId) {
    this.iterationId = iterationId;
    this.roomId = roomId;
    this.agents = [];
    this.playerIds = [];
    this.results = {
      iterationId: iterationId,
      success: false,
      errors: [],
      duration: 0,
      messagesExchanged: 0,
      agentCount: 0,
      actionsCompleted: 0,
    };
  }

  async run() {
    const startTime = Date.now();

    try {
      // Create 2-4 agents per iteration
      const numAgents =
        Math.floor(
          Math.random() * (config.AGENTS_PER_ITERATION.max - config.AGENTS_PER_ITERATION.min + 1)
        ) + config.AGENTS_PER_ITERATION.min;
      this.results.agentCount = numAgents;

      // Connect all agents
      for (let i = 0; i < numAgents; i++) {
        const agent = new TestAgent(`${this.iterationId}_${i}`, this.roomId);
        this.agents.push(agent);

        try {
          await agent.connect();
          await this.delay(50); // Small delay between connections
        } catch (error) {
          this.results.errors.push(`Agent ${i} connection failed: ${error.message}`);
        }
      }

      // Wait for game_state messages to get player IDs
      await this.delay(200);

      // Collect player IDs from connected agents
      this.agents.forEach(agent => {
        if (agent.playerId) {
          this.playerIds.push(agent.playerId);
        }
      });

      // Run actions
      for (let action = 0; action < config.ACTIONS_PER_ITERATION; action++) {
        await this.performRandomActions();
        await this.delay(config.ACTION_DELAY_MS);
        this.results.actionsCompleted++;
      }

      this.results.success = true;
    } catch (error) {
      this.results.errors.push(`Iteration error: ${error.message}`);
    } finally {
      // Cleanup - disconnect all agents
      for (const agent of this.agents) {
        agent.disconnect();
      }

      this.results.duration = Date.now() - startTime;
      this.results.messagesExchanged = this.agents.reduce(
        (sum, a) => sum + a.metrics.messagesSent + a.metrics.messagesReceived,
        0
      );

      // Collect all agent errors
      for (const agent of this.agents) {
        const metrics = agent.getMetrics();
        if (metrics.errors.length > 0) {
          this.results.errors.push(...metrics.errors.map(e => `Agent ${agent.agentId}: ${e.type}`));
        }
      }
    }

    return this.results;
  }

  async performRandomActions() {
    for (const agent of this.agents) {
      if (!agent.connected) continue;

      const action = this.selectAction();

      switch (action) {
        case 'move':
          agent.move();
          break;
        case 'attack':
          agent.attack();
          break;
        case 'damage':
          const targetId = this.getRandomTarget(agent.playerId);
          if (targetId) {
            agent.dealDamage(targetId);
          }
          break;
        case 'respawn':
          if (agent.health <= 0) {
            agent.respawn();
          }
          break;
        case 'idle':
        default:
          // Do nothing
          break;
      }
    }
  }

  selectAction() {
    const rand = Math.random();
    let cumulative = 0;

    for (const [action, weight] of Object.entries(config.ACTION_WEIGHTS)) {
      cumulative += weight;
      if (rand <= cumulative) return action;
    }
    return 'idle';
  }

  getRandomTarget(excludeId) {
    const targets = this.playerIds.filter(id => id !== excludeId);
    return targets.length > 0 ? targets[Math.floor(Math.random() * targets.length)] : null;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = IterationRunner;
