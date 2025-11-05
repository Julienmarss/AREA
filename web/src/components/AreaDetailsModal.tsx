// web/src/components/AreaDetailsModal.tsx
import { useState } from 'react';
import { X, Edit2, Save, Calendar, Zap, Settings } from 'lucide-react';
import { Area } from '../types';
import { areasAPI } from '../services/api';

interface AreaDetailsModalProps {
  area: Area;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function AreaDetailsModal({ area, isOpen, onClose, onUpdate }: AreaDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedArea, setEditedArea] = useState(area);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      await areasAPI.update(area.id, {
        name: editedArea.name,
        description: editedArea.description,
        action: editedArea.action,
        reaction: editedArea.reaction,
      });

      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update AREA');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedArea(area);
    setIsEditing(false);
    setError(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-auto z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Zap className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">AREA Details</h2>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  title="Edit AREA"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Name & Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedArea.name}
                    onChange={(e) => setEditedArea({ ...editedArea, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-900">{area.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editedArea.description || ''}
                    onChange={(e) => setEditedArea({ ...editedArea, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add a description..."
                  />
                ) : (
                  <p className="text-gray-600">{area.description || 'No description'}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-2">
                {area.enabled ? (
                  <span className="px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    ✓ Active
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                    ○ Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Action Configuration */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Settings className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Action (Trigger)</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Service:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                    {area.action.service}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <span className="text-sm text-gray-900 font-mono">{area.action.type}</span>
                </div>
                {Object.keys(area.action.config).length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700 block mb-2">Configuration:</span>
                    <div className="bg-white rounded border border-blue-200 p-3 space-y-1">
                      {Object.entries(area.action.config).map(([key, value]) => (
                        <div key={key} className="flex items-start space-x-2 text-sm">
                          <span className="font-medium text-gray-600 min-w-[100px]">{key}:</span>
                          <span className="text-gray-900 font-mono break-all">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reaction Configuration */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Reaction (Response)</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Service:</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                    {area.reaction.service}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <span className="text-sm text-gray-900 font-mono">{area.reaction.type}</span>
                </div>
                {Object.keys(area.reaction.config).length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700 block mb-2">Configuration:</span>
                    <div className="bg-white rounded border border-purple-200 p-3 space-y-1">
                      {Object.entries(area.reaction.config).map(([key, value]) => (
                        <div key={key} className="flex items-start space-x-2 text-sm">
                          <span className="font-medium text-gray-600 min-w-[100px]">{key}:</span>
                          <span className="text-gray-900 font-mono break-all">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-start space-x-2">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-sm text-gray-600">{formatDate(area.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Last Updated</p>
                  <p className="text-sm text-gray-600">{formatDate(area.updatedAt)}</p>
                </div>
              </div>
              {area.lastTriggered && (
                <div className="flex items-start space-x-2 md:col-span-2">
                  <Zap className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Last Triggered</p>
                    <p className="text-sm text-gray-600">{formatDate(area.lastTriggered)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
