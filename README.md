# MovieFy — Movie & TV Series Discovery, Tracking and Streaming Platform

MovieFy is a hybrid (Web & Mobile) platform that enables users to discover up-to-date movies and TV series, analyze detailed media info, watch official trailers in an embedded player, and manage personalized custom lists.

---

## Project Architecture

The MovieFy platform consists of two main client applications:
1. **Web:** Browser-based desktop and mobile web experience.
2. **Mobile:** Cross-platform mobile application developed for Android using React Native and Expo.

---

## 1. WEB APPLICATION

*(This section will be populated by the web development partner.)*

---

## 2. MOBILE APPLICATION

### Table of Contents
- Key Features
- Screenshots
- System Architecture
- Technologies & Libraries
- Project Directory Structure
- Performance & Optimization Metrics
- Installation & Setup
- APK Build & Testing

---

## Key Features

### Discover & Dynamic Filtering
- **Genre, Year, and Sorting:** Real-time filtering by genre, release year, and popularity/rating criteria via TMDB API integration.
- **Infinite Scroll:** Seamless content streaming using `onEndReached` pagination mechanism.

### Smart Search & Search History
- **Debounce & Network Control:** 400ms Debounce mechanism to prevent unnecessary API calls and `AbortController` support to cancel pending requests during fast typing.
- **Local Storage Integration:** Persisting recent searches using `AsyncStorage`, triggering queries directly from history, and managing individual/full history deletion.

### Trailer & Media Details
- **Embedded YouTube Player:** In-app modal video playback using `react-native-youtube-iframe`.
- **Cast & Similar Content:** Deep links to cast member details and recommendations for similar movies/series.
- **Season & Episode Management:** Season selector and detailed episode information for TV shows.

### Multi-List / Favorites Management
- **Flexible List Management:** Ability to create custom-named lists (e.g., "Watchlist", "Favorites", "Weekend") and dynamically manage content entries.
- **Custom Hook Architecture:** Shared global state synchronization via the `useMultiFavorites` custom hook.

---

## Screenshots

| Home Screen | Discover & Filter | Smart Search | Details & Trailer | Favorites / My Lists |
| :---: | :---: | :---: | :---: | :---: |
| <img src="assets/screenshots/home.jpeg" width="180"> | <img src="assets/screenshots/discover.jpeg" width="180"> | <img src="assets/screenshots/search.jpeg" width="180"> | <img src="assets/screenshots/detail.jpeg" width="180"> | <img src="assets/screenshots/favorites.jpeg" width="180"> |

---

## System Architecture

The project is structured according to modular software engineering principles using the **Custom Hook + Service Pattern** architecture:

[ UI Screens / Components ]
           │
           ▼
[ Custom Hooks (e.g. useMultiFavorites) ]
           │
           ├──► [ Storage Layer (AsyncStorage) ]
           │
           ▼
[ API Services Layer (axios + TMDB Endpoints) ]

---

## Technologies & Libraries

| Category | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | React Native (Expo SDK) | Cross-platform mobile application development |
| **Language** | JavaScript (ES6+) | Core application logic and UI components |
| **Navigation** | React Navigation (Stack & Bottom Tabs) | Screen routing and tab navigation |
| **HTTP Client**| Axios | TMDB REST API HTTP requests |
| **State & Storage**| AsyncStorage & React Hooks | Local persistence and reactive state management |
| **Image & Video**| expo-image & react-native-youtube-iframe | Caching images and embedding YouTube trailers |
| **UI & Icons** | expo-linear-gradient & @expo/vector-icons | Cinematic dark theme styling and icon sets |

---

## Project Directory Structure

staj_projesi/
└── mobile/
    ├── assets/                  # Logos, splash screen, and app assets
    │   └── screenshots/         # README screen captures
    │       ├── home.jpeg
    │       ├── discover.jpeg
    │       ├── search.jpeg
    │       ├── detail.jpeg
    │       └── favorites.jpeg
    ├── src/
    │   ├── api/                 # TMDB API client and service functions
    │   │   ├── config.js        # Base URL and API configuration
    │   │   └── services.js      # Fetching movies, series, search, and details
    │   ├── components/          # Reusable UI components
    │   │   ├── MovieCard.jsx    # Media card component
    │   │   ├── MovieSlider.jsx  # Horizontal media slider
    │   │   └── trailerModal.js  # In-app YouTube trailer player
    │   ├── hooks/               # Custom React hooks
    │   │   ├── useMovieData.js  # TMDB data fetching hook
    │   │   └── useMultiFavorites.js # Custom list management hook
    │   ├── navigation/          # React Navigation setup
    │   ├── screens/             # Application screen views
    │   │   ├── HomeScreen.js    # Featured content and landing screen
    │   │   ├── DiscoverScreen.js # Dynamic discovery and filtering screen
    │   │   ├── SearchScreen.js   # Live search and history management
    │   │   ├── DetailScreen.js   # Overview, cast, and trailer view
    │   │   ├── MyListScreen.js   # Custom list management view
    │   │   ├── ActorScreen.js    # Person details and filmography
    │   │   └── PlayerScreen.js   # Mock video playback screen
    │   └── utils/               # Storage utilities (historyStorage.js)
    ├── .env                     # Environment variables (API Key)
    ├── App.js                   # Application entry point
    ├── app.json                 # Expo project configuration
    ├── eas.json                 # EAS Build (APK) configuration
    ├── package.json             # Dependencies and scripts
    └── README.md                # Project documentation

---

## Performance & Optimization Metrics

FlatList performance optimizations were implemented to guarantee 60 FPS smooth scrolling, even on low-end hardware:

- **initialNumToRender={6}:** Minimizes initial render delay by rendering only elements visible on screen launch.
- **maxToRenderPerBatch={8}:** Limits the maximum number of items rendered per batch during scrolling.
- **windowSize={5}:** Reduces memory footprint by constraining off-screen rendered items.
- **removeClippedSubviews={Platform.OS === 'android'}:** Unmounts off-screen native views to optimize RAM usage.

### Perf Monitor (Expo Go) Benchmarks:
- **Average Frame Rate (FPS):** **58 - 60 FPS** during heavy scrolling.
- **Stress Test (Peak Load):** Minimum **49 FPS** under rapid fling scrolling.
- **Micro-Stutters:** Only **1 stutter recorded** throughout the testing cycle.

---

## Installation & Setup

### 1. Local Environment Setup
```bash
# Clone the repository
git clone <GITHUB_REPO_URL>
cd staj_projesi/mobile

# Install dependencies
npm install
