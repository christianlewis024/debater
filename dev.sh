#!/bin/bash

# Debater Development Environment Startup Script
# This script starts the React frontend with hot reload and Firebase emulators

echo "🚀 Starting Debater Development Environment..."
echo ""

# Check if node_modules exists in root
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
    echo ""
fi

# Check if node_modules exists in client
if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
    echo ""
fi

# Check if Firebase credentials are configured
if [ ! -f "client/.env.local" ]; then
    echo "⚠️  WARNING: client/.env.local not found!"
    echo "Please copy .env.example to .env.local and add your Firebase credentials"
    echo ""
fi

# Check if Firebase project is configured
if [ ! -f ".firebaserc" ]; then
    echo "⚠️  WARNING: .firebaserc not found!"
    echo "Run 'firebase init' to configure your Firebase project"
    echo ""
fi

echo "✨ Starting development servers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 React App:        http://localhost:3000"
echo "🔥 Firebase UI:      http://localhost:4000"
echo "🔐 Auth Emulator:    http://localhost:9099"
echo "📊 Firestore:        http://localhost:8080"
echo "💾 Database:         http://localhost:9000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start the development environment
npm run dev
