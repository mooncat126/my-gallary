# MyGallery App

A React Native app for browsing and favoriting artwork from various art museum APIs with BFF (Backend-for-Frontend) architecture.

<img width="500" height="500" alt="MyGallery App" src="https://github.com/user-attachments/assets/bad7c6a0-f6f2-459f-b953-ddaa7697865b" />

## Features

- Browse artwork from multiple museum APIs (Metropolitan Museum of Art and Art Institute of Chicago)
- User authentication with email/password
- Save favorite artworks to your personal collection
- Daily artwork recommendations
- Dark and light mode support
- Responsive design for various device sizes
- Integrated message component for notifications

## Project Structure

The project is split into two main parts:

1. **React Native Client** (this repository)
   - Handles UI rendering and user interactions
   - Makes API calls to the BFF server
   - Manages local state and authentication

2. **BFF (Backend-for-Frontend) Server** (separate repository: `/my-bff`)
   - Built with Next.js
   - Provides API endpoints for searching artwork and daily recommendations
   - Handles data aggregation and deduplication from multiple sources
   - Provides caching to improve performance

## Setup Instructions

### Prerequisites

- Node.js 16.x or later
- npm or yarn
- Expo CLI

### Setting up the React Native Client

1. Clone this repository
2. Install dependencies:
   ```
   yarn install
   # or
   npm install
   ```
3. Configure the environment variables:
   - Create a `.env` file in the root directory
   - Add `EXPO_PUBLIC_API_BASE=http://localhost:3000` to point to your BFF server

### Setting up the BFF Server

1. Navigate to the BFF directory:
   ```
   cd ../my-bff
   ```
2. Install dependencies:
   ```
   yarn install
   # or
   npm install
   ```
3. Configure the environment variables:
   - Create a `.env` file in the BFF directory
   - Add `NEXT_PUBLIC_BASE_URL=http://localhost:3000` for self-referencing API calls

## Running the Application

### Start the BFF Server

```
cd ../my-bff
npm run dev
# or
yarn dev
```

The BFF server will run on http://localhost:3000.

### Start the React Native App

```
npm start
# or
yarn start
```

This will start the Expo development server, allowing you to run the app on a simulator/emulator or physical device.

## BFF Architecture

The Backend-for-Frontend (BFF) pattern is implemented in this project to:

1. **Simplify Client Logic**: Move data fetching and deduplication logic from React Native to the server
2. **Improve Performance**: Add server-side caching for API responses
3. **Aggregate Multiple Sources**: Combine data from different museum APIs into a unified format

### BFF API Endpoints

- `/api/search?q={keyword}` - Search for artwork from multiple sources
- `/api/today` - Get a random artwork recommendation for the day

### Implementation Details

The BFF server:
- Fetches from both MET and Art Institute of Chicago APIs
- Deduplicates artwork by artist and title to avoid redundancy
- Implements caching strategies for improved performance
- Provides a consistent API format for the frontend

## Authentication

The app uses Firebase Authentication for user management:

1. **Sign Up/Login**: Email and password authentication
2. **User Data**: Profile information stored in Firebase
3. **Favorites Sync**: Favorites are stored both locally and in Firebase for cross-device access

## Future Enhancements

1. Password reset functionality
2. Social media login options (Google, Facebook, etc.)
3. Enhanced user profiles with custom avatars and display names
4. Email verification
5. Offline mode support

## License

This project is for personal use and learning purposes.

## Contributing

If you'd like to contribute, please fork the repository and make changes as you'd like. Pull requests are warmly welcome.