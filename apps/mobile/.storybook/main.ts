import type { StorybookConfig as WebStorybookConfig } from '@storybook/react-webpack5'
import type { StorybookConfig as RNStorybookConfig } from '@storybook/react-native'
import path from 'path'
import { fileURLToPath } from 'url'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import { globSync } from 'glob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let config: WebStorybookConfig | RNStorybookConfig
const isWeb = process.env.STORYBOOK_WEB

const appDirectory = path.resolve(__dirname, '../')

if (isWeb) {
  /**
   * We have some stories that require native modules, and they don't have
   * any equivalents in web. If we have such a story, we need to ignore it
   * otherwise webpack will fail to compile.
   *
   * https://github.com/storybookjs/storybook/issues/11181
   */
  const getStories = () => {
    return [
      ...globSync(`${appDirectory}/src/**/*.mdx)`),
      ...globSync(`${appDirectory}/src/**/*.stories.@(js|jsx|ts|tsx|mdx)`, {
        ignore: `${appDirectory}/src/**/*.native.stories.@(js|jsx|ts|tsx|mdx)`,
      }),
    ]
  }

  config = {
    stories: [...getStories()],
    addons: [
      {
        name: '@storybook/addon-react-native-web',
        options: {
          projectRoot: '../',
          modulesToTranspile: [],
        },
      },
    ],
    /**
     * Use standard framework configuration instead of path resolution.
     * The path resolution workaround causes issues in CI environments.
     */
    framework: {
      name: '@storybook/react-webpack5',
      options: {},
    },
    core: {
      disableTelemetry: true,
    },
    webpackFinal: async (config) => {
      if (config.resolve) {
        config.resolve.plugins = [
          ...(config.resolve.plugins || []),
          new TsconfigPathsPlugin({
            extensions: config.resolve.extensions,
          }),
        ]

        config.resolve.alias = {
          ...config.resolve.alias,
          '@': path.resolve(__dirname, '../'),
          // Mock React Native modules for web environment
          'react-native-worklets': path.resolve(__dirname, './mocks/react-native-worklets'),
          'react-native-reanimated': path.resolve(__dirname, './mocks/react-native-reanimated.js'),
          'react-native-quick-crypto': path.resolve(__dirname, './mocks/react-native-quick-crypto.js'),
          // Mock react-refresh to prevent production bundle errors
          'react-refresh/runtime': path.resolve(__dirname, './mocks/react-refresh.js'),
          'react-refresh': path.resolve(__dirname, './mocks/react-refresh.js'),
        }
      }

      return config
    },
  } as WebStorybookConfig
} else {
  config = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-ondevice-controls', '@storybook/addon-ondevice-actions'],
  } as RNStorybookConfig
}
export default config
