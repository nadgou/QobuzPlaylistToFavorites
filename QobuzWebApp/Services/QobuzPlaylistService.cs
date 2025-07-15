using QobuzWebApp.DTOs;
using QobuzWebApp.Models;
using System.Reflection;

namespace QobuzWebApp.Services;

public class QobuzPlaylistService
{
    public async Task<List<PlaylistSummary>> SearchPlaylistsAsync(UserSession session, string searchTerm, int limit = 20, bool prioritizeUserPlaylists = false)
    {
        try
        {
            var searchResult = session.ApiService.SearchPlaylists(searchTerm, limit, 0, true);
            
            if (searchResult?.Playlists?.Items?.Any() == true)
            {
                var allPlaylists = searchResult.Playlists.Items.Select(playlist => new PlaylistSummary(
                    Id: playlist.Id?.ToString() ?? "",
                    Name: playlist.Name ?? "Unknown Playlist",
                    TracksCount: playlist.TracksCount ?? 0,
                    Description: playlist.Description?.ToString(),
                    ImageUrl: GetImageUrl(playlist)
                )).ToList();
                
                if (prioritizeUserPlaylists)
                {
                    // Separate user's playlists from others
                    var userPlaylists = new List<PlaylistSummary>();
                    var otherPlaylists = new List<PlaylistSummary>();
                    
                    foreach (var playlist in allPlaylists)
                    {
                        try
                        {
                            var originalPlaylist = searchResult.Playlists.Items.FirstOrDefault(p => p.Id?.ToString() == playlist.Id);
                            if (originalPlaylist?.Owner?.Id?.ToString() == session.UserId)
                            {
                                userPlaylists.Add(playlist);
                            }
                            else
                            {
                                otherPlaylists.Add(playlist);
                            }
                        }
                        catch
                        {
                            otherPlaylists.Add(playlist);
                        }
                    }
                    
                    // Return user's playlists first, then others
                    return userPlaylists.Concat(otherPlaylists).ToList();
                }
                
                return allPlaylists;
            }
        }
        catch (Exception)
        {
            // Log exception in production
        }
        
        return new List<PlaylistSummary>();
    }
    
    public async Task<List<TrackSummary>> GetPlaylistTracksAsync(UserSession session, string playlistId)
    {
        var allTracks = new List<TrackSummary>();
        int offset = 0;
        const int limit = 50;
        bool hasMore = true;

        while (hasMore)
        {
            try
            {
                var playlist = session.ApiService.GetPlaylist(playlistId, true, "tracks", limit, offset);
                
                if (playlist?.Tracks?.Items != null)
                {
                    var tracks = playlist.Tracks.Items.Select(track => new TrackSummary(
                        Id: track.Id?.ToString() ?? "",
                        Title: track.Title ?? "Unknown Title",
                        Artist: track.Performer?.Name ?? "Unknown Artist",
                        Album: track.Album?.Title,
                        Duration: track.Duration
                    )).ToList();
                    
                    allTracks.AddRange(tracks);
                    offset += limit;
                    hasMore = playlist.Tracks.Items.Count == limit;
                }
                else
                {
                    hasMore = false;
                }
                
                // Rate limiting
                await Task.Delay(500);
            }
            catch (Exception)
            {
                // Log exception and continue
                hasMore = false;
            }
        }
        
        return allTracks;
    }
    
    private static string? GetImageUrl(dynamic playlist)
    {
        try
        {
            // Try to extract image URL from playlist object
            return playlist.Image?.Large ?? playlist.Image?.Medium ?? playlist.Image?.Small;
        }
        catch
        {
            return null;
        }
    }
}