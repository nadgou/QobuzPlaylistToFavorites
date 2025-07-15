using System.Security.Cryptography;
using System.Text;
using QobuzApiSharp.Service;
using QobuzWebApp.Models;

namespace QobuzWebApp.Services;

public class QobuzAuthService
{
    private readonly Dictionary<string, UserSession> _sessions = new();
    
    public async Task<UserSession?> LoginAsync(string email, string password)
    {
        try
        {
            var apiService = new QobuzApiService();
            var md5Password = ComputeMD5Hash(password);
            
            var loginResponse = apiService.LoginWithEmail(email, md5Password);
            
            if (loginResponse?.User?.Id != null)
            {
                var session = new UserSession
                {
                    UserId = loginResponse.User.Id.ToString(),
                    ApiService = apiService
                };
                
                _sessions[session.SessionId] = session;
                CleanupExpiredSessions();
                
                return session;
            }
        }
        catch (Exception)
        {
            // Log exception in production
        }
        
        return null;
    }
    
    public UserSession? GetSession(string sessionId)
    {
        if (_sessions.TryGetValue(sessionId, out var session) && !session.IsExpired)
        {
            session.LastAccessedAt = DateTime.UtcNow;
            return session;
        }
        
        if (session?.IsExpired == true)
        {
            _sessions.Remove(sessionId);
        }
        
        return null;
    }
    
    public void Logout(string sessionId)
    {
        _sessions.Remove(sessionId);
    }
    
    private void CleanupExpiredSessions()
    {
        var expiredSessions = _sessions
            .Where(kvp => kvp.Value.IsExpired)
            .Select(kvp => kvp.Key)
            .ToList();
            
        foreach (var sessionId in expiredSessions)
        {
            _sessions.Remove(sessionId);
        }
    }
    
    private static string ComputeMD5Hash(string input)
    {
        using var md5 = MD5.Create();
        byte[] inputBytes = Encoding.UTF8.GetBytes(input);
        byte[] hashBytes = md5.ComputeHash(inputBytes);
        
        var sb = new StringBuilder();
        for (int i = 0; i < hashBytes.Length; i++)
        {
            sb.Append(hashBytes[i].ToString("x2"));
        }
        return sb.ToString();
    }
}