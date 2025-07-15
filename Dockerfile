# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY QobuzWebApp/qobuz-web-frontend/package*.json ./
RUN npm ci
COPY QobuzWebApp/qobuz-web-frontend/ ./
RUN npm run build

# Build backend
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-build
WORKDIR /app
COPY QobuzWebApp/*.csproj ./
RUN dotnet restore
COPY QobuzWebApp/ ./
RUN dotnet publish -c Release -o out

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=backend-build /app/out .
COPY --from=frontend-build /app/frontend/dist ./wwwroot
EXPOSE 5152
ENTRYPOINT ["dotnet", "QobuzWebApp.dll"]