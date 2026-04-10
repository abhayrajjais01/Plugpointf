# ⚡ PlugPoint — Peer-to-Peer EV Charger Sharing Platform

> Find, book, and navigate to EV charging stations — both community-listed P2P chargers and real-world public stations — all in one app.

PlugPoint is a premium peer-to-peer platform that empowers EV owners to share private chargers and enables drivers to discover, book, and navigate to charging stations nearby or along a planned route.

---

## 🚀 Key Features

### 🏠 Smart Home Page
- **Auto-Fetch Nearby Chargers** — On app launch, PlugPoint automatically detects the user's GPS location and fetches real-world public chargers from the Open Charge Map API — no need to visit the map first.
- **Distance-Based Sorting** — Chargers are sorted by proximity (nearest first) using the Haversine formula, so the closest stations always appear on top.
- **Advanced Filters** — Filter by connector type, power output, rating, price range, availability, and verified hosts.
- **Top Rated Carousel** — Horizontal scrollable showcase of the highest-rated stations.

### 🗺️ Advanced Map Experience
- **Live Charger Pins** — Custom teardrop-style pins with high-visibility lightning bolt icons:
  - 🟠 **Orange** — Available charging station
  - ⚪ **Grey** — Station currently unavailable
  - 🟢 **Green** — Currently selected station
- **Open Charge Map (OCM) Integration** — Automatically pulls real-world public charging data alongside community-listed P2P chargers.
- **Live GPS Tracking** — Real-time blue pulse marker showing the user's current location.
- **Micro-Animations** — Smooth scaling and color transitions for map markers.

### 🛣️ Smart Trip Planner & Navigation
- **Route Planning** — Enter origin and destination to calculate a driving route via OSRM.
- **Route-Only Filtering** — When a destination is set, the map dynamically hides any charger that isn't within 5km of the driving path.
- **Start Journey Mode** — One-tap navigation locks the map camera to live GPS coordinates for turn-by-turn tracking.
- **End Trip Support** — Cancel active tracking to return to open map exploration.

### 📅 Optimized Booking System
- **Real-Time Validation** — The booking calendar automatically hides past time slots for the current day.
- **Extended Hours** — Support for evening bookings up to 10:00 PM.
- **Visual Pricing** — Instant calculation of session cost including service fees and GST.
- **Booking Management** — View, track, and cancel bookings from a dedicated dashboard.

### 💬 Real-Time Chat System
- **Host Messaging** — Drivers can chat directly with charger hosts before or after booking.
- **Supabase Real-Time** — Messages sync instantly via Supabase's real-time subscriptions.
- **Conversation Threads** — Organized inbox with per-charger conversation threads.

### 👤 User & Host Features
- **List Your Charger** — Intuitive multi-step onboarding form with image upload for hosts.
- **Manage Chargers** — Hosts can view their listed stations, toggle availability, and delete chargers from their profile.
- **Reviews & Ratings** — Transparent community feedback system with star ratings and comments.
- **Profile Dashboard** — View stats, manage listings, and access account settings.
- **Secure Auth** — Firebase-powered Email/Password and Google Social Login.

---

## 🛠️ Tech Stack

| Layer              | Technology                                              |
| ------------------ | ------------------------------------------------------- |
| **Frontend**       | React 18 + TypeScript, Vite                             |
| **Routing**        | React Router 7                                          |
| **Styling**        | Tailwind CSS 4 + Vanilla CSS, Lucide Icons              |
| **UI Components**  | Radix UI Primitives, shadcn/ui patterns                 |
| **Mapping Engine** | MapLibre GL JS (Google Roadmap Tiles)                   |
| **Auth**           | Firebase Authentication (Email + Google OAuth)          |
| **Database**       | Supabase (PostgreSQL) with Real-Time subscriptions      |
| **Storage**        | Supabase Storage (Charger image uploads)                |
| **Integrations**   | Open Charge Map API, OSRM Routing Engine, Nominatim Geocoding |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── components/              # Feature-rich page components
│   │   ├── HomePage.tsx              # Smart home with distance sorting & auto-fetch
│   │   ├── MapPage.tsx               # Advanced map with OCM, trip planner, navigation
│   │   ├── ChargerDetailPage.tsx     # Detailed station view with booking & reviews
│   │   ├── BookingModal.tsx          # Smart time validation & pricing calculator
│   │   ├── BookingsPage.tsx          # User booking history & management
│   │   ├── ListChargerPage.tsx       # Multi-step charger listing form
│   │   ├── ManageChargersPage.tsx    # Host charger management dashboard
│   │   ├── ProfilePage.tsx           # User profile & settings
│   │   ├── MessagesPage.tsx          # Chat inbox & conversations
│   │   ├── ChatModal.tsx             # Real-time chat interface
│   │   ├── AuthPage.tsx              # Login / Signup with Firebase
│   │   ├── ReviewModal.tsx           # Submit ratings & reviews
│   │   ├── ChargerCard.tsx           # Reusable charger list card
│   │   ├── StarRating.tsx            # Star rating display component
│   │   ├── Layout.tsx                # App shell with bottom navigation
│   │   └── figma/                    # Design system utility components
│   ├── context/
│   │   └── AppContext.tsx        # Global state, OCM integration, geolocation
│   └── data/
│       └── mock-data.ts          # Core TypeScript interfaces & seed data
├── lib/
│   ├── db.ts                     # Supabase CRUD operations (chargers, bookings, reviews, profiles)
│   └── polyline.ts               # Custom polyline encoder for route-based charger search
├── config/
│   ├── firebase.ts               # Firebase initialization & config
│   └── supabase.ts               # Supabase client initialization
└── hooks/
    └── useFirebaseAuth.ts        # Custom hook for Firebase auth state management
```

---

## 🏁 Getting Started

### Prerequisites
- **Node.js** v18+
- **Open Charge Map API Key** → [Get one here](https://openchargemap.org/site/develop/api)

### Environment Variables

Create a `.env` file in the project root:

```env
# Open Charge Map
VITE_OCM_API_KEY=your_ocm_api_key

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## ⚙️ Implementation Notes

- **Auto-Fetch on Load** — The `AppContext` automatically requests the user's geolocation on app startup and fetches nearby public chargers via the OCM API, ensuring the home page is populated with real data immediately.
- **Distance Sorting** — The Haversine formula calculates real-world distances between the user and each charger, enabling accurate nearest-first ordering across both the home page and map.
- **Polyline Encoding** — Driving routes are encoded on-the-fly to fetch chargers spanning entire road trips via OCM's spatial query parameters.
- **Context Architecture** — A single `AppContext` manages seamless merging of community-hosted chargers with real-world public station data, deduplicating by ID prefix (`ocm-`).
- **Real-Time Chat** — Supabase real-time subscriptions power instant message delivery between drivers and hosts.

---

## 📄 License

This project is developed as part of an academic internship (OJT - Semester 2).
