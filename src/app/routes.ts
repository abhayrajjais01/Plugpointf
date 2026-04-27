import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";

const HomePage = lazy(() => import("./components/HomePage").then((m) => ({ default: m.HomePage })));
const MapPage = lazy(() => import("./components/MapPage").then((m) => ({ default: m.MapPage })));
const ChargerDetailPage = lazy(() => import("./components/ChargerDetailPage").then((m) => ({ default: m.ChargerDetailPage })));
const BookingsPage = lazy(() => import("./components/BookingsPage").then((m) => ({ default: m.BookingsPage })));
const ListChargerPage = lazy(() => import("./components/ListChargerPage").then((m) => ({ default: m.ListChargerPage })));
const ProfilePage = lazy(() => import("./components/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const AuthPage = lazy(() => import("./components/AuthPage").then((m) => ({ default: m.AuthPage })));
const MessagesPage = lazy(() => import("./components/MessagesPage").then((m) => ({ default: m.MessagesPage })));
const ManageChargersPage = lazy(() => import("./components/ManageChargersPage").then((m) => ({ default: m.ManageChargersPage })));
const HostEarningsPage = lazy(() => import("./components/HostEarningsPage").then((m) => ({ default: m.HostEarningsPage })));

const routeFallback = React.createElement(
  "div",
  {
    className:
      "flex h-full min-h-[60vh] items-center justify-center bg-background text-sm font-semibold text-slate-400",
  },
  "Loading..."
);

function lazyRoute(Component: React.LazyExoticComponent<React.ComponentType>) {
  return function LazyRoute() {
    return React.createElement(
      Suspense,
      { fallback: routeFallback },
      React.createElement(Component)
    );
  };
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: lazyRoute(HomePage) },
      { path: "map", Component: lazyRoute(MapPage) },
      { path: "charger/:id", Component: lazyRoute(ChargerDetailPage) },
      { path: "bookings", Component: lazyRoute(BookingsPage) },
      { path: "list-charger", Component: lazyRoute(ListChargerPage) },
      { path: "profile", Component: lazyRoute(ProfilePage) },
      { path: "auth", Component: lazyRoute(AuthPage) },
      { path: "messages", Component: lazyRoute(MessagesPage) },
      { path: "manage-chargers", Component: lazyRoute(ManageChargersPage) },
      { path: "host-earnings", Component: lazyRoute(HostEarningsPage) },
    ],
  },
]);
