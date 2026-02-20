/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', // Google profile pictures
            },
            {
                protocol: 'https',
                hostname: '*.amazonaws.com', // S3 resume previews
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/api/backend/:path*',
                destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
