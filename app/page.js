import Sidebar from "./components/Sidebar/Sidebar";
import Map from "./components/Map/Map";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-black">
      {/* Sidebar - Left Side */}
      <Sidebar />

      {/* Map Component - Right Side (Main Content) */}
      <Map />
    </div>
  );
}
