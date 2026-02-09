import type { StorybookConfig } from '@storybook/nextjs-vite'
import type { Plugin } from 'vite'
import path from 'path'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import svgr from 'vite-plugin-svgr'
import { transform } from '@svgr/core'
import { transformSync } from 'esbuild'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageJsonPath = path.join(__dirname, '../package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

process.env.NEXT_PUBLIC_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version
process.env.NEXT_PUBLIC_APP_HOMEPAGE = process.env.NEXT_PUBLIC_APP_HOMEPAGE || packageJson.homepage

// Static image extensions that should be handled as URL exports (for next/image compatibility)
const STATIC_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico']

// Custom plugin to handle ALL @/public imports AND already-resolved public paths
// SVGs are transformed to React components via SVGR
// Static images (PNG, JPG, etc.) are exported as objects compatible with next/image
// Handles: @/public/*, ./public/*, /public/*, and absolute paths to public dir
function publicAssetsPlugin(): Plugin {
  const publicDir = path.resolve(__dirname, '../public')

  // Check if a path points to the public directory and is an SVG
  function getPublicSvgPath(source: string): string | null {
    const cleanSource = source.replace(/\?.*$/, '')
    if (!cleanSource.endsWith('.svg')) {
      return null
    }

    let svgPath: string | null = null

    if (source.startsWith('@/public/')) {
      svgPath = path.join(publicDir, cleanSource.replace('@/public/', ''))
    } else if (source.includes('/public/') && !source.startsWith('/Users')) {
      const publicIndex = source.indexOf('/public/')
      const relativePath = source.slice(publicIndex + '/public/'.length).replace(/\?.*$/, '')
      svgPath = path.join(publicDir, relativePath)
    } else if (source.startsWith(publicDir)) {
      svgPath = cleanSource
    }

    if (svgPath && existsSync(svgPath)) {
      return svgPath
    }
    return null
  }

  // Check if a path is a static image from @/public
  function getPublicImageInfo(source: string): { fullPath: string; publicUrl: string } | null {
    const cleanSource = source.replace(/\?.*$/, '')
    const isStaticImage = STATIC_IMAGE_EXTENSIONS.some((ext) => cleanSource.endsWith(ext))
    if (!isStaticImage) {
      return null
    }

    if (source.startsWith('@/public/')) {
      const relativePath = cleanSource.replace('@/public/', '')
      const fullPath = path.join(publicDir, relativePath)
      if (existsSync(fullPath)) {
        return { fullPath, publicUrl: `/${relativePath}` }
      }
    }

    return null
  }

  return {
    name: 'public-assets-plugin',
    enforce: 'pre',

    async resolveId(source) {
      const svgPath = getPublicSvgPath(source)
      if (svgPath) {
        return `\0public-svg:${svgPath}`
      }

      // Handle static images from @/public - return virtual module
      const imageInfo = getPublicImageInfo(source)
      if (imageInfo) {
        return `\0public-image:${imageInfo.publicUrl}`
      }

      return null
    },

    async load(id) {
      if (id.startsWith('\0public-svg:')) {
        const svgPath = id.replace('\0public-svg:', '')
        const svgContent = readFileSync(svgPath, 'utf-8')

        // Transform SVG to React component using SVGR (outputs JSX)
        const jsxCode = await transform(svgContent, {
          plugins: ['@svgr/plugin-jsx'],
          exportType: 'default',
          svgo: false,
          titleProp: true,
        })

        // Transform JSX to plain JavaScript using esbuild
        const result = transformSync(jsxCode, {
          loader: 'jsx',
          format: 'esm',
          target: 'es2020',
        })

        return result.code
      }

      // Handle static images from @/public - export object compatible with next/image
      if (id.startsWith('\0public-image:')) {
        const publicUrl = id.replace('\0public-image:', '')
        // Export an object that next/image can use (src property is required)
        return `export default { src: "${publicUrl}", height: 1, width: 1, blurDataURL: "${publicUrl}" };`
      }

      return null
    },
  }
}

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@chromatic-com/storybook',
    '@storybook/addon-themes',
    '@storybook/addon-designs',
    '@storybook/addon-docs',
  ],

  core: {
    disableTelemetry: true,
  },

  framework: '@storybook/nextjs-vite',

  viteFinal: async (config) => {
    config.plugins = config.plugins || []

    // Add custom plugin to handle @/public/* imports (must be first)
    // This handles SVGs via SVGR and other assets via direct path resolution
    config.plugins.unshift(publicAssetsPlugin())

    // Add SVGR plugin for other SVG imports (src directory, etc.)
    config.plugins.unshift(
      svgr({
        svgrOptions: {
          exportType: 'default',
          svgo: false,
          titleProp: true,
        },
        include: /\.svg$/,
      }),
    )

    // Add resolve aliases to match webpack config
    // Note: @/public is NOT aliased here - it's handled by publicAssetsPlugin
    // which transforms SVGs via SVGR (aliases would bypass the plugin)
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Mock useIsOfficialHost to always return true in Storybook
      '@/hooks/useIsOfficialHost': path.resolve(__dirname, '../.storybook/mocks/useIsOfficialHost.ts'),
      // Mock next/image to bypass the image loader stub
      'next/image': path.resolve(__dirname, '../.storybook/mocks/nextImage.js'),
      // Polyfill Node.js querystring module for browser
      querystring: path.resolve(__dirname, '../.storybook/mocks/querystring.ts'),
    }

    // Allow Vite to serve files from project directories
    // Use strict: false because @storybook/nextjs-vite may override the allow list
    config.server = config.server || {}
    config.server.fs = {
      ...config.server.fs,
      strict: false, // Disable strict file system restrictions for monorepo
    }

    // Ensure proper resolution of monorepo packages
    config.resolve = config.resolve || {}
    config.resolve.dedupe = [
      ...(config.resolve.dedupe || []),
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
    ]

    return config
  },

  staticDirs: ['../public'],

  env: (config) => ({
    ...config,
    NEXT_PUBLIC_HUBSPOT_CONFIG: process.env.NEXT_PUBLIC_HUBSPOT_CONFIG ?? '',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version,
    NEXT_PUBLIC_APP_HOMEPAGE: process.env.NEXT_PUBLIC_APP_HOMEPAGE || packageJson.homepage,
    // Enable official host features (logo, branding) in Storybook
    NEXT_PUBLIC_IS_OFFICIAL_HOST: 'true',
  }),

  typescript: {
    // Disable react-docgen to avoid babel parsing errors with newer TypeScript syntax
    // This skips auto-generating prop documentation from source code
    reactDocgen: false,
  },
}

export default config
