// web/src/components/areas/create/TimerActionConfig.tsx
import { Clock, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TimerActionConfigProps {
  type: string;
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
}

export default function TimerActionConfig({
  type,
  config,
  onConfigChange,
}: TimerActionConfigProps) {
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');

  // Update time when hour or minute changes
  useEffect(() => {
    if (type === 'every_day' || type === 'every_week') {
      onConfigChange({ ...config, time: `${selectedHour}:${selectedMinute}` });
    }
  }, [selectedHour, selectedMinute]);

  // ============================================
  // EVERY HOUR - No config needed
  // ============================================
  if (type === 'every_hour') {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Every Hour Configuration</h4>
        </div>
        
        <div className="p-4 bg-white border border-purple-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">⏰ Automatic Schedule</p>
              <p className="text-sm text-gray-600">
                This timer will trigger <strong>every hour at minute :00</strong>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Example: 09:00, 10:00, 11:00, 12:00...
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
          💡 No configuration needed! This timer runs automatically every hour.
        </div>
      </div>
    );
  }

  // ============================================
  // EVERY DAY - Time picker
  // ============================================
  if (type === 'every_day') {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Daily Timer Configuration</h4>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time of Day *
          </label>
          <div className="flex items-center space-x-3">
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 font-mono"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                );
              })}
            </select>
            <span className="text-2xl font-bold text-gray-400">:</span>
            <select
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 font-mono"
            >
              {['00', '15', '30', '45'].map((min) => (
                <option key={min} value={min}>
                  {min}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ⏰ Select the time when this timer should trigger every day
          </p>
        </div>

        <div className="bg-white border border-purple-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">📋 Schedule Preview:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Frequency:</strong> Every day</p>
            <p><strong>Time:</strong> {selectedHour}:{selectedMinute}</p>
            <p className="text-purple-700 font-medium mt-2">
              🔔 Will trigger daily at {selectedHour}:{selectedMinute}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // EVERY WEEK - Day + Time picker
  // ============================================
  if (type === 'every_week') {
    const days = [
      { value: '0', label: 'Sunday' },
      { value: '1', label: 'Monday' },
      { value: '2', label: 'Tuesday' },
      { value: '3', label: 'Wednesday' },
      { value: '4', label: 'Thursday' },
      { value: '5', label: 'Friday' },
      { value: '6', label: 'Saturday' },
    ];

    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Weekly Timer Configuration</h4>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Day of Week *
          </label>
          <select
            value={config.day || '1'}
            onChange={(e) => onConfigChange({ ...config, day: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
          >
            {days.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time *
          </label>
          <div className="flex items-center space-x-3">
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 font-mono"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                );
              })}
            </select>
            <span className="text-2xl font-bold text-gray-400">:</span>
            <select
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 font-mono"
            >
              {['00', '15', '30', '45'].map((min) => (
                <option key={min} value={min}>
                  {min}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-purple-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">📋 Schedule Preview:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Frequency:</strong> Every week</p>
            <p><strong>Day:</strong> {days.find(d => d.value === (config.day || '1'))?.label}</p>
            <p><strong>Time:</strong> {selectedHour}:{selectedMinute}</p>
            <p className="text-purple-700 font-medium mt-2">
              🔔 Will trigger every {days.find(d => d.value === (config.day || '1'))?.label} at {selectedHour}:{selectedMinute}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // INTERVAL - Minutes picker
  // ============================================
  if (type === 'interval') {
    const intervals = [
      { value: 5, label: 'Every 5 minutes' },
      { value: 15, label: 'Every 15 minutes' },
      { value: 30, label: 'Every 30 minutes' },
      { value: 60, label: 'Every hour' },
      { value: 120, label: 'Every 2 hours' },
      { value: 180, label: 'Every 3 hours' },
      { value: 360, label: 'Every 6 hours' },
      { value: 720, label: 'Every 12 hours' },
    ];

    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Interval Timer Configuration</h4>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interval *
          </label>
          <select
            value={config.intervalMinutes || 60}
            onChange={(e) => onConfigChange({ ...config, intervalMinutes: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
          >
            {intervals.map((interval) => (
              <option key={interval.value} value={interval.value}>
                {interval.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            ⏱️ Choose how often the timer should trigger
          </p>
        </div>

        <div className="bg-white border border-purple-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">📋 Schedule Preview:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Interval:</strong> {intervals.find(i => i.value === (config.intervalMinutes || 60))?.label}</p>
            <p className="text-purple-700 font-medium mt-2">
              🔔 Will trigger {intervals.find(i => i.value === (config.intervalMinutes || 60))?.label.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // SCHEDULED_TIME - Advanced cron
  // ============================================
  if (type === 'scheduled_time') {
    const examples = [
      { value: '0 9 * * *', label: 'Every day at 9:00 AM' },
      { value: '0 9 * * 1-5', label: 'Weekdays at 9:00 AM' },
      { value: '*/30 * * * *', label: 'Every 30 minutes' },
      { value: '0 9,14 * * *', label: 'Every day at 9:00 AM and 2:00 PM' },
      { value: '0 9 1 * *', label: 'First day of month at 9:00 AM' },
    ];

    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Custom Cron Schedule</h4>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cron Expression *
          </label>
          <input
            type="text"
            value={config.cronExpression || ''}
            onChange={(e) => onConfigChange({ ...config, cronExpression: e.target.value })}
            placeholder="0 9 * * *"
            className="w-full px-4 py-2 font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: minute hour day month weekday
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Examples
          </label>
          <div className="space-y-2">
            {examples.map((ex) => (
              <button
                key={ex.value}
                type="button"
                onClick={() => onConfigChange({ ...config, cronExpression: ex.value })}
                className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <code className="text-xs font-mono text-purple-700">{ex.value}</code>
                <p className="text-xs text-gray-600 mt-1">{ex.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-purple-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">📋 Configuration:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Cron:</strong> <code className="font-mono bg-gray-100 px-2 py-1 rounded">{config.cronExpression || 'Not set'}</code></p>
            <p><strong>Timezone:</strong> Europe/Paris (default)</p>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          💡 <strong>Cron format:</strong> minute (0-59) | hour (0-23) | day (1-31) | month (1-12) | weekday (0-6, 0=Sunday)
        </div>
      </div>
    );
  }

  // ============================================
  // DEFAULT
  // ============================================
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm text-gray-700">
        ℹ️ Timer configuration not available for this action type.
      </p>
    </div>
  );
}
