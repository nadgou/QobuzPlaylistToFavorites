import React, { useState, useEffect, useCallback } from 'react';
import { favoritesService } from '../services/api';
import type { TrackSummary } from '../types';

interface FilteredFavoritesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOperation: (type: 'delete-filtered', query: string) => void;
}

export const FilteredFavoritesManager: React.FC<FilteredFavoritesManagerProps> = ({
  isOpen,
  onClose,
  onStartOperation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [preview, setPreview] = useState<{ totalCount: number; sampleTracks: TrackSummary[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setPreview(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const result = await favoritesService.previewFilteredFavorites(query);
        setPreview(result);
      } catch (err) {
        setError('Failed to search favorites');
        setPreview(null);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setPreview(null);
    }
  }, [searchQuery, debouncedSearch]);

  const handleDelete = async () => {
    if (!preview || preview.totalCount === 0) return;

    try {
      // Let the ProgressTracker handle the SignalR connection and API call
      onStartOperation('delete-filtered', searchQuery);
      onClose();
    } catch (err) {
      setError('Failed to start deletion process');
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setPreview(null);
    setError(null);
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Filter & Delete Favorites</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search your favorites
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by artist, track, or album name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Search across artist names, track titles, and album names
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Searching...</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Preview Results */}
            {preview && !isLoading && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Found {preview.totalCount} matching track{preview.totalCount !== 1 ? 's' : ''}
                </h3>
                
                {preview.totalCount > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-3">Sample tracks:</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {preview.sampleTracks.map((track, index) => (
                        <div key={index} className="bg-white p-2 rounded border text-sm">
                          <div className="font-medium text-gray-800">{track.title}</div>
                          <div className="text-gray-600">{track.artist}</div>
                          {track.album && (
                            <div className="text-gray-500 text-xs">{track.album}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    {preview.totalCount > preview.sampleTracks.length && (
                      <p className="text-sm text-gray-500 mt-2">
                        ... and {preview.totalCount - preview.sampleTracks.length} more tracks
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">No tracks found matching your search.</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              
              {preview && preview.totalCount > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Delete {preview.totalCount} Track{preview.totalCount !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-red-600 mb-4">⚠️ Confirm Deletion</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{preview.totalCount} track{preview.totalCount !== 1 ? 's' : ''}</strong> from your favorites?
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Search term: "{searchQuery}"
              </p>
              <p className="text-sm text-red-600 mb-6">
                This action cannot be undone.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Delete {preview.totalCount} Track{preview.totalCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}