import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

// Cast a vote
export const castVote = async (debateId, userId, participantId) => {
  try {
    // Check if user already voted
    const votesRef = collection(db, `debates/${debateId}/votes`);
    const q = query(votesRef, where('userId', '==', userId));
    const existingVotes = await getDocs(q);
    
    if (!existingVotes.empty) {
      throw new Error('You have already voted in this debate');
    }
    
    // Add vote
    await addDoc(votesRef, {
      userId,
      participantId,
      votedAt: serverTimestamp()
    });
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
