import { useState, useEffect } from 'react';
import { SignalRService } from '../services/signalr';
import { favoritesService } from '../services/api';
import type { ImportProgressUpdate } from '../types';

interface ProgressTrackerProps {
  playlistIds: string[];
  onComplete: (finalProgress: ImportProgressUpdate) => void;
  onCancel: () => void;
  isDeleteOperation?: boolean;
  isFilteredDelete?: boolean;
  filterQuery?: string;
  onConnectionIdChange?: (connectionId: string) => void;
}

export default function ProgressTracker({ playlistIds, onComplete, onCancel, isDeleteOperation = false, isFilteredDelete = false, filterQuery, onConnectionIdChange }: ProgressTrackerProps) {
  const [progress, setProgress] = useState<ImportProgressUpdate>({
    totalTracks: 0,
    processedTracks: 0,
    successfulTracks: 0,
    failedTracks: 0,
    currentStatus: 'Initializing...',
    isCompleted: false
  });
  const [signalRService] = useState(new SignalRService());
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const startImport = async () => {
      try {
        // Connect to SignalR
        const connectionId = await signalRService.connect();
        if (!connectionId) {
          setConnectionError('Failed to establish real-time connection');
          setIsConnecting(false);
          return;
        }
        
        // Clear any connection error since we're connected
        setConnectionError(null);

        console.log('Using SignalR connection ID:', connectionId);
        setIsConnecting(false);
        
        // Share connection ID with parent component
        if (onConnectionIdChange) {
          onConnectionIdChange(connectionId);
        }

        // Listen for progress updates
        signalRService.onProgressUpdate((update: ImportProgressUpdate) => {
          console.log('Received progress update:', update);
          setProgress(update);
          if (update.isCompleted) {
            // Small delay to show final status
            setTimeout(() => {
              onComplete(update);
            }, 2000);
          }
        });

        // Start the import or delete process
        if (isDeleteOperation) {
          if (isFilteredDelete) {
            console.log('Starting filtered delete with connection ID:', connectionId, 'and query:', filterQuery);
            await favoritesService.deleteFilteredFavorites(connectionId, filterQuery);
          } else {
            console.log('Starting delete all favorites with connection ID:', connectionId);
            await favoritesService.deleteAllFavorites(connectionId);
          }
        } else {
          console.log('Starting import with connection ID:', connectionId);
          await favoritesService.importPlaylists(playlistIds, connectionId);
        }
        
      } catch (error) {
        setConnectionError(`Failed to start ${isDeleteOperation ? (isFilteredDelete ? 'filtered delete' : 'delete') : 'import'} process`);
        setIsConnecting(false);
      }
    };

    startImport();

    // Cleanup on unmount
    return () => {
      signalRService.disconnect();
    };
  }, [playlistIds, onComplete, signalRService]);

  const getProgressPercentage = () => {
    if (progress.totalTracks === 0) return 0;
    return Math.round((progress.processedTracks / progress.totalTracks) * 100);
  };

  const getEstimatedTimeRemaining = () => {
    if (progress.totalTracks === 0 || progress.processedTracks === 0) return null;
    
    const tracksRemaining = progress.totalTracks - progress.processedTracks;
    const averageTimePerTrack = 1.5; // Rough estimate: 1.5 seconds per track
    const secondsRemaining = tracksRemaining * averageTimePerTrack;
    
    if (secondsRemaining < 60) {
      return `${Math.round(secondsRemaining)}s`;
    } else {
      const minutes = Math.round(secondsRemaining / 60);
      return `${minutes}m`;
    }
  };

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-6">{connectionError}</p>
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {progress.isCompleted ? 
                (isDeleteOperation ? 'Delete Complete!' : 'Import Complete!') : 
                (isDeleteOperation ? 'Deleting Favorites' : 'Importing Playlists')
              }
            </h1>
            <p className="text-gray-600">
              {progress.isCompleted 
                ? (isDeleteOperation ? 'Your favorites have been deleted' : 'Your playlists have been processed')
                : (isDeleteOperation ? 'Removing all tracks from your favorites' : `Processing ${playlistIds.length} playlist${playlistIds.length !== 1 ? 's' : ''}`)
              }
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  progress.isCompleted ? 'bg-green-500' : (isDeleteOperation ? 'bg-red-500' : 'bg-blue-500')
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              {!progress.isCompleted && !isConnecting && (
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mr-3 ${isDeleteOperation ? 'border-red-500' : 'border-blue-500'}`}></div>
              )}
              {progress.isCompleted && (
                <div className="text-green-500 mr-3">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <span className="text-lg font-medium text-gray-900">
                {isConnecting ? 'Connecting...' : progress.currentStatus}
              </span>
            </div>
          </div>

          {/* Statistics */}
          {progress.totalTracks > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{progress.totalTracks}</div>
                <div className="text-sm text-blue-800">Total Tracks</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{progress.successfulTracks}</div>
                <div className="text-sm text-green-800">Success</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{progress.failedTracks}</div>
                <div className="text-sm text-red-800">Failed</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {getEstimatedTimeRemaining() || '--'}
                </div>
                <div className="text-sm text-gray-800">Est. Time</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {progress.errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{progress.errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            {progress.isCompleted ? (
              <button
                onClick={() => onComplete(progress)}
                className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={onCancel}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Success Summary */}
          {progress.isCompleted && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="text-center">
                <p className="text-green-800 font-medium">
                  {isDeleteOperation 
                    ? `Successfully removed ${progress.successfulTracks} tracks from your favorites!`
                    : `Successfully added ${progress.successfulTracks} tracks to your favorites!`
                  }
                </p>
                {progress.failedTracks > 0 && (
                  <p className="text-yellow-700 text-sm mt-1">
                    {isDeleteOperation
                      ? `${progress.failedTracks} tracks could not be removed`
                      : `${progress.failedTracks} tracks could not be added (they may already be in your favorites)`
                    }
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}