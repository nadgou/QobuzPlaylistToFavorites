using Microsoft.AspNetCore.Mvc;
using QobuzWebApp.DTOs;
using QobuzWebApp.Services;

namespace QobuzWebApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FavoritesController : ControllerBase
{
    private readonly QobuzAuthService _authService;
    private readonly QobuzFavoritesService _favoritesService;
    
    public FavoritesController(QobuzAuthService authService, QobuzFavoritesService favoritesService)
    {
        _authService = authService;
        _favoritesService = favoritesService;
    }
    
    [HttpPost("import")]
    public async Task<IActionResult> ImportPlaylists(
        [FromBody] ImportRequest request,
        [FromHeader(Name = "X-Session-Id")] string? sessionId = null,
        [FromHeader(Name = "X-Connection-Id")] string? connectionId = null)
    {
        if (string.IsNullOrEmpty(sessionId))
        {
            return Unauthorized("Session ID is required");
        }
        
        if (string.IsNullOrEmpty(connectionId))
        {
            return BadRequest("SignalR connection ID is required");
        }
        
        var session = _authService.GetSession(sessionId);
        if (session == null)
        {
            return Unauthorized("Invalid or expired session");
        }
        
        if (request.PlaylistIds == null || !request.PlaylistIds.Any())
        {
            return BadRequest("At least one playlist ID is required");
        }
        
        // Start the import process in the background
        _ = Task.Run(async () =>
        {
            try
            {
                await _favoritesService.ImportPlaylistsToFavoritesAsync(session, request.PlaylistIds, connectionId);
            }
            catch (Exception)
            {
                // Log error in production
            }
        });
        
        return Accepted(new { Message = "Import process started", PlaylistCount = request.PlaylistIds.Count });
    }
    
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentFavorites(
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
        
        try
        {
            var favorites = await _favoritesService.GetAllFavoritesAsync(session);
            return Ok(new { 
                Count = favorites.Count,
                Tracks = favorites 
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to get favorites: {ex.Message}");
        }
    }
    
    [HttpGet("search")]
    public async Task<IActionResult> SearchFavorites(
        [FromQuery] string? query = null,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0,
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
        
        try
        {
            var result = await _favoritesService.SearchFavoritesAsync(session, query, limit, offset);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to search favorites: {ex.Message}");
        }
    }
    
    [HttpGet("preview")]
    public async Task<IActionResult> PreviewFilteredFavorites(
        [FromQuery] string? query = null,
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
        
        try
        {
            var result = await _favoritesService.PreviewFilteredFavoritesAsync(session, query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to preview filtered favorites: {ex.Message}");
        }
    }
    
    [HttpDelete("delete-filtered")]
    public async Task<IActionResult> DeleteFilteredFavorites(
        [FromQuery] string? query = null,
        [FromHeader(Name = "X-Session-Id")] string? sessionId = null,
        [FromHeader(Name = "X-Connection-Id")] string? connectionId = null)
    {
        if (string.IsNullOrEmpty(sessionId))
        {
            return Unauthorized("Session ID is required");
        }
        
        if (string.IsNullOrEmpty(connectionId))
        {
            return BadRequest("SignalR connection ID is required");
        }
        
        var session = _authService.GetSession(sessionId);
        if (session == null)
        {
            return Unauthorized("Invalid or expired session");
        }
        
        // Start the delete process in the background
        _ = Task.Run(async () =>
        {
            try
            {
                await _favoritesService.DeleteFilteredFavoritesAsync(session, query, connectionId);
            }
            catch (Exception)
            {
                // Log error in production
            }
        });
        
        return Accepted(new { Message = "Filtered delete process started" });
    }
    
    [HttpDelete("delete-all")]
    public async Task<IActionResult> DeleteAllFavorites(
        [FromHeader(Name = "X-Session-Id")] string? sessionId = null,
        [FromHeader(Name = "X-Connection-Id")] string? connectionId = null)
    {
        if (string.IsNullOrEmpty(sessionId))
        {
            return Unauthorized("Session ID is required");
        }
        
        if (string.IsNullOrEmpty(connectionId))
        {
            return BadRequest("SignalR connection ID is required");
        }
        
        var session = _authService.GetSession(sessionId);
        if (session == null)
        {
            return Unauthorized("Invalid or expired session");
        }
        
        // Start the delete process in the background
        _ = Task.Run(async () =>
        {
            try
            {
                await _favoritesService.DeleteAllFavoritesAsync(session, connectionId);
            }
            catch (Exception)
            {
                // Log error in production
            }
        });
        
        return Accepted(new { Message = "Delete process started" });
    }
}