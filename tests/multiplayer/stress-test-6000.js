#!/usr/bin/env node
// Multiplayer Stress Test - 6000 Iterations
// Tests the PartyKit multiplayer server with simulated players

const IterationRunner = require('./IterationRunner');
const config = require('./config');

class StressTestOrchestrator {
  constructor() {
    this.completedIterations = 0;
    this.failedIterations = 0;
    this.allResults = [];
    this.startTime = null;
    this.totalMessages = 0;
    this.totalErrors = [];
  }

  async runAllIterations() {
    this.startTime = Date.now();

    console.log('\n' + '='.repeat(60));
    console.log('  SHATTER REALMS - MULTIPLAYER STRESS TEST');
    console.log('='.repeat(60));
    console.log(`\nConfiguration:`);
    console.log(`  Total iterations:     ${config.TOTAL_ITERATIONS}`);
    console.log(`  Concurrent batches:   ${config.CONCURRENT_BATCHES}`);
    console.log(
      `  Agents per iteration: ${config.AGENTS_PER_ITERATION.min}-${config.AGENTS_PER_ITERATION.max}`
    );
    console.log(`  Actions per iteration: ${config.ACTIONS_PER_ITERATION}`);
    console.log(`  PartyKit host:        ${config.PARTYKIT_HOST}`);
    console.log(`\nStarting test...\n`);

    const batchSize = config.CONCURRENT_BATCHES;
    const totalBatches = Math.ceil(config.TOTAL_ITERATIONS / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, config.TOTAL_ITERATIONS);
      const batchNum = batch + 1;

      process.stdout.write(
        `\rBatch ${batchNum}/${totalBatches} (iterations ${batchStart + 1}-${batchEnd})...`
      );

      const batchPromises = [];
      for (let i = batchStart; i < batchEnd; i++) {
        // Distribute across 10 different rooms to reduce server load
        const roomId = `${config.TEST_ROOM_PREFIX}${batch}_${i % 10}`;
        const runner = new IterationRunner(i, roomId);
        batchPromises.push(runner.run());
      }

      const batchResults = await Promise.all(batchPromises);

      // Process batch results
      for (const result of batchResults) {
        this.allResults.push(result);
        this.totalMessages += result.messagesExchanged;

        if (result.success && result.errors.length === 0) {
          this.completedIterations++;
        } else {
          this.failedIterations++;
          this.totalErrors.push(...result.errors);
        }
      }

      // Progress update
      const progress = (
        ((this.completedIterations + this.failedIterations) / config.TOTAL_ITERATIONS) *
        100
      ).toFixed(1);
      const successRate = (
        (this.completedIterations / (this.completedIterations + this.failedIterations)) *
        100
      ).toFixed(1);
      process.stdout.write(
        `\rBatch ${batchNum}/${totalBatches} | Progress: ${progress}% | Success: ${successRate}% | Messages: ${this.totalMessages}    `
      );

      // Delay between batches to prevent overwhelming the server
      if (batch < totalBatches - 1) {
        await this.delay(config.BATCH_DELAY_MS);
      }
    }

    console.log('\n');
    this.generateReport();
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const avgDuration =
      this.allResults.reduce((sum, r) => sum + r.duration, 0) / this.allResults.length;
    const totalAgents = this.allResults.reduce((sum, r) => sum + r.agentCount, 0);
    const totalActions = this.allResults.reduce((sum, r) => sum + r.actionsCompleted, 0);

    console.log('='.repeat(60));
    console.log('  STRESS TEST REPORT - 6000 ITERATIONS');
    console.log('='.repeat(60));

    console.log(`\n  SUMMARY`);
    console.log(`  ${'─'.repeat(56)}`);
    console.log(`  Total iterations:       ${config.TOTAL_ITERATIONS}`);
    console.log(
      `  Successful:             ${this.completedIterations} (${((this.completedIterations / config.TOTAL_ITERATIONS) * 100).toFixed(2)}%)`
    );
    console.log(
      `  Failed:                 ${this.failedIterations} (${((this.failedIterations / config.TOTAL_ITERATIONS) * 100).toFixed(2)}%)`
    );
    console.log(`  Total duration:         ${(totalDuration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`  Avg iteration duration: ${avgDuration.toFixed(2)}ms`);

    console.log(`\n  PERFORMANCE METRICS`);
    console.log(`  ${'─'.repeat(56)}`);
    console.log(`  Total agents created:   ${totalAgents}`);
    console.log(`  Total actions performed: ${totalActions}`);
    console.log(`  Total messages:         ${this.totalMessages}`);
    console.log(
      `  Messages per second:    ${(this.totalMessages / (totalDuration / 1000)).toFixed(2)}`
    );
    console.log(
      `  Iterations per second:  ${(config.TOTAL_ITERATIONS / (totalDuration / 1000)).toFixed(2)}`
    );

    // Error analysis
    if (this.totalErrors.length > 0) {
      console.log(`\n  ERRORS (${this.totalErrors.length} total)`);
      console.log(`  ${'─'.repeat(56)}`);

      const errorCounts = {};
      this.totalErrors.forEach(e => {
        const errorType = typeof e === 'string' ? e.split(':')[0] : e.type || 'unknown';
        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      });

      Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([error, count]) => {
          console.log(`  ${error}: ${count} occurrences`);
        });
    }

    // Final verdict
    console.log(`\n${'='.repeat(60)}`);
    const successRate = this.completedIterations / config.TOTAL_ITERATIONS;

    if (successRate >= config.SUCCESS_THRESHOLD) {
      console.log(`  RESULT: PASSED`);
      console.log(
        `  Success rate ${(successRate * 100).toFixed(2)}% >= ${config.SUCCESS_THRESHOLD * 100}% threshold`
      );
    } else if (successRate >= config.MARGINAL_THRESHOLD) {
      console.log(`  RESULT: MARGINAL`);
      console.log(
        `  Success rate ${(successRate * 100).toFixed(2)}% between ${config.MARGINAL_THRESHOLD * 100}%-${config.SUCCESS_THRESHOLD * 100}%`
      );
    } else {
      console.log(`  RESULT: FAILED`);
      console.log(
        `  Success rate ${(successRate * 100).toFixed(2)}% < ${config.MARGINAL_THRESHOLD * 100}% threshold`
      );
    }
    console.log('='.repeat(60) + '\n');

    // Return exit code based on result
    return successRate >= config.SUCCESS_THRESHOLD ? 0 : 1;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let iterations = config.TOTAL_ITERATIONS;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--iterations' && args[i + 1]) {
    iterations = parseInt(args[i + 1]);
    config.TOTAL_ITERATIONS = iterations;
  }
  if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Shatter Realms Multiplayer Stress Test

Usage: node stress-test-6000.js [options]

Options:
  --iterations <n>  Number of iterations to run (default: 6000)
  --help, -h        Show this help message

Examples:
  node stress-test-6000.js                    # Run 6000 iterations
  node stress-test-6000.js --iterations 100   # Run 100 iterations (quick test)
`);
    process.exit(0);
  }
}

// Run the test
const orchestrator = new StressTestOrchestrator();
orchestrator
  .runAllIterations()
  .then(exitCode => {
    process.exit(exitCode || 0);
  })
  .catch(error => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });
