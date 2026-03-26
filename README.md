
# Plugpointf — Peer-to-Peer EV Charger Sharing App

Plugpointf is a peer-to-peer platform that lets EV owners share their private chargers and lets drivers find, book, and review nearby charging spots.

The original design is available at [Figma](https://www.figma.com/design/7PG9ga17wwwc9IiEBZ8m7k/Peer-to-Peer-EV-Charger-App).

## Features

- **Browse & Search** — Find chargers by location, connector type, price, and availability
- **Interactive Map** — View chargers on a Leaflet map with real-time availability markers
- **Book a Charger** — Select date, time, and duration with live pricing calculation
- **List Your Charger** — Multi-step form for hosts to add chargers, set pricing, and upload photos
- **Bookings Dashboard** — Track active and past bookings with status updates
- **Reviews & Ratings** — Rate and review chargers after each session
- **Authentication** — Email/password and Google OAuth via Firebase

## Tech Stack

| Layer | Libraries |
|---|---|
| Framework | React 18 + TypeScript, Vite |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4, Radix UI, Material UI, Lucide icons |
| Mapping | Leaflet |
| Auth & Backend | Firebase |
| Forms | React Hook Form |
| Charts | Recharts |
| Animations | Motion |
| Notifications | Sonner |

## Project Structure

```
src/
├── app/
│   ├── components/       # Page and feature components
│   │   ├── ui/           # Shared Radix/Shadcn UI primitives
│   │   ├── AuthPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── MapPage.tsx
│   │   ├── ChargerDetailPage.tsx
│   │   ├── ListChargerPage.tsx
│   │   ├── BookingsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── BookingModal.tsx
│   │   └── ReviewModal.tsx
│   ├── context/
│   │   └── AppContext.tsx # Global state (user, chargers, bookings, reviews)
│   ├── data/
│   │   └── mock-data.ts   # Sample data for development
│   └── routes.ts
├── config/
│   └── firebase.ts        # Firebase initialization
├── hooks/
│   └── useFirebaseAuth.ts # Auth hook
└── styles/
```

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- A `.env` file with Firebase credentials (already included in the project)

### Install & Run

```bash
# Install dependencies
npm i

# Start development server (http://localhost:5173)
npm run dev

# Production build
npm run build
```
