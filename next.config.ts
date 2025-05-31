import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    typedRoutes: false,
  },
  // Exclude supabase folder from Next.js compilation
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
  webpack: (config, { isServer }) => {
    // Ignore supabase functions during build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /supabase/,
    };
    return config;
  },
};

export default nextConfig;
