#!/bin/bash

echo "🚀 Starting Qobuz Web App Development Servers..."

# Start backend in background
echo "📡 Starting backend API..."
cd QobuzWebApp
dotnet run &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background  
echo "🌐 Starting frontend..."
cd qobuz-web-frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting up!"
echo "📡 Backend API: http://localhost:5152"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait