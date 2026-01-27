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
import { execSync } from 'child_process'
import { SriManifestWebpackPlugin } from './plugins/sri-manifest-webpack-plugin.mjs'

let withRspack = null
if (process.env.USE_RSPACK === '1') {
  process.env.NEXT_RSPACK = 'true'
  // Disable rspack config validation to avoid warnings, use 'loose' to log errors.
  process.env.RSPACK_CONFIG_VALIDATE = 'loose-silent'
  delete process.env.TURBOPACK
  try {
    withRspack = (await import('next-rspack')).default
  } catch {}
}

const SERVICE_WORKERS_PATH = './src/service-workers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgPath = path.join(__dirname, 'package.json')
const data = await readFile(pkgPath, 'utf-8')
const pkg = JSON.parse(data)

let commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH
if (!commitHash) {
  try {
    commitHash = execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    commitHash = ''
  }
}

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

const isProd = process.env.NODE_ENV === 'production'
const enableExperimentalOptimizations = process.env.ENABLE_EXPERIMENTAL_OPTIMIZATIONS === '1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // static site export

  transpilePackages: ['@safe-global/store'],
  images: {
    unoptimized: true,
  },

  env: {
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_APP_HOMEPAGE: pkg.homepage,
  },

  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  eslint: {
    dirs: ['src', 'cypress'],
  },
  ...(isProd || enableExperimentalOptimizations
    ? {
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
      }
    : {}),
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

    // Add SRI manifest plugin (production only, skip for Cypress tests)
    if (!dev && process.env.NODE_ENV !== 'cypress') {
      config.plugins.push(new SriManifestWebpackPlugin())
    }

    return config
  },
}

const isRspack = process.env.USE_RSPACK === '1'
const enablePWA = process.env.ENABLE_PWA === '1'

const withMDX = isRspack
  ? createMDX({ extension: /\.(md|mdx)?$/, jsx: true, options: {} })
  : createMDX({
      extension: /\.(md|mdx)?$/,
      jsx: true,
      options: {
        remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'metadata' }], remarkHeadingId, remarkGfm],
        rehypePlugins: [],
      },
    })

const shouldEnablePWA = isProd || enablePWA
let config = shouldEnablePWA ? withPWA(withMDX(nextConfig)) : withMDX(nextConfig)
if (withRspack) config = withRspack(config)
export default withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(config)
