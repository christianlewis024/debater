# Clean Up Old Participant Documents

If you're having issues with participants being replaced or debates showing multiple people in the same role, you may have old participant documents from before the fix.

## Quick Fix - Run in Browser Console

1. Go to your deployed debate page
2. Open Developer Tools (F12)
3. Go to Console tab
4. Paste this code and press Enter:

```javascript
// Clean up old participant documents
async function cleanupParticipants(debateId) {
  const { collection, getDocs, deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  const { db } = await import('/src/services/firebase.js');
  
  const participantsRef = collection(db, `debates/${debateId}/participants`);
  const snapshot = await getDocs(participantsRef);
  
  let deleted = 0;
  for (const document of snapshot.docs) {
    // Delete documents that don't have the role as their ID
    // (old format used random IDs)
    if (document.id !== document.data().role) {
      await deleteDoc(doc(db, `debates/${debateId}/participants`, document.id));
      deleted++;
      console.log('Deleted old participant:', document.id);
    }
  }
  
  console.log(`Cleaned up ${deleted} old participant documents`);
}

// Replace 'YOUR_DEBATE_ID' with the actual debate ID from the URL
cleanupParticipants('YOUR_DEBATE_ID');
```

## Or Manually in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database**
4. Navigate to: `debates/[your-debate-id]/participants`
5. Delete any documents that have random IDs (not "debater_a", "debater_b", or "moderator")

## The Fix

The new code now uses the role itself as the document ID:
- Document ID: `debater_a` → Contains debater A's info
- Document ID: `debater_b` → Contains debater B's info
- Document ID: `moderator` → Contains moderator's info

This prevents duplicates and ensures only one person per role!
