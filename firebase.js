// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Export the auth and db services
export { auth, db };

// Authentication functions
export const createUserAccount = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// export const loginWithEmail = async (email, password) => {
//   try {
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     return { user: userCredential.user, error: null };
//   } catch (error) {
//     return { user: null, error: error.message };
//   }
// };

// mock login for testing UI without Firebase
export const loginWithEmail = async (email, password) => {
  console.log('Attempting login with:', email, password);
  // Add a small delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 500));

  if (email === 'test@test.com' && password === '123456') {
    console.log('Login successful');
    return {
      user: {
        uid: 'demoUser123',
        email,
        displayName: 'Test User',
        photoURL: null,
        createdAt: new Date().toISOString(),
      },
      error: null
    };
  } else {
    console.log('Login failed: Invalid credentials');
    return { user: null, error: 'Invalid test credentials. Use test@example.com/123456' };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// User data functions
export const createUserData = async (userId, userData) => {
  try {
    await setDoc(doc(db, "users", userId), {
      ...userData,
      createdAt: new Date(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update user profile (mock function)
export const updateUserProfile = async (userId, profileData) => {
  try {
    console.log(`Updating user profile for ${userId}:`, profileData);
    // In a real app, this would update Firestore
    // Simulate successful update after a delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserData = async (userId) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { data: docSnap.data(), error: null };
    } else {
      return { data: null, error: "No user document found" };
    }
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// Favorites management
export const saveFavorites = async (userId, favorites) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      favorites: favorites,
      updatedAt: new Date(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Auth state observer
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};