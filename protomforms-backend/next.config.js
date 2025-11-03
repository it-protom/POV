/** @type {import('next').NextConfig} */
const nextConfig = {
  // API-only configuration
  experimental: {
    appDir: true,
  },
  // Disabilita il type checking durante la build (più veloce, già fatto in dev)
  typescript: {
    ignoreBuildErrors: true, // Permette il build anche con errori TypeScript
  },
  eslint: {
    ignoreDuringBuilds: true, // Permette il build anche con errori ESLint
  },
  // Enable CORS for frontend communication
  // Note: CORS is now handled by middleware.ts for better NextAuth support
  async headers() {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const allowedOrigins = [
      frontendUrl,
      "http://localhost:3000",
      "http://localhost:3001",
      "https://agoexplorer.protom.com",
    ].filter(Boolean);

    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: allowedOrigins[0] },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie" },
        ],
      },
    ];
  },
  // Disable static generation for API routes
  output: 'standalone',
  // Only build API routes
  generateBuildId: async () => {
    return 'backend-build'
  }
}

module.exports = nextConfig


