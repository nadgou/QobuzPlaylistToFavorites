namespace QobuzWebApp.DTOs;

public record PlaylistSummary(
    string Id,
    string Name,
    int TracksCount,
    string? Description = null,
    string? ImageUrl = null
);