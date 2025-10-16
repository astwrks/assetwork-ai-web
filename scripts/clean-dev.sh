#!/bin/bash

# Clean Development Server Start Script
# Starts the dev server with minimal logging

echo "🧹 Starting AssetWorks with clean console output..."
echo ""

# Set environment variables for clean output
export NODE_ENV=development
export LOG_LEVEL=warn
export NEXT_TELEMETRY_DISABLED=1
export PRISMA_LOG_LEVEL=error
export WS_DEBUG=false

# Clear the console
clear

echo "🚀 AssetWorks WebApp"
echo "━━━━━━━━━━━━━━━━━━━━━"
echo "📍 URL: http://localhost:3001"
echo "🔧 Mode: Development (Clean)"
echo "━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the dev server with filtered output
npm run dev 2>&1 | grep -E "^(  ✓|  ⚠|  ✗|GET|POST|PUT|DELETE|PATCH)" | grep -v "API_RATE_LIMIT\|notifications\|WebSocket token"