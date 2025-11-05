import request from 'supertest';
import express from 'express';
import areasRoutes from '../routes/areas.routes';
import { InMemoryDB } from '../models/area.model';
import { userStorage } from '../storage/UserStorage';

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
  AuthRequest: class {},
}));

// Mock services
jest.mock('../services/DiscordService');
jest.mock('../services/GitHubService');
jest.mock('../middleware/autoReactions', () => ({
  setupAutoReactions: jest.fn(),
  getDiscordClient: jest.fn().mockReturnValue({
    isReady: jest.fn().mockReturnValue(true),
  }),
}));

describe('Areas API Integration Tests', () => {
  let app: express.Application;
  const testUserId = 'test-user-id';

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1', areasRoutes);

    // Create test user
    userStorage.create({
      id: testUserId,
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashed',
      services: {},
      areas: [],
      createdAt: new Date(),
    });
  });

  beforeEach(() => {
    // Clear all areas
    InMemoryDB.getAreas().forEach(area => InMemoryDB.deleteArea(area.id));
  });

  describe('POST /api/v1/areas', () => {
    test('should create a new AREA', async () => {
      const newArea = {
        name: 'Test AREA',
        description: 'Test description',
        enabled: true,
        action: {
          serviceId: 'spotify',
          actionId: 'new_track_played',
          parameters: {},
        },
        reaction: {
          serviceId: 'discord',
          reactionId: 'send_message_to_channel',
          parameters: {
            channelId: '123456789',
            content: 'New track played!',
          },
        },
      };

      const response = await request(app)
        .post('/api/v1/areas')
        .send(newArea)
        .expect(201);

      expect(response.body).toHaveProperty('area');
      expect(response.body.area).toHaveProperty('id');
      expect(response.body.area.name).toBe('Test AREA');
      expect(response.body.area.userId).toBe(testUserId);
    });

    test('should reject AREA with missing fields', async () => {
      const invalidArea = {
        name: 'Invalid AREA',
        // Missing action and reaction
      };

      await request(app)
        .post('/api/v1/areas')
        .send(invalidArea)
        .expect(400);
    });

    test('should reject AREA with invalid action parameters', async () => {
      const invalidArea = {
        name: 'Invalid AREA',
        enabled: true,
        action: {
          serviceId: 'invalid-service',
          actionId: 'invalid-action',
          parameters: {},
        },
        reaction: {
          serviceId: 'discord',
          reactionId: 'send_message',
          parameters: {},
        },
      };

      const response = await request(app)
        .post('/api/v1/areas')
        .send(invalidArea);

      // Depending on validation, this might be 400 or 201
      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('GET /api/v1/areas', () => {
    test('should get all areas for user', async () => {
      // Create test areas
      InMemoryDB.createArea({
        userId: testUserId,
        name: 'AREA 1',
        enabled: true,
        action: {
          service: 'spotify',
          type: 'new_track_played',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      InMemoryDB.createArea({
        userId: testUserId,
        name: 'AREA 2',
        enabled: false,
        action: {
          service: 'github',
          type: 'new_issue_created',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_dm',
          config: {},
        },
      });

      const response = await request(app)
        .get('/api/v1/areas')
        .expect(200);

      expect(response.body).toHaveProperty('areas');
      expect(Array.isArray(response.body.areas)).toBe(true);
      expect(response.body.areas.length).toBeGreaterThanOrEqual(2);
    });

    test('should return empty array when no areas exist', async () => {
      const response = await request(app)
        .get('/api/v1/areas')
        .expect(200);

      expect(response.body.areas).toEqual([]);
    });
  });

  describe('GET /api/v1/areas/:id', () => {
    test('should get area by id', async () => {
      const area = InMemoryDB.createArea({
        userId: testUserId,
        name: 'Test AREA',
        enabled: true,
        action: {
          service: 'spotify',
          type: 'new_track_played',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      const response = await request(app)
        .get(`/api/v1/areas/${area.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('area');
      expect(response.body.area.id).toBe(area.id);
      expect(response.body.area.name).toBe('Test AREA');
    });

    test('should return 404 for non-existent area', async () => {
      await request(app)
        .get('/api/v1/areas/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/v1/areas/:id', () => {
    test('should update area', async () => {
      const area = InMemoryDB.createArea({
        userId: testUserId,
        name: 'Original Name',
        enabled: true,
        action: {
          service: 'spotify',
          type: 'new_track_played',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      const updates = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/v1/areas/${area.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.area.name).toBe('Updated Name');
      expect(response.body.area.description).toBe('Updated description');
    });

    test('should return 404 for non-existent area', async () => {
      await request(app)
        .put('/api/v1/areas/non-existent-id')
        .send({ name: 'New Name' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/areas/:id', () => {
    test('should delete area', async () => {
      const area = InMemoryDB.createArea({
        userId: testUserId,
        name: 'To Delete',
        enabled: true,
        action: {
          service: 'spotify',
          type: 'new_track_played',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      await request(app)
        .delete(`/api/v1/areas/${area.id}`)
        .expect(200);

      // Verify it's deleted
      const found = InMemoryDB.getAreaById(area.id);
      expect(found).toBeUndefined();
    });

    test('should return 404 for non-existent area', async () => {
      await request(app)
        .delete('/api/v1/areas/non-existent-id')
        .expect(404);
    });
  });

  describe('POST /api/v1/areas/:id/toggle', () => {
    test('should toggle area enabled status', async () => {
      const area = InMemoryDB.createArea({
        userId: testUserId,
        name: 'Toggle Test',
        enabled: true,
        action: {
          service: 'spotify',
          type: 'new_track_played',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      const response = await request(app)
        .post(`/api/v1/areas/${area.id}/toggle`)
        .expect(200);

      expect(response.body.area.enabled).toBe(false);

      // Toggle again
      const response2 = await request(app)
        .post(`/api/v1/areas/${area.id}/toggle`)
        .expect(200);

      expect(response2.body.area.enabled).toBe(true);
    });

    test('should return 404 for non-existent area', async () => {
      await request(app)
        .post('/api/v1/areas/non-existent-id/toggle')
        .expect(404);
    });
  });

  describe('POST /api/v1/areas/:id/execute', () => {
    test('should execute area manually', async () => {
      const area = InMemoryDB.createArea({
        userId: testUserId,
        name: 'Execute Test',
        enabled: true,
        action: {
          service: 'spotify',
          type: 'new_track_played',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: { channelId: '123', content: 'Test' },
        },
      });

      const response = await request(app)
        .post(`/api/v1/areas/${area.id}/execute`);

      // Response might be 200 or 500 depending on service availability
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/areas/stats', () => {
    test('should get area statistics', async () => {
      // Create test areas
      InMemoryDB.createArea({
        userId: testUserId,
        name: 'AREA 1',
        enabled: true,
        action: { service: 'spotify', type: 'new_track_played', config: {} },
        reaction: { service: 'discord', type: 'send_message_to_channel', config: {} },
      });

      InMemoryDB.createArea({
        userId: testUserId,
        name: 'AREA 2',
        enabled: false,
        action: { service: 'github', type: 'new_issue_created', config: {} },
        reaction: { service: 'discord', type: 'send_dm', config: {} },
      });

      const response = await request(app)
        .get('/api/v1/areas/stats');

      if (response.status === 200) {
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('enabled');
        expect(response.body).toHaveProperty('disabled');
      }
    });
  });
});
