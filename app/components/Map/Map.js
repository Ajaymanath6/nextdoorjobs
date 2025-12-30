export default function Map() {
  return (
    <div className="flex-1 h-screen bg-gray-50 dark:bg-gray-950 relative">
      {/* Map Container */}
      <div className="w-full h-full flex items-center justify-center">
        {/* Placeholder for map - map integration will be added later */}
        <div className="text-center space-y-4">
          <div className="text-6xl">🗺️</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Map View
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Map component will be displayed here
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Map integration coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

