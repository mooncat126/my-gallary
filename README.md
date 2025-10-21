# MyGallery App

A React Native app for browsing and favoriting artwork from various art museum APIs.

<img width="500" height="500" alt="ChatGPT_Image_2025年10月20日_01_33_24-removebg-preview" src="https://github.com/user-attachments/assets/bad7c6a0-f6f2-459f-b953-ddaa7697865b" />


## Email Login Implementation

This document outlines the implementation of email-based login functionality in the MyGallery app.

### Components Added

1. **Firebase Configuration** (`firebase.js`)
   - Setup for Firebase authentication and Firestore
   - Email/password authentication methods
   - User data storage functionality
   - Favorites synchronization between local storage and Firebase

2. **Login Screen** (`components/LoginScreen.tsx`)
   - Email/password input fields
   - Toggle between login and signup modes
   - Form validation and error handling
   - Consistent styling with the app's theme

3. **Auth Context** (`context/AuthContext.tsx`)
   - Authentication state management with React Context
   - User login/signup/logout functions
   - Favorites management (syncing between Firestore and local AsyncStorage)
   - Loading state handling

### App Flow Changes

The app now follows this authentication flow:
- On startup, checks for existing authentication state
- If not logged in, displays the Login/Signup screen
- If logged in, shows the main gallery interface with user email and logout button
- Favorites are now tied to user accounts and sync across devices

### Integration with Existing Features

- User's email is displayed in the top bar when logged in
- Logout button added in the header
- Favorite artwork functionality now saves to both AsyncStorage and Firebase (when logged in)
- Favorites are retrieved from Firebase on login

### Usage Instructions

1. **Configure Firebase**
   - Replace placeholder values in `firebase.js` with your Firebase project credentials

2. **Start the App**
   ```
   npm start
   ```

3. **User Flow**
   - New users: Sign up with email and password
   - Returning users: Log in with credentials
   - Favorites will sync automatically between devices when using the same account

### Future Enhancements

1. Password reset functionality
2. Social media login options (Google, Facebook, etc.)
3. Enhanced user profiles with custom avatars and display names
4. Email verification
