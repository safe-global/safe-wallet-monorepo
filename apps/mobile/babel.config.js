module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // https://github.com/DataDog/dd-sdk-reactnative/issues/1111
      ['@datadog/mobile-react-native-babel-plugin', { components: { useContent: false } }],
    ],
  }
}
