/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable caching in development to prevent cache issues
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.cache = false;
    }
    return config;
  },
}

module.exports = nextConfig

