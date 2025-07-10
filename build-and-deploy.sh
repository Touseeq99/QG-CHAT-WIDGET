#!/bin/bash

# Build and deploy script for production

echo "🚀 Building and deploying Qadri Chat Widget..."

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Build new images
echo "🔨 Building new images..."
docker-compose build --no-cache

# Start services
echo "▶️ Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health status
echo "🏥 Checking health status..."
curl -f http://localhost:3000/api/health || echo "❌ Frontend health check failed"
curl -f http://localhost:8000/health || echo "❌ Backend health check failed"

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo "📊 Logs: docker-compose logs -f"
