export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  sessionId: string;
  success: boolean;
  errorMessage?: string;
}

export interface PlaylistSummary {
  id: string;
  name: string;
  tracksCount: number;
  description?: string;
  imageUrl?: string;
}

export interface TrackSummary {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
}

export interface ImportProgressUpdate {
  totalTracks: number;
  processedTracks: number;
  successfulTracks: number;
  failedTracks: number;
  currentStatus: string;
  isCompleted: boolean;
  errorMessage?: string;
}

export interface ImportRequest {
  playlistIds: string[];
}