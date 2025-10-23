# Debate Structure Implementation Guide

## Overview
Implemented three debate structure types to provide flexible moderation options, along with improved timestamp display and automatic filtering of debates older than 24 hours.

---

## 🎯 What Was Implemented

### ✅ 1. Three Debate Structure Types

#### 👤 Moderated
- Third user acts as official moderator
- Full moderator controls (pause/resume/add time/skip)
- Moderator can speak anytime
- Best for formal debates

#### ⚙️ Auto-Moderated
- Fully automated system
- Auto-muting and turn-switching
- No human moderator needed
- Best for casual debates

#### 🎙️ Self-Moderated
- Host debates multiple challengers
- Host has moderator controls
- Campus-style debate format
- Best for Q&A and town halls

### ✅ 2. Improved Timestamps
- Recent (< 1h): "5m ago", "45m ago"
- Today (< 24h): "3h ago", "18h ago"
- Older: "Oct 22, 3:45 PM" (full date/time)
- Different year: Includes year

### ✅ 3. 24-Hour Auto-Close
- Debates older than 24 hours filtered from browse page
- Still saved in database for records
- Automatic client-side filtering

### ✅ 4. Structure Badges
- Visual indicators in browse view
- Color-coded purple badges
- Shows structure type with icon

---

## 📁 Files Modified

### 1. `client/src/pages/CreateDebatePage.jsx`

**Added:**
- `structure` state field (default: 'moderated')
- Visual structure selector with 3 cards
- Structure saved to debate document

**Code Changes:**
```javascript
// New state
const [structure, setStructure] = useState('moderated');

// Updated debate data
const debateData = {
  title,
  category,
  structure, // NEW FIELD
  settings: {
    turnTime: parseInt(turnTime),
    maxTurns: parseInt(maxTurns)
  }
};
```

### 2. `client/src/pages/BrowseDebatesPage.jsx`

**Added:**
- `formatTimestamp()` - Smart timestamp formatting
- `isDebateOld()` - Check if debate > 24 hours
- Structure badge display
- Auto-filtering of old debates

**Code Changes:**
```javascript
// Filter old debates
const recentDebates = debatesData.filter(debate =>
  !isDebateOld(debate.createdAt)
);

// Show structure badge
{debate.structure === 'moderated' && '👤 Moderated'}
{debate.structure === 'auto-moderated' && '⚙️ Auto'}
{debate.structure === 'self-moderated' && '🎙️ Self'}
```

---

## 🗄️ Database Schema

### Debate Document (Updated)
```javascript
{
  title: "Are cats better than dogs?",
  category: "general",
  structure: "moderated", // NEW: 'moderated' | 'auto-moderated' | 'self-moderated'
  hostId: "user123",
  hostUsername: "john_doe",
  status: "waiting",
  createdAt: Timestamp,
  settings: {
    turnTime: 60,
    maxTurns: 10
  }
}
```

---

## ✅ Phase 2: VideoDebateRoom Implementation (October 23, 2025)

### Structure-Specific Moderator Controls
**Implemented:** Conditional rendering of moderator controls based on debate structure

**Files Modified:**
1. `client/src/components/debate/VideoDebateRoom.jsx`
2. `client/src/hooks/useAutoMute.js`
3. `client/src/hooks/__tests__/useAutoMute.test.js`

**Key Changes:**

#### 1. Added `hasModeratorControls` Logic (VideoDebateRoom.jsx:62-68)
```javascript
const isHost = debate?.hostId === currentUser?.uid;

// Determine if current user should have moderator controls based on structure
const hasModeratorControls =
  (debate?.structure === 'moderated' && isModerator) ||
  (debate?.structure === 'self-moderated' && isHost) ||
  (!debate?.structure && isModerator); // Fallback for debates without structure field
```

#### 2. Conditional Control Panel Rendering (VideoDebateRoom.jsx:1231)
```javascript
{/* Moderator Control Panel - Visible based on debate structure */}
{hasModeratorControls && debateState && debateState.debateStarted && !debateState.debateEnded && (
  <div style={{ padding: "0 24px 24px" }}>
    {/* Shows "HOST CONTROLS" for self-moderated, "MODERATOR CONTROLS" for moderated */}
    {/* Includes pause/resume, add time, skip turn, end debate buttons */}
  </div>
)}
```

#### 3. Fixed Microphone Mute Button
**Issue:** Auto-mute hook was overriding manual muting - debaters couldn't stay muted during their turn

**Solution:** Added `manuallyMuted` state to track user intent
- Added `manuallyMuted` state in VideoDebateRoom (line 22)
- Updated `toggleMic()` to set `manuallyMuted` flag (line 334)
- Modified `useAutoMute` hook to respect manual muting (line 35-39)
- Updated all 18 unit tests for useAutoMute

**Code Changes:**
```javascript
// VideoDebateRoom.jsx
const [manuallyMuted, setManuallyMuted] = useState(false);

const toggleMic = async () => {
  if (localAudioTrack) {
    // ... existing checks ...
    const newState = !micMuted;
    await localAudioTrack.setEnabled(!newState);
    setMicMuted(newState);
    setManuallyMuted(newState); // Track manual action
  }
};

// useAutoMute.js
if (isMyTurn) {
  // Unmute only if they weren't manually muted
  if (micMuted && localAudioTrack && !manuallyMuted) {
    localAudioTrack.setEnabled(true);
    setMicMuted(false);
  }
  // If manually muted, respect their choice
}
```

#### 4. Paused Indicator for Non-Controllers (VideoDebateRoom.jsx:1449)
```javascript
{/* Paused indicator for users without controls */}
{!hasModeratorControls && debateState?.paused && (
  <div>Debate Paused by {structure === 'self-moderated' ? 'Host' : 'Moderator'}</div>
)}
```

---

## ⏭️ Next Steps (Remaining)

### High Priority
1. **Participant Management:**
   - Moderated: Ensure 3rd user can join as moderator
   - Auto-Moderated: Lock/hide moderator role
   - Self-Moderated: Visual indicator that host is also moderator

### Medium Priority
2. **Cloud Functions:**
   - Schedule function to archive old debates
   - Move 24h+ debates to separate collection
   - Keep database clean

3. **Self-Moderated Enhancements:**
   - Support multiple challengers
   - Queue system for participants
   - Sequential debate rounds

4. **Auto-Moderated Polish:**
   - Verify auto-muting works correctly
   - Test turn switching automation
   - Ensure smooth experience without manual controls

---

## 🧪 Testing Instructions

### Test Debate Creation
1. Go to `/create`
2. Click each structure option
3. Verify selected option highlights in blue
4. Create debate and check Firestore:
   ```
   debates/{debateId}
   └── structure: "moderated" (or auto-moderated/self-moderated)
   ```

### Test Browse Page
1. Go to `/browse`
2. Check timestamp formats:
   - Recent debate: "5m ago"
   - Old debate: "Oct 22, 3:45 PM"
3. Verify structure badges show:
   - 👤 Moderated
   - ⚙️ Auto
   - 🎙️ Self
4. Change a debate's `createdAt` to 25+ hours ago
5. Refresh browse - should not appear

### Test VideoDebateRoom (After Implementation)
1. Create "Moderated" debate
2. Join as moderator
3. Verify moderator controls appear
4. Test pause/resume/add time

---

## 📊 UI Examples

### Create Page - Structure Selector
```
Debate Structure *
┌─────────────────────────────────────┐
│ 👤 Moderated                   ✓  │ ← Selected (blue)
│ Third user acts as moderator       │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ ⚙️ Auto-Moderated                  │ ← Unselected (gray)
│ Automated turn-based system        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ 🎙️ Self-Moderated                  │ ← Unselected (gray)
│ Host debates multiple users        │
└─────────────────────────────────────┘
```

### Browse Page - Debate Card
```
"Should AI replace teachers?"        [LIVE]

by alice_smith • 3h ago • Education • 👤 Moderated

👁️ 8 watching  ⏱️ 90s turns  🔄 Max 5 turns
```

---

## 🔄 Deployment

```bash
# Build and deploy
npm run build
npm run deploy

# Or just hosting
npm run deploy:hosting
```

---

## 📝 Summary

✅ **Completed:**
- 3 debate structure types with UI selector
- Smart timestamp formatting (relative + absolute)
- 24-hour auto-filtering of old debates
- Structure badges in browse view
- Database schema updated

⏳ **Pending:**
- VideoDebateRoom structure-specific logic
- Conditional moderator controls
- Self-moderated multiple challenger support
- Cloud Functions for archiving

---

**Date:** October 23, 2025
**Status:** Phase 1 Complete (Data Model + UI)
**Next:** Implement VideoDebateRoom logic
