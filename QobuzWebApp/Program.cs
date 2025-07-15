using QobuzWebApp.Hubs;
using QobuzWebApp.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddOpenApi();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:4000", "http://192.168.178.98:4000") // React dev servers
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Register our services
builder.Services.AddSingleton<QobuzAuthService>();
builder.Services.AddScoped<QobuzPlaylistService>();
builder.Services.AddScoped<QobuzFavoritesService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseRouting();

// Map controllers and SignalR hub
app.MapControllers();
app.MapHub<ProgressHub>("/hub/progress");

app.Run();
