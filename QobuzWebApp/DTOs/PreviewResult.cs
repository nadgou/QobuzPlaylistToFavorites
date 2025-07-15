namespace QobuzWebApp.DTOs;

public record PreviewResult(
    int TotalCount,
    List<TrackSummary> SampleTracks
);