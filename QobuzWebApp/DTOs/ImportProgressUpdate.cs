namespace QobuzWebApp.DTOs;

public record ImportProgressUpdate(
    int TotalTracks,
    int ProcessedTracks,
    int SuccessfulTracks,
    int FailedTracks,
    string CurrentStatus,
    bool IsCompleted = false,
    string? ErrorMessage = null
);