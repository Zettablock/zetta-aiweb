const exportNextConfig = process.env.EXPORT ? { output: 'export' } : {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...exportNextConfig,
  reactStrictMode: true
}

module.exports = nextConfig
