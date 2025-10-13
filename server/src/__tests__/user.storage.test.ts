import { userStorage } from '../storage/UserStorage';
import { User } from '../types/user';

describe('UserStorage', () => {
  beforeEach(() => {
    // Clear all users before each test
    const users = userStorage.getAll();
    users.forEach(user => userStorage.delete(user.id));
  });

  describe('User CRUD Operations', () => {
    test('should create a user', () => {
      const user: User = {
        id: 'test-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      userStorage.create(user);
      const found = userStorage.findById('test-1');

      expect(found).toBeDefined();
      expect(found?.email).toBe('test@example.com');
      expect(found?.firstName).toBe('John');
    });

    test('should find user by id', () => {
      const user: User = {
        id: 'test-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      userStorage.create(user);
      const found = userStorage.findById('test-1');

      expect(found).toBeDefined();
      expect(found?.id).toBe('test-1');
    });

    test('should find user by email', () => {
      const user: User = {
        id: 'test-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      userStorage.create(user);
      const found = userStorage.findByEmail('test@example.com');

      expect(found).toBeDefined();
      expect(found?.email).toBe('test@example.com');
    });

    test('should find user by email case-insensitive', () => {
      const user: User = {
        id: 'test-1',
        email: 'Test@Example.COM',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      userStorage.create(user);
      const found = userStorage.findByEmail('test@example.com');

      expect(found).toBeDefined();
      expect(found?.email).toBe('Test@Example.COM');
    });

    test('should return undefined for non-existent user', () => {
      const found = userStorage.findById('non-existent');
      expect(found).toBeUndefined();
    });

    test('should update user', () => {
      const user: User = {
        id: 'test-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      userStorage.create(user);
      const updated = userStorage.update('test-1', {
        firstName: 'Jane',
        lastName: 'Smith'
      });

      expect(updated).toBeDefined();
      expect(updated?.firstName).toBe('Jane');
      expect(updated?.lastName).toBe('Smith');
      expect(updated?.email).toBe('test@example.com');
    });

    test('should delete user', () => {
      const user: User = {
        id: 'test-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      userStorage.create(user);
      const deleted = userStorage.delete('test-1');

      expect(deleted).toBe(true);
      const found = userStorage.findById('test-1');
      expect(found).toBeUndefined();
    });

    test('should return false when deleting non-existent user', () => {
      const deleted = userStorage.delete('non-existent');
      expect(deleted).toBe(false);
    });

    test('should get all users', () => {
      const user1: User = {
        id: 'test-1',
        email: 'test1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      const user2: User = {
        id: 'test-2',
        email: 'test2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      userStorage.create(user1);
      userStorage.create(user2);

      const allUsers = userStorage.getAll();
      expect(allUsers).toHaveLength(2);
    });

    test('should count users', () => {
      const user1: User = {
        id: 'test-1',
        email: 'test1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      userStorage.create(user1);
      expect(userStorage.count()).toBe(1);

      userStorage.delete('test-1');
      expect(userStorage.count()).toBe(0);
    });
  });

  describe('Service Management', () => {
    test('should update GitHub service', () => {
      const user: User = {
        id: 'test-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      userStorage.create(user);
      const updated = userStorage.updateServices('test-1', 'github', {
        accessToken: 'github-token',
        username: 'johndoe'
      });

      expect(updated).toBeDefined();
      expect(updated?.services.github).toBeDefined();
      expect(updated?.services.github?.connected).toBe(true);
      expect(updated?.services.github?.accessToken).toBe('github-token');
      expect(updated?.services.github?.username).toBe('johndoe');
    });

    test('should update Discord service', () => {
      const user: User = {
        id: 'test-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      userStorage.create(user);
      const updated = userStorage.updateServices('test-1', 'discord', {
        botToken: 'discord-bot-token',
        guildId: '123456789'
      });

      expect(updated).toBeDefined();
      expect(updated?.services.discord).toBeDefined();
      expect(updated?.services.discord?.connected).toBe(true);
      expect(updated?.services.discord?.botToken).toBe('discord-bot-token');
      expect(updated?.services.discord?.guildId).toBe('123456789');
    });

    test('should update multiple services', () => {
      const user: User = {
        id: 'test-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        services: {}
      };

      userStorage.create(user);
      
      userStorage.updateServices('test-1', 'github', {
        accessToken: 'github-token'
      });
      
      const updated = userStorage.updateServices('test-1', 'discord', {
        botToken: 'discord-token'
      });

      expect(updated?.services.github).toBeDefined();
      expect(updated?.services.discord).toBeDefined();
    });
  });
});