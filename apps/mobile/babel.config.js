module.exports = function (api) {
  api.cache(true)
  return {
    // Enables the `unstable_transformImportMeta` option which is required for valtio to work correctly with Expo 53+
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [
      // https://github.com/DataDog/dd-sdk-reactnative/issues/1111
      ['@datadog/mobile-react-native-babel-plugin', { components: { useContent: false } }],
    ],
  }
}
