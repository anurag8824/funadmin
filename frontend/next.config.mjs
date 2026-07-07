/** @type {import('next').NextConfig} */

function getImageRemotePatterns() {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/";
  try {
    const parsed = new URL(backendUrl);
    return [
      {
        protocol: parsed.protocol.replace(":", ""),
        hostname: parsed.hostname,
        port: parsed.port || undefined,
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig = {
  reactStrictMode: false,
  devIndicators: {
    buildActivity: false,
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/",
    NEXT_PUBLIC_SECRET_KEY: process.env.NEXT_PUBLIC_SECRET_KEY || "",
    NEXT_PUBLIC_PROJECT_NAME:
      process.env.NEXT_PUBLIC_PROJECT_NAME || "FuntApp",
  },
  images: {
    remotePatterns: getImageRemotePatterns(),
    unoptimized: true,
  },
  webpack(config) {
    config.optimization.minimize = false;
    return config;
  },
};

export default nextConfig;
