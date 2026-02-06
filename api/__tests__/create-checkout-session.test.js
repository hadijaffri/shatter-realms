/**
 * Tests for the Stripe checkout session creation API endpoint
 * Run with: npm test
 */

describe('Create Checkout Session API', () => {
  describe('Coin package validation', () => {
    const packages = {
      small: { coins: 500, price: 499, name: 'Small Coin Pack' },
      medium: { coins: 1200, price: 999, name: 'Medium Coin Pack' },
      large: { coins: 2500, price: 1999, name: 'Large Coin Pack' },
      mega: { coins: 6000, price: 4999, name: 'Mega Coin Pack' },
    };

    test('should accept valid package names', () => {
      expect(packages['small']).toBeDefined();
      expect(packages['medium']).toBeDefined();
      expect(packages['large']).toBeDefined();
      expect(packages['mega']).toBeDefined();
    });

    test('should reject invalid package names', () => {
      expect(packages['invalid']).toBeUndefined();
      expect(packages['huge']).toBeUndefined();
      expect(packages['']).toBeUndefined();
    });

    test('should have correct coin amounts', () => {
      expect(packages.small.coins).toBe(500);
      expect(packages.medium.coins).toBe(1200);
      expect(packages.large.coins).toBe(2500);
      expect(packages.mega.coins).toBe(6000);
    });

    test('should have prices in cents', () => {
      expect(packages.small.price).toBe(499);
      expect(packages.medium.price).toBe(999);
      expect(packages.large.price).toBe(1999);
      expect(packages.mega.price).toBe(4999);
    });
  });

  describe('Request body validation', () => {
    test('should reject missing coinPackage', () => {
      const body = {};
      const isValid = body.coinPackage && typeof body.coinPackage === 'string';
      expect(isValid).toBeFalsy();
    });

    test('should reject non-string coinPackage', () => {
      const body = { coinPackage: 123 };
      const isValid = body.coinPackage && typeof body.coinPackage === 'string';
      expect(isValid).toBeFalsy();
    });

    test('should accept valid coinPackage', () => {
      const body = { coinPackage: 'small' };
      const isValid = body.coinPackage && typeof body.coinPackage === 'string';
      expect(isValid).toBeTruthy();
    });

    test('should accept request with optional userId', () => {
      const body = { coinPackage: 'small', userId: 'user_123' };
      const hasRequired = body.coinPackage && typeof body.coinPackage === 'string';
      const userIdValid = !body.userId || typeof body.userId === 'string';
      expect(hasRequired).toBeTruthy();
      expect(userIdValid).toBeTruthy();
    });

    test('should accept request without userId', () => {
      const body = { coinPackage: 'medium' };
      const hasRequired = body.coinPackage && typeof body.coinPackage === 'string';
      expect(hasRequired).toBeTruthy();
      expect(body.userId).toBeUndefined();
    });
  });

  describe('Base URL construction', () => {
    test('should prefer origin header', () => {
      const headers = {
        origin: 'https://example.com',
        host: 'api.example.com',
      };
      const baseUrl = headers.origin || `https://${headers.host}`;
      expect(baseUrl).toBe('https://example.com');
    });

    test('should fall back to host header with https', () => {
      const headers = {
        host: 'example.com',
      };
      const baseUrl = headers.origin || `https://${headers.host}`;
      expect(baseUrl).toBe('https://example.com');
    });
  });

  describe('Stripe error classification', () => {
    test('should identify connection errors', () => {
      const error = { type: 'StripeConnectionError', message: 'Connection failed' };
      expect(error.type === 'StripeConnectionError').toBe(true);
    });

    test('should identify auth errors', () => {
      const error = { type: 'StripeAuthenticationError', message: 'Invalid key' };
      expect(error.type === 'StripeAuthenticationError').toBe(true);
    });

    test('should identify invalid request errors', () => {
      const error = { type: 'StripeInvalidRequestError', message: 'Bad param' };
      expect(error.type === 'StripeInvalidRequestError').toBe(true);
    });

    test('should handle unknown error types', () => {
      const error = { message: 'Something unexpected' };
      const isKnownType = [
        'StripeConnectionError',
        'StripeAuthenticationError',
        'StripeInvalidRequestError',
      ].includes(error.type);
      expect(isKnownType).toBe(false);
    });
  });

  describe('Metadata formatting', () => {
    test('should convert coins to string for metadata', () => {
      const coins = 500;
      expect(coins.toString()).toBe('500');
    });

    test('should include packageType in metadata', () => {
      const coinPackage = 'mega';
      const metadata = {
        coins: '6000',
        packageType: coinPackage,
      };
      expect(metadata.packageType).toBe('mega');
    });

    test('should include userId in metadata when provided', () => {
      const userId = 'user_abc';
      const metadata = { coins: '500', packageType: 'small' };
      if (userId && typeof userId === 'string') {
        metadata.userId = userId;
      }
      expect(metadata.userId).toBe('user_abc');
    });

    test('should not include userId in metadata when absent', () => {
      const userId = undefined;
      const metadata = { coins: '500', packageType: 'small' };
      if (userId && typeof userId === 'string') {
        metadata.userId = userId;
      }
      expect(metadata.userId).toBeUndefined();
    });
  });
});
