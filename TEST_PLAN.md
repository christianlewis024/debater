# Testing Implementation Plan

## Overview
This document outlines the phase-by-phase approach to implementing comprehensive tests for the debate platform. The testing strategy follows the testing pyramid: many unit tests, fewer integration tests, and select E2E tests.

**Testing Stack:**
- **Vitest** - Unit and integration tests (10-20x faster than Jest)
- **React Testing Library** - Component testing
- **Playwright** - E2E tests with real browser support for WebRTC
- **MSW** - API mocking at the network level
- **Firebase Emulators** - Real Firebase behavior in local tests

---

## Phase 1: Custom Hooks Testing (Unit Tests)

**Priority:** HIGH - These contain core business logic

### Hooks to Test:
1. `useDebateState.js` - Debate state subscription and initialization
2. `useDebateTimer.js` - Turn-based timer countdown
3. `useAutoMute.js` - Auto-mute/unmute logic

### Test Files to Create:
- `client/src/hooks/__tests__/useDebateState.test.js`
- `client/src/hooks/__tests__/useDebateTimer.test.js`
- `client/src/hooks/__tests__/useAutoMute.test.js`

### What to Test:

#### useDebateState
- ✅ Subscribes to debate state on mount
- ✅ Unsubscribes on unmount
- ✅ Initializes debate state when both debaters join
- ✅ Does not initialize if missing debaters or settings
- ✅ Updates state when Firestore data changes

#### useDebateTimer
- ✅ Initializes with correct time
- ✅ Counts down every second when debate started
- ✅ Pauses when debate is paused
- ✅ Stops when debate ends
- ✅ Calls switchTurn when time reaches 0
- ✅ Resets time on turn change
- ✅ Cleans up interval on unmount

#### useAutoMute
- ✅ Mutes debater when not their turn
- ✅ Unmutes debater when it's their turn
- ✅ Does not affect moderators
- ✅ Does not affect viewers
- ✅ Does nothing before debate starts
- ✅ Does nothing after debate ends

**Estimated Time:** 4-6 hours
**Files Created:** 3 test files (~150-200 test lines each)

---

## Phase 2: UI Component Testing (Unit Tests)

**Priority:** MEDIUM - Visual components with less critical logic

### Components to Test:
1. `DebateTimer.jsx` - Timer display component
2. `DeviceSettings.jsx` - Device selection dropdowns
3. `ModeratorControls.jsx` - Moderator action buttons

### Test Files to Create:
- `client/src/components/debate/__tests__/DebateTimer.test.jsx`
- `client/src/components/debate/__tests__/DeviceSettings.test.jsx`
- `client/src/components/debate/__tests__/ModeratorControls.test.jsx`

### What to Test:

#### DebateTimer
- ✅ Renders time in MM:SS format
- ✅ Shows "Your Turn" when isMyTurn=true
- ✅ Shows "Their Turn" when isMyTurn=false
- ✅ Changes color when time is low (<= 10s)
- ✅ Displays correct turn number and max turns
- ✅ Renders correct emoji (🎤 vs 👂)

#### DeviceSettings
- ✅ Renders camera dropdown with options
- ✅ Renders microphone dropdown with options
- ✅ Calls switchCamera when camera changes
- ✅ Calls switchMicrophone when mic changes
- ✅ Disables camera dropdown when no video track
- ✅ Disables mic dropdown when no audio track
- ✅ Shows device labels or fallback names

#### ModeratorControls
- ✅ Renders Pause button when debate not paused
- ✅ Renders Resume button when debate paused
- ✅ Calls pauseDebate when clicking Pause
- ✅ Calls resumeDebate when clicking Resume
- ✅ Calls addTime when clicking +30s
- ✅ Calls switchTurn when clicking Skip Turn
- ✅ Shows correct button styles

**Estimated Time:** 3-4 hours
**Files Created:** 3 test files (~50-100 test lines each)

---

## Phase 3: Service Layer Testing (Integration Tests)

**Priority:** HIGH - Critical business logic and Firebase integration

### Services to Test:
1. `debateStateService.js` - Debate state management
2. `chatService.js` - Chat functionality
3. `voteService.js` - Voting logic
4. `debateService.js` - Debate CRUD operations

### Test Files to Create:
- `client/src/services/__tests__/debateStateService.test.js`
- `client/src/services/__tests__/chatService.test.js`
- `client/src/services/__tests__/voteService.test.js`
- `client/src/services/__tests__/debateService.test.js`

### What to Test:

#### debateStateService
- ✅ initializeDebateState creates document with correct structure
- ✅ startDebate updates debateStarted flag
- ✅ pauseDebate saves current time and sets paused=true
- ✅ resumeDebate restores time and sets paused=false
- ✅ switchTurn alternates between debater_a and debater_b
- ✅ switchTurn increments turnNumber after debater_b
- ✅ addTime adds correct seconds to timeRemaining
- ✅ subscribeToDebateState returns real-time updates

#### chatService
- ✅ sendMessage creates message with correct fields
- ✅ subscribeToMessages returns messages in order
- ✅ Messages have timestamp, userId, username, text
- ✅ Handles missing user data gracefully

#### voteService
- ✅ castVote creates vote document
- ✅ castVote prevents duplicate votes
- ✅ getVoteResults calculates percentages correctly
- ✅ getVoteResults handles zero votes
- ✅ getUserVote returns user's existing vote

#### debateService
- ✅ createDebate creates debate with participants
- ✅ joinAsDebater updates participants subcollection
- ✅ joinAsModerator updates moderator field
- ✅ getDebate returns debate data
- ✅ getActiveDebates filters by status
- ✅ updateDebateStatus changes status field

**Estimated Time:** 6-8 hours
**Files Created:** 4 test files (~100-150 test lines each)

---

## Phase 4: Complex Component Integration Tests

**Priority:** MEDIUM - Test component interactions

### Components to Test:
1. `VideoDebateRoom.jsx` - Main debate component (with mocked Agora)

### Test Files to Create:
- `client/src/components/debate/__tests__/VideoDebateRoom.integration.test.jsx`

### What to Test:

#### VideoDebateRoom (Integration)
- ✅ Renders correctly for debater_a
- ✅ Renders correctly for debater_b
- ✅ Renders correctly for moderator
- ✅ Renders correctly for viewer
- ✅ Shows device settings only for debaters
- ✅ Shows moderator controls only for moderators
- ✅ Shows start button only for host
- ✅ Auto-mutes debater when not their turn
- ✅ Handles role changes (viewer → debater)
- ✅ Joins Agora channel with correct parameters
- ✅ Leaves channel on unmount
- ✅ Displays remote users
- ✅ Handles audio autoplay blocking
- ✅ Switches camera and microphone
- ✅ Fullscreen mode works

**Estimated Time:** 8-10 hours
**Files Created:** 1 large test file (~300-400 test lines)

---

## Phase 5: E2E Critical User Flows (Playwright)

**Priority:** HIGH - Tests real user scenarios

### Flows to Test:

#### Test 1: Authentication Flow
- ✅ User can sign up with email/password
- ✅ User can log in with email/password
- ✅ User can log out
- ✅ Protected routes redirect to login

#### Test 2: Debate Creation & Joining
- ✅ User can create a new debate
- ✅ User can browse debates
- ✅ User can join as debater_a
- ✅ Another user can join as debater_b
- ✅ Third user can join as moderator
- ✅ Fourth user joins as viewer

#### Test 3: Debate Lifecycle
- ✅ Host can start debate
- ✅ Timer counts down correctly
- ✅ Turn switches automatically after time expires
- ✅ Moderator can pause/resume debate
- ✅ Moderator can add time
- ✅ Moderator can skip turn
- ✅ Debate ends after max turns reached

#### Test 4: Video & Audio (WebRTC)
- ✅ Camera and microphone permissions granted
- ✅ Local video displays
- ✅ Remote video displays
- ✅ Debater is auto-muted when not their turn
- ✅ Debater is auto-unmuted on their turn
- ✅ Moderator can speak anytime
- ✅ Device switching works

#### Test 5: Chat & Voting
- ✅ User can send chat messages
- ✅ Messages appear in real-time for all users
- ✅ User can vote for debater_a
- ✅ User can vote for debater_b
- ✅ Vote percentages update in real-time
- ✅ User cannot vote twice

### Test Files to Create:
- `client/e2e/auth.spec.js`
- `client/e2e/debate-creation.spec.js`
- `client/e2e/debate-lifecycle.spec.js`
- `client/e2e/video-audio.spec.js`
- `client/e2e/chat-voting.spec.js`

**Estimated Time:** 12-16 hours
**Files Created:** 5 E2E test files (~100-200 lines each)

---

## Phase 6: Performance & Edge Cases

**Priority:** LOW - Nice to have

### Tests to Add:
- ✅ Multiple users joining simultaneously
- ✅ Network disconnection handling
- ✅ Firebase connection loss/recovery
- ✅ Agora connection loss/recovery
- ✅ Large number of chat messages
- ✅ Rapid device switching
- ✅ Browser refresh during debate

**Estimated Time:** 6-8 hours
**Files Created:** Various edge case tests added to existing files

---

## Testing Commands

```bash
# Unit & Integration Tests
npm test                    # Run all Vitest tests
npm run test:ui             # Run with Vitest UI
npm run test:coverage       # Run with coverage report

# E2E Tests
npm run test:e2e            # Run Playwright tests
npm run test:e2e:ui         # Run Playwright with UI
npm run test:e2e:debug      # Debug Playwright tests

# Run everything
npm test && npm run test:e2e
```

---

## Success Metrics

- ✅ **Unit Tests:** 80%+ coverage on hooks and services
- ✅ **Component Tests:** All UI components have basic render + interaction tests
- ✅ **Integration Tests:** Core user flows work end-to-end in Playwright
- ✅ **No Brittle Tests:** Tests don't break on minor UI changes
- ✅ **Fast Execution:** Unit tests run in < 10s, E2E in < 5min

---

## Notes

- **Mock Agora SDK heavily** in unit/integration tests (already configured in setup.js)
- **Use Firebase Emulators** for service tests (requires emulators running)
- **Playwright will handle real WebRTC** in E2E tests with camera/mic permissions
- **MSW mocks network requests** for unit tests without hitting real APIs
- **Test files use .test.js or .spec.js** extensions
- **E2E tests assume `npm run dev` is running** (Firebase emulators + frontend)

---

## Current Progress

- ✅ Testing stack installed (Vitest, Playwright, MSW)
- ✅ Vitest configured with React support
- ✅ Playwright configured with Chromium
- ✅ MSW configured for network mocking
- ✅ Test setup files created with Agora/Firebase mocks
- ⏳ Ready to start Phase 1: Custom Hooks Testing

---

## Recommended Next Steps

1. **Start with Phase 1** - Test custom hooks (useDebateState, useDebateTimer, useAutoMute)
2. **Move to Phase 3** - Test service layer (critical business logic)
3. **Add Phase 2** - Test UI components
4. **Implement Phase 5** - E2E critical flows
5. **Complete Phase 4** - Integration tests for VideoDebateRoom
6. **Add Phase 6** - Edge cases and performance tests

This order prioritizes the most critical and valuable tests first.
