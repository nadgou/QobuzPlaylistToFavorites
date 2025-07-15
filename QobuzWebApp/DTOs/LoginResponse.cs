namespace QobuzWebApp.DTOs;

public record LoginResponse(string UserId, string SessionId, bool Success, string? ErrorMessage = null);