const path = require('path')

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDatadogExpoConfig } = require('@datadog/mobile-react-native/metro')
const { withStorybook } = require('@storybook/react-native/metro/withStorybook')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDatadogExpoConfig(__dirname)

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'crypto') {
    // when importing crypto, resolve to react-native-quick-crypto
    return context.resolveRequest(context, 'react-native-quick-crypto', platform)
  }

  return context.resolveRequest(context, moduleName, platform)
}

if (process.env.RN_SRC_EXT) {
  config.resolver.sourceExts = [...process.env.RN_SRC_EXT.split(','), ...config.resolver.sourceExts]
}

module.exports = withStorybook(config, {
  enabled: process.env.STORYBOOK_ENABLED === 'true',
  configPath: path.resolve(__dirname, './.storybook'),
})
