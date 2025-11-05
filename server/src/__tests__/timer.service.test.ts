import { TimerService } from '../services/TimerService';
import { InMemoryDB } from '../models/area.model';

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({
    stop: jest.fn(),
  }),
  validate: jest.fn((expression: string) => {
    // Simple validation mock
    const parts = expression.split(' ');
    return parts.length === 5 || parts.length === 6;
  }),
}));

describe('TimerService', () => {
  beforeEach(() => {
    // Clear database
    InMemoryDB.getAreas().forEach(area => InMemoryDB.deleteArea(area.id));
    // Stop all existing timer jobs
    TimerService.stopAll();
  });

  afterEach(() => {
    TimerService.stopAll();
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('should start service without errors', () => {
      expect(() => TimerService.start()).not.toThrow();
    });

    test('should load existing timer AREAs on start', () => {
      // Create a timer AREA
      InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Test Timer AREA',
        enabled: true,
        action: {
          service: 'timer',
          type: 'every_hour',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: { channelId: '123', content: 'Timer triggered' },
        },
      });

      expect(() => TimerService.start()).not.toThrow();
    });

    test('should stop all jobs on stopAll', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Test Timer',
        enabled: true,
        action: {
          service: 'timer',
          type: 'every_hour',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      TimerService.scheduleArea(area);
      expect(() => TimerService.stopAll()).not.toThrow();
      
      const jobs = TimerService.getAllJobs();
      expect(jobs).toHaveLength(0);
    });
  });

  describe('Cron Expression Generation', () => {
    test('should handle every_hour action', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Hourly Timer',
        enabled: true,
        action: {
          service: 'timer',
          type: 'every_hour',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      expect(() => TimerService.scheduleArea(area)).not.toThrow();
    });

    test('should handle every_day action', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Daily Timer',
        enabled: true,
        action: {
          service: 'timer',
          type: 'every_day',
          config: { time: '09:00' },
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      expect(() => TimerService.scheduleArea(area)).not.toThrow();
    });

    test('should handle every_week action', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Weekly Timer',
        enabled: true,
        action: {
          service: 'timer',
          type: 'every_week',
          config: { time: '09:00', day: '1' },
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      expect(() => TimerService.scheduleArea(area)).not.toThrow();
    });

    test('should handle interval action with minutes', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Interval Timer',
        enabled: true,
        action: {
          service: 'timer',
          type: 'interval',
          config: { intervalMinutes: 30 },
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      expect(() => TimerService.scheduleArea(area)).not.toThrow();
    });

    test('should handle interval action with hours', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Interval Timer Hours',
        enabled: true,
        action: {
          service: 'timer',
          type: 'interval',
          config: { intervalMinutes: 120 }, // 2 hours
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      expect(() => TimerService.scheduleArea(area)).not.toThrow();
    });

    test('should handle scheduled_time action with custom cron', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Custom Schedule',
        enabled: true,
        action: {
          service: 'timer',
          type: 'scheduled_time',
          config: { cronExpression: '0 9 * * 1-5' }, // Weekdays at 9 AM
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      expect(() => TimerService.scheduleArea(area)).not.toThrow();
    });

    test('should handle timezone configuration', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Timer with Timezone',
        enabled: true,
        action: {
          service: 'timer',
          type: 'every_day',
          config: { time: '09:00', timezone: 'America/New_York' },
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      expect(() => TimerService.scheduleArea(area)).not.toThrow();
    });
  });

  describe('Job Management', () => {
    test('should cancel area job', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Test Timer',
        enabled: true,
        action: {
          service: 'timer',
          type: 'every_hour',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      TimerService.scheduleArea(area);
      expect(() => TimerService.cancelAreaJob(area.id)).not.toThrow();
    });

    test('should update area job', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Test Timer',
        enabled: true,
        action: {
          service: 'timer',
          type: 'every_hour',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      TimerService.scheduleArea(area);
      
      const updated = InMemoryDB.updateArea(area.id, {
        action: {
          service: 'timer',
          type: 'every_day',
          config: { time: '10:00' },
        },
      });

      if (updated) {
        expect(() => TimerService.updateAreaJob(updated)).not.toThrow();
      }
    });

    test('should get user jobs', () => {
      const area1 = InMemoryDB.createArea({
        userId: 'user1',
        name: 'User 1 Timer',
        enabled: true,
        action: {
          service: 'timer',
          type: 'every_hour',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      const area2 = InMemoryDB.createArea({
        userId: 'user2',
        name: 'User 2 Timer',
        enabled: true,
        action: {
          service: 'timer',
          type: 'every_hour',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      TimerService.scheduleArea(area1);
      TimerService.scheduleArea(area2);

      const user1Jobs = TimerService.getUserJobs('user1');
      expect(user1Jobs.length).toBeGreaterThan(0);
      expect(user1Jobs.every(job => job.userId === 'user1')).toBe(true);
    });

    test('should get all jobs', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Test Timer',
        enabled: true,
        action: {
          service: 'timer',
          type: 'every_hour',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      TimerService.scheduleArea(area);
      const allJobs = TimerService.getAllJobs();
      
      expect(Array.isArray(allJobs)).toBe(true);
    });
  });

  describe('Cron Validation', () => {
    test('should validate correct cron expressions', () => {
      expect(TimerService.validateCronExpression('0 * * * *')).toBe(true);
      expect(TimerService.validateCronExpression('0 9 * * *')).toBe(true);
      expect(TimerService.validateCronExpression('*/5 * * * *')).toBe(true);
    });

    test('should invalidate incorrect cron expressions', () => {
      expect(TimerService.validateCronExpression('invalid')).toBe(false);
      expect(TimerService.validateCronExpression('* * *')).toBe(false);
    });

    test('should provide cron examples', () => {
      const examples = TimerService.getCronExamples();
      
      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      
      examples.forEach(example => {
        expect(example).toHaveProperty('description');
        expect(example).toHaveProperty('expression');
        expect(typeof example.description).toBe('string');
        expect(typeof example.expression).toBe('string');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown action types', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Unknown Timer',
        enabled: true,
        action: {
          service: 'timer',
          type: 'unknown_type',
          config: {},
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      // Should not throw, but should warn
      expect(() => TimerService.scheduleArea(area)).not.toThrow();
    });

    test('should handle invalid cron expressions', () => {
      const area = InMemoryDB.createArea({
        userId: 'test-user',
        name: 'Invalid Cron',
        enabled: true,
        action: {
          service: 'timer',
          type: 'scheduled_time',
          config: { cronExpression: 'invalid cron' },
        },
        reaction: {
          service: 'discord',
          type: 'send_message_to_channel',
          config: {},
        },
      });

      // Should not throw, but should not schedule
      expect(() => TimerService.scheduleArea(area)).not.toThrow();
    });

    test('should handle canceling non-existent job', () => {
      expect(() => TimerService.cancelAreaJob('non-existent-id')).not.toThrow();
    });
  });
});
