import { db } from './firebase';
import { doc, setDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';

// Initialize debate state
export const initializeDebateState = async (debateId, settings) => {
  const docRef = doc(db, 'debateStates', debateId);
  const docSnap = await getDoc(docRef);
  
  // Only create if it doesn't exist
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      currentTurn: 'debater_a',
      turnNumber: 1,
      timeRemaining: settings.turnTime || 60,
      debateStarted: false,
      debateEnded: false,
      maxTurns: settings.maxTurns || 10,
      turnTime: settings.turnTime || 60,
      lastUpdate: new Date()
    });
  }
};

// Start the debate
export const startDebate = async (debateId) => {
  await updateDoc(doc(db, 'debateStates', debateId), {
    debateStarted: true,
    lastUpdate: new Date()
  });
};

// Switch to next turn
export const switchTurn = async (debateId, debateState) => {
  const nextTurn = debateState.currentTurn === 'debater_a' ? 'debater_b' : 'debater_a';
  const nextTurnNumber = debateState.currentTurn === 'debater_b' ? debateState.turnNumber + 1 : debateState.turnNumber;
  
  // Check if debate should end
  if (nextTurnNumber > debateState.maxTurns) {
    await updateDoc(doc(db, 'debateStates', debateId), {
      debateEnded: true,
      lastUpdate: new Date()
    });
    return;
  }

  await updateDoc(doc(db, 'debateStates', debateId), {
    currentTurn: nextTurn,
    turnNumber: nextTurnNumber,
    timeRemaining: debateState.turnTime,
    lastUpdate: new Date()
  });
};

// Update time remaining
export const updateTimeRemaining = async (debateId, timeRemaining) => {
  await updateDoc(doc(db, 'debateStates', debateId), {
    timeRemaining: timeRemaining,
    lastUpdate: new Date()
  });
};

// End debate
export const endDebate = async (debateId) => {
  await updateDoc(doc(db, 'debateStates', debateId), {
    debateEnded: true,
    lastUpdate: new Date()
  });
};

// Pause debate (moderator only) - save current time
export const pauseDebate = async (debateId, currentTimeRemaining) => {
  await updateDoc(doc(db, 'debateStates', debateId), {
    paused: true,
    timeRemaining: currentTimeRemaining, // Save the current time
    lastUpdate: new Date()
  });
};

// Resume debate (moderator only)
export const resumeDebate = async (debateId) => {
  await updateDoc(doc(db, 'debateStates', debateId), {
    paused: false,
    lastUpdate: new Date()
  });
};

// Add time (moderator only)
export const addTime = async (debateId, seconds) => {
  const docRef = doc(db, 'debateStates', debateId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const currentTime = docSnap.data().timeRemaining;
    await updateDoc(docRef, {
      timeRemaining: currentTime + seconds,
      lastUpdate: new Date()
    });
  }
};

// Subscribe to debate state
export const subscribeToDebateState = (debateId, callback) => {
  const docRef = doc(db, 'debateStates', debateId);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to debate state:', error);
    callback(null);
  });
};
