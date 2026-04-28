import type { NextConfig } from "next";

const nextConfig = {
    // With strict mode, our game runs twice, which leads to problems because two games run async and the server cant differ between them
    reactStrictMode: false,
    // Make the little Next Logo from the bottom left only appear in development mode
    devIndicators: (process.env.NODE_ENV == "development"),
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', // Google's image server for profile pictures
            },
        ],
    },
};

export default nextConfig;
