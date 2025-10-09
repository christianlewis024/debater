import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit
} from 'firebase/firestore';

// Create a new debate
export const createDebate = async (debateData, userId, username) => {
  try {
    const debatesRef = collection(db, 'debates');
    const docRef = await addDoc(debatesRef, {
      ...debateData,
      hostId: userId,
      hostUsername: username,
      status: 'waiting',
      createdAt: serverTimestamp(),
      currentTurn: null,
      turnStartedAt: null,
      stats: {
        totalViewers: 0,
        currentViewers: 0
      }
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating debate:', error);
    throw error;
  }
};

// Get all debates (simplified - no orderBy to avoid index issues)
export const getDebates = async (filters = {}) => {
  try {
    let q = collection(db, 'debates');
    
    // Apply filters
    if (filters.category && filters.category !== 'all') {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    // Limit results
    q = query(q, limit(50));
    
    const snapshot = await getDocs(q);
    const debates = [];
    snapshot.forEach(doc => {
      debates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort on client side
    debates.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
    
    return debates;
  } catch (error) {
    console.error('Error getting debates:', error);
    throw error;
  }
};

// Get single debate
export const getDebate = async (debateId) => {
  try {
    const docRef = doc(db, 'debates', debateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Debate not found');
    }
  } catch (error) {
    console.error('Error getting debate:', error);
    throw error;
  }
};

// Subscribe to debate updates (real-time)
export const subscribeToDebate = (debateId, callback) => {
  const debateRef = doc(db, 'debates', debateId);
  return onSnapshot(debateRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({
        id: snapshot.id,
        ...snapshot.data()
      });
    }
  });
};

// Subscribe to debates list (real-time) - simplified
export const subscribeToDebates = (callback, filters = {}) => {
  try {
    let q = collection(db, 'debates');
    
    if (filters.category && filters.category !== 'all') {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    // No orderBy to avoid index requirement
    q = query(q, limit(50));
    
    return onSnapshot(q, (snapshot) => {
      const debates = [];
      snapshot.forEach(doc => {
        debates.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort on client side
      debates.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      
      callback(debates);
    }, (error) => {
      console.error('Error subscribing to debates:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Error in subscribeToDebates:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Join debate as participant
export const joinDebate = async (debateId, userId, userProfile, side, sideDescription) => {
  try {
    const participantsRef = collection(db, `debates/${debateId}/participants`);
    await addDoc(participantsRef, {
      userId: userId,
      role: side,
      sideDescription: sideDescription,
      joinedAt: serverTimestamp(),
      profileData: {
        username: userProfile.username,
        photoURL: userProfile.photoURL
      }
    });
  } catch (error) {
    console.error('Error joining debate:', error);
    throw error;
  }
};

// Update debate status
export const updateDebateStatus = async (debateId, status) => {
  try {
    const debateRef = doc(db, 'debates', debateId);
    await updateDoc(debateRef, {
      status: status
    });
  } catch (error) {
    console.error('Error updating debate status:', error);
    throw error;
  }
};
