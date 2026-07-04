// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  getIdTokenResult
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../services/firebase';
import { callEnsureUserProfile } from '../services/adminFunctions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Maps Firebase auth user format to match application expectation
  const mapFirebaseUser = (fbUser) => {
    if (!fbUser) return null;
    return {
      uid: fbUser.uid,
      id: fbUser.uid,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Anonymous',
      email: fbUser.email,
      photoURL: fbUser.photoURL || '',
    };
  };

  const handleUserLoginSuccess = async (currentUser) => {
    if (!currentUser) return;

    try {
      // Force refresh the token to retrieve the latest Custom Claims (like admin status)
      const idTokenResult = await getIdTokenResult(currentUser, true);
      const mapped = mapFirebaseUser(currentUser);
      const emailLower = mapped.email ? mapped.email.toLowerCase() : '';

      // Check if user is one of the initial admin emails
      const isInitialAdmin = emailLower === 'admin@rit.ac.in' || 
                             emailLower === 'bhagathkrishnan06@gmail.com' || 
                             emailLower === '24bb16641@rit.ac.in';

      let isUserAdmin = !!idTokenResult.claims.admin || isInitialAdmin;

      // Enforce email domain restrictions: allow only @rit.ac.in (or admin accounts)
      const isRitEmail = emailLower && emailLower.endsWith('@rit.ac.in');
      if (!isUserAdmin && !isRitEmail && !isInitialAdmin) {
        await signOut(auth);
        setError('Access restricted to @rit.ac.in accounts only.');
        setUser(null);
        setIsAdmin(false);
        return;
      }

      // Verify if profile exists in db and check active status
      if (db) {
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          // Only hard-block if explicitly deactivated
          if (userData.isActive === false) {
            await signOut(auth);
            setError('Your account has been deactivated by an admin.');
            setUser(null);
            setIsAdmin(false);
            return;
          }
          // Enable client-side admin privileges if role/isAdmin is set in DB
          if (userData.isAdmin === true || userData.role === 'admin') {
            isUserAdmin = true;
          }
          // Try to patch isActive if missing — non-fatal if it fails
          if (userData.isActive === undefined) {
            try {
              await updateDoc(userRef, { isActive: true });
            } catch (patchErr) {
              console.warn('Could not patch isActive (non-fatal):', patchErr.code);
            }
          }
        } else {
          // Profile does not exist, trigger server-side initialization
          try {
            await callEnsureUserProfile();
          } catch (createErr) {
            console.warn('Could not create user profile via Cloud Function, running client fallback:', createErr);
            try {
              await setDoc(userRef, {
                uid: currentUser.uid,
                name: currentUser.displayName || 'Anonymous',
                email: currentUser.email,
                photoURL: currentUser.photoURL || '',
                totalPoints: 0,
                predictionsCount: 0,
                isActive: true,
                isAdmin: isUserAdmin,
                createdAt: serverTimestamp()
              });
            } catch (fallbackErr) {
              console.error('Client-side fallback profile creation failed:', fallbackErr);
            }
          }
        }
      }

      setIsAdmin(isUserAdmin);
      setUser(mapped);
    } catch (err) {
      console.error('Login success handler error:', err);
      setError(err.message || 'Error parsing user profile.');
      setUser(null);
      setIsAdmin(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    if (!auth || !googleProvider) {
      setError('Authentication service is not configured.');
      setLoading(false);
      return;
    }
    try {
      // Try popup first (more reliable on desktop, bypasses third-party cookie blocking)
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        await handleUserLoginSuccess(result.user);
      }
    } catch (err) {
      console.warn("Popup sign-in failed, trying redirect fallback:", err);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr) {
        console.error('OAuth sign-in error:', redirectErr);
        setError(redirectErr.message || 'An error occurred during authentication.');
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        throw redirectErr;
      }
    }
  };

  const loginMockUser = async () => {
    setError('Mock login is disabled in production.');
    console.warn("Mock login attempt blocked.");
  };

  const loginAdmin = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      if (!auth) {
        throw new Error('Authentication service is not configured.');
      }

      // Try Firebase auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;

      // Verify admin status from Custom Claims (or email or Firestore)
      const idTokenResult = await getIdTokenResult(currentUser, true);
      const emailLower = currentUser.email ? currentUser.email.toLowerCase() : '';
      const isInitialAdmin = emailLower === 'admin@rit.ac.in' || 
                             emailLower === 'bhagathkrishnan06@gmail.com' || 
                             emailLower === '24bb16641@rit.ac.in';
      
      let isUserAdmin = !!idTokenResult.claims.admin || isInitialAdmin;

      if (db) {
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.isActive === false) {
            await signOut(auth);
            throw new Error('Your account has been deactivated by an admin.');
          }
          if (userData.isAdmin === true || userData.role === 'admin') {
            isUserAdmin = true;
          }
        }
      }

      if (!isUserAdmin) {
        await signOut(auth);
        throw new Error('Access denied. This account does not have administrator privileges.');
      }

      setIsAdmin(true);
      setUser(mapFirebaseUser(currentUser));
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message || 'Authentication failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    setLoading(true);
    if (!auth) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Handle incoming redirect results (e.g. from Google login)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          await handleUserLoginSuccess(result.user);
        }
      })
      .catch((err) => {
        console.error("Error handling redirect result:", err);
        setError(err.message);
      });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setError(null);
      if (currentUser) {
        try {
          await handleUserLoginSuccess(currentUser);
        } catch (err) {
          setError(err.message || 'Authentication failed.');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, error, loginWithGoogle, loginMockUser, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
