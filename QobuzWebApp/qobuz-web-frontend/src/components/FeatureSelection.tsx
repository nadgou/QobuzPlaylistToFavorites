import React from 'react';

interface FeatureSelectionProps {
  onSelectFeature: (feature: 'playlist-to-favorites' | 'cleanup-favorites') => void;
  onLogout: () => void;
}

const FeatureSelection: React.FC<FeatureSelectionProps> = ({ onSelectFeature, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Qobuz Helper</h1>
          <p className="text-gray-600">What would you like to do?</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onSelectFeature('playlist-to-favorites')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            <div className="text-left">
              <div className="text-lg font-bold">Move Playlists to Favorites</div>
              <div className="text-blue-100 text-sm mt-1">
                Search for playlists and add their tracks to your favorites
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectFeature('cleanup-favorites')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            <div className="text-left">
              <div className="text-lg font-bold">Clean Up My Favorites</div>
              <div className="text-red-100 text-sm mt-1">
                Delete all favorites or filter and delete specific tracks
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onLogout}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureSelection;