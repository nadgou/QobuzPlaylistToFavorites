# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains two applications for automating the transfer of tracks from Qobuz playlists to a user's favorites list:

1. **Console Application** (`QobuzPlaylistToFavorites.csproj`): Original C# console app
2. **Web Application** (`QobuzWebApp/`): Modern ASP.NET Core + React web application

Both use the QobuzApiSharp library to interact with the Qobuz music streaming service API.

## Development Commands

### Console Application
```bash
# Build and run the console app
dotnet build QobuzPlaylistToFavorites.csproj
dotnet run --project QobuzPlaylistToFavorites.csproj
```

### Web Application

**Quick Start (Recommended):**
```bash
cd QobuzWebApp/qobuz-web-frontend
npm run dev:full
# Starts both backend (5152) and frontend (5173)
```

**Alternative: Bash Script:**
```bash
./start-dev.sh
# Starts both servers with single command
```

**Manual (Two Terminals):**
```bash
# Terminal 1: Backend
cd QobuzWebApp && dotnet run
# Runs on http://localhost:5152

# Terminal 2: Frontend  
cd QobuzWebApp/qobuz-web-frontend && npm run dev
# Runs on http://localhost:5173
```

**Build Commands:**
```bash
# Backend
cd QobuzWebApp && dotnet build

# Frontend
cd QobuzWebApp/qobuz-web-frontend && npm run build
```

## Web Application Architecture

### Backend (ASP.NET Core API)

**Services:**
- `QobuzAuthService`: Session-based authentication with 2-hour expiration
- `QobuzPlaylistService`: Playlist search with user playlist prioritization and track retrieval with pagination
- `QobuzFavoritesService`: Batch import and mass delete with real-time progress tracking
- `ProgressHub`: SignalR hub for real-time progress updates

**API Endpoints:**
- `POST /api/auth/login` - Authenticate with email/password
- `GET /api/auth/validate` - Validate session
- `POST /api/auth/logout` - End session
- `GET /api/playlists/search` - Search for playlists (prioritizes user's playlists when available)
- `GET /api/playlists/{id}/tracks` - Get tracks from playlist
- `POST /api/favorites/import` - Start import process
- `GET /api/favorites/current` - Get current favorites count and list
- `DELETE /api/favorites/delete-all` - Start mass delete process
- `/hub/progress` - SignalR real-time connection

**Configuration:**
- CORS enabled for localhost:3000 and localhost:5173
- Session management with in-memory storage
- Rate limiting preserved from console app (500ms-2000ms delays)

### Frontend (React + TypeScript)

**Tech Stack:**
- React 19 with TypeScript
- Vite for build tooling and dev server
- Tailwind CSS for responsive design
- Axios for API communication
- SignalR client for real-time updates

**Components:**
- `LoginForm`: Email/password authentication with validation
- `PlaylistBrowser`: Enhanced search interface with user-friendly guidance, multi-select, batch actions, and favorites management
- `ProgressTracker`: Real-time import/delete progress with statistics
- `CompletionStats`: Post-import/delete statistics and summary display
- `App`: State management and routing between components

**Key Features:**
- **Enhanced search experience**: Intuitive interface with popular search suggestions
- **Smart playlist search**: Prioritizes user's playlists in search results when available
- **User-friendly guidance**: Clear instructions and search examples for better discovery
- Mobile-first responsive design
- Real-time progress tracking during imports and deletions
- Post-import/delete completion statistics with success rates and timing
- Session persistence across page reloads
- Error handling with user-friendly messages
- Batch selection with select all/none functionality
- Mass delete favorites with strong confirmation and safety measures

### API Integration Details
- Session-based authentication with X-Session-Id headers
- Same rate limiting and retry logic as console app
- Batch processing: 50 tracks per request with 2-second delays
- Real-time progress updates via SignalR connection
- Individual track retry on batch failures
- Mass delete operations with same safety patterns as import

### Development Workflow
**Recommended**: `cd QobuzWebApp/qobuz-web-frontend && npm run dev:full`

**Manual**:
1. Start backend API: `cd QobuzWebApp && dotnet run`
2. Start frontend dev server: `cd QobuzWebApp/qobuz-web-frontend && npm run dev`
3. Access web app at http://localhost:5173
4. API available at http://localhost:5152

## Current Status & Known Issues

### ✅ Completed
- Full web application with modern UI
- All console app functionality preserved
- Real-time progress tracking (with fallback)
- Post-import completion statistics showing success rates, timing, and summary
- Responsive design for mobile/desktop
- Professional authentication flow
- Batch playlist processing with statistics
- Mass delete all favorites functionality with strong safety confirmation
- **NEW**: Filtered mass delete functionality with server-side search and optimization

### 🔧 Known Issue: SignalR Connection
**Problem**: "Failed to establish real-time connection" during import
**Impact**: Import works but without real-time progress updates
**Workaround**: Fallback connection logic implemented
**Next Steps**: Debug WebSocket transport configuration

### 📋 Quick Testing
1. Run: `cd QobuzWebApp/qobuz-web-frontend && npm run dev:full`
2. Open: http://localhost:5173
3. Login with Qobuz credentials
4. Search for playlists (try "jazz", "rock", etc.)
5. Select playlists and import to favorites
6. Test mass delete: Click "Delete All" button (red button in top-right)
7. Test filtered delete: Click "Filter & Delete" button (blue button in top-right)

## Mass Delete All Favorites Feature

### Overview
The web application now includes a mass delete feature that allows users to remove all tracks from their Qobuz favorites at once. This addresses a limitation in the Qobuz web interface which doesn't provide bulk deletion capabilities.

### Key Features
- **Preview Mode**: Shows exact count of current favorites before deletion
- **Strong Safety Confirmation**: Multiple confirmation steps with clear warnings
- **Real-time Progress**: Live updates during deletion process with cancel option
- **Batch Processing**: Same proven patterns as import (50 tracks/batch, rate limiting)
- **Error Handling**: Individual track retry on batch failures
- **Completion Statistics**: Shows success/failure rates and timing

### Usage
1. **Access**: Click red "Delete All" button in top-right corner of playlist browser
2. **Preview**: Modal shows current favorites count and loads track list
3. **Confirm**: Strong warning message with exact track count to delete
4. **Monitor**: Real-time progress tracker with option to cancel
5. **Complete**: Final statistics showing deletion results

### Safety Measures
- **Multi-step confirmation** with clear warnings about permanent deletion
- **Exact count display** so users know what they're deleting
- **Cancel option** available during deletion process
- **Rate limiting** to respect Qobuz API limits
- **Individual retry** for failed batch operations
- **No accidental triggers** - requires deliberate user action

### Technical Implementation
- **Backend**: Uses `QobuzApiService.DeleteUserFavorites()` method
- **API Endpoints**: `GET /api/favorites/current` and `DELETE /api/favorites/delete-all`
- **Frontend**: Integrated into existing PlaylistBrowser component
- **Progress Tracking**: Reuses existing ProgressTracker component
- **State Management**: Extends App component with delete operation state

## Filtered Mass Delete Feature

### Overview
The web application now includes an advanced filtered mass delete feature that allows users to search and selectively delete tracks from their Qobuz favorites. This addresses performance concerns when managing large favorite collections and provides precise control over deletion operations.

### Key Features
- **Server-side Filtering**: Efficient search across artist, track, and album names
- **Real-time Search**: 300ms debounced search with instant preview
- **Preview Mode**: Shows exact match count + sample tracks before deletion
- **Performance Optimized**: Handles thousands of favorites without loading all into memory
- **Safe Deletion**: Multi-step confirmation with exact deletion counts
- **Progress Tracking**: Real-time updates during filtered deletion process

### Usage
1. **Access**: Click blue "Filter & Delete" button in top-right corner of playlist browser
2. **Search**: Type artist, track, or album name with real-time preview
3. **Preview**: See exact match count and sample tracks
4. **Confirm**: Strong warning with deletion count and search term
5. **Monitor**: Real-time progress tracker during deletion
6. **Complete**: Final statistics showing deletion results

### Technical Implementation
- **Backend API Endpoints**:
  - `GET /api/favorites/search?query={term}&limit=50&offset=0` - Paginated search
  - `GET /api/favorites/preview?query={term}` - Preview with count + samples
  - `DELETE /api/favorites/delete-filtered?query={term}` - Delete filtered results
- **Frontend Components**:
  - `FilteredFavoritesManager` - Search interface and confirmation
  - `ProgressTracker` - Real-time progress for filtered operations
- **Performance Optimizations**:
  - Server-side filtering to avoid loading all favorites
  - Streaming search results with pagination
  - Memory-efficient preview with sample tracks only
  - Rate limiting preserved (500ms-2000ms delays)

### Safety Measures
- **Multi-step confirmation** with search term display
- **Exact count preview** before deletion
- **Sample track display** to verify correct matches
- **Cancel option** available during deletion process
- **Individual retry** for failed batch operations
- **No accidental triggers** - requires deliberate search and confirmation

### Search Capabilities
- **Artist names**: "Beatles", "Kendrick Lamar", "Miles Davis"
- **Track titles**: "Bohemian Rhapsody", "Imagine", "Thriller"
- **Album names**: "Abbey Road", "Kind of Blue", "Thriller"
- **Partial matches**: "jazz", "rock", "classic" (case-insensitive)
- **Combined results**: Searches across all fields simultaneously

## Additional Documentation
- **PROJECT_DOCUMENTATION.md**: Complete project overview, architecture, and implementation details
- **start-dev.sh**: Script to start both servers simultaneously

## Dependencies

**Console App:**
- .NET 9.0, QobuzApiSharp 0.0.8, Newtonsoft.Json 13.0.3

**Web API:**
- .NET 9.0, QobuzApiSharp 0.0.8, Microsoft.AspNetCore.SignalR

**Frontend:**
- React 19, TypeScript, Tailwind CSS, Axios, @microsoft/signalr 8.0.0