/**
 * --- WHAT IS AN INTERFACE? ---
 * In TypeScript, an "Interface" is like a blueprint or a contract.
 * It tells the computer exactly what fields a "User" object must have.
 * If you try to create a User without a 'name', the computer will give you an error!
 */
export interface User {
  id: string;        // A unique ID (like 'u1')
  name: string;      // The person's full name
  avatar: string;    // A URL link to their profile picture
  email: string;
  phone: string;
  joinedDate: string;
  chargersListed: number; // How many chargers they own
  totalBookings: number;  // How many times they have used the app to charge
  rating: number;         // Their average star rating (out of 5)
  verified: boolean;      // True if they have confirmed their identity
  walletBalance: number;  // User's available wallet funds
}

/**
 * This blueprint defines a "Charger" (could be a private home charger or a public station).
 */
export interface Charger {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerRating: number;
  title: string;       // The name of the station (e.g., "Koramangala Fast Charge")
  description: string; // A short paragraph about the charger
  image: string;       // A photo of the charging spot
  address: string;
  city: string;
  lat: number;         // GPS Latitude (North/South)
  lng: number;         // GPS Longitude (East/West)
  connectorType: string; // The plug type (e.g., CCS, Tesla, J1772)
  power: number;       // How fast it charges (in kilo-Watts)
  pricePerHour: number;
  pricePerKwh: number;
  available: boolean;
  availableHours: string;
  rating: number;
  reviewCount: number;
  amenities: string[];  // Extra features like "Cafe", "WiFi", or "CCTV"
  instructions: string; // Details on how to enter the parking or start the charger
  verified: boolean;
}

export interface Booking {
  id: string;
  chargerId: string;
  chargerTitle: string;
  chargerImage: string;
  chargerAddress: string;
  hostName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // hours
  totalCost: number;
  status: "upcoming" | "active" | "completed" | "cancelled";
  connectorType: string;
  power: number;
}

export interface Review {
  id: string;
  chargerId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export const currentUser: User = {
  id: "u1",
  name: "Arjun Mehta",
  avatar: "https://i.pravatar.cc/150?img=33",
  email: "arjun.mehta@email.com",
  phone: "+91 98765 43210",
  joinedDate: "March 2025",
  chargersListed: 2,
  totalBookings: 14,
  rating: 4.9,
  verified: true,
  walletBalance: 50000,
};

export const chargers: Charger[] = [
  {
    id: "c1",
    ownerId: "u2",
    ownerName: "Priya Sharma",
    ownerAvatar: "https://i.pravatar.cc/150?img=5",
    ownerRating: 4.8,
    title: "Koramangala Home Charger",
    description:
      "Level 2 charger in my garage, easily accessible from the main road. Covered parking spot with good lighting. Available most evenings and weekends.",
    image:
      "https://images.unsplash.com/photo-1765272088009-100c96a4cd4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb24lMjBtb2Rlcm58ZW58MXx8fHwxNzcxMzcwNTA2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    address: "4th Cross, 6th Block, Koramangala",
    city: "Bangalore, KA",
    lat: 12.9352,
    lng: 77.6245,
    connectorType: "J1772",
    power: 7.2,
    pricePerHour: 80,
    pricePerKwh: 12,
    available: true,
    availableHours: "6 PM - 8 AM weekdays, All day weekends",
    rating: 4.8,
    reviewCount: 23,
    amenities: ["Covered Parking", "Well Lit", "WiFi Nearby", "Pet Friendly"],
    instructions:
      "Enter from the 4th Cross side gate. Park on the left side. The charger is mounted on the wall. Green cable reaches most vehicles.",
    verified: true,
  },
  {
    id: "c2",
    ownerId: "u3",
    ownerName: "Rahul Verma",
    ownerAvatar: "https://i.pravatar.cc/150?img=12",
    ownerRating: 4.6,
    title: "Fast Charge Hub - Indiranagar",
    description:
      "High-power Level 2 charger perfect for a quick top-up. Located in a secure gated community with 24/7 camera surveillance.",
    image:
      "https://images.unsplash.com/photo-1762117360986-9753aef7680f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZ2FyYWdlJTIwZXYlMjBjaGFyZ2VyJTIwcmVzaWRlbnRpYWx8ZW58MXx8fHwxNzcxNDM5MjEwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    address: "12th Main, HAL 2nd Stage, Indiranagar",
    city: "Bangalore, KA",
    lat: 12.9784,
    lng: 77.6408,
    connectorType: "Tesla Wall Connector",
    power: 11.5,
    pricePerHour: 120,
    pricePerKwh: 15,
    available: true,
    availableHours: "24/7",
    rating: 4.6,
    reviewCount: 41,
    amenities: ["Gated Access", "Security Camera", "Covered Parking", "Restroom Nearby"],
    instructions:
      "Enter gate code #4523 (will be shared after booking). Parking spot B12. Charger is on the right wall.",
    verified: true,
  },
  {
    id: "c3",
    ownerId: "u4",
    ownerName: "Ananya Reddy",
    ownerAvatar: "https://i.pravatar.cc/150?img=23",
    ownerRating: 4.9,
    title: "Jayanagar Driveway Charger",
    description:
      "Convenient residential charger with easy street access. Perfect for overnight charging while you explore the neighbourhood.",
    image:
      "https://images.unsplash.com/photo-1631347826177-de288776ed3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMGNhciUyMGNoYXJnZXIlMjBwYXJraW5nJTIwbG90fGVufDF8fHx8MTc3MTQzOTIxMHww&ixlib=rb-4.1.0&q=80&w=1080",
    address: "32nd Cross, 4th Block, Jayanagar",
    city: "Bangalore, KA",
    lat: 12.9250,
    lng: 77.5838,
    connectorType: "CCS",
    power: 9.6,
    pricePerHour: 100,
    pricePerKwh: 14,
    available: true,
    availableHours: "8 AM - 10 PM daily",
    rating: 4.9,
    reviewCount: 17,
    amenities: ["Street Parking", "Well Lit", "Coffee Shop Nearby", "Parks Nearby"],
    instructions:
      "Park in the designated spot on the driveway. Charger cable is on the left side. Please text when you arrive.",
    verified: true,
  },
  {
    id: "c4",
    ownerId: "u5",
    ownerName: "Vikram Nair",
    ownerAvatar: "https://i.pravatar.cc/150?img=15",
    ownerRating: 4.7,
    title: "Whitefield Tech Park Charger",
    description:
      "Charger in my building's parking garage near ITPL. Great location if you want to charge while at work or visiting the tech park.",
    image:
      "https://images.unsplash.com/photo-1752830132482-def8649b6432?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldiUyMGNoYXJnaW5nJTIwc3RhdGlvbiUyMG91dGRvb3J8ZW58MXx8fHwxNzcxMzMxMDI1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    address: "ITPL Main Road, Whitefield",
    city: "Bangalore, KA",
    lat: 12.9698,
    lng: 77.7500,
    connectorType: "J1772",
    power: 7.2,
    pricePerHour: 90,
    pricePerKwh: 13,
    available: false,
    availableHours: "7 AM - 11 PM daily",
    rating: 4.7,
    reviewCount: 31,
    amenities: ["Underground Parking", "Security Camera", "Tech Park Access", "Restroom"],
    instructions:
      "Enter underground garage from ITPL Main Road entrance. Spot G-14. Swipe card will be shared after booking confirmation.",
    verified: true,
  },
  {
    id: "c5",
    ownerId: "u6",
    ownerName: "Deepa Iyer",
    ownerAvatar: "https://i.pravatar.cc/150?img=44",
    ownerRating: 4.5,
    title: "HSR Layout Quick Charge",
    description:
      "High-speed charger in my apartment building's basement. Central HSR location, close to restaurants and cafes.",
    image:
      "https://images.unsplash.com/photo-1765272088039-a6f6b9188199?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZHJpdmV3YXklMjBlbGVjdHJpYyUyMGNhciUyMGNoYXJnaW5nfGVufDF8fHx8MTc3MTQzOTIxMXww&ixlib=rb-4.1.0&q=80&w=1080",
    address: "27th Main, Sector 2, HSR Layout",
    city: "Bangalore, KA",
    lat: 12.9116,
    lng: 77.6389,
    connectorType: "Tesla Wall Connector",
    power: 11.5,
    pricePerHour: 130,
    pricePerKwh: 16,
    available: true,
    availableHours: "6 AM - 12 AM daily",
    rating: 4.5,
    reviewCount: 19,
    amenities: ["Garage Parking", "Elevator Access", "Security", "EV Friendly Building"],
    instructions:
      "Text me when you arrive. I'll meet you at the basement entrance and guide you to the spot.",
    verified: false,
  },
  {
    id: "c6",
    ownerId: "u7",
    ownerName: "Karthik Rao",
    ownerAvatar: "https://i.pravatar.cc/150?img=51",
    ownerRating: 4.8,
    title: "Malleshwaram Premium Charger",
    description:
      "Premium residential charger in a quiet heritage neighbourhood. Perfect for a peaceful charging experience with nearby temples and parks.",
    image:
      "https://images.unsplash.com/photo-1651688730796-151972ba8f87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjB0ZXNsYSUyMGNoYXJnaW5nfGVufDF8fHx8MTc3MTQzOTIxMXww&ixlib=rb-4.1.0&q=80&w=1080",
    address: "15th Cross, Malleshwaram",
    city: "Bangalore, KA",
    lat: 12.9965,
    lng: 77.5713,
    connectorType: "CCS",
    power: 9.6,
    pricePerHour: 150,
    pricePerKwh: 18,
    available: true,
    availableHours: "9 AM - 9 PM daily",
    rating: 4.8,
    reviewCount: 12,
    amenities: ["Private Driveway", "Scenic View", "Quiet Area", "Well Lit"],
    instructions:
      "Drive up to the house and park in the second spot. The charger is clearly marked with a green label.",
    verified: true,
  },
];

export const bookings: Booking[] = [
  {
    id: "b1",
    chargerId: "c1",
    chargerTitle: "Koramangala Home Charger",
    chargerImage: chargers[0].image,
    chargerAddress: "4th Cross, 6th Block, Koramangala, Bangalore",
    hostName: "Priya Sharma",
    date: "Feb 20, 2026",
    startTime: "7:00 PM",
    endTime: "10:00 PM",
    duration: 3,
    totalCost: 240,
    status: "upcoming",
    connectorType: "J1772",
    power: 7.2,
  },
  {
    id: "b2",
    chargerId: "c3",
    chargerTitle: "Jayanagar Driveway Charger",
    chargerImage: chargers[2].image,
    chargerAddress: "32nd Cross, 4th Block, Jayanagar, Bangalore",
    hostName: "Ananya Reddy",
    date: "Feb 18, 2026",
    startTime: "2:00 PM",
    endTime: "5:00 PM",
    duration: 3,
    totalCost: 300,
    status: "active",
    connectorType: "CCS",
    power: 9.6,
  },
  {
    id: "b3",
    chargerId: "c2",
    chargerTitle: "Fast Charge Hub - Indiranagar",
    chargerImage: chargers[1].image,
    chargerAddress: "12th Main, HAL 2nd Stage, Indiranagar, Bangalore",
    hostName: "Rahul Verma",
    date: "Feb 15, 2026",
    startTime: "10:00 AM",
    endTime: "1:00 PM",
    duration: 3,
    totalCost: 360,
    status: "completed",
    connectorType: "Tesla Wall Connector",
    power: 11.5,
  },
  {
    id: "b4",
    chargerId: "c4",
    chargerTitle: "Whitefield Tech Park Charger",
    chargerImage: chargers[3].image,
    chargerAddress: "ITPL Main Road, Whitefield, Bangalore",
    hostName: "Vikram Nair",
    date: "Feb 12, 2026",
    startTime: "4:00 PM",
    endTime: "7:00 PM",
    duration: 3,
    totalCost: 270,
    status: "completed",
    connectorType: "J1772",
    power: 7.2,
  },
  {
    id: "b5",
    chargerId: "c5",
    chargerTitle: "HSR Layout Quick Charge",
    chargerImage: chargers[4].image,
    chargerAddress: "27th Main, Sector 2, HSR Layout, Bangalore",
    hostName: "Deepa Iyer",
    date: "Feb 10, 2026",
    startTime: "9:00 AM",
    endTime: "11:00 AM",
    duration: 2,
    totalCost: 260,
    status: "cancelled",
    connectorType: "Tesla Wall Connector",
    power: 11.5,
  },
];

export const reviews: Review[] = [
  {
    id: "r1",
    chargerId: "c1",
    userId: "u8",
    userName: "Rohan Kulkarni",
    userAvatar: "https://i.pravatar.cc/150?img=8",
    rating: 5,
    comment:
      "Excellent charger! Priya was super friendly and the setup was easy. Covered parking is a huge plus. Will definitely book again.",
    date: "Feb 14, 2026",
    helpful: 8,
  },
  {
    id: "r2",
    chargerId: "c1",
    userId: "u9",
    userName: "Sneha Patel",
    userAvatar: "https://i.pravatar.cc/150?img=20",
    rating: 5,
    comment:
      "Great location and the charger worked perfectly. Left my car for 3 hours and came back to a full charge. Highly recommend!",
    date: "Feb 10, 2026",
    helpful: 5,
  },
  {
    id: "r3",
    chargerId: "c1",
    userId: "u10",
    userName: "Aditya Joshi",
    userAvatar: "https://i.pravatar.cc/150?img=60",
    rating: 4,
    comment:
      "Good charger, easy to find. The cable was a bit short for my car but we made it work. Nice neighbourhood.",
    date: "Feb 6, 2026",
    helpful: 3,
  },
  {
    id: "r4",
    chargerId: "c2",
    userId: "u11",
    userName: "Kavya Srinivas",
    userAvatar: "https://i.pravatar.cc/150?img=32",
    rating: 5,
    comment:
      "Fast charging speed and super secure location. The gated access made me feel safe leaving my car. Rahul is a great host!",
    date: "Feb 12, 2026",
    helpful: 12,
  },
  {
    id: "r5",
    chargerId: "c2",
    userId: "u12",
    userName: "Nikhil Hegde",
    userAvatar: "https://i.pravatar.cc/150?img=53",
    rating: 4,
    comment:
      "Solid charger with good power output. The gate code system works well. Would be 5 stars if there was a restroom closer.",
    date: "Feb 8, 2026",
    helpful: 4,
  },
  {
    id: "r6",
    chargerId: "c3",
    userId: "u13",
    userName: "Meera Gupta",
    userAvatar: "https://i.pravatar.cc/150?img=41",
    rating: 5,
    comment:
      "Ananya is the best host! She texted me detailed instructions and even recommended a nearby café. Perfect experience.",
    date: "Feb 11, 2026",
    helpful: 9,
  },
  {
    id: "r7",
    chargerId: "c4",
    userId: "u14",
    userName: "Suresh Baliga",
    userAvatar: "https://i.pravatar.cc/150?img=14",
    rating: 5,
    comment:
      "Amazing location right by ITPL. Charged my car while working at the tech park. Can't beat that!",
    date: "Feb 9, 2026",
    helpful: 7,
  },
  {
    id: "r8",
    chargerId: "c5",
    userId: "u15",
    userName: "Divya Krishnan",
    userAvatar: "https://i.pravatar.cc/150?img=26",
    rating: 4,
    comment:
      "Good central location in HSR. Deepa was helpful getting me into the basement. Charger speed was great.",
    date: "Feb 7, 2026",
    helpful: 2,
  },
];