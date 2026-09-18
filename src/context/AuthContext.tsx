import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

export const app = initializeApp(config);
export const db = getFirestore(app, config.firestoreDatabaseId);
export const auth = getAuth(app);

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        // Fetch or create user profile
        const userRef = doc(db, 'users', fUser.uid);
        
try {
          // Parallelize Firestore getDoc and Admin API verify to cut wait times
          const tokenPromise = fUser.getIdToken();
          const userSnapPromise = getDoc(userRef);

          const [userSnap, token] = await Promise.all([userSnapPromise, tokenPromise]);
          
          let isAdmin = false;
          try {
            const res = await fetch('/api/admin/verify', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              isAdmin = data.isAdmin === true;
            }
          } catch (e) {
            console.error("Failed to verify admin status");
          }

          let profile: UserProfile;
          if (userSnap.exists()) {
            profile = { id: fUser.uid, ...userSnap.data() } as UserProfile;
            
            if (isAdmin && profile.role !== 'admin') {
              profile.role = 'admin';
              await setDoc(userRef, { role: 'admin' }, { merge: true });
            } else if (!isAdmin && profile.role === 'admin') {
              profile.role = 'student';
              await setDoc(userRef, { role: 'student' }, { merge: true });
            }
          } else {
            profile = {
              id: fUser.uid,
              name: fUser.displayName || 'Student',
              email: fUser.email || '',
              phone: '',
              username: fUser.email?.split('@')[0] || 'student',
              avatarUrl: fUser.photoURL || '',
              role: isAdmin ? 'admin' : 'student',
              isActive: true,
              twoFactorEnabled: false,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            };
            await setDoc(userRef, profile);
          }
          setUser(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setError("Failed to load user profile. Please try again.");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Ensure lastLoginAt is updated for existing user
      if (auth.currentUser) {
         const userRef = doc(db, 'users', auth.currentUser.uid);
         await setDoc(userRef, { lastLoginAt: new Date().toISOString() }, { merge: true });
      }
      return { success: true };
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
         msg = 'Invalid email or password.';
      }
      return { success: false, error: msg };
    }
  };

  const signupWithEmail = async (name: string, email: string, phone: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fUser = userCredential.user;
      
      // Update Firebase profile
      await updateFirebaseProfile(fUser, { displayName: name });
      
      // Create Firestore document
      const userRef = doc(db, 'users', fUser.uid);
      const profile: UserProfile = {
        id: fUser.uid,
        name: name,
        email: email,
        phone: phone,
        username: email.split('@')[0],
        avatarUrl: '',
        role: 'student', // default role
        isActive: true,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      await setDoc(userRef, profile);
      
      return { success: true };
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') msg = 'Email is already registered.';
      if (err.code === 'auth/weak-password') msg = 'Password is too weak. Please use at least 6 characters.';
      return { success: false, error: msg };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      setFirebaseUser(null);
      setUser(null);
      await signOut(auth);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const updateProfile = async (data: any) => {
    if (!firebaseUser) return { success: false, error: 'Unauthorized' };
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, data, { merge: true });
      setUser(prev => prev ? { ...prev, ...data } : null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, error, loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
