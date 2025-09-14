import InvalidPurchaseException from '../../src/pairtest/lib/InvalidPurchaseException';

describe('InvalidPurchaseException', () => {
  test('should be an instance of Error', () => {
    const exception = new InvalidPurchaseException('Test message');

    expect(exception).toBeInstanceOf(Error);
    expect(exception).toBeInstanceOf(InvalidPurchaseException);
  });

  test('should store the error message correctly', () => {
    const message = 'Invalid ticket purchase request';
    const exception = new InvalidPurchaseException(message);

    expect(exception.message).toBe(message);
  });

  test('should have correct name property', () => {
    const exception = new InvalidPurchaseException('Test');

    expect(exception.name).toBe('InvalidPurchaseException');
  });

  test('should be throwable and catchable', () => {
    const message = 'Test exception message';

    expect(() => {
      throw new InvalidPurchaseException(message);
    }).toThrow(InvalidPurchaseException);

    expect(() => {
      throw new InvalidPurchaseException(message);
    }).toThrow(message);
  });

  test('should work without a message', () => {
    const exception = new InvalidPurchaseException();

    expect(exception).toBeInstanceOf(InvalidPurchaseException);
    expect(exception.message).toBe('');
  });

  test('should maintain stack trace', () => {
    const exception = new InvalidPurchaseException('Test');

    expect(exception.stack).toBeDefined();
    expect(typeof exception.stack).toBe('string');
  });
});
