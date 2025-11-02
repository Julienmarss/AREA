// Mock GitHubService before any imports to avoid Octokit ESM issues
jest.mock('../services/GitHubService', () => ({
  GitHubService: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockReturnValue({
      name: 'github',
      displayName: 'GitHub',
      authType: 'oauth2',
      baseUrl: 'https://api.github.com'
    }),
    getActions: jest.fn().mockReturnValue([]),
    getReactions: jest.fn().mockReturnValue([]),
    authenticate: jest.fn().mockResolvedValue(true),
    isAuthenticated: jest.fn().mockResolvedValue(false)
  }))
}));

import request from 'supertest';
import express from 'express';
import { InMemoryDB } from '../models/area.model';
import { userStorage } from '../storage/UserStorage';
import { generateToken } from '../utils/auth';

const setupTestApp = () => {
  const app = express();
  app.use(express.json());
  
  const areasRoutes = require('../routes/areas.routes').default;
  app.use('/api/v1', areasRoutes);
  
  return app;
};

describe('API Integration Tests', () => {
  let app: express.Application;
  let authToken: string;
  const testUserId = 'test-user-123';

  beforeAll(() => {
    app = setupTestApp();
    authToken = generateToken(testUserId);
  });

  beforeEach(() => {
    const areas = InMemoryDB.getAreas();
    areas.forEach(area => InMemoryDB.deleteArea(area.id));
    
    const users = userStorage.getAll();
    users.forEach(user => userStorage.delete(user.id));
  });

  describe('GET /api/v1/areas', () => {
    test('should return empty array when no areas exist', async () => {
      const response = await request(app)
        .get('/api/v1/areas')
        .query({ userId: testUserId });

      expect(response.status).toBe(200);
      expect(response.body.areas).toBeDefined();
      expect(Array.isArray(response.body.areas)).toBe(true);
      expect(response.body.areas).toHaveLength(0);
    });

    test('should return user areas', async () => {
      InMemoryDB.createArea({
        userId: testUserId,
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

      const response = await request(app)
        .get('/api/v1/areas')
        .query({ userId: testUserId });

      expect(response.status).toBe(200);
      expect(response.body.areas).toHaveLength(1);
      expect(response.body.areas[0].name).toBe('Test AREA');
    });

    test('should filter areas by userId', async () => {
      InMemoryDB.createArea({
        userId: 'user1',
        name: 'User 1 AREA',
        enabled: true,
        action: { service: 'spotify', type: 'new_track_played', config: {} },
        reaction: { service: 'discord', type: 'send_message_to_channel', config: {} }
      });

      InMemoryDB.createArea({
        userId: 'user2',
        name: 'User 2 AREA',
        enabled: true,
        action: { service: 'github', type: 'new_issue_created', config: {} },
        reaction: { service: 'discord', type: 'send_dm', config: {} }
      });

      const response = await request(app)
        .get('/api/v1/areas')
        .query({ userId: 'user1' });

      expect(response.status).toBe(200);
      expect(response.body.areas).toHaveLength(1);
      expect(response.body.areas[0].userId).toBe('user1');
    });
  });

  describe('POST /api/v1/areas', () => {
    test('should create new AREA', async () => {
      const newArea = {
        userId: testUserId,
        name: 'New Test AREA',
        action: {
          service: 'spotify',
          type: 'new_track_played',
          config: {}
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: { channelId: '123456' }
        },
        enabled: true
      };

      const response = await request(app)
        .post('/api/v1/areas')
        .send(newArea);

      expect(response.status).toBe(201);
      expect(response.body.area).toBeDefined();
      expect(response.body.area.name).toBe('New Test AREA');
      expect(response.body.area.id).toBeDefined();
    });

    test('should return 400 when missing required fields', async () => {
      const invalidArea = {
        userId: testUserId,
        name: 'Incomplete AREA'
      };

      const response = await request(app)
        .post('/api/v1/areas')
        .send(invalidArea);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should return 400 when action is invalid', async () => {
      const invalidArea = {
        userId: testUserId,
        name: 'Invalid Action AREA',
        action: {
          service: 'spotify'
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {}
        }
      };

      const response = await request(app)
        .post('/api/v1/areas')
        .send(invalidArea);

      expect(response.status).toBe(400);
    });

    test('should return 400 when reaction is invalid', async () => {
      const invalidArea = {
        userId: testUserId,
        name: 'Invalid Reaction AREA',
        action: {
          service: 'spotify',
          type: 'new_track_played',
          config: {}
        },
        reaction: {
          service: 'discord'
        }
      };

      const response = await request(app)
        .post('/api/v1/areas')
        .send(invalidArea);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/areas/:id', () => {
    test('should get AREA by id', async () => {
      const area = InMemoryDB.createArea({
        userId: testUserId,
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
          config: {}
        }
      });

      const response = await request(app)
        .get(`/api/v1/areas/${area.id}`);

      expect(response.status).toBe(200);
      expect(response.body.area).toBeDefined();
      expect(response.body.area.id).toBe(area.id);
      expect(response.body.area.name).toBe('Test AREA');
    });

    test('should return 404 for non-existent AREA', async () => {
      const response = await request(app)
        .get('/api/v1/areas/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('AREA not found');
    });
  });

  describe('PUT /api/v1/areas/:id', () => {
    test('should update AREA', async () => {
      const area = InMemoryDB.createArea({
        userId: testUserId,
        name: 'Original Name',
        enabled: true,
        action: {
          service: 'spotify',
          type: 'new_track_played',
          config: {}
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {}
        }
      });

      const response = await request(app)
        .put(`/api/v1/areas/${area.id}`)
        .send({
          name: 'Updated Name',
          enabled: false
        });

      expect(response.status).toBe(200);
      expect(response.body.area.name).toBe('Updated Name');
      expect(response.body.area.enabled).toBe(false);
    });

    test('should return 404 for non-existent AREA', async () => {
      const response = await request(app)
        .put('/api/v1/areas/non-existent-id')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/areas/:id', () => {
    test('should delete AREA', async () => {
      const area = InMemoryDB.createArea({
        userId: testUserId,
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
          config: {}
        }
      });

      const response = await request(app)
        .delete(`/api/v1/areas/${area.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedArea = InMemoryDB.getAreaById(area.id);
      expect(deletedArea).toBeUndefined();
    });

    test('should return 404 for non-existent AREA', async () => {
      const response = await request(app)
        .delete('/api/v1/areas/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/areas/:id/toggle', () => {
    test('should toggle AREA enabled state', async () => {
      const area = InMemoryDB.createArea({
        userId: testUserId,
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
          config: {}
        }
      });

      const response = await request(app)
        .post(`/api/v1/areas/${area.id}/toggle`);

      expect(response.status).toBe(200);
      expect(response.body.area.enabled).toBe(false);

      const response2 = await request(app)
        .post(`/api/v1/areas/${area.id}/toggle`);

      expect(response2.status).toBe(200);
      expect(response2.body.area.enabled).toBe(true);
    });

    test('should return 404 for non-existent AREA', async () => {
      const response = await request(app)
        .post('/api/v1/areas/non-existent-id/toggle');

      expect(response.status).toBe(404);
    });
  });
});