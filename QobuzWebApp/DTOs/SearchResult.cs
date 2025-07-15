namespace QobuzWebApp.DTOs;

public record SearchResult(
    int TotalCount,
    List<TrackSummary> Tracks,
    bool HasMore
);