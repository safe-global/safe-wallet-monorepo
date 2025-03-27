import path from 'path'
import withBundleAnalyzer from '@next/bundle-analyzer'
import withPWAInit from '@ducanh2912/next-pwa'
import remarkGfm from 'remark-gfm'
import remarkHeadingId from 'remark-heading-id'
import createMDX from '@next/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'

const SERVICE_WORKERS_PATH = './src/service-workers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgPath = path.join(__dirname, 'package.json')
const data = await readFile(pkgPath, 'utf-8')
const pkg = JSON.parse(data)

const withPWA = withPWAInit({
  dest: 'public',
  workboxOptions: {
    mode: 'production',
  },
  reloadOnOnline: false,
  publicExcludes: [],
  buildExcludes: [/./],
  customWorkerSrc: SERVICE_WORKERS_PATH,
  // Prefer InjectManifest for Web Push
  swSrc: `${SERVICE_WORKERS_PATH}/index.ts`,

  runtimeCaching: [
    {
      urlPattern: /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|ttf|woff|woff2|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
  ],

  cacheId: pkg.version,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // static site export

  transpilePackages: ['@safe-global/store'],
  images: {
    unoptimized: true,
  },

  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  eslint: {
    dirs: ['src', 'cypress'],
  },
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lodash',
      'date-fns',
      '@sentry/react',
      '@gnosis.pm/zodiac',
    ],
  },
  webpack(config, { dev }) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: { and: [/\.(js|ts|md)x?$/] },
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            prettier: false,
            svgo: false,
            svgoConfig: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: { removeViewBox: false },
                  },
                },
              ],
            },
            titleProp: true,
          },
        },
      ],
    })

    config.resolve.alias = {
      ...config.resolve.alias,
      'bn.js': path.resolve('../../node_modules/bn.js/lib/bn.js'),
      'mainnet.json': path.resolve('../..node_modules/@ethereumjs/common/dist.browser/genesisStates/mainnet.json'),
      '@mui/material$': path.resolve('./src/components/common/Mui'),
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    }

    if (dev) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          customModule: {
            test: /[\\/]..[\\/]..[\\/]node_modules[\\/](@safe-global|ethers)[\\/]/,
            name: 'protocol-kit-ethers',
            chunks: 'all',
          },
        },
      }
      config.optimization.minimize = false
    }

    return config
  },
}
const withMDX = createMDX({
  extension: /\.(md|mdx)?$/,
  jsx: true,
  options: {
    remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'metadata' }], remarkHeadingId, remarkGfm],
    rehypePlugins: [],
  },
})

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(withPWA(withMDX(nextConfig)))
