import { db, rtdb } from './firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { ref, onValue, set, onDisconnect, remove } from 'firebase/database';

// Send a chat message
export const sendChatMessage = async (debateId, userId, username, content) => {
  try {
    const messagesRef = collection(db, `debates/${debateId}/messages`);
    await addDoc(messagesRef, {
      userId,
      username,
      content,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Subscribe to chat messages
export const subscribeToChatMessages = (debateId, callback) => {
  try {
    const messagesRef = collection(db, `debates/${debateId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));
    
    return onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data
        });
      });
      callback(messages);
    });
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    return () => {};
  }
};

// Join as active viewer (Realtime Database)
export const joinAsViewer = (debateId, userId) => {
  try {
    const viewerRef = ref(rtdb, `activeViewers/${debateId}/${userId}`);
    
    // Set viewer as present
    set(viewerRef, {
      timestamp: Date.now(),
      online: true
    });
    
    // Remove on disconnect
    onDisconnect(viewerRef).remove();
    
    return () => remove(viewerRef);
  } catch (error) {
    console.error('Error joining as viewer:', error);
    return () => {};
  }
};

// Subscribe to viewer count
export const subscribeToViewerCount = (debateId, callback) => {
  try {
    const viewersRef = ref(rtdb, `activeViewers/${debateId}`);
    
    return onValue(viewersRef, (snapshot) => {
      const viewers = snapshot.val();
      const count = viewers ? Object.keys(viewers).length : 0;
      callback(count);
    });
  } catch (error) {
    console.error('Error subscribing to viewers:', error);
    callback(0);
    return () => {};
  }
};

// Get debate participants
export const subscribeToParticipants = (debateId, callback) => {
  try {
    const participantsRef = collection(db, `debates/${debateId}/participants`);
    
    return onSnapshot(participantsRef, (snapshot) => {
      const participants = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        participants[data.role] = {
          id: doc.id,
          ...data
        };
      });
      callback(participants);
    });
  } catch (error) {
    console.error('Error subscribing to participants:', error);
    return () => {};
  }
};
