// based on https://github.com/expo/config-plugins/issues/123#issuecomment-1746757954

const { AndroidConfig, withAndroidManifest, createRunOncePlugin } = require('expo/config-plugins')

const queries = {
  package: [
    { $: { 'android:name': 'io.metamask' } },
    { $: { 'android:name': 'com.debank.rabbymobile' } },
    { $: { 'android:name': 'com.ledger.live' } },
    { $: { 'android:name': 'org.toshi' } },
    { $: { 'android:name': 'com.coinbase.android' } },
    { $: { 'android:name': 'com.okinc.okex.gp' } },
    { $: { 'android:name': 'com.wallet.crypto.trustapp' } },
    { $: { 'android:name': 'vip.mytokenpocket' } },
    { $: { 'android:name': 'app.phantom' } },
    { $: { 'android:name': 'me.rainbow' } },
    { $: { 'android:name': 'io.zerion.android' } },
    { $: { 'android:name': 'so.onekey.app.wallet' } },
    { $: { 'android:name': 'com.bitget.exchange' } },
    { $: { 'android:name': 'io.safepal.wallet' } },
    { $: { 'android:name': 'com.bybit.app' } },
  ],
}

/**
 * @param {import('@expo/config-plugins').ExportedConfig} config
 */
const withAndroidManifestService = (config) => {
  return withAndroidManifest(config, (config) => {
    config.modResults.manifest = {
      ...config.modResults.manifest,
      queries: [queries],
    }

    return config
  })
}

module.exports = createRunOncePlugin(withAndroidManifestService, 'withAndroidManifestService', '1.0.0')
