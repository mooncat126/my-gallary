# MyGallery App
<img width="500" height="500" alt="MyGallery App" src="https://github.com/user-attachments/assets/bad7c6a0-f6f2-459f-b953-ddaa7697865b" />

A React Native app for browsing and favoriting artwork from various art museum APIs with BFF (Backend-for-Frontend) architecture.


## Features

- Browse artwork from multiple museum APIs (Metropolitan Museum of Art and Art Institute of Chicago)
- User authentication with email/password
- Save favorite artworks to your personal collection
- Daily artwork recommendations
- Dark and light mode support
- Responsive design for various device sizes
- Integrated message component for notifications

| | | |
|:-:|:-:|:-:|
| <img width="300" src="https://github.com/user-attachments/assets/369dd31f-9ad9-4686-9aae-69231380e5e9" /> | <img width="300" src="https://github.com/user-attachments/assets/c8db963c-2bdd-449b-b266-bbed1a476ec9" /> | <img width="300" src="https://github.com/user-attachments/assets/5d482b69-af32-441d-aa4a-811ce9727475" /> |
| <img width="300" src="https://github.com/user-attachments/assets/54e4529b-f1f3-486a-a28d-30b2d6934065" /> | <img width="300" src="https://github.com/user-attachments/assets/56954425-5b1a-4d98-ae31-750f6f2825c6" /> | <img width="300" src="https://github.com/user-attachments/assets/547c0060-b367-4984-94e1-c6ee5f103362" /> |
| <img width="300" src="https://github.com/user-attachments/assets/d7bf0459-071b-4bdb-8a7e-e066f22de499" /> | <img width="300" src="https://github.com/user-attachments/assets/ed0980e0-4e50-482c-8307-eaab52f6061a" /> | <img width="300" src="https://github.com/user-attachments/assets/dbc851c8-eb12-4585-a3bc-4af15997a160" /> |

## Project Structure

The project is split into two main parts:

1. **React Native Client** (this repository)
   - Handles UI rendering and user interactions
   - Makes API calls to the BFF server
   - Manages local state and authentication

2. **BFF (Backend-for-Frontend) Server** (separate repository: `/bff`)
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
   cd ../bff
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
cd ../bff
npm run dev
# or
yarn dev
```

The BFF server will run on http://localhost:3000.

### Start the React Native App

```
npm run ios
# or
yarn ios
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

### Test Account

For testing purposes, you can use the following credentials:
- **Email**: test@user.com
- **Password**: password123

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
