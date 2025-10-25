import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  setDoc,
  deleteDoc
} from 'firebase/firestore';

// Cast or change a vote
export const castVote = async (debateId, userId, participantId) => {
  try {
    // Check if user already voted
    const votesRef = collection(db, `debates/${debateId}/votes`);
    const q = query(votesRef, where('userId', '==', userId));
    const existingVotes = await getDocs(q);

    if (!existingVotes.empty) {
      // User has already voted - update their vote
      const existingVoteDoc = existingVotes.docs[0];
      const existingVoteId = existingVoteDoc.id;
      const existingParticipantId = existingVoteDoc.data().participantId;

      // If voting for the same person, do nothing
      if (existingParticipantId === participantId) {
        return;
      }

      // Delete old vote and create new one
      await deleteDoc(doc(db, `debates/${debateId}/votes`, existingVoteId));
      await addDoc(votesRef, {
        userId,
        participantId,
        votedAt: serverTimestamp()
      });
    } else {
      // First time voting - add vote
      await addDoc(votesRef, {
        userId,
        participantId,
        votedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error casting vote:', error);
    throw error;
  }
};

// Get vote counts
export const getVoteCounts = async (debateId) => {
  try {
    const votesRef = collection(db, `debates/${debateId}/votes`);
    const snapshot = await getDocs(votesRef);
    
    const counts = {};
    let total = 0;
    
    snapshot.forEach(doc => {
      const participantId = doc.data().participantId;
      counts[participantId] = (counts[participantId] || 0) + 1;
      total++;
    });
    
    return { counts, total };
  } catch (error) {
    console.error('Error getting vote counts:', error);
    return { counts: {}, total: 0 };
  }
};

// Check if user has voted
export const hasUserVoted = async (debateId, userId) => {
  try {
    const votesRef = collection(db, `debates/${debateId}/votes`);
    const q = query(votesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking vote:', error);
    return false;
  }
};

// Get which participant the user voted for
export const getUserVote = async (debateId, userId) => {
  try {
    const votesRef = collection(db, `debates/${debateId}/votes`);
    const q = query(votesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data().participantId;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
};
