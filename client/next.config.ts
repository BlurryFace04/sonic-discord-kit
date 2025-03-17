import type { NextConfig } from "next";

const corsHeaders = [
  {
    key: "Access-Control-Allow-Origin",
    value: "*", // Allow all domains (consider restricting if needed)
  },
  {
    key: "Access-Control-Allow-Methods",
    value: "GET, POST, PUT, DELETE, OPTIONS",
  },
  {
    key: "Access-Control-Allow-Headers",
    value: "X-Requested-With, Content-Type, Authorization",
  },
];

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/.proxy/api/:path*",  // Ensure `.proxy` requests are redirected
        destination: "http://localhost:3001/api/:path*", 
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*", // Proxy API requests
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...corsHeaders],
      },
    ];
  },
};

export default nextConfig;
