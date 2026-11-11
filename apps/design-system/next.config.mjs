import path from 'node:path'
import { createRequire } from 'node:module'
import { createMDX } from 'fumadocs-mdx/next'
import { normaliseBasePath } from './src/lib/base-path.mjs'

const require = createRequire(import.meta.url)
const uiDir = path.dirname(require.resolve('@safe-global/ui/package.json'))

const basePath = normaliseBasePath(process.env.NEXT_PUBLIC_BASE_PATH)
const assetPrefix = (process.env.NEXT_PUBLIC_ASSET_PREFIX ?? '').trim().replace(/\/+$/, '') || basePath

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: assetPrefix || undefined,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  transpilePackages: ['@safe-global/ui'],
  webpack(webpackConfig) {
    webpackConfig.resolve.alias['@ui-stories'] = path.join(uiDir, 'src/components/stories')
    return webpackConfig
  },
}

export default createMDX()(config)
