/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Suppress hydration warnings for Leaflet
  reactStrictMode: true,
  // Turbopack config (Next.js 16 uses Turbopack by default)
  turbopack: {},
};

export default nextConfig;
