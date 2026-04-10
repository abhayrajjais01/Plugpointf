import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./components/HomePage";
import { MapPage } from "./components/MapPage";
import { ChargerDetailPage } from "./components/ChargerDetailPage";
import { BookingsPage } from "./components/BookingsPage";
import { ListChargerPage } from "./components/ListChargerPage";
import { ProfilePage } from "./components/ProfilePage";
import { AuthPage } from "./components/AuthPage";
import { MessagesPage } from "./components/MessagesPage";
import { ManageChargersPage } from "./components/ManageChargersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "map", Component: MapPage },
      { path: "charger/:id", Component: ChargerDetailPage },
      { path: "bookings", Component: BookingsPage },
      { path: "list-charger", Component: ListChargerPage },
      { path: "profile", Component: ProfilePage },
      { path: "auth", Component: AuthPage },
      { path: "messages", Component: MessagesPage },
      { path: "manage-chargers", Component: ManageChargersPage },
    ],
  },
]);
