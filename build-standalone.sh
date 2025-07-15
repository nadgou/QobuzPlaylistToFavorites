#!/bin/bash

# Build frontend
cd QobuzWebApp/qobuz-web-frontend
npm run build

# Copy built frontend to backend wwwroot
cd ../
rm -rf wwwroot
cp -r qobuz-web-frontend/dist wwwroot

# Build self-contained executable
dotnet publish -c Release -r win-x64 --self-contained -o ../releases/win-x64
dotnet publish -c Release -r osx-x64 --self-contained -o ../releases/osx-x64
dotnet publish -c Release -r linux-x64 --self-contained -o ../releases/linux-x64

echo "Standalone executables created in releases/ folder"