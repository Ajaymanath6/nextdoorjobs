import Sidebar from "./components/Sidebar/Sidebar";
import Map from "./components/Map/Map";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-black">
      {/* Sidebar - Left Side (hidden on mobile) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar activeItem="jobs-near-you" />
      </div>

      {/* Map Component - Right Side (Main Content) */}
      <Map />
    </div>
  );
}
