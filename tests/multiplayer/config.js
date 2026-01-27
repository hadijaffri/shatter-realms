// Multiplayer Stress Test Configuration
module.exports = {
  // PartyKit connection settings
  PARTYKIT_HOST: 'game.hadijaffri.partykit.dev',
  PARTY_NAME: 'shatterrealmsgame',

  // Test parameters
  TOTAL_ITERATIONS: 6000,
  CONCURRENT_BATCHES: 50,
  ITERATIONS_PER_BATCH: 120,
  AGENTS_PER_ITERATION: { min: 2, max: 4 },
  ACTIONS_PER_ITERATION: 10,

  // Timing
  ACTION_DELAY_MS: 100,
  CONNECTION_TIMEOUT_MS: 10000,
  BATCH_DELAY_MS: 500,

  // Room settings
  TEST_ROOM_PREFIX: 'stress-test-',

  // Action probabilities (must sum to 1.0)
  ACTION_WEIGHTS: {
    move: 0.4, // 40% - position updates
    attack: 0.25, // 25% - attack actions
    damage: 0.15, // 15% - deal damage
    respawn: 0.05, // 5% - respawn
    idle: 0.15, // 15% - no action
  },

  // Success thresholds
  SUCCESS_THRESHOLD: 0.95, // 95% success rate = PASS
  MARGINAL_THRESHOLD: 0.8, // 80-95% = MARGINAL
};
