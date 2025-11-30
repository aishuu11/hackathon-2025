/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals = config.externals || {};
    config.externals['three'] = 'three';
    return config;
  },
}

module.exports = nextConfig
