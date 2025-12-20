/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  eslint: {
    dirs: ['src'],
  },
  transpilePackages: ['@safe-global/store', '@safe-global/theme', '@safe-global/shell-protocol'],
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_ACCOUNT_APP_URL: process.env.NEXT_PUBLIC_ACCOUNT_APP_URL || '/account-app',
  },
}

export default nextConfig
