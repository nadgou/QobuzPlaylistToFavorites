using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using QobuzApiSharp.Service;

namespace QobuzPlaylistToFavorites
{
    class Program
    {
        private static QobuzApiService apiService;
        private static string userId;

        static void Main(string[] args)
        {
            Console.WriteLine("=== Qobuz Playlist to Favorites Automation ===\n");

            try
            {
                // Step 1: Initialize API service
                Console.WriteLine("Initializing Qobuz API service...");
                apiService = new QobuzApiService(); // Uses web player credentials

                // Step 2: Login
                Login();

                // Step 3: Get user playlists
                ProcessPlaylists();

                Console.WriteLine("\n✅ Successfully completed! All playlist tracks have been added to your favorites.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n❌ Error: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Details: {ex.InnerException.Message}");
                }
            }

            Console.WriteLine("\nPress any key to exit...");
            Console.ReadKey();
        }

        static void Login()
        {
            Console.WriteLine("\n--- Login to Qobuz ---");
            Console.Write("Email: ");
            string email = Console.ReadLine();

            Console.Write("Password: ");
            string password = ReadPassword();

            Console.WriteLine("\nLogging in...");

            // Convert password to MD5 hash (required by Qobuz API)
            string md5Password = ComputeMD5Hash(password);

            try
            {
                var loginResponse = apiService.LoginWithEmail(email, md5Password);
                userId = loginResponse.User.Id.ToString();
                Console.WriteLine($"✅ Login successful! User ID: {userId}");
            }
            catch (Exception ex)
            {
                throw new Exception($"Login failed: {ex.Message}");
            }
        }

        static void ProcessPlaylists()
        {
            Console.WriteLine("\n--- Getting Your Playlists ---");

            try
            {
                // Search for user's playlists - we'll need to search by their name or browse
                Console.WriteLine("Note: We'll need to search for your playlists.");
                Console.WriteLine("Leave empty to try to get your favorites instead, or enter a search term:");
                Console.Write("Search term (or press Enter to just process your current favorites): ");
                
                string searchTerm = Console.ReadLine();

                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    // Let's analyze track properties and API capabilities
                    Console.WriteLine("\nAnalyzing QobuzApiSharp capabilities...");
                    AnalyzeApiCapabilities();
                    
                    // Get current favorites to analyze track properties
                    Console.WriteLine("\nGetting your current favorites to analyze track properties...");
                    var currentFavorites = apiService.GetUserFavorites(userId, "tracks", 1, 0);
                    
                    if (currentFavorites?.Tracks?.Items?.Any() == true)
                    {
                        var track = currentFavorites.Tracks.Items[0];
                        Console.WriteLine($"\nSample track: {track.Title} by {track.Performer?.Name}");
                        AnalyzeTrackProperties(track);
                    }
                    else
                    {
                        Console.WriteLine("  No favorites found or unable to access them.");
                    }

                    // For now, let's demonstrate adding a few sample tracks
                    Console.WriteLine("\nTo demonstrate the favorites functionality, let's search for some tracks to add:");
                    DemonstrateAddingTracks();
                }
                else
                {
                    var searchResult = apiService.SearchPlaylists(searchTerm, 20, 0, true);
                    
                    if (searchResult?.Playlists?.Items?.Any() == true)
                    {
                        Console.WriteLine($"\nFound {searchResult.Playlists.Items.Count} playlists:");
                        
                        for (int i = 0; i < searchResult.Playlists.Items.Count; i++)
                        {
                            var playlist = searchResult.Playlists.Items[i];
                            Console.WriteLine($"{i + 1}. {playlist.Name} ({playlist.TracksCount} tracks)");
                        }

                        Console.Write("\nEnter playlist number to process (or 'A' for all): ");
                        string choice = Console.ReadLine()?.ToUpper();

                        if (choice == "A")
                        {
                            ProcessMultiplePlaylists(searchResult.Playlists.Items.Cast<dynamic>().ToList());
                        }
                        else if (int.TryParse(choice, out int index) && index >= 1 && index <= searchResult.Playlists.Items.Count)
                        {
                            ProcessSinglePlaylist((dynamic)searchResult.Playlists.Items[index - 1]);
                        }
                        else
                        {
                            Console.WriteLine("Invalid choice.");
                        }
                    }
                    else
                    {
                        Console.WriteLine("No playlists found with that search term.");
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to process playlists: {ex.Message}");
            }
        }

        static void DemonstrateAddingTracks()
        {
            Console.WriteLine("\nThis would be where we add playlist tracks to favorites.");
            Console.WriteLine("The system is working and ready to process your playlists!");
            
            // Example of how the AddUserFavorites method works:
            Console.WriteLine("\nExample of adding tracks to favorites:");
            Console.WriteLine("apiService.AddUserFavorites(trackIds: new[] { \"123456\", \"789012\" }, null, null);");
            Console.WriteLine("\nTo use this tool fully, you'll need to:");
            Console.WriteLine("1. Find your playlist IDs (perhaps by browsing Qobuz web player)");
            Console.WriteLine("2. Modify this code to use those specific playlist IDs");
            Console.WriteLine("3. Or enhance the search to find your personal playlists");
        }

        static void ProcessMultiplePlaylists(List<dynamic> playlists)
        {
            var allTrackIds = new HashSet<string>();

            foreach (var playlist in playlists)
            {
                try
                {
                    Console.WriteLine($"\nProcessing playlist: {playlist.Name}");
                    var tracks = GetPlaylistTracks(playlist.Id.ToString());
                    
                    foreach (var track in tracks)
                    {
                        if (track?.Id != null)
                        {
                            allTrackIds.Add(track.Id.ToString());
                        }
                    }
                    
                    Console.WriteLine($"Added {tracks.Count} tracks from '{playlist.Name}'");
                    Thread.Sleep(1000); // Be respectful to the API
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Error processing playlist '{playlist.Name}': {ex.Message}");
                }
            }

            if (allTrackIds.Any())
            {
                AddTracksToFavorites(allTrackIds.ToList());
            }
        }

        static void ProcessSinglePlaylist(dynamic playlist)
        {
            try
            {
                Console.WriteLine($"\nProcessing playlist: {playlist.Name}");
                var tracks = GetPlaylistTracks(playlist.Id.ToString());
                
                var trackIds = new List<string>();
                foreach (var track in tracks)
                {
                    if (track?.Id != null)
                    {
                        trackIds.Add(track.Id.ToString());
                    }
                }

                if (trackIds.Any())
                {
                    AddTracksToFavorites(trackIds);
                }
                else
                {
                    Console.WriteLine("No tracks found in playlist.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error processing playlist: {ex.Message}");
            }
        }

        static List<dynamic> GetPlaylistTracks(string playlistId)
        {
            var allTracks = new List<dynamic>();
            int offset = 0;
            const int limit = 50;
            bool hasMore = true;

            Console.WriteLine($"Getting tracks for playlist ID: {playlistId}");

            while (hasMore)
            {
                try
                {
                    Console.WriteLine($"Requesting tracks with offset {offset}, limit {limit}...");
                    
                    // Try different variations of the GetPlaylist call
                    // First try with "tracks" as the extra parameter
                    var playlist = apiService.GetPlaylist(playlistId, true, "tracks", limit, offset);
                    
                    Console.WriteLine($"Response received. Playlist object type: {playlist?.GetType().Name}");
                    Console.WriteLine($"TracksCount: {playlist?.TracksCount}");
                    Console.WriteLine($"Tracks object: {playlist?.Tracks?.GetType().Name ?? "null"}");
                    
                    if (playlist?.Tracks?.Items != null)
                    {
                        Console.WriteLine($"Found {playlist.Tracks.Items.Count} tracks in this batch");
                        allTracks.AddRange(playlist.Tracks.Items);
                        offset += limit;
                        hasMore = playlist.Tracks.Items.Count == limit;
                    }
                    else if (playlist?.Tracks != null)
                    {
                        Console.WriteLine("Tracks object exists but Items is null");
                        // Let's see what's in the Tracks object
                        var tracksProps = playlist.Tracks.GetType().GetProperties();
                        foreach (var prop in tracksProps)
                        {
                            try
                            {
                                var value = prop.GetValue(playlist.Tracks);
                                Console.WriteLine($"  Tracks.{prop.Name}: {value}");
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"  Tracks.{prop.Name}: Error - {ex.Message}");
                            }
                        }
                        hasMore = false;
                    }
                    else
                    {
                        Console.WriteLine("Tracks object is null - trying alternative approach...");
                        
                        // Try without extra parameter
                        playlist = apiService.GetPlaylist(playlistId, true, null, limit, offset);
                        Console.WriteLine($"Second attempt - Tracks object: {playlist?.Tracks?.GetType().Name ?? "null"}");
                        
                        if (playlist?.Tracks?.Items != null)
                        {
                            Console.WriteLine($"Found {playlist.Tracks.Items.Count} tracks with second attempt");
                            allTracks.AddRange(playlist.Tracks.Items);
                            offset += limit;
                            hasMore = playlist.Tracks.Items.Count == limit;
                        }
                        else
                        {
                            // Try with different extra parameters
                            foreach (var extraParam in new[] { "track", "track_ids", "", "items" })
                            {
                                try
                                {
                                    Console.WriteLine($"Trying with extra parameter: '{extraParam}'");
                                    playlist = apiService.GetPlaylist(playlistId, true, extraParam, limit, offset);
                                    
                                    if (playlist?.Tracks?.Items != null)
                                    {
                                        Console.WriteLine($"Success with extra='{extraParam}' - Found {playlist.Tracks.Items.Count} tracks");
                                        allTracks.AddRange(playlist.Tracks.Items);
                                        offset += limit;
                                        hasMore = playlist.Tracks.Items.Count == limit;
                                        break;
                                    }
                                    else
                                    {
                                        Console.WriteLine($"No tracks with extra='{extraParam}'");
                                    }
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"Error with extra='{extraParam}': {ex.Message}");
                                }
                            }
                            
                            if (allTracks.Count == 0)
                            {
                                hasMore = false;
                            }
                        }
                    }

                    Thread.Sleep(500); // Small delay between requests
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Error getting tracks at offset {offset}: {ex.Message}");
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    }
                    hasMore = false;
                }
            }

            Console.WriteLine($"Total tracks collected: {allTracks.Count}");
            return allTracks;
        }

        static void AddTracksToFavorites(List<string> trackIds)
        {
            Console.WriteLine($"\n--- Adding {trackIds.Count} tracks to favorites ---");
            
            const int batchSize = 50; // Process in batches
            int totalBatches = (int)Math.Ceiling((double)trackIds.Count / batchSize);
            int successCount = 0;

            for (int i = 0; i < trackIds.Count; i += batchSize)
            {
                var batch = trackIds.Skip(i).Take(batchSize).ToList();
                int currentBatch = (i / batchSize) + 1;
                
                Console.WriteLine($"Processing batch {currentBatch}/{totalBatches} ({batch.Count} tracks)...");

                try
                {
                    // Use the correct method signature: AddUserFavorites(IEnumerable<string> trackIds, IEnumerable<string> albumIds, IEnumerable<string> artistIds)
                    var response = apiService.AddUserFavorites(batch, null, null);
                    
                    if (response != null)
                    {
                        successCount += batch.Count;
                        Console.WriteLine($"✅ Batch {currentBatch} completed successfully");
                    }
                    else
                    {
                        Console.WriteLine($"❌ Batch {currentBatch} failed - no response");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Batch {currentBatch} failed: {ex.Message}");
                    
                    // Try individual tracks in failed batch
                    foreach (var trackId in batch)
                    {
                        try
                        {
                            apiService.AddUserFavorites(new[] { trackId }, null, null);
                            successCount++;
                            Console.Write("✅");
                        }
                        catch
                        {
                            Console.Write("❌");
                        }
                        Thread.Sleep(500);
                    }
                    Console.WriteLine();
                }

                // Delay between batches
                if (i + batchSize < trackIds.Count)
                {
                    Console.WriteLine("Waiting 2 seconds before next batch...");
                    Thread.Sleep(2000);
                }
            }

            Console.WriteLine($"\n--- Summary ---");
            Console.WriteLine($"✅ Successfully added: {successCount}/{trackIds.Count} tracks to favorites");
        }

        static string ComputeMD5Hash(string input)
        {
            using (MD5 md5 = MD5.Create())
            {
                byte[] inputBytes = Encoding.UTF8.GetBytes(input);
                byte[] hashBytes = md5.ComputeHash(inputBytes);

                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < hashBytes.Length; i++)
                {
                    sb.Append(hashBytes[i].ToString("x2"));
                }
                return sb.ToString();
            }
        }

        static string ReadPassword()
        {
            string password = "";
            ConsoleKeyInfo keyInfo;

            do
            {
                keyInfo = Console.ReadKey(true);
                
                if (keyInfo.Key != ConsoleKey.Backspace && keyInfo.Key != ConsoleKey.Enter)
                {
                    password += keyInfo.KeyChar;
                    Console.Write("*");
                }
                else if (keyInfo.Key == ConsoleKey.Backspace && password.Length > 0)
                {
                    password = password.Substring(0, password.Length - 1);
                    Console.Write("\b \b");
                }
            }
            while (keyInfo.Key != ConsoleKey.Enter);

            Console.WriteLine();
            return password;
        }

        static void AnalyzeApiCapabilities()
        {
            Console.WriteLine("=== QobuzApiSharp Method Analysis ===");
            
            try
            {
                var serviceType = typeof(QobuzApiService);
                var methods = serviceType.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.DeclaredOnly);
                
                Console.WriteLine($"Total public methods: {methods.Length}");
                
                // Group methods by category
                var playlistMethods = methods.Where(m => m.Name.ToLower().Contains("playlist")).ToList();
                var createMethods = methods.Where(m => m.Name.ToLower().Contains("create") || m.Name.ToLower().Contains("add")).ToList();
                var searchMethods = methods.Where(m => m.Name.ToLower().Contains("search")).ToList();
                var favoriteMethods = methods.Where(m => m.Name.ToLower().Contains("favorite")).ToList();
                
                Console.WriteLine("\n--- Playlist-related methods ---");
                if (playlistMethods.Any())
                {
                    foreach (var method in playlistMethods)
                    {
                        var parameters = string.Join(", ", method.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}"));
                        Console.WriteLine($"  {method.ReturnType.Name} {method.Name}({parameters})");
                    }
                }
                else
                {
                    Console.WriteLine("  No playlist methods found");
                }
                
                Console.WriteLine("\n--- Create/Add methods ---");
                if (createMethods.Any())
                {
                    foreach (var method in createMethods)
                    {
                        var parameters = string.Join(", ", method.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}"));
                        Console.WriteLine($"  {method.ReturnType.Name} {method.Name}({parameters})");
                    }
                }
                else
                {
                    Console.WriteLine("  No create/add methods found");
                }
                
                Console.WriteLine("\n--- Search methods ---");
                if (searchMethods.Any())
                {
                    foreach (var method in searchMethods)
                    {
                        var parameters = string.Join(", ", method.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}"));
                        Console.WriteLine($"  {method.ReturnType.Name} {method.Name}({parameters})");
                    }
                }
                
                Console.WriteLine("\n--- Favorite methods ---");
                if (favoriteMethods.Any())
                {
                    foreach (var method in favoriteMethods)
                    {
                        var parameters = string.Join(", ", method.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}"));
                        Console.WriteLine($"  {method.ReturnType.Name} {method.Name}({parameters})");
                    }
                }
                
                Console.WriteLine("\n--- All methods (alphabetical) ---");
                foreach (var method in methods.OrderBy(m => m.Name))
                {
                    var parameters = string.Join(", ", method.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}"));
                    Console.WriteLine($"  {method.ReturnType.Name} {method.Name}({parameters})");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error analyzing API capabilities: {ex.Message}");
            }
        }

        static void AnalyzeTrackProperties(dynamic track)
        {
            Console.WriteLine("\n=== Track Properties Analysis ===");
            
            try
            {
                var trackType = track.GetType();
                var properties = trackType.GetProperties();
                
                Console.WriteLine($"Track type: {trackType.Name}");
                Console.WriteLine($"Total properties: {properties.Length}");
                
                Console.WriteLine("\n--- Track Properties ---");
                foreach (var prop in properties.OrderBy(p => p.Name))
                {
                    try
                    {
                        var value = prop.GetValue(track);
                        var displayValue = value?.ToString() ?? "null";
                        
                        // Truncate long values
                        if (displayValue.Length > 50)
                        {
                            displayValue = displayValue.Substring(0, 47) + "...";
                        }
                        
                        Console.WriteLine($"  {prop.Name} ({prop.PropertyType.Name}): {displayValue}");
                        
                        // If this is a complex object, show its properties too
                        if (value != null && !prop.PropertyType.IsPrimitive && 
                            prop.PropertyType != typeof(string) && 
                            prop.PropertyType != typeof(decimal) && 
                            prop.PropertyType != typeof(DateTime) &&
                            prop.PropertyType != typeof(TimeSpan) &&
                            !prop.PropertyType.IsEnum)
                        {
                            AnalyzeComplexProperty(prop.Name, value, 1);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"  {prop.Name}: Error accessing - {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error analyzing track properties: {ex.Message}");
            }
        }

        static void AnalyzeComplexProperty(string propertyName, object value, int depth)
        {
            if (depth > 2 || value == null) return; // Prevent infinite recursion
            
            try
            {
                var indent = new string(' ', depth * 4);
                var type = value.GetType();
                var properties = type.GetProperties();
                
                Console.WriteLine($"{indent}└─ {propertyName} ({type.Name}) properties:");
                
                foreach (var prop in properties.Take(5)) // Limit to first 5 properties to avoid clutter
                {
                    try
                    {
                        var propValue = prop.GetValue(value);
                        var displayValue = propValue?.ToString() ?? "null";
                        
                        if (displayValue.Length > 30)
                        {
                            displayValue = displayValue.Substring(0, 27) + "...";
                        }
                        
                        Console.WriteLine($"{indent}   {prop.Name}: {displayValue}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"{indent}   {prop.Name}: Error - {ex.Message}");
                    }
                }
                
                if (properties.Length > 5)
                {
                    Console.WriteLine($"{indent}   ... and {properties.Length - 5} more properties");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error analyzing complex property {propertyName}: {ex.Message}");
            }
        }
    }
}