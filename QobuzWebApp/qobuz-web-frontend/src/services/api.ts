import axios from 'axios';
import type { LoginRequest, LoginResponse, PlaylistSummary, TrackSummary, ImportRequest } from '../types';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5152/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

let sessionId: string | null = null;

export const setSessionId = (id: string) => {
  sessionId = id;
};

export const getSessionId = () => sessionId;

// Add session ID to requests
api.interceptors.request.use((config: any) => {
  if (sessionId) {
    config.headers['X-Session-Id'] = sessionId;
  }
  return config;
});

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    if (response.data.success) {
      setSessionId(response.data.sessionId);
    }
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    sessionId = null;
  },

  async validateSession(): Promise<boolean> {
    try {
      await api.get('/auth/validate');
      return true;
    } catch {
      return false;
    }
  }
};

export const playlistService = {
  async searchPlaylists(searchTerm: string, limit = 20, prioritizeUserPlaylists = true): Promise<PlaylistSummary[]> {
    const response = await api.get<PlaylistSummary[]>('/playlists/search', {
      params: { searchTerm, limit, prioritizeUserPlaylists }
    });
    return response.data;
  },

  async getPlaylistTracks(playlistId: string): Promise<TrackSummary[]> {
    const response = await api.get<TrackSummary[]>(`/playlists/${playlistId}/tracks`);
    return response.data;
  }
};

export const favoritesService = {
  async importPlaylists(playlistIds: string[], connectionId: string): Promise<void> {
    await api.post('/favorites/import', 
      { playlistIds } as ImportRequest,
      {
        headers: {
          'X-Connection-Id': connectionId
        }
      }
    );
  },

  async getCurrentFavorites(): Promise<{ count: number; tracks: TrackSummary[] }> {
    const response = await api.get<{ count: number; tracks: TrackSummary[] }>('/favorites/current');
    return response.data;
  },

  async deleteAllFavorites(connectionId: string): Promise<void> {
    await api.delete('/favorites/delete-all', {
      headers: {
        'X-Connection-Id': connectionId
      }
    });
  },

  async searchFavorites(query?: string, limit = 50, offset = 0): Promise<{
    totalCount: number;
    tracks: TrackSummary[];
    hasMore: boolean;
  }> {
    const response = await api.get('/favorites/search', {
      params: { query, limit, offset }
    });
    return response.data;
  },

  async previewFilteredFavorites(query?: string): Promise<{
    totalCount: number;
    sampleTracks: TrackSummary[];
  }> {
    const response = await api.get('/favorites/preview', {
      params: { query }
    });
    return response.data;
  },

  async deleteFilteredFavorites(connectionId: string, query?: string): Promise<void> {
    await api.delete('/favorites/delete-filtered', {
      headers: {
        'X-Connection-Id': connectionId
      },
      params: { query }
    });
  }
};