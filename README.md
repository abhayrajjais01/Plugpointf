# Plugpointf — Peer-to-Peer EV Charger Sharing App

Plugpointf is a premium peer-to-peer platform that empowers EV owners to share private chargers and enables drivers to find, book, and navigate to real-world charging stations.

The project combines local P2P availability with real-world public charging data for a comprehensive, all-in-one charging solution.

## 🚀 Key Features

### 🗺️ Advanced Map Experience
- **Live Charger Pins** — Custom teardrop-style pins with high-visibility lightning bolt icons.
    - **Orange**: Available charging station.
    - **Grey**: Station currently unavailable.
    - **Green**: Your currently selected station.
- **Open Charge Map (OCM) Integration** — Automatically pulls real-world public charging data alongside community-listed P2P chargers.
- **Micro-Animations** — Smooth scaling and color transitions for map markers.

### 🛣️ Smart Trip Planner & Navigation
- **Route-Only Filtering** — When a destination is set, the map dynamically hides any charger that isn't on your path (5km search buffer).
- **Start Journey Mode** — One-tap navigation locks the map camera to your live GPS coordinates, providing a turn-by-turn tracking experience.
- **End Trip Support** — Easily cancel active tracking to return to open map exploration.

### 📅 Optimized Booking System
- **Real-Time Validation** — The booking calendar automatically hides past time slots for the current day.
- **Extended Hours** — Support for evening bookings up to 10:00 PM.
- **Visual Pricing** — Instant calculation of session costs, including service fees.

### 👤 User Features
- **List Your Charger** — Intuitive multi-step onboarding for hosts.
- **Bookings Dashboard** — Manage upcoming and past charging sessions.
- **Reviews & Ratings** — Transparent community feedback system.
- **Secure Auth** — Firebase-powered Email/Password and Google Social Login.

## 🛠️ Tech Stack

| Layer | Libraries |
|---|---|
| **Frontend** | React 18 + TypeScript, Vite |
| **Routing** | React Router 7 |
| **Styling** | Vanilla CSS (Rich Custom Components), Lucide Icons |
| **Mapping Engine** | MapLibre GL JS (Google Roadmap Layer Integration) |
| **Auth & Sync** | Firebase |
| **Database** | Supabase (PostgreSQL) |
| **Integrations** | Open Charge Map API, OSRM Routing Engine |

## 📁 Project Structure

```
src/
├── app/
│   ├── components/       # Feature-rich page components
│   │   ├── MapPage.tsx        # Advanced OCM & Translation Logic
│   │   ├── BookingModal.tsx   # Smart Time Validation logic
│   │   ├── ListChargerPage.tsx
│   │   └── ChargerDetailPage.tsx
│   ├── context/
│   │   └── AppContext.tsx # Global state & API Integration (OCM)
│   ├── data/
│   │   └── mock-data.ts   # Core interfaces and dev data
│   └── lib/
│       ├── db.ts          # Supabase client & logic
│       └── polyline.ts    # Custom encoder for route-based fetching
├── config/
│   └── firebase.ts        # Firebase initialization
└── hooks/
    └── useFirebaseAuth.ts # Custom Auth state management
```

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- An **Open Charge Map API Key** (Set as `VITE_OCM_API_KEY` in `.env`)

### Install & Run
```bash
# Install dependencies
npm i

# Start development server
npm run dev
```

## ⚖️ Implementation Notes
- **Polyline Encoding**: Driving routes are encoded on the fly to fetch chargers spanned across entire road trips via OCM's spatial query parameters.
- **Context Management**: Global state handles the seamless merging of community chargers with real-world public data.
