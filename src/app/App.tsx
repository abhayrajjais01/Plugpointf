import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppProvider } from "./context/AppContext";


export default function App() {
  return (
    <AppProvider>
      <div className="relative translate-x-0 min-h-[100dvh] w-full max-w-lg mx-auto bg-background shadow-2xl overflow-hidden flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
        <RouterProvider router={router} />
      </div>
    </AppProvider>
  );
}
