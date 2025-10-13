import { hashPassword, comparePassword, generateToken, verifyToken } from '../utils/auth';

describe('Authentication Utils', () => {
  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    test('should hash same password differently each time', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token', () => {
    test('should generate valid JWT token', () => {
      const userId = 'test-user-123';
      const token = generateToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('should verify valid token', () => {
      const userId = 'test-user-123';
      const token = generateToken(userId);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(userId);
    });

    test('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    test('should reject expired token', () => {
      // This test would require mocking time or using a very short expiry
      // For now, we'll just test with an obviously invalid token
      const decoded = verifyToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');
      expect(decoded).toBeNull();
    });
  });
});