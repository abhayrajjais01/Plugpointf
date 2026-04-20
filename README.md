# PlugPoint — Premium Peer-to-Peer EV Charging Network

PlugPoint is a high-end, multi-modal charging platform that empowers EV owners to share private chargers and enables drivers to find, book, and navigate with precision. It seamlessly bridges the gap between community-hosted P2P chargers and real-world public charging infrastructure.

## 🚀 Key Features

### 📅 Advanced Multi-Modal Booking
- **By Amount** — Quick charging selection based on monetary input (e.g., ₹200). Automatically calculates precise charging time and energy units (kWh).
- **By Time** — Fractional duration picking (e.g., 2h 15m) for maximum flexibility.
- **Future Scheduling** — Advanced 7-day scheduler with high-precision **30-minute start-time granularity**.
- **Real-Time Overlap Engine** — Absolute mathematical Unix timestamp collision detection prevents double-booking at a per-minute scale.

### 💰 Comprehensive Wallet & Host Earnings
- **PlugPoint Wallet** — Native wallet for seamless, one-tap booking payments.
- **Razorpay Integration** — Secure top-ups and direct booking payments via UPI, Cards, and Netbanking.
- **Host Earnings Dashboard** — Real-time revenue tracking for charger owners.
    - **Platform Fees** — Automated 15% platform fee deduction tracking.
    - **One-Tap Cashout** — Instant settlement from earnings balance into the user's PlugPoint Wallet.

### 🗺️ Intelligent Map & EV Profile
- **"My EV" Sync** — Globally synchronized vehicle details. Set your EV make and model once; it updates on the Map and Profile instantly.
- **Context-Aware Markers** — Dynamic teardrop pins with status-aware coloring (Orange: Available, Grey: Occupied, Green: Selected).
- **Trip Planner** — Route-sensitive charger discovery that shows stations within a 5km buffer of your driving path.

### ⚡ Smart Charging UX
- **Start Session CTA** — Context-aware "Start Charging Session Now" button appears immediately after payment for sessions starting within 15 minutes.
- **Micro-Animations** — Smooth state transitions, loading skeletons, and interactive glassmorphism components.

## 🛠️ Tech Stack

| Layer | Libraries |
|---|---|
| **Frontend** | React 18 + TypeScript, Vite |
| **Routing** | React Router 7 |
| **Styling** | Vanilla CSS (Premium Glassmorphism), Lucide Icons |
| **Mapping Engine** | MapLibre GL JS + Google Roadmap Layer |
| **Auth** | Firebase Authentication |
| **Database** | Supabase (PostgreSQL) |
| **Payments** | Razorpay SDK |
| **Integrations** | Open Charge Map API, OSRM Routing Engine |

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── BookingModal.tsx   # Multi-modal logic & Overlap Engine
│   │   ├── MapPage.tsx        # Advanced OCM & Route Filtering
│   │   ├── HostEarningsPage.tsx # Revenue & Cashout Dashboard
│   │   ├── EvSetupModal.tsx   # Shared EV Profiling
│   │   └── ProfilePage.tsx    # Wallet Management
│   ├── context/
│   │   └── AppContext.tsx     # Global State (EV, Wallet, Trip)
│   └── lib/
│       └── db.ts              # Supabase Client & Shared Queries
```

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- **Environment Variables**:
  - `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`
  - `VITE_OCM_API_KEY`
  - `VITE_RAZORPAY_KEY_ID`

### Install & Run
```bash
# Install dependencies
npm i

# Start development server
npm run dev
```

## ⚖️ Implementation Notes
- **Overlap Prevention**: Shifted from index-based slot checking to absolute Unix timestamp comparison, enabling reliable support for fractional-hour and 30-minute interval bookings.
- **Dynamic Context**: The `AppProvider` handles real-time synchronization between the "My EV" setup and map-based filtering preferences.
