const exportNextConfig = process.env.EXPORT ? { output: 'export', basePath: '/aiweb' } : {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...exportNextConfig,
  reactStrictMode: true
}

module.exports = nextConfig
