/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
  output: 'standalone', // ✅ Required for AWS Amplify hosting
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: true, // ✅ Reduces unused CSS preloading
  },

  // ✅ Add required headers for WebContainer
  async headers() {
    return [
      {
        source: "/(.*)", // Apply to all routes
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
