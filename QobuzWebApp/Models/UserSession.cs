using QobuzApiSharp.Service;

namespace QobuzWebApp.Models;

public class UserSession
{
    public string SessionId { get; init; } = Guid.NewGuid().ToString();
    public string UserId { get; init; } = string.Empty;
    public QobuzApiService ApiService { get; init; } = new();
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsExpired => DateTime.UtcNow - LastAccessedAt > TimeSpan.FromHours(2);
}