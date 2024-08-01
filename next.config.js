const exportNextConfig = process.env.EXPORT ? { output: 'export', distDir: `out${process.env.NEXT_PUBLIC_BASEPATH}`  } : {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...exportNextConfig,
  basePath: process.env.NEXT_PUBLIC_BASEPATH,
  reactStrictMode: true,
  experimental: {
    serverActions: true
  }
}

module.exports = nextConfig
