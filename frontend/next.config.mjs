/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: {
    buildActivity: false,
  },
  images: {
    domains: [""], // Add the hostname here
  },
  future: {
    webpack5: true,
  },
  webpack(config) {
    config.optimization.minimize = false; // Temporarily disable CSS minification
    return config;
  },
};

export default nextConfig;
