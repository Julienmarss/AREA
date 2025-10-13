import { InMemoryDB } from '../models/area.model';

describe('AREA Model - InMemoryDB', () => {
  beforeEach(() => {
    // Clear the database before each test
    const areas = InMemoryDB.getAreas();
    areas.forEach(area => InMemoryDB.deleteArea(area.id));
  });

  describe('AREA CRUD Operations', () => {
    test('should create a new AREA', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Test AREA',
        enabled: true,
        action: {
          service: 'spotify',
          type: 'new_track_played',
          config: {}
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: { channelId: '123' }
        }
      });

      expect(area).toBeDefined();
      expect(area.id).toBeDefined();
      expect(area.name).toBe('Test AREA');
      expect(area.userId).toBe('test-user');
      expect(area.enabled).toBe(true);
      expect(area.createdAt).toBeInstanceOf(Date);
    });

    test('should get all AREAs', () => {
      InMemoryDB.createArea({
        userId: 'user1',
        name: 'AREA 1',
        enabled: true,
        action: { service: 'spotify', type: 'new_track_played', config: {} },
        reaction: { service: 'discord', type: 'send_message_to_channel', config: {} }
      });

      InMemoryDB.createArea({
        userId: 'user2',
        name: 'AREA 2',
        enabled: true,
        action: { service: 'github', type: 'new_issue_created', config: {} },
        reaction: { service: 'discord', type: 'send_dm', config: {} }
      });

      const areas = InMemoryDB.getAreas();
      expect(areas).toHaveLength(2);
    });

    test('should get AREAs by userId', () => {
      InMemoryDB.createArea({
        userId: 'user1',
        name: 'AREA 1',
        enabled: true,
        action: { service: 'spotify', type: 'new_track_played', config: {} },
        reaction: { service: 'discord', type: 'send_message_to_channel', config: {} }
      });

      InMemoryDB.createArea({
        userId: 'user2',
        name: 'AREA 2',
        enabled: true,
        action: { service: 'github', type: 'new_issue_created', config: {} },
        reaction: { service: 'discord', type: 'send_dm', config: {} }
      });

      const user1Areas = InMemoryDB.getAreas('user1');
      expect(user1Areas).toHaveLength(1);
      expect(user1Areas[0].userId).toBe('user1');
    });

    test('should get AREA by id', () => {
      const created = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Test AREA',
        enabled: true,
        action: { service: 'spotify', type: 'new_track_played', config: {} },
        reaction: { service: 'discord', type: 'send_message_to_channel', config: {} }
      });

      const found = InMemoryDB.getAreaById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test AREA');
    });

    test('should update AREA', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Original Name',
        enabled: true,
        action: { service: 'spotify', type: 'new_track_played', config: {} },
        reaction: { service: 'discord', type: 'send_message_to_channel', config: {} }
      });

      const updated = InMemoryDB.updateArea(area.id, {
        name: 'Updated Name',
        enabled: false
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.enabled).toBe(false);
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    test('should delete AREA', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Test AREA',
        enabled: true,
        action: { service: 'spotify', type: 'new_track_played', config: {} },
        reaction: { service: 'discord', type: 'send_message_to_channel', config: {} }
      });

      const deleted = InMemoryDB.deleteArea(area.id);
      expect(deleted).toBe(true);

      const found = InMemoryDB.getAreaById(area.id);
      expect(found).toBeUndefined();
    });

    test('should return false when deleting non-existent AREA', () => {
      const deleted = InMemoryDB.deleteArea('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Token Operations', () => {
    test('should save token', () => {
      const token = InMemoryDB.saveToken({
        userId: 'test-user',
        service: 'spotify',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000)
      });

      expect(token).toBeDefined();
      expect(token.userId).toBe('test-user');
      expect(token.service).toBe('spotify');
      expect(token.accessToken).toBe('access-token');
    });

    test('should get token', () => {
      InMemoryDB.saveToken({
        userId: 'test-user',
        service: 'spotify',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000)
      });

      const token = InMemoryDB.getToken('test-user', 'spotify');
      expect(token).toBeDefined();
      expect(token?.accessToken).toBe('access-token');
    });

    test('should replace existing token', () => {
      InMemoryDB.saveToken({
        userId: 'test-user',
        service: 'spotify',
        accessToken: 'old-token',
        refreshToken: 'old-refresh',
        expiresAt: new Date(Date.now() + 3600000)
      });

      InMemoryDB.saveToken({
        userId: 'test-user',
        service: 'spotify',
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        expiresAt: new Date(Date.now() + 7200000)
      });

      const token = InMemoryDB.getToken('test-user', 'spotify');
      expect(token?.accessToken).toBe('new-token');
    });

    test('should delete token', () => {
      InMemoryDB.saveToken({
        userId: 'test-user',
        service: 'spotify',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000)
      });

      const deleted = InMemoryDB.deleteToken('test-user', 'spotify');
      expect(deleted).toBe(true);

      const token = InMemoryDB.getToken('test-user', 'spotify');
      expect(token).toBeUndefined();
    });

    test('should return false when deleting non-existent token', () => {
      const deleted = InMemoryDB.deleteToken('test-user', 'non-existent');
      expect(deleted).toBe(false);
    });
  });
});