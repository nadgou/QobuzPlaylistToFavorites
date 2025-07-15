using Microsoft.AspNetCore.SignalR;
using QobuzWebApp.DTOs;
using QobuzWebApp.Hubs;
using QobuzWebApp.Models;

namespace QobuzWebApp.Services;

public class QobuzFavoritesService
{
    private readonly IHubContext<ProgressHub> _hubContext;
    private readonly QobuzPlaylistService _playlistService;
    
    public QobuzFavoritesService(IHubContext<ProgressHub> hubContext, QobuzPlaylistService playlistService)
    {
        _hubContext = hubContext;
        _playlistService = playlistService;
    }
    
    public async Task ImportPlaylistsToFavoritesAsync(UserSession session, List<string> playlistIds, string connectionId)
    {
        var allTrackIds = new HashSet<string>();
        var totalPlaylists = playlistIds.Count;
        var processedPlaylists = 0;
        
        await NotifyProgress(connectionId, new ImportProgressUpdate(
            TotalTracks: 0,
            ProcessedTracks: 0,
            SuccessfulTracks: 0,
            FailedTracks: 0,
            CurrentStatus: "Starting import process..."
        ));
        
        // Step 1: Collect all tracks from playlists
        foreach (var playlistId in playlistIds)
        {
            try
            {
                await NotifyProgress(connectionId, new ImportProgressUpdate(
                    TotalTracks: allTrackIds.Count,
                    ProcessedTracks: 0,
                    SuccessfulTracks: 0,
                    FailedTracks: 0,
                    CurrentStatus: $"Loading tracks from playlist {processedPlaylists + 1}/{totalPlaylists}..."
                ));
                
                var tracks = await _playlistService.GetPlaylistTracksAsync(session, playlistId);
                
                foreach (var track in tracks)
                {
                    if (!string.IsNullOrEmpty(track.Id))
                    {
                        allTrackIds.Add(track.Id);
                    }
                }
                
                processedPlaylists++;
                await Task.Delay(1000); // Rate limiting between playlists
            }
            catch (Exception)
            {
                // Log error but continue with other playlists
            }
        }
        
        if (!allTrackIds.Any())
        {
            await NotifyProgress(connectionId, new ImportProgressUpdate(
                TotalTracks: 0,
                ProcessedTracks: 0,
                SuccessfulTracks: 0,
                FailedTracks: 0,
                CurrentStatus: "No tracks found to import",
                IsCompleted: true,
                ErrorMessage: "No tracks were found in the selected playlists"
            ));
            return;
        }
        
        // Step 2: Add tracks to favorites in batches
        await AddTracksToFavoritesWithProgressAsync(session, allTrackIds.ToList(), connectionId);
    }
    
    private async Task AddTracksToFavoritesWithProgressAsync(UserSession session, List<string> trackIds, string connectionId)
    {
        const int batchSize = 50;
        int totalTracks = trackIds.Count;
        int processedTracks = 0;
        int successfulTracks = 0;
        int failedTracks = 0;
        
        await NotifyProgress(connectionId, new ImportProgressUpdate(
            TotalTracks: totalTracks,
            ProcessedTracks: 0,
            SuccessfulTracks: 0,
            FailedTracks: 0,
            CurrentStatus: $"Adding {totalTracks} tracks to favorites..."
        ));
        
        for (int i = 0; i < trackIds.Count; i += batchSize)
        {
            var batch = trackIds.Skip(i).Take(batchSize).ToList();
            var currentBatch = (i / batchSize) + 1;
            var totalBatches = (int)Math.Ceiling((double)trackIds.Count / batchSize);
            
            await NotifyProgress(connectionId, new ImportProgressUpdate(
                TotalTracks: totalTracks,
                ProcessedTracks: processedTracks,
                SuccessfulTracks: successfulTracks,
                FailedTracks: failedTracks,
                CurrentStatus: $"Processing batch {currentBatch}/{totalBatches}..."
            ));
            
            try
            {
                var response = session.ApiService.AddUserFavorites(batch, null, null);
                
                if (response != null)
                {
                    successfulTracks += batch.Count;
                }
                else
                {
                    failedTracks += batch.Count;
                }
            }
            catch (Exception)
            {
                // Try individual tracks in failed batch
                foreach (var trackId in batch)
                {
                    try
                    {
                        session.ApiService.AddUserFavorites(new[] { trackId }, null, null);
                        successfulTracks++;
                    }
                    catch
                    {
                        failedTracks++;
                    }
                    await Task.Delay(500);
                }
            }
            
            processedTracks += batch.Count;
            
            await NotifyProgress(connectionId, new ImportProgressUpdate(
                TotalTracks: totalTracks,
                ProcessedTracks: processedTracks,
                SuccessfulTracks: successfulTracks,
                FailedTracks: failedTracks,
                CurrentStatus: $"Batch {currentBatch}/{totalBatches} completed"
            ));
            
            // Rate limiting between batches
            if (i + batchSize < trackIds.Count)
            {
                await Task.Delay(2000);
            }
        }
        
        // Final completion notification
        await NotifyProgress(connectionId, new ImportProgressUpdate(
            TotalTracks: totalTracks,
            ProcessedTracks: processedTracks,
            SuccessfulTracks: successfulTracks,
            FailedTracks: failedTracks,
            CurrentStatus: "Import completed!",
            IsCompleted: true
        ));
    }
    
    public async Task<List<TrackSummary>> GetAllFavoritesAsync(UserSession session)
    {
        var allFavorites = new List<TrackSummary>();
        const int limit = 50;
        int offset = 0;
        
        while (true)
        {
            try
            {
                var favorites = session.ApiService.GetUserFavorites(session.UserId, "tracks", limit, offset);
                
                if (favorites?.Tracks?.Items == null || !favorites.Tracks.Items.Any())
                {
                    break;
                }
                
                foreach (var track in favorites.Tracks.Items)
                {
                    allFavorites.Add(new TrackSummary(
                        track.Id?.ToString() ?? "0",
                        track.Title ?? "Unknown Title",
                        track.Performer?.Name ?? "Unknown Artist",
                        track.Album?.Title ?? "Unknown Album",
                        track.Duration
                    ));
                }
                
                offset += limit;
                await Task.Delay(500); // Rate limiting
            }
            catch (Exception)
            {
                break;
            }
        }
        
        return allFavorites;
    }
    
    public async Task<SearchResult> SearchFavoritesAsync(UserSession session, string? query, int limit, int offset)
    {
        var allFavorites = new List<TrackSummary>();
        const int pageSize = 50;
        int currentOffset = 0;
        
        // Load all favorites with pagination
        while (true)
        {
            try
            {
                var favorites = session.ApiService.GetUserFavorites(session.UserId, "tracks", pageSize, currentOffset);
                
                if (favorites?.Tracks?.Items == null || !favorites.Tracks.Items.Any())
                {
                    break;
                }
                
                foreach (var track in favorites.Tracks.Items)
                {
                    allFavorites.Add(new TrackSummary(
                        track.Id?.ToString() ?? "0",
                        track.Title ?? "Unknown Title",
                        track.Performer?.Name ?? "Unknown Artist",
                        track.Album?.Title ?? "Unknown Album",
                        track.Duration
                    ));
                }
                
                currentOffset += pageSize;
                await Task.Delay(500); // Rate limiting
            }
            catch (Exception)
            {
                break;
            }
        }
        
        // Filter results if query is provided
        var filteredFavorites = allFavorites;
        if (!string.IsNullOrEmpty(query))
        {
            var searchQuery = query.ToLowerInvariant();
            filteredFavorites = allFavorites.Where(track => 
                track.Title.ToLowerInvariant().Contains(searchQuery) ||
                track.Artist.ToLowerInvariant().Contains(searchQuery) ||
                (track.Album != null && track.Album.ToLowerInvariant().Contains(searchQuery))
            ).ToList();
        }
        
        // Apply pagination to filtered results
        var paginatedResults = filteredFavorites.Skip(offset).Take(limit).ToList();
        
        return new SearchResult(
            TotalCount: filteredFavorites.Count,
            Tracks: paginatedResults,
            HasMore: offset + limit < filteredFavorites.Count
        );
    }
    
    public async Task<PreviewResult> PreviewFilteredFavoritesAsync(UserSession session, string? query)
    {
        var allFavorites = new List<TrackSummary>();
        const int pageSize = 50;
        int currentOffset = 0;
        
        // Load all favorites with pagination
        while (true)
        {
            try
            {
                var favorites = session.ApiService.GetUserFavorites(session.UserId, "tracks", pageSize, currentOffset);
                
                if (favorites?.Tracks?.Items == null || !favorites.Tracks.Items.Any())
                {
                    break;
                }
                
                foreach (var track in favorites.Tracks.Items)
                {
                    allFavorites.Add(new TrackSummary(
                        track.Id?.ToString() ?? "0",
                        track.Title ?? "Unknown Title",
                        track.Performer?.Name ?? "Unknown Artist",
                        track.Album?.Title ?? "Unknown Album",
                        track.Duration
                    ));
                }
                
                currentOffset += pageSize;
                await Task.Delay(500); // Rate limiting
            }
            catch (Exception)
            {
                break;
            }
        }
        
        // Filter results if query is provided
        var filteredFavorites = allFavorites;
        if (!string.IsNullOrEmpty(query))
        {
            var searchQuery = query.ToLowerInvariant();
            filteredFavorites = allFavorites.Where(track => 
                track.Title.ToLowerInvariant().Contains(searchQuery) ||
                track.Artist.ToLowerInvariant().Contains(searchQuery) ||
                (track.Album != null && track.Album.ToLowerInvariant().Contains(searchQuery))
            ).ToList();
        }
        
        // Return preview with count and sample tracks
        return new PreviewResult(
            TotalCount: filteredFavorites.Count,
            SampleTracks: filteredFavorites.Take(5).ToList()
        );
    }
    
    public async Task DeleteFilteredFavoritesAsync(UserSession session, string? query, string connectionId)
    {
        // Step 1: Get all current favorites and filter them
        await NotifyProgress(connectionId, new ImportProgressUpdate(
            TotalTracks: 0,
            ProcessedTracks: 0,
            SuccessfulTracks: 0,
            FailedTracks: 0,
            CurrentStatus: "Loading and filtering favorites..."
        ));
        
        var preview = await PreviewFilteredFavoritesAsync(session, query);
        
        if (preview.TotalCount == 0)
        {
            await NotifyProgress(connectionId, new ImportProgressUpdate(
                TotalTracks: 0,
                ProcessedTracks: 0,
                SuccessfulTracks: 0,
                FailedTracks: 0,
                CurrentStatus: "No matching favorites found to delete",
                IsCompleted: true
            ));
            return;
        }
        
        // Get all filtered tracks for deletion
        var searchResult = await SearchFavoritesAsync(session, query, preview.TotalCount, 0);
        var trackIds = searchResult.Tracks.Select(t => t.Id).ToList();
        
        // Step 2: Delete filtered favorites in batches
        await DeleteTracksFromFavoritesWithProgressAsync(session, trackIds, connectionId);
    }
    
    public async Task DeleteAllFavoritesAsync(UserSession session, string connectionId)
    {
        // Step 1: Get all current favorites
        await NotifyProgress(connectionId, new ImportProgressUpdate(
            TotalTracks: 0,
            ProcessedTracks: 0,
            SuccessfulTracks: 0,
            FailedTracks: 0,
            CurrentStatus: "Loading current favorites..."
        ));
        
        var favorites = await GetAllFavoritesAsync(session);
        
        if (!favorites.Any())
        {
            await NotifyProgress(connectionId, new ImportProgressUpdate(
                TotalTracks: 0,
                ProcessedTracks: 0,
                SuccessfulTracks: 0,
                FailedTracks: 0,
                CurrentStatus: "No favorites found to delete",
                IsCompleted: true
            ));
            return;
        }
        
        // Step 2: Delete favorites in batches
        var trackIds = favorites.Select(f => f.Id).ToList();
        await DeleteTracksFromFavoritesWithProgressAsync(session, trackIds, connectionId);
    }
    
    private async Task DeleteTracksFromFavoritesWithProgressAsync(UserSession session, List<string> trackIds, string connectionId)
    {
        const int batchSize = 50;
        int totalTracks = trackIds.Count;
        int processedTracks = 0;
        int successfulTracks = 0;
        int failedTracks = 0;
        
        await NotifyProgress(connectionId, new ImportProgressUpdate(
            TotalTracks: totalTracks,
            ProcessedTracks: 0,
            SuccessfulTracks: 0,
            FailedTracks: 0,
            CurrentStatus: $"Deleting {totalTracks} tracks from favorites..."
        ));
        
        for (int i = 0; i < trackIds.Count; i += batchSize)
        {
            var batch = trackIds.Skip(i).Take(batchSize).ToList();
            var currentBatch = (i / batchSize) + 1;
            var totalBatches = (int)Math.Ceiling((double)trackIds.Count / batchSize);
            
            await NotifyProgress(connectionId, new ImportProgressUpdate(
                TotalTracks: totalTracks,
                ProcessedTracks: processedTracks,
                SuccessfulTracks: successfulTracks,
                FailedTracks: failedTracks,
                CurrentStatus: $"Deleting batch {currentBatch}/{totalBatches}..."
            ));
            
            try
            {
                var response = session.ApiService.DeleteUserFavorites(batch, null, null);
                
                if (response != null)
                {
                    successfulTracks += batch.Count;
                }
                else
                {
                    failedTracks += batch.Count;
                }
            }
            catch (Exception)
            {
                // Try individual tracks in failed batch
                foreach (var trackId in batch)
                {
                    try
                    {
                        session.ApiService.DeleteUserFavorites(new[] { trackId }, null, null);
                        successfulTracks++;
                    }
                    catch
                    {
                        failedTracks++;
                    }
                    await Task.Delay(500);
                }
            }
            
            processedTracks += batch.Count;
            
            await NotifyProgress(connectionId, new ImportProgressUpdate(
                TotalTracks: totalTracks,
                ProcessedTracks: processedTracks,
                SuccessfulTracks: successfulTracks,
                FailedTracks: failedTracks,
                CurrentStatus: $"Batch {currentBatch}/{totalBatches} completed"
            ));
            
            // Rate limiting between batches
            if (i + batchSize < trackIds.Count)
            {
                await Task.Delay(2000);
            }
        }
        
        // Final completion notification
        await NotifyProgress(connectionId, new ImportProgressUpdate(
            TotalTracks: totalTracks,
            ProcessedTracks: processedTracks,
            SuccessfulTracks: successfulTracks,
            FailedTracks: failedTracks,
            CurrentStatus: "Delete completed!",
            IsCompleted: true
        ));
    }
    
    private async Task NotifyProgress(string connectionId, ImportProgressUpdate update)
    {
        await _hubContext.Clients.Client(connectionId).SendAsync("ProgressUpdate", update);
    }
}