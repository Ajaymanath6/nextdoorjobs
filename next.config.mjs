import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Suppress hydration warnings for Leaflet
  reactStrictMode: true,
  // Turbopack config (Next.js 16 uses Turbopack by default)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
