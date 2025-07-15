using Microsoft.AspNetCore.Mvc;
using QobuzWebApp.DTOs;
using QobuzWebApp.Services;

namespace QobuzWebApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlaylistsController : ControllerBase
{
    private readonly QobuzAuthService _authService;
    private readonly QobuzPlaylistService _playlistService;
    
    public PlaylistsController(QobuzAuthService authService, QobuzPlaylistService playlistService)
    {
        _authService = authService;
        _playlistService = playlistService;
    }
    
    [HttpGet("search")]
    public async Task<ActionResult<List<PlaylistSummary>>> SearchPlaylists(
        [FromQuery] string searchTerm,
        [FromQuery] int limit = 20,
        [FromQuery] bool prioritizeUserPlaylists = true,
        [FromHeader(Name = "X-Session-Id")] string? sessionId = null)
    {
        if (string.IsNullOrEmpty(sessionId))
        {
            return Unauthorized("Session ID is required");
        }
        
        var session = _authService.GetSession(sessionId);
        if (session == null)
        {
            return Unauthorized("Invalid or expired session");
        }
        
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return BadRequest("Search term is required");
        }
        
        var playlists = await _playlistService.SearchPlaylistsAsync(session, searchTerm, limit, prioritizeUserPlaylists);
        return Ok(playlists);
    }
    
    [HttpGet("{playlistId}/tracks")]
    public async Task<ActionResult<List<TrackSummary>>> GetPlaylistTracks(
        string playlistId,
        [FromHeader(Name = "X-Session-Id")] string? sessionId = null)
    {
        if (string.IsNullOrEmpty(sessionId))
        {
            return Unauthorized("Session ID is required");
        }
        
        var session = _authService.GetSession(sessionId);
        if (session == null)
        {
            return Unauthorized("Invalid or expired session");
        }
        
        if (string.IsNullOrWhiteSpace(playlistId))
        {
            return BadRequest("Playlist ID is required");
        }
        
        var tracks = await _playlistService.GetPlaylistTracksAsync(session, playlistId);
        return Ok(tracks);
    }
}