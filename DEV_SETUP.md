# Development Environment Setup Guide

This guide explains how to set up and use the hot reload development environment for the Debater platform.

## Quick Start

### Option 1: NPM Script (Recommended)
```bash
npm run dev
```

### Option 2: Shell Script

**On Mac/Linux/Git Bash:**
```bash
chmod +x dev.sh
./dev.sh
```

**On Windows (Command Prompt):**
```cmd
dev.bat
```

**On Windows (PowerShell):**
```powershell
.\dev.bat
```

## What Gets Started

When you run `npm run dev`, the following services start automatically:

- **React Frontend** (port 3000) - Hot reload enabled
- **Firebase Auth Emulator** (port 9099)
- **Firebase Firestore Emulator** (port 8080)
- **Firebase Realtime Database Emulator** (port 9000)
- **Firebase Emulator UI** (port 4000) - Web interface to view/manage emulator data

## First-Time Setup

### 1. Install Dependencies

Install root dependencies:
```bash
npm install
```

Install client dependencies:
```bash
cd client
npm install
cd ..
```

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp client/.env.example client/.env.local
```

Edit `client/.env.local` and add your Firebase and Agora credentials.

Copy your credentials to the development file:
```bash
# Open client/.env.development.local
# Uncomment and fill in the Firebase and Agora variables
```

### 3. Configure Firebase Project

If you haven't already, initialize Firebase:
```bash
firebase login
firebase init
```

Select:
- Firestore
- Realtime Database
- Hosting
- Emulators

## Development Workflow

### Starting Development
```bash
npm run dev
```

This will:
1. Start the React dev server on http://localhost:3000
2. Start Firebase emulators
3. Enable hot reload for frontend changes
4. Open the Emulator UI at http://localhost:4000

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| React App | http://localhost:3000 | Your main application |
| Emulator UI | http://localhost:4000 | Firebase Emulator dashboard |
| Auth Emulator | http://localhost:9099 | Authentication emulator |
| Firestore | http://localhost:8080 | Firestore database emulator |
| Realtime DB | http://localhost:9000 | Realtime Database emulator |

### Hot Reload Features

**Frontend (Automatic)**
- Edit any React component - changes appear instantly
- CSS changes apply immediately
- No need to refresh the browser

**Firebase Rules (Manual)**
- Edit `firestore.rules` or `database.rules.json`
- Changes are automatically picked up by emulators
- No restart needed

### Stopping Development

Press `Ctrl+C` in the terminal where `npm run dev` is running. This will stop all services.

## Available NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend + Firebase emulators |
| `npm run client` | Start only the React frontend |
| `npm run emulators` | Start only Firebase emulators |
| `npm run build` | Build production bundle |
| `npm run test` | Run tests |
| `npm run deploy` | Build and deploy to Firebase |
| `npm run deploy:hosting` | Deploy only hosting |
| `npm run deploy:rules` | Deploy only security rules |

## Emulator Data Persistence

By default, emulator data is **not persisted** between sessions. To enable persistence:

Edit `firebase.json`:
```json
"emulators": {
  "firestore": {
    "port": 8080
  },
  "auth": {
    "port": 9099
  },
  "database": {
    "port": 9000
  },
  "ui": {
    "enabled": true,
    "port": 4000
  },
  "singleProjectMode": true
}
```

Add export/import options:
```bash
# Export emulator data
firebase emulators:export ./emulator-data

# Start with existing data
firebase emulators:start --import=./emulator-data
```

## Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

1. Find and kill the process:
   ```bash
   # Mac/Linux
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. Or change ports in `firebase.json` and `.env.development.local`

### Firebase Credentials Not Found

Make sure you've created `client/.env.local` with your Firebase credentials:
```bash
cp client/.env.example client/.env.local
# Then edit .env.local with your actual values
```

### Emulators Won't Start

1. Make sure Firebase CLI is installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Make sure you're logged in:
   ```bash
   firebase login
   ```

3. Check if `.firebaserc` exists and has your project ID

### Changes Not Appearing

1. Hard refresh the browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Check the terminal for compilation errors
3. Make sure the dev server is actually running

### "Module not found" Errors

Install missing dependencies:
```bash
# In project root
npm install

# In client directory
cd client
npm install
```

## Environment Variables Reference

### Required in .env.local
```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_DATABASE_URL=
REACT_APP_AGORA_APP_ID=
```

### Auto-configured in .env.development.local
```env
REACT_APP_USE_EMULATORS=true
REACT_APP_FIRESTORE_EMULATOR_PORT=8080
REACT_APP_AUTH_EMULATOR_PORT=9099
REACT_APP_DATABASE_EMULATOR_PORT=9000
```

## Best Practices

1. **Always use emulators for local development** - Don't modify production data
2. **Commit often** - Frontend changes are saved automatically
3. **Test locally first** - Use emulators before deploying
4. **Keep .env.local private** - Never commit credentials
5. **Use meaningful test data** - Makes debugging easier

## Production Deployment

When ready to deploy:

```bash
# Test the build locally
npm run build

# Deploy to Firebase
npm run deploy

# Or deploy only hosting
npm run deploy:hosting
```

## Additional Resources

- [Firebase Emulator Suite Docs](https://firebase.google.com/docs/emulator-suite)
- [Create React App Docs](https://create-react-app.dev/)
- [Agora SDK Docs](https://docs.agora.io/en/)
