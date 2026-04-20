# ⚡ PlugPoint

**The Ultimate Peer-to-Peer EV Charging Ecosystem**

PlugPoint is a premium, community-driven platform designed to solve the "charging anxiety" problem. It empowers EV owners to share their private chargers (Hosts) while enabling drivers to seamlessly find, book, pay for, and navigate to charging stations—including real-world public data.

---

## 🏗️ Core Pillars

### 1. 🗺️ Intelligent Discovery
*   **Hybrid Mapping**: Merges community-listed P2P chargers with real-world public data from the **Open Charge Map (OCM) API**.
*   **Route-Based Filtering**: Set a destination, and PlugPoint dynamically filters chargers within a 5km buffer of your driving path.
*   **Live Tracking**: A dedicated "Start Journey" mode that locks the map to your GPS coordinates for a real-time navigation experience.

### 2. 📅 Comprehensive Booking Engine
Beyond simple scheduling, PlugPoint offers a sophisticated multi-modal booking system:
*   **By Amount**: Enter a budget (e.g., ₹150) and let the app calculate exact charging time and energy units (kWh).
*   **By Time**: Select custom duration in 15-minute increments.
*   **Future Booking**: Schedule up to 7 days in advance with high-precision **30-minute start-time granularity**.
*   **Collision Prevention**: An absolute mathematical overlap engine checks Unix timestamps to prevent double-booking down to the minute.

### 3. 💰 Host Empowerment & Financials
*   **Earnings Dashboard**: Hosts get a professional breakdown of Gross vs. Net earnings (after a 15% platform fee).
*   **Cashout to Wallet**: One-tap transfer of host earnings directly into the in-app wallet.
*   **Dual-Tier Payments**: Native integration with **Razorpay** for direct payments and a custom **PlugPoint Wallet** for one-tap bookings.

### 4. 🚗 Personalized Experience
*   **My EV Profile**: Save your vehicle make/model (e.g., Tata Nexon EV) to personalize your dashboard and filter compatible chargers.
*   **User Profiles**: Track total bookings, earnings, and neighborhood reputation via a star-rating system.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript |
| **Styling** | **Tailwind CSS v4** (Modern utility-first architecture), Glassmorphism UI |
| **Database** | **Supabase** (PostgreSQL, Real-time status, Storage) |
| **Authentication** | **Firebase** (Email/Password, Google Social Login) |
| **Mapping** | MapLibre GL JS, Google Roadmap Tiles |
| **Financials** | Razorpay SDK, Custom Wallet Engine |
| **Icons & UI** | Lucide-React, Sonner (Toasts), Recharts (Earnings Charts) |

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── components/
│   │   ├── BookingModal.tsx      # The 3-tab precision booking engine
│   │   ├── MapPage.tsx           # Hybrid mapping & route-based logic
│   │   ├── HostEarningsPage.tsx  # Host financial dashboard & cashout
│   │   ├── EvSetupModal.tsx      # Vehicle profile management
│   │   ├── ManageChargersPage.tsx# Host charger control center
│   │   └── AuthPage.tsx          # Firebase authentication flows
│   ├── context/
│   │   └── AppContext.tsx        # Global ecosystem state (Wallet, EV, Map)
│   ├── data/
│   │   └── mock-data.ts          # Core TypeScript Interfaces
│   └── lib/
│       ├── db.ts                 # Supabase query layer & Financial logic
│       └── polyline.ts           # Route encoding for spatial queries
├── config/
│   ├── supabase.ts               # Supabase Client Init
│   └── firebase.ts               # Firebase Client Init
└── hooks/
    └── useFirebaseAuth.ts        # Custom Auth lifecycle hook
```

---

## 🏁 Getting Started

### 1. Prerequisites
*   Node.js (v18+)
*   Supabase Project
*   Firebase Project
*   Razorpay Key ID (for payments)

### 2. Environment Setup
Create a `.env` file based on `.env.example`:
```bash
VITE_FIREBASE_API_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_RAZORPAY_KEY_ID=...
VITE_OCM_API_KEY=...
```

### 3. Install & Run
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

---

## ⚙️ Core Logic Implementations

*   **Overlap Prevention**: Instead of array indexes, we use `startTime.getTime()` and `endTime.getTime()` boundaries to ensure non-conflicting reservations.
*   **Dynamic Unit Calculation**: Energy projection ($kWh = \text{Duration (h)} \times \text{Charger Power (kW)}$).
*   **Platform Fee Logic**: A hard-coded 15% platform commission is automatically deducted from host earnings calculations at the query layer.

---

Designed with ❤️ for the EV Community.
