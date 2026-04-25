import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/auth/github/callback",
        destination: `${apiBase}/auth/github/callback`,
      },
      {
        source: "/dashboard/auth/github/callback",
        destination: `${apiBase}/auth/github/callback`,
      },
    ];
  },
};

export default nextConfig;
