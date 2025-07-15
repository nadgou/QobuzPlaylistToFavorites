# Qobuz Playlist to Favorites

A modern web application for transferring tracks from Qobuz playlists to your favorites list with real-time progress tracking.

## 🚀 Live Demo

**Try it now:** https://qobuzplaylisttofavorites-production.up.railway.app

*Note: You'll need a Qobuz account to use the application.*

## ✨ Features

- 🎵 **Playlist Search**: Find any public Qobuz playlist or your own playlists
- 🚀 **Batch Import**: Transfer multiple playlists to favorites at once
- 📊 **Real-time Progress**: Live updates with detailed statistics
- 🗑️ **Mass Delete**: Remove all favorites or filter by artist/album/track
- 📱 **Mobile Responsive**: Works perfectly on desktop and mobile
- 🔒 **Secure**: Session-based authentication, no data stored permanently

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: ASP.NET Core 9.0 Web API
- **Real-time**: SignalR for live progress updates
- **API**: QobuzApiSharp for Qobuz integration
- **Deployment**: Docker + Railway
- **Build**: Vite for fast development

## 📸 Screenshots

### Login & Authentication
Clean, professional login interface with email/password authentication.

### Playlist Browser
Search and select multiple playlists with intuitive multi-select interface.

### Real-time Progress
Live updates showing import progress with detailed statistics and ETA.

### Mass Delete Features
Safely remove all favorites or filter by specific criteria.

## 🏃‍♂️ Quick Start

### Option 1: Use Live Demo (Recommended)
Visit https://qobuzplaylisttofavorites-production.up.railway.app and log in with your Qobuz credentials.

### Option 2: Run Locally

**Prerequisites:**
- .NET 9.0 SDK
- Node.js 18+
- Git

**Setup:**
```bash
# Clone the repository
git clone https://github.com/nadgou/QobuzPlaylistToFavorites.git
cd QobuzPlaylistToFavorites

# Start both frontend and backend (easiest method)
cd QobuzWebApp/qobuz-web-frontend
npm install
npm run dev:full
```

**Access the app:**
- Web interface: http://localhost:5173
- API: http://localhost:5152

### Option 3: Docker

```bash
# Build and run with Docker
docker-compose up

# Or build manually
docker build -t qobuz-app .
docker run -p 5152:5152 qobuz-app
```

## 📚 Usage

1. **Login**: Enter your Qobuz email and password
2. **Search**: Find playlists by name, artist, or genre
3. **Select**: Choose one or more playlists to import
4. **Import**: Watch real-time progress as tracks are added to favorites
5. **Manage**: Use mass delete features to clean up your favorites

## 🔧 Development

### Project Structure
```
QobuzPlaylistToFavorites/
├── QobuzWebApp/                 # ASP.NET Core Web API
│   ├── Controllers/             # API endpoints
│   ├── Services/               # Business logic
│   ├── Hubs/                   # SignalR hubs
│   └── qobuz-web-frontend/     # React frontend
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── services/       # API client
│       │   └── types/          # TypeScript types
│       └── package.json
├── Dockerfile                  # Multi-stage build
├── docker-compose.yml         # Local development
└── railway.json               # Railway deployment
```

### Development Commands

```bash
# Start development servers
npm run dev:full              # Both frontend and backend
npm run dev                   # Frontend only
dotnet run                    # Backend only

# Build for production
npm run build                 # Frontend build
dotnet build                  # Backend build
```

## 🚀 Deployment

The application is automatically deployed to Railway when changes are pushed to the main branch.

**Deployment Features:**
- 🐳 Docker containerization
- 🔄 Automatic deployments via GitHub
- 🌐 HTTPS and CDN included
- 📊 Usage monitoring and scaling

## 🔐 Security & Privacy

- **No data storage**: Sessions are temporary (2-hour expiration)
- **Secure authentication**: Users authenticate with their own Qobuz accounts
- **No cross-user access**: Each session is isolated
- **Rate limiting**: Respects Qobuz API limits
- **HTTPS**: All communication is encrypted

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests for improvements
- Share your experience using the app

## 📄 License

This project is for educational and personal use. Please respect Qobuz's terms of service when using this application.

## 🙏 Acknowledgments

- **QobuzApiSharp**: For providing the Qobuz API integration
- **Railway**: For excellent deployment platform
- **Qobuz**: For their music streaming service

---

**Built with ❤️ by [nadgou](https://github.com/nadgou)**

*This application is not affiliated with Qobuz. It's a personal project for automating playlist management.*