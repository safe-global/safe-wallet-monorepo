const path = require('path')

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDatadogExpoConfig } = require('@datadog/mobile-react-native/metro')
const { withStorybook } = require('@storybook/react-native/metro/withStorybook')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDatadogExpoConfig(__dirname)

// Override AppKit's Modal to use FullWindowOverlay on iOS so it renders above
// react-native-screens transparent modal presentations.
const appkitModalOverride = path.resolve(__dirname, 'src/features/WalletConnect/appkit-modal-override')

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'crypto') {
    // when importing crypto, resolve to react-native-quick-crypto
    return context.resolveRequest(context, 'react-native-quick-crypto', platform)
  }

  // Redirect AppKit's wui-modal to our custom implementation
  if (moduleName === './components/wui-modal' && context.originModulePath.includes('@reown/appkit-ui-react-native')) {
    return {
      filePath: appkitModalOverride + '.tsx',
      type: 'sourceFile',
    }
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
