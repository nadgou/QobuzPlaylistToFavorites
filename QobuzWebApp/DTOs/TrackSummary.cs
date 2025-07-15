namespace QobuzWebApp.DTOs;

public record TrackSummary(
    string Id,
    string Title,
    string Artist,
    string? Album = null,
    long? Duration = null
);