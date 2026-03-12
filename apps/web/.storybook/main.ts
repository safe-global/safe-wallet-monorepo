// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from 'node:module'
import type { StorybookConfig } from '@storybook/nextjs'
import path from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageJsonPath = path.join(__dirname, '../package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

process.env.NEXT_PUBLIC_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version
process.env.NEXT_PUBLIC_APP_HOMEPAGE = process.env.NEXT_PUBLIC_APP_HOMEPAGE || packageJson.homepage

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

  /**
   * In our monorepo setup, if we just specify the name,
   * we end up with the wrong path to webpack5 preset. We need to
   * resolve the path:
   *
   * https://github.com/storybookjs/storybook/issues/21216#issuecomment-2187481646
   */
  framework: {
    name: path.resolve(require.resolve('@storybook/nextjs/preset'), '..'),
    options: {
      image: {
        loading: 'eager',
      },
    },
  },

  webpackFinal: async (config) => {
    config.module = config.module || {}
    config.module.rules = config.module.rules || []
    config.resolve = config.resolve || {}
    config.resolve.alias = (config.resolve.alias || {}) as Record<string, string>

    // Mock useIsOfficialHost to always return true in Storybook
    // This ensures legal pages (terms, privacy, cookie) render their content
    ;(config.resolve.alias as Record<string, string>)['@/hooks/useIsOfficialHost'] = path.resolve(
      __dirname,
      'mocks/useIsOfficialHost.ts',
    )

    // Mock next/image to bypass the image loader stub that fails on static imports
    // This resolves the "unsupported file type: undefined" error when building Storybook
    ;(config.resolve.alias as Record<string, string>)['next/image'] = path.resolve(__dirname, 'mocks/nextImage.js')

    // Remove the next-image-loader-stub that causes "unsupported file type" errors
    // when processing static image imports in Storybook builds
    // Exclude SVGs so they're handled by SVGR instead
    config.module.rules = config.module.rules.map((rule) => {
      if (
        typeof rule === 'object' &&
        rule !== null &&
        'use' in rule &&
        Array.isArray(rule.use) &&
        rule.use.some(
          (u) =>
            typeof u === 'object' &&
            u !== null &&
            'loader' in u &&
            typeof u.loader === 'string' &&
            u.loader.includes('next-image-loader-stub'),
        )
      ) {
        // Replace the problematic loader with a simple asset loader
        // Exclude SVGs so they go through SVGR
        return {
          ...rule,
          exclude: /\.svg$/,
          type: 'asset/resource',
          use: undefined,
        }
      }
      return rule
    })

    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    }

    if (process.env.NODE_ENV !== 'production' && process.env.STORYBOOK_LAZY === 'true') {
      config.experiments = {
        ...config.experiments,
        lazyCompilation: {
          imports: true,
          entries: false,
        },
      }
    }

    // This modifies the existing image rule to exclude .svg files
    // since you want to handle those files with @svgr/webpack
    const imageRule = config.module.rules.find(
      (rule): rule is { test: RegExp; exclude?: RegExp } =>
        typeof rule === 'object' && rule !== null && 'test' in rule && rule.test instanceof RegExp,
    )
    if (imageRule && imageRule.test.test('.svg')) {
      imageRule.exclude = /\.svg$/
    }

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
    reactDocgen: 'react-docgen',
  },
}
export default config
