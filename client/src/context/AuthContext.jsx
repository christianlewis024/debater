import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Generate a random emoji avatar
const getRandomEmoji = () => {
  const emojis = ['🐶', '🐱', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🦉', '🦅', '🦆', '🐧', '🦈', '🐙', '🦋', '🐝', '🐢', '🦖', '🦕'];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  const signUp = async (email, password, username) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Use emoji as default profile picture
    const emoji = getRandomEmoji();

    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName: username,
      photoURL: emoji
    });

    // Create user profile in Firestore
    const userProfileData = {
      uid: user.uid,
      email: user.email,
      username: username,
      displayName: username,
      photoURL: emoji,
      emoji: emoji,
      bio: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalDebates: 0,
        wins: 0,
        losses: 0,
        totalVotesReceived: 0, // New: track total votes across all debates
        totalVotesCast: 0 // New: track how many votes they've cast
      }
    };

    await setDoc(doc(db, 'users', user.uid), userProfileData);

    // Immediately set the user profile in state
    setUserProfile(userProfileData);

    return user;
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user profile exists, if not create it
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      // Use emoji as fallback if no Google photo
      const randomEmoji = getRandomEmoji();
      const photoURL = user.photoURL || randomEmoji;

      const userProfileData = {
        uid: user.uid,
        email: user.email,
        username: user.displayName || user.email.split('@')[0],
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: photoURL,
        emoji: randomEmoji,
        bio: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
          totalDebates: 0,
          wins: 0,
          losses: 0,
          totalVotesReceived: 0,
          totalVotesCast: 0
        }
      };

      await setDoc(doc(db, 'users', user.uid), userProfileData);

      // Immediately set the user profile in state
      setUserProfile(userProfileData);
    } else {
      // Update with Google photo if it changed
      const existingData = userDoc.data();
      if (user.photoURL && user.photoURL !== existingData.photoURL) {
        const updatedData = {
          ...existingData,
          photoURL: user.photoURL,
          updatedAt: new Date()
        };
        await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
        setUserProfile(updatedData);
      } else {
        setUserProfile(existingData);
      }
    }

    return user;
  };

  // Log out
  const logOut = () => {
    return signOut(auth);
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Use actual Firebase Auth photo if available
        if (auth.currentUser?.photoURL) {
          data.photoURL = auth.currentUser.photoURL;
        }
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signUp,
    signIn,
    signInWithGoogle,
    logOut,
    loading,
    refreshUserProfile: () => currentUser && fetchUserProfile(currentUser.uid)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
