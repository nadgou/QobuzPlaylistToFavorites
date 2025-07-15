interface ImportStats {
  totalTracks: number;
  successfulTracks: number;
  failedTracks: number;
  duration: number; // in seconds
  playlistCount: number;
  isDeleteOperation?: boolean;
}

interface CompletionStatsProps {
  stats: ImportStats;
  onBackToBrowser: () => void;
}

export default function CompletionStats({ stats, onBackToBrowser }: CompletionStatsProps) {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const successRate = stats.totalTracks > 0 ? Math.round((stats.successfulTracks / stats.totalTracks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
              {stats.isDeleteOperation ? 'Delete Complete!' : 'Import Complete!'}
            </h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              {stats.isDeleteOperation 
                ? 'Your favorites have been cleared successfully'
                : `Your playlist${stats.playlistCount !== 1 ? 's have' : ' has'} been processed successfully`
              }
            </p>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center shadow-lg border border-blue-200">
              <div className="text-4xl font-bold text-blue-600">{stats.totalTracks}</div>
              <div className="text-sm text-blue-800 mt-2 font-medium">Total Tracks</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center shadow-lg border border-green-200">
              <div className="text-4xl font-bold text-green-600">{stats.successfulTracks}</div>
              <div className="text-sm text-green-800 mt-2 font-medium">
                {stats.isDeleteOperation ? 'Removed from Favorites' : 'Added to Favorites'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 text-center shadow-lg border border-red-200">
              <div className="text-4xl font-bold text-red-600">{stats.failedTracks}</div>
              <div className="text-sm text-red-800 mt-2 font-medium">Failed/Skipped</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center shadow-lg border border-purple-200">
              <div className="text-4xl font-bold text-purple-600">{formatDuration(stats.duration)}</div>
              <div className="text-sm text-purple-800 mt-2 font-medium">Total Time</div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-700 mb-3 font-medium">
              <span>Success Rate</span>
              <span className="text-lg font-bold text-green-600">{successRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 shadow-inner">
              <div 
                className="h-6 rounded-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-lg transition-all duration-1000 ease-out"
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-8 shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Summary
            </h3>
            <div className="space-y-3 text-gray-700">
              {!stats.isDeleteOperation && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Processed <strong>{stats.playlistCount}</strong> playlist{stats.playlistCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Successfully {stats.isDeleteOperation ? 'removed' : 'added'} <strong>{stats.successfulTracks}</strong> tracks {stats.isDeleteOperation ? 'from' : 'to'} your favorites</span>
              </div>
              {stats.failedTracks > 0 && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span><strong>{stats.failedTracks}</strong> tracks were skipped {stats.isDeleteOperation ? '(could not be removed)' : '(likely already in favorites)'}</span>
                </div>
              )}
              <div className="flex items-center">
                <svg className="w-4 h-4 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Completed in <strong>{formatDuration(stats.duration)}</strong></span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={onBackToBrowser}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium transition-all duration-200 shadow-lg flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse More Playlists
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}