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
  framework: path.resolve(require.resolve('@storybook/nextjs/preset'), '..'),

  webpackFinal: async (config) => {
    config.module = config.module || {}
    config.module.rules = config.module.rules || []

    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    }

    if (process.env.NODE_ENV !== 'production' && process.env.STORYBOOK_LAZY !== 'false') {
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
    const imageRule = config.module.rules.find((rule) => rule?.['test']?.test('.svg'))
    if (imageRule) {
      imageRule['exclude'] = /\.svg$/
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
  }),

  typescript: {
    reactDocgen: 'react-docgen',
  },
}
export default config
