import type { NextConfig } from "next";

const nextConfig = {
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
