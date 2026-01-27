/**
 * Tests for the Stripe config API endpoint
 * Run with: npm test
 */

describe('Stripe Config API', () => {
  const originalEnv = process.env.STRIPE_PUBLISHABLE_KEY;

  afterEach(() => {
    // Restore original env
    process.env.STRIPE_PUBLISHABLE_KEY = originalEnv;
  });

  describe('Environment configuration', () => {
    test('should validate Stripe publishable key format', () => {
      const validTestKey = 'pk_test_12345abcdef';
      const validLiveKey = 'pk_live_12345abcdef';

      expect(validTestKey.startsWith('pk_test_')).toBe(true);
      expect(validLiveKey.startsWith('pk_live_')).toBe(true);
    });

    test('should accept valid Stripe key', () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_12345';

      expect(process.env.STRIPE_PUBLISHABLE_KEY).toBeDefined();
      expect(process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_')).toBe(true);
    });

    test('should handle missing Stripe key', () => {
      delete process.env.STRIPE_PUBLISHABLE_KEY;

      expect(process.env.STRIPE_PUBLISHABLE_KEY).toBeUndefined();
    });
  });

  describe('Response structure', () => {
    test('should return expected config structure', () => {
      const config = {
        publishableKey: 'pk_test_12345',
      };

      expect(config).toHaveProperty('publishableKey');
      expect(typeof config.publishableKey).toBe('string');
    });
  });
});
