import { useState } from 'react';
import { playlistService, favoritesService } from '../services/api';
import type { PlaylistSummary, TrackSummary } from '../types';
import { FilteredFavoritesManager } from './FilteredFavoritesManager';

interface PlaylistBrowserProps {
  selectedFeature: 'playlist-to-favorites' | 'cleanup-favorites' | null;
  onStartImport: (selectedPlaylists: string[]) => void;
  onStartDeleteAll: () => void;
  onStartFilteredDelete: (query: string) => void;
  onBackToFeatureSelection: () => void;
  onLogout: () => void;
}

export default function PlaylistBrowser({ selectedFeature, onStartImport, onStartDeleteAll, onStartFilteredDelete, onBackToFeatureSelection, onLogout }: PlaylistBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentFavorites, setCurrentFavorites] = useState<TrackSummary[] | null>(null);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilteredManager, setShowFilteredManager] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await playlistService.searchPlaylists(searchTerm, 20, true);
      setPlaylists(results);
      if (results.length === 0) {
        setError('No playlists found. Try a different search term.');
      }
    } catch (err) {
      setError('Failed to search playlists. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlaylistSelection = (playlistId: string) => {
    const newSelected = new Set(selectedPlaylists);
    if (newSelected.has(playlistId)) {
      newSelected.delete(playlistId);
    } else {
      newSelected.add(playlistId);
    }
    setSelectedPlaylists(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPlaylists.size === playlists.length) {
      setSelectedPlaylists(new Set());
    } else {
      setSelectedPlaylists(new Set(playlists.map(p => p.id)));
    }
  };

  const handleImport = () => {
    onStartImport(Array.from(selectedPlaylists));
  };

  const loadCurrentFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const favorites = await favoritesService.getCurrentFavorites();
      setCurrentFavorites(favorites);
    } catch (error) {
      setCurrentFavorites(null);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleDeleteAllClick = () => {
    setShowDeleteConfirm(true);
    loadCurrentFavorites();
  };

  const confirmDeleteAll = () => {
    setShowDeleteConfirm(false);
    onStartDeleteAll();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-white/20">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete All Favorites
            </h3>
            {favoritesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading current favorites...</p>
              </div>
            ) : currentFavorites ? (
              <div>
                <p className="text-gray-600 mb-4">
                  You currently have <strong>{currentFavorites.length} tracks</strong> in your favorites.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-red-800 text-sm">
                    ⚠️ This action cannot be undone. All your favorite tracks will be permanently removed from your Qobuz account.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteAll}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete All {currentFavorites.length} Favorites
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">Failed to load favorites. Please try again.</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={loadCurrentFavorites}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToFeatureSelection}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
                title="Back to feature selection"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                {selectedFeature === 'playlist-to-favorites' ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {selectedFeature === 'playlist-to-favorites' ? 'Playlist to Favorites' : 'Clean Up Favorites'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedFeature === 'playlist-to-favorites' 
                    ? 'Transfer playlists to your favorites collection'
                    : 'Delete tracks from your favorites collection'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedFeature === 'cleanup-favorites' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilteredManager(true)}
                    className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-xl text-sm font-medium border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter & Delete
                  </button>
                  <button
                    onClick={handleDeleteAllClick}
                    className="text-red-600 hover:text-red-700 px-4 py-2 rounded-xl text-sm font-medium border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete All
                  </button>
                </div>
              )}
              {selectedFeature === 'cleanup-favorites' && <div className="h-8 border-l border-gray-300"></div>}
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-all duration-200"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* How it works section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-purple-100 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">How it works</h2>
              {selectedFeature === 'playlist-to-favorites' ? (
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-xs">1</span>
                    </div>
                    <span className="text-gray-700">Search for playlists by genre, artist, or name</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">2</span>
                    </div>
                    <span className="text-gray-700">Select playlists you want to transfer</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-xs">3</span>
                    </div>
                    <span className="text-gray-700">All tracks automatically added to favorites</span>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-semibold text-xs">1</span>
                    </div>
                    <span className="text-gray-700">Choose "Delete All" to remove all favorites</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">2</span>
                    </div>
                    <span className="text-gray-700">Or use "Filter & Delete" to remove specific tracks</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Search Section - Only for playlist-to-favorites */}
        {selectedFeature === 'playlist-to-favorites' && (
          <>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center">
                  <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Playlists
                </h2>
                <p className="text-gray-600 mb-4">Search for playlists to add their tracks to your favorites. Your own playlists will appear first in results.</p>
              </div>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search for playlists
                  </label>
                  <div className="flex gap-3">
                    <input
                      id="search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                      placeholder="Try 'jazz', 'rock', 'classical', or artist names..."
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !searchTerm.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 font-medium"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Search
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Search
                        </div>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Search suggestions */}
                {!hasSearched && !isLoading && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-3">Popular searches:</p>
                    <div className="flex flex-wrap gap-2">
                      {['jazz', 'rock', 'classical', 'pop', 'blues', 'electronic'].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setSearchTerm(suggestion);
                            handleSearch({ preventDefault: () => {} } as React.FormEvent);
                          }}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-gray-50 to-gray-100 hover:from-purple-50 hover:to-indigo-50 rounded-xl text-gray-700 hover:text-purple-700 transition-all duration-200 border border-gray-200 hover:border-purple-200 shadow-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 mb-6 shadow-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Results */}
            {hasSearched && playlists.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                {/* Controls */}
                <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium px-3 py-1 rounded-lg hover:bg-purple-50 transition-all duration-200"
                    >
                      {selectedPlaylists.size === playlists.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg shadow-sm">
                      {selectedPlaylists.size} of {playlists.length} selected
                    </span>
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={selectedPlaylists.size === 0}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 font-medium"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Import to Favorites ({selectedPlaylists.size})
                  </button>
                </div>

                {/* Playlist List */}
                <div className="divide-y divide-gray-200">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className={`p-6 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 ${
                        selectedPlaylists.has(playlist.id) ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 shadow-sm' : ''
                      }`}
                      onClick={() => togglePlaylistSelection(playlist.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedPlaylists.has(playlist.id)}
                          onChange={() => togglePlaylistSelection(playlist.id)}
                          className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded-lg"
                        />
                        
                        {playlist.imageUrl && (
                          <img
                            src={playlist.imageUrl}
                            alt={playlist.name}
                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-lg"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {playlist.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
                            </svg>
                            <span className="text-sm text-gray-600 font-medium">
                              {playlist.tracksCount} tracks
                            </span>
                          </div>
                          {playlist.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {playlist.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results message */}
            {hasSearched && playlists.length === 0 && !error && !isLoading && (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No playlists found</h3>
                <p className="text-gray-600 mb-6">Try searching with different keywords or check your spelling.</p>
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-sm text-blue-700 font-medium">Try popular genres like 'jazz', 'rock', or 'classical'</span>
                </div>
              </div>
            )}

            {/* Initial state */}
            {!hasSearched && !isLoading && (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Ready to Search</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">Use the search above to find playlists to add to your favorites.</p>
                <div className="inline-flex items-center px-4 py-2 bg-purple-50 rounded-xl border border-purple-200">
                  <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-purple-700 font-medium">Your own playlists will appear first in search results</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Filtered Favorites Manager */}
        <FilteredFavoritesManager
          isOpen={showFilteredManager}
          onClose={() => setShowFilteredManager(false)}
          onStartOperation={(_, query) => onStartFilteredDelete(query)}
        />
      </div>
    </div>
  );
}