import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  updateDoc,
  getDoc
} from 'firebase/firestore';

/**
 * Join the waitlist for a debate as CON position
 * @param {string} debateId - The debate ID
 * @param {string} userId - User's ID
 * @param {string} username - User's username
 * @param {string} photoURL - User's photo URL
 * @param {string} stance - Brief sentence explaining their CON stance
 */
export const joinWaitlist = async (debateId, userId, username, photoURL, stance) => {
  const waitlistRef = doc(db, 'debates', debateId, 'waitlist', userId);
  await setDoc(waitlistRef, {
    userId,
    username,
    photoURL,
    stance,
    joinedAt: Timestamp.now(),
    position: 'con' // Self-moderated debates always have host as PRO, challengers as CON
  });
};

/**
 * Leave the waitlist
 * @param {string} debateId - The debate ID
 * @param {string} userId - User's ID
 */
export const leaveWaitlist = async (debateId, userId) => {
  const waitlistRef = doc(db, 'debates', debateId, 'waitlist', userId);
  await deleteDoc(waitlistRef);
};

/**
 * Subscribe to waitlist updates
 * @param {string} debateId - The debate ID
 * @param {function} callback - Callback function with array of waitlist entries
 * @returns {function} Unsubscribe function
 */
export const subscribeToWaitlist = (debateId, callback) => {
  const waitlistRef = collection(db, 'debates', debateId, 'waitlist');
  const q = query(waitlistRef, orderBy('joinedAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const waitlistEntries = [];
    snapshot.forEach((doc) => {
      waitlistEntries.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(waitlistEntries);
  }, (error) => {
    console.error('Error subscribing to waitlist:', error);
    callback([]);
  });
};

/**
 * Accept a user from waitlist as debater_b (CON position)
 * Removes current debater_b if exists, moves waitlist user to debater_b
 * @param {string} debateId - The debate ID
 * @param {string} userId - Waitlist user's ID
 * @param {object} userData - User's data (username, photoURL, stance)
 */
export const acceptFromWaitlist = async (debateId, userId, userData) => {
  const participantRef = doc(db, 'debates', debateId, 'participants', 'debater_b');

  // Set the new debater_b
  await setDoc(participantRef, {
    userId: userId,
    role: 'debater_b',
    sideDescription: userData.stance,
    profileData: {
      username: userData.username,
      photoURL: userData.photoURL
    },
    joinedAt: Timestamp.now()
  });

  // Remove from waitlist
  await leaveWaitlist(debateId, userId);
};

/**
 * Remove current debater_b (for self-moderated debates)
 * @param {string} debateId - The debate ID
 */
export const removeDebater = async (debateId) => {
  const participantRef = doc(db, 'debates', debateId, 'participants', 'debater_b');
  await deleteDoc(participantRef);

  // Reset debate state if debate was ongoing
  const debateStateRef = doc(db, 'debateStates', debateId);
  const debateStateSnap = await getDoc(debateStateRef);

  if (debateStateSnap.exists() && debateStateSnap.data().debateStarted) {
    await updateDoc(debateStateRef, {
      debateStarted: false,
      debateEnded: false,
      currentTurn: 'debater_a',
      turnNumber: 1,
      paused: false
    });
  }
};
