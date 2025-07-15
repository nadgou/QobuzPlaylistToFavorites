using Microsoft.AspNetCore.Mvc;
using QobuzWebApp.DTOs;
using QobuzWebApp.Services;

namespace QobuzWebApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly QobuzAuthService _authService;
    
    public AuthController(QobuzAuthService authService)
    {
        _authService = authService;
    }
    
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new LoginResponse("", "", false, "Email and password are required"));
        }
        
        var session = await _authService.LoginAsync(request.Email, request.Password);
        
        if (session != null)
        {
            return Ok(new LoginResponse(session.UserId, session.SessionId, true));
        }
        
        return Unauthorized(new LoginResponse("", "", false, "Invalid email or password"));
    }
    
    [HttpPost("logout")]
    public IActionResult Logout([FromHeader(Name = "X-Session-Id")] string? sessionId)
    {
        if (!string.IsNullOrEmpty(sessionId))
        {
            _authService.Logout(sessionId);
        }
        
        return Ok();
    }
    
    [HttpGet("validate")]
    public IActionResult ValidateSession([FromHeader(Name = "X-Session-Id")] string? sessionId)
    {
        if (string.IsNullOrEmpty(sessionId))
        {
            return Unauthorized();
        }
        
        var session = _authService.GetSession(sessionId);
        if (session != null)
        {
            return Ok(new { UserId = session.UserId, Valid = true });
        }
        
        return Unauthorized();
    }
}