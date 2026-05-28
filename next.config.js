const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["sharp", "satori"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "sharp"];
    }
    // Reduces "Cannot find module './NNN.js'" after HMR when the filesystem cache
    // points at chunks that were already replaced (common on Windows).
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aagrmr5pocteyhfg.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      { protocol: "https", hostname: "cloudflare-ipfs.com", pathname: "/ipfs/**" },
      { protocol: "https", hostname: "ipfs.io", pathname: "/ipfs/**" },
      { protocol: "https", hostname: "rcrcpvqtrrkrnyhmqilm.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  disableLogger: true,
});
