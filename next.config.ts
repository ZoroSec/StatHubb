import type { NextConfig } from "next";

// For GitHub Pages deployment, set the repo name as basePath.
// The GitHub Actions workflow sets GITHUB_REPO automatically.
// For local builds, set it manually: GITHUB_REPO=my-repo npm run build
const GITHUB_REPO = process.env.GITHUB_REPO || "";

const nextConfig: NextConfig = {
  // Static HTML export — required for GitHub Pages
  output: "export",

  // GitHub Pages serves from /repo-name/, so we need basePath + assetPrefix
  ...(GITHUB_REPO
    ? {
        basePath: `/${GITHUB_REPO}`,
        assetPrefix: `/${GITHUB_REPO}/`,
      }
    : {}),

  // Required for static export — no server-side image optimization
  images: {
    unoptimized: true,
  },

  // Hash-based routing works with trailing slash
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
