// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from 'node:module'
import type { StorybookConfig } from '@storybook/nextjs'
import path from 'path'

const require = createRequire(import.meta.url)

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
  }),

  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      // Speeds up Storybook build time
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
      // Makes union prop types like variant and size appear as select controls
      shouldExtractLiteralValuesFromEnum: true,
      // Makes string and boolean types that can be undefined appear as inputs and switches
      shouldRemoveUndefinedFromOptional: true,
      // Filter out third-party props from node_modules except @mui packages
      propFilter: (prop) => (prop.parent ? !/node_modules\/(?!@mui)/.test(prop.parent.fileName) : true),
    },
  },
}
export default config
