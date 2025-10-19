import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, subscribeToAuthChanges, getUserData, saveFavorites, loginWithEmail, createUserAccount, logoutUser } from '../firebase';

// Define the context type
// 用户信息类型
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: any;
}

interface AuthContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  favorites: Set<string>;
  toggleFavorite: (id: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean, error: string | null }>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  login: async () => ({ error: 'Not implemented' }),
  signup: async () => ({ error: 'Not implemented' }),
  logout: async () => {},
  favorites: new Set<string>(),
  toggleFavorite: async () => {},
  updateProfile: async () => ({ success: false, error: 'Not implemented' }),
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load user and favorites on mount
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (authUser) => {
      setUser(authUser);

      if (authUser) {
        // User is signed in, load their favorites from Firestore
        try {
          const { data } = await getUserData(authUser.uid);
          if (data && data.favorites) {
            setFavorites(new Set(data.favorites));
          } else {
            // If no favorites in Firestore, try to migrate from AsyncStorage
            const localFavorites = await AsyncStorage.getItem('favorites');
            if (localFavorites) {
              const parsedFavorites = JSON.parse(localFavorites);
              setFavorites(new Set(parsedFavorites));
              // Save local favorites to Firestore
              await saveFavorites(authUser.uid, parsedFavorites);
            }
          }
        } catch (error) {
          console.error("Error loading user favorites:", error);
        }
      } else {
        // User is not signed in, load favorites from AsyncStorage
        try {
          const localFavorites = await AsyncStorage.getItem('favorites');
          if (localFavorites) {
            setFavorites(new Set(JSON.parse(localFavorites)));
          }
        } catch (error) {
          console.error("Error loading local favorites:", error);
        }
      }

      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      // Using the imported function from firebase.js
      const { user, error } = await loginWithEmail(email, password);
      if (error) {
        return { error };
      }
      if (user) {
        // Add default profile values if missing
        const profileData: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          photoURL: user.photoURL || undefined,
          createdAt: user.createdAt || new Date(),
        };
        setUser(profileData);
      }
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  // Signup function
  const signup = async (email: string, password: string) => {
    try {
      const { user, error } = await createUserAccount(email, password);
      if (error) {
        return { error };
      }
      if (user) {
        setUser(user);
      }
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (id: string) => {
    const newFavorites = new Set(favorites);

    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }

    setFavorites(newFavorites);

    // Save to AsyncStorage for all users
    await AsyncStorage.setItem('favorites', JSON.stringify([...newFavorites]));

    // If user is signed in, also save to Firestore
    if (user) {
      try {
        await saveFavorites(user.uid, [...newFavorites]);
      } catch (error) {
        console.error("Error saving favorites to Firestore:", error);
      }
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      return { success: false, error: 'User not logged in' };
    }

    try {
      // Update local user state
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);

      // Save to AsyncStorage to persist locally
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedUser));

      // In a real app, we would also update Firestore
      // Here we're just simulating success
      console.log('Profile updated:', updatedUser);

      return { success: true, error: null };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        login,
        signup,
        logout,
        favorites,
        toggleFavorite,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;