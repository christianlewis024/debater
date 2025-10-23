# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MCP Tool Selection Guide

**CRITICAL: Use the correct MCP/tool based on user intent keywords. Match these patterns to route requests efficiently.**

### Firebase Operations
**Trigger Keywords:** "firebase", "firestore", "check database", "query collection", "get users", "auth users", "security rules", "firebase project"

**Action:** Use `mcp__firebase__*` tools
- Query data: `firestore_query_collection`, `firestore_get_documents`
- Auth management: `auth_get_users`, `auth_update_user`
- Project info: `firebase_get_project`, `firebase_list_apps`
- Rules: `firebase_get_security_rules`

**Example Requests:**
- "Check Firebase for debates" → `firestore_query_collection`
- "Get Firebase users" → `auth_get_users`
- "Show me Firebase security rules" → `firebase_get_security_rules`

### Browser Testing & Visual Inspection
**Trigger Keywords:** "view my app", "test the app", "open the website", "check the browser", "take screenshot", "click on", "navigate to", "fill form"

**Action:** Use `mcp__puppeteer__*` tools
- Navigation: `puppeteer_navigate`
- Inspection: `puppeteer_screenshot`
- Interaction: `puppeteer_click`, `puppeteer_fill`, `puppeteer_select`
- Automation: `puppeteer_evaluate` (JavaScript execution)

**Example Requests:**
- "View my app at localhost:3000" → `puppeteer_navigate` + `puppeteer_screenshot`
- "Click the login button" → `puppeteer_click`
- "Test creating a debate" → sequence of `puppeteer_fill` + `puppeteer_click`

### Library Documentation Lookup
**Trigger Keywords:** "get docs for", "documentation for", "how to use", "API reference for", "examples for [library]"

**Action:** Use `mcp__context7__*` tools
1. First: `resolve-library-id` (get Context7-compatible ID)
2. Then: `get-library-docs` (fetch documentation)

**Example Requests:**
- "Get docs for React Router" → `resolve-library-id` → `get-library-docs`
- "Show me Agora RTC documentation" → `resolve-library-id` → `get-library-docs`
- "How do I use Firebase Authentication?" → `resolve-library-id` → `get-library-docs`

### Web Research & Current Information
**Trigger Keywords:** "search the web", "find online", "latest news", "current information", "look up"

**Action:** Use `WebSearch` tool
- **IMPORTANT:** Current date context is October 25, 2025
- Use for real-time information, package versions, error solutions, trends
- Filter domains with `allowed_domains` or `blocked_domains` if needed

**Example Requests:**
- "Search the web for React 19 hooks best practices" → `WebSearch`
- "Find latest Agora SDK version" → `WebSearch`
- "Look up Firebase pricing 2025" → `WebSearch`

### Default File Operations
**When NOT using MCPs:** Use standard tools for local file operations
- `Read` - Read files
- `Edit` - Modify files
- `Write` - Create new files
- `Glob` - Find files by pattern
- `Grep` - Search file contents
- `Bash` - Terminal commands (git, npm, etc.)

## Project Overview

A real-time video debate platform built with React and Firebase, featuring live turn-based debates with Agora WebRTC video streaming, live voting, chat, and moderator controls.

**Tech Stack:**
- Frontend: React 19.2 with React Router
- Backend: Firebase (Firestore, Realtime Database, Authentication)
- Video: Agora WebRTC SDK (agora-rtc-sdk-ng)
- Styling: Inline CSS with dark theme and glassmorphism effects

## Development Environment

### Hot Reload Development Setup

**Start everything with one command:**
```bash
npm run dev
```

This starts:
- React frontend with hot reload (http://localhost:3000)
- Firebase Auth Emulator (http://localhost:9099)
- Firestore Emulator (http://localhost:8080)
- Realtime Database Emulator (http://localhost:9000)
- Firebase Emulator UI (http://localhost:4000)

**Alternative startup methods:**
```bash
# Shell script (Mac/Linux/Git Bash)
./dev.sh

# Windows batch script
dev.bat
```

### Environment Configuration

**Required files:**
1. `client/.env.local` - Production Firebase & Agora credentials (DO NOT COMMIT)
2. `client/.env.development.local` - Auto-created, copy credentials from .env.local

**Setting up emulators:**
- Emulators auto-connect when `REACT_APP_USE_EMULATORS=true` in `.env.development.local`
- Firebase config (`client/src/services/firebase.js`) detects dev mode and connects to local emulators
- No production data is touched during local development

### Development Commands

```bash
# Start dev environment (frontend + emulators)
npm run dev

# Start only frontend (no emulators)
npm run client

# Start only Firebase emulators
npm run emulators

# Build for production
npm run build

# Run tests
npm run test

# Deploy to Firebase
npm run deploy
npm run deploy:hosting      # Hosting only
npm run deploy:rules        # Security rules only
```

### Hot Reload Features

**Frontend (Automatic):**
- React component changes → instant browser update
- CSS changes → instant application
- No manual refresh needed

**Firebase (Automatic):**
- Firestore rules changes → auto-reload in emulator
- Database rules changes → auto-reload in emulator
- Security rules testing without deployment

**Important:** Always develop with emulators to avoid touching production data.

## Architecture Overview

### Core Application Flow
1. **Authentication** (`src/context/AuthContext.jsx`) - Manages Firebase Auth state, provides `signUp`, `signIn`, `signInWithGoogle`, and `logOut` methods
2. **Routing** (`src/App.js`) - Main routes: `/` (home), `/browse`, `/create`, `/debate/:debateId`, `/profile`, `/login`, `/signup`
3. **Real-time Updates** - Firestore `onSnapshot` listeners throughout the app for live data synchronization

### Key Components

**VideoDebateRoom** (`client/src/components/debate/VideoDebateRoom.jsx`)
- Central debate experience component (2100+ lines)
- Manages Agora RTC client lifecycle (join/leave channels)
- Implements turn-based system with auto-muting debaters when not their turn
- Handles 3 roles: `debater_a` (PRO), `debater_b` (CON), `moderator`
- Only debaters and moderators get video/audio tracks; viewers watch without publishing
- Speaking detection using Agora's volume indicator
- Fullscreen support and device selection (camera/microphone switching)
- **Important:** Uses `clientRef` and `hasJoinedRef` to prevent duplicate channel joins

**Debate State Management** (`client/src/services/debateStateService.js`)
- `initializeDebateState()` - Creates debate state in Firestore `debateStates` collection
- `startDebate()` - Begins the debate timer
- `switchTurn()` - Alternates between debater_a and debater_b
- `pauseDebate()/resumeDebate()` - Moderator controls
- `addTime()` - Moderator adds time to current turn
- `subscribeToDebateState()` - Real-time listener for debate state changes

### Database Structure

**Firestore Collections:**
- `users/` - User profiles with stats (totalDebates, wins, losses, totalVotesReceived, totalVotesCast)
- `debates/` - Debate documents with title, category, status, hostId, settings
- `debates/{id}/participants/` - Subcollection for debater_a, debater_b, moderator roles
- `debates/{id}/messages/` - Live chat messages
- `debates/{id}/votes/` - User votes (immutable after creation)
- `debates/{id}/turns/` - Turn history
- `debates/{id}/references/` - Reference materials
- `debateStates/{id}` - Real-time debate state (currentTurn, turnNumber, timeRemaining, paused, debateStarted, debateEnded)

**Important:** The debate state is separate from the main debate document to optimize real-time updates.

### Turn-Based System Logic

The turn system is controlled by the `debateState` document:
1. Timer counts down locally in each client (`VideoDebateRoom` line 143-161)
2. When time reaches 0, `switchTurn()` is called
3. Turn alternates: debater_a → debater_b → debater_a (incrementing `turnNumber` after debater_b's turn)
4. Auto-muting: debaters' microphones are automatically muted when it's not their turn (lines 164-188)
5. Moderators are never auto-muted and can speak anytime
6. Debate ends when `turnNumber > maxTurns`

### Video/Audio Management

**Agora Integration:**
- App ID stored in `REACT_APP_AGORA_APP_ID` environment variable
- Channel name is the `debateId`
- User UID is Firebase `currentUser.uid`
- Mode: "rtc" with "vp8" codec
- Tracks created with `AgoraRTC.createCameraVideoTrack()` and `AgoraRTC.createMicrophoneAudioTrack()`

**Key Behaviors:**
- `needsMedia` flag determines if user publishes tracks (true for debaters & moderators)
- Auto-rejoin when role changes from viewer to participant (lines 558-577)
- Cleanup on component unmount to prevent memory leaks
- Audio autoplay may be blocked by browser; UI shows "Enable Audio" button when blocked

## Important Patterns & Conventions

### Real-time Listeners
Always unsubscribe from Firestore/Agora listeners in cleanup:
```javascript
useEffect(() => {
  const unsubscribe = subscribeToDebateState(debateId, callback);
  return () => unsubscribe();
}, [debateId]);
```

### Participant Role Detection
```javascript
const myRole =
  participants.debater_a?.userId === currentUser?.uid ? 'debater_a' :
  participants.debater_b?.userId === currentUser?.uid ? 'debater_b' :
  participants.moderator?.userId === currentUser?.uid ? 'moderator' : null;

const isDebater = myRole === 'debater_a' || myRole === 'debater_b';
const isModerator = myRole === 'moderator';
const needsMedia = isDebater || isModerator;
```

### Firestore Security
See `firestore.rules` - key rules:
- All users can read debates, participants, messages, votes
- Only authenticated users can write
- Users can only update their own profile
- Votes cannot be updated or deleted after creation
- Only debate host can delete debates

## Common Issues & Solutions

### Agora Channel Issues
- **Problem:** User joins multiple times or doesn't leave properly
- **Solution:** Check `hasJoinedRef.current` flag before joining, always call `leaveChannel()` on unmount

### Timer Sync Issues
- **Problem:** Timer gets out of sync across clients
- **Solution:** Timer is local but resets from Firestore on turn changes; `timeRemaining` updates from DB on new turns

### Audio Autoplay Blocked
- **Problem:** Remote audio doesn't play automatically
- **Solution:** UI shows "Enable Audio" button; clicking it calls `.play()` on all audio tracks with user gesture

### Moderator Controls Not Showing
- **Problem:** Moderator can't see pause/resume controls
- **Solution:** Check that debate has started (`debateState.debateStarted === true`) and hasn't ended

## File Navigation

- Main app entry: `client/src/App.js:1`
- Auth context: `client/src/context/AuthContext.jsx:1`
- Firebase config: `client/src/services/firebase.js:1`
- Video room: `client/src/components/debate/VideoDebateRoom.jsx:1`
- Debate state service: `client/src/services/debateStateService.js:1`
- Chat service: `client/src/services/chatService.js:1`
- Vote service: `client/src/services/voteService.js:1`
- Debate service: `client/src/services/debateService.js:1`

## Testing Notes

### Test Accounts

Three test accounts are available for testing and development:

| Username | Email | Password |
|----------|-------|----------|
| claude1 | claude1@test.com | test123 |
| claude2 | claude2@test.com | test123 |
| claude3 | claude3@test.com | test123 |

**Usage:**
- Use these accounts to test multi-user features (debates, voting, chat)
- Login with email/password on localhost or production
- Safe to use for testing without affecting real user data

### Test Suite

Currently no test suite is configured beyond the default Create React App setup. When adding tests:
- Test auth flows with Firebase emulators
- Mock Agora RTC client for video component tests
- Test turn switching logic with Firestore emulators
- Verify security rules with `firebase emulators:start`
- todays date is october 22, 2025.