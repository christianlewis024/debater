@echo off
REM Debater Development Environment Startup Script (Windows)
REM This script starts the React frontend with hot reload and Firebase emulators

echo.
echo 🚀 Starting Debater Development Environment...
echo.

REM Check if node_modules exists in root
if not exist "node_modules\" (
    echo 📦 Installing root dependencies...
    call npm install
    echo.
)

REM Check if node_modules exists in client
if not exist "client\node_modules\" (
    echo 📦 Installing client dependencies...
    cd client
    call npm install
    cd ..
    echo.
)

REM Check if Firebase credentials are configured
if not exist "client\.env.local" (
    echo ⚠️  WARNING: client\.env.local not found!
    echo Please copy .env.example to .env.local and add your Firebase credentials
    echo.
)

REM Check if Firebase project is configured
if not exist ".firebaserc" (
    echo ⚠️  WARNING: .firebaserc not found!
    echo Run 'firebase init' to configure your Firebase project
    echo.
)

echo ✨ Starting development servers...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📱 React App:        http://localhost:3000
echo 🔥 Firebase UI:      http://localhost:4000
echo 🔐 Auth Emulator:    http://localhost:9099
echo 📊 Firestore:        http://localhost:8080
echo 💾 Database:         http://localhost:9000
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Start the development environment
npm run dev
