/** @type {import('next').NextConfig} */
const LANGGRAPH_BASE_URL = process.env.LANGGRAPH_BASE_URL || "http://localhost:2024";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/langgraph/:path*",
        destination: `${LANGGRAPH_BASE_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
