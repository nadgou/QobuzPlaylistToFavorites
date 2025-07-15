import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import FeatureSelection from './components/FeatureSelection';
import PlaylistBrowser from './components/PlaylistBrowser';
import ProgressTracker from './components/ProgressTracker';
import CompletionStats from './components/CompletionStats';
import { authService } from './services/api';

type AppState = 'login' | 'feature-selection' | 'browser' | 'importing' | 'deleting' | 'deleting-filtered' | 'completed';
type SelectedFeature = 'playlist-to-favorites' | 'cleanup-favorites' | null;

interface ImportStats {
  totalTracks: number;
  successfulTracks: number;
  failedTracks: number;
  duration: number; // in seconds
  playlistCount: number;
  isDeleteOperation?: boolean;
}

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature>(null);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [importStartTime, setImportStartTime] = useState<number>(0);
  const [deleteStartTime, setDeleteStartTime] = useState<number>(0);
  const [filterQuery, setFilterQuery] = useState<string>('');

  useEffect(() => {
    // Check if user has a valid session on app load
    const checkSession = async () => {
      try {
        const isValid = await authService.validateSession();
        if (isValid) {
          setAppState('feature-selection');
        }
      } catch {
        // Session invalid, stay on login
      }
    };

    checkSession();
  }, []);

  const handleLoginSuccess = (_newUserId: string) => {
    setAppState('feature-selection');
  };

  const handleFeatureSelection = (feature: SelectedFeature) => {
    setSelectedFeature(feature);
    setAppState('browser');
  };

  const handleStartImport = (playlistIds: string[]) => {
    setSelectedPlaylistIds(playlistIds);
    setImportStartTime(Date.now());
    setAppState('importing');
  };

  const handleStartDeleteAll = () => {
    setDeleteStartTime(Date.now());
    setAppState('deleting');
  };

  const handleStartFilteredDelete = (query: string) => {
    setFilterQuery(query);
    setDeleteStartTime(Date.now());
    setAppState('deleting-filtered');
  };

  const handleImportComplete = (finalProgress: any) => {
    const duration = Math.round((Date.now() - importStartTime) / 1000);
    setImportStats({
      totalTracks: finalProgress.totalTracks,
      successfulTracks: finalProgress.successfulTracks,
      failedTracks: finalProgress.failedTracks,
      duration,
      playlistCount: selectedPlaylistIds.length
    });
    setAppState('completed');
  };

  const handleDeleteComplete = (finalProgress: any) => {
    const duration = Math.round((Date.now() - deleteStartTime) / 1000);
    setImportStats({
      totalTracks: finalProgress.totalTracks,
      successfulTracks: finalProgress.successfulTracks,
      failedTracks: finalProgress.failedTracks,
      duration,
      playlistCount: 0,
      isDeleteOperation: true
    });
    setAppState('completed');
  };

  const handleBackToBrowser = () => {
    setAppState('browser');
    setSelectedPlaylistIds([]);
    setImportStats(null);
  };

  const handleBackToFeatureSelection = () => {
    setAppState('feature-selection');
    setSelectedFeature(null);
    setSelectedPlaylistIds([]);
    setImportStats(null);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Handle logout error silently
    }
    setAppState('login');
  };

  const handleCancelImport = () => {
    setAppState('browser');
    setSelectedPlaylistIds([]);
  };

  const handleCancelDelete = () => {
    setAppState('browser');
  };

  const handleCancelFilteredDelete = () => {
    setAppState('browser');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30">
      {appState === 'login' && (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      )}
      
      {appState === 'feature-selection' && (
        <FeatureSelection 
          onSelectFeature={handleFeatureSelection}
          onLogout={handleLogout}
        />
      )}
      
      {appState === 'browser' && (
        <PlaylistBrowser 
          selectedFeature={selectedFeature}
          onStartImport={handleStartImport}
          onStartDeleteAll={handleStartDeleteAll}
          onStartFilteredDelete={handleStartFilteredDelete}
          onBackToFeatureSelection={handleBackToFeatureSelection}
          onLogout={handleLogout}
        />
      )}
      
      {appState === 'importing' && (
        <ProgressTracker
          playlistIds={selectedPlaylistIds}
          onComplete={handleImportComplete}
          onCancel={handleCancelImport}
        />
      )}
      
      {appState === 'deleting' && (
        <ProgressTracker
          playlistIds={[]}
          onComplete={handleDeleteComplete}
          onCancel={handleCancelDelete}
          isDeleteOperation={true}
          onConnectionIdChange={() => {}}
        />
      )}
      
      {appState === 'deleting-filtered' && (
        <ProgressTracker
          playlistIds={[]}
          onComplete={handleDeleteComplete}
          onCancel={handleCancelFilteredDelete}
          isDeleteOperation={true}
          isFilteredDelete={true}
          filterQuery={filterQuery}
          onConnectionIdChange={() => {}}
        />
      )}
      
      {appState === 'completed' && importStats && (
        <CompletionStats
          stats={importStats}
          onBackToBrowser={handleBackToBrowser}
        />
      )}
    </div>
  );
}

export default App;