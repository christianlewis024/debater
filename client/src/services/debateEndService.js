import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  collection,
  increment,
  serverTimestamp 
} from 'firebase/firestore';

// Handle debate completion and winner calculation
export const handleDebateEnd = async (debateId) => {
  try {
    console.log('🏁 Handling debate end for:', debateId);

    // Get debate data
    const debateRef = doc(db, 'debates', debateId);
    const debateSnap = await getDoc(debateRef);
    
    if (!debateSnap.exists()) {
      console.log('Debate not found');
      return;
    }

    const debateData = debateSnap.data();

    // Get all participants
    const participantsRef = collection(db, `debates/${debateId}/participants`);
    const participantsSnap = await getDocs(participantsRef);
    
    const participants = {};
    participantsSnap.forEach(doc => {
      const data = doc.data();
      participants[data.role] = {
        id: doc.id,
        ...data
      };
    });

    const debaterA = participants.debater_a;
    const debaterB = participants.debater_b;

    if (!debaterA || !debaterB) {
      console.log('Missing debaters, cannot calculate winner');
      return;
    }

    // Get all votes
    const votesRef = collection(db, `debates/${debateId}/votes`);
    const votesSnap = await getDocs(votesRef);
    
    let votesForA = 0;
    let votesForB = 0;

    votesSnap.forEach(doc => {
      const vote = doc.data();
      if (vote.participantId === debaterA.userId) {
        votesForA++;
      } else if (vote.participantId === debaterB.userId) {
        votesForB++;
      }
    });

    console.log('📊 Vote count:', { debaterA: votesForA, debaterB: votesForB });

    // Determine winner
    let winnerId = null;
    let loserId = null;

    if (votesForA > votesForB) {
      winnerId = debaterA.userId;
      loserId = debaterB.userId;
    } else if (votesForB > votesForA) {
      winnerId = debaterB.userId;
      loserId = debaterA.userId;
    }
    // If tie, no winner/loser

    // Update stats for debater A
    const debaterARef = doc(db, 'users', debaterA.userId);
    await updateDoc(debaterARef, {
      'stats.totalDebates': increment(1),
      'stats.totalVotesReceived': increment(votesForA),
      'stats.wins': winnerId === debaterA.userId ? increment(1) : increment(0),
      'stats.losses': loserId === debaterA.userId ? increment(1) : increment(0),
      updatedAt: serverTimestamp()
    });

    // Update stats for debater B
    const debaterBRef = doc(db, 'users', debaterB.userId);
    await updateDoc(debaterBRef, {
      'stats.totalDebates': increment(1),
      'stats.totalVotesReceived': increment(votesForB),
      'stats.wins': winnerId === debaterB.userId ? increment(1) : increment(0),
      'stats.losses': loserId === debaterB.userId ? increment(1) : increment(0),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Stats updated for both debaters');

    // Mark debate as completed with results
    await updateDoc(debateRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      results: {
        debaterA: {
          userId: debaterA.userId,
          username: debaterA.profileData.username,
          votes: votesForA
        },
        debaterB: {
          userId: debaterB.userId,
          username: debaterB.profileData.username,
          votes: votesForB
        },
        winnerId: winnerId,
        totalVotes: votesForA + votesForB
      }
    });

    console.log('🎉 Debate marked as completed');

    return {
      winnerId,
      loserId,
      votesForA,
      votesForB
    };
  } catch (error) {
    console.error('❌ Error handling debate end:', error);
    throw error;
  }
};

// Schedule debate deletion after voting period
export const scheduleDebateDeletion = async (debateId, delayMinutes = 30) => {
  console.log(`⏰ Scheduling debate deletion in ${delayMinutes} minutes`);
  
  // Mark debate for deletion
  const debateRef = doc(db, 'debates', debateId);
  await updateDoc(debateRef, {
    scheduledDeletion: new Date(Date.now() + delayMinutes * 60 * 1000)
  });
};

// Delete debate and all subcollections
export const deleteDebate = async (debateId) => {
  try {
    console.log('🗑️ Deleting debate:', debateId);

    // Delete subcollections
    const subcollections = ['participants', 'votes', 'messages', 'turns', 'references'];
    
    for (const subcollection of subcollections) {
      const subRef = collection(db, `debates/${debateId}/${subcollection}`);
      const snapshot = await getDocs(subRef);
      
      for (const document of snapshot.docs) {
        await deleteDoc(doc(db, `debates/${debateId}/${subcollection}`, document.id));
      }
    }

    // Delete debate state
    try {
      await deleteDoc(doc(db, 'debateStates', debateId));
    } catch (e) {
      console.log('No debate state to delete');
    }

    // Delete main debate document
    await deleteDoc(doc(db, 'debates', debateId));

    console.log('✅ Debate deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting debate:', error);
    throw error;
  }
};

// Check and cleanup old debates (call this periodically)
export const cleanupOldDebates = async () => {
  try {
    const debatesRef = collection(db, 'debates');
    const snapshot = await getDocs(debatesRef);
    
    const now = Date.now();
    
    for (const document of snapshot.docs) {
      const data = document.data();
      
      if (data.scheduledDeletion) {
        const deletionTime = data.scheduledDeletion.toMillis();
        
        if (now >= deletionTime) {
          console.log('Cleaning up old debate:', document.id);
          await deleteDebate(document.id);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old debates:', error);
  }
};
