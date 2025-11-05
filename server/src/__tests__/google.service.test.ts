import { GoogleService } from '../services/GoogleService';
import { userStorage } from '../storage/UserStorage';

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?...'),
        getToken: jest.fn().mockResolvedValue({
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expiry_date: Date.now() + 3600000,
          },
        }),
        setCredentials: jest.fn(),
      })),
    },
    gmail: jest.fn().mockReturnValue({
      users: {
        messages: {
          list: jest.fn().mockResolvedValue({
            data: { messages: [] },
          }),
          get: jest.fn().mockResolvedValue({
            data: {
              id: 'msg-123',
              threadId: 'thread-123',
              labelIds: ['INBOX'],
              snippet: 'Test message',
              payload: {
                headers: [
                  { name: 'From', value: 'sender@example.com' },
                  { name: 'To', value: 'recipient@example.com' },
                  { name: 'Subject', value: 'Test Subject' },
                ],
              },
            },
          }),
          send: jest.fn().mockResolvedValue({
            data: { id: 'sent-msg-123' },
          }),
        },
      },
    }),
  },
}));

describe('GoogleService', () => {
  let googleService: GoogleService;
  const testUserId = 'test-google-user';

  beforeEach(() => {
    googleService = new GoogleService();
    
    // Setup user with Google credentials
    const user = userStorage.findById(testUserId) || userStorage.create({
      id: testUserId,
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashed',
      services: {},
      areas: [],
      createdAt: new Date(),
    });

    userStorage.updateServices(testUserId, 'google', {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: new Date(Date.now() + 3600000),
      connectedAt: new Date(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should generate auth URL', () => {
      const authUrl = googleService.getAuthUrl('test-state');
      expect(authUrl).toBeDefined();
      expect(typeof authUrl).toBe('string');
      expect(authUrl).toContain('https://accounts.google.com');
    });

    test('should exchange code for tokens', async () => {
      const authData = await googleService.exchangeCode('test-auth-code');
      
      expect(authData).toBeDefined();
      expect(authData.accessToken).toBe('mock-access-token');
      expect(authData.refreshToken).toBe('mock-refresh-token');
      expect(authData.expiresAt).toBeInstanceOf(Date);
    });

    test('should authenticate with valid credentials', async () => {
      const success = await googleService.authenticate(testUserId, {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      expect(success).toBe(true);
    });

    test('should fail authentication with missing credentials', async () => {
      const success = await googleService.authenticate(testUserId, {
        accessToken: '',
      });

      expect(success).toBe(false);
    });

    test('should initialize without errors', async () => {
      await expect(googleService.initialize()).resolves.not.toThrow();
    });
  });

  describe('Gmail Operations', () => {
    describe('getRecentEmails', () => {
      test('should fetch recent emails successfully', async () => {
        const emails = await googleService.getRecentEmails(testUserId, 10);
        
        expect(emails).toBeDefined();
        expect(Array.isArray(emails)).toBe(true);
      });

      test('should throw error when not authenticated', async () => {
        userStorage.updateServices(testUserId, 'google', {
          accessToken: '',
        });

        await expect(googleService.getRecentEmails(testUserId)).rejects.toThrow();
      });

      test('should respect maxResults parameter', async () => {
        const emails = await googleService.getRecentEmails(testUserId, 5);
        expect(Array.isArray(emails)).toBe(true);
      });
    });

    describe('getEmailById', () => {
      test('should fetch email by ID', async () => {
        await googleService.authenticate(testUserId, {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
        });

        const email = await googleService.getEmailById(testUserId, 'msg-123');
        
        expect(email).toBeDefined();
        expect(email?.id).toBe('msg-123');
        expect(email?.threadId).toBe('thread-123');
      });

      test('should throw error when gmail client not initialized', async () => {
        const newService = new GoogleService();
        
        await expect(
          newService.getEmailById(testUserId, 'msg-123')
        ).rejects.toThrow('Gmail client not initialized');
      });
    });

    describe('sendEmail', () => {
      test('should send email successfully', async () => {
        const result = await googleService.sendEmail(testUserId, {
          to: 'recipient@example.com',
          subject: 'Test Subject',
          body: 'Test body',
        });

        expect(result.success).toBe(true);
        expect(result.messageId).toBe('sent-msg-123');
      });

      test('should fail when not authenticated', async () => {
        userStorage.updateServices('no-auth-user', 'google', {
          accessToken: '',
        });

        const result = await googleService.sendEmail('no-auth-user', {
          to: 'test@example.com',
          subject: 'Test',
          body: 'Test',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      test('should handle API errors gracefully', async () => {
        // Gmail client will fail but should return error, not throw
        const result = await googleService.sendEmail(testUserId, {
          to: 'test@example.com',
          subject: 'Test',
          body: 'Test',
        });

        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
      });
    });
  });

  describe('Email Parsing', () => {
    test('should parse email headers correctly', async () => {
      await googleService.authenticate(testUserId, {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
      });

      const email = await googleService.getEmailById(testUserId, 'msg-123');
      
      expect(email?.from).toBe('sender@example.com');
      expect(email?.to).toBe('recipient@example.com');
      expect(email?.subject).toBe('Test Subject');
    });

    test('should handle missing headers', async () => {
      await googleService.authenticate(testUserId, {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
      });

      const email = await googleService.getEmailById(testUserId, 'msg-456');
      
      expect(email).toBeDefined();
      // Should handle gracefully even if headers are missing
    });
  });
});
